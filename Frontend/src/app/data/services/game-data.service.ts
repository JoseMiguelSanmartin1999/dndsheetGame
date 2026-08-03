import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DndClass {
  name: string;
  icon: string;
  preference: string;
  primaryStat: string;
  complexity: 'Baja' | 'Media' | 'Alta';
  image: string;
  hitDie: string;
  quote: string;
  description: string;
}

export interface DndOrigin {
  name: string;
  icon: string;
  bonus: string;
  speed: string;
  language: string;
  trait: string;
  image: string;
  description: string;
  statModifiers: { [key: string]: number };
}

export interface DndBackground {
  name: string;
  icon: string;
  concept: string;
  statImprovement: string;
  keyFeat: string;
  skills: string;
  tools: string;
  recommendations: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameDataService {
  private apiUrl = 'http://localhost:3000/game-data';

  constructor(private http: HttpClient) {}

  getClasses(): Observable<DndClass[]> {
    return this.http.get<DndClass[]>(`${this.apiUrl}/classes`);
  }

  getBackgrounds(): Observable<DndBackground[]> {
    return this.http.get<DndBackground[]>(`${this.apiUrl}/backgrounds`);
  }

  getOrigins(): Observable<DndOrigin[]> {
    return this.http.get<DndOrigin[]>(`${this.apiUrl}/origins`);
  }

  getRaceSizeInfo(raceName: string): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/game-rules/sizes?raceName=${encodeURIComponent(raceName)}`);
  }

  calculateCarryingCapacity(strength: number, sizeClass: string, isGoliath: boolean): Observable<any> {
    return this.http.post<any>(`http://localhost:3000/game-rules/carrying-capacity`, { strength, sizeClass, isGoliath });
  }

  rollSingleStat(): Observable<any> {
    return this.http.post<any>(`http://localhost:3000/game-rules/roll-dice`, {});
  }
}
