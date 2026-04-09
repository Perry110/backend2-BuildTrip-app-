import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Gắn trên handler/class — kết hợp RolesGuard. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
