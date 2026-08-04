import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Character } from '../../domain/models/character.model';
import type { ICharacterRepository } from '../../domain/repositories/character.repository.interface';

export const CHARACTER_REPOSITORY_TOKEN = 'ICharacterRepository';

@Injectable()
export class CharacterService {
  constructor(
    @Inject(CHARACTER_REPOSITORY_TOKEN)
    private readonly characterRepository: ICharacterRepository,
  ) {}

  async create(character: Character): Promise<Character> {
    const currentCount = await this.characterRepository.countByUserId(character.userId);
    if (currentCount >= 5) {
      throw new BadRequestException('Cada usuario puede crear un máximo de 5 personajes.');
    }
    
    // Asignar avatar por defecto si no viene
    if (!character.avatar) {
      character.avatar = this.getDefaultAvatar(character.class);
    }

    return this.characterRepository.create(character);
  }

  async findByUserId(userId: string): Promise<Character[]> {
    return this.characterRepository.findByUserId(userId);
  }

  async findById(id: string): Promise<Character> {
    const char = await this.characterRepository.findById(id);
    if (!char) {
      throw new NotFoundException('Personaje no encontrado.');
    }
    return char;
  }

  async update(id: string, updatedData: Partial<Character>): Promise<Character> {
    const existing = await this.characterRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Personaje no encontrado.');
    }

    const merged: Character = {
      ...existing,
      ...updatedData,
      id, // asegurar ID correcto
    };

    if (updatedData.class && updatedData.class !== existing.class && !updatedData.avatar) {
      merged.avatar = this.getDefaultAvatar(updatedData.class);
    }

    return this.characterRepository.update(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.characterRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Personaje no encontrado.');
    }
    return this.characterRepository.delete(id);
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
