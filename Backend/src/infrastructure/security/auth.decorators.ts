import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../domain/models/user.model';

export const IS_PUBLIC_KEY = 'isPublic';
/** La ruta no necesita sesión (login, registro, contenido público). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** La ruta exige uno de estos roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Usuario de la sesión, puesto por AuthGuard. */
export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
