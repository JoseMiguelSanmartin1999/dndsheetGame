import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Character {
  id?: string;
  userId: string;
  name: string;
  class: string;
  race: string;
  level: number;
  avatar: string;
  hp: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  baseStats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  backgroundStatsAllocation: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  background: string;
  originLineage?: string;
  subclass?: string;
  classSkills: string[];
  skilledFeatSelection?: string[];
  preparedSpells?: string[];
  warlockInvocations?: string[];
  clericDivineOrder?: string;
  druidPrimalOrder?: string;
  rangerFeyGift?: string;
  rangerPrimalCompanion?: string;
  history: string;
  physicalDesc: string;
  height: number;
  sizeClass: string;
  personalNotes?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private apiUrl = 'http://localhost:3000/characters';

  constructor(private http: HttpClient) {}

  getCharacters(userId: string): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}?userId=${encodeURIComponent(userId)}`);
  }

  getCharacterById(id: string): Observable<Character> {
    return this.http.get<Character>(`${this.apiUrl}/${id}`);
  }

  createCharacter(character: Character): Observable<Character> {
    return this.http.post<Character>(this.apiUrl, character);
  }

  updateCharacter(id: string, character: Partial<Character>): Observable<Character> {
    return this.http.put<Character>(`${this.apiUrl}/${id}`, character);
  }

  deleteCharacter(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
