import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, ROLES_KEY, type AuthUser } from './auth.decorators';
import type { UserRole } from '../../domain/models/user.model';
import { verifyJwt } from './jwt';

/**
 * Guard global: toda ruta exige un token válido salvo las marcadas con @Public().
 * Consulta la BD en cada petición para que suspender a un usuario o cambiarle el
 * rol tenga efecto inmediato, sin esperar a que caduque su token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest();
    const header: string = request.headers?.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = verifyJwt(token, process.env.JWT_SECRET ?? '');
    if (!payload) throw new UnauthorizedException('Tu sesión no es válida o ha caducado. Inicia sesión de nuevo.');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, status: true },
    });
    if (!user) throw new UnauthorizedException('La cuenta ya no existe.');
    if (user.status === 'SUSPENDED') throw new ForbiddenException('Tu cuenta está suspendida.');

    const authUser: AuthUser = { id: user.id, username: user.username, role: user.role === 'ADMIN' ? 'admin' : 'user' };
    request.user = authUser;

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(authUser.role)) {
      throw new ForbiddenException('No tienes permiso para esta acción.');
    }
    return true;
  }
}
