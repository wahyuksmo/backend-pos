import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BatchUpdatePermissionsDto } from './dto/update-permissions.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPermissionDto) {
    const {
      page = 1,
      limit = 10,
      usergroupId,
      menuId,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.UserPermissionWhereInput = {
      ...(usergroupId && { usergroupId }),
      ...(menuId && { menuId }),
    };

    const [total, permissions] = await Promise.all([
      this.prisma.userPermission.count({ where }),
      this.prisma.userPermission.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          usergroup: {
            select: {
              usergroupId: true,
              usergroupCode: true,
              usergroupName: true,
            },
          },
          menu: {
            select: {
              menuId: true,
              menuName: true,
              menuTitle: true,
              menuIcon: true,
              menuUrl: true,
              pid: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Permissions retrieved successfully',
      data: permissions,
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

  async findByUserGroup(usergroupId: string) {
    const usergroup = await this.prisma.userGroup.findUnique({
      where: { usergroupId },
    });

    if (!usergroup) {
      throw new NotFoundException(`Usergroup with ID "${usergroupId}" not found`);
    }

    const permissions = await this.prisma.userPermission.findMany({
      where: { usergroupId },
      include: {
        menu: {
          select: {
            menuId: true,
            menuName: true,
            menuTitle: true,
            menuIcon: true,
            menuUrl: true,
            pid: true,
          },
        },
      },
      orderBy: { menu: { menuPosition: 'asc' } },
    });

    return {
      message: `Permissions for ${usergroup.usergroupName} retrieved successfully`,
      data: permissions,
    };
  }

  async updateBatch(dto: BatchUpdatePermissionsDto, updatedBy?: string) {
    const usergroup = await this.prisma.userGroup.findUnique({
      where: { usergroupId: dto.usergroupId },
    });

    if (!usergroup) {
      throw new NotFoundException(`Usergroup with ID "${dto.usergroupId}" not found`);
    }

    if (usergroup.usergroupCode === 'SUPERADMIN') {
      throw new BadRequestException('SUPERADMIN permissions are immutable');
    }

    const results = await this.prisma.$transaction(
      dto.permissions.map((p) =>
        this.prisma.userPermission.upsert({
          where: {
            usergroupId_menuId: {
              usergroupId: dto.usergroupId,
              menuId: p.menuId,
            },
          },
          create: {
            usergroupId: dto.usergroupId,
            menuId: p.menuId,
            createPerm: p.createPerm,
            readPerm: p.readPerm,
            updatePerm: p.updatePerm,
            deletePerm: p.deletePerm,
            exportPerm: p.exportPerm,
            importPerm: p.importPerm,
            createdBy: updatedBy || 'SYSTEM',
            objectCode: 'USER_PERMISSION',
          },
          update: {
            createPerm: p.createPerm,
            readPerm: p.readPerm,
            updatePerm: p.updatePerm,
            deletePerm: p.deletePerm,
            exportPerm: p.exportPerm,
            importPerm: p.importPerm,
            updatedBy: updatedBy || 'SYSTEM',
          },
        }),
      ),
    );

    return {
      message: 'Permissions updated successfully',
      data: {
        usergroupId: dto.usergroupId,
        updatedCount: results.length,
      },
    };
  }
}
