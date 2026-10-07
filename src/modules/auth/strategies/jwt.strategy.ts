import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
  usergroupId: string;
  usergroupCode?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') || 'DEFAULT_ACCESS_SECRET_KEY_CHANGE_IN_PROD',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      include: {
        usergroup: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.isActive !== 'Y') {
      throw new UnauthorizedException('User account is inactive');
    }

    if (user.isLocked === 'Y') {
      throw new UnauthorizedException('User account is locked');
    }

    return {
      userId: user.userId,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      employeeNik: user.employeeNik,
      usergroupId: user.usergroupId,
      usergroupCode: user.usergroup?.usergroupCode,
      needResetPassword: user.needResetPassword,
    };
  }
}
