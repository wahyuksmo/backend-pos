import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.usergroupId) {
      throw new ForbiddenException('Access denied: User group not assigned');
    }

    // Super Admin bypass
    if (user.usergroupCode === 'SUPERADMIN') {
      return true;
    }

    const { menuName, action } = requiredPermission;

    const candidates = [
      menuName,
      menuName + 'S',
      menuName.endsWith('S') ? menuName.slice(0, -1) : menuName,
      menuName.endsWith('Y') ? menuName.slice(0, -1) + 'IES' : menuName,
      menuName.replace(/_/g, ''),
    ];

    // Find the menu by exact match or with/without trailing S or singular/plural variants
    const menu = await this.prisma.menu.findFirst({
      where: {
        menuName: { in: candidates },
      },
    });

    if (!menu) {
      throw new ForbiddenException(`Access denied: Menu "${menuName}" does not exist`);
    }

    // Find permission for this usergroup and menu
    const perm = await this.prisma.userPermission.findUnique({
      where: {
        usergroupId_menuId: {
          usergroupId: user.usergroupId,
          menuId: menu.menuId,
        },
      },
    });

    if (!perm) {
      throw new ForbiddenException(
        `Access denied: No permissions configured for menu "${menuName}"`,
      );
    }

    const actionFieldMap: Record<string, keyof typeof perm> = {
      create: 'createPerm',
      read: 'readPerm',
      update: 'updatePerm',
      delete: 'deletePerm',
      export: 'exportPerm',
      import: 'importPerm',
    };

    const permField = actionFieldMap[action];
    if (!permField || perm[permField] !== 'Y') {
      throw new ForbiddenException(
        `Access denied: Insufficient permission to perform "${action}" on menu "${menuName}"`,
      );
    }

    return true;
  }
}

export { PermissionGuard as PermissionsGuard };
