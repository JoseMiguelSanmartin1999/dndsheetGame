import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CharacterService, Character } from '../../data/services/character.service';
import { SpellsDataService, Spell } from '../../data/services/spells-data.service';
export const DND_2024_WEAPONS = [
  { name: 'Espada Larga', damage: '1d8', damageType: 'Cortante', properties: ['Versátil (1d10)'], mastery: 'Sap' },
  { name: 'Espada Corta', damage: '1d6', damageType: 'Perforante', properties: ['Finesse', 'Ligera'], mastery: 'Vex' },
  { name: 'Daga', damage: '1d4', damageType: 'Perforante', properties: ['Finesse', 'Ligera', 'Arrojadiza'], mastery: 'Nick' },
  { name: 'Gran Hacha', damage: '1d12', damageType: 'Cortante', properties: ['Pesada', 'Dos Manos'], mastery: 'Cleave' },
  { name: 'Arco Largo', damage: '1d8', damageType: 'Perforante', properties: ['Pesada', 'Dos Manos'], mastery: 'Slow' },
  { name: 'Maza', damage: '1d6', damageType: 'Contundente', properties: [], mastery: 'Sap' },
  { name: 'Alabarda', damage: '1d10', damageType: 'Cortante', properties: ['Pesada', 'Alcance', 'Dos Manos'], mastery: 'Cleave' },
  { name: 'Estoque (Rapier)', damage: '1d8', damageType: 'Perforante', properties: ['Finesse'], mastery: 'Vex' },
  { name: 'Ballesta Ligera', damage: '1d8', damageType: 'Perforante', properties: ['Dos Manos'], mastery: 'Slow' },
  { name: 'Lanza', damage: '1d6', damageType: 'Perforante', properties: ['Versátil (1d8)', 'Arrojadiza'], mastery: 'Sap' },
  { name: 'Arco Corto', damage: '1d6', damageType: 'Perforante', properties: ['Dos Manos'], mastery: 'Vex' },
  { name: 'Bastón', damage: '1d6', damageType: 'Contundente', properties: ['Versátil (1d8)'], mastery: 'Topple' },
  { name: 'Hacha de Mano', damage: '1d6', damageType: 'Cortante', properties: ['Ligera', 'Arrojadiza'], mastery: 'Vex' },
  { name: 'Hoz', damage: '1d4', damageType: 'Cortante', properties: ['Ligera'], mastery: 'Nick' },
  { name: 'Jabalina', damage: '1d6', damageType: 'Perforante', properties: ['Arrojadiza'], mastery: 'Slow' },
  { name: 'Garrote', damage: '1d4', damageType: 'Contundente', properties: ['Ligera'], mastery: 'Slow' }
];

export const WEAPON_MASTERIES = {
  'Cleave': 'Si golpeas a una criatura, puedes hacer un ataque adicional a otra criatura a 5 pies que también esté a tu alcance.',
  'Graze': 'Si fallas el ataque, infliges daño igual a tu modificador de característica.',
  'Nick': 'Puedes realizar un ataque adicional con el arma ligera en la misma acción de ataque en lugar de usar una acción adicional.',
  'Push': 'Si golpeas a una criatura, puedes empujarla 10 pies lejos de ti.',
  'Sap': 'Si golpeas, el próximo ataque del objetivo tiene desventaja.',
  'Slow': 'Si golpeas, la velocidad del objetivo se reduce en 10 pies hasta tu próximo turno.',
  'Topple': 'Si golpeas, el objetivo debe tener éxito en una salvación de Constitución o quedar derribado.',
  'Vex': 'Si golpeas, tienes ventaja en tu próximo ataque contra esa criatura antes del final de tu próximo turno.'
};

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css'
})
export class CharacterSheetComponent implements OnInit {
  hasSavingThrowProficiency(statKey: string): boolean {
    if (!this.character || !this.character.class) return false;
    const cls = this.character.class.toLowerCase();
    const proficiencies: Record<string, string[]> = {
      'bárbaro': ['strength', 'constitution'], 'barbaro': ['strength', 'constitution'],
      'bardo': ['dexterity', 'charisma'], 'clérigo': ['wisdom', 'charisma'], 'clerigo': ['wisdom', 'charisma'],
      'druida': ['intelligence', 'wisdom'], 'guerrero': ['strength', 'constitution'], 'monje': ['strength', 'dexterity'],
      'paladín': ['wisdom', 'charisma'], 'paladin': ['wisdom', 'charisma'], 'explorador': ['strength', 'dexterity'],
      'pícaro': ['dexterity', 'intelligence'], 'picaro': ['dexterity', 'intelligence'], 'hechicero': ['constitution', 'charisma'],
      'brujo': ['wisdom', 'charisma'], 'mago': ['intelligence', 'wisdom'], 'fighter': ['strength', 'constitution'],
      'wizard': ['intelligence', 'wisdom'], 'rogue': ['dexterity', 'intelligence'], 'cleric': ['wisdom', 'charisma']
    };
    const profs = proficiencies[cls] || [];
    const explicit = (this.character as any).savingThrowProficiencies || [];
    return profs.includes(statKey) || explicit.includes(statKey);
  }

  getSavingThrow(statKey: string): string {
    let modVal = this.getFinalModifierValue(statKey);
    if (this.hasSavingThrowProficiency(statKey)) {
      modVal += this.getProficiencyBonus();
    }
    return modVal >= 0 ? '+' + modVal : '' + modVal;
  }

  hpModifierAmount: number = 1;
  activeTraitTab: 'class' | 'feats' | 'species' | 'spells' = 'class';

  // Helper Methods for HTML Template

  getSkillsList() {
    return [
      { name: 'Acrobacias', stat: 'Des', statKey: 'dexterity' },
      { name: 'Arcanos', stat: 'Int', statKey: 'intelligence' },
      { name: 'Atletismo', stat: 'Fue', statKey: 'strength' },
      { name: 'Engaño', stat: 'Car', statKey: 'charisma' },
      { name: 'Historia', stat: 'Int', statKey: 'intelligence' },
      { name: 'Interpretación', stat: 'Car', statKey: 'charisma' },
      { name: 'Intimidación', stat: 'Car', statKey: 'charisma' },
      { name: 'Investigación', stat: 'Int', statKey: 'intelligence' },
      { name: 'Juego de Manos', stat: 'Des', statKey: 'dexterity' },
      { name: 'Medicina', stat: 'Sab', statKey: 'wisdom' },
      { name: 'Naturaleza', stat: 'Int', statKey: 'intelligence' },
      { name: 'Percepción', stat: 'Sab', statKey: 'wisdom' },
      { name: 'Perspicacia', stat: 'Sab', statKey: 'wisdom' },
      { name: 'Persuasión', stat: 'Car', statKey: 'charisma' },
      { name: 'Religión', stat: 'Int', statKey: 'intelligence' },
      { name: 'Sigilo', stat: 'Des', statKey: 'dexterity' },
      { name: 'Supervivencia', stat: 'Sab', statKey: 'wisdom' },
      { name: 'Trato con Animales', stat: 'Sab', statKey: 'wisdom' }
    ];
  }


  getHpPercentage(): number {
    const charAny = this.character as any;
    if (!charAny) return 100;
    const max = charAny.maxHp || charAny.hp || 1;
    return Math.max(0, Math.min(100, ((charAny.currentHp || 0) / max) * 100));
  }

  modifyHp(amount: number): void {
    if (this.character) {
      const charAny = this.character as any;
      const max = charAny.maxHp || charAny.hp || 0;
      charAny.currentHp = Math.max(0, Math.min(max, (charAny.currentHp || 0) + amount));
    }
  }

  toggleInspiration(): void {
    if (this.character) {
      (this.character as any).inspiration = !(this.character as any).inspiration;
    }
  }

  openAcManager(): void {}
  openHpManager(): void {}

  private route = inject(ActivatedRoute);
  private characterService = inject(CharacterService);
  private spellsDataService = inject(SpellsDataService);
  private cdr = inject(ChangeDetectorRef);

  character: Character | null = null;
  loading = true;
  errorLoading = false;
  activeTab = 1;
  activeCombatTab: 'armas' | 'trucos' = 'armas';
  showAddWeaponModal = false;
  selectedWeaponToAdd = '';
  availableWeapons = DND_2024_WEAPONS;
  masteryInfo: { name: string, description: string } | null = null;
  debugLogs: string[] = [];
  expandedFeatures: { [key: string]: boolean } = {};
  subclassChoiceRequired = false;
  selectedGlosaryTerm: string | null = null;
  editSpellsMode = false;
  tempPreparedSpells: string[] = [];
  activeSpellFilterLevel = 'Trucos';
  spellSearchQuery = '';
  
  // Control interactivo de ranuras de conjuro usadas
  usedSpellSlots: { [key: number]: number } = {};

  // Nivelación Modal
  showLevelUpModal = false;
  levelUpHpMode: 'roll' | 'average' = 'average';
  levelUpHpRoll = 0;
  needsSubclass = false;
  pendingSubclass = '';

  // Nivelación
  xpAmountToAdd = 0;
  XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

  getNextLevelXp(): number {
    if (!this.character) return 0;
    const currentLevel = this.character.level;
    if (currentLevel >= 20) return this.XP_THRESHOLDS[19];
    return this.XP_THRESHOLDS[currentLevel];
  }

  addXp(amount: number): void {
    if (!this.character) return;
    this.character.xp = (this.character.xp || 0) + amount;
    
    // Check if level up
    let newLevel = this.character.level;
    while (newLevel < 20 && this.character.xp >= this.XP_THRESHOLDS[newLevel]) {
      newLevel++;
    }

    if (newLevel > this.character.level) {
      const levelsGained = newLevel - this.character.level;
      for (let i = 0; i < levelsGained; i++) {
        this.levelUp(); // esto aumentará HP y Level 1 a 1 y guardará
      }
    } else {
      // Just save the XP
      this.saveCharacterChanges();
    }
    
    this.xpAmountToAdd = 0;
    this.cdr.detectChanges();
  }

  getHitDieSizeByClass(className: string): number {
    const cl = (className || '').toLowerCase();
    if (cl.includes('bárbaro') || cl.includes('barbaro')) return 12;
    if (cl.includes('guerrero') || cl.includes('paladín') || cl.includes('paladin') || cl.includes('explorador')) return 10;
    if (cl.includes('mago') || cl.includes('hechicero')) return 6;
    return 8; // bardo, clérigo, druida, pícaro, brujo, monje
  }

  levelUp(): void {
    if (!this.character || this.character.level >= 20) return;
    
    const nextLvl = this.character.level + 1;
    this.needsSubclass = (nextLvl >= 3 && !this.character.subclass);
    this.pendingSubclass = '';
    this.levelUpHpMode = 'average';
    this.levelUpHpRoll = 0;
    
    this.showLevelUpModal = true;
  }

  isRollingHp = false;

  rollHpDieLevelUp(): void {
    if (this.isRollingHp) return;
    this.isRollingHp = true;
    this.levelUpHpMode = 'roll';
    
    let rolls = 0;
    const maxDie = this.getHitDieSizeByClass(this.character?.class || '');
    
    const interval = setInterval(() => {
      this.levelUpHpRoll = Math.floor(Math.random() * maxDie) + 1;
      rolls++;
      this.cdr.detectChanges();
      if (rolls > 15) {
        clearInterval(interval);
        this.isRollingHp = false;
        this.cdr.detectChanges();
      }
    }, 40);
  }

  getAvailableSubclasses(className: string): {name: string, desc: string, features: string[]}[] {
    const cl = (className || '').toLowerCase();
    if (cl.includes('bárbaro') || cl.includes('barbaro')) {
      return [
        { name: 'Senda del Berserker', desc: 'Furia frenética y agresiva.', features: ['Frenesí', 'Ataque Descuidado Mejorado'] },
        { name: 'Senda del Árbol del Mundo', desc: 'Conexión mística con las raíces de Yggdrasil.', features: ['Vitalidad del Árbol', 'Ramas Protectoras'] },
        { name: 'Senda del Guerrero Totémico', desc: 'Adopta espíritus animales para obtener resistencias.', features: ['Espíritu Buscador', 'Tótem del Oso/Águila/Lobo'] },
        { name: 'Senda del Fanático', desc: 'Guerrero divino que inflige daño radiante.', features: ['Furia Divina', 'Guerrero de los Dioses'] }
      ];
    }
    if (cl.includes('bardo')) {
      return [
        { name: 'Colegio del Conocimiento', desc: 'Usa tu inspiración para reducir las tiradas enemigas.', features: ['Competencias Adicionales', 'Palabras Cortantes'] },
        { name: 'Colegio del Valor', desc: 'Bardo marcial con armadura media y escudos.', features: ['Competencia Marcial', 'Inspiración en Combate'] },
        { name: 'Colegio del Glamour', desc: 'Magia feérica que fascina a las multitudes.', features: ['Manto de Inspiración', 'Actuación Cautivadora'] },
        { name: 'Colegio de la Danza', desc: 'Movimiento evasivo y ataques desarmados.', features: ['Danza Evasiva', 'Ataques Ágiles'] }
      ];
    }
    if (cl.includes('brujo')) {
      return [
        { name: 'Patrón Corruptor', desc: 'Pacto con un demonio o diablo.', features: ['Bendición del Oscuro', 'Conjuros Expandidos (Fuego)'] },
        { name: 'Patrón Archihada', desc: 'Pacto con un ser del Feywild.', features: ['Presencia Feérica', 'Paso Brumoso Mejorado'] },
        { name: 'Patrón Celestial', desc: 'Pacto con un ángel.', features: ['Luz Sanadora', 'Resistencia Radiante'] },
        { name: 'Patrón del Gran Antiguo', desc: 'Pacto con entidades cósmicas.', features: ['Mente Despierta', 'Telepatía'] }
      ];
    }
    if (cl.includes('clérigo') || cl.includes('clerigo')) {
      return [
        { name: 'Dominio de la Vida', desc: 'Sanador supremo.', features: ['Discípulo de la Vida', 'Conjuros de Dominio'] },
        { name: 'Dominio de la Luz', desc: 'Clérigo ofensivo de fuego y luz.', features: ['Llamarada Protectora', 'Truco de Luz'] },
        { name: 'Dominio de la Guerra', desc: 'Sacerdote marcial.', features: ['Sacerdote de Guerra', 'Competencias Marciales'] },
        { name: 'Dominio del Engaño', desc: 'Magia de ilusión e invisibilidad.', features: ['Bendición del Embaucador', 'Duplicado Ilusorio'] }
      ];
    }
    if (cl.includes('druida')) {
      return [
        { name: 'Círculo de la Luna', desc: 'Maestro de la Forma Salvaje.', features: ['Forma Salvaje de Combate', 'Curación Salvaje'] },
        { name: 'Círculo de la Tierra', desc: 'Enfocado en magia elemental.', features: ['Recuperación Natural', 'Conjuros de Círculo'] },
        { name: 'Círculo de las Estrellas', desc: 'Canaliza el poder de las constelaciones.', features: ['Forma Estelar', 'Mapa Estelar'] },
        { name: 'Círculo del Mar', desc: 'Domina las olas y tormentas.', features: ['Ira del Océano', 'Afinidad Acuática'] }
      ];
    }
    if (cl.includes('explorador')) {
      return [
        { name: 'Cazador', desc: 'Especialista en abatir presas.', features: ['Presa del Cazador', 'Defensa del Cazador'] },
        { name: 'Señor de las Bestias', desc: 'Compañero primigenio leal.', features: ['Compañero Animal', 'Vínculo Primigenio'] },
        { name: 'Caminante del Horizonte', desc: 'Defensor de los portales.', features: ['Golpe Planar', 'Detectar Portales'] },
        { name: 'Acechador Sombrío', desc: 'Asesino letal en la oscuridad.', features: ['Magia Umbría', 'Emboscada Temible'] }
      ];
    }
    if (cl.includes('guerrero')) {
      return [
        { name: 'Campeón', desc: 'Maestro de la letalidad bruta.', features: ['Crítico Mejorado (19-20)', 'Atleta Destacado'] },
        { name: 'Maestro de Batalla', desc: 'Estratega que usa dados de superioridad.', features: ['Superioridad en Combate', 'Conocedor de tu Enemigo'] },
        { name: 'Caballero Arcano', desc: 'Combina el arte de la espada con magia.', features: ['Lanzamiento de Conjuros', 'Vínculo con el Arma'] },
        { name: 'Guerrero Psiónico', desc: 'Empuña poderes telequinéticos.', features: ['Poder Psiónico', 'Ataque Telequinético'] }
      ];
    }
    if (cl.includes('mago')) {
      return [
        { name: 'Escuela de Evocación', desc: 'Especialista en magia destructiva.', features: ['Esculpir Conjuros', 'Evocación Potente'] },
        { name: 'Escuela de Abjuración', desc: 'Maestro de la protección.', features: ['Custodia Arcana', 'Abjuración Proyectada'] },
        { name: 'Escuela de Ilusión', desc: 'Engaña los sentidos.', features: ['Ilusión Menor Mejorada', 'Ilusiones Flexibles'] },
        { name: 'Escuela de Adivinación', desc: 'Ves el futuro.', features: ['Portento', 'Experto Adivino'] }
      ];
    }
    if (cl.includes('hechicero')) {
      return [
        { name: 'Linaje Dracónico', desc: 'Sangre de dragón.', features: ['Resiliencia Dracónica', 'Afinidad Elemental'] },
        { name: 'Magia Salvaje', desc: 'Efectos impredecibles y caóticos.', features: ['Oleada de Magia Salvaje', 'Mareas de Caos'] },
        { name: 'Alma Divina', desc: 'Acceso a la magia de curación.', features: ['Magia Divina', 'Favor de los Dioses'] },
        { name: 'Hechicería de la Tormenta', desc: 'Controlas el viento y el trueno.', features: ['Hablante del Viento', 'Magia Tempestuosa'] }
      ];
    }
    if (cl.includes('monje')) {
      return [
        { name: 'Camino de la Mano Abierta', desc: 'Derriba, empuja o neutraliza.', features: ['Técnica de Mano Abierta', 'Completud Corporal'] },
        { name: 'Camino de las Sombras', desc: 'Asesino ninja.', features: ['Artes Sombrías', 'Paso Sombrío'] },
        { name: 'Camino de los Cuatro Elementos', desc: 'Canalizas el chi elemental.', features: ['Discípulo de los Elementos', 'Disciplinas Elementales'] },
        { name: 'Camino de la Misericordia', desc: 'Sanador y verdugo.', features: ['Implementos de Misericordia', 'Mano Sanadora'] }
      ];
    }
    if (cl.includes('paladín') || cl.includes('paladin')) {
      return [
        { name: 'Juramento de Devoción', desc: 'El arquetipo del caballero blanco.', features: ['Canalizar Divinidad', 'Arma Sagrada'] },
        { name: 'Juramento de los Antiguos', desc: 'Caballero de la luz natural.', features: ['Aura de Protección', 'Presa de la Naturaleza'] },
        { name: 'Juramento de Venganza', desc: 'Cazador implacable.', features: ['Voto de Enemistad', 'Abjurar Enemigo'] },
        { name: 'Juramento de Gloria', desc: 'Buscador de hazañas épicas.', features: ['Deportista Sin Par', 'Golpe Inspirador'] }
      ];
    }
    if (cl.includes('pícaro') || cl.includes('picaro')) {
      return [
        { name: 'Ladrón', desc: 'Rápido y ágil.', features: ['Manos Rápidas', 'Trabajo de Balcón'] },
        { name: 'Asesino', desc: 'Letal desde las sombras.', features: ['Asesinar', 'Competencia con Venenos'] },
        { name: 'Embaucador Arcano', desc: 'Pícaro mágico.', features: ['Mano de Mago Legerdemain', 'Lanzamiento de Conjuros'] },
        { name: 'Espadachín', desc: 'Duelista audaz.', features: ['Juego de Pies Elegante', 'Audacia Cínica'] }
      ];
    }
    return [];
  }

  getPendingSubclassDesc(): string {
    if (!this.character || !this.pendingSubclass) return '';
    const subs = this.getAvailableSubclasses(this.character.class);
    const found = subs.find(s => s.name === this.pendingSubclass);
    return found ? found.desc : '';
  }

  getPendingSubclassFeatures(): string[] {
    if (!this.character || !this.pendingSubclass) return [];
    const subs = this.getAvailableSubclasses(this.character.class);
    const found = subs.find(s => s.name === this.pendingSubclass);
    return found ? found.features : [];
  }

  confirmLevelUp(): void {
    if (!this.character) return;
    
    this.character.level++;
    
    if (this.needsSubclass && this.pendingSubclass) {
      this.character.subclass = this.pendingSubclass;
    }
    
    const dieSize = this.getHitDieSizeByClass(this.character.class);
    const conMod = this.getFinalModifierValue('CON');
    
    let hpGain = 0;
    if (this.levelUpHpMode === 'average') {
      hpGain = Math.floor(dieSize / 2) + 1;
    } else {
      hpGain = this.levelUpHpRoll || Math.floor(dieSize / 2) + 1;
    }
    
    const totalGain = Math.max(1, hpGain + conMod);
    this.character.hp += totalGain;
    this.character.currentHp = this.character.hp;
    
    this.saveCharacterChanges();
    this.showLevelUpModal = false;
    alert(`¡Has subido a nivel ${this.character.level}!`);
    
    // Abrir conjuros
    if (this.isSpellcaster()) {
      this.startEditingSpells();
    }
  }

  cancelLevelUp(): void {
    this.showLevelUpModal = false;
  }

  levelDown(): void {
    if (!this.character || this.character.level <= 1) return;
    
    // Reverse HP calculation
    const dieSize = this.getHitDieSizeByClass(this.character.class);
    const averageHpGain = Math.floor(dieSize / 2) + 1;
    const conMod = this.getFinalModifierValue('CON');
    const totalLoss = Math.max(1, averageHpGain + conMod);
    
    this.character.hp = Math.max(1, this.character.hp - totalLoss);
    if (this.character.currentHp && this.character.currentHp > this.character.hp) {
      this.character.currentHp = this.character.hp;
    }

    this.character.level--;
    this.saveCharacterChanges();
  }

  saveCharacterChanges(): void {
    if (!this.character || !this.character.id) return;
    this.characterService.updateCharacter(this.character.id, this.character).subscribe({
      next: (res) => {
        this.character = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  getWeaponDamageModifier(weaponName: string): string {
    const weapon = DND_2024_WEAPONS.find(w => w.name === weaponName);
    if (!weapon || !this.character) return '+0';
    
    let isFinesse = weapon.properties.includes('Finesse');
    let strMod = this.getFinalModifierValue('strength');
    let dexMod = this.getFinalModifierValue('dexterity');
    
    let mod = isFinesse ? Math.max(strMod, dexMod) : strMod;
    return mod >= 0 ? '+' + mod : '' + mod;
  }

  getWeaponHitModifier(weaponName: string): string {
    const weapon = DND_2024_WEAPONS.find(w => w.name === weaponName);
    if (!weapon || !this.character) return '+0';
    
    let isFinesse = weapon.properties.includes('Finesse');
    let strMod = this.getFinalModifierValue('strength');
    let dexMod = this.getFinalModifierValue('dexterity');
    
    let attrMod = isFinesse ? Math.max(strMod, dexMod) : strMod;
    let profBonus = this.getProficiencyBonus(); 
    let total = attrMod + profBonus;
    return total >= 0 ? '+' + total : '' + total;
  }

  getWeaponData(weaponName: string) {
    if (!weaponName) return undefined;
    return DND_2024_WEAPONS.find(w => w.name.toLowerCase() === weaponName.toLowerCase());
  }

  removeWeapon(weaponName: string) {
    if (!this.character) return;
    this.character.weapons = (this.character.weapons || []).filter(w => w !== weaponName);
    this.saveCharacterWeapons();
  }

  addWeapon() {
    if (!this.character || !this.selectedWeaponToAdd) return;
    if (!this.character.weapons) this.character.weapons = [];
    if (!this.character.weapons.includes(this.selectedWeaponToAdd)) {
      this.character.weapons.push(this.selectedWeaponToAdd);
      this.saveCharacterWeapons();
    }
    this.showAddWeaponModal = false;
    this.selectedWeaponToAdd = '';
  }

  saveCharacterWeapons() {
    if (!this.character || !this.character.id) return;
    this.characterService.updateCharacter(this.character.id, { weapons: this.character.weapons }).subscribe();
  }

  saveCharacterInventory() {
    if (!this.character || !this.character.id) return;
    this.characterService.updateCharacter(this.character.id, { inventory: this.character.inventory }).subscribe();
  }

  getAmmunitionQuantity(weaponName: string): number {
    let ammoName = '';
    if (weaponName.toLowerCase().includes('arco')) ammoName = 'flechas';
    if (weaponName.toLowerCase().includes('ballesta')) ammoName = 'virotes';
    if (!ammoName) return -1; // Not an ammo weapon
    
    if (!this.character || !this.character.inventory) return 0; // It is an ammo weapon, but inventory is empty/undefined
    
    return this.character.inventory[ammoName] !== undefined ? this.character.inventory[ammoName] : 
           (this.character.inventory[ammoName.slice(0, -1)] !== undefined ? this.character.inventory[ammoName.slice(0, -1)] : 0);
  }

  decreaseAmmunition(weaponName: string) {
    if (!this.character) return;
    if (!this.character.inventory) this.character.inventory = {};
    
    let ammoName = '';
    if (weaponName.toLowerCase().includes('arco')) ammoName = 'flechas';
    if (weaponName.toLowerCase().includes('ballesta')) ammoName = 'virotes';
    if (!ammoName) return;

    const currentQty = this.getAmmunitionQuantity(weaponName);
    if (currentQty > 0) {
      const keyToUpdate = this.character.inventory[ammoName.slice(0, -1)] !== undefined ? ammoName.slice(0, -1) : ammoName;
      this.character.inventory[keyToUpdate] = currentQty - 1;
      this.saveCharacterInventory();
    }
  }

  increaseAmmunition(weaponName: string) {
    if (!this.character) return;
    if (!this.character.inventory) this.character.inventory = {};
    
    let ammoName = '';
    if (weaponName.toLowerCase().includes('arco')) ammoName = 'flechas';
    if (weaponName.toLowerCase().includes('ballesta')) ammoName = 'virotes';
    if (!ammoName) return;

    const currentQty = this.getAmmunitionQuantity(weaponName);
    const keyToUpdate = this.character.inventory[ammoName.slice(0, -1)] !== undefined ? ammoName.slice(0, -1) : ammoName;
    this.character.inventory[keyToUpdate] = currentQty + 1;
    this.saveCharacterInventory();
  }

  showMasteryInfo(masteryName: string) {
    const desc = (WEAPON_MASTERIES as any)[masteryName];
    if (desc) {
      this.masteryInfo = { name: masteryName, description: desc };
    }
  }

  closeMasteryInfo() {
    this.masteryInfo = null;
  }


  getSpellSlotsList(): { level: number, max: number }[] {
    if (!this.character) return [];
    const lvl = this.character.level || 1;
    const className = this.character.class.toLowerCase();
    
    const isFullCaster = className.includes('hechicero') || className.includes('bardo') || 
                          className.includes('clÃ©rigo') || className.includes('clerigo') || 
                          className.includes('druida') || className.includes('mago');
    
    if (isFullCaster) {
      const progression: { [key: number]: { [lvl: number]: number } } = {
        1: { 1: 2 },
        2: { 1: 3 },
        3: { 1: 4, 2: 2 },
        4: { 1: 4, 2: 3 },
        5: { 1: 4, 2: 3, 3: 2 },
        6: { 1: 4, 2: 3, 3: 3 },
        7: { 1: 4, 2: 3, 3: 3, 4: 1 },
        8: { 1: 4, 2: 3, 3: 3, 4: 2 },
        9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
        10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
        11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
        12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
        13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
        14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
        15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
        16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
        17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
        18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
        19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
        20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
      };
      
      const slots = progression[lvl] || {};
      return Object.keys(slots).map(k => ({ level: Number(k), max: slots[Number(k)] }));
    }

    if (className.includes('brujo')) {
      let slotLevel = 1;
      let count = 1;
      if (lvl >= 2) count = 2;
      if (lvl >= 3) slotLevel = 2;
      if (lvl >= 5) slotLevel = 3;
      if (lvl >= 7) slotLevel = 4;
      if (lvl >= 9) slotLevel = 5;
      if (lvl >= 11) count = 3;
      if (lvl >= 17) count = 4;
      return [{ level: slotLevel, max: count }];
    }

    if (className.includes('explorador')) {
      const progression: { [key: number]: { [lvl: number]: number } } = {
        1: {},
        2: { 1: 2 },
        3: { 1: 3 },
        4: { 1: 3 },
        5: { 1: 4, 2: 2 },
        6: { 1: 4, 2: 2 },
        7: { 1: 4, 2: 3 },
        8: { 1: 4, 2: 3 },
        9: { 1: 4, 2: 3, 3: 2 },
        10: { 1: 4, 2: 3, 3: 2 },
        11: { 1: 4, 2: 3, 3: 3 },
        12: { 1: 4, 2: 3, 3: 3 },
        13: { 1: 4, 2: 3, 3: 3, 4: 1 },
        14: { 1: 4, 2: 3, 3: 3, 4: 1 },
        15: { 1: 4, 2: 3, 3: 3, 4: 2 },
        16: { 1: 4, 2: 3, 3: 3, 4: 2 },
        17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
        18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
        19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
        20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
      };
      const slots = progression[lvl] || {};
      return Object.keys(slots).map(k => ({ level: Number(k), max: slots[Number(k)] }));
    }

    if (className.includes('guerrero') && this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
      const progression: { [key: number]: { [lvl: number]: number } } = {
        1: {}, 2: {},
        3: { 1: 2 },
        4: { 1: 3 },
        5: { 1: 3 },
        6: { 1: 3 },
        7: { 1: 4, 2: 2 },
        8: { 1: 4, 2: 2 },
        9: { 1: 4, 2: 2 },
        10: { 1: 4, 2: 3 },
        11: { 1: 4, 2: 3 },
        12: { 1: 4, 2: 3 },
        13: { 1: 4, 2: 3, 3: 2 },
        14: { 1: 4, 2: 3, 3: 2 },
        15: { 1: 4, 2: 3, 3: 2 },
        16: { 1: 4, 2: 3, 3: 3 },
        17: { 1: 4, 2: 3, 3: 3 },
        18: { 1: 4, 2: 3, 3: 3 },
        19: { 1: 4, 2: 3, 3: 3, 4: 1 },
        20: { 1: 4, 2: 3, 3: 3, 4: 1 }
      };
      const slots = progression[lvl] || {};
      return Object.keys(slots).map(k => ({ level: Number(k), max: slots[Number(k)] }));
    }

    return [];
  }

  getUsedSlotsForLevel(spellLevel: number): number {
    return this.usedSpellSlots[spellLevel] || 0;
  }

  toggleSpellSlot(spellLevel: number, index: number): void {
    const currentUsed = this.getUsedSlotsForLevel(spellLevel);
    if (index < currentUsed) {
      this.usedSpellSlots[spellLevel] = currentUsed - 1;
    } else {
      this.usedSpellSlots[spellLevel] = currentUsed + 1;
    }
    this.cdr.detectChanges();
  }

  resetAllSpellSlots(): void {
    this.usedSpellSlots = {};
    this.cdr.detectChanges();
  }

  getRange(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i);
  }

  getGlosarySpellNames(): string[] {
    return Object.keys(SPELL_DESCRIPTIONS_MAP).sort();
  }

  getSpellsByLevel(): { [key: string]: Spell[] } {
    const categories: { [key: string]: Spell[] } = {
      'Trucos': [],
      'Nivel 1': [],
      'Nivel 2': [],
      'Nivel 3': [],
      'Nivel 4': [],
      'Nivel 5': [],
      'Nivel 6': [],
      'Nivel 7': [],
      'Nivel 8': [],
      'Nivel 9': []
    };

    if (!this.character || !this.character.preparedSpells) {
      return categories;
    }

    const preparedNames = this.character.preparedSpells;
    for (const name of preparedNames) {
      const spellData = this.spellsDataService.getSpellByName(name);
      if (spellData) {
        const lvl = spellData.level ? \`Nivel \${spellData.level}\` : 'Trucos';
        if (!categories[lvl]) {
          categories[lvl] = [];
        }
        categories[lvl].push(spellData);
      } else {
        // Fallback for custom or unfound spells
        categories['Trucos'].push({ name, desc: 'Hechizo sin descripción.' });
      }
    }
    
    return categories;
  }

  isSpellPreparedInTemp(spellName: string): boolean {
    return this.tempPreparedSpells.includes(spellName);
  }

  toggleSpellInTemp(spellName: string): void {
    if (this.isSpellPreparedInTemp(spellName)) {
      this.removeSpellFromTemp(spellName);
    } else {
      this.addSpellToTemp(spellName);
    }
  }

  getFilteredSpellsForCurrentLevel(): Spell[] {
    const allByCategory = this.getSpellsByLevel();
    const spellsInActiveLevel = allByCategory[this.activeSpellFilterLevel] || [];
    
    if (!this.spellSearchQuery.trim()) {
      return spellsInActiveLevel;
    }
    
    const query = this.spellSearchQuery.toLowerCase().trim();
    return spellsInActiveLevel.filter(s => s.name.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query));
  }

  getCharacterSpellLimit(): number {
    if (!this.character) return 0;
    const lvl = this.character.level || 1;
    const name = this.character.class.toLowerCase();

    // Tablas de conjuros preparados One D&D 2024 / 5e
    const fullCasterTable: { [key: number]: number } = {
      1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
      10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22
    };

    const halfCasterTable: { [key: number]: number } = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9,
      10: 9, 11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12,
      17: 14, 18: 14, 19: 15, 20: 15
    };

    const warlockTable: { [key: number]: number } = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
      10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13,
      17: 14, 18: 14, 19: 15, 20: 15
    };

    const thirdCasterTable: { [key: number]: number } = {
      3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 8, 12: 8,
      13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 11, 19: 12, 20: 13
    };

    if (name.includes('hechicero')) {
      const cantrips = lvl >= 10 ? 6 : (lvl >= 4 ? 5 : 4);
      const spells: { [key: number]: number } = {
        ...fullCasterTable,
        1: 2, 2: 4 // El Hechicero tiene progresiÃ³n especial a nivel 1 y 2
      };
      return cantrips + (spells[lvl] || 2);
    }
    
    if (name.includes('bardo')) {
      const cantrips = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2);
      return cantrips + (fullCasterTable[lvl] || 4);
    }

    if (name.includes('clÃ©rigo') || name.includes('clerigo')) {
      const cantrips = lvl >= 10 ? 5 : (lvl >= 4 ? 4 : 3);
      return cantrips + (fullCasterTable[lvl] || 4);
    }

    if (name.includes('druida')) {
      const cantrips = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2);
      return cantrips + (fullCasterTable[lvl] || 4);
    }

    if (name.includes('mago')) {
      // Tabla exacta "Rasgos de Mago" One D&D 2024
      const magoCantrips: { [key: number]: number } = {
        1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4,
        10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5
      };
      const magoPreparados: { [key: number]: number } = {
        1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
        10: 15, 11: 16, 12: 16, 13: 17, 14: 18, 15: 19, 16: 21,
        17: 22, 18: 23, 19: 24, 20: 25
      };
      return (magoCantrips[lvl] || 3) + (magoPreparados[lvl] || 4);
    }

    if (name.includes('brujo')) {
      const cantrips = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2);
      return cantrips + (warlockTable[lvl] || 2);
    }

    if (name.includes('explorador')) {
      return halfCasterTable[lvl] || 2;
    }

    if (name.includes('paladÃ­n') || name.includes('paladin')) {
      return halfCasterTable[lvl] || 2;
    }

    if (name.includes('guerrero') && this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
      const cantrips = lvl >= 10 ? 3 : 2;
      return cantrips + (thirdCasterTable[lvl] || 0);
    }

    if (name.includes('pÃ­caro') || name.includes('picaro')) {
      if (this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
        const cantrips = lvl >= 10 ? 4 : 3;
        return cantrips + (thirdCasterTable[lvl] || 0);
      }
    }

    return 0;
  }

  getMaxSpellSlotLevel(): number {
    if (!this.character) return 0;
    const lvl = this.character.level || 1;
    const name = this.character.class.toLowerCase();

    // Lanzadores Completos (Full Casters): Mago, Hechicero, ClÃ©rigo, Druida, Bardo
    if (name.includes('mago') || name.includes('hechicero') || name.includes('clÃ©rigo') || name.includes('clerigo') || name.includes('druida') || name.includes('bardo')) {
      if (lvl >= 17) return 9;
      if (lvl >= 15) return 8;
      if (lvl >= 13) return 7;
      if (lvl >= 11) return 6;
      if (lvl >= 9) return 5;
      if (lvl >= 7) return 4;
      if (lvl >= 5) return 3;
      if (lvl >= 3) return 2;
      return 1;
    }

    // Brujo (Warlock - Pact Magic)
    if (name.includes('brujo')) {
      if (lvl >= 9) return 5;
      if (lvl >= 7) return 4;
      if (lvl >= 5) return 3;
      if (lvl >= 3) return 2;
      return 1;
    }

    // Semi-lanzadores (Half Casters): Explorador (Ranger) y PaladÃ­n (En D&D 2024 lanzan desde Nivel 1)
    if (name.includes('explorador') || name.includes('paladÃ­n') || name.includes('paladin')) {
      if (lvl >= 17) return 5;
      if (lvl >= 13) return 4;
      if (lvl >= 9) return 3;
      if (lvl >= 5) return 2;
      return 1;
    }

    // Lanzadores de Tercio (Third Casters): Guerrero Arcano, PÃ­caro Arcano
    if ((name.includes('guerrero') || name.includes('pÃ­caro') || name.includes('picaro')) && this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
      if (lvl >= 19) return 4;
      if (lvl >= 13) return 3;
      if (lvl >= 7) return 2;
      if (lvl >= 3) return 1;
      return 0;
    }

    return 5;
  }

  getAvailableSpellLevelTabs(): string[] {
    const maxSlotLevel = this.getMaxSpellSlotLevel();
    const tabs: string[] = ['Trucos'];
    for (let i = 1; i <= Math.min(maxSlotLevel, 9); i++) {
      tabs.push(`Nivel ${i}`);
    }
    return tabs;
  }

  getAvailableSpellLevelsForFilter(): string[] {
    return this.getAvailableSpellLevelTabs();
  }

  isSpellPreparedInTemp(spellName: string): boolean {
    return this.tempPreparedSpells.includes(spellName);
  }

  toggleSpellInTemp(spellName: string): void {
    if (this.isSpellPreparedInTemp(spellName)) {
      this.removeSpellFromTemp(spellName);
    } else {
      this.addSpellToTemp(spellName);
    }
  }

  cancelEditingSpells(): void {
    this.editSpellsMode = false;
  }

  startEditingSpells(): void {
    if (!this.character) return;
    this.tempPreparedSpells = [...(this.character.preparedSpells || [])];
    this.editSpellsMode = true;
    const availableTabs = this.getAvailableSpellLevelTabs();
    if (!availableTabs.includes(this.activeSpellFilterLevel)) {
      this.activeSpellFilterLevel = availableTabs[0] || 'Trucos';
    }
    this.cdr.detectChanges();
  }

  getTempCantripsCount(): number {
    return this.tempPreparedSpells.filter(name => {
      const s = this.spellsDataService.getSpellByName(name);
      return s && !s.level; // Cantrips have no level or level 0
    }).length;
  }

  getTempSpellsCount(): number {
    return this.tempPreparedSpells.filter(name => {
      const s = this.spellsDataService.getSpellByName(name);
      return s && s.level && s.level > 0;
    }).length;
  }

  getCharacterCantripsLimit(): number {
    if (!this.character) return 0;
    const cl = this.character.class.toLowerCase();
    const lvl = this.character.level || 1;
    if (cl.includes('bardo')) return this.spellsDataService.getBardCantripsLimit(lvl);
    if (cl.includes('brujo')) return this.spellsDataService.getWarlockCantripsLimit(lvl);
    if (cl.includes('clérigo') || cl.includes('clerigo')) return this.spellsDataService.getClericCantripsLimit(lvl);
    if (cl.includes('druida')) return this.spellsDataService.getDruidCantripsLimit(lvl);
    if (cl.includes('hechicero')) return this.spellsDataService.getSorcererCantripsLimit(lvl);
    if (cl.includes('mago')) return this.spellsDataService.getMagoCantripsLimit(lvl);
    return 0;
  }

  canSaveSpells(): boolean {
    return this.getTempCantripsCount() <= this.getCharacterCantripsLimit() && 
           this.getTempSpellsCount() <= this.getCharacterSpellLimit();
  }

  addSpellToTemp(spellName: string): void {
    const trimmed = spellName.trim();
    if (!trimmed) return;
    if (this.tempPreparedSpells.includes(trimmed)) return;

    const limit = this.getCharacterSpellLimit();
    if (this.tempPreparedSpells.length >= limit) {
      alert(`Has alcanzado el lÃ­mite mÃ¡ximo de ${limit} conjuros preparados para tu nivel.`);
      return;
    }

    this.tempPreparedSpells.push(trimmed);
    this.cdr.detectChanges();
  }

  removeSpellFromTemp(spellName: string): void {
    this.tempPreparedSpells = this.tempPreparedSpells.filter(s => s !== spellName);
    this.cdr.detectChanges();
  }

  saveSpells(): void {
    if (!this.character || !this.character.id) return;
    this.addLog('Guardando conjuros preparados en BD...');
    this.characterService.updateCharacter(this.character.id, { preparedSpells: this.tempPreparedSpells }).subscribe({
      next: (updated) => {
        this.addLog('Conjuros guardados con Ã©xito.');
        this.character = { ...this.character!, preparedSpells: updated.preparedSpells };
        this.editSpellsMode = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`Error al guardar conjuros: ${err.message || err}`);
        this.cdr.detectChanges();
      }
    });
  }

  viewFeatureInGlosary(featureName: string): void {
    this.selectedGlosaryTerm = featureName;
    this.activeTab = 4;
    this.cdr.detectChanges();
    setTimeout(() => {
      // Reemplazar espacios para concordar con el id de elemento
      const escaped = featureName.replace(/\s+/g, '-').replace(' ', '-');
      const element = document.getElementById('glosary-' + escaped);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  viewSpellInGlosary(spellName: string): void {
    this.selectedGlosaryTerm = spellName;
    this.activeTab = 4;
    this.cdr.detectChanges();
    setTimeout(() => {
      const escaped = spellName.replace(/\s+/g, '-').replace(' ', '-');
      const element = document.getElementById('glosary-' + escaped);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  getSpellDescription(spellName: string): string {
    return SPELL_DESCRIPTIONS_MAP[spellName] || 'DescripciÃ³n mÃ¡gica no detallada en este grimorio abreviado.';
  }

  isBarbarian(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('bÃ¡rbaro') || name.includes('barbaro');
  }

  isSorcerer(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('hechicero');
  }

  isFighter(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('guerrero');
  }

  isBard(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('bardo');
  }

  isWarlock(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('brujo');
  }

  isCleric(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('clÃ©rigo') || this.character.class.toLowerCase().includes('clerigo');
  }

  isDruid(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('druida');
  }

  isRanger(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('explorador');
  }

  isMonk(): boolean {
    if (!this.character) return false;
    return this.character.class.toLowerCase().includes('monje');
  }

  isPaladin(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('paladÃ­n') || name.includes('paladin');
  }

  isRogue(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('pÃ­caro') || name.includes('picaro') || name.includes('rogue');
  }

  // Rogue D&D 2024 calculations & interactive state
  rogueStrokeOfLuckUsed: boolean = false;
  rogueSteadyAimActive: boolean = false;

  getRogueSneakAttackDice(level: number): string {
    const diceCount = Math.ceil(level / 2);
    return `${diceCount}d6`;
  }

  getRogueCunningStrikeDC(): string {
    if (!this.character) return 'â€”';
    const dexMod = this.getFinalModifierValue('dexterity');
    return `${8 + dexMod + this.getProficiencyBonus()}`;
  }

  toggleSteadyAim(): void {
    this.rogueSteadyAimActive = !this.rogueSteadyAimActive;
    if (this.rogueSteadyAimActive) {
      this.addLog('PunterÃ­a Certera activada: Ventaja en tu prÃ³ximo ataque (velocidad reducida a 0).');
    }
    this.cdr.detectChanges();
  }

  toggleStrokeOfLuck(): void {
    this.rogueStrokeOfLuckUsed = !this.rogueStrokeOfLuckUsed;
    this.cdr.detectChanges();
  }

  // Paladin D&D 2024 calculations & interactive state
  paladinLayOnHandsSpent: number = 0;
  paladinChannelDivinitySpent: number = 0;
  paladinSmiteFreeUsed: boolean = false;
  paladinSteedFreeUsed: boolean = false;

  getPaladinLayOnHandsMax(level: number): number {
    return 5 * level;
  }

  getPaladinChannelDivinityMax(level: number): number {
    if (level < 3) return 0;
    return level >= 11 ? 3 : 2;
  }

  getPaladinAuraRange(level: number): string {
    return level >= 18 ? '9 m (30 ft)' : '3 m (10 ft)';
  }

  getPaladinAuraSaveBonus(): string {
    if (!this.character) return '+1';
    const chaMod = this.getFinalModifierValue('charisma');
    return chaMod >= 1 ? `+${chaMod}` : '+1';
  }

  getPaladinPreparedSpellsCount(level: number): number {
    if (level <= 1) return 2;
    if (level <= 2) return 3;
    if (level <= 3) return 4;
    if (level <= 4) return 5;
    if (level <= 6) return 6;
    if (level <= 8) return 7;
    if (level <= 10) return 9;
    if (level <= 12) return 10;
    if (level <= 14) return 11;
    if (level <= 16) return 12;
    if (level <= 18) return 14;
    return 15;
  }

  spendLayOnHands(amount: number = 5): void {
    if (!this.character) return;
    const max = this.getPaladinLayOnHandsMax(this.character.level);
    this.paladinLayOnHandsSpent = Math.min(max, this.paladinLayOnHandsSpent + amount);
    this.addLog(`Imponer las Manos utilizado: -${amount} HP de la reserva.`);
    this.cdr.detectChanges();
  }

  restoreLayOnHands(amount: number = 5): void {
    this.paladinLayOnHandsSpent = Math.max(0, this.paladinLayOnHandsSpent - amount);
    this.cdr.detectChanges();
  }

  restLayOnHands(): void {
    this.paladinLayOnHandsSpent = 0;
    this.cdr.detectChanges();
  }

  spendChannelDivinity(amount: number = 1): void {
    if (!this.character) return;
    const max = this.getPaladinChannelDivinityMax(this.character.level);
    this.paladinChannelDivinitySpent = Math.min(max, this.paladinChannelDivinitySpent + amount);
    this.addLog(`Canalizar Divinidad utilizado: -${amount} uso.`);
    this.cdr.detectChanges();
  }

  restChannelDivinity(): void {
    this.paladinChannelDivinitySpent = 0;
    this.cdr.detectChanges();
  }

  toggleSmiteFreeUse(): void {
    this.paladinSmiteFreeUsed = !this.paladinSmiteFreeUsed;
    this.cdr.detectChanges();
  }

  toggleSteedFreeUse(): void {
    this.paladinSteedFreeUsed = !this.paladinSteedFreeUsed;
    this.cdr.detectChanges();
  }

  // Monk calculations & interactive state
  monkFocusSpent: number = 0;
  deflectAttacksResult: { reduction: number; redirectDamage: number } | null = null;
  uncannyMetabolismResult: { hpHealed: number; focusRegained: boolean } | null = null;

  getMonkMartialArtsDie(level: number): string {
    if (level >= 17) return '1d12';
    if (level >= 11) return '1d10';
    if (level >= 5) return '1d8';
    return '1d6';
  }

  getMonkFocusPoints(level: number): number {
    return level;
  }

  getMonkUnarmoredMovement(level: number): string {
    if (level >= 18) return '+9 m (+30 ft)';
    if (level >= 14) return '+7.5 m (+25 ft)';
    if (level >= 10) return '+6 m (+20 ft)';
    if (level >= 6) return '+4.5 m (+15 ft)';
    if (level >= 2) return '+3 m (+10 ft)';
    return 'â€”';
  }

  getMonkFocusSaveDC(): string {
    if (!this.character) return 'â€”';
    const wisMod = this.getFinalModifierValue('wisdom');
    return `${8 + wisMod + this.getProficiencyBonus()}`;
  }

  spendMonkFocus(amount: number = 1): void {
    if (!this.character) return;
    const max = this.getMonkFocusPoints(this.character.level);
    this.monkFocusSpent = Math.min(max, this.monkFocusSpent + amount);
    this.cdr.detectChanges();
  }

  restoreMonkFocus(amount: number = 1): void {
    this.monkFocusSpent = Math.max(0, this.monkFocusSpent - amount);
    this.cdr.detectChanges();
  }

  restMonkFocus(): void {
    this.monkFocusSpent = 0;
    this.cdr.detectChanges();
  }

  rollUncannyMetabolism(): void {
    if (!this.character) return;
    const dieStr = this.getMonkMartialArtsDie(this.character.level);
    const dieMax = Number(dieStr.replace('1d', '')) || 6;
    const dieRoll = Math.floor(Math.random() * dieMax) + 1;
    const hpHealed = dieRoll + this.character.level;
    this.monkFocusSpent = 0;
    this.uncannyMetabolismResult = { hpHealed, focusRegained: true };
    this.addLog(`Metabolismo Asombroso ejecutado: recupera ${hpHealed} HP (1d${dieMax}: ${dieRoll} + ${this.character.level}) y todos los Puntos de ConcentraciÃ³n.`);
    this.cdr.detectChanges();
  }

  rollDeflectAttacks(): void {
    if (!this.character) return;
    const dexMod = this.getFinalModifierValue('dexterity');
    const roll1d10 = Math.floor(Math.random() * 10) + 1;
    const reduction = roll1d10 + dexMod + this.character.level;
    
    const dieStr = this.getMonkMartialArtsDie(this.character.level);
    const dieMax = Number(dieStr.replace('1d', '')) || 6;
    const r1 = Math.floor(Math.random() * dieMax) + 1;
    const r2 = Math.floor(Math.random() * dieMax) + 1;
    const redirectDamage = r1 + r2 + dexMod;
    
    this.deflectAttacksResult = { reduction, redirectDamage };
    this.addLog(`Desviar Ataques ejecutado: reduce ${reduction} daÃ±o. DaÃ±o redirigido: ${redirectDamage}.`);
    this.cdr.detectChanges();
  }

  getCalculatedArmorClass(): number {
    if (!this.character) return 10;
    const dexMod = this.getFinalModifierValue('dexterity');
    const wisMod = this.getFinalModifierValue('wisdom');
    const conMod = this.getFinalModifierValue('constitution');
    
    const armors = this.getEquippedArmorsDetails();
    const hasShield = armors.some(a => a.name.toLowerCase().includes('escudo'));
    const bodyArmor = armors.find(a => !a.name.toLowerCase().includes('escudo'));
    
    if (this.isMonk() && !bodyArmor && !hasShield) {
      return 10 + dexMod + wisMod;
    }
    
    if (this.isBarbarian() && !bodyArmor) {
      const shieldBonus = hasShield ? 2 : 0;
      return 10 + dexMod + conMod + shieldBonus;
    }
    
    if (bodyArmor) {
      let baseAC = 10 + dexMod;
      if (bodyArmor.ca.includes('16')) baseAC = 16;
      else if (bodyArmor.ca.includes('14')) baseAC = 14 + Math.min(2, dexMod);
      else if (bodyArmor.ca.includes('11')) baseAC = 11 + dexMod;
      else if (bodyArmor.ca.includes('12')) baseAC = 12 + dexMod;
      const shieldBonus = hasShield ? 2 : 0;
      return baseAC + shieldBonus;
    }
    
    return 10 + dexMod + (hasShield ? 2 : 0);
  }

  // Hacer Math disponible en la plantilla
  Math = Math;
  mathFloor(val: number): number {
    return Math.floor(val);
  }

  // Estado del Modal de Puntos de Golpe (HP)
  rolledHp: number | null = null;
  hpChoiceType: 'average' | 'roll' | null = null;

  getClassHitDie(): number {
    if (!this.character) return 8;
    const name = this.character.class.toLowerCase();
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro')) return 12;
    if (name.includes('guerrero') || name.includes('paladÃ­n') || name.includes('paladin')) return 10;
    if (name.includes('mago') || name.includes('hechicero')) return 6;
    return 8; // Bardo, Brujo, ClÃ©rigo, Druida, Explorador, PÃ­caro, Monje
  }

  getLevelUpHpBonus(): number {
    let bonus = 0;
    if (this.isDwarfCharacter()) bonus += 1;
    if (this.hasToughFeat()) bonus += 2;
    if (this.character && this.isSorcerer() && this.character.subclass && (this.character.subclass.toLowerCase().includes('dracÃ³nica') || this.character.subclass.toLowerCase().includes('draconica'))) {
      if (this.character.level >= 3) {
        bonus += 1;
      }
    }
    return bonus;
  }

  openLevelUpModal(): void {
    this.hpChoiceType = null;
    this.rolledHp = null;
    this.showLevelUpModal = true;
    this.cdr.detectChanges();
  }

  selectAverageHp(): void {
    if (!this.character) return;
    const hitDie = this.getClassHitDie();
    const conMod = this.getFinalModifierValue('constitution');
    const avgIncrease = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
    const bonus = this.getLevelUpHpBonus();
    const totalIncrease = avgIncrease + bonus;

    this.character.level++;
    this.character.hp += totalIncrease;
    this.saveCharacterLevel();
    this.showLevelUpModal = false;
    this.cdr.detectChanges();
  }

  rollHpDie(): void {
    const hitDie = this.getClassHitDie();
    this.rolledHp = Math.floor(Math.random() * hitDie) + 1;
    this.hpChoiceType = 'roll';
    this.cdr.detectChanges();
  }

  confirmRolledHp(): void {
    if (!this.character || this.rolledHp === null) return;
    const conMod = this.getFinalModifierValue('constitution');
    const rollIncrease = Math.max(1, this.rolledHp + conMod);
    const bonus = this.getLevelUpHpBonus();
    const totalIncrease = rollIncrease + bonus;

    this.character.level++;
    this.character.hp += totalIncrease;
    this.saveCharacterLevel();
    this.showLevelUpModal = false;
    this.cdr.detectChanges();
  }

  getHitDieValue(): number {
    if (!this.character) return 8;
    return this.getClassData(this.character.class).hitDie;
  }

  calculateMaxHp(): number {
    if (!this.character) return 10;
    const hitDie = this.getHitDieValue();
    const conMod = this.getFinalModifierValue('constitution');
    const level = this.character.level || 1;
    
    let baseHp = Math.max(1, hitDie + conMod);
    if (level > 1) {
      const avgHitDie = Math.floor(hitDie / 2) + 1;
      baseHp += Math.max(1, avgHitDie + conMod) * (level - 1);
    }
    
    if (this.isDwarfCharacter()) {
      baseHp += level;
    }
    
    if (this.hasToughFeat()) {
      baseHp += 2 * level;
    }

    if (this.isSorcerer() && this.character.subclass && (this.character.subclass.toLowerCase().includes('dracÃ³nica') || this.character.subclass.toLowerCase().includes('draconica'))) {
      if (level >= 3) {
        baseHp += level;
      }
    }
    
    return baseHp;
  }

  hpAdjustAmount: number = 1;

  getMaxHp(): number {
    return this.calculateMaxHp();
  }

  getCurrentHp(): number {
    if (!this.character) return 0;
    const maxHp = this.getMaxHp();
    if (this.character.currentHp === undefined || this.character.currentHp === null) {
      return maxHp;
    }
    return Math.min(maxHp, Math.max(0, this.character.currentHp));
  }

  applyHpDamage(): void {
    const amount = Math.abs(Number(this.hpAdjustAmount)) || 1;
    this.modifyCurrentHp(-amount);
  }

  applyHpHeal(): void {
    const amount = Math.abs(Number(this.hpAdjustAmount)) || 1;
    this.modifyCurrentHp(amount);
  }

  modifyCurrentHp(amount: number): void {
    if (!this.character) return;
    const maxHp = this.getMaxHp();
    const current = this.getCurrentHp();
    const newHp = Math.min(maxHp, Math.max(0, current + amount));
    this.character = { ...this.character, currentHp: newHp };
    this.saveCurrentHpToBackend(newHp);
    this.cdr.detectChanges();
  }

  setExactCurrentHp(value: number): void {
    if (!this.character) return;
    const maxHp = this.getMaxHp();
    const newHp = Math.min(maxHp, Math.max(0, value));
    this.character = { ...this.character, currentHp: newHp };
    this.saveCurrentHpToBackend(newHp);
    this.cdr.detectChanges();
  }

  restFullHeal(): void {
    if (!this.character) return;
    const maxHp = this.getMaxHp();
    this.character = { ...this.character, currentHp: maxHp };
    this.saveCurrentHpToBackend(maxHp);
    this.addLog(`Descanso completo realizado: PG restaurados al 100% (${maxHp} HP).`);
    this.cdr.detectChanges();
  }

  private saveCurrentHpToBackend(hpValue: number): void {
    if (!this.character || !this.character.id) return;
    this.characterService.updateCharacter(this.character.id, { currentHp: hpValue }).subscribe({
      next: (updated) => {
        if (this.character) {
          const finalHp = (updated && updated.currentHp !== undefined && updated.currentHp !== null) ? updated.currentHp : hpValue;
          this.character = { ...this.character, currentHp: finalHp };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`Error al actualizar HP actual en BD: ${err.message || JSON.stringify(err)}`);
      }
    });
  }

  getHpBarPercentage(): number {
    const max = this.getMaxHp();
    if (max <= 0) return 100;
    const current = this.getCurrentHp();
    return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
  }

  getHpBarColorClass(): string {
    const pct = this.getHpBarPercentage();
    if (pct > 50) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (pct > 25) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse';
  }

  hasHeroicInspiration(): boolean {
    return !!this.character?.heroicInspiration;
  }

  toggleHeroicInspiration(): void {
    if (!this.character) return;
    const newState = !this.hasHeroicInspiration();
    this.character = { ...this.character, heroicInspiration: newState };
    if (newState) {
      this.addLog('âœ¨ Has ganado InspiraciÃ³n Heroica.');
    } else {
      this.addLog('ðŸŽ² Has utilizado tu InspiraciÃ³n Heroica.');
    }
    this.saveHeroicInspirationToBackend(newState);
    this.cdr.detectChanges();
  }

  private saveHeroicInspirationToBackend(state: boolean): void {
    if (!this.character || !this.character.id) return;
    this.characterService.updateCharacter(this.character.id, { heroicInspiration: state }).subscribe({
      next: (updated) => {
        if (this.character) {
          const finalState = (updated && updated.heroicInspiration !== undefined && updated.heroicInspiration !== null) ? updated.heroicInspiration : state;
          this.character = { ...this.character, heroicInspiration: finalState };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`Error al guardar InspiraciÃ³n: ${err.message || JSON.stringify(err)}`);
      }
    });
  }

  isDwarfCharacter(): boolean {
    if (!this.character) return false;
    return (this.character.race || '').toLowerCase().includes('enano');
  }

  hasToughFeat(): boolean {
    if (!this.character) return false;
    const feat = (this.getBackgroundData(this.character.background).keyFeat || '').toLowerCase();
    return feat.includes('tough') || feat.includes('dureza') || feat.includes('duro');
  }

  getSubclassesForClass(className: string): string[] {
    const name = (className || '').toLowerCase().trim();
    if (name.includes('hechicero')) {
      return ['HechicerÃ­a aberrante', 'HechicerÃ­a de magia salvaje', 'HechicerÃ­a dracÃ³nica', 'HechicerÃ­a mecÃ¡nica'];
    }
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro')) {
      return ['Senda del Ãrbol del Mundo', 'Senda del Berserker', 'Senda del CorazÃ³n Salvaje', 'Senda del FanÃ¡tico'];
    }
    if (name.includes('bardo')) {
      return ['Colegio de la Danza', 'Colegio del Conocimiento', 'Colegio del Glamour', 'Colegio del Valor'];
    }
    if (name.includes('brujo')) {
      return ['PatrÃ³n Celestial', 'PatrÃ³n FeÃ©rico', 'PatrÃ³n Infernal', 'PatrÃ³n Primigenio'];
    }
    if (name.includes('clÃ©rigo') || name.includes('clerigo')) {
      return ['Dominio de la Guerra', 'Dominio de la Luz', 'Dominio de la Vida', 'Dominio del EngaÃ±o'];
    }
    if (name.includes('druida')) {
      return ['CÃ­rculo de la Luna', 'CÃ­rculo de la Tierra (Ãrido)', 'CÃ­rculo de la Tierra (Polar)', 'CÃ­rculo de la Tierra (Templado)', 'CÃ­rculo de la Tierra (Tropical)', 'CÃ­rculo de las Estrellas', 'CÃ­rculo del Mar'];
    }
    if (name.includes('explorador')) {
      return ['Acechador en la penumbra', 'Cazador', 'Errante feÃ©rico', 'SeÃ±or de las bestias'];
    }
    if (name.includes('guerrero')) {
      return ['Caballero Arcano', 'CampeÃ³n', 'Guerrero PsiÃ³nico', 'Maestro del Combate'];
    }
    if (name.includes('mago')) {
      return ['Abjurador', 'Adivino', 'Evocador', 'Ilusionista'];
    }
    if (name.includes('paladÃ­n') || name.includes('paladin')) {
      return ['Juramento de entrega', 'Juramento de la gloria', 'Juramento de los antiguos', 'Juramento de venganza'];
    }
    if (name.includes('monje')) {
      return ['Guerrero de la Mano Abierta', 'Guerrero de la Misericordia', 'Guerrero de la Sombra', 'Guerrero de los Elementos'];
    }
    if (name.includes('pÃ­caro') || name.includes('picaro') || name.includes('rogue')) {
      return ['Asesino', 'Embaucador arcano', 'LadrÃ³n', 'Rebanaalmas'];
    }
    return [];
  }

  onSubclassChange(newSubclass: string): void {
    if (!this.character || !this.character.id) return;
    this.addLog(`Guardando nueva subclase "${newSubclass}" en BD...`);
    this.characterService.updateCharacter(this.character.id, { subclass: newSubclass }).subscribe({
      next: (updated) => {
        this.addLog(`Subclase actualizada en BD con Ã©xito a: ${updated.subclass}`);
        this.character = { ...this.character!, subclass: updated.subclass };
        this.subclassChoiceRequired = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`ERROR al actualizar subclase: ${err.message || err}`);
        this.cdr.detectChanges();
      }
    });
  }

  getSorcererPoints(level: number): number {
    return level;
  }

  getMetamagicDescription(name: string): string {
    return METAMAGIC_DESCRIPTIONS_MAP[name] || 'Sin descripciÃ³n disponible.';
  }

  getProficiencyBonus(): number {
    if (!this.character) return 2;
    const lvl = this.character.level || 1;
    return Math.floor((lvl - 1) / 4) + 2;
  }

  decreaseLevel(): void {
    if (!this.character) return;
    if (this.character.level > 1) {
      const hitDie = this.getClassHitDie();
      const conMod = this.getFinalModifierValue('constitution');
      const avgIncrease = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
      const bonus = this.getLevelUpHpBonus();
      const totalDecrease = avgIncrease + bonus;

      this.character.level--;
      this.character.hp = Math.max(1, this.character.hp - totalDecrease);
      this.saveCharacterLevel();
    }
  }

  increaseLevel(): void {
    if (!this.character) return;
    if (this.character.level === 3 && (!this.character.subclass || this.character.subclass.trim() === '')) {
      this.subclassChoiceRequired = true;
      this.addLog('Bloqueado: Debes elegir una subclase antes de subir a Nivel 4.');
      this.cdr.detectChanges();
      return;
    }
    this.subclassChoiceRequired = false;
    if (this.character.level < 20) {
      this.openLevelUpModal();
    }
  }

  saveCharacterLevel(): void {
    if (!this.character || !this.character.id) return;
    const updatedHp = this.calculateMaxHp();
    const newCurrentHp = updatedHp;
    this.addLog(`Guardando nuevo nivel ${this.character.level} y HP MÃ¡ximos ${updatedHp} en BD...`);
    this.characterService.updateCharacter(this.character.id, { level: this.character.level, hp: updatedHp, currentHp: newCurrentHp }).subscribe({
      next: (updated) => {
        this.addLog(`Nivel actualizado en BD con Ã©xito a ${updated.level} y HP a ${updated.hp}`);
        this.character = { ...this.character!, level: updated.level, hp: updated.hp, currentHp: updated.currentHp ?? updatedHp };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`Error al guardar nivel: ${err.message || JSON.stringify(err)}`);
      }
    });
  }

  onSubclassSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select) {
      this.onSubclassChange(select.value);
    }
  }

  // Variables y mÃ©todos del simulador de Sobrecarga de Magia Salvaje y ManifestaciÃ³n del Orden
  wildMagicRoll: number | null = null;
  wildMagicEffect: string | null = null;
  orderRoll: number | null = null;
  orderEffect: string | null = null;

  rollWildMagic(): void {
    this.wildMagicRoll = Math.floor(Math.random() * 100) + 1;
    this.wildMagicEffect = this.getWildMagicEffectDescription(this.wildMagicRoll);
    this.addLog(`Tirada de Sobrecarga de Magia Salvaje (1d100): ${this.wildMagicRoll}`);
    this.cdr.detectChanges();
  }

  rollOrderManifestation(): void {
    this.orderRoll = Math.floor(Math.random() * 6) + 1;
    this.orderEffect = this.getOrderManifestationDescription(this.orderRoll);
    this.addLog(`Tirada de ManifestaciÃ³n del Orden (1d6): ${this.orderRoll}`);
    this.cdr.detectChanges();
  }

  getWildMagicEffectDescription(roll: number): string {
    if (roll >= 1 && roll <= 4) return 'Tira en esta tabla al inicio de cada uno de tus turnos durante el prÃ³ximo minuto (10 turnos).';
    if (roll >= 5 && roll <= 8) return 'Una criatura amistosa aleatoria aparece a 18 m de ti en un espacio desocupado (como un Modron, un Flumph o un Unicornio) y desaparece tras 1 minuto.';
    if (roll >= 9 && roll <= 12) return 'Recuperas 5 puntos de golpe al inicio de cada uno de tus turnos durante 1 minuto.';
    if (roll >= 13 && roll <= 16) return 'Los enemigos tienen desventaja contra la salvaciÃ³n de tu prÃ³ximo conjuro que requiera tirada de salvaciÃ³n.';
    if (roll >= 17 && roll <= 20) return 'Tira 1d8 para un efecto aleatorio gracioso (aumento de tamaÃ±o, plumas, gritar mariposas, burbujas en la boca, piel azul, etc.).';
    if (roll >= 21 && roll <= 24) return 'Los conjuros que lances durante el prÃ³ximo minuto tienen un tiempo de ejecuciÃ³n de 1 acciÃ³n adicional.';
    if (roll >= 25 && roll <= 28) return 'Te teletransportas al Plano Astral hasta el final de tu prÃ³ximo turno, regresando al mismo espacio u otro desocupado mÃ¡s cercano.';
    if (roll >= 29 && roll <= 32) return 'El prÃ³ximo conjuro daÃ±ino que lances antes del final de tu turno causa el mÃ¡ximo daÃ±o posible.';
    if (roll >= 33 && roll <= 36) return 'Obtienes resistencia a todo el daÃ±o durante el prÃ³ximo minuto.';
    if (roll >= 37 && roll <= 40) return 'Te transformas en una planta en una maceta hasta el principio de tu siguiente turno. Eres vulnerable a todo el daÃ±o e incapacitado. Si tus HP caen a 0, se rompe la maceta y vuelves a tu forma.';
    if (roll >= 41 && roll <= 44) return 'Durante el prÃ³ximo minuto, puedes teletransportarte hasta 6 m como acciÃ³n adicional durante cada uno de tus turnos.';
    if (roll >= 45 && roll <= 48) return 'TÃº y hasta tres criaturas que elijas a 9 m tenÃ©is el estado de invisibles durante 1 minuto. Termina si atacas, causas daÃ±o o lanzas conjuro.';
    if (roll >= 49 && roll <= 52) return 'Un escudo espectral levita cerca de ti por 1 minuto, otorgando +2 a la CA e inmunidad a proyectil mÃ¡gico.';
    if (roll >= 53 && roll <= 56) return 'Puedes realizar una acciÃ³n extra durante este turno.';
    if (roll >= 57 && roll <= 60) return 'Lanzas un conjuro aleatorio (1d10: 1: bola de fuego, 2: confusiÃ³n, 3: grasa, 4: imagen mÃºltiple, 5: levitar, 6: nube de oscurecimiento, 7: polimorfar en cabra si fallas salvaciÃ³n, 8: proyectil mÃ¡gico nvl 5, 9: ver invisibilidad, 10: volar). No requiere concentraciÃ³n y dura su tiempo total.';
    if (roll >= 61 && roll <= 64) return 'Cualquier objeto no mÃ¡gico inflamable que toques se prende fuego, sufre 1d4 daÃ±o de fuego y arde por 1 minuto.';
    if (roll >= 65 && roll <= 68) return 'Si mueres durante la prÃ³xima hora, revives inmediatamente como con el conjuro reencarnar.';
    if (roll >= 69 && roll <= 72) return 'Tienes el estado de asustado hasta el final de tu siguiente turno. Tu DM establece el motivo.';
    if (roll >= 73 && roll <= 76) return 'Te teletransportas hasta 18 m a un espacio desocupado visible.';
    if (roll >= 77 && roll <= 80) return 'Una criatura aleatoria a 18 m queda envenenada por 1d4 horas.';
    if (roll >= 81 && roll <= 84) return 'Emites luz brillante en 9 m por 1 minuto. Quien termine su turno a 1,5 m de ti queda cegado hasta su siguiente turno.';
    if (roll >= 85 && roll <= 88) return 'Hasta tres criaturas a 9 m sufren 1d10 daÃ±o necrÃ³tico y te sanas esa cantidad.';
    if (roll >= 89 && roll <= 92) return 'Hasta tres criaturas a 9 m sufren 4d10 daÃ±o de relÃ¡mpago.';
    if (roll >= 93 && roll <= 96) return 'TÃº y todos a 9 m tenÃ©is vulnerabilidad al daÃ±o perforante por 1 minuto.';
    return 'Tira 1d6: 1: recuperas 2d10 HP, 2: aliado a 90 m recupera 2d10 HP, 3: recuperas espacio de conjuro menor, 4: aliado recupera espacio de conjuro menor, 5: recuperas todos tus puntos de hechicerÃ­a, 6: se aplican todos los efectos de la fila 17-20.';
  }

  getOrderManifestationDescription(roll: number): string {
    if (roll === 1) return 'Unos engranajes espectrales levitan tras de ti.';
    if (roll === 2) return 'Las manecillas de un reloj giran en tus ojos.';
    if (roll === 3) return 'Tu piel resplandece con un brillo metÃ¡lico.';
    if (roll === 4) return 'Objetos geomÃ©tricos y ecuaciones flotantes recubren tu cuerpo.';
    if (roll === 5) return 'Tu canalizador mÃ¡gico adopta temporariamente la forma de un mecanismo de relojerÃ­a Diminuto.';
    return 'Tanto tÃº como aquellos afectados por tu magia podÃ©is escuchar el tictac de los engranajes o el timbre de un reloj.';
  }

  getBarbarianRagesCount(level: number): number {
    if (level <= 2) return 2;
    if (level <= 6) return 3;
    if (level <= 11) return 4;
    if (level <= 16) return 5;
    return 6;
  }

  getBarbarianRageDamage(level: number): string {
    if (level <= 8) return '+2';
    if (level <= 15) return '+3';
    return '+4';
  }

  getBarbarianWeaponMasteries(level: number): number {
    if (level <= 3) return 2;
    if (level <= 9) return 3;
    return 4;
  }

  getActiveFeatures(): string[] {
    if (!this.character) return [];
    const level = this.character.level || 1;
    
    let progressMap: { [key: number]: { features: string[] } } = {};
    if (this.isBarbarian()) {
      progressMap = BARBARIAN_PROGRESS_MAP;
    } else if (this.isSorcerer()) {
      progressMap = SORCERER_PROGRESS_MAP;
    } else if (this.isFighter()) {
      progressMap = FIGHTER_PROGRESS_MAP;
    } else if (this.isBard()) {
      progressMap = BARD_PROGRESS_MAP;
    } else if (this.isWarlock()) {
      progressMap = WARLOCK_PROGRESS_MAP;
    } else if (this.isCleric()) {
      progressMap = CLERIC_PROGRESS_MAP;
    } else if (this.isDruid()) {
      progressMap = DRUID_PROGRESS_MAP;
    } else if (this.isRanger()) {
      progressMap = RANGER_PROGRESS_MAP;
    } else if (this.isMonk()) {
      progressMap = MONK_PROGRESS_MAP;
    } else if (this.isPaladin()) {
      progressMap = PALADIN_PROGRESS_MAP;
    } else if (this.isRogue()) {
      progressMap = ROGUE_PROGRESS_MAP;
    } else {
      // Fallback genÃ©rico de progresiÃ³n para clases sin mapa especÃ­fico
      progressMap = {
        1: { features: ['Lanzamiento de conjuros' ] },
        3: { features: ['Subclase'] }
      };
    }

    const active: string[] = [];
    for (let l = 1; l <= level; l++) {
      const step = progressMap[l];
      if (step && step.features) {
        step.features.forEach(f => {
          if (!active.includes(f)) {
            active.push(f);
          }
        });
      }
    }

    if (this.isMonk() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('mano abierta')) {
        if (level >= 3) active.push('TÃ©cnica de la mano abierta');
        if (level >= 6) active.push('Plenitud de cuerpo');
        if (level >= 11) active.push('Paso veloz');
        if (level >= 17) active.push('Palma estremecedora');
      } else if (sub.includes('misericordia')) {
        if (level >= 3) {
          active.push('Instrumentos de misericordia');
          active.push('Mano de aflicciÃ³n');
          active.push('Mano de curaciÃ³n');
        }
        if (level >= 6) active.push('Toque de Galeno');
        if (level >= 11) active.push('RÃ¡faga de curaciÃ³n y aflicciÃ³n');
        if (level >= 17) active.push('Mano de misericordia suprema');
      } else if (sub.includes('sombra')) {
        if (level >= 3) active.push('Artes sombrÃ­as');
        if (level >= 6) active.push('Paso entre sombras');
        if (level >= 11) active.push('Paso entre sombras mejorado');
        if (level >= 17) active.push('Capa de sombras');
      } else if (sub.includes('elementos')) {
        if (level >= 3) {
          active.push('ArmonÃ­a con los elementos');
          active.push('Manipular los elementos');
        }
        if (level >= 6) active.push('ExplosiÃ³n elemental');
        if (level >= 11) active.push('Paso de los elementos');
      }
    }

    if (this.isPaladin() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('entrega') || sub.includes('devociÃ³n') || sub.includes('devocion')) {
        if (level >= 3) {
          active.push('Arma sagrada');
          active.push('Conjuros del juramento de entrega');
        }
        if (level >= 7) active.push('Aura de entrega');
        if (level >= 15) active.push('Castigo protector');
        if (level >= 20) active.push('Halo sagrado');
      } else if (sub.includes('gloria')) {
        if (level >= 3) {
          active.push('Atleta sin parangÃ³n');
          active.push('Castigo inspirador');
          active.push('Conjuros del juramento de gloria');
        }
        if (level >= 7) active.push('Aura de celeridad');
        if (level >= 15) active.push('Defensa gloriosa');
        if (level >= 20) active.push('Leyenda viviente');
      } else if (sub.includes('antiguos')) {
        if (level >= 3) {
          active.push('Ira de la naturaleza');
          active.push('Conjuros del juramento de los antiguos');
        }
        if (level >= 7) active.push('Aura de salvaguarda');
        if (level >= 15) active.push('Centinela imperecedero');
        if (level >= 20) active.push('CampeÃ³n ancestral');
      } else if (sub.includes('venganza')) {
        if (level >= 3) {
          active.push('Voto de enemistad');
          active.push('Conjuros del juramento de venganza');
        }
        if (level >= 7) active.push('Vengador implacable');
        if (level >= 15) active.push('EspÃ­ritu vengativo');
      }
    }

    if (this.isRogue() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('asesino')) {
        if (level >= 3) {
          active.push('Asesinar');
          active.push('Herramientas de asesino');
        }
        if (level >= 9) active.push('Pericia en infiltrarse');
        if (level >= 13) active.push('Envenenar armas');
        if (level >= 17) active.push('Golpe mortal');
      } else if (sub.includes('embaucador') || sub.includes('arcano')) {
        if (level >= 3) {
          active.push('Lanzamiento de conjuros (Embaucador arcano)');
          active.push('Destreza con mano de mago');
        }
        if (level >= 9) active.push('Emboscada mÃ¡gica');
        if (level >= 13) active.push('Embaucador versÃ¡til');
        if (level >= 17) active.push('LadrÃ³n de conjuros');
      } else if (sub.includes('ladrÃ³n') || sub.includes('ladron')) {
        if (level >= 3) {
          active.push('Balconero');
          active.push('Manos rÃ¡pidas');
        }
        if (level >= 9) active.push('Sigilo supremo');
        if (level >= 13) active.push('Usar objetos mÃ¡gicos');
        if (level >= 17) active.push('Reflejos de ladrÃ³n');
      } else if (sub.includes('rebanaalmas') || sub.includes('soulknife')) {
        if (level >= 3) {
          active.push('Cuchillas psÃ­quicas');
          active.push('Poder psiÃ³nico');
        }
        if (level >= 9) active.push('Cuchillas del alma');
        if (level >= 13) active.push('Velo psÃ­quico');
        if (level >= 17) active.push('Desgarro mental');
      }
    }

    if (this.isSorcerer() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('aberrante')) {
        if (level >= 3) {
          active.push('Mente telepÃ¡tica');
          active.push('Conjuros psiÃ³nicos');
        }
        if (level >= 6) {
          active.push('Defensas psÃ­quicas');
          active.push('HechicerÃ­a psiÃ³nica');
        }
        if (level >= 14) active.push('RevelaciÃ³n en carne');
        if (level >= 18) active.push('ImplosiÃ³n deformadora');
      } else if (sub.includes('salvaje')) {
        if (level >= 3) {
          active.push('Mareas del caos');
          active.push('Sobrecarga de magia salvaje');
        }
        if (level >= 6) active.push('Doblegar la suerte');
        if (level >= 14) active.push('Caos controlado');
        if (level >= 18) active.push('Sobrecarga domada');
      } else if (sub.includes('dracÃ³nica') || sub.includes('draconica')) {
        if (level >= 3) {
          active.push('Resiliencia dracÃ³nica');
          active.push('Conjuros dracÃ³nicos');
        }
        if (level >= 6) active.push('Afinidad elemental');
        if (level >= 14) active.push('Alas de dragÃ³n');
        if (level >= 18) active.push('CompaÃ±ero dragÃ³n');
      } else if (sub.includes('mecÃ¡nica') || sub.includes('mecanica')) {
        if (level >= 3) {
          active.push('Restablecer equilibrio');
          active.push('Conjuros mecÃ¡nicos');
        }
        if (level >= 6) active.push('BastiÃ³n de la ley');
        if (level >= 14) active.push('Trance de orden');
        if (level >= 18) active.push('Cabalgata mecÃ¡nica');
      }
    }

    if (this.isFighter() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('campeÃ³n') || sub.includes('campeon')) {
        if (level >= 3) active.push('CrÃ­tico mejorado');
        if (level >= 7) active.push('Atleta notable');
        if (level >= 10) active.push('Estilo de combate adicional');
        if (level >= 15) active.push('CrÃ­tico superior');
        if (level >= 18) active.push('Superviviente (CampeÃ³n)');
      } else if (sub.includes('arcano')) {
        if (level >= 3) {
          active.push('Lanzamiento de conjuros (Arcano)');
          active.push('VÃ­nculo con el arma');
        }
        if (level >= 7) active.push('Magia de guerra');
        if (level >= 10) active.push('Embate de carga');
        if (level >= 15) active.push('Teletransporte arcano');
        if (level >= 18) active.push('Magia de guerra mejorada');
      } else if (sub.includes('psiÃ³nico') || sub.includes('psionico')) {
        if (level >= 3) {
          active.push('Poder psiÃ³nico');
          active.push('Fuerza telequinÃ©tica');
          active.push('Escudo mental');
        }
        if (level >= 7) active.push('Salto psiÃ³nico');
        if (level >= 10) active.push('Baluarte guardiÃ¡n');
        if (level >= 15) active.push('Empuje psiÃ³nico');
        if (level >= 18) active.push('Mente psiÃ³nica suprema');
      } else if (sub.includes('combate')) {
        if (level >= 3) {
          active.push('Dados de supremacÃ­a');
          active.push('Maniobras de combate');
          active.push('Estudiante de la guerra');
        }
        if (level >= 7) active.push('Conoce a tu enemigo');
        if (level >= 10) active.push('SupremacÃ­a mejorada');
        if (level >= 15) active.push('Implacable');
        if (level >= 18) active.push('SupremacÃ­a definitiva');
      }
    }

    // Agregar resoluciÃ³n dinÃ¡mica genÃ©rica para cualquier otra subclase de las otras clases
    if (this.character.subclass) {
      const sub = this.character.subclass.trim();
      // Si el rasgo no estÃ¡ en la lista general, agregamos el indicador de subclase elegida
      const label = `Rasgo de Subclase: ${sub}`;
      if (!active.includes(label)) {
        active.push(label);
      }
    }

    return active;
  }

  toggleFeature(featureName: string): void {
    this.expandedFeatures[featureName] = !this.expandedFeatures[featureName];
  }

  isFeatureExpanded(featureName: string): boolean {
    return !!this.expandedFeatures[featureName];
  }

  getFeatureDescription(featureName: string): string {
    return FEATURE_DESCRIPTIONS_MAP[featureName] || 'DescripciÃ³n del rasgo de clase en el manual.';
  }

  addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    this.debugLogs.push(`[${time}] ${msg}`);
    console.log(`[DEBUG] ${msg}`);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.addLog('ngOnInit iniciado.');
    const snapshotId = this.route.snapshot.paramMap.get('id');
    this.addLog(`ID del snapshot de ruta: ${snapshotId}`);

    this.route.paramMap.subscribe({
      next: (params) => {
        const id = params.get('id');
        this.addLog(`ID del observable paramMap: ${id}`);
        if (id) {
          this.loadCharacter(id);
        } else {
          this.addLog('ADVERTENCIA: Â¡No se encontrÃ³ ID en los parÃ¡metros de ruta!');
          this.errorLoading = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.addLog(`ERROR en paramMap: ${err.message || err}`);
        this.cdr.detectChanges();
      }
    });
  }

  loadCharacter(id: string): void {
    this.addLog(`Llamando a characterService.getCharacterById para ID: ${id}`);
    this.characterService.getCharacterById(id).subscribe({
      next: (char) => {
        this.addLog(`Personaje recibido con Ã©xito: ${char ? char.name : 'null'}`);
        this.character = char;
        if (this.character && (this.character.currentHp === undefined || this.character.currentHp === null)) {
          this.character.currentHp = this.calculateMaxHp();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errMsg = err?.message || JSON.stringify(err);
        this.addLog(`ERROR al obtener personaje de la API: ${errMsg}`);
        this.errorLoading = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadPdf(): void {
    window.print();
  }

  getModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  getFinalModifierValue(key: string): number {
    if (!this.character) return 0;
    const score = this.character.stats[key.toLowerCase() as keyof typeof this.character.stats] || 10;
    return Math.floor((score - 10) / 2);
  }

  getFinalModifier(key: string): string {
    const mod = this.getFinalModifierValue(key);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  getAttributesArray(char: Character): { name: string; key: string; keyLow: string; value: number }[] {
    if (!char || !char.stats) return [];
    return [
      { name: 'Fuerza', key: 'FUE', keyLow: 'strength', value: char.stats.strength },
      { name: 'Destreza', key: 'DES', keyLow: 'dexterity', value: char.stats.dexterity },
      { name: 'ConstituciÃ³n', key: 'CON', keyLow: 'constitution', value: char.stats.constitution },
      { name: 'Inteligencia', key: 'INT', keyLow: 'intelligence', value: char.stats.intelligence },
      { name: 'SabidurÃ­a', key: 'SAB', keyLow: 'wisdom', value: char.stats.wisdom },
      { name: 'Carisma', key: 'CAR', keyLow: 'charisma', value: char.stats.charisma }
    ];
  }

  hasClassSavingThrowProficiency(key: string): boolean {
    if (!this.character || !this.character.class) return false;
    const className = this.character.class.toLowerCase();
    
    if (className.includes('bÃ¡rbaro') || className.includes('barbaro')) {
      return key === 'FUE' || key === 'CON';
    }
    if (className.includes('bardo')) {
      return key === 'DES' || key === 'CAR';
    }
    if (className.includes('clÃ©rigo') || className.includes('clerigo')) {
      return key === 'SAB' || key === 'CAR';
    }
    if (className.includes('druida')) {
      return key === 'INT' || key === 'SAB';
    }
    if (className.includes('guerrero')) {
      return key === 'FUE' || key === 'CON';
    }
    if (className.includes('monje')) {
      return key === 'FUE' || key === 'DES';
    }
    if (className.includes('paladÃ­n') || className.includes('paladin')) {
      return key === 'SAB' || key === 'CAR';
    }
    if (className.includes('explorador')) {
      return key === 'FUE' || key === 'DES';
    }
    if (className.includes('pÃ­caro') || className.includes('picaro')) {
      return key === 'DES' || key === 'INT';
    }
    if (className.includes('hechicero')) {
      return key === 'CON' || key === 'CAR';
    }
    if (className.includes('brujo')) {
      return key === 'SAB' || key === 'CAR';
    }
    if (className.includes('mago')) {
      return key === 'INT' || key === 'SAB';
    }
    return false;
  }

  getSavingThrowModifier(key: string): string {
    let modVal = this.getFinalModifierValue(key === 'FUE' ? 'strength' : key === 'DES' ? 'dexterity' : key === 'CON' ? 'constitution' : key === 'INT' ? 'intelligence' : key === 'SAB' ? 'wisdom' : 'charisma');
    if (this.hasClassSavingThrowProficiency(key)) {
      modVal += this.getProficiencyBonus();
    }
    return modVal >= 0 ? `+${modVal}` : `${modVal}`;
  }

  getBackgroundSkills(bgName: string): string[] {
    const bg = bgName.toLowerCase().trim();
    if (bg.includes('acÃ³lito') || bg.includes('acolito')) return ['religiÃ³n', 'medicina'];
    if (bg.includes('charlatÃ¡n') || bg.includes('charlatan')) return ['engaÃ±o', 'juego de manos'];
    if (bg.includes('criminal')) return ['engaÃ±o', 'sigilo'];
    if (bg.includes('artista')) return ['acrobacias', 'interpretaciÃ³n'];
    if (bg.includes('hÃ©roe del pueblo') || bg.includes('heroe del pueblo')) return ['trato con animales', 'supervivencia'];
    if (bg.includes('artesano gremial') || bg.includes('artesano')) return ['perspicacia', 'persuasiÃ³n'];
    if (bg.includes('ermitaÃ±o') || bg.includes('ermitano')) return ['medicina', 'religiÃ³n'];
    if (bg.includes('noble')) return ['historia', 'persuasiÃ³n'];
    if (bg.includes('forastero')) return ['atletismo', 'supervivencia'];
    if (bg.includes('sabio')) return ['conocimiento arcano', 'historia'];
    if (bg.includes('marinero')) return ['atletismo', 'percepciÃ³n'];
    if (bg.includes('soldado')) return ['atletismo', 'intimidaciÃ³n'];
    if (bg.includes('huÃ©rfano') || bg.includes('huerfano')) return ['juego de manos', 'sigilo'];
    return [];
  }

  hasSkillProficiency(skillName: string): boolean {
    if (!this.character) return false;
    const cleanSkill = skillName.toLowerCase().trim();
    if (this.character.classSkills.some(s => s.toLowerCase().trim() === cleanSkill)) {
      return true;
    }
    const bgSkills = this.getBackgroundSkills(this.character.background);
    if (bgSkills.some(s => s === cleanSkill)) {
      return true;
    }
    if (this.character.skilledFeatSelection && this.character.skilledFeatSelection.some(s => s.toLowerCase().trim() === cleanSkill)) {
      return true;
    }
    return false;
  }

  getSkillModifier(attrKey: string, skillName: string): string {
    let modVal = this.getFinalModifierValue(attrKey);
    if (this.hasSkillProficiency(skillName)) {
      modVal += this.getProficiencyBonus();
    }
    return modVal >= 0 ? `+${modVal}` : `${modVal}`;
  }

  getSizeLetter(size: string): string {
    if (!size) return 'M';
    const s = size.toLowerCase().trim();
    if (s.includes('pequeÃ±o') || s.includes('pequeno')) return 'P';
    if (s.includes('grande')) return 'G';
    if (s.includes('enorme')) return 'E';
    if (s.includes('gargantuesco')) return 'GG';
    return 'M';
  }

  getCarryingCapacity(strength: number, sizeClass: string, raceName: string) {
    const isGoliath = raceName.toLowerCase().includes('goliat') || raceName.toLowerCase().includes('goliath');
    let size = sizeClass || 'Mediano';
    if (isGoliath) {
      if (size === 'Mediano') size = 'Grande';
      else if (size === 'PequeÃ±o') size = 'Mediano';
    }

    let factorMax = 7.5;
    let factorDrag = 15.0;

    const s = size.toLowerCase().trim();
    if (s === 'diminuto') {
      factorMax = 3.75;
      factorDrag = 7.5;
    } else if (s === 'pequeÃ±o' || s === 'mediano') {
      factorMax = 7.5;
      factorDrag = 15.0;
    } else if (s === 'grande') {
      factorMax = 15.0;
      factorDrag = 30.0;
    } else if (s === 'enorme') {
      factorMax = 30.0;
      factorDrag = 60.0;
    } else if (s === 'gargantuesco') {
      factorMax = 60.0;
      factorDrag = 120.0;
    }

    const maxKg = strength * factorMax;
    const maxLb = strength * factorMax * 2;
    const dragKg = strength * factorDrag;
    const dragLb = strength * factorDrag * 2;

    return { maxKg, maxLb, dragKg, dragLb };
  }

  getClassData(className: string) {
    const name = (className || '').toLowerCase().trim();
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro')) {
      return { name: 'BÃ¡rbaro', hitDie: 12, primaryStat: 'Fuerza', description: 'Un fiero guerrero de trasfondo primitivo que puede entrar en una furia brutal. Resiste daÃ±o extremo y domina armas pesadas.' };
    }
    if (name.includes('bardo')) {
      return { name: 'Bardo', hitDie: 8, primaryStat: 'Carisma', description: 'Un maestro de la mÃºsica y la magia que inspira aliados, confunde enemigos y domina artes artÃ­sticas.' };
    }
    if (name.includes('brujo')) {
      return { name: 'Brujo', hitDie: 8, primaryStat: 'Carisma', description: 'Un buscador de conocimientos prohibidos con pactos sobrenaturales de otros mundos.' };
    }
    if (name.includes('clÃ©rigo') || name.includes('clerigo')) {
      return { name: 'ClÃ©rigo', hitDie: 8, primaryStat: 'SabidurÃ­a', description: 'Un sacerdote sagrado que canaliza magia divina para sanar y castigar con justicia celestial.' };
    }
    if (name.includes('druida')) {
      return { name: 'Druida', hitDie: 8, primaryStat: 'SabidurÃ­a', description: 'Un guardiÃ¡n del equilibrio natural que invoca tempestades y adopta formas de bestias.' };
    }
    if (name.includes('guerrero')) {
      return { name: 'Guerrero', hitDie: 10, primaryStat: 'Fuerza o Destreza', description: 'Un combatiente experto en tÃ¡cticas y el uso de todo tipo de armas y armaduras.' };
    }
    if (name.includes('hechicero')) {
      return { name: 'Hechicero', hitDie: 6, primaryStat: 'Carisma', description: 'Un lanzador de conjuros con magia innata corriendo por sus venas de ancestros mÃ¡gicos.' };
    }
    if (name.includes('mago')) {
      return { name: 'Mago', hitDie: 6, primaryStat: 'Inteligencia', description: 'Un erudito que manipula las leyes del multiverso registrando conjuros en su libro.' };
    }
    if (name.includes('monje')) {
      return { name: 'Monje', hitDie: 8, primaryStat: 'Destreza y SabidurÃ­a', description: 'Un artista marcial que canaliza la energÃ­a ki de su propio cuerpo para pelear desarmado.' };
    }
    if (name.includes('paladÃ­n') || name.includes('paladin')) {
      return { name: 'PaladÃ­n', hitDie: 10, primaryStat: 'Fuerza y Carisma', description: 'Un guerrero sagrado vinculado a un juramento inquebrantable que lucha contra el mal.' };
    }
    if (name.includes('pÃ­caro') || name.includes('picaro')) {
      return { name: 'PÃ­caro', hitDie: 8, primaryStat: 'Destreza', description: 'Un astuto oportunista especializado en sigilo, trampas y asestar ataques furtivos.' };
    }
    if (name.includes('explorador')) {
      return { name: 'Explorador', hitDie: 10, primaryStat: 'Destreza y SabidurÃ­a', description: 'Un cazador y rastreador letal de las tierras salvajes, diestro en guiar a su grupo.' };
    }
    return { name: className, hitDie: 8, primaryStat: 'Fuerza', description: 'Un intrÃ©pido hÃ©roe listo para la aventura.' };
  }

  getBackgroundData(bgName: string) {
    const name = (bgName || '').toLowerCase().trim();
    if (name.includes('acÃ³lito') || name.includes('acolito')) {
      return { name: 'AcÃ³lito', keyFeat: 'Iniciado en la Magia', concept: 'Sirves en un templo u orden religiosa. Eres un canal para los ritos divinos.', tools: 'Ãštiles de calÃ­grafo o pintor' };
    }
    if (name.includes('charlatÃ¡n') || name.includes('charlatan')) {
      return { name: 'CharlatÃ¡n', keyFeat: 'Afortunado', concept: 'Te ganas la vida engaÃ±ando a los demÃ¡s con falsas promesas y astucia urbana.', tools: 'Estuche de disfraz' };
    }
    if (name.includes('criminal')) {
      return { name: 'Criminal', keyFeat: 'Alerta', concept: 'Conoces los callejones oscuros y el bajo mundo. Diestro en moverte sin ser visto.', tools: 'Herramientas de ladrÃ³n' };
    }
    if (name.includes('artista')) {
      return { name: 'Artista', keyFeat: 'MÃºsico', concept: 'Vives del aplauso y el entretenimiento, actuando ante todo tipo de pÃºblicos.', tools: 'Un instrumento musical' };
    }
    if (name.includes('hÃ©roe del pueblo') || name.includes('heroe del pueblo')) {
      return { name: 'HÃ©roe del Pueblo', keyFeat: 'Duro', concept: 'Vienes de un origen humilde y te alzaste para defender a tus vecinos del peligro.', tools: 'Herramientas de artesano' };
    }
    if (name.includes('artesano gremial') || name.includes('artesano')) {
      return { name: 'Artesano Gremial', keyFeat: 'Fabricante', concept: 'Eres miembro de un gremio comercial y dominas un oficio de manufactura de bienes.', tools: 'Herramientas de artesano' };
    }
    if (name.includes('ermitaÃ±o') || name.includes('ermitano')) {
      return { name: 'ErmitaÃ±o', keyFeat: 'Sanador', concept: 'Pasaste aÃ±os aislado de la sociedad meditando y buscando la iluminaciÃ³n espiritual.', tools: 'Ãštiles de herborista' };
    }
    if (name.includes('noble')) {
      return { name: 'Noble', keyFeat: 'MÃºsico', concept: 'Naciste en la aristocracia, posees tÃ­tulos o sirves a la corte. Sabes de protocolo.', tools: 'Un instrumento musical' };
    }
    if (name.includes('forastero')) {
      return { name: 'Forastero', keyFeat: 'Duro', concept: 'Creciste en las tierras salvajes, lejos de las ciudades. Sabes subsistir en lo agreste.', tools: 'Instrumento rÃºstico' };
    }
    if (name.includes('sabio')) {
      return { name: 'Sabio', keyFeat: 'Iniciado en la Magia', concept: 'Eres un estudioso del multiverso. Pasaste aÃ±os en bibliotecas acumulando datos.', tools: 'Ãštiles de escriba' };
    }
    if (name.includes('marinero')) {
      return { name: 'Marinero', keyFeat: 'Duro', concept: 'Trabajaste en la tripulaciÃ³n de un navÃ­o, enfrentÃ¡ndote a tormentas y piratas.', tools: 'Herramientas de navegante' };
    }
    if (name.includes('soldado')) {
      return { name: 'Soldado', keyFeat: 'Alerta', concept: 'Fuiste miembro de un ejÃ©rcito o guardia. Conoces la disciplina militar.', tools: 'Juego de cartas o dados' };
    }
    if (name.includes('huÃ©rfano') || name.includes('huerfano')) {
      return { name: 'HuÃ©rfano', keyFeat: 'Afortunado', concept: 'Creciste solo en las calles, sobreviviendo gracias a tu rapidez fÃ­sica.', tools: 'Estuche de juego' };
    }
    return { name: bgName, keyFeat: 'Afortunado', concept: 'Un trasfondo humilde o misterioso.', tools: 'Herramientas bÃ¡sicas' };
  }

  getOriginData(raceName: string) {
    const r = (raceName || '').toLowerCase().trim();
    if (r.includes('aasimar')) return { name: 'Aasimar', speed: '30 pies (9m)', language: 'ComÃºn, Celestial' };
    if (r.includes('dracÃ³nido') || r.includes('draconido')) return { name: 'DracÃ³nido', speed: '30 pies (9m)', language: 'ComÃºn, DracÃ³nico' };
    if (r.includes('elfo')) return { name: 'Elfo', speed: '30 pies (9m)', language: 'ComÃºn, Ã‰lfico' };
    if (r.includes('enano')) return { name: 'Enano', speed: '30 pies (9m)', language: 'ComÃºn, Enano' };
    if (r.includes('gnomo')) return { name: 'Gnomo', speed: '30 pies (9m)', language: 'ComÃºn, Gnomo' };
    if (r.includes('goliat') || r.includes('goliath')) return { name: 'Goliat', speed: '35 pies (10.5m)', language: 'ComÃºn, Gigante' };
    if (r.includes('humano')) return { name: 'Humano', speed: '30 pies (9m)', language: 'ComÃºn, idioma extra' };
    if (r.includes('mediano')) return { name: 'Mediano', speed: '25 pies (7.5m)', language: 'ComÃºn, Mediano' };
    if (r.includes('orco')) return { name: 'Orco', speed: '30 pies (9m)', language: 'ComÃºn, Orco' };
    if (r.includes('tiflin') || r.includes('tiefling')) return { name: 'Tiflin', speed: '30 pies (9m)', language: 'ComÃºn, Infernal' };
    return { name: raceName, speed: '30 pies (9m)', language: 'ComÃºn' };
  }

  getFeatInfo(featName: string): { title: string; benefits: string[] } {
    if (!featName) return { title: '', benefits: [] };
    const cleanName = featName.toLowerCase();
    
    if (cleanName.includes('afortunado')) {
      return {
        title: 'Afortunado',
        benefits: [
          '<strong>Puntos de suerte:</strong> Tienes una cantidad de puntos de suerte igual a tu bonificador por competencia. Los recuperas tras un descanso largo.',
          '<strong>Ventaja:</strong> Cuando tires un d20 para una prueba, puedes gastar 1 punto de suerte para otorgarte ventaja en la tirada.',
          '<strong>Desventaja:</strong> Cuando una criatura tire un ataque contra ti, puedes gastar 1 punto para imponerle desventaja.'
        ]
      };
    }
    if (cleanName.includes('alerta')) {
      return {
        title: 'Alerta',
        benefits: [
          '<strong>Iniciativa mejorada:</strong> Sumas tu bonificador por competencia a tus tiradas de iniciativa.',
          '<strong>Intercambio de iniciativa:</strong> Justo despuÃ©s de tirar iniciativa, puedes cambiar tu posiciÃ³n en el orden con un aliado dispuesto.'
        ]
      };
    }
    if (cleanName.includes('salvaje') || cleanName.includes('atacante')) {
      return {
        title: 'Atacante Salvaje',
        benefits: [
          '<strong>DaÃ±o doble:</strong> Una vez por turno, cuando aciertes con un arma, puedes tirar dos veces los dados de daÃ±o del arma y usar el resultado que prefieras.'
        ]
      };
    }
    if (cleanName.includes('duro')) {
      return {
        title: 'Duro',
        benefits: [
          '<strong>Salud incrementada:</strong> Tus puntos de golpe mÃ¡ximos aumentan en una cantidad igual al doble de tu nivel.',
          '<strong>Crecimiento:</strong> Cada vez que subas de nivel, tus puntos de golpe aumentan en 2 puntos adicionales.'
        ]
      };
    }
    if (cleanName.includes('fabricante') || cleanName.includes('crafter')) {
      return {
        title: 'Fabricante',
        benefits: [
          '<strong>Herramientas:</strong> Competencia con 3 herramientas de artesano.',
          '<strong>Descuento:</strong> Consigues un 20% de descuento al comprar cualquier objeto no mÃ¡gico.'
        ]
      };
    }
    if (cleanName.includes('habilidoso') || cleanName.includes('skilled')) {
      return {
        title: 'Habilidoso',
        benefits: [
          '<strong>Competencia extra:</strong> Ganas competencia en cualquier combinaciÃ³n de tres habilidades o herramientas que elijas.'
        ]
      };
    }
    if (cleanName.includes('iniciado en la magia') || cleanName.includes('magic initiate')) {
      return {
        title: 'Iniciado en la Magia',
        benefits: [
          '<strong>Trucos y Conjuro:</strong> Aprendes dos trucos y un conjuro de nivel 1 de una lista de clase principal.',
          '<strong>Lanzamiento gratis:</strong> Lo tienes siempre preparado y lo lanzas gratis una vez por descanso largo.'
        ]
      };
    }
    if (cleanName.includes('matÃ³n') || cleanName.includes('maton') || cleanName.includes('taberna')) {
      return {
        title: 'MatÃ³n de Taberna',
        benefits: [
          '<strong>Ataque desarmado:</strong> Tu ataque sin armas causa 1d4 + mod. Fuerza.',
          '<strong>Armas improvisadas:</strong> Tienes competencia con armas improvisadas.'
        ]
      };
    }
    if (cleanName.includes('mÃºsico') || cleanName.includes('musico')) {
      return {
        title: 'MÃºsico',
        benefits: [
          '<strong>MÃºsica Alentadora:</strong> Tocas para dar inspiraciÃ³n heroica a tus aliados tras finalizar un descanso.'
        ]
      };
    }
    if (cleanName.includes('sanador') || cleanName.includes('healer')) {
      return {
        title: 'Sanador',
        benefits: [
          '<strong>MÃ©dico de batalla:</strong> Cura a un aliado gastando un uso de Ãºtiles de sanador (dado de golpe + BC).'
        ]
      };
    }
    
    return {
      title: featName.split('(')[0].trim(),
      benefits: ['Dote de origen del manual. Confiere beneficios Ãºnicos y rasgos pasivos a tu aventurero.']
    };
  }

  getClassEquipmentOptions(name: string): { optionA: string, optionB: string } {
    if (!name) return { optionA: 'â€”', optionB: 'â€”' };
    const n = name.toLowerCase();
    if (n.includes('bÃ¡rbaro') || n.includes('barbaro')) {
      return {
        optionA: 'Hacha a dos manos, 4 hachas de mano, paquete de explorador y 15 po.',
        optionB: '75 po'
      };
    }
    if (n.includes('bardo')) {
      return {
        optionA: 'Daga, instrumento musical, paquete de artista y 19 po.',
        optionB: '90 po'
      };
    }
    if (n.includes('brujo')) {
      return {
        optionA: 'Daga, hoz, foco arcano, libro, paquete de erudito y 15 po.',
        optionB: '100 po'
      };
    }
    if (n.includes('clÃ©rigo') || n.includes('clerigo')) {
      return {
        optionA: 'LÃ³riga (Chain Shirt), Escudo, Maza, SÃ­mbolo Sagrado, paquete de sacerdote y 7 po.',
        optionB: '110 po'
      };
    }
    if (n.includes('druida')) {
      return {
        optionA: 'Garrote, hoz, foco druÃ­dico, paquete de explorador, Ãºtiles de herborista y 9 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('explorador')) {
      return {
        optionA: 'Espada corta, arco corto, 20 flechas, carcaj, foco druÃ­dico, paquete de explorador y 7 po.',
        optionB: '150 po'
      };
    }
    if (n.includes('guerrero')) {
      return {
        optionA: 'Cota de malla, escudo, espada larga, 6 jabalinas, paquete de explorador y 4 po.',
        optionB: '155 po'
      };
    }
    if (n.includes('hechicero')) {
      return {
        optionA: 'Daga, ballesta ligera, 20 virotes, foco arcano, paquete de erudito y 28 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('mago')) {
      return {
        optionA: 'Daga, foco arcano, libro de conjuros, paquete de erudito y 5 po.',
        optionB: '55 po'
      };
    }
    if (n.includes('monje')) {
      return {
        optionA: '10 dagas, paquete de explorador y 11 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('paladÃ­n') || n.includes('paladin')) {
      return {
        optionA: 'Cota de malla, Escudo, espada larga, 6 jabalinas, SÃ­mbolo Sagrado, paquete de sacerdote y 9 po.',
        optionB: '150 po'
      };
    }
    if (n.includes('pÃ­caro') || n.includes('picaro')) {
      return {
        optionA: 'Armadura de cuero, 2 dagas, espada corta, arco corto, 20 flechas, carcaj, herramientas de ladrÃ³n, paquete de ladrÃ³n y 8 po.',
        optionB: '100 po'
      };
    }
    return { optionA: 'â€”', optionB: 'â€”' };
  }

  getBgEquipmentOptions(bgName: string): { optionA: string, optionB: string } {
    const n = (bgName || '').toLowerCase().trim();
    if (n.includes('acÃ³lito') || n.includes('acolito')) {
      return { optionA: 'SÃ­mbolo sagrado, libro de oraciones, 5 varitas de incienso, vestiduras y 15 po.', optionB: '25 po' };
    }
    if (n.includes('charlatÃ¡n') || n.includes('charlatan')) {
      return { optionA: 'Ropas finas, estuche de disfraz, 10 botellas vacÃ­as, baraja trucada y 15 po.', optionB: '25 po' };
    }
    if (n.includes('criminal')) {
      return { optionA: 'Palanca, ropas oscuras con capucha, herramientas de ladrÃ³n y 15 po.', optionB: '25 po' };
    }
    if (n.includes('artista')) {
      return { optionA: 'Instrumento musical, ropas de calidad, cartas de admiradores y 15 po.', optionB: '25 po' };
    }
    if (n.includes('hÃ©roe del pueblo') || n.includes('heroe del pueblo')) {
      return { optionA: 'Pala, olla de hierro, ropas de viaje, herramientas de artesano y 10 po.', optionB: '20 po' };
    }
    if (n.includes('artesano gremial') || n.includes('artesano')) {
      return { optionA: 'Herramientas de artesano, carta de recomendaciÃ³n de tu gremio, ropas de viaje y 15 po.', optionB: '25 po' };
    }
    if (n.includes('ermitaÃ±o') || n.includes('ermitano')) {
      return { optionA: 'Estuche de pergaminos, manta de viaje, Ãºtiles de herborista, ropas sencillas y 5 po.', optionB: '15 po' };
    }
    if (n.includes('noble')) {
      return { optionA: 'Ropas finas, anillo de sello, juego de dados y 25 po.', optionB: '35 po' };
    }
    if (n.includes('forastero')) {
      return { optionA: 'BastÃ³n, trampa para cazar, ropas de viaje, odre y 10 po.', optionB: '20 po' };
    }
    if (n.includes('sabio')) {
      return { optionA: 'Tintero, pluma, cuchillo pequeÃ±o, ropas sencillas y 10 po.', optionB: '20 po' };
    }
    if (n.includes('marinero')) {
      return { optionA: 'Clavo de abordaje, 15 metros de cuerda de cÃ¡Ã±amo, ropas de viaje y 10 po.', optionB: '20 po' };
    }
    if (n.includes('soldado')) {
      return { optionA: 'Insignia de rango, trofeo de guerra, juego de cartas, ropas de viaje y 10 po.', optionB: '20 po' };
    }
    if (n.includes('huÃ©rfano') || n.includes('huerfano')) {
      return { optionA: 'Cuchillo pequeÃ±o, mapa de tu ciudad natal, ratÃ³n mascota, ropas sencillas y 10 po.', optionB: '20 po' };
    }
    return { optionA: 'Ropas de viaje y 10 po.', optionB: '10 po' };
  }

  getStartingGold(): number {
    if (!this.character) return 10;
    const name = this.character.class.toLowerCase();
    let classGold = 10;
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro')) classGold = 15;
    else if (name.includes('bardo')) classGold = 19;
    else if (name.includes('brujo')) classGold = 15;
    else if (name.includes('clÃ©rigo') || name.includes('clerigo')) classGold = 7;
    else if (name.includes('druida')) classGold = 9;
    else if (name.includes('explorador')) classGold = 7;
    else if (name.includes('guerrero')) classGold = 4;
    else if (name.includes('hechicero')) classGold = 28;
    else if (name.includes('mago')) classGold = 5;
    else if (name.includes('monje')) classGold = 11;
    else if (name.includes('paladÃ­n') || name.includes('paladin')) classGold = 9;
    else if (name.includes('pÃ­caro') || name.includes('picaro')) classGold = 8;

    const bgName = this.character.background.toLowerCase();
    let bgGold = 10;
    if (bgName.includes('acÃ³lito') || bgName.includes('acolito')) bgGold = 15;
    else if (bgName.includes('charlatÃ¡n') || bgName.includes('charlatan')) bgGold = 15;
    else if (bgName.includes('criminal')) bgGold = 15;
    else if (bgName.includes('artista')) bgGold = 15;
    else if (bgName.includes('hÃ©roe') || bgName.includes('heroe')) bgGold = 10;
    else if (bgName.includes('artesano')) bgGold = 15;
    else if (bgName.includes('ermitaÃ±o') || bgName.includes('ermitano')) bgGold = 5;
    else if (bgName.includes('noble')) bgGold = 25;
    else if (bgName.includes('forastero')) bgGold = 10;
    else if (bgName.includes('sabio')) bgGold = 10;
    else if (bgName.includes('marinero')) bgGold = 10;
    else if (bgName.includes('soldado')) bgGold = 10;
    else if (bgName.includes('huÃ©rfano') || bgName.includes('huerfano')) bgGold = 10;

    return classGold + bgGold;
  }

  getMergedIndividualItems(): { name: string, quantity: number }[] {
    if (!this.character) return [];
    const className = this.character.class.toLowerCase();
    const items: { name: string, quantity: number }[] = [];

    if (className.includes('bÃ¡rbaro') || className.includes('barbaro')) {
      items.push({ name: 'Hacha a dos manos', quantity: 1 });
      items.push({ name: 'Hacha de mano', quantity: 4 });
    } else if (className.includes('bardo')) {
      items.push({ name: 'Daga', quantity: 1 });
    } else if (className.includes('brujo')) {
      items.push({ name: 'Daga', quantity: 1 });
      items.push({ name: 'Hoz', quantity: 1 });
    } else if (className.includes('clÃ©rigo') || className.includes('clerigo')) {
      items.push({ name: 'Maza', quantity: 1 });
      items.push({ name: 'Escudo', quantity: 1 });
      items.push({ name: 'Cota de escamas', quantity: 1 });
    } else if (className.includes('druida')) {
      items.push({ name: 'Garrote', quantity: 1 });
      items.push({ name: 'Hoz', quantity: 1 });
    } else if (className.includes('explorador')) {
      items.push({ name: 'Espada corta', quantity: 1 });
      items.push({ name: 'Arco corto', quantity: 1 });
    } else if (className.includes('guerrero')) {
      items.push({ name: 'Espada larga', quantity: 1 });
      items.push({ name: 'Escudo', quantity: 1 });
      items.push({ name: 'Cota de malla', quantity: 1 });
      items.push({ name: 'Jabalina', quantity: 6 });
    } else if (className.includes('hechicero')) {
      items.push({ name: 'Daga', quantity: 1 });
      items.push({ name: 'Ballesta ligera', quantity: 1 });
    } else if (className.includes('mago')) {
      items.push({ name: 'Daga', quantity: 1 });
    } else if (className.includes('monje')) {
      items.push({ name: 'Daga', quantity: 10 });
    } else if (className.includes('paladÃ­n') || className.includes('paladin')) {
      items.push({ name: 'Espada larga', quantity: 1 });
      items.push({ name: 'Escudo', quantity: 1 });
      items.push({ name: 'Cota de malla', quantity: 1 });
      items.push({ name: 'Jabalina', quantity: 6 });
    } else if (className.includes('pÃ­caro') || className.includes('picaro')) {
      items.push({ name: 'Armadura de cuero', quantity: 1 });
      items.push({ name: 'Daga', quantity: 2 });
      items.push({ name: 'Espada corta', quantity: 1 });
      items.push({ name: 'Arco corto', quantity: 1 });
    }
    return items;
  }

  isProficientWithWeapon(weaponName: string, category: 'sencilla' | 'marcial'): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro') || name.includes('guerrero') || 
        name.includes('paladÃ­n') || name.includes('paladin') || name.includes('explorador')) {
      return true;
    }
    if (category === 'sencilla') return true;
    
    const w = weaponName.toLowerCase();
    if (name.includes('bardo') || name.includes('pÃ­caro') || name.includes('picaro')) {
      return w.includes('ballesta de mano') || w.includes('ropera') || w.includes('espada corta');
    }
    if (name.includes('monje')) {
      return w.includes('espada corta');
    }
    return false;
  }

  hasWeaponMastery(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('bÃ¡rbaro') || name.includes('barbaro') || 
           name.includes('guerrero') || name.includes('paladÃ­n') || 
           name.includes('paladin') || name.includes('explorador');
  }

  getEquippedWeaponsDetails(): any[] {
    const list = this.getMergedIndividualItems();
    const weaponTable: { [key: string]: { name: string; damageDie: string; damageType: string; properties: string; mastery: string; weight: string; price: string; description: string; category: 'sencilla' | 'marcial'; type: 'cuerpo a cuerpo' | 'a distancia'; finesse: boolean } } = {
      'espada larga': {
        name: 'Espada larga',
        damageDie: '1d8',
        damageType: 'Cortante',
        properties: 'VersÃ¡til (1d10)',
        mastery: 'Debilitar',
        weight: '1,5 kg',
        price: '15 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrÃ¡ desventaja en su prÃ³xima tirada de ataque antes del principio de tu siguiente turno.',
        category: 'marcial',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'ballesta ligera': {
        name: 'Ballesta ligera',
        damageDie: '1d8',
        damageType: 'Perforante',
        properties: 'A dos manos, municiÃ³n (alcance 24/96; virote), recarga',
        mastery: 'Ralentizar',
        weight: '2,5 kg',
        price: '25 po',
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daÃ±o, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'a distancia',
        finesse: false
      },
      'lanza': {
        name: 'Lanza',
        damageDie: '1d6',
        damageType: 'Perforante',
        properties: 'Arrojadiza (alcance 6/18), versÃ¡til (1d8)',
        mastery: 'Debilitar',
        weight: '1,5 kg',
        price: '1 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrÃ¡ desventaja en su prÃ³xima tirada de ataque antes del principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'daga': {
        name: 'Daga',
        damageDie: '1d4',
        damageType: 'Perforante',
        properties: 'Arrojadiza (alcance 6/18), ligera, sutil',
        mastery: 'Mellar',
        weight: '0,5 kg',
        price: '2 po',
        description: 'Mellar: Cuando hagas el ataque extra de la propiedad "ligera", puedes hacerlo como parte de la acciÃ³n de atacar en vez de como acciÃ³n adicional. Solo puedes hacer este ataque extra una vez por turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: true
      },
      'arco corto': {
        name: 'Arco corto',
        damageDie: '1d6',
        damageType: 'Perforante',
        properties: 'A dos manos, municiÃ³n (alcance 24/96; flecha)',
        mastery: 'Molestar',
        weight: '1 kg',
        price: '25 po',
        description: 'Molestar: Si aciertas a una criatura con esta arma y le causas daÃ±o, tendrÃ¡s ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu siguiente turno.',
        category: 'sencilla',
        type: 'a distancia',
        finesse: false
      },
      'bastÃ³n': {
        name: 'BastÃ³n',
        damageDie: '1d6',
        damageType: 'Contundente',
        properties: 'VersÃ¡til (1d8)',
        mastery: 'Derribar',
        weight: '2 kg',
        price: '2 pp',
        description: 'Derribar: Si aciertas a una criatura con esta arma, puedes obligarla a hacer una tirada de salvaciÃ³n de ConstituciÃ³n (CD 8 + mod. CaracterÃ­stica + BC). Si la falla, quedarÃ¡ derribada.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'hacha de mano': {
        name: 'Hacha de mano',
        damageDie: '1d6',
        damageType: 'Cortante',
        properties: 'Arrojadiza (alcance 6/18), ligera',
        mastery: 'Molestar',
        weight: '1 kg',
        price: '5 po',
        description: 'Molestar: Si aciertas a una criatura con esta arma y le causas daÃ±o, tendrÃ¡s ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'hoz': {
        name: 'Hoz',
        damageDie: '1d4',
        damageType: 'Cortante',
        properties: 'Ligera',
        mastery: 'Mellar',
        weight: '1 kg',
        price: '1 po',
        description: 'Mellar: Cuando hagas el ataque extra de la propiedad "ligera", puedes hacerlo como parte de la acciÃ³n de atacar en vez de como acciÃ³n adicional.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'jabalina': {
        name: 'Jabalina',
        damageDie: '1d6',
        damageType: 'Perforante',
        properties: 'Arrojadiza (alcance 9/36)',
        mastery: 'Ralentizar',
        weight: '1 kg',
        price: '5 pp',
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daÃ±o, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'garrote': {
        name: 'Garrote',
        damageDie: '1d4',
        damageType: 'Contundente',
        properties: 'Ligero',
        mastery: 'Ralentizar',
        weight: '1 kg',
        price: '1 pp',
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daÃ±o, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'maza': {
        name: 'Maza',
        damageDie: '1d6',
        damageType: 'Contundente',
        properties: 'â€”',
        mastery: 'Debilitar',
        weight: '2 kg',
        price: '5 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrÃ¡ desventaja en su prÃ³xima tirada de ataque antes del principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'hacha a dos manos': {
        name: 'Hacha a dos manos',
        damageDie: '1d12',
        damageType: 'Cortante',
        properties: 'A dos manos, pesada',
        mastery: 'Cortar',
        weight: '3,5 kg',
        price: '30 po',
        description: 'Cortar: Si aciertas un ataque con esta arma, el daÃ±o sobrante se propaga a una criatura adyacente si superas su CA (mÃ¡ximo tu mod. caracterÃ­stica).',
        category: 'marcial',
        type: 'cuerpo a cuerpo',
        finesse: false
      }
    };

    const details: any[] = [];
    list.forEach(item => {
      const nameLower = item.name.toLowerCase().trim();
      const matchKey = Object.keys(weaponTable).find(k => nameLower.includes(k) || k.includes(nameLower));
      if (matchKey) {
        const weaponData = { ...weaponTable[matchKey] };
        const quantity = item.quantity || 1;
        const isProficient = this.isProficientWithWeapon(weaponData.name, weaponData.category);
        const profBonus = isProficient ? this.getProficiencyBonus() : 0;
        
        let abilityModKey = 'FUE';
        let abilityModValue = this.getFinalModifierValue('strength');
        
        if (weaponData.type === 'a distancia') {
          abilityModKey = 'DES';
          abilityModValue = this.getFinalModifierValue('dexterity');
        } else if (weaponData.finesse) {
          const strMod = this.getFinalModifierValue('strength');
          const dexMod = this.getFinalModifierValue('dexterity');
          if (dexMod > strMod) {
            abilityModKey = 'DES';
            abilityModValue = dexMod;
          }
        }
        
        const attackBonusNum = abilityModValue + profBonus;
        const attackBonus = attackBonusNum >= 0 ? `+${attackBonusNum}` : `${attackBonusNum}`;
        
        const dmgBonusNum = abilityModValue;
        const dmgBonusStr = dmgBonusNum > 0 ? `+${dmgBonusNum}` : (dmgBonusNum < 0 ? `${dmgBonusNum}` : '');
        const fullDamage = `${weaponData.damageDie}${dmgBonusStr}`;
        
        details.push({
          ...weaponData,
          quantity,
          isProficient,
          abilityModKey,
          abilityModValue,
          profBonus,
          attackBonus,
          fullDamage
        });
      }
    });
    return details;
  }

  getEquippedArmorsDetails(): any[] {
    const list = this.getMergedIndividualItems();
    const armorTable: { [key: string]: { name: string; type: string; ca: string; strength: string; stealth: string; weight: string; price: string } } = {
      'cota de malla': {
        name: 'Cota de malla',
        type: 'Pesada (10 min de poner, 5 min de quitar)',
        ca: '16',
        strength: 'Fue 13',
        stealth: 'Desventaja',
        weight: '27,5 kg',
        price: '75 po'
      },
      'cota de escamas': {
        name: 'Cota de escamas',
        type: 'Media (5 min de poner, 1 min de quitar)',
        ca: '14 + mod. Des (mÃ¡x. 2)',
        strength: 'â€”',
        stealth: 'Desventaja',
        weight: '22,5 kg',
        price: '50 po'
      },
      'armadura de cuero': {
        name: 'Armadura de cuero',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '11 + mod. Des',
        strength: 'â€”',
        stealth: 'â€”',
        weight: '5 kg',
        price: '10 po'
      },
      'armadura acolchada': {
        name: 'Armadura acolchada',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '11 + mod. Des',
        strength: 'â€”',
        stealth: 'Desventaja',
        weight: '4 kg',
        price: '5 po'
      },
      'cuero tachonado': {
        name: 'Armadura de cuero tachonado',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '12 + mod. Des',
        strength: 'â€”',
        stealth: 'â€”',
        weight: '6,5 kg',
        price: '45 po'
      },
      'escudo': {
        name: 'Escudo',
        type: 'Escudo (acciÃ³n de equipar/desequipar)',
        ca: '+2',
        strength: 'â€”',
        stealth: 'â€”',
        weight: '3 kg',
        price: '10 po'
      }
    };

    const details: any[] = [];
    list.forEach(item => {
      const nameLower = item.name.toLowerCase().trim();
      const matchKey = Object.keys(armorTable).find(k => nameLower.includes(k) || k.includes(nameLower));
      if (matchKey) {
        details.push(armorTable[matchKey]);
      }
    });
    return details;
  }

  hasClassArmorProficiency(type: 'ligeras' | 'medias' | 'pesadas' | 'escudos'): boolean {
    if (!this.character || !this.character.class) return false;
    const name = this.character.class.toLowerCase();
    
    if (type === 'ligeras') {
      return !name.includes('mago') && !name.includes('hechicero') && !name.includes('monje');
    }
    if (type === 'medias') {
      return name.includes('guerrero') || name.includes('paladÃ­n') || name.includes('paladin') || 
             name.includes('bÃ¡rbaro') || name.includes('barbaro') || name.includes('clÃ©rigo') || 
             name.includes('clerigo') || name.includes('druida') || name.includes('explorador');
    }
    if (type === 'pesadas') {
      return name.includes('guerrero') || name.includes('paladÃ­n') || name.includes('paladin');
    }
    if (type === 'escudos') {
      return name.includes('guerrero') || name.includes('paladÃ­n') || name.includes('paladin') || 
             name.includes('bÃ¡rbaro') || name.includes('barbaro') || name.includes('clÃ©rigo') || 
             name.includes('clerigo') || name.includes('druida') || name.includes('explorador');
    }
    return false;
  }

  getClassWeaponsProficiency(): string {
    if (!this.character || !this.character.class) return 'Ninguna';
    const name = this.character.class.toLowerCase();
    
    if (name.includes('bÃ¡rbaro') || name.includes('barbaro') || name.includes('guerrero') || 
        name.includes('paladÃ­n') || name.includes('paladin') || name.includes('explorador')) {
      return 'Armas sencillas, Armas marciales';
    }
    if (name.includes('bardo')) {
      return 'Armas sencillas, Ballestas de mano, Roperas, Espadas cortas';
    }
    if (name.includes('clÃ©rigo') || name.includes('clerigo') || name.includes('brujo')) {
      return 'Armas sencillas';
    }
    if (name.includes('druida')) {
      return 'Bastones, Dagas, Dardos, Jabalinas, Lanzas, Hondas, Cimitarras';
    }
    if (name.includes('monje')) {
      return 'Armas sencillas, Espadas cortas';
    }
    if (name.includes('pÃ­caro') || name.includes('picaro')) {
      return 'Armas sencillas, Ballestas de mano, Roperas, Espadas cortas';
    }
    if (name.includes('mago') || name.includes('hechicero')) {
      return 'Dagas, Dardos, Hondas, Bastones, Ballestas ligeras';
    }
    return 'Ninguna';
  }

  isSpellcaster(): boolean {
    if (!this.character || !this.character.class) return false;
    const name = this.character.class.toLowerCase();
    const isSubclassArcane = !!(this.character.subclass && this.character.subclass.toLowerCase().includes('arcano'));
    return name.includes('mago') || name.includes('hechicero') || name.includes('bardo') || 
           name.includes('brujo') || name.includes('clÃ©rigo') || name.includes('clerigo') || 
           name.includes('druida') || name.includes('paladÃ­n') || name.includes('paladin') || 
           name.includes('explorador') ||
           ((name.includes('guerrero') || name.includes('pÃ­caro') || name.includes('picaro')) && isSubclassArcane);
  }

  getSpellcastingAbility(): string {
    if (!this.character || !this.character.class) return 'Ninguna';
    const name = this.character.class.toLowerCase();
    if (name.includes('mago')) return 'INT';
    if (name.includes('clÃ©rigo') || name.includes('clerigo') || name.includes('druida') || name.includes('explorador')) return 'SAB';
    if (name.includes('bardo') || name.includes('hechicero') || name.includes('brujo') || name.includes('paladÃ­n') || name.includes('paladin')) return 'CAR';
    return 'Ninguna';
  }

  getSpellcastingAbilityName(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'INT') return 'Inteligencia';
    if (key === 'SAB') return 'SabidurÃ­a';
    if (key === 'CAR') return 'Carisma';
    return 'Ninguna';
  }

  getSpellSaveDC(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'Ninguna') return 'â€”';
    const mod = this.getFinalModifierValue(key === 'INT' ? 'intelligence' : key === 'SAB' ? 'wisdom' : 'charisma');
    return `${8 + this.getProficiencyBonus() + mod}`;
  }

  getSpellAttackBonus(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'Ninguna') return 'â€”';
    const mod = this.getFinalModifierValue(key === 'INT' ? 'intelligence' : key === 'SAB' ? 'wisdom' : 'charisma');
    const bonus = this.getProficiencyBonus() + mod;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  }

  getBaseStatValue(keyLow: string): number {
    if (!this.character || !this.character.baseStats) return 10;
    return (this.character.baseStats as any)[keyLow] || 10;
  }

  getBgStatsAllocationValue(keyLow: string): number {
    if (!this.character || !this.character.backgroundStatsAllocation) return 0;
    return (this.character.backgroundStatsAllocation as any)[keyLow] || 0;
  }
}

const MONK_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Artes marciales', 'Defensa sin armadura'] },
  2: { features: ['ConcentraciÃ³n de monje', 'Metabolismo asombroso', 'Movimiento sin armadura'] },
  3: { features: ['Desviar ataques', 'Subclase de monje'] },
  4: { features: ['CaÃ­da lenta', 'Mejora de caracterÃ­stica'] },
  5: { features: ['Ataque adicional', 'Golpe aturdidor'] },
  6: { features: ['Golpes potenciados', 'Rasgo de subclase'] },
  7: { features: ['EvasiÃ³n'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['Movimiento acrobÃ¡tico'] },
  10: { features: ['Autorrestablecimiento', 'ConcentraciÃ³n agudizada'] },
  11: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  13: { features: ['Desviar energÃ­a'] },
  14: { features: ['Superviviente disciplinado'] },
  15: { features: ['ConcentraciÃ³n perfecta'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Rasgo de subclase'] },
  18: { features: ['Defensa superior'] },
  19: { features: ['Don Ã©pico'] },
  20: { features: ['Cuerpo y mente'] }
};

const BARBARIAN_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Defensa sin armadura', 'Furia', 'MaestrÃ­a con armas'] },
  2: { features: ['Ataque temerario', 'Sentir el peligro'] },
  3: { features: ['Conocimiento primigenio', 'Subclase de bÃ¡rbaro'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Ataque adicional', 'Movimiento rÃ¡pido'] },
  6: { features: ['Rasgo de subclase'] },
  7: { features: ['Instinto salvaje', 'Salto instintivo'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['Golpe brutal'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Furia implacable'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  13: { features: ['Golpe brutal mejorado'] },
  14: { features: ['Rasgo de subclase'] },
  15: { features: ['Furia persistente'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Golpe brutal mejorado'] },
  18: { features: ['PoderÃ­o indÃ³mito'] },
  19: { features: ['Don Ã©pico'] },
  20: { features: ['CampeÃ³n primordial'] }
};

const SORCERER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'HechicerÃ­a innata'] },
  2: { features: ['Fuente de magia', 'Metamagia'] },
  3: { features: ['Subclase de hechicero'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['RecuperaciÃ³n mÃ¡gica'] },
  6: { features: ['Rasgo de subclase'] },
  7: { features: ['EncarnaciÃ³n mÃ¡gica'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  10: { features: ['Metamagia mejorada'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Metamagia suprema'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Apoteosis arcana'] }
};

const FIGHTER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Estilo de combate', 'RecuperaciÃ³n del viento', 'MaestrÃ­a con armas'] },
  2: { features: ['Oleada de acciÃ³n', 'TÃ¡ctica defensiva'] },
  3: { features: ['Subclase de Guerrero'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Ataque adicional'] },
  6: { features: ['Mejora de caracterÃ­stica'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['IndÃ³mito'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Ataque adicional'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  13: { features: ['TÃ¡cticas indÃ³mitas'] },
  14: { features: ['Mejora de caracterÃ­stica'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Oleada de acciÃ³n', 'RecuperaciÃ³n del viento'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Ataque adicional'] }
};

const BARD_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'InspiraciÃ³n bÃ¡rdica'] },
  2: { features: ['PolifacÃ©tico', 'CanciÃ³n de descanso'] },
  3: { features: ['Subclase de Bardo', 'Pericia'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Fuente de inspiraciÃ³n'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['Pericia'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['InspiraciÃ³n superior'] }
};

const WARLOCK_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Magia del pacto', 'Favor del patrÃ³n', 'Magia sobrenatural'] },
  2: { features: ['Invocaciones sobrenaturales'] },
  3: { features: ['Subclase de Brujo', 'Regalo del pacto'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Arcanismo mÃ­stico (Nivel 6)'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  13: { features: ['Arcanismo mÃ­stico (Nivel 7)'] },
  14: { features: ['Rasgo de subclase'] },
  15: { features: ['Arcanismo mÃ­stico (Nivel 8)'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Arcanismo mÃ­stico (Nivel 9)'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Maestro sobrenatural'] }
};

const CLERIC_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'Canalizar divinidad'] },
  2: { features: ['Rasgo de subclase'] },
  3: { features: ['Subclase de ClÃ©rigo'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Destruir infrecuentes'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Rasgo de subclase'] },
  10: { features: ['IntervenciÃ³n divina'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['IntervenciÃ³n divina mejorada'] }
};

const DRUID_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'DruÃ­dico'] },
  2: { features: ['Forma salvaje', 'Subclase de Druida'] },
  3: { features: ['Subclase de Druida'] },
  4: { features: ['Forma salvaje mejorada', 'Mejora de caracterÃ­stica'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Forma salvaje mejorada', 'Mejora de caracterÃ­stica'] },
  10: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  18: { features: ['Cuerpo atemporal', 'Conjuros bestiales'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Archidruida'] }
};

const RANGER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Enemigo predilecto', 'Explorador natural'] },
  2: { features: ['Estilo de combate', 'Lanzamiento de conjuros'] },
  3: { features: ['Subclase de Explorador', 'Conciencia primigenia'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Ataque adicional'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Paso de las tierras', 'Mejora de caracterÃ­stica'] },
  10: { features: ['OcultaciÃ³n natural', 'Rasgo de subclase'] },
  11: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Desvanecerse', 'Rasgo de subclase'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  18: { features: ['Sentidos feroces'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Cazador del enemigo'] }
};

const PALADIN_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Imponer las manos', 'Lanzamiento de conjuros (PaladÃ­n)', 'MaestrÃ­a con armas'] },
  2: { features: ['Castigo de paladÃ­n', 'Estilo de combate'] },
  3: { features: ['Canalizar divinidad', 'Subclase de paladÃ­n'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Ataque adicional', 'Corcel fiel'] },
  6: { features: ['Aura de protecciÃ³n'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['Abjurar de los enemigos'] },
  10: { features: ['Aura de coraje'] },
  11: { features: ['Golpes radiantes'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  14: { features: ['Toque reparador'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  18: { features: ['ExpansiÃ³n de aura'] },
  19: { features: ['Don Ã©pico'] },
  20: { features: ['Rasgo de subclase'] }
};

const ROGUE_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Ataque furtivo', 'Jerga de ladrones', 'MaestrÃ­a con armas', 'Pericia'] },
  2: { features: ['AcciÃ³n astuta'] },
  3: { features: ['PunterÃ­a certera', 'Subclase de pÃ­caro'] },
  4: { features: ['Mejora de caracterÃ­stica'] },
  5: { features: ['Esquiva asombrosa', 'Golpe astuto'] },
  6: { features: ['Pericia'] },
  7: { features: ['EvasiÃ³n', 'Talentos fiables'] },
  8: { features: ['Mejora de caracterÃ­stica'] },
  9: { features: ['Rasgo de subclase'] },
  10: { features: ['Mejora de caracterÃ­stica'] },
  11: { features: ['Golpe astuto mejorado'] },
  12: { features: ['Mejora de caracterÃ­stica'] },
  13: { features: ['Rasgo de subclase'] },
  14: { features: ['Golpes taimados'] },
  15: { features: ['Mente escurridiza'] },
  16: { features: ['Mejora de caracterÃ­stica'] },
  17: { features: ['Rasgo de subclase'] },
  18: { features: ['Elusivo'] },
  19: { features: ['Don Ã©pico'] },
  20: { features: ['Golpe de suerte'] }
};

const FEATURE_DESCRIPTIONS_MAP: { [key: string]: string } = {
  // PÃ­caro (Rogue D&D 2024)
  'Ataque furtivo': 'Una vez por turno, puedes infligir daÃ±o adicional (1d6 a nvl 1, aumentando hasta 10d6 a nvl 19) a una criatura a la que aciertes con un arma sutil o a distancia si tienes ventaja en la tirada. No necesitas ventaja si al menos un aliado no incapacitado estÃ¡ a 1,5 m del objetivo y no sufres desventaja.',
  'Jerga de ladrones': 'Conoces el dialecto secreto de los delincuentes y un idioma adicional de tu elecciÃ³n.',
  'AcciÃ³n astuta': 'Tu agilidad mental te permite llevar a cabo una de las siguientes acciones como acciÃ³n adicional en tu turno: Correr, Destrabarse o Esconderse.',
  'PunterÃ­a certera': 'Como acciÃ³n adicional, te concedes ventaja en tu siguiente tirada de ataque del turno actual si no te has movido en este turno. Tras usarlo, tu velocidad es 0 hasta el final del turno.',
  'Subclase de pÃ­caro': 'Consigues una subclase de pÃ­caro de tu elecciÃ³n (Asesino, Embaucador arcano, LadrÃ³n o Rebanaalmas) que te otorga rasgos en los niveles 3, 9, 13 y 17.',
  'Esquiva asombrosa': 'Cuando un atacante que puedas ver te acierte con una tirada de ataque, puedes usar tu reacciÃ³n para reducir a la mitad el daÃ±o que te causa dicho ataque.',
  'Golpe astuto': 'Cuando infliges daÃ±o de Ataque furtivo, puedes renunciar a dados de daÃ±o para aÃ±adir efectos tÃ¡cticos:\nâ€¢ Retirada (coste: 1d6): Te mueves hasta la mitad de tu velocidad sin provocar ataques de oportunidad.\nâ€¢ Tropiezo (coste: 1d6): Objetivo Grande o menor cae derribado si falla salvaciÃ³n de Destreza (CD = 8 + DES + BC).\nâ€¢ Veneno (coste: 1d6): Envenenas al objetivo por 1 minuto si falla salvaciÃ³n de ConstituciÃ³n (requiere Ãºtiles de envenenador).',
  'Talentos fiables': 'Cuando hagas una prueba de caracterÃ­stica que utilice una de tus competencias en habilidades o con herramientas, puedes sustituir un resultado de 9 o menos en el d20 por un 10.',
  'Golpe astuto mejorado': 'Puedes aplicar hasta dos efectos de Golpe astuto en el mismo Ataque furtivo pagando el coste en dados de cada efecto.',
  'Golpes taimados': 'AÃ±ades nuevas opciones avanzadas a tu Golpe astuto:\nâ€¢ Confundir (coste: 2d6): SalvaciÃ³n de ConstituciÃ³n o el objetivo solo puede moverse, o hacer una acciÃ³n, o hacer una acciÃ³n adicional en su prÃ³ximo turno.\nâ€¢ Noquear (coste: 6d6): SalvaciÃ³n de ConstituciÃ³n o el objetivo queda inconsciente durante 1 minuto.\nâ€¢ Ofuscar (coste: 3d6): SalvaciÃ³n de Destreza o el objetivo queda cegado hasta el final de su siguiente turno.',
  'Mente escurridiza': 'Tu disciplina mental te otorga competencia en las tiradas de salvaciÃ³n de SabidurÃ­a y Carisma.',
  'Elusivo': 'Ninguna tirada de ataque contra ti tendrÃ¡ ventaja a menos que tengas el estado de incapacitado.',
  'Golpe de suerte': 'Si fallas una prueba con d20, puedes convertir el resultado en un 20 automÃ¡tico (1 uso por descanso corto o largo).',

  // Subclase: Asesino
  'Asesinar': 'Se te da muy bien emboscar objetivos, lo que te otorga los siguientes beneficios:\nâ€¢ Golpes sorprendentes: Durante el primer asalto de cada combate, tienes ventaja en las tiradas de ataque contra cualquier criatura que aÃºn no haya jugado un turno. Si tu Ataque furtivo acierta a cualquier objetivo durante ese asalto, el objetivo recibirÃ¡ un daÃ±o adicional del tipo del arma igual a tu nivel de pÃ­caro.\nâ€¢ Iniciativa: Tienes ventaja en las tiradas de iniciativa.',
  'Herramientas de asesino': 'Consigues Ãºtiles de envenenador y Ãºtiles para disfrazarse y tienes competencia con ellos.',
  'Pericia en infiltrarse': 'Eres experto en las siguientes tÃ©cnicas de infiltraciÃ³n:\nâ€¢ ImitaciÃ³n magistral: Puedes imitar a la perfecciÃ³n el habla de otra persona, su caligrafÃ­a o ambas si pasas al menos 1 hora estudiÃ¡ndolas.\nâ€¢ PunterÃ­a ambulante: Tu velocidad no se reduce a 0 cuando usas PunterÃ­a certera.',
  'Envenenar armas': 'Cuando utilizas la opciÃ³n de veneno de tu Golpe astuto, el objetivo tambiÃ©n recibirÃ¡ 2d6 de daÃ±o de veneno si falla la tirada de salvaciÃ³n. Este daÃ±o ignora la resistencia al daÃ±o de veneno.',
  'Golpe mortal': 'Cuando aciertes con tu Ataque furtivo en el primer asalto de un combate, el objetivo deberÃ¡ hacer una tirada de salvaciÃ³n de ConstituciÃ³n (CD = 8 + mod. Destreza + BC). Si no la supera, se duplicarÃ¡ el daÃ±o del ataque contra el objetivo.',

  // Subclase: Embaucador Arcano
  'Lanzamiento de conjuros (Embaucador arcano)': 'Preparas y lanzas conjuros de la lista de mago usando Inteligencia como tu aptitud mÃ¡gica (CD = 8 + mod. Inteligencia + BC). Conoces 3 trucos (incluyendo mano de mago) y preparas conjuros segÃºn la tabla de Embaucador arcano.',
  'Destreza con mano de mago': 'Cuando lanzas mano de mago, puedes hacerlo como acciÃ³n adicional y de modo que la mano espectral sea invisible. Puedes controlar la mano como acciÃ³n adicional y usarla para hacer pruebas de Destreza (Juego de manos).',
  'Emboscada mÃ¡gica': 'Si tienes el estado de invisible cuando lanzes un conjuro sobre una criatura, tendrÃ¡ desventaja en cualquier tirada de salvaciÃ³n que haga contra el conjuro ese mismo turno.',
  'Embaucador versÃ¡til': 'Obtienes la capacidad de distraer a los objetivos con tu mano de mago. Cuando utilizas la opciÃ³n de tropiezo de tu Golpe astuto sobre una criatura, tambiÃ©n podrÃ¡s usar esa opciÃ³n sobre otra criatura a 1,5 m o menos de la mano espectral.',
  'LadrÃ³n de conjuros': 'Inmediatamente despuÃ©s de que una criatura lance un conjuro que te haga objetivo o cuya Ã¡rea te incluya, puedes usar tu reacciÃ³n para obligar a la criatura a hacer una salvaciÃ³n de Inteligencia (vs tu CD de conjuros). Si la falla, anulas los efectos sobre ti y robas el conocimiento del conjuro durante 8 horas (la criatura no puede lanzarlo en ese tiempo). 1/descanso largo.',

  // Subclase: LadrÃ³n
  'Balconero': 'Entrenamiento de exploraciÃ³n urbana y vertiginosa:\nâ€¢ Escalador: Obtienes una velocidad trepando igual a tu velocidad de movimiento.\nâ€¢ Saltador: Puedes determinar tu distancia de salto empleando tu Destreza en lugar de tu Fuerza.',
  'Manos rÃ¡pidas': 'Como acciÃ³n adicional en tu turno, puedes hacer una de las siguientes cosas:\nâ€¢ Juego de manos: Prueba de Destreza (Juego de manos) para robar o usar herramientas de ladrÃ³n para forzar una cerradura o desarmar una trampa.\nâ€¢ Usar un objeto: Empleas la acciÃ³n de utilizar o la acciÃ³n de magia para usar un objeto mÃ¡gico que necesite una acciÃ³n.',
  'Sigilo supremo': 'Obtienes la opciÃ³n de Golpe astuto "Ataque sigiloso" (coste: 1d6): Si tienes el estado de invisible por una acciÃ³n de esconderse, este ataque no pone fin a ese estado si terminas el turno tras cobertura tres cuartos o cobertura completa.',
  'Usar objetos mÃ¡gicos': 'MÃ¡ximo provecho de objetos mÃ¡gicos:\nâ€¢ Cargas: Al usar un objeto mÃ¡gico que gaste cargas, tira 1d6. Si sacas 6, no gastas cargas.\nâ€¢ Pergaminos: Usas cualquier pergamino de conjuro con Inteligencia. Lanzas de nivel 0-1 de forma fiable, o superando prueba de Inteligencia (Arcano) CD 10 + nivel para niveles superiores.\nâ€¢ SintonizaciÃ³n: Te sintonizas con hasta 4 objetos mÃ¡gicos a la vez.',
  'Reflejos de ladrÃ³n': 'Puedes actuar dos turnos durante el primer asalto de cualquier combate (el primero en tu iniciativa normal y el segundo a tu iniciativa menos 10).',

  // Subclase: Rebanaalmas
  'Cuchillas psÃ­quicas': 'ManifestaciÃ³n de energÃ­a psiÃ³nica pura:\nâ€¢ Ataque: Cuchilla psÃ­quica sutil y arrojadiza (18/36 m) que inflige 1d6 de daÃ±o psÃ­quico + mod. atributo.\nâ€¢ Ataque extra: Como acciÃ³n adicional tras atacar con la cuchilla, realizas un segundo ataque con otra cuchilla que inflige 1d4 de daÃ±o psÃ­quico.',
  'Poder psiÃ³nico': 'Posees una reserva de Dados de energÃ­a psiÃ³nica (4d6 a nvl 3, aumentando a 12d12 a nvl 17) que recuperas tras descanso corto/largo:\nâ€¢ Don psirreforzado: Si fallas una prueba de habilidad/herramienta competente, tiras 1 dado y lo sumas al resultado. El dado solo se gasta si la prueba tiene Ã©xito.\nâ€¢ Susurros psÃ­quicos: Red telepÃ¡tica con hasta BC aliados por horas igual a la tirada (1Âª vez gratis tras descanso largo).',
  'Cuchillas del alma': 'Mejoras con tu cuchilla psÃ­quica:\nâ€¢ Golpes teledirigidos: Si fallas un ataque con cuchilla psÃ­quica, tiras 1 dado de energÃ­a psiÃ³nica y lo sumas a la tirada de ataque (solo se gasta si aciertas).\nâ€¢ Teletransporte psÃ­quico: AcciÃ³n adicional gastando 1 dado para teletransportarte a hasta 3 Ã— el resultado metros.',
  'Velo psÃ­quico': 'Como acciÃ³n de magia, te vuelves invisible durante 1 hora (termina si infliges daÃ±o o fuerzas salvaciÃ³n). 1/descanso largo o gastando 1 dado de energÃ­a psiÃ³nica.',
  'Desgarro mental': 'Cuando infligas daÃ±o de Ataque furtivo con tus cuchillas psÃ­quicas, fuerzas al objetivo a superar una salvaciÃ³n de SabidurÃ­a (CD = 8 + DES + BC) o quedarÃ¡ aturdido durante 1 minuto. 1/descanso largo o gastando 3 dados de energÃ­a psiÃ³nica.',
  // PaladÃ­n (Paladin D&D 2024)
  'Imponer las manos': 'Tu toque bendito puede curar heridas. Tienes una reserva de poder de curaciÃ³n que se rellena tras finalizar un descanso largo (igual a 5 veces tu nivel de paladÃ­n).\nComo acciÃ³n adicional, puedes tocar a una criatura (que puedes ser tÃº) y extraer energÃ­a de la reserva para restaurar Puntos de Golpe.\nTambiÃ©n puedes gastar 5 puntos de golpe de la reserva para eliminar el estado de envenenada de la criatura (o aturdida, cegada, ensordecida, hechizada o paralizada a nivel 14 con Toque reparador).',
  'Lanzamiento de conjuros (PaladÃ­n)': 'Has aprendido a lanzar conjuros gracias a la oraciÃ³n y la meditaciÃ³n. Utilizas tu Carisma como aptitud mÃ¡gica para tus conjuros de paladÃ­n (CD de salvaciÃ³n = 8 + mod. Carisma + BC; Ataque = mod. Carisma + BC). Puedes utilizar un sÃ­mbolo sagrado como canalizador mÃ¡gico.',
  'Castigo de paladÃ­n': 'Siempre tienes el conjuro castigo divino preparado. AdemÃ¡s, puedes lanzarlo una vez sin gastar un espacio de conjuro, recuperando la capacidad de hacerlo tras finalizar un descanso largo.',
  'Canalizar divinidad': 'Puedes canalizar energÃ­a divina directamente de los Planos Exteriores (2 usos a nivel 3, 3 a nivel 11). Recuperas 1 uso tras un descanso corto y todos tras un descanso largo.\nEmpiezas con Sentidos divinos: como acciÃ³n adicional, detectas celestiales, infernales, muertos vivientes y zonas sagradas/profanadas a 18 m durante 10 minutos.',
  'Subclase de paladÃ­n': 'Consigues una subclase de paladÃ­n de tu elecciÃ³n (Juramento de entrega, Juramento de la gloria, Juramento de los antiguos o Juramento de venganza) que te otorga rasgos en los niveles 3, 7, 15 y 20.',
  'Corcel fiel': 'Puedes invocar la ayuda de un corcel sobrenatural. Siempre tienes el conjuro hallar corcel preparado. TambiÃ©n puedes lanzarlo una vez sin gastar un espacio de conjuro por descanso largo.',
  'Aura de protecciÃ³n': 'Irradias un aura protectora e invisible en una emanaciÃ³n de 3 m (9 m a nivel 18). Tus aliados dentro del aura y tÃº obtenÃ©is un bonificador a todas las tiradas de salvaciÃ³n igual a tu modificador por Carisma (mÃ­nimo de +1).',
  'Abjurar de los enemigos': 'Como acciÃ³n de magia, puedes gastar uno de los usos de Canalizar divinidad para sobrecoger a tus enemigos. Muestras tu sÃ­mbolo sagrado o arma a una cantidad de criaturas a 18 m o menos igual a tu modificador por Carisma (mÃ­nimo 1). Cada objetivo deberÃ¡ superar una tirada de salvaciÃ³n de SabidurÃ­a o quedarÃ¡ asustado durante 1 minuto.',
  'Aura de coraje': 'Tus aliados y tÃº tenÃ©is inmunidad al estado de asustado mientras estÃ©is dentro de tu Aura de protecciÃ³n.',
  'Golpes radiantes': 'Tus golpes tienen un poder sobrenatural. Cuando aciertes a un objetivo con una tirada de ataque usando un arma cuerpo a cuerpo o un ataque sin armas, el objetivo recibirÃ¡ 1d8 de daÃ±o radiante adicional.',
  'Toque reparador': 'Cuando uses Imponer las manos sobre una criatura, tambiÃ©n podrÃ¡s eliminar uno o mÃ¡s de los siguientes estados gastando 5 puntos de golpe de la reserva por cada uno: asustado, aturdido, cegado, ensordecido, hechizado o paralizado.',
  'ExpansiÃ³n de aura': 'Tu Aura de protecciÃ³n ahora es una emanaciÃ³n de 9 m (30 ft) de radio.',

  // Subclase: Juramento de Entrega
  'Arma sagrada': 'Cuando realizas la acciÃ³n de atacar, puedes gastar uno de los usos de Canalizar divinidad para imbuir de energÃ­a positiva un arma cuerpo a cuerpo que sostengas. Durante 10 minutos o hasta que vuelvas a usar este rasgo, sumas tu modificador por Carisma a las tiradas de ataque que hagas con esa arma (mÃ­nimo de +1), y cada vez que aciertes con ella, haces que inflija su tipo de daÃ±o normal o daÃ±o radiante. El arma emite luz brillante en un radio de 6 m y luz tenue 6 m mÃ¡s allÃ¡. Puedes poner fin a este efecto antes (no requiere acciÃ³n). El efecto tambiÃ©n terminarÃ¡ si no llevas el arma contigo.',
  'Conjuros del juramento de entrega': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\nâ€¢ Nvl 3: Escudo de fe, ProtecciÃ³n contra el bien y el mal\nâ€¢ Nvl 5: Auxilio, Zona de la verdad\nâ€¢ Nvl 9: Disipar magia, SeÃ±al de esperanza\nâ€¢ Nvl 13: GuardiÃ¡n de la fe, Libertad de movimiento\nâ€¢ Nvl 17: ComuniÃ³n, Golpe flamÃ­gero',
  'Aura de entrega': 'Tus aliados y tÃº tenÃ©is inmunidad al estado de hechizados mientras estÃ©is dentro de tu Aura de protecciÃ³n. Si un aliado hechizado entra en el aura, ese estado no tendrÃ¡ efecto en Ã©l mientras estÃ© dentro.',
  'Castigo protector': 'Tu castigo mÃ¡gico ahora irradia energÃ­a protectora. Siempre que lances castigo divino, tus aliados y tÃº tenÃ©is cobertura media mientras estÃ©is dentro de tu Aura de protecciÃ³n. El aura tiene este beneficio hasta el principio de tu siguiente turno.',
  'Halo sagrado': 'Como acciÃ³n adicional, puedes imbuir de poder divino tu Aura de protecciÃ³n durante 10 minutos (1/descanso largo o gastando un espacio de conjuro de nivel 5):\nâ€¢ DaÃ±o radiante: Los enemigos que comiencen su turno en el aura reciben daÃ±o radiante igual a tu modificador por Carisma + bonificador por competencia.\nâ€¢ Luz solar: El aura estÃ¡ llena de luz brillante del sol.\nâ€¢ ProtecciÃ³n sagrada: Tienes ventaja en las tiradas de salvaciÃ³n contra infernales o muertos vivientes.',

  // Subclase: Juramento de la Gloria
  'Atleta sin parangÃ³n': 'Como acciÃ³n adicional, puedes gastar uno de los usos de Canalizar divinidad para potenciar tus capacidades atlÃ©ticas. Durante 1 hora, tendrÃ¡s ventaja en las pruebas de Fuerza (Atletismo) y Destreza (Acrobacias) y la distancia de tus saltos de longitud y de altura aumentarÃ¡ en 3 m.',
  'Castigo inspirador': 'Inmediatamente despuÃ©s de que lances castigo divino, puedes gastar uno de los usos de Canalizar divinidad para distribuir puntos de golpe temporales entre criaturas de tu elecciÃ³n (que puede incluirte a ti) que estÃ©n a 9 m o menos de ti. La cantidad total es igual a 2d8 + nivel de paladÃ­n.',
  'Conjuros del juramento de gloria': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\nâ€¢ Nvl 3: HeroÃ­smo, Saeta guÃ­a\nâ€¢ Nvl 5: Arma mÃ¡gica, Potenciar caracterÃ­stica\nâ€¢ Nvl 9: Acelerar, ProtecciÃ³n contra energÃ­a\nâ€¢ Nvl 13: CompulsiÃ³n, Libertad de movimiento\nâ€¢ Nvl 17: Conocer las leyendas, Presencia regia de Yolande',
  'Aura de celeridad': 'Tu velocidad aumenta en 3 m. AdemÃ¡s, siempre que un aliado entre en tu Aura de protecciÃ³n por primera vez en un turno o comience su turno dentro de ella, la velocidad de ese aliado aumentarÃ¡ en 3 m hasta el final de su prÃ³ximo turno.',
  'Defensa gloriosa': 'Si una tirada de ataque acierta a ti o a una criatura a 3 m o menos de ti, puedes usar tu reacciÃ³n para sumar un bonificador a la CA del objetivo igual a tu modificador por Carisma (mÃ­nimo de +1). Si el ataque falla, como parte de esta reacciÃ³n puedes hacer un ataque con arma contra el atacante. Usos iguales a tu mod. Carisma por descanso largo.',
  'Leyenda viviente': 'Como acciÃ³n adicional, obtienes beneficios durante 10 minutos (1/descanso largo o gastando un espacio de nivel 5):\nâ€¢ CarismÃ¡tico: Ventaja en todas las pruebas de Carisma.\nâ€¢ Golpe certero: 1/turno, si fallas una tirada de ataque con arma, puedes hacer que acierte.\nâ€¢ Repetir tiradas de salvaciÃ³n: Si fallas una tirada de salvaciÃ³n, puedes usar tu reacciÃ³n para repetirla.',

  // Subclase: Juramento de los Antiguos
  'Ira de la naturaleza': 'Como acciÃ³n de magia, puedes gastar uno de los usos de Canalizar divinidad para invocar enredaderas espectrales. Todas las criaturas de tu elecciÃ³n a 4,5 m o menos deben superar una salvaciÃ³n de Fuerza o tendrÃ¡n el estado de apresadas durante 1 minuto (pueden repetir la salvaciÃ³n al final de cada turno).',
  'Conjuros del juramento de los antiguos': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\nâ€¢ Nvl 3: Golpe apresador, Hablar con los animales\nâ€¢ Nvl 5: Paso brumoso, Rayo de luna\nâ€¢ Nvl 9: Crecimiento vegetal, ProtecciÃ³n contra energÃ­a\nâ€¢ Nvl 13: Piel pÃ©trea, Tormenta de hielo\nâ€¢ Nvl 17: ComuniÃ³n con la naturaleza, Paso arbÃ³reo',
  'Aura de salvaguarda': 'Tus aliados y tÃº tenÃ©is resistencia al daÃ±o necrÃ³tico, psÃ­quico y radiante mientras estÃ©is dentro de tu Aura de protecciÃ³n.',
  'Centinela imperecedero': 'Cuando tus puntos de golpe se reduzcan a 0 pero no mueres inmediatamente, puedes quedarte con 1 punto de golpe y recuperar puntos igual a 3 veces tu nivel de paladÃ­n (1/descanso largo). AdemÃ¡s, no puedes envejecer por medios mÃ¡gicos.',
  'CampeÃ³n ancestral': 'Como acciÃ³n adicional, imbuyes tu aura durante 1 minuto (1/descanso largo o espacio nivel 5):\nâ€¢ Conjuros veloces: Lanzas conjuros de 1 acciÃ³n usando una acciÃ³n adicional.\nâ€¢ Mermar la oposiciÃ³n: Enemigos en el aura tienen desventaja en salvaciones contra tus conjuros y Canalizar divinidad.\nâ€¢ RegeneraciÃ³n: Al principio de tu turno, recuperas 10 HP.',

  // Subclase: Juramento de Venganza
  'Voto de enemistad': 'Cuando realizas la acciÃ³n de atacar, puedes gastar un uso de Canalizar divinidad para jurar enemistad contra una criatura a 9 m o menos. Tienes ventaja en las tiradas de ataque contra ella durante 1 minuto (si sus HP caen a 0, puedes transferir el voto a otra criatura a 9 m sin acciÃ³n).',
  'Conjuros del juramento de venganza': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\nâ€¢ Nvl 3: Marca del cazador, PerdiciÃ³n\nâ€¢ Nvl 5: Inmovilizar persona, Paso brumoso\nâ€¢ Nvl 9: Acelerar, ProtecciÃ³n contra energÃ­a\nâ€¢ Nvl 13: Destierro, Puerta dimensional\nâ€¢ Nvl 17: EscudriÃ±ar, Inmovilizar monstruo',
  'Vengador implacable': 'Cuando aciertes un ataque de oportunidad contra una criatura, puedes reducir su velocidad a 0 hasta el final del turno y moverte hasta la mitad de tu velocidad como parte de la misma reacciÃ³n sin provocar ataques de oportunidad.',
  'EspÃ­ritu vengativo': 'Inmediatamente despuÃ©s de que una criatura bajo los efectos de tu Voto de enemistad acierte o falle un ataque, puedes usar tu reacciÃ³n para hacer un ataque cuerpo a cuerpo contra ella.',
  'Ãngel vengador': 'Como acciÃ³n adicional, obtienes beneficios durante 10 minutos (1/descanso largo o espacio nivel 5):\nâ€¢ Aura aterradora: Enemigos que comiencen su turno en tu aura deben superar una salvaciÃ³n de SabidurÃ­a o quedan asustados por 1 min (ataques contra criaturas asustadas tienen ventaja).\nâ€¢ Vuelo: Te crecen alas espectrales con velocidad volando de 18 m y levitaciÃ³n.',
  // Monje (Monk D&D 2024)
  'Artes marciales': 'La prÃ¡ctica de las artes marciales te otorga un dominio de los estilos de combate que emplean ataques sin armas y armas de monje (armas cuerpo a cuerpo sencillas y marciales ligeras):\nâ€¢ Ataque sin armas adicional: Puedes hacer un ataque sin armas como acciÃ³n adicional.\nâ€¢ Dado de Artes marciales: Puedes tirar 1d6 (1d8 a nvl 5, 1d10 a nvl 11, 1d12 a nvl 17) en lugar del daÃ±o normal de tus ataques sin armas y armas de monje.\nâ€¢ Ataques diestros: Puedes usar tu modificador por Destreza en lugar de Fuerza para las tiradas de ataque y daÃ±o de tus ataques sin armas y armas de monje. AdemÃ¡s, cuando uses agarre o empujÃ³n con tu ataque sin armas, puedes usar Destreza en lugar de Fuerza para la CD de salvaciÃ³n (CD = 8 + mod. Destreza + BC).',
  'ConcentraciÃ³n de monje': 'Tu concentraciÃ³n y entrenamiento marcial te permiten utilizar una reserva interna de Puntos de ConcentraciÃ³n (igual a tu nivel de monje) que recuperas tras un descanso corto o largo. Tu CD de salvaciÃ³n para rasgos de concentraciÃ³n es igual a 8 + mod. SabidurÃ­a + BC.\nEmpiezas con tres de estos rasgos:\nâ€¢ Defensa paciente: Puedes llevar a cabo la acciÃ³n de destrabarse como acciÃ³n adicional. De manera alternativa, puedes gastar 1 punto de concentraciÃ³n para llevar a cabo tanto la acciÃ³n de destrabarse como la de esquivar como acciÃ³n adicional.\nâ€¢ Paso del viento: Puedes llevar a cabo la acciÃ³n de correr como acciÃ³n adicional. De manera alternativa, puedes gastar 1 punto de concentraciÃ³n para llevar a cabo tanto la acciÃ³n de destrabarse como la de correr como acciÃ³n adicional, y tu distancia de salto se duplicarÃ¡ durante el turno.\nâ€¢ RÃ¡faga de golpes: Puedes gastar 1 punto de concentraciÃ³n para hacer dos ataques sin armas como acciÃ³n adicional.',
  'Metabolismo asombroso': 'Cuando tires iniciativa, puedes recuperar todos los puntos de concentraciÃ³n gastados. Cuando lo hagas, tira tu dado de Artes marciales y recupera una cantidad de puntos de golpe igual a tu nivel de monje mÃ¡s el resultado obtenido. 1 uso por descanso largo.',
  'Movimiento sin armadura': 'Tu velocidad aumenta en 3 m (10 ft) si no llevas armadura ni portas un escudo. Esta bonificaciÃ³n aumenta a +4,5 m (nvl 6), +6 m (nvl 10), +7,5 m (nvl 14) y +9 m (nvl 18).',
  'Desviar ataques': 'Cuando una tirada de ataque te acierte y su daÃ±o incluya los tipos contundente, cortante o perforante, puedes usar tu reacciÃ³n para reducir el daÃ±o total en 1d10 + mod. Destreza + nivel de monje.\nSi reduces el daÃ±o a 0, puedes gastar 1 punto de concentraciÃ³n para redirigir el ataque: elige una criatura a 1,5 m o menos (cuerpo a cuerpo) o a 18 m o menos (a distancia). La criatura debe superar una tirada de salvaciÃ³n de Destreza (vs CD de ConcentraciÃ³n) o sufrirÃ¡ un daÃ±o igual a dos tiradas de tu dado de Artes marciales + mod. Destreza del mismo tipo de daÃ±o.',
  'Subclase de monje': 'Consigues una subclase de monje de tu elecciÃ³n (Guerrero de la Mano Abierta, Guerrero de la Misericordia, Guerrero de la Sombra o Guerrero de los Elementos) que te otorga rasgos en los niveles 3, 6, 11 y 17.',
  'CaÃ­da lenta': 'Puedes llevar a cabo una reacciÃ³n cuando caigas para reducir cualquier daÃ±o que sufras de la caÃ­da en una cantidad igual a cinco veces tu nivel de monje.',
  'Golpe aturdidor': 'Una vez por turno cuando aciertes a una criatura con un arma de monje o un ataque sin armas, puedes gastar 1 punto de concentraciÃ³n para intentar propinar un golpe aturdidor. El objetivo deberÃ¡ hacer una tirada de salvaciÃ³n de ConstituciÃ³n (vs CD de ConcentraciÃ³n). Si la falla, tendrÃ¡ el estado de aturdido hasta el principio de tu siguiente turno. Si la supera, su velocidad se reducirÃ¡ a la mitad hasta el principio de tu siguiente turno y la siguiente tirada de ataque realizada contra Ã©l tendrÃ¡ ventaja.',
  'Golpes potenciados': 'Siempre que inflijas daÃ±o con tu ataque sin armas, puedes elegir entre causar daÃ±o de fuerza o su tipo de daÃ±o normal.',
  'EvasiÃ³n': 'Cuando sufras un efecto que te permita hacer una tirada de salvaciÃ³n de Destreza para sufrir solo la mitad de daÃ±o, no recibes daÃ±o alguno si la superas y solo sufres la mitad si la fallas. No te beneficias si tienes el estado de incapacitado.',
  'Movimiento acrobÃ¡tico': 'Mientras no lleves armadura ni portes un escudo, obtienes la capacidad de moverte por superficies verticales y sobre lÃ­quidos sin caerte.',
  'Autorrestablecimiento': 'Por pura fuerza de voluntad, puedes eliminar uno de los siguientes estados que te afecten al final de cada uno de tus turnos: asustado, envenenado o hechizado. AdemÃ¡s, privarte de comida y bebida no te aplica niveles de cansancio.',
  'ConcentraciÃ³n agudizada': 'Tus rasgos Defensa paciente, Paso del viento y RÃ¡faga de golpes obtienen los siguientes beneficios:\nâ€¢ Defensa paciente: Cuando gastes un punto de concentraciÃ³n para usar Defensa paciente, obtienes una cantidad de puntos de golpe temporales igual al resultado de dos tiradas de tu dado de Artes marciales.\nâ€¢ Paso del viento: Cuando gastes un punto de concentraciÃ³n para usar Paso del viento, puedes elegir una criatura voluntaria Grande o mÃ¡s pequeÃ±a que estÃ© a 1,5 m o menos de ti. MoverÃ¡s a la criatura contigo hasta el final de tu turno sin provocar ataques de oportunidad.\nâ€¢ RÃ¡faga de golpes: Puedes gastar 1 punto de concentraciÃ³n para usar RÃ¡faga de golpes y hacer tres ataques sin armas en lugar de dos.',
  'Desviar energÃ­a': 'Ahora puedes usar tu rasgo Desviar ataques contra ataques que causen cualquier tipo de daÃ±o, no solo contundente, cortante o perforante.',
  'Superviviente disciplinado': 'Tu disciplina fÃ­sica y mental te otorga competencia en todas las tiradas de salvaciÃ³n. AdemÃ¡s, cuando hagas una tirada de salvaciÃ³n y falles, puedes gastar 1 punto de concentraciÃ³n para repetirla, pero deberÃ¡s utilizar el nuevo resultado.',
  'ConcentraciÃ³n perfecta': 'Cuando tires iniciativa y no utilices Metabolismo asombroso, recuperas los puntos de concentraciÃ³n gastados hasta que tengas 4 si te quedan 3 o menos.',
  'Defensa superior': 'Al principio de tu turno, puedes gastar 3 puntos de concentraciÃ³n para protegerte del daÃ±o durante 1 minuto o hasta que tengas el estado de incapacitado. Durante ese tiempo, tendrÃ¡s resistencia a todo el daÃ±o excepto al de fuerza.',
  'Cuerpo y mente': 'Has llevado tu cuerpo y mente a otro nivel. Tus puntuaciones de Destreza y SabidurÃ­a aumentan en 4, hasta un mÃ¡ximo de 25.',

  // Guerrero de la Mano Abierta
  'TÃ©cnica de la mano abierta': 'Siempre que aciertes a una criatura con un ataque proporcionado por RÃ¡faga de golpes, puedes imponerle uno de los siguientes efectos:\nâ€¢ Derribar: El objetivo deberÃ¡ superar una tirada de salvaciÃ³n de Destreza (vs CD de ConcentraciÃ³n) o tendrÃ¡ el estado de derribado.\nâ€¢ Desconcertar: El objetivo no podrÃ¡ realizar ataques de oportunidad hasta el principio de su siguiente turno.\nâ€¢ Empujar: El objetivo deberÃ¡ superar una tirada de salvaciÃ³n de Fuerza (vs CD de ConcentraciÃ³n) o serÃ¡ empujado hasta 4,5 m respecto a ti.',
  'Plenitud de cuerpo': 'Obtienes la capacidad de sanar tu propio cuerpo. Como acciÃ³n adicional, puedes tirar tu dado de Artes marciales. Recuperas una cantidad de puntos de golpe igual al resultado mÃ¡s tu modificador por SabidurÃ­a (recuperas 1 punto de golpe como mÃ­nimo).\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por SabidurÃ­a (mÃ­nimo una vez) y recuperas todos los usos tras finalizar un descanso largo.',
  'Paso veloz': 'Cuando utilices una acciÃ³n adicional que no sea Paso del viento, podrÃ¡s usar tambiÃ©n Paso del viento inmediatamente despuÃ©s de esa acciÃ³n adicional.',
  'Palma estremecedora': 'Consigues la capacidad de transmitir vibraciones letales al cuerpo de un oponente. Cuando aciertes a una criatura con un ataque sin armas, puedes gastar 4 puntos de concentraciÃ³n para iniciar estas vibraciones imperceptibles, que durarÃ¡n tantos dÃ­as como tu nivel de monje. Las vibraciones son inofensivas, salvo si usas tu acciÃ³n para hacer que terminen. Como alternativa, cuando lleves a cabo la acciÃ³n de atacar en tu turno, puedes renunciar a uno de los ataques para poner fin a las vibraciones. Para ello, el objetivo y tÃº debÃ©is estar en el mismo plano de existencia. Cuando les pongas fin, el objetivo deberÃ¡ realizar una tirada de salvaciÃ³n de ConstituciÃ³n (vs CD de ConcentraciÃ³n); sufrirÃ¡ 10d12 de daÃ±o de fuerza si la falla o la mitad del daÃ±o si la supera.\nSolo puedes tener a una criatura bajo el efecto de este rasgo al mismo tiempo. Puedes poner fin a las vibraciones de forma inocua (no requiere acciÃ³n).',

  // Guerrero de la Misericordia
  'Instrumentos de misericordia': 'Ganas competencia en las habilidades Medicina y Perspicacia y con los Ãºtiles de herborista.',
  'Mano de aflicciÃ³n': 'Una vez por turno, cuando aciertes a una criatura con un ataque sin armas y le causes daÃ±o, puedes gastar 1 punto de concentraciÃ³n para infligir una cantidad adicional de daÃ±o necrÃ³tico igual al resultado de una tirada de tu dado de Artes marciales mÃ¡s tu modificador por SabidurÃ­a.',
  'Mano de curaciÃ³n': 'Como acciÃ³n de magia, puedes gastar 1 punto de concentraciÃ³n para tocar a una criatura y hacer que recupere una cantidad de puntos de golpe igual al resultado de una tirada de tu dado de Artes marciales mÃ¡s tu modificador por SabidurÃ­a.\nCuando uses RÃ¡faga de golpes, puedes sustituir uno de los ataques sin armas por un uso de este rasgo sin gastar un punto de concentraciÃ³n para curar.',
  'Toque de Galeno': 'Tu Mano de aflicciÃ³n y Mano de curaciÃ³n mejoran:\nâ€¢ Mano de aflicciÃ³n: Cuando uses Mano de aflicciÃ³n en una criatura, tambiÃ©n podrÃ¡s infligirle el estado de envenenada hasta el final de tu siguiente turno.\nâ€¢ Mano de curaciÃ³n: Cuando uses Mano de curaciÃ³n, tambiÃ©n podrÃ¡s poner fin a uno de los siguientes estados en la criatura a la que cures: aturdida, cegada, ensordecida, envenenada o paralizada.',
  'RÃ¡faga de curaciÃ³n y aflicciÃ³n': 'Cuando uses RÃ¡faga de golpes, puedes sustituir cada uno de los ataques sin armas por un uso de Mano de curaciÃ³n sin gastar puntos de concentraciÃ³n para curar.\nAdemÃ¡s, cuando hagas un ataque sin armas con RÃ¡faga de golpes y causes daÃ±o, podrÃ¡s usar Mano de aflicciÃ³n en ese ataque sin gastar un punto de concentraciÃ³n (mÃ¡ximo una vez por turno).\nPuedes utilizar estos beneficios una cantidad de veces igual a tu modificador por SabidurÃ­a (mÃ­nimo una vez). Recuperas todos los usos tras finalizar un descanso largo.',
  'Mano de misericordia suprema': 'Tu dominio de la energÃ­a vital te abre las puertas de la misericordia suprema. Como acciÃ³n de magia, puedes tocar el cadÃ¡ver de una criatura que haya muerto en las Ãºltimas 24 horas y gastar 5 puntos de concentraciÃ³n. La criatura volverÃ¡ a la vida con una cantidad de puntos de golpe igual a 4d10 mÃ¡s tu modificador por SabidurÃ­a. Si la criatura muriÃ³ mientras tenÃ­a alguno de los siguientes estados, revivirÃ¡ sin ellos: aturdida, cegada, ensordecida, envenenada y paralizada.\nCuando uses este rasgo, no podrÃ¡s volver a hacerlo hasta que finalices un descanso largo.',

  // Guerrero de la Sombra
  'Artes sombrÃ­as': 'Has aprendido a manejar el poder del PÃ¡ramo SombrÃ­o, lo que te proporciona los siguientes beneficios:\nâ€¢ Ilusiones sombrÃ­as: Conoces el truco ilusiÃ³n menor. La SabidurÃ­a es tu aptitud mÃ¡gica para lanzarlo.\nâ€¢ Oscuridad: Puedes gastar 1 punto de concentraciÃ³n para lanzar el conjuro oscuridad sin necesidad de componentes. Puedes ver dentro de la zona del conjuro cuando lo lanzas con este rasgo. Mientras se mantenga el conjuro, podrÃ¡s mover la zona de oscuridad a un espacio a 18 m o menos de ti al principio de cada uno de tus turnos.\nâ€¢ VisiÃ³n en la oscuridad: Obtienes visiÃ³n en la oscuridad hasta 18 m. Si ya posees visiÃ³n en la oscuridad, su alcance aumenta en 18 m.',
  'Paso entre sombras': 'Cuando estÃ©s por completo en una zona de luz tenue u oscuridad, puedes utilizar una acciÃ³n adicional para teletransportarte hasta 18 m a un espacio sin ocupar que puedas ver y que tambiÃ©n estÃ© en condiciones de luz tenue u oscuridad. Luego tendrÃ¡s ventaja en el siguiente ataque cuerpo a cuerpo que hagas antes del final de ese turno.',
  'Paso entre sombras mejorado': 'Puedes recurrir a tu conexiÃ³n con el PÃ¡ramo SombrÃ­o para potenciar tu teletransportaciÃ³n. Cuando uses Paso entre sombras, puedes gastar 1 punto de concentraciÃ³n para eliminar el requisito de comenzar y terminar en una zona de luz tenue u oscuridad para ese uso del rasgo. Como parte de esta acciÃ³n adicional, puedes hacer un ataque sin armas inmediatamente despuÃ©s de teletransportarte.',
  'Capa de sombras': 'Como acciÃ³n de magia cuando estÃ©s por completo en una zona de luz tenue u oscuridad, puedes gastar 3 puntos de concentraciÃ³n para envolverte en sombras durante 1 minuto, hasta que tengas el estado de incapacitado o hasta que me termines tu turno en una zona de luz brillante. Mientras estÃ©s envuelto en estas sombras, obtienes los siguientes beneficios:\nâ€¢ Incorporeidad parcial: Puedes atravesar espacios ocupados como si fueran terreno difÃ­cil.\nâ€¢ Invisibilidad: Tienes el estado de invisible.\nâ€¢ RÃ¡faga de sombras: Puedes utilizar tu RÃ¡faga de golpes sin gastar puntos de concentraciÃ³n.',

  // Guerrero de los Elementos
  'ArmonÃ­a con los elementos': 'Al principio de tu turno, puedes gastar 1 punto de concentraciÃ³n para imbuirte de energÃ­a elemental. La energÃ­a dura 10 minutos o hasta que tengas el estado de incapacitado. Mientras este rasgo estÃ© activo, obtienes los siguientes beneficios:\nâ€¢ Alcance: Cuando realizas un ataque sin armas, tu alcance es 3 m superior al normal, ya que la energÃ­a elemental surge de ti.\nâ€¢ Golpes elementales: Siempre que aciertes con tu ataque sin armas, puedes hacer que cause el tipo de daÃ±o que quieras entre Ã¡cido, frÃ­o, fuego, relÃ¡mpago o trueno en vez de su tipo de daÃ±o normal. Cuando inflijas uno de estos tipos con Ã©l, tambiÃ©n puedes obligar al objetivo a hacer una tirada de salvaciÃ³n de Fuerza. Si la falla, puedes mover al objetivo hasta 3 m hacia ti o en direcciÃ³n contraria, ya que la energÃ­a elemental se arremolina a su alrededor.',
  'Manipular los elementos': 'Conoces el truco elementalismo. La SabidurÃ­a es tu aptitud mÃ¡gica para lanzarlo.',
  'ExplosiÃ³n elemental': 'Como acciÃ³n de magia, puedes gastar 2 puntos de concentraciÃ³n para que la energÃ­a elemental explote en una esfera de 6 m de radio centrada en un punto a 36 m o menos de ti. Elige un tipo de daÃ±o: Ã¡cido, frÃ­o, fuego, relÃ¡mpago o trueno.\nTodas las criaturas situadas en esa esfera deberÃ¡n hacer una tirada de salvaciÃ³n de Destreza. Si la fallan, sufrirÃ¡n una cantidad de daÃ±o del tipo elegido igual al resultado de tres tiradas de tu dado de Artes marciales. Si la superan, recibirÃ¡n la mitad de ese daÃ±o.',
  'Paso de los elementos': 'Mientras tu ArmonÃ­a con los elementos estÃ© activa, tendrÃ¡s tambiÃ©n una velocidad nadando y una velocidad volando iguales a tu velocidad.',
  'Paradigma elemental': 'Mientras tu ArmonÃ­a con los elementos estÃ© activa, obtienes tambiÃ©n los siguientes beneficios:\nâ€¢ Golpes potenciados: Una vez en cada uno de tus turnos, puedes causar a un objetivo una cantidad adicional de daÃ±o igual al resultado de una tirada de tu dado de Artes marciales cuando le aciertes con un ataque sin armas. El daÃ±o adicional serÃ¡ del mismo tipo que inflija el ataque.\nâ€¢ Paso destructivo: Cuando utilices tu Paso del viento, tu velocidad aumenta en 6 m hasta el final del turno. Durante ese tiempo, cualquier criatura de tu elecciÃ³n sufre una cantidad de daÃ±o igual al resultado de una tirada de tu dado de Artes marciales cuando entres en un espacio a 1,5 m o menos de ella. Elige el tipo de daÃ±o: Ã¡cido, frÃ­o, fuego, relÃ¡mpago o trueno. Una criatura solo puede sufrir este daÃ±o una vez por turno.\nâ€¢ Resistencia al daÃ±o: Ganas resistencia a uno de los siguientes tipos de daÃ±o, a tu elecciÃ³n: Ã¡cido, frÃ­o, fuego, relÃ¡mpago o trueno. Al principio de cada uno de tus turnos, puedes cambiar esta elecciÃ³n.',

  'Defensa sin armadura': 'Mientras no lleves armadura alguna, tu clase de armadura base serÃ¡ igual a 10 mÃ¡s tus modificadores por Destreza y ConstituciÃ³n. Obtienes este beneficio aunque lleves un escudo.',
  'Furia': 'Puedes imbuirte de un poder primigenio llamado furia, que te otorga una fuerza y resistencia extraordinarias. Puedes dejarte llevar por ella como acciÃ³n adicional si no llevas puesta una armadura pesada.\n\nRecuperas uno de los usos gastados tras un descanso corto y todos tras un descanso largo.\n\nMientras estÃ©s enfurecido, usas las siguientes reglas:\nâ€¢ Resistencia al daÃ±o: Tienes resistencia al daÃ±o contundente, cortante y perforante.\nâ€¢ DaÃ±o por furia: Cuando llevas a cabo un ataque que use la Fuerza (ya sea con un arma o un ataque sin armas) y causas daÃ±o al objetivo, obtienes un bonificador al daÃ±o que aumenta conforme subes de nivel (+2 a +4).\nâ€¢ Ventaja en Fuerza: Tienes ventaja en las pruebas de Fuerza y en las tiradas de salvaciÃ³n de Fuerza.\nâ€¢ Sin concentraciÃ³n ni conjuros: No puedes mantener la concentraciÃ³n ni lanzar conjuros.\nâ€¢ DuraciÃ³n: La furia dura hasta el final de tu siguiente turno y termina antes si te pones una armadura pesada o recibes el estado de incapacitado.',
  'MaestrÃ­a con armas': 'Tu entrenamiento con armas te permite utilizar las propiedades de maestrÃ­a con dos tipos de armas cuerpo a cuerpo sencillas o marciales de tu elecciÃ³n, como las hachas a dos manos y las hachas de mano. Tras finalizar un descanso largo, puedes cambiar una de dichas elecciones.\n\nCuando alcances ciertos niveles de bÃ¡rbaro, adquirirÃ¡s la capacidad de usar las propiedades de maestrÃ­a con mÃ¡s tipos de armas, como se muestra en la columna "MaestrÃ­a con armas".',
  'Ataque temerario': 'Puedes desechar toda preocupaciÃ³n por la defensa para atacar con ferocidad salvaje. Cuando realices tu primer ataque en tu turno, puedes decidir atacar de manera temeraria. Al hacerlo, tienes ventaja en las tiradas de ataque con armas cuerpo a cuerpo que usen Fuerza durante este turno, pero las tiradas de ataque contra ti tienen ventaja hasta tu siguiente turno.',
  'Sentir el peligro': 'Obtienes ventaja en las tiradas de salvaciÃ³n de Destreza contra efectos que puedas ver, como trampas y conjuros. Para obtener este beneficio, no puedes estar cegado, ensordecido ni incapacitado.',
  'Conocimiento primigenio': 'Ganas competencia en otra habilidad de la lista de habilidades de bÃ¡rbaro. AdemÃ¡s, mientras tu Furia estÃ© activa, puedes usar tu Fuerza en lugar de la caracterÃ­stica normal para realizar pruebas de ciertas habilidades (como Atletismo, IntimidaciÃ³n, etc.).',
  'Subclase de bÃ¡rbaro': 'Eliges un camino de subclase (como Berserker, TÃ³tem o Magia Salvaje) que te otorga rasgos especiales en los niveles 3, 6, 10 y 14.',
  'Mejora de caracterÃ­stica': 'Puedes aumentar una puntuaciÃ³n de caracterÃ­stica en 2, o dos puntuaciones en 1, o elegir una Dote.',
  'Ataque adicional': 'Puedes atacar dos veces en lugar de una siempre que realices la acciÃ³n de Atacar en tu turno.',
  'Movimiento rÃ¡pido': 'Tu velocidad aumenta en 10 pies (3m) mientras no lleves armadura pesada.',
  'Rasgo de subclase': 'Obtienes un beneficio especÃ­fico de la subclase elegida para tu aventurero.',
  'Instinto salvaje': 'Tu instinto es tan agudo que obtienes ventaja en las tiradas de Iniciativa. Si estÃ¡s sorprendido al principio del combate y no estÃ¡s incapacitado, puedes actuar normalmente si entras en furia.',
  'Salto instintivo': 'Como parte de la acciÃ³n adicional que usas para entrar en Furia, puedes moverte hasta la mitad de tu velocidad de movimiento.',
  'Golpe brutal': 'Cuando aciertes un ataque temerario, puedes aplicar efectos adicionales como empujar 15 pies, reducir velocidad o aÃ±adir daÃ±o adicional (+1d10).',
  'Furia implacable': 'Si caes a 0 HP mientras estÃ¡s en furia, puedes hacer una salvaciÃ³n de Con CD 10 para quedarte a 1 HP. Cada uso exitoso aumenta la CD en 5 hasta un descanso corto o largo.',
  'Golpe brutal mejorado': 'Tus opciones de Golpe brutal mejoran, infligiendo mÃ¡s daÃ±o o aplicando peores efectos sobre los enemigos.',
  'Furia persistente': 'Tu furia es tan intensa que solo termina prematuramente si caes inconsciente o si decides finalizarla.',
  'PoderÃ­o indÃ³mito': 'Si el resultado de una prueba de Fuerza es menor que tu puntuaciÃ³n de Fuerza, puedes usar tu puntuaciÃ³n de Fuerza en lugar del resultado.',
  'Don Ã©pico': 'Obtienes un don Ã©pico que incrementa tus puntuaciones de caracterÃ­stica de forma extraordinaria y confiere un beneficio legendario.',
  'CampeÃ³n primordial': 'Tus puntuaciones de Fuerza y ConstituciÃ³n aumentan en 4 puntos, hasta un mÃ¡ximo de 24.',

  'Lanzamiento de conjuros': 'Puedes lanzar conjuros gracias a tu magia innata. Utilizas tu Carisma como tu caracterÃ­stica de lanzamiento para tus conjuros de hechicero.',
  'HechicerÃ­a innata': 'Como acciÃ³n adicional, puedes desatar tu magia latente durante 1 minuto. Durante este tiempo:\nâ€¢ La CD de salvaciÃ³n de tus conjuros de hechicero aumenta en 1.\nâ€¢ Tienes ventaja en las tiradas de ataque de los conjuros de hechicero que lances.\nPuedes usar este rasgo dos veces y recuperas todos los usos tras finalizar un descanso largo.',
  'Fuente de magia': 'Puedes acceder a una fuente de magia que te otorga Puntos de HechicerÃ­a. Puedes gastar estos puntos para crear espacios de conjuro adicionales (de nivel 1 a 5) o convertir tus espacios de conjuro en puntos de hechicerÃ­a.',
  'Metamagia': 'Ganas la capacidad de moldear tus conjuros. Eliges dos opciones de metamagia para alterar tus conjuros al lanzarlos gastando puntos de hechicerÃ­a.',
  'Subclase de hechicero': 'Eliges tu origen mÃ¡gico de subclase (como HechicerÃ­a aberrante, HechicerÃ­a de magia salvaje, HechicerÃ­a dracÃ³nica o HechicerÃ­a mecÃ¡nica) que te otorga rasgos especiales en los niveles 3, 6, 14 y 18.',
  'RecuperaciÃ³n mÃ¡gica': 'Tras finalizar un descanso corto, puedes recuperar una cantidad de puntos de hechicerÃ­a igual o inferior a la mitad de tu nivel (redondeando hacia abajo). No podrÃ¡s volver a hacerlo hasta que finalices un descanso largo.',
  'EncarnaciÃ³n mÃ¡gica': 'Si no te quedan usos de HechicerÃ­a innata, puedes activar el rasgo gastando 2 puntos de hechicerÃ­a. AdemÃ¡s, mientras HechicerÃ­a innata estÃ© activa, puedes usar hasta dos opciones de metamagia en un mismo conjuro.',
  'Metamagia mejorada': 'Obtienes dos opciones mÃ¡s de Metamagia a tu elecciÃ³n (totalizando 4 opciones).',
  'Metamagia suprema': 'Obtienes dos opciones mÃ¡s de Metamagia a tu elecciÃ³n (totalizando 6 opciones).',
  'Apoteosis arcana': 'Mientras tengas activo HechicerÃ­a innata, puedes usar una opciÃ³n de metamagia en cada uno de tus turnos sin gastar puntos de hechicerÃ­a.',

  // Guerrero (Fighter)
  'Estilo de combate': 'Adoptas un estilo de combate particular como tu especialidad (ej. Duelista, Gran arma, Defensa, ArquerÃ­a, etc.) que te otorga bonos pasivos en combate.',
  'RecuperaciÃ³n del viento': 'Puedes activar una fuerza vital de reserva para sanarte. Como acciÃ³n adicional, recuperas 1d10 + nivel de guerrero puntos de golpe.',
  'Oleada de acciÃ³n': 'Puedes superar temporalmente tus lÃ­mites normales. En tu turno, puedes realizar una acciÃ³n adicional ademÃ¡s de tu acciÃ³n normal.',
  'TÃ¡ctica defensiva': 'Obtienes un bonificador a tus tiradas de salvaciÃ³n de Destreza mientras lleves armadura.',
  'Subclase de Guerrero': 'Eliges una especializaciÃ³n de subclase (como Caballero Arcano, CampeÃ³n, Guerrero PsiÃ³nico o Maestro del Combate) que te otorga rasgos especiales en los niveles 3, 7, 10 y 15.',
  'IndÃ³mito': 'Puedes volver a lanzar una tirada de salvaciÃ³n fallida. Si lo haces, debes usar el nuevo resultado y sumas tu nivel de guerrero a la tirada.',
  'TÃ¡cticas indÃ³mitas': 'Cuando usas tu rasgo IndÃ³mito, puedes gastar un uso de RecuperaciÃ³n del viento para sumarle un bono extra a la tirada de salvaciÃ³n.',
  'RecuperaciÃ³n mejorada': 'Recuperas todos tus usos gastados de RecuperaciÃ³n del viento tras finalizar un descanso corto o largo.',

  // Guerrero Subclases: CampeÃ³n
  'CrÃ­tico mejorado': 'Tus ataques con arma obtienen un golpe crÃ­tico con un resultado de 19 o 20 en el d20.',
  'Atleta notable': 'Tienes ventaja en pruebas de Fuerza (Atletismo) y Destreza (Acrobacias). AdemÃ¡s, la distancia de tus saltos aumenta.',
  'Estilo de combate adicional': 'Obtienes una segunda opciÃ³n de Estilo de combate a tu elecciÃ³n.',
  'CrÃ­tico superior': 'Obtienes un golpe crÃ­tico con un resultado de 18, 19 o 20 en el d20.',
  'Superviviente (CampeÃ³n)': 'Al inicio de tu turno, si tienes menos de la mitad de tus HP mÃ¡ximos, recuperas una cantidad de HP igual a 5 + tu mod de ConstituciÃ³n.',

  // Caballero Arcano
  'Lanzamiento de conjuros (Arcano)': 'Puedes lanzar conjuros de mago seleccionados de la escuela de abjuraciÃ³n o evocaciÃ³n.',
  'VÃ­nculo con el arma': 'Realizas un ritual con un arma para crear un vÃ­nculo. Puedes invocar el arma a tu mano como acciÃ³n adicional y no te la pueden quitar.',
  'Magia de guerra': 'Cuando usas tu acciÃ³n para lanzar un truco, puedes realizar un ataque con arma como acciÃ³n adicional.',
  'Embate de carga': 'Cuando usas tu acciÃ³n de Oleada de acciÃ³n, puedes teletransportarte hasta 9 m a un espacio desocupado antes o despuÃ©s de la acciÃ³n extra.',
  'Teletransporte arcano': 'Puedes teletransportarte hasta 9 m como parte de tu acciÃ³n de Oleada de acciÃ³n.',
  'Magia de guerra mejorada': 'Cuando lanzas un conjuro, puedes realizar un ataque con arma como acciÃ³n adicional.',

  // Guerrero PsiÃ³nico
  'Poder psiÃ³nico (Guerrero)': 'Obtienes dados de energÃ­a psiÃ³nica (d6 a d12 segÃºn nivel) que alimentan tus habilidades psiÃ³nicas.',
  'Fuerza telequinÃ©tica': 'Puedes mover mentalmente criaturas u objetos pesados a distancia.',
  'Escudo mental': 'Puedes levantar un escudo invisible de fuerza para proteger a un aliado de sufrir daÃ±o.',
  'Salto psiÃ³nico': 'Puedes impulsarte por el aire a tu velocidad de movimiento.',
  'Baluarte guardiÃ¡n': 'Creas una zona defensiva de protecciÃ³n para tus aliados.',
  'Empuje psiÃ³nico': 'Puedes infligir daÃ±o de fuerza adicional y derribar a un enemigo.',
  'Mente psiÃ³nica suprema': 'Tus dados psiÃ³nicos se regeneran mÃ¡s rÃ¡pido y tus golpes psiÃ³nicos son devastadores.',

  // Maestro del Combate
  'Dados de supremacÃ­a': 'Ganas dados de supremacÃ­a d8 para alimentar tus maniobras tÃ¡cticas de combate.',
  'Maniobras de combate': 'Aprendes maniobras tÃ¡cticas de combate (ej. Ataque preciso, Finta, Parada, etc.) que aplican efectos especiales en tus ataques.',
  'Estudiante de la guerra': 'Competencia con un tipo de herramientas de artesano a tu elecciÃ³n.',
  'Conoce a tu enemigo': 'Si observas o interactÃºas con una criatura, el DM te dice caracterÃ­sticas de esta.',
  'SupremacÃ­a mejorada': 'Tus dados de supremacÃ­a aumentan a d10.',
  'Implacable': 'Si empiezas un combate sin dados de supremacÃ­a, recuperas uno.',
  'SupremacÃ­a definitiva': 'Tus dados de supremacÃ­a aumentan a d12.',

  'Mente telepÃ¡tica': 'Como acciÃ³n adicional, creas una conexiÃ³n telepÃ¡tica con una criatura que puedas ver a un mÃ¡ximo de 9 metros. Puedes comunicarte telepÃ¡ticamente a travÃ©s de esta conexiÃ³n mientras estÃ©is a una distancia igual o inferior a tu nivel en millas.',
  'Conjuros psiÃ³nicos': 'Siempre tienes preparados ciertos conjuros psiÃ³nicos adicionales: Nvl 3: Brazos de Hadar, perdiciÃ³n, desintegrar, risa horrible de Tasha; Nvl 5: DetecciÃ³n de pensamientos, calmar emociones; Nvl 7: Enviar, desatar; Nvl 9: Conocer las leyendas, invocar dragÃ³n.',
  'Defensas psÃ­quicas': 'Tienes resistencia al daÃ±o psÃ­quico y ventaja en las tiradas de salvaciÃ³n para evitar o poner fin a los estados de asustado o hechizado.',
  'HechicerÃ­a psiÃ³nica': 'Cuando lanzas cualquier conjuro de tu rasgo Conjuros psiÃ³nicos, puedes gastar una cantidad de puntos de hechicerÃ­a igual al nivel del conjuro en lugar de un espacio. Al hacerlo, no requieres componentes verbales, somÃ¡ticos ni materiales (salvo consumibles/con coste).',
  'RevelaciÃ³n en carne': 'Como acciÃ³n adicional, gastas 1+ puntos para alterar tu cuerpo por 10 min. Obtienes uno de estos por punto gastado:\nâ€¢ AdaptaciÃ³n acuÃ¡tica: Duplica vel. nadar y respiras bajo el agua.\nâ€¢ Movimiento anÃ©lido: Cuerpo baboso; te cuelas por huecos de 2.5 cm y escapas de agarres por 1.5 m.\nâ€¢ Ver lo invisible: Ves criaturas invisibles a 18 m.\nâ€¢ Vuelo brillante: Vuelas y levitas a tu velocidad.',
  'ImplosiÃ³n deformadora': 'Como acciÃ³n de magia, te teletransportas hasta 36 m. Criaturas a 9 m del origen deben superar salvaciÃ³n de Fuerza o recibir 3d10 daÃ±o de fuerza y ser arrastradas al origen. 1 uso por descanso largo (o gastando 5 puntos).',

  'Mareas del caos': 'Puedes obtener ventaja en una prueba de d20. Recuperas el rasgo al lanzar un conjuro de espacio (tirando en la tabla de Sobrecarga de magia salvaje) o tras un descanso largo.',
  'Sobrecarga de magia salvaje': 'Al lanzar un conjuro con espacio de nivel 1+, puedes tirar 1d20. Si sacas un 20, tiras en la tabla de Sobrecarga de magia salvaje para desatar un efecto mÃ¡gico caÃ³tico.',
  'Doblegar la suerte': 'ReacciÃ³n. Cuando una criatura que veas tira un d20, puedes gastar 1 punto de hechicerÃ­a para tirar 1d4 y sumarlo o restarlo a su resultado.',
  'Caos controlado': 'Siempre que tires en la tabla de Sobrecarga de magia salvaje, puedes tirar dos veces y elegir el efecto que prefieras.',
  'Sobrecarga domada': '1 vez por descanso largo, al lanzar un conjuro con espacio, puedes elegir directamente cualquier efecto de la tabla de Sobrecarga de magia salvaje (salvo la Ãºltima fila) en lugar de tirar.',

  'Resiliencia dracÃ³nica': 'Tus puntos de golpe mÃ¡ximos aumentan en 3 y en 1 mÃ¡s por cada nivel de hechicero en el futuro. Mientras no lleves armadura, tu CA base es 10 + Destreza + Carisma.',
  'Conjuros dracÃ³nicos': 'Siempre tienes preparados: Nvl 3: Aliento de dragÃ³n, alterar el propio aspecto, orbe cromÃ¡tico, orden imperiosa; Nvl 5: Terror, volar; Nvl 7: Hechizar monstruo, ojo arcano; Nvl 9: Conocer las leyendas, invocar dragÃ³n.',
  'Afinidad elemental': 'Elige un tipo de daÃ±o (Ã¡cido, frÃ­o, fuego, relÃ¡mpago o veneno). Tienes resistencia a ese daÃ±o, y al lanzar un conjuro de ese tipo sumas Carisma a una tirada de daÃ±o.',
  'Alas de dragÃ³n': 'AcciÃ³n adicional. Te crecen alas por 1 hora. Vuelo de 18 m. Cuesta 3 puntos restablecer su uso antes de un descanso largo.',
  'CompaÃ±ero dragÃ³n': 'Puedes lanzar invocar dragÃ³n sin componentes materiales y gratis una vez por descanso largo, pudiendo omitir concentraciÃ³n (duraciÃ³n 1 min).',

  'Conjuros mecÃ¡nicos': 'Siempre tienes preparados: Nvl 3: Alarma, auxilio, protecciÃ³n contra el bien/mal, restablecimiento menor; Nvl 5: Disipar magia, protecciÃ³n contra energÃ­a; Nvl 7: Invocar autÃ³mata, libertad de movimiento; Nvl 9: Muro de fuerza, restablecimiento mayor.',
  'Restablecer equilibrio': 'ReacciÃ³n para cancelar ventaja o desventaja en un d20 a 18 m. Usos iguales a tu modificador por Carisma (mÃ­nimo 1) por descanso largo.',
  'BastiÃ³n de la ley': 'Como acciÃ³n de magia, gastas 1-5 puntos para escudo de dados d8. Reduces daÃ±o tirando dados d8. Dura hasta descanso largo o reuso.',
  'Trance de orden': 'AcciÃ³n adicional. Entras en trance por 1 min. Ataques contra ti no tienen ventaja y tiradas de d20 menores o iguales a 9 se tratan como 10. Restablecer cuesta 5 puntos.',
  'Cabalgata mecÃ¡nica': 'AcciÃ³n de magia. Cubo de 9 m invoca espÃ­ritus autÃ³matas por 1 turno: cura 100 HP repartidos, repara objetos daÃ±ados, o disipa conjuros de nivel 6 o inferior. Restablecer cuesta 7 puntos.'
};

const SPELL_DESCRIPTIONS_MAP: { [key: string]: string } = {
  // Trucos
  'Salpicadura Ã¡cida': 'EvocaciÃ³n (1 acciÃ³n). Creas una burbuja de Ã¡cido. Uno o dos objetivos a 18m deben superar salvaciÃ³n de Destreza o recibir 1d6 daÃ±o Ã¡cido.',
  'Guardia de cuchillas': 'AbjuraciÃ³n (1 acciÃ³n). Trazas un sigilo de protecciÃ³n en el aire. Tienes resistencia al daÃ±o fÃ­sico hasta el final de tu prÃ³ximo turno.',
  'Toque helado': 'Nigromancia (1 acciÃ³n). Ataque de conjuro a 36m. Causa 1d8 daÃ±o necrÃ³tico y el objetivo no puede recuperar puntos de golpe hasta tu prÃ³ximo turno.',
  'Luces danzantes': 'EvocaciÃ³n (ConcentraciÃ³n). Creas hasta cuatro luces del tamaÃ±o de linternas que puedes mover como acciÃ³n adicional.',
  'Descarga de fuego': 'EvocaciÃ³n (1 acciÃ³n). Ataque de conjuro a 36m. Causa 1d10 daÃ±o de fuego y prende objetos inflamables.',
  'Amigos': 'Encantamiento (ConcentraciÃ³n). Tienes ventaja en todas las pruebas de Carisma dirigidas a una criatura no hostil de tu elecciÃ³n.',
  'Luz': 'EvocaciÃ³n (1 acciÃ³n). Hace que un objeto brille con luz brillante en 6m y luz tenue en 6m adicionales durante 1 hora.',
  'Mano de mago': 'ConjuraciÃ³n (1 acciÃ³n). Invoca una mano espectral a 9m que puedes usar para manipular objetos (hasta 5 kg).',
  'IlusiÃ³n menor': 'IlusiÃ³n (1 acciÃ³n). Creas un sonido o una imagen tridimensional a 9m que dura 1 minuto.',
  'Mensaje': 'TransmutaciÃ³n (1 acciÃ³n). EnvÃ­as un mensaje susurrado a una criatura a 36m que puede responder de la misma forma en secreto.',
  'Salva de veneno': 'ConjuraciÃ³n (1 acciÃ³n). Creas una nube de gas venenoso. El objetivo a 3m debe superar salvaciÃ³n de ConstituciÃ³n o recibir 1d12 daÃ±o de veneno.',
  'Elementalismo': 'TransmutaciÃ³n. Creas efectos elementales menores como brisas, polvo, chispas o vapor.',
  'Fragmento mental': 'Encantamiento. Causa 1d6 daÃ±o psÃ­quico y resta 1d4 a la prÃ³xima salvaciÃ³n del objetivo.',
  'Impacto certero': 'AdivinaciÃ³n. Obtienes ventaja en tu prÃ³xima tirada de ataque contra un objetivo a tu alcance.',
  'Reparar': 'TransmutaciÃ³n. Reparas una Ãºnica rotura o fisura en un objeto de menos de 30 cm.',
  'Tronar': 'EvocaciÃ³n (1 acciÃ³n). Creas una onda de fuerza sÃ³nica. 1d8 daÃ±o de trueno y empuja 3m.',
  'Armadura de mago': 'AbjuraciÃ³n (1 acciÃ³n). Envuelve a una criatura sin armadura en fuerza mÃ¡gica, CA base = 13 + Des.',
  'Dormir': 'Encantamiento. Duerme a criaturas en base a un pozo de 5d8 puntos de golpe.',
  'Falso vida': 'Nigromancia. Otorga 1d4+4 puntos de golpe temporales por 1 hora.',
  'Imagen silenciosa': 'IlusiÃ³n. Creas una imagen tridimensional a 18m sin sonido que puedes animar.',
  'Ola atronadora': 'EvocaciÃ³n. Causa 2d8 daÃ±o de trueno en un cubo de 4.5m y empuja a las criaturas.',
  'Rayo de hechicerÃ­a': 'EvocaciÃ³n. Ataque de conjuro a 36m causa 1d12 daÃ±o de relÃ¡mpago, y puedes infligir daÃ±o continuo en turnos siguientes.',
  'Rayo nauseabundo': 'Nigromancia. Ataque de conjuro causa 2d8 daÃ±o de veneno y envenena.',
  'Rociada de color': 'IlusiÃ³n. Destello de luces ciega a criaturas en cono de 4.5m.',
  'Salto': 'TransmutaciÃ³n. Triplica la distancia de salto de un objetivo durante 1 minuto.',
  'Abrir': 'TransmutaciÃ³n. Abre instantÃ¡neamente una puerta o cofre cerrado mÃ¡gica o fÃ­sicamente.',
  'Clavo mental': 'AdivinaciÃ³n. Inflige 3d6 daÃ±o psÃ­quico a un objetivo a 18m y conoces su ubicaciÃ³n.',
  'Contorno borroso': 'IlusiÃ³n. Te vuelves borroso, haciendo que los atacantes tengan desventaja en sus tiradas.',
  'Esfera de flames': 'ConjuraciÃ³n. Crea una esfera de fuego de 1.5m que puedes mover para quemar enemigos por 2d6 daÃ±o.',
  'Fuerza fantasmal': 'IlusiÃ³n. Creas una ilusiÃ³n mental que inflige daÃ±o psÃ­quico al objetivo haciÃ©ndole creer que es real.',
  'Hacer aÃ±icos': 'EvocaciÃ³n. Ruido ensordecedor que inflige 3d8 daÃ±o de trueno, los objetos no orgÃ¡nicos tienen desventaja.',
  'Hoja de fuego': 'EvocaciÃ³n. Creas una espada de fuego en tu mano que causa 3d6 daÃ±o de fuego al impactar.',
  'Inmovilizar persona': 'Encantamiento. Paraliza a un humanoide si falla su salvaciÃ³n de SabidurÃ­a.',
  'Nube de dagas': 'ConjuraciÃ³n. Torbellino de dagas voladoras en un cubo de 1.5m causa 4d4 daÃ±o cortante continuo.',
  'Potenciar caracterÃ­stica': 'TransmutaciÃ³n. Otorga ventaja en pruebas del atributo seleccionado.',
  'Rayo abrasador': 'EvocaciÃ³n. Disparas tres rayos de fuego de 2d6 de daÃ±o a 36m.',
  'TelaraÃ±a': 'ConjuraciÃ³n. Crea una red de telaraÃ±as resbaladizas y pegajosas que restringen a los enemigos.',
  'Trepar cual arÃ¡cnido': 'TransmutaciÃ³n. Otorga la habilidad de trepar por paredes y techos con las manos libres.',
  'Vigor arcano': 'AbjuraciÃ³n. Recuperas 2d8 puntos de golpe como acciÃ³n.',
  'Acelerar': 'TransmutaciÃ³n. Otorga una acciÃ³n adicional, +2 CA y doble velocidad al objetivo durante 1 minuto.',
  'Caminar sobre el agua': 'TransmutaciÃ³n. Permite a diez aliados caminar sobre lÃ­quidos durante 1 hora.',
  'Clarividencia': 'AdivinaciÃ³n. Crea un sensor invisible para escuchar o ver un Ã¡rea distante.',
  'Contrahchizo': 'AbjuraciÃ³n. ReacciÃ³n para interrumpir y anular el conjuro que estÃ¡ lanzando otra criatura.',
  'Desplazamiento': 'TransmutaciÃ³n. Te proyecta a un lado, causando desventaja en todos los ataques contra ti.',
  'Don de lenguas': 'AdivinaciÃ³n. Puedes entender y ser entendido en cualquier idioma hablado.',
  'Forma gaseosa': 'TransmutaciÃ³n. Transforma a un objetivo en una nube de gas con resistencia a daÃ±o.',
  'Imagen mayor': 'IlusiÃ³n. Crea una ilusiÃ³n realista con sonido, olor y temperatura.',
  'Luz del dÃ­a': 'EvocaciÃ³n. Esfera de 18m de luz brillante equivalente a la luz solar.',
  'Nube apestosa': 'ConjuraciÃ³n. Crea una nube de gas que causa nÃ¡useas a quienes fallen ConstituciÃ³n.',
  'PatrÃ³n hipnÃ³tico': 'IlusiÃ³n. Un patrÃ³n de colores parpadeantes incapacita y duerme a enemigos.',
  'Ralentizar': 'TransmutaciÃ³n. Reduce a la mitad la velocidad, CA y nÃºmero de ataques de los enemigos.',
  'Respirar bajo el agua': 'TransmutaciÃ³n. Permite respirar bajo el agua durante 24 horas.',
  'Toque vampÃ­rico': 'Nigromancia. Ataque de toque causa 3d6 daÃ±o necrÃ³tico y te sana la mitad.',
  'Tormenta de aguanieve': 'ConjuraciÃ³n. Lluvia congelante crea terreno difÃ­cil y extingue fuegos.',
  'ConfusiÃ³n': 'Encantamiento. Confunde a los enemigos, obligÃ¡ndoles a actuar aleatoriamente.',
  'Destierro': 'AbjuraciÃ³n. Destierra a un objetivo a otro plano de existencia durante 1 minuto.',
  'Dominar bestia': 'Encantamiento. Tomas el control telepÃ¡tico absoluto de una bestia.',
  'Escudo de fuego': 'EvocaciÃ³n. Te rodeas de llamas que otorgan resistencia al frÃ­o o fuego y daÃ±an a atacantes en 2d8.',
  'Esfera vitriÃ³lica': 'EvocaciÃ³n. Lanzas una bola de Ã¡cido que explota causando 10d4 daÃ±o de Ã¡cido.',
  'Invisibilidad mejorada': 'IlusiÃ³n. Te vuelves invisible y no se cancela aunque ataques o lances conjuros.',
  'Marchitar': 'Nigromancia. Absorbe la humedad corporal de un objetivo infligiendo 8d8 daÃ±o necrÃ³tico.',
  'Muro de fuego': 'EvocaciÃ³n. Crea una muralla de fuego ardiente que inflige 5d8 daÃ±o de fuego a quien pase.',
  'Piel pÃ©trea': 'AbjuraciÃ³n. Otorga resistencia contra daÃ±o fÃ­sico no mÃ¡gico.',
  'Polimorfar': 'TransmutaciÃ³n. Transforma a una criatura en una bestia de tu elecciÃ³n.',
  'Puerta dimensional': 'ConjuraciÃ³n. Te teletransportas a ti y a un aliado a una distancia de hasta 150m.',
  'Tormenta de hielo': 'EvocaciÃ³n. Lluvia de granizo inflige 2d8 daÃ±o por impacto y 4d6 daÃ±o por frÃ­o.',
  'Animar objetos': 'TransmutaciÃ³n. Anima objetos inanimados para que ataquen a tus Ã³rdenes.',
  'Apariencia': 'IlusiÃ³n. Cambias el aspecto visual de hasta diez aliados.',
  'CÃ­rculo de teletransportaciÃ³n': 'ConjuraciÃ³n. Abre un portal de teletransportaciÃ³n a un cÃ­rculo rÃºnico permanente.',
  'Cono de frÃ­o': 'EvocaciÃ³n. RÃ¡faga helada en cono de 18m causa 8d8 daÃ±o de frÃ­o.',
  'CreaciÃ³n': 'IlusiÃ³n. Creas materia no viva como madera, piedra o metal temporalmente.',
  'Dominar persona': 'Encantamiento. Tomas el control telepÃ¡tico absoluto de un humanoide.',
  'EstÃ¡tica sinÃ¡ptica': 'EvocaciÃ³n. ExplosiÃ³n de energÃ­a psÃ­quica inflige 8d6 daÃ±o psÃ­quico y confunde.',
  'Inmovilizar monstruo': 'Encantamiento. Paraliza a cualquier criatura que falle salvaciÃ³n de SabidurÃ­a.',
  'Mano de Bigby': 'EvocaciÃ³n. Invoca una mano gigante de fuerza que golpea, empuja o sujeta enemigos.',
  'Muro de piedra': 'EvocaciÃ³n. Crea una barrera fÃ­sica de paneles de piedra sÃ³lida.',
  'Nube aniquiladora': 'ConjuraciÃ³n. Crea una nube de gas venenoso que desciende y causa 5d8 daÃ±o de veneno por ronda.',
  'Plaga de insectos': 'ConjuraciÃ³n. Enjambre de langostas devoradoras causa 4d10 daÃ±o perforante continuo.',
  'Telequinesis': 'TransmutaciÃ³n. Mueves o levantas mentalmente criaturas u objetos pesados.',
  'PrestidigitaciÃ³n': 'TransmutaciÃ³n (1 acciÃ³n). Realizas trucos mÃ¡gicos menores (limpiar/ensuciar, calentar/enfriar, encender velas, etc.).',
  'Rayo de escarcha': 'EvocaciÃ³n (1 acciÃ³n). Rayo helado a 18m. Causa 1d8 daÃ±o de frÃ­o y reduce la velocidad del objetivo en 3m.',
  'ApretÃ³n electrizante': 'EvocaciÃ³n (1 acciÃ³n). Toque elÃ©ctrico. Causa 1d8 daÃ±o de relÃ¡mpago, da ventaja si lleva armadura de metal y no puede usar reacciones este turno.',

  // Nivel 1
  'Manos ardientes': 'EvocaciÃ³n. Cono de 4,5m causa 3d6 daÃ±o de fuego, mitad si supera salvaciÃ³n de Destreza.',
  'Encantarse': 'Encantamiento. Una criatura a 9m debe superar salvaciÃ³n de SabidurÃ­a o quedarÃ¡ fascinada por ti.',
  'Orbe cromÃ¡tico': 'EvocaciÃ³n. Lanzador arroja una esfera de energÃ­a elemental a 27m que inflige 3d8 de daÃ±o del tipo elegido.',
  'Disparos de color': 'IlusiÃ³n. Un estallido de luces de colores a 4,5m ciega a criaturas segÃºn sus HP.',
  'Comprender idiomas': 'AdivinaciÃ³n. Entiendes el significado de cualquier idioma hablado o escrito durante 1 hora.',
  'Detectar magia': 'AdivinaciÃ³n (ConcentraciÃ³n). Percibes la presencia de magia a 9m y ves el aura de escuelas mÃ¡gicas.',
  'Disfrazarse': 'IlusiÃ³n. Alteras tu apariencia fÃ­sica y equipo con una ilusiÃ³n durante 1 hora.',
  'Retirada expeditiva': 'TransmutaciÃ³n (ConcentraciÃ³n). Permite realizar la acciÃ³n de Correr como acciÃ³n adicional.',
  'CaÃ­da de pluma': 'TransmutaciÃ³n (ReacciÃ³n). Hasta 5 criaturas cayendo descienden lentamente (3m por ronda) y no sufren daÃ±o por caÃ­da.',
  'Nube de oscurecimiento': 'ConjuraciÃ³n. Creas una nube de niebla de 6m de radio que ciega la visiÃ³n.',
  'Grasa': 'ConjuraciÃ³n. Terreno resbaladizo de 3m. Quien entre o empiece su turno debe superar Destreza o caer derribado.',
  'Cuchillo de hielo': 'ConjuraciÃ³n. Proyectil de hielo a 18m causa 1d10 daÃ±o perforante, y explota en frÃ­o causando 2d6 daÃ±o en 1,5m.',
  'Proyectil mÃ¡gico': 'EvocaciÃ³n. Creas tres dardos mÃ¡gicos infalibles que impactan causando 1d4+1 daÃ±o de fuerza cada uno.',
  'Escudo': 'AbjuraciÃ³n (ReacciÃ³n). Te otorga +5 a la CA e inmunidad a proyectil mÃ¡gico hasta el inicio de tu prÃ³ximo turno.',
  'Onda de choque': 'EvocaciÃ³n. Onda de fuerza en 4,5m causa 2d8 daÃ±o de trueno y empuja 3m.',
  'Rayo de enfermedad': 'Nigromancia. Causa 2d8 daÃ±o de veneno y envenena si falla salvaciÃ³n de ConstituciÃ³n.',
  'CaÃ­da silenciosa': 'IlusiÃ³n. Creas una zona de silencio absoluto de 4,5m.',

  // Nivel 2
  'Agrandar/Reducir': 'TransmutaciÃ³n (ConcentraciÃ³n). Duplica o divide a la mitad el tamaÃ±o y peso de un objetivo.',
  'Ceguera/Sordera': 'Nigromancia. Ciega o ensordece a un objetivo si falla salvaciÃ³n de ConstituciÃ³n.',
  'Fuerza de toro': 'TransmutaciÃ³n. Otorga ventaja en pruebas de Fuerza, Destreza o ConstituciÃ³n por 1 hora.',
  'Nublar': 'IlusiÃ³n (ConcentraciÃ³n). Tu cuerpo se vuelve borroso, causando desventaja en los ataques contra ti.',
  'Corona de locura': 'Encantamiento (ConcentraciÃ³n). Obliga a un humanoide a atacar a sus aliados.',
  'Oscuridad': 'EvocaciÃ³n (ConcentraciÃ³n). Crea una esfera de oscuridad mÃ¡gica de 4,5m de radio que bloquea la visiÃ³n en penumbra.',
  'VisiÃ³n en la oscuridad': 'TransmutaciÃ³n. Otorga visiÃ³n en la oscuridad a 18m durante 8 horas.',
  'Ver invisibilidad': 'AdivinaciÃ³n. Ves criaturas y objetos invisibles o en el Plano Etereo durante 1 hora.',
  'RÃ¡faga de viento': 'EvocaciÃ³n (ConcentraciÃ³n). LÃ­nea de viento de 18m empuja a criaturas y apaga llamas.',
  'Hechizar persona': 'Encantamiento. Hechiza a un humanoide si falla salvaciÃ³n de SabidurÃ­a.',
  'Levitar': 'TransmutaciÃ³n (ConcentraciÃ³n). Eleva a un objetivo hasta 6m verticalmente.',
  'Localizar objeto': 'AdivinaciÃ³n (ConcentraciÃ³n). Sientes la direcciÃ³n de un objeto conocido a 300m.',
  'Imagen mÃºltiple': 'IlusiÃ³n. Creas tres duplicados ilusorios de ti mismo que confunden los ataques enemigos.',
  'Paso brumoso': 'ConjuraciÃ³n (AcciÃ³n adicional). Te teletransportas hasta 9m a un espacio vacÃ­o visible.',
  'Rayo de debilitamiento': 'Nigromancia (ConcentraciÃ³n). Rayo reduce a la mitad el daÃ±o de ataques fÃ­sicos del objetivo.',
  'Piel de corteza': 'AbjuraciÃ³n (ConcentraciÃ³n). La CA del objetivo no puede ser menor de 16.',
  'Arma espiritual': 'EvocaciÃ³n. Invoca un arma flotante que ataca como acciÃ³n adicional e inflige 1d8 + mod daÃ±o de fuerza.',
  
  // Nivel 3
  'Bola de fuego': 'EvocaciÃ³n. ExplosiÃ³n de fuego en 6m de radio a 45m inflige 8d6 daÃ±o de fuego.',
  'RelÃ¡mpago': 'EvocaciÃ³n. LÃ­nea elÃ©ctrica de 30m inflige 8d6 daÃ±o de relÃ¡mpago.',
  'Volar': 'TransmutaciÃ³n (ConcentraciÃ³n). Otorga velocidad de vuelo de 18m durante 10 minutos.',
  'Disipar magia': 'AbjuraciÃ³n. Termina conjuros activos en un objetivo u objeto.',
  'Terror': 'IlusiÃ³n (ConcentraciÃ³n). Proyecta una imagen fantasmal que asusta a enemigos en un cono de 9m.',
  'Alterar el propio aspecto': 'TransmutaciÃ³n (ConcentraciÃ³n). Modifica tu cuerpo para obtener respiraciÃ³n acuÃ¡tica, armas naturales o cambiar de apariencia.',
  'Aliento de dragÃ³n': 'TransmutaciÃ³n (ConcentraciÃ³n). Escupes energÃ­a elemental (cono de 4,5m, 3d6 de daÃ±o) como acciÃ³n en cada turno.',
  'Invocar autÃ³mata': 'ConjuraciÃ³n (ConcentraciÃ³n). Invoca un espÃ­ritu mecÃ¡nico con ataques de fuerza.',
  'Libertad de movimiento': 'AbjuraciÃ³n. El objetivo ignora terreno difÃ­cil y no puede ser paralizado ni retenido.',
  'Muro de fuerza': 'EvocaciÃ³n (ConcentraciÃ³n). Crea una barrera invisible de fuerza indestructible de hasta 10 paneles de 3m.',
  'Restablecimiento mayor': 'AbjuraciÃ³n. Elimina reducciones de caracterÃ­sticas, cansancio, maldiciones o petrificaciÃ³n.',
  'Restablecimiento menor': 'AbjuraciÃ³n. Cura los estados de cegado, ensordecido, paralizado o envenenado.',
  'Auxilio': 'AbjuraciÃ³n. Incrementa los puntos de golpe mÃ¡ximos y actuales en 5 a tres aliados durante 8 horas.',
  'Alarma': 'AbjuraciÃ³n. Protege un Ã¡rea dando una alerta mental o audible si una criatura entra.',
  'ProtecciÃ³n contra el bien y el mal': 'AbjuraciÃ³n (ConcentraciÃ³n). Protege contra aberraciones, celestiales, elementales, feÃ©ricos, demonios y muertos vivientes.',
  'ProtecciÃ³n contra energÃ­a': 'AbjuraciÃ³n (ConcentraciÃ³n). Otorga resistencia a Ã¡cido, frÃ­o, fuego, relÃ¡mpago o trueno.',
  'Conocer las leyendas': 'AdivinaciÃ³n. Trae a tu mente relatos o datos histÃ³ricos sobre una persona, lugar u objeto legendario.'
};

const METAMAGIC_DESCRIPTIONS_MAP: { [key: string]: string } = {
  'Conjuro Acelerado': 'Coste: 2 puntos. Permite lanzar un conjuro de 1 acciÃ³n como acciÃ³n adicional este turno.',
  'Conjuro Buscador': 'Coste: 1 punto. Permite volver a tirar un d20 fallido en un ataque de conjuro.',
  'Conjuro Cuidado': 'Coste: 1 punto. Protege hasta tu Carisma de aliados de sufrir daÃ±o en salvaciones de tus conjuros.',
  'Conjuro Distante': 'Coste: 1 punto. Duplica el alcance de un conjuro o da alcance de 9 m a uno de toque.',
  'Conjuro Extendido': 'Coste: 1 punto. Duplica la duraciÃ³n de un conjuro de al menos 1 minuto (mÃ¡x. 24h) y da ventaja en salvaciones para mantener concentraciÃ³n.',
  'Conjuro Gemelo': 'Coste: 1 punto. Incrementa en 1 el nivel de un conjuro monobjetivo escalable para designar un objetivo extra.',
  'Conjuro Intensificado': 'Coste: 2 puntos. Da desventaja a un objetivo en su primera salvaciÃ³n contra el conjuro.',
  'Conjuro Potenciado': 'Coste: 1 punto. Permite repetir hasta Carisma dados de daÃ±o de un conjuro.',
  'Conjuro Sutil': 'Coste: 1 punto. Permite lanzar un conjuro sin componentes verbales, somÃ¡ticos ni materiales (salvo consumibles/con coste).',
  'Conjuro Transmutado': 'Coste: 1 punto. Cambia el tipo de daÃ±o del conjuro a Ã¡cido, frÃ­o, fuego, rayo, trueno o veneno.'
};
