import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../infrastructure/security/hash.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        usergroup: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    if (user.isActive !== 'Y') {
      throw new UnauthorizedException('Account is inactive. Please contact your administrator.');
    }

    if (user.isLocked === 'Y') {
      throw new UnauthorizedException('Account is locked. Please contact your administrator.');
    }

    const isMatch = await this.hashService.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      usergroupId: user.usergroupId,
      usergroupCode: user.usergroup?.usergroupCode,
    };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') || 'DEFAULT_ACCESS_SECRET_KEY';
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || 'DEFAULT_REFRESH_SECRET_KEY';
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') || '15m';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.userId },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      },
    );

    // Update active token in database
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { activeToken: accessToken },
    });

    // Fetch user permissions for authorized menus
    const permissions = user.usergroupId
      ? await this.prisma.userPermission.findMany({
          where: { usergroupId: user.usergroupId },
          include: { menu: true },
        })
      : [];

    return {
      message: 'Login successful',
      data: {
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: accessExpiresIn,
        },
        user: {
          userId: user.userId,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          needResetPassword: user.needResetPassword === 'Y',
          usergroup: user.usergroup
            ? {
                usergroupId: user.usergroup.usergroupId,
                usergroupCode: user.usergroup.usergroupCode,
                usergroupName: user.usergroup.usergroupName,
              }
            : null,
        },
        permissions: permissions.map((p) => ({
          menuId: p.menuId,
          menuName: p.menu.menuName,
          menuTitle: p.menu.menuTitle,
          menuUrl: p.menu.menuUrl,
          menuIcon: p.menu.menuIcon,
          permissions: {
            create: p.createPerm === 'Y',
            read: p.readPerm === 'Y',
            update: p.updatePerm === 'Y',
            delete: p.deletePerm === 'Y',
            export: p.exportPerm === 'Y',
            import: p.importPerm === 'Y',
          },
        })),
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || 'DEFAULT_REFRESH_SECRET_KEY';

    let decoded: any;
    try {
      decoded = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId: decoded.sub },
      include: { usergroup: true },
    });

    if (!user || user.isActive !== 'Y' || user.isLocked === 'Y') {
      throw new UnauthorizedException('User account is invalid or suspended');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      usergroupId: user.usergroupId,
      usergroupCode: user.usergroup?.usergroupCode,
    };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') || 'DEFAULT_ACCESS_SECRET_KEY';
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { activeToken: accessToken },
    });

    return {
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: accessExpiresIn,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        passwordHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.hashService.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    // Validate new password against dynamic policies
    await this.validatePasswordPolicy(dto.newPassword);

    // Prevent reuse of recent passwords
    for (const history of user.passwordHistories) {
      const isHistoryMatch = await this.hashService.compare(dto.newPassword, history.newPassword);
      if (isHistoryMatch) {
        throw new BadRequestException('New password cannot be one of your recent passwords');
      }
    }

    const newHashedPassword = await this.hashService.hash(dto.newPassword);

    // Update user password and record password history transactionally
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { userId },
        data: {
          password: newHashedPassword,
          needResetPassword: 'N',
          updatedBy: user.username,
        },
      }),
      this.prisma.passwordHistory.create({
        data: {
          userId,
          oldPassword: user.password,
          newPassword: newHashedPassword,
          objectCode: 'PASSWORD_HISTORY',
          createdBy: user.username,
        },
      }),
    ]);

    return {
      message: 'Password changed successfully',
      data: null,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        usergroup: {
          include: {
            permissions: {
              include: { menu: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, activeToken, ...safeUser } = user;
    return {
      message: 'User profile retrieved successfully',
      data: safeUser,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { userId },
      data: { activeToken: null },
    });

    return {
      message: 'Logout successful',
      data: null,
    };
  }

  private async validatePasswordPolicy(password: string): Promise<void> {
    const policies = await this.prisma.passwordPolicy.findMany();

    for (const policy of policies) {
      const val = parseInt(policy.value, 10);
      switch (policy.code) {
        case 'MIN_LENGTH':
          if (password.length < val) {
            throw new BadRequestException(
              policy.message || `Password must have at least ${val} characters`,
            );
          }
          break;
        case 'REQUIRE_UPPERCASE':
          if (val > 0 && !/[A-Z]/.test(password)) {
            throw new BadRequestException(
              policy.message || 'Password must contain at least one uppercase letter',
            );
          }
          break;
        case 'REQUIRE_LOWERCASE':
          if (val > 0 && !/[a-z]/.test(password)) {
            throw new BadRequestException(
              policy.message || 'Password must contain at least one lowercase letter',
            );
          }
          break;
        case 'REQUIRE_NUMBER':
          if (val > 0 && !/[0-9]/.test(password)) {
            throw new BadRequestException(
              policy.message || 'Password must contain at least one number',
            );
          }
          break;
        case 'REQUIRE_SPECIAL_CHAR':
          if (val > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new BadRequestException(
              policy.message || 'Password must contain at least one special character',
            );
          }
          break;
      }
    }
  }
}
