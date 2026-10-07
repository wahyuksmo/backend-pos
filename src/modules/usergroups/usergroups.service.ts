import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUserGroupDto } from './dto/create-usergroup.dto';
import { UpdateUserGroupDto } from './dto/update-usergroup.dto';
import { QueryUserGroupDto } from './dto/query-usergroup.dto';

@Injectable()
export class UsergroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserGroupDto, createdBy?: string) {
    const existing = await this.prisma.userGroup.findUnique({
      where: { usergroupCode: dto.usergroupCode },
    });

    if (existing) {
      throw new ConflictException(
        `Usergroup with code "${dto.usergroupCode}" already exists`,
      );
    }

    const usergroup = await this.prisma.userGroup.create({
      data: {
        usergroupCode: dto.usergroupCode.toUpperCase(),
        usergroupName: dto.usergroupName,
        createdBy: createdBy || 'SYSTEM',
        objectCode: 'USERGROUP',
      },
    });

    return {
      message: 'Usergroup created successfully',
      data: usergroup,
    };
  }

  async findAll(query: QueryUserGroupDto) {
    const {
      page = 1,
      limit = 10,
      search,
      usergroupCode,
      usergroupName,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.UserGroupWhereInput = {
      ...(usergroupCode && { usergroupCode: { contains: usergroupCode, mode: 'insensitive' } }),
      ...(usergroupName && { usergroupName: { contains: usergroupName, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { usergroupCode: { contains: search, mode: 'insensitive' } },
          { usergroupName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, usergroups] = await Promise.all([
      this.prisma.userGroup.count({ where }),
      this.prisma.userGroup.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              users: true,
              permissions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Usergroups retrieved successfully',
      data: usergroups,
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

  async findOne(usergroupId: string) {
    const usergroup = await this.prisma.userGroup.findUnique({
      where: { usergroupId },
      include: {
        users: {
          select: {
            userId: true,
            username: true,
            fullname: true,
            email: true,
            isActive: true,
          },
        },
        permissions: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!usergroup) {
      throw new NotFoundException(`Usergroup with ID "${usergroupId}" not found`);
    }

    return {
      message: 'Usergroup retrieved successfully',
      data: usergroup,
    };
  }

  async update(usergroupId: string, dto: UpdateUserGroupDto, updatedBy?: string) {
    const existing = await this.prisma.userGroup.findUnique({
      where: { usergroupId },
    });

    if (!existing) {
      throw new NotFoundException(`Usergroup with ID "${usergroupId}" not found`);
    }

    if (dto.usergroupCode && dto.usergroupCode !== existing.usergroupCode) {
      const codeTaken = await this.prisma.userGroup.findUnique({
        where: { usergroupCode: dto.usergroupCode },
      });
      if (codeTaken) {
        throw new ConflictException(
          `Usergroup code "${dto.usergroupCode}" is already in use`,
        );
      }
    }

    const updated = await this.prisma.userGroup.update({
      where: { usergroupId },
      data: {
        ...(dto.usergroupCode && { usergroupCode: dto.usergroupCode.toUpperCase() }),
        ...(dto.usergroupName && { usergroupName: dto.usergroupName }),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });

    return {
      message: 'Usergroup updated successfully',
      data: updated,
    };
  }

  async remove(usergroupId: string) {
    const existing = await this.prisma.userGroup.findUnique({
      where: { usergroupId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Usergroup with ID "${usergroupId}" not found`);
    }

    if (existing.usergroupCode === 'SUPERADMIN') {
      throw new BadRequestException('Cannot delete default SUPERADMIN usergroup');
    }

    if (existing._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete usergroup because ${existing._count.users} user(s) are assigned to it`,
      );
    }

    await this.prisma.userGroup.delete({
      where: { usergroupId },
    });

    return {
      message: 'Usergroup deleted successfully',
      data: null,
    };
  }
}
