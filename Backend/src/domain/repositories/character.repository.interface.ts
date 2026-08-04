import { Character } from '../models/character.model';

export interface ICharacterRepository {
  create(character: Character): Promise<Character>;
  findByUserId(userId: string): Promise<Character[]>;
  findById(id: string): Promise<Character | null>;
  update(character: Character): Promise<Character>;
  delete(id: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}
