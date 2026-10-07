import { SetMetadata } from '@nestjs/common';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import';

export interface RequiredPermission {
  menuName: string;
  action: PermissionAction;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (menuName: string, action: PermissionAction) =>
  SetMetadata(PERMISSIONS_KEY, { menuName, action } as RequiredPermission);

export const RequirePermissions = (menuName: string, action: string) => {
  const normAction = (action.endsWith('Perm') ? action.slice(0, -4) : action) as PermissionAction;
  return SetMetadata(PERMISSIONS_KEY, { menuName, action: normAction } as RequiredPermission);
};

