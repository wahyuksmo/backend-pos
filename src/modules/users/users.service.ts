import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../infrastructure/security/hash.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async create(dto: CreateUserDto, createdBy?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException(`Username "${dto.username}" is already taken`);
      }
      throw new ConflictException(`Email "${dto.email}" is already registered`);
    }

    if (dto.usergroupId) {
      const groupExists = await this.prisma.userGroup.findUnique({
        where: { usergroupId: dto.usergroupId },
      });
      if (!groupExists) {
        throw new BadRequestException(`Usergroup with ID "${dto.usergroupId}" does not exist`);
      }
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: dto.username,
          fullname: dto.fullname,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          usergroupId: dto.usergroupId,
          isActive: dto.isActive || 'Y',
          createdBy: createdBy || 'SYSTEM',
        },
        include: {
          usergroup: true,
        },
      });

      await tx.passwordHistory.create({
        data: {
          userId: created.userId,
          oldPassword: hashedPassword,
          newPassword: hashedPassword,
          objectCode: 'PASSWORD_HISTORY',
          createdBy: createdBy || 'SYSTEM',
        },
      });

      return created;
    });

    const { password, activeToken, ...result } = user;
    return {
      message: 'User created successfully',
      data: result,
    };
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, search, usergroupId, isActive, isLocked, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.UserWhereInput = {
      ...(usergroupId && { usergroupId }),
      ...(isActive && { isActive }),
      ...(isLocked && { isLocked }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { fullname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          userId: true,
          username: true,
          fullname: true,
          email: true,
          phone: true,
          isActive: true,
          isLocked: true,
          needResetPassword: true,
          passwordExp: true,
          objectCode: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          updatedBy: true,
          usergroup: {
            select: {
              usergroupId: true,
              usergroupCode: true,
              usergroupName: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Users retrieved successfully',
      data: users,
      meta: {
        total,
        page,
        limit: take,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        usergroup: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const { password, activeToken, ...result } = user;
    return {
      message: 'User retrieved successfully',
      data: result,
    };
  }

  async update(userId: string, dto: UpdateUserDto, updatedBy?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException(`Email "${dto.email}" is already in use`);
      }
    }

    if (dto.usergroupId) {
      const groupExists = await this.prisma.userGroup.findUnique({
        where: { usergroupId: dto.usergroupId },
      });
      if (!groupExists) {
        throw new BadRequestException(`Usergroup with ID "${dto.usergroupId}" does not exist`);
      }
    }

    let hashedPassword = undefined;
    if (dto.password) {
      hashedPassword = await this.hashService.hash(dto.password);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { userId },
        data: {
          fullname: dto.fullname,
          email: dto.email,
          phone: dto.phone,
          ...(hashedPassword && { password: hashedPassword }),
          usergroupId: dto.usergroupId,
          isActive: dto.isActive,
          isLocked: dto.isLocked,
          needResetPassword: dto.needResetPassword,
          updatedBy: updatedBy || 'SYSTEM',
        },
        include: {
          usergroup: true,
        },
      });

      if (hashedPassword) {
        await tx.passwordHistory.create({
          data: {
            userId,
            oldPassword: existing.password,
            newPassword: hashedPassword,
            objectCode: 'PASSWORD_HISTORY',
            createdBy: updatedBy || 'SYSTEM',
          },
        });
      }

      return user;
    });

    const { password, activeToken, ...result } = updated;
    return {
      message: 'User updated successfully',
      data: result,
    };
  }

  async remove(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    await this.prisma.user.delete({
      where: { userId },
    });

    return {
      message: 'User deleted successfully',
      data: null,
    };
  }

  async toggleLock(userId: string, updatedBy?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const newLockState = existing.isLocked === 'Y' ? 'N' : 'Y';
    const updated = await this.prisma.user.update({
      where: { userId },
      data: {
        isLocked: newLockState,
        updatedBy: updatedBy || 'SYSTEM',
      },
    });

    return {
      message: `User ${newLockState === 'Y' ? 'locked' : 'unlocked'} successfully`,
      data: { isLocked: updated.isLocked },
    };
  }
}
