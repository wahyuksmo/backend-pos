import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';

export interface MenuTreeNode {
  menuId: string;
  pid: string | null;
  menuName: string;
  menuTitle: string;
  menuIcon: string | null;
  menuUrl: string | null;
  menuPosition: number;
  permissions?: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
  };
  children: MenuTreeNode[];
}

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuDto, createdBy?: string) {
    const existing = await this.prisma.menu.findFirst({
      where: { menuName: dto.menuName },
    });

    if (existing) {
      throw new ConflictException(`Menu with name "${dto.menuName}" already exists`);
    }

    if (dto.pid) {
      const parent = await this.prisma.menu.findUnique({
        where: { menuId: dto.pid },
      });
      if (!parent) {
        throw new BadRequestException(`Parent menu with ID "${dto.pid}" does not exist`);
      }
    }

    const menu = await this.prisma.menu.create({
      data: {
        pid: dto.pid || null,
        menuName: dto.menuName.toUpperCase(),
        menuTitle: dto.menuTitle,
        menuIcon: dto.menuIcon,
        menuUrl: dto.menuUrl,
        menuPosition: dto.menuPosition ?? 0,
        createdBy: createdBy || 'SYSTEM',
        objectCode: 'MENU',
      },
    });

    // Auto-grant SUPERADMIN full permissions on newly created menu
    const superAdmin = await this.prisma.userGroup.findUnique({
      where: { usergroupCode: 'SUPERADMIN' },
    });

    if (superAdmin) {
      await this.prisma.userPermission.upsert({
        where: {
          usergroupId_menuId: {
            usergroupId: superAdmin.usergroupId,
            menuId: menu.menuId,
          },
        },
        create: {
          usergroupId: superAdmin.usergroupId,
          menuId: menu.menuId,
          createPerm: 'Y',
          readPerm: 'Y',
          updatePerm: 'Y',
          deletePerm: 'Y',
          exportPerm: 'Y',
          importPerm: 'Y',
          createdBy: createdBy || 'SYSTEM',
        },
        update: {
          createPerm: 'Y',
          readPerm: 'Y',
          updatePerm: 'Y',
          deletePerm: 'Y',
          exportPerm: 'Y',
          importPerm: 'Y',
        },
      });
    }

    return {
      message: 'Menu created successfully',
      data: menu,
    };
  }

  async findAll(query: QueryMenuDto) {
    const {
      page = 1,
      limit = 10,
      search,
      pid,
      menuName,
      menuTitle,
      sortBy = 'menuPosition',
      sortOrder = 'asc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.MenuWhereInput = {
      ...(pid !== undefined && { pid: pid || null }),
      ...(menuName && { menuName: { contains: menuName, mode: 'insensitive' } }),
      ...(menuTitle && { menuTitle: { contains: menuTitle, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { menuName: { contains: search, mode: 'insensitive' } },
          { menuTitle: { contains: search, mode: 'insensitive' } },
          { menuUrl: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy =
      sortBy === 'menuPosition'
        ? [{ menuPosition: sortOrder }, { createdAt: 'asc' as const }]
        : { [sortBy]: sortOrder };

    const [total, menus] = await Promise.all([
      this.prisma.menu.count({ where }),
      this.prisma.menu.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          parent: {
            select: {
              menuId: true,
              menuName: true,
              menuTitle: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Menus retrieved successfully',
      data: menus,
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

  async getTree() {
    const allMenus = await this.prisma.menu.findMany({
      orderBy: [{ menuPosition: 'asc' }, { createdAt: 'asc' }],
    });

    const tree = this.buildMenuTree(allMenus);

    return {
      message: 'Menu hierarchy retrieved successfully',
      data: tree,
    };
  }

  async getUserMenuTree(usergroupId: string, isSuperAdmin: boolean = false) {
    const allMenus = await this.prisma.menu.findMany({
      orderBy: [{ menuPosition: 'asc' }, { createdAt: 'asc' }],
    });

    const permissions = await this.prisma.userPermission.findMany({
      where: { usergroupId },
    });

    const permMap = new Map(permissions.map((p) => [p.menuId, p]));

    const filteredMenus: Array<any> = [];

    for (const menu of allMenus) {
      const perm = permMap.get(menu.menuId);
      // If superadmin or has read permission
      if (isSuperAdmin || (perm && perm.readPerm === 'Y')) {
        filteredMenus.push({
          ...menu,
          permissions: isSuperAdmin
            ? {
                create: true,
                read: true,
                update: true,
                delete: true,
                export: true,
                import: true,
              }
            : perm
              ? {
                  create: perm.createPerm === 'Y',
                  read: perm.readPerm === 'Y',
                  update: perm.updatePerm === 'Y',
                  delete: perm.deletePerm === 'Y',
                  export: perm.exportPerm === 'Y',
                  import: perm.importPerm === 'Y',
                }
              : null,
        });
      }
    }

    const tree = this.buildMenuTree(filteredMenus);

    return {
      message: 'User menu navigation retrieved successfully',
      data: tree,
    };
  }

  async findOne(menuId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { menuId },
      include: {
        children: {
          orderBy: { menuPosition: 'asc' },
        },
        parent: true,
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID "${menuId}" not found`);
    }

    return {
      message: 'Menu retrieved successfully',
      data: menu,
    };
  }

  async update(menuId: string, dto: UpdateMenuDto, updatedBy?: string) {
    const existing = await this.prisma.menu.findUnique({
      where: { menuId },
    });

    if (!existing) {
      throw new NotFoundException(`Menu with ID "${menuId}" not found`);
    }

    if (dto.menuName && dto.menuName !== existing.menuName) {
      const nameTaken = await this.prisma.menu.findFirst({
        where: { menuName: dto.menuName },
      });
      if (nameTaken) {
        throw new ConflictException(`Menu with name "${dto.menuName}" already exists`);
      }
    }

    if (dto.pid && dto.pid === menuId) {
      throw new BadRequestException('Menu cannot be its own parent');
    }

    const updated = await this.prisma.menu.update({
      where: { menuId },
      data: {
        ...(dto.pid !== undefined && { pid: dto.pid }),
        ...(dto.menuName && { menuName: dto.menuName.toUpperCase() }),
        ...(dto.menuTitle && { menuTitle: dto.menuTitle }),
        ...(dto.menuIcon !== undefined && { menuIcon: dto.menuIcon }),
        ...(dto.menuUrl !== undefined && { menuUrl: dto.menuUrl }),
        ...(dto.menuPosition !== undefined && { menuPosition: dto.menuPosition }),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });

    return {
      message: 'Menu updated successfully',
      data: updated,
    };
  }

  async remove(menuId: string) {
    const existing = await this.prisma.menu.findUnique({
      where: { menuId },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Menu with ID "${menuId}" not found`);
    }

    if (existing._count.children > 0) {
      throw new BadRequestException(
        `Cannot delete menu because it has ${existing._count.children} sub-menu(s)`,
      );
    }

    await this.prisma.menu.delete({
      where: { menuId },
    });

    return {
      message: 'Menu deleted successfully',
      data: null,
    };
  }

  private buildMenuTree(items: any[], parentId: string | null = null): MenuTreeNode[] {
    return items
      .filter((item) => (parentId === null ? !item.pid : item.pid === parentId))
      .map((item) => ({
        menuId: item.menuId,
        pid: item.pid,
        menuName: item.menuName,
        menuTitle: item.menuTitle,
        menuIcon: item.menuIcon,
        menuUrl: item.menuUrl,
        menuPosition: item.menuPosition,
        permissions: item.permissions,
        children: this.buildMenuTree(items, item.menuId),
      }));
  }
}
