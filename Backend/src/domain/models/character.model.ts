export class Character {
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
  classSkills: string[];
  skilledFeatSelection?: string[];
  history: string;
  physicalDesc: string;
  height: number;
  sizeClass: string;
  createdAt?: Date;
}
