import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Character } from '../../../domain/models/character.model';
import { ICharacterRepository } from '../../../domain/repositories/character.repository.interface';
import { ContentLookupService } from './content-lookup.service';
import { mapLegacyCharacter, toLegacyCharacter, type CharacterRow } from './legacy-character.mapper';

const CHARACTER_INCLUDE = {
  gameClass: { select: { name: true } },
  subclass: { select: { name: true, legacyNames: true } },
  species: { select: { name: true, legacyNames: true } },
  lineage: { select: { name: true } },
  background: { select: { name: true, legacyNames: true } },
  spells: { select: { spell: { select: { name: true } } } },
} as const;

/** Error que lanza el trigger de la BD al superar el límite de personajes. */
const isLimitError = (e: unknown) => String((e as Error)?.message ?? '').includes('CHARACTER_LIMIT_REACHED');

@Injectable()
export class PrismaCharacterRepository implements ICharacterRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly content: ContentLookupService,
  ) {}

  async create(character: Character): Promise<Character> {
    const { data, spellIds } = await this.map(character);
    try {
      const row = await this.prisma.character.create({
        data: { ...data, spells: { create: spellIds.map((spellId) => ({ spellId, prepared: true })) } },
        include: CHARACTER_INCLUDE,
      });
      return this.toDomain(row);
    } catch (e) {
      if (isLimitError(e)) throw new BadRequestException('Has alcanzado el máximo de personajes de tu cuenta.');
      throw e;
    }
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const rows = await this.prisma.character.findMany({
      where: { userId, deletedAt: null },
      include: CHARACTER_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Character | null> {
    const row = await this.prisma.character.findFirst({
      where: { id, deletedAt: null },
      include: CHARACTER_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async update(character: Character): Promise<Character> {
    const { data, spellIds } = await this.map(character);
    // No se puede cambiar de dueño, ni la fecha de creación ni el id de origen.
    const { userId, legacyId, createdAt, ...changes } = data;
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.characterSpell.deleteMany({ where: { characterId: character.id, origin: { in: ['class', 'legacy'] } } });
      return tx.character.update({
        where: { id: character.id },
        data: { ...changes, spells: { create: spellIds.map((spellId) => ({ spellId, prepared: true })) } },
        include: CHARACTER_INCLUDE,
      });
    });
    return this.toDomain(row);
  }

  /** Borrado suave: el personaje deja de contar para el límite y se puede recuperar. */
  async delete(id: string): Promise<boolean> {
    const res = await this.prisma.character.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    return res.count > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.character.count({ where: { userId, deletedAt: null } });
  }

  private async map(character: Character) {
    const lookup = await this.content.get();
    const mapped = mapLegacyCharacter(character, character.userId, lookup);
    if (!mapped.data.classId || !mapped.data.speciesId || !mapped.data.backgroundId) {
      throw new BadRequestException(mapped.problems.join('; '));
    }
    return mapped;
  }

  private toDomain(row: unknown): Character {
    return toLegacyCharacter(row as CharacterRow) as unknown as Character;
  }
}
