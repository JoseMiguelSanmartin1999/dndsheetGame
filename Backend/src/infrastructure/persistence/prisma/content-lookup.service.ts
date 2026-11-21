import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ContentLookup } from './legacy-character.mapper';

/**
 * Índice en memoria del contenido (ids y nombres) para traducir los nombres que
 * envía el frontend. El contenido cambia poco: se recarga cada minuto o cuando
 * el admin edita algo (invalidate()).
 */
@Injectable()
export class ContentLookupService {
  private cache: { value: ContentLookup; at: number } | null = null;
  private static readonly TTL_MS = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  invalidate() {
    this.cache = null;
  }

  async get(): Promise<ContentLookup> {
    if (this.cache && Date.now() - this.cache.at < ContentLookupService.TTL_MS) return this.cache.value;
    const [classes, subclasses, species, lineages, backgrounds, spells] = await Promise.all([
      this.prisma.gameClass.findMany({ select: { id: true, slug: true, name: true } }),
      this.prisma.subclass.findMany({ select: { id: true, slug: true, name: true, legacyNames: true, classId: true } }),
      this.prisma.species.findMany({ select: { id: true, slug: true, name: true, legacyNames: true } }),
      this.prisma.speciesLineage.findMany({ select: { id: true, slug: true, name: true, speciesId: true } }),
      this.prisma.background.findMany({ select: { id: true, slug: true, name: true, legacyNames: true } }),
      this.prisma.spell.findMany({ select: { id: true, slug: true, name: true } }),
    ]);
    const value = { classes, subclasses, species, lineages, backgrounds, spells };
    this.cache = { value, at: Date.now() };
    return value;
  }
}
