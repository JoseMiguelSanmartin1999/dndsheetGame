import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CurrentUser, Roles } from '../../infrastructure/security/auth.decorators';
import type { AuthUser } from '../../infrastructure/security/auth.decorators';

interface UpdateUserBody {
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
  maxCharacters?: number;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas generales' })
  async stats() {
    const [users, suspended, characters, byClass, pendingRewrite] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.character.count({ where: { deletedAt: null } }),
      this.prisma.character.groupBy({ by: ['classId'], where: { deletedAt: null }, _count: true }),
      Promise.all([
        this.prisma.subclass.count({ where: { needsRewrite: true } }),
        this.prisma.background.count({ where: { needsRewrite: true } }),
        this.prisma.feat.count({ where: { needsRewrite: true } }),
        this.prisma.species.count({ where: { needsRewrite: true } }),
      ]),
    ]);
    const classes = await this.prisma.gameClass.findMany({ select: { id: true, name: true } });
    const name = new Map(classes.map((c) => [c.id, c.name]));
    return {
      users,
      suspended,
      characters,
      charactersByClass: byClass.map((g) => ({ class: name.get(g.classId), count: g._count })).sort((a, b) => b.count - a.count),
      contentPendingRewrite: {
        subclasses: pendingRewrite[0], backgrounds: pendingRewrite[1], feats: pendingRewrite[2], species: pendingRewrite[3],
      },
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Buscar usuarios' })
  @ApiQuery({ name: 'q', required: false, description: 'Correo o nombre de usuario' })
  async users(@Query('q') q?: string) {
    const rows = await this.prisma.user.findMany({
      where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }] } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, email: true, username: true, role: true, status: true, maxCharacters: true, createdAt: true,
        _count: { select: { characters: { where: { deletedAt: null } } } },
      },
    });
    return rows.map(({ _count, role, status, ...u }) => ({
      ...u,
      role: role === 'ADMIN' ? 'admin' : 'user',
      status: status === 'SUSPENDED' ? 'suspended' : 'active',
      characters: _count.characters,
    }));
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Cambiar rol, suspender o ampliar el límite de personajes' })
  async updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateUserBody, @CurrentUser() admin: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (id === admin.id && (body.role === 'user' || body.status === 'suspended')) {
      throw new BadRequestException('No puedes quitarte el rol de admin ni suspenderte a ti mismo.');
    }
    const data: { role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'SUSPENDED'; maxCharacters?: number } = {};
    if (body.role) {
      if (!['user', 'admin'].includes(body.role)) throw new BadRequestException('Rol inválido.');
      data.role = body.role === 'admin' ? 'ADMIN' : 'USER';
    }
    if (body.status) {
      if (!['active', 'suspended'].includes(body.status)) throw new BadRequestException('Estado inválido.');
      data.status = body.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE';
    }
    if (body.maxCharacters !== undefined) {
      const n = Number(body.maxCharacters);
      if (!Number.isInteger(n) || n < 0 || n > 50) throw new BadRequestException('El límite debe estar entre 0 y 50.');
      data.maxCharacters = n;
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.user.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          actorId: admin.id, action: 'update', entity: 'user', entityId: id,
          diff: { before: { role: user.role, status: user.status, maxCharacters: user.maxCharacters }, after: data },
        },
      });
      return row;
    });
    return {
      id: updated.id, email: updated.email, username: updated.username, maxCharacters: updated.maxCharacters,
      role: updated.role === 'ADMIN' ? 'admin' : 'user', status: updated.status === 'SUSPENDED' ? 'suspended' : 'active',
    };
  }

  @Get('audit')
  @ApiOperation({ summary: 'Últimos cambios hechos por administradores' })
  audit() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { username: true } } },
    });
  }
}
