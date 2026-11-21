import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Public } from '../../infrastructure/security/auth.decorators';

/**
 * Contenido de juego con los nombres y la estructura nuevos. Lo usará el
 * frontend cuando deje de tener las reglas escritas a mano.
 */
@ApiTags('Contenido')
@Public()
@Controller('content')
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('classes')
  @ApiOperation({ summary: 'Clases con sus rasgos por nivel y subclases' })
  classes() {
    return this.prisma.gameClass.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }] },
        subclasses: { where: { status: 'PUBLISHED' }, orderBy: { name: 'asc' } },
        options: { where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  @Get('species')
  @ApiOperation({ summary: 'Especies con sus linajes' })
  species() {
    return this.prisma.species.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
      include: { lineages: { orderBy: { name: 'asc' } } },
    });
  }

  @Get('backgrounds')
  @ApiOperation({ summary: 'Trasfondos con su dote de origen' })
  backgrounds() {
    return this.prisma.background.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
      include: { feat: true },
    });
  }

  @Get('feats')
  @ApiOperation({ summary: 'Dotes' })
  feats() {
    return this.prisma.feat.findMany({ where: { status: 'PUBLISHED' }, orderBy: { name: 'asc' } });
  }

  @Get('spells')
  @ApiOperation({ summary: 'Conjuros, filtrables por clase (slug), nivel y texto' })
  @ApiQuery({ name: 'class', required: false, example: 'wizard' })
  @ApiQuery({ name: 'level', required: false, example: 1 })
  @ApiQuery({ name: 'q', required: false })
  spells(@Query('class') classSlug?: string, @Query('level') level?: string, @Query('q') q?: string) {
    const lvl = level !== undefined && level !== '' ? Number(level) : undefined;
    return this.prisma.spell.findMany({
      where: {
        status: 'PUBLISHED',
        ...(Number.isInteger(lvl) ? { level: lvl } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(classSlug ? { lists: { some: { gameClass: { slug: classSlug } } } } : {}),
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      include: { lists: { select: { gameClass: { select: { slug: true, name: true } }, subclass: { select: { slug: true, name: true } } } } },
    });
  }
}
