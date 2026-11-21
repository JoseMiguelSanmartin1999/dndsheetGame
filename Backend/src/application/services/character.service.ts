import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Character } from '../../domain/models/character.model';
import type { ICharacterRepository } from '../../domain/repositories/character.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { AuthUser } from '../../infrastructure/security/auth.decorators';
import { USER_REPOSITORY_TOKEN } from './auth.service';

export const CHARACTER_REPOSITORY_TOKEN = 'ICharacterRepository';

/** Campos que el cliente nunca puede fijar. */
const PROTECTED_FIELDS = ['id', '_id', 'userId', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class CharacterService {
  constructor(
    @Inject(CHARACTER_REPOSITORY_TOKEN)
    private readonly characterRepository: ICharacterRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async listMine(actor: AuthUser): Promise<Character[]> {
    return this.characterRepository.findByUserId(actor.id);
  }

  /** Un usuario solo ve sus personajes; el admin ve todos. A los demás les responde 404. */
  async getOwned(id: string, actor: AuthUser): Promise<Character> {
    const char = await this.characterRepository.findById(id);
    if (!char || (char.userId !== actor.id && actor.role !== 'admin')) {
      throw new NotFoundException('Personaje no encontrado.');
    }
    return char;
  }

  async create(body: Partial<Character>, actor: AuthUser): Promise<Character> {
    const character = { ...this.sanitize(body), userId: actor.id } as Character;
    this.validate(character);

    const user = await this.userRepository.findById(actor.id);
    const limit = user?.maxCharacters ?? 5;
    if ((await this.characterRepository.countByUserId(actor.id)) >= limit) {
      throw new BadRequestException(`Cada usuario puede tener un máximo de ${limit} personajes.`);
    }
    if (!character.avatar) character.avatar = this.getDefaultAvatar(character.class);
    return this.characterRepository.create(character);
  }

  async update(id: string, changes: Partial<Character>, actor: AuthUser): Promise<Character> {
    const existing = await this.getOwned(id, actor);
    const merged = { ...existing, ...this.sanitize(changes), id, userId: existing.userId } as Character;
    this.validate(merged);
    if (changes.class && changes.class !== existing.class && !changes.avatar) {
      merged.avatar = this.getDefaultAvatar(changes.class);
    }
    return this.characterRepository.update(merged);
  }

  async delete(id: string, actor: AuthUser): Promise<boolean> {
    await this.getOwned(id, actor);
    return this.characterRepository.delete(id);
  }

  private sanitize(body: Partial<Character>): Partial<Character> {
    const clean: Record<string, unknown> = { ...(body ?? {}) };
    for (const f of PROTECTED_FIELDS) delete clean[f];
    return clean as Partial<Character>;
  }

  private validate(c: Partial<Character>) {
    const name = (c.name ?? '').trim();
    if (!name || name.length > 60) throw new BadRequestException('El nombre debe tener entre 1 y 60 caracteres.');
    const level = Number(c.level ?? 1);
    if (!Number.isInteger(level) || level < 1 || level > 20) throw new BadRequestException('El nivel debe estar entre 1 y 20.');
    if (!c.class || !c.race || !c.background) throw new BadRequestException('Faltan la clase, la especie o el trasfondo.');
    for (const k of ['hp', 'currentHp'] as const) {
      const v = c[k];
      if (v !== undefined && v !== null && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 999)) {
        throw new BadRequestException('Los puntos de golpe deben estar entre 0 y 999.');
      }
    }
    for (const text of [c.history, c.physicalDesc, c.personalNotes]) {
      if (typeof text === 'string' && text.length > 20000) throw new BadRequestException('Un texto supera los 20.000 caracteres.');
    }
  }

  private getDefaultAvatar(className: string): string {
    const name = (className || '').toLowerCase().trim();
    if (name.includes('guerrero')) return '🛡️';
    if (name.includes('bárbaro') || name.includes('barbaro')) return '🪓';
    if (name.includes('pícaro') || name.includes('picaro')) return '🗡️';
    if (name.includes('mago')) return '🔮';
    if (name.includes('hechicero')) return '✨';
    if (name.includes('clérigo') || name.includes('clerigo')) return '☀️';
    if (name.includes('druida')) return '🌿';
    if (name.includes('bardo')) return '🎵';
    if (name.includes('paladín') || name.includes('paladin')) return '⚔️';
    if (name.includes('explorador')) return '🏹';
    if (name.includes('monje')) return '🧘';
    if (name.includes('brujo')) return '🔥';
    return '👤';
  }
}
