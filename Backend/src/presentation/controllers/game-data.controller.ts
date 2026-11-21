import { Controller, Get, Put, Body, Param, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Public, Roles, CurrentUser } from '../../infrastructure/security/auth.decorators';
import type { AuthUser } from '../../infrastructure/security/auth.decorators';
import { ContentLookupService } from '../../infrastructure/persistence/prisma/content-lookup.service';
import {
  toLegacyBackground,
  toLegacyClass,
  toLegacySpecies,
} from '../../infrastructure/persistence/prisma/legacy-content.mapper';

/**
 * Endpoints que usa el frontend actual. Devuelven la forma y los nombres de
 * antes de la migración. Los datos nuevos (con nombres nuevos) están en /content.
 */
@ApiTags('Game Data (compatibilidad)')
@Controller('game-data')
export class GameDataController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookup: ContentLookupService,
  ) {}

  @Public()
  @Get('classes')
  @ApiOperation({ summary: 'Clases (forma antigua)' })
  async getClasses() {
    const rows = await this.prisma.gameClass.findMany({ where: { status: 'PUBLISHED' } });
    return rows.map(toLegacyClass).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  @Public()
  @Get('backgrounds')
  @ApiOperation({ summary: 'Trasfondos (forma antigua)' })
  async getBackgrounds() {
    const rows = await this.prisma.background.findMany({
      where: { status: 'PUBLISHED' },
      include: { feat: { select: { name: true, legacyNames: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toLegacyBackground).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  @Public()
  @Get('origins')
  @ApiOperation({ summary: 'Especies (forma antigua, antes "orígenes")' })
  async getOrigins() {
    return this.getSpecies();
  }

  @Public()
  @Get('races')
  @ApiOperation({ summary: 'Especies (forma antigua, antes "razas")' })
  async getRaces() {
    return this.getSpecies();
  }

  @Put('races/:id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar los textos de una especie (solo admin)' })
  async updateRace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: string; description?: string; icon?: string; image?: string },
    @CurrentUser() admin: AuthUser,
  ) {
    const before = await this.prisma.species.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Especie no encontrada.');
    const data: Record<string, string> = {};
    for (const k of ['name', 'description', 'icon', 'image'] as const) if (typeof body?.[k] === 'string') data[k] = body[k]!;
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.species.update({ where: { id }, data: { ...data, version: { increment: 1 } } });
      await tx.auditLog.create({
        data: { actorId: admin.id, action: 'update', entity: 'species', entityId: id, diff: { before: Object.fromEntries(Object.keys(data).map((k) => [k, (before as any)[k]])), after: data } },
      });
      return row;
    });
    this.lookup.invalidate();
    return toLegacySpecies(updated);
  }

  private async getSpecies() {
    const rows = await this.prisma.species.findMany({ where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } });
    return rows.map(toLegacySpecies).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
