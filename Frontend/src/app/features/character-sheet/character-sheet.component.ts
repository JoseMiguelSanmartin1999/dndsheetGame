import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CharacterService, Character } from '../../data/services/character.service';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#08080a] bg-radial from-[#151010] via-[#08080a] to-[#040405] text-neutral-200 p-4 md:p-8 print-layout font-sans-clean">
      
      <!-- CONTENEDOR DE CARGA / ERROR -->
      <div *ngIf="loading || errorLoading" class="max-w-4xl mx-auto py-24 text-center no-print">
        <div *ngIf="loading" class="space-y-4 animate-pulse">
          <div class="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-t-[#d4af37] border-r-red-700 border-b-transparent border-l-transparent animate-spin"></div>
            <span class="text-3xl">📜</span>
          </div>
          <h2 class="text-[#d4af37] font-fantasy uppercase tracking-widest text-lg">Consultando Pergamino...</h2>
        </div>

        <div *ngIf="errorLoading" class="bg-[#121215] border border-red-800/40 rounded-xl p-8 space-y-6 max-w-md mx-auto">
          <span class="text-4xl">⚡</span>
          <h2 class="text-red-500 font-fantasy uppercase font-bold">Aventurero Extraviado</h2>
          <p class="text-xs text-neutral-400">No se pudo hallar la crónica del aventurero solicitado en el templo de datos.</p>
          <a routerLink="/dashboard" class="inline-block bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-2 px-6 rounded text-xs uppercase tracking-widest transition">
            Volver a la Taberna
          </a>
        </div>
      </div>

      <!-- VISTA COMPLETA DE HOJA DE PERSONAJE -->
      <div *ngIf="!loading && !errorLoading && character" class="max-w-6xl mx-auto space-y-5 animate-fade-in print-layout">
        
        <!-- Botones de Acción y Pestañas (Se ocultan al imprimir) -->
        <div class="bg-gradient-to-r from-neutral-950 via-[#0e0e11] to-neutral-950 border border-[#d4af37]/25 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shrink-0 no-print">
          <div class="flex items-center gap-3">
            <a 
              routerLink="/dashboard" 
              class="bg-[#121215] hover:bg-[#1e1e24] border border-neutral-800 text-neutral-350 hover:text-neutral-200 py-1.5 px-3.5 rounded-lg text-[10px] uppercase tracking-widest transition flex items-center gap-2 cursor-pointer font-fantasy"
            >
              <span>🏰</span> Volver
            </a>
            <div>
              <h2 class="font-fantasy text-[#d4af37] text-xs uppercase tracking-widest font-extrabold flex items-center gap-2">
                FORJA & LEYENDA
              </h2>
              <p class="text-[8px] text-neutral-455 uppercase tracking-wide">Ficha de Aventurero Oficial</p>
            </div>
          </div>
          
          <!-- Pestañas de la Ficha (Solo pantalla) -->
          <div class="flex bg-neutral-900/60 p-1 border border-neutral-800 rounded-lg shrink-0">
            <button 
              (click)="activeTab = 1"
              class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none"
              [class.bg-amber-600]="activeTab === 1"
              [class.text-white]="activeTab === 1"
              [class.text-neutral-400]="activeTab !== 1"
            >
              Ficha Principal
            </button>
            <button 
              (click)="activeTab = 2"
              class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none"
              [class.bg-amber-600]="activeTab === 2"
              [class.text-white]="activeTab === 2"
              [class.text-neutral-400]="activeTab !== 2"
            >
              Grimorio y Equipo
            </button>
            <button 
              (click)="activeTab = 3"
              class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none"
              [class.bg-amber-600]="activeTab === 3"
              [class.text-white]="activeTab === 3"
              [class.text-neutral-400]="activeTab !== 3"
            >
              Biografía y Aspecto
            </button>
          </div>

          <button 
            (click)="downloadPdf()"
            class="bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-750 hover:to-amber-550 border border-red-500/25 text-white py-1.5 px-4 rounded-lg text-[10px] uppercase tracking-widest transition shadow-lg hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] flex items-center gap-2 cursor-pointer font-fantasy"
          >
            <span>📜</span> Descargar PDF
          </button>
        </div>

        <!-- Cabecera de impresión exclusiva (Ficha Principal) -->
        <div class="col-span-12 hidden print:flex justify-between items-center border-b border-neutral-800 pb-1 mb-2">
          <span class="text-[9px] font-fantasy font-bold uppercase tracking-wider text-neutral-500">Hoja de Aventurero: {{ character.name }}</span>
          <span class="text-[8px] font-fantasy font-bold uppercase tracking-wider text-[#d4af37]">Ficha Principal (Nvl {{ character.level }})</span>
        </div>

        <!-- FILA SUPERIOR: INFORMACIÓN GENERAL -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#121215] border border-neutral-850 p-4 rounded-xl card-print">
          <div class="space-y-1">
            <label class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Nombre del Aventurero</label>
            <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
              {{ character.name }}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy">Clase</label>
              <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center uppercase tracking-wider">
                {{ character.class }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy">Subclase</label>
              <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                {{ character.originLineage || '—' }}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy">Origen / Raza</label>
              <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                {{ character.race }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy">Trasfondo</label>
              <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                {{ character.background }}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1 text-center font-fantasy">
              <label class="text-[8px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy">Nivel</label>
              <div class="text-xs text-amber-400 font-bold bg-neutral-900/80 border border-[#d4af37]/15 py-1 rounded min-h-[30px] flex items-center justify-between px-2.5 font-mono select-none">
                <button (click)="decreaseLevel()" class="text-neutral-500 hover:text-red-500 font-bold px-1.5 cursor-pointer no-print focus:outline-none transition">−</button>
                <span>{{ character.level }}</span>
                <button (click)="increaseLevel()" class="text-neutral-500 hover:text-green-500 font-bold px-1.5 cursor-pointer no-print focus:outline-none transition">+</button>
              </div>
            </div>
            <div class="space-y-1 text-center col-span-2">
              <label class="text-[8px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy">Experiencia</label>
              <div class="text-xs text-neutral-350 font-mono bg-neutral-900/80 border border-neutral-855 py-1 rounded min-h-[30px] flex items-center justify-center">
                0 / 300
              </div>
            </div>
          </div>
        </div>

        <!-- FILA DE ATRIBUTOS CLÁSICOS (Visible siempre en pantalla para mayor accesibilidad) -->
        <div class="grid grid-cols-3 md:grid-cols-6 gap-3 card-print">
          <div *ngFor="let attr of getAttributesArray(character)" 
               class="bg-gradient-to-b from-[#121215] to-[#0a0a0c] border border-neutral-850 hover:border-[#d4af37]/35 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(212,175,55,0.08)] card-print relative overflow-hidden group">
            <span class="text-[9px] font-bold text-neutral-450 uppercase tracking-widest font-fantasy">{{ attr.name }}</span>
            <span class="text-2xl font-bold font-serif text-neutral-100 my-1 font-fantasy">{{ attr.value }}</span>
            <div class="bg-[#16161a] border border-neutral-800 text-[#d4af37] font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow-inner select-none card-print">
              {{ getModifier(attr.value) }}
            </div>
            <span class="text-[7.5px] text-neutral-550 mt-1 uppercase tracking-wider font-mono">
              Base: {{ getBaseStatValue(attr.keyLow) }} | Alloc: +{{ getBgStatsAllocationValue(attr.keyLow) }}
            </span>
          </div>
        </div>

        <!-- SECCIONES DE LA HOJA -->
        
        <!-- PESTAÑA 1: FICHA PRINCIPAL -->
        <div [class.hidden-screen]="activeTab !== 1" class="grid grid-cols-1 md:grid-cols-12 gap-5 print-block">
          
          <!-- COLUMNA 1: SALVACIONES Y HABILIDADES (md:col-span-6) -->
          <div class="md:col-span-6 space-y-4">
            
            <!-- Salvaciones -->
            <div class="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2 card-print">
              <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Tiradas de Salvación</span>
              <div class="grid grid-cols-3 gap-3 pt-1 text-[11px]">
                <div 
                  *ngFor="let attr of getAttributesArray(character)" 
                  class="flex items-center justify-between p-1.5 bg-[#121215]/40 rounded border border-neutral-900/30"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px]" [class.text-[#d4af37]]="hasClassSavingThrowProficiency(attr.key)">
                      {{ hasClassSavingThrowProficiency(attr.key) ? '●' : '○' }}
                    </span>
                    <span class="text-neutral-350 font-fantasy text-[9px] uppercase tracking-wider">{{ attr.key }}</span>
                  </div>
                  <span class="font-mono text-[10px] font-bold text-[#d4af37]">
                    {{ getSavingThrowModifier(attr.key) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Habilidades -->
            <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-2 card-print">
              <span class="text-[9px] text-neutral-400 uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Competencias de Habilidad</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px] scroll-print">
                
                <!-- Atletismo -->
                <div class="flex justify-between items-center py-0.5 border-b border-neutral-900/20">
                  <div class="flex items-center gap-1.5">
                    <span [class.text-[#d4af37]]="hasSkillProficiency('Atletismo')">{{ hasSkillProficiency('Atletismo') ? '●' : '○' }}</span>
                    <span class="text-neutral-300">Atletismo <span class="text-[8px] text-neutral-500">(Fue)</span></span>
                  </div>
                  <span class="font-mono text-[#d4af37] text-[10px]">{{ getSkillModifier('strength', 'Atletismo') }}</span>
                </div>

                <!-- DES -->
                <div 
                  *ngFor="let skill of [
                    {name: 'Acrobacias', attr: 'dexterity'},
                    {name: 'Juego de manos', attr: 'dexterity'},
                    {name: 'Sigilo', attr: 'dexterity'}
                  ]"
                  class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                >
                  <div class="flex items-center gap-1.5">
                    <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                    <span class="text-neutral-300">{{ skill.name }} <span class="text-[8px] text-neutral-500">(Des)</span></span>
                  </div>
                  <span class="font-mono text-[#d4af37] text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                </div>

                <!-- INT -->
                <div 
                  *ngFor="let skill of [
                    {name: 'Conocimiento arcano', attr: 'intelligence'},
                    {name: 'Historia', attr: 'intelligence'},
                    {name: 'Investigación', attr: 'intelligence'},
                    {name: 'Naturaleza', attr: 'intelligence'},
                    {name: 'Religión', attr: 'intelligence'}
                  ]"
                  class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                >
                  <div class="flex items-center gap-1.5">
                    <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                    <span class="text-neutral-300">{{ skill.name }} <span class="text-[8px] text-neutral-500">(Int)</span></span>
                  </div>
                  <span class="font-mono text-[#d4af37] text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                </div>

                <!-- SAB -->
                <div 
                  *ngFor="let skill of [
                    {name: 'Medicina', attr: 'wisdom'},
                    {name: 'Percepción', attr: 'wisdom'},
                    {name: 'Perspicacia', attr: 'wisdom'},
                    {name: 'Supervivencia', attr: 'wisdom'},
                    {name: 'Trato con animales', attr: 'wisdom'}
                  ]"
                  class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                >
                  <div class="flex items-center gap-1.5">
                    <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                    <span class="text-neutral-300">{{ skill.name }} <span class="text-[8px] text-neutral-500">(Sab)</span></span>
                  </div>
                  <span class="font-mono text-[#d4af37] text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                </div>

                <!-- CAR -->
                <div 
                  *ngFor="let skill of [
                    {name: 'Engaño', attr: 'charisma'},
                    {name: 'Interpretación', attr: 'charisma'},
                    {name: 'Intimidación', attr: 'charisma'},
                    {name: 'Persuasión', attr: 'charisma'}
                  ]"
                  class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                >
                  <div class="flex items-center gap-1.5">
                    <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                    <span class="text-neutral-300">{{ skill.name }} <span class="text-[8px] text-neutral-500">(Car)</span></span>
                  </div>
                  <span class="font-mono text-[#d4af37] text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                </div>

              </div>
            </div>
          </div>

          <!-- COLUMNA 2: COMBATE, TRAITS Y EQUIPO (md:col-span-6) -->
          <div class="md:col-span-6 space-y-4">
            
            <!-- Tarjetas de Combate y HP -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Grid de Stats de Batalla -->
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden card-print">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">CA Armadura</span>
                  <span class="text-lg font-bold font-mono text-[#d4af37] mt-0.5 block">
                    {{ 10 + getFinalModifierValue('dexterity') }}
                  </span>
                  <span class="text-[7px] text-neutral-650 block">(10+Des)</span>
                </div>
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden card-print">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Iniciativa</span>
                  <span class="text-lg font-bold font-mono text-[#d4af37] mt-0.5 block">
                    {{ getFinalModifier('dexterity') }}
                  </span>
                  <span class="text-[7px] text-neutral-650 block">(Mod Des)</span>
                </div>
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden flex flex-col justify-between card-print">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Velocidad</span>
                  <span class="text-[11px] font-bold text-amber-500 mt-1 block font-mono">
                    {{ getOriginData(character.race).speed }}
                  </span>
                </div>
              </div>

              <!-- Puntos de Golpe y Dados -->
              <div class="bg-neutral-900/40 border border-neutral-850 px-3.5 py-2 rounded-xl grid grid-cols-2 gap-2 card-print">
                <div class="space-y-0.5">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">PG Máximos</span>
                  <span class="text-base font-bold text-neutral-200 font-mono">
                    {{ character.hp }} HP
                  </span>
                  <span class="text-[7.5px] text-neutral-600 block">Nivel 1 • Con: {{ getFinalModifier('constitution') }}</span>
                </div>
                <div class="space-y-0.5">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Dados de Golpe</span>
                  <span class="text-sm font-bold text-amber-500 font-mono mt-0.5 block">
                    1d{{ getClassData(character.class).hitDie }}
                  </span>
                  <span class="text-[7.5px] text-neutral-600 block">Dados Totales</span>
                </div>
              </div>
            </div>

            <!-- Capacidad de Carga y Tamaño -->
            <div class="bg-neutral-900/30 border border-neutral-855 p-3 rounded-xl space-y-2 text-left card-print">
              <div class="flex justify-between items-center border-b border-neutral-900 pb-1">
                <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Carga y Tamaño de Criatura</span>
                <span class="text-[8px] text-neutral-550 uppercase tracking-wider font-mono">Categoría: {{ character.sizeClass }} ({{ getSizeLetter(character.sizeClass) }})</span>
              </div>

              <div class="grid grid-cols-2 gap-3 text-[10px]">
                <div class="bg-[#121215] border border-neutral-855 p-2 rounded card-print">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block">Carga Máxima</span>
                  <span class="font-mono font-bold text-neutral-300 block">
                    {{ getCarryingCapacity(character.stats.strength, character.sizeClass, character.race).maxKg }} kg / 
                    {{ getCarryingCapacity(character.stats.strength, character.sizeClass, character.race).maxLb }} lb
                  </span>
                </div>

                <div class="bg-[#121215] border border-neutral-855 p-2 rounded card-print">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block">Arrastrar/Levantar/Empujar</span>
                  <span class="font-mono font-bold text-neutral-300 block">
                    {{ getCarryingCapacity(character.stats.strength, character.sizeClass, character.race).dragKg }} kg / 
                    {{ getCarryingCapacity(character.stats.strength, character.sizeClass, character.race).dragLb }} lb
                  </span>
                </div>
              </div>
            </div>

            <!-- Rasgos y Competencias combinados para optimizar espacio vertical -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Rasgos de Clase / Progresión de Bárbaro -->
              <div class="bg-neutral-900/40 border border-[#d4af37]/15 p-3.5 rounded-xl space-y-2 card-print flex flex-col justify-between">
                <div class="space-y-2 w-full">
                  <div class="flex items-center justify-between border-b border-neutral-900 pb-1 mb-1">
                    <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Rasgos de {{ getClassData(character.class).name }}</span>
                  </div>
                  
                  <!-- Si es bárbaro, mostramos estadísticas de combate de la clase y acordeón -->
                  <div *ngIf="isBarbarian()" class="space-y-2">
                    <div class="bg-[#121215] border border-neutral-850 p-2 rounded text-[8.5px] grid grid-cols-3 gap-1.5 text-center font-mono">
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Furias</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getBarbarianRagesCount(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Daño Furia</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getBarbarianRageDamage(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Maestrías</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getBarbarianWeaponMasteries(character.level) }}</span>
                      </div>
                    </div>

                    <!-- Acordeón de rasgos activos -->
                    <div class="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar no-print">
                      <div *ngFor="let feature of getActiveFeatures()" class="border border-neutral-850 rounded bg-[#121215]/40 overflow-hidden">
                        <button 
                          (click)="toggleFeature(feature)"
                          class="w-full text-left px-2 py-1.5 text-[9.5px] font-bold text-neutral-300 hover:text-white flex justify-between items-center transition select-none cursor-pointer focus:outline-none"
                        >
                          <span class="font-fantasy uppercase tracking-wider text-[8.5px]">{{ feature }}</span>
                          <span class="text-[7.5px] text-[#d4af37] accordion-arrow" [class.rotated]="isFeatureExpanded(feature)">▶</span>
                        </button>
                        <div class="accordion-content" [class.expanded]="isFeatureExpanded(feature)">
                          <div class="p-2 border-t border-neutral-900 bg-[#0c0c0e]/30 text-[9px] text-neutral-400 leading-relaxed whitespace-pre-line text-left">
                            {{ getFeatureDescription(feature) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Vista de Impresión (Solo PDF Page 1: nombres en cuadros/tarjetas) -->
                    <div class="hidden print:grid grid-cols-2 gap-1.5 mt-1.5">
                      <div 
                        *ngFor="let feature of getActiveFeatures()"
                        class="border border-neutral-800 p-1.5 rounded text-center bg-white flex items-center justify-center min-h-[30px] card-print"
                      >
                        <span class="font-fantasy uppercase tracking-wider text-[7.5px] font-bold text-black">{{ feature }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback: Descripción genérica para otras clases -->
                  <p *ngIf="!isBarbarian()" class="text-[10px] text-neutral-400 leading-normal font-light italic font-fantasy">
                    "{{ getClassData(character.class).description }}"
                  </p>
                </div>
                
                <div class="text-[9.5px] text-neutral-300 border-t border-neutral-900/60 pt-1.5 font-mono">
                  Aptitud Primaria: <span class="text-amber-500 font-bold">{{ getClassData(character.class).primaryStat }}</span>
                </div>
              </div>

              <!-- Competencias del Gremio -->
              <div class="bg-neutral-900/30 border border-neutral-855 p-3.5 rounded-xl space-y-2 text-left card-print">
                <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Entrenamientos del Héroe</span>
                
                <div class="text-[9.5px] space-y-1">
                  <div>
                    <span class="text-neutral-500 block uppercase text-[7.5px] font-bold">Armaduras:</span>
                    <span class="text-neutral-300">
                      {{ hasClassArmorProficiency('ligeras') ? 'Ligeras, ' : '' }}
                      {{ hasClassArmorProficiency('medias') ? 'Medias, ' : '' }}
                      {{ hasClassArmorProficiency('pesadas') ? 'Pesadas, ' : '' }}
                      {{ hasClassArmorProficiency('escudos') ? 'Escudos' : '' }}
                    </span>
                  </div>
                  <div class="pt-1 border-t border-neutral-900/40">
                    <span class="text-neutral-500 block uppercase text-[7.5px] font-bold">Armas:</span>
                    <span class="text-neutral-300 line-clamp-1" [title]="getClassWeaponsProficiency()">{{ getClassWeaponsProficiency() }}</span>
                  </div>
                  <div class="pt-1 border-t border-neutral-900/40">
                    <span class="text-neutral-500 block uppercase text-[7.5px] font-bold">Idiomas:</span>
                    <span class="text-neutral-300">{{ getOriginData(character.race).language }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- PESTAÑA 2: GRIMORIO Y EQUIPO -->
        <div [class.hidden-screen]="activeTab !== 2" class="grid grid-cols-1 md:grid-cols-12 gap-5 print-block page-break">
          
          <!-- Cabecera de impresión exclusiva -->
          <div class="col-span-12 hidden print:flex justify-between items-center border-b border-neutral-800 pb-1 mb-2">
            <span class="text-[9px] font-fantasy font-bold uppercase tracking-wider text-neutral-500">Hoja de Aventurero: {{ character.name }}</span>
            <span class="text-[8px] font-fantasy font-bold uppercase tracking-wider text-[#d4af37]">Grimorio y Equipo Inicial (Nvl {{ character.level }})</span>
          </div>
          
          <!-- COLUMNA 1: APARATO MÁGICO (md:col-span-5) -->
          <div class="md:col-span-5 space-y-4">
            
            <div *ngIf="!isSpellcaster()" class="bg-neutral-900/20 border border-neutral-900 p-6 rounded-xl text-center text-xs text-neutral-500 italic card-print">
              Tu clase activa no posee lanzamiento formal de conjuros al Nivel 1.
            </div>

            <div *ngIf="isSpellcaster()" class="space-y-3">
              <div class="bg-neutral-900/40 border border-neutral-855 p-3.5 rounded-xl space-y-2 card-print">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Aptitud Mágica</span>
                  <span class="text-[9px] font-bold text-neutral-250 font-fantasy uppercase">{{ getSpellcastingAbilityName() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2.5">
                  <div class="bg-[#121215] border border-neutral-850 p-2 rounded text-center card-print">
                    <span class="text-[7.5px] text-neutral-500 uppercase block font-fantasy">CD Salvación</span>
                    <span class="text-lg font-bold font-mono text-[#d4af37] mt-0.5 block">
                      {{ getSpellSaveDC() }}
                    </span>
                  </div>
                  <div class="bg-[#121215] border border-neutral-850 p-2 rounded text-center card-print">
                    <span class="text-[7.5px] text-neutral-500 block font-fantasy">Ataque Conjuro</span>
                    <span class="text-lg font-bold font-mono text-[#d4af37] mt-0.5 block">
                      {{ getSpellAttackBonus() }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Ranuras de Conjuro Nivel 1 -->
              <div class="bg-neutral-900/45 border border-neutral-855 p-3.5 rounded-xl space-y-1.5 card-print">
                <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy block">Ranuras de Conjuro Nivel 1</span>
                <div class="flex items-center gap-3 pt-0.5">
                  <span class="text-[10px] text-neutral-400 font-mono">Espacios:</span>
                  <div class="flex gap-1.5">
                    <div class="w-4 h-4 border border-amber-600/60 rounded flex items-center justify-center text-[8px] text-amber-500 select-none card-print">◇</div>
                    <div class="w-4 h-4 border border-amber-600/60 rounded flex items-center justify-center text-[8px] text-amber-500 select-none card-print">◇</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dote de Origen/Trasfondo -->
            <div class="bg-neutral-900/40 border border-[#d4af37]/15 p-4 rounded-xl space-y-2 card-print">
              <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Dote de Trasfondo</span>
              <div>
                <h4 class="text-xs text-neutral-255 font-bold mb-1 font-fantasy">{{ getFeatInfo(getBackgroundData(character.background).keyFeat).title }}</h4>
                <ul class="space-y-1 list-none pl-0 mt-1.5">
                  <li 
                    *ngFor="let benefit of getFeatInfo(getBackgroundData(character.background).keyFeat).benefits" 
                    class="flex items-start gap-1.5 text-[10px] text-neutral-350 leading-normal"
                  >
                    <span class="text-amber-500 select-none shrink-0">•</span>
                    <span [innerHTML]="benefit"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- COLUMNA 2: EQUIPO E INVENTARIO (md:col-span-7) -->
          <div class="md:col-span-7 space-y-4">
            
            <!-- Monedas y Equipo Inicial -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Monedas -->
              <div class="bg-neutral-900/35 border border-neutral-850 p-3.5 rounded-xl space-y-1.5 card-print">
                <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy block">Monedas de Inicio</span>
                <div class="grid grid-cols-5 gap-1.5 pt-0.5 text-center">
                  <div class="bg-[#121215] border border-neutral-855 p-1 rounded card-print">
                    <div class="text-[6.5px] text-neutral-500 font-bold">PC</div>
                    <div class="text-xs text-amber-800 font-bold font-mono">0</div>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-1 rounded card-print">
                    <div class="text-[6.5px] text-neutral-500 font-bold">PP</div>
                    <div class="text-xs text-neutral-400 font-bold font-mono">0</div>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-1 rounded card-print">
                    <div class="text-[6.5px] text-neutral-500 font-bold">PE</div>
                    <div class="text-xs text-cyan-600 font-bold font-mono">0</div>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-1 rounded card-print">
                    <div class="text-[6.5px] text-[#d4af37] font-bold">PO</div>
                    <div class="text-xs text-[#d4af37] font-bold font-mono">{{ getStartingGold() }}</div>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-1 rounded card-print">
                    <div class="text-[6.5px] text-neutral-500 font-bold">PPT</div>
                    <div class="text-xs text-teal-400 font-bold font-mono">0</div>
                  </div>
                </div>
              </div>

              <!-- Inventario Inicial -->
              <div class="bg-neutral-900/30 border border-neutral-855 p-3.5 rounded-xl space-y-1 text-left card-print">
                <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-0.5">Inventario</span>
                <p class="text-[9.5px] text-neutral-355 leading-relaxed font-light line-clamp-2" [title]="getClassEquipmentOptions(character.class).optionA">
                  <strong>Clase:</strong> {{ getClassEquipmentOptions(character.class).optionA }}
                </p>
              </div>
            </div>

            <!-- Especificaciones del Equipo -->
            <div class="space-y-3">
              <!-- Armas -->
              <div *ngIf="getEquippedWeaponsDetails().length > 0" class="bg-neutral-900/35 border border-neutral-855 p-3.5 rounded-xl space-y-2 text-left card-print">
                <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Especificaciones de Armas</span>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr class="border-b border-neutral-800 text-[7px] uppercase font-bold text-neutral-500 tracking-wider">
                        <th class="py-1 pr-1 font-fantasy">Nombre</th>
                        <th class="py-1 pr-1 text-center font-fantasy">Bono Ataque</th>
                        <th class="py-1 pr-1 text-center font-fantasy">Daño / Tipo</th>
                        <th class="py-1 pr-1 font-fantasy">Propiedades</th>
                        <th *ngIf="hasWeaponMastery()" class="py-1 pr-1 text-center font-fantasy">Maestría</th>
                        <th class="py-1 text-right font-fantasy">Peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let weapon of getEquippedWeaponsDetails()" class="border-b border-neutral-900/60 last:border-0">
                        <td class="py-2 pr-1 font-bold text-neutral-250 flex items-center gap-1">
                          <span class="bg-[#121215] border border-neutral-800 text-neutral-400 font-mono text-[8px] px-1 py-0.5 rounded font-bold card-print">
                            {{ weapon.quantity }}x
                          </span>
                          <span class="truncate max-w-[85px]" [title]="weapon.name">{{ weapon.name }}</span>
                        </td>
                        <td class="py-2 pr-1 text-center font-bold text-[#d4af37] font-mono text-[10.5px]">
                          {{ weapon.attackBonus }}
                          <span class="text-[7px] text-neutral-500 block font-light font-mono mt-0.5">
                            +{{ weapon.abilityModValue }} ({{ weapon.abilityModKey }})
                          </span>
                        </td>
                        <td class="py-2 pr-1 text-center font-mono">
                          <span class="font-semibold text-red-400 text-[10.5px] block">
                            {{ weapon.fullDamage }}
                          </span>
                          <span class="text-[8px] text-neutral-500 block mt-0.5">
                            {{ weapon.damageType }}
                          </span>
                        </td>
                        <td class="py-2 pr-1 text-neutral-400 text-[9px] leading-tight font-light truncate max-w-[120px]" [title]="weapon.properties">{{ weapon.properties }}</td>
                        <td *ngIf="hasWeaponMastery()" class="py-2 pr-1 text-center">
                          <span class="bg-amber-955/20 border border-amber-600/30 text-amber-500 px-1 py-0.5 rounded text-[8.5px] font-bold card-print">
                            {{ weapon.mastery }}
                          </span>
                        </td>
                        <td class="py-2 text-right font-mono text-neutral-400 text-[9px] whitespace-nowrap">{{ weapon.weight }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Armaduras -->
              <div *ngIf="getEquippedArmorsDetails().length > 0" class="bg-neutral-900/35 border border-neutral-855 p-3.5 rounded-xl space-y-2.5 text-left card-print">
                <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Especificaciones de Armaduras & Escudos</span>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr class="border-b border-neutral-800 text-[7px] uppercase font-bold text-neutral-555 tracking-wider">
                        <th class="py-1 pr-1 font-fantasy">Armadura</th>
                        <th class="py-1 pr-1 font-fantasy">Tipo</th>
                        <th class="py-1 pr-1 text-center font-fantasy">CA</th>
                        <th class="py-1 pr-1 text-center font-fantasy">Fuerza</th>
                        <th class="py-1 pr-1 text-center font-fantasy">Sigilo</th>
                        <th class="py-1 text-right font-fantasy">Peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let armor of getEquippedArmorsDetails()" class="border-b border-neutral-900/60 last:border-0">
                        <td class="py-2 pr-1 font-bold text-neutral-250 font-fantasy text-[9.5px]">{{ armor.name }}</td>
                        <td class="py-2 pr-1 text-neutral-450 text-[9px] leading-tight font-light truncate max-w-[100px]" [title]="armor.type">{{ armor.type }}</td>
                        <td class="py-2 pr-1 text-center font-bold text-[#d4af37] font-mono">{{ armor.ca }}</td>
                        <td class="py-2 pr-1 text-center font-mono text-neutral-400">{{ armor.strength }}</td>
                        <td class="py-2 pr-1 text-center">
                          <span *ngIf="armor.stealth === 'Desventaja'" class="bg-red-955/20 border border-red-800/40 text-red-500 px-1 py-0.5 rounded text-[8px] font-bold card-print">
                            Desv
                          </span>
                          <span *ngIf="armor.stealth !== 'Desventaja'" class="text-neutral-600">—</span>
                        </td>
                        <td class="py-2 text-right font-mono text-neutral-455 text-[9px] whitespace-nowrap">{{ armor.weight }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <!-- Resumen Conceptual Narrativo -->
            <div class="bg-neutral-900/40 border border-[#d4af37]/10 p-3 rounded-xl space-y-1 card-print">
              <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-0.5">Vida Pasada</span>
              <p class="text-[10px] text-neutral-355 leading-relaxed font-light">
                {{ getBackgroundData(character.background).concept }}
              </p>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 3: BIOGRAFÍA Y ASPECTO -->
        <div [class.hidden-screen]="activeTab !== 3" class="grid grid-cols-1 md:grid-cols-12 gap-5 print-block page-break">
          
          <!-- Cabecera de impresión exclusiva -->
          <div class="col-span-12 hidden print:flex justify-between items-center border-b border-neutral-800 pb-1 mb-2">
            <span class="text-[9px] font-fantasy font-bold uppercase tracking-wider text-neutral-500">Hoja de Aventurero: {{ character.name }}</span>
            <span class="text-[8px] font-fantasy font-bold uppercase tracking-wider text-[#d4af37]">Crónicas & Apariencia (Nvl {{ character.level }})</span>
          </div>
          
          <!-- COLUMNA 1: DETALLES DE APARIENCIA (md:col-span-4) -->
          <div class="md:col-span-4 space-y-4">
            
            <div class="bg-[#121215] border border-neutral-850 p-4 rounded-xl space-y-3.5 card-print">
              <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-0.5">Atributos Físicos</span>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-[#18181c] border border-neutral-800 p-1.5 rounded card-print">
                  <span class="text-[7px] text-neutral-500 uppercase block font-fantasy">Altura</span>
                  <span class="text-xs font-bold text-neutral-200 font-mono">{{ character.height }} m</span>
                </div>
                <div class="bg-[#18181c] border border-neutral-800 p-1.5 rounded card-print">
                  <span class="text-[7px] text-neutral-500 uppercase block font-fantasy">Tamaño</span>
                  <span class="text-xs font-bold text-neutral-200 uppercase truncate" [title]="character.sizeClass">{{ character.sizeClass }}</span>
                </div>
                <div class="bg-[#18181c] border border-neutral-800 p-1.5 rounded card-print">
                  <span class="text-[7px] text-neutral-500 uppercase block font-fantasy">Especie</span>
                  <span class="text-xs font-bold text-neutral-200 truncate" [title]="character.race">{{ character.race }}</span>
                </div>
              </div>
            </div>

            <!-- Resumen de Rasgos Físicos -->
            <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-1.5 text-left card-print">
              <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-0.5">Descripción Física</span>
              <div class="text-[10.5px] text-neutral-355 leading-relaxed font-light whitespace-pre-wrap">
                {{ character.physicalDesc || 'Sin descripción física documentada.' }}
              </div>
            </div>
          </div>

          <!-- COLUMNA 2: NARRATIVA E HISTORIA (md:col-span-8) -->
          <div class="md:col-span-8 space-y-4">
            
            <div class="bg-[#121215] border border-neutral-850 p-5 rounded-xl relative overflow-hidden min-h-[250px] flex flex-col justify-between card-print">
              <div class="absolute top-4 right-4 text-4xl opacity-10 select-none no-print">📜</div>
              
              <div class="space-y-3">
                <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy block border-b border-neutral-900 pb-1">Crónica de Héroe</span>
                <p class="text-[11px] text-neutral-300 leading-relaxed font-fantasy italic whitespace-pre-wrap pl-4 border-l border-[#d4af37]/35 max-h-[300px] overflow-y-auto custom-scrollbar scroll-print">
                  "{{ character.history || 'Esta historia aún no ha sido escrita en los pergaminos del reino...' }}"
                </p>
              </div>

              <div class="pt-3 border-t border-neutral-900/60 mt-3 text-[8.5px] text-neutral-500 font-fantasy italic text-right uppercase tracking-wider">
                — Forjado como {{ character.class }} • Origen: {{ character.background }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .font-fantasy {
      font-family: 'Cinzel', serif;
    }
    .font-sans-clean {
      font-family: 'Inter', sans-serif;
    }

    .animate-fade-in {
      animation: fadeIn 0.35s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hidden-screen {
      display: none !important;
    }

    /* ESTILOS DE IMPRESIÓN MÓVIL/PDF */
    @media print {
      body, .min-h-screen, html {
        background: white !important;
        background-color: white !important;
        color: black !important;
      }
      .no-print {
        display: none !important;
      }
      .hidden-screen {
        display: block !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .print-layout {
        display: block !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        color: black !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
      }
      .card-print {
        background: white !important;
        border: 1px solid #1a1a1a !important;
        color: black !important;
        border-radius: 8px !important;
        box-shadow: none !important;
      }
      .print-title {
        color: black !important;
        background: none !important;
        -webkit-text-fill-color: black !important;
      }
      .print-details span, .print-details {
        color: #333 !important;
        border-color: #555 !important;
        background: white !important;
      }
      .text-neutral-200, .text-neutral-300, .text-neutral-350, .text-neutral-405, .text-neutral-450 {
        color: black !important;
      }
      .text-amber-500, [class*="text-[#d4af37]"] {
        color: #8b6508 !important;
      }
      .text-red-500, .text-red-400 {
        color: #b91c1c !important;
      }
      div, section, header, main, span, p, h1, h2, h3, h4, h5, h6, a, button {
        background-color: white !important;
        background: white !important;
        color: black !important;
        border-color: #444 !important;
      }
      @page {
        margin: 0.8cm 1cm !important;
      }
      .grid {
        display: grid !important;
        grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
        gap: 16px !important;
      }
      .col-span-2 {
        grid-column: span 2 / span 2 !important;
      }
      .col-span-12 {
        grid-column: span 12 / span 12 !important;
      }
      .md\\:col-span-6 {
        grid-column: span 6 / span 6 !important;
      }
      .md\\:col-span-5 {
        grid-column: span 5 / span 5 !important;
      }
      .md\\:col-span-7 {
        grid-column: span 7 / span 7 !important;
      }
      .md\\:col-span-4 {
        grid-column: span 4 / span 4 !important;
      }
      .md\\:col-span-8 {
        grid-column: span 8 / span 8 !important;
      }
      .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      .md\\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      }
      .grid-cols-5 {
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      }
      .md\\:grid-cols-6 {
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      }
      .sm\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .scroll-print {
        max-height: none !important;
        overflow: visible !important;
      }
      .overflow-x-auto, .overflow-y-auto, .custom-scrollbar {
        overflow: visible !important;
        max-height: none !important;
      }
    }
  `]
})
export class CharacterSheetComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private characterService = inject(CharacterService);
  private cdr = inject(ChangeDetectorRef);

  character: Character | null = null;
  loading = true;
  errorLoading = false;
  activeTab = 1;
  debugLogs: string[] = [];
  expandedFeatures: { [key: string]: boolean } = {};

  isBarbarian(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('bárbaro') || name.includes('barbaro');
  }

  getProficiencyBonus(): number {
    if (!this.character) return 2;
    const lvl = this.character.level || 1;
    return Math.floor((lvl - 1) / 4) + 2;
  }

  decreaseLevel(): void {
    if (!this.character) return;
    if (this.character.level > 1) {
      this.character.level--;
      this.saveCharacterLevel();
    }
  }

  increaseLevel(): void {
    if (!this.character) return;
    if (this.character.level < 20) {
      this.character.level++;
      this.saveCharacterLevel();
    }
  }

  saveCharacterLevel(): void {
    if (!this.character || !this.character.id) return;
    this.addLog(`Guardando nuevo nivel ${this.character.level} en BD...`);
    this.characterService.updateCharacter(this.character.id, { level: this.character.level }).subscribe({
      next: (updated) => {
        this.addLog(`Nivel actualizado en BD con éxito a ${updated.level}`);
        this.character = { ...this.character!, level: updated.level };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addLog(`Error al guardar nivel: ${err.message || JSON.stringify(err)}`);
      }
    });
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
    
    if (!this.isBarbarian()) return [];

    const active: string[] = [];
    for (let l = 1; l <= level; l++) {
      const step = BARBARIAN_PROGRESS_MAP[l];
      if (step && step.features) {
        step.features.forEach(f => {
          if (!active.includes(f)) {
            active.push(f);
          }
        });
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
    return FEATURE_DESCRIPTIONS_MAP[featureName] || 'Descripción del rasgo de clase en el manual.';
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
          this.addLog('ADVERTENCIA: ¡No se encontró ID en los parámetros de ruta!');
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
        this.addLog(`Personaje recibido con éxito: ${char ? char.name : 'null'}`);
        this.character = char;
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
      { name: 'Constitución', key: 'CON', keyLow: 'constitution', value: char.stats.constitution },
      { name: 'Inteligencia', key: 'INT', keyLow: 'intelligence', value: char.stats.intelligence },
      { name: 'Sabiduría', key: 'SAB', keyLow: 'wisdom', value: char.stats.wisdom },
      { name: 'Carisma', key: 'CAR', keyLow: 'charisma', value: char.stats.charisma }
    ];
  }

  hasClassSavingThrowProficiency(key: string): boolean {
    if (!this.character || !this.character.class) return false;
    const className = this.character.class.toLowerCase();
    
    if (className.includes('bárbaro') || className.includes('barbaro')) {
      return key === 'FUE' || key === 'CON';
    }
    if (className.includes('bardo')) {
      return key === 'DES' || key === 'CAR';
    }
    if (className.includes('clérigo') || className.includes('clerigo')) {
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
    if (className.includes('paladín') || className.includes('paladin')) {
      return key === 'SAB' || key === 'CAR';
    }
    if (className.includes('explorador')) {
      return key === 'FUE' || key === 'DES';
    }
    if (className.includes('pícaro') || className.includes('picaro')) {
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
    if (bg.includes('acólito') || bg.includes('acolito')) return ['religión', 'medicina'];
    if (bg.includes('charlatán') || bg.includes('charlatan')) return ['engaño', 'juego de manos'];
    if (bg.includes('criminal')) return ['engaño', 'sigilo'];
    if (bg.includes('artista')) return ['acrobacias', 'interpretación'];
    if (bg.includes('héroe del pueblo') || bg.includes('heroe del pueblo')) return ['trato con animales', 'supervivencia'];
    if (bg.includes('artesano gremial') || bg.includes('artesano')) return ['perspicacia', 'persuasión'];
    if (bg.includes('ermitaño') || bg.includes('ermitano')) return ['medicina', 'religión'];
    if (bg.includes('noble')) return ['historia', 'persuasión'];
    if (bg.includes('forastero')) return ['atletismo', 'supervivencia'];
    if (bg.includes('sabio')) return ['conocimiento arcano', 'historia'];
    if (bg.includes('marinero')) return ['atletismo', 'percepción'];
    if (bg.includes('soldado')) return ['atletismo', 'intimidación'];
    if (bg.includes('huérfano') || bg.includes('huerfano')) return ['juego de manos', 'sigilo'];
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
    if (s.includes('pequeño') || s.includes('pequeno')) return 'P';
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
      else if (size === 'Pequeño') size = 'Mediano';
    }

    let factorMax = 7.5;
    let factorDrag = 15.0;

    const s = size.toLowerCase().trim();
    if (s === 'diminuto') {
      factorMax = 3.75;
      factorDrag = 7.5;
    } else if (s === 'pequeño' || s === 'mediano') {
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
    if (name.includes('bárbaro') || name.includes('barbaro')) {
      return { name: 'Bárbaro', hitDie: 12, primaryStat: 'Fuerza', description: 'Un fiero guerrero de trasfondo primitivo que puede entrar en una furia brutal. Resiste daño extremo y domina armas pesadas.' };
    }
    if (name.includes('bardo')) {
      return { name: 'Bardo', hitDie: 8, primaryStat: 'Carisma', description: 'Un maestro de la música y la magia que inspira aliados, confunde enemigos y domina artes artísticas.' };
    }
    if (name.includes('brujo')) {
      return { name: 'Brujo', hitDie: 8, primaryStat: 'Carisma', description: 'Un buscador de conocimientos prohibidos con pactos sobrenaturales de otros mundos.' };
    }
    if (name.includes('clérigo') || name.includes('clerigo')) {
      return { name: 'Clérigo', hitDie: 8, primaryStat: 'Sabiduría', description: 'Un sacerdote sagrado que canaliza magia divina para sanar y castigar con justicia celestial.' };
    }
    if (name.includes('druida')) {
      return { name: 'Druida', hitDie: 8, primaryStat: 'Sabiduría', description: 'Un guardián del equilibrio natural que invoca tempestades y adopta formas de bestias.' };
    }
    if (name.includes('guerrero')) {
      return { name: 'Guerrero', hitDie: 10, primaryStat: 'Fuerza o Destreza', description: 'Un combatiente experto en tácticas y el uso de todo tipo de armas y armaduras.' };
    }
    if (name.includes('hechicero')) {
      return { name: 'Hechicero', hitDie: 6, primaryStat: 'Carisma', description: 'Un lanzador de conjuros con magia innata corriendo por sus venas de ancestros mágicos.' };
    }
    if (name.includes('mago')) {
      return { name: 'Mago', hitDie: 6, primaryStat: 'Inteligencia', description: 'Un erudito que manipula las leyes del multiverso registrando conjuros en su libro.' };
    }
    if (name.includes('monje')) {
      return { name: 'Monje', hitDie: 8, primaryStat: 'Destreza y Sabiduría', description: 'Un artista marcial que canaliza la energía ki de su propio cuerpo para pelear desarmado.' };
    }
    if (name.includes('paladín') || name.includes('paladin')) {
      return { name: 'Paladín', hitDie: 10, primaryStat: 'Fuerza y Carisma', description: 'Un guerrero sagrado vinculado a un juramento inquebrantable que lucha contra el mal.' };
    }
    if (name.includes('pícaro') || name.includes('picaro')) {
      return { name: 'Pícaro', hitDie: 8, primaryStat: 'Destreza', description: 'Un astuto oportunista especializado en sigilo, trampas y asestar ataques furtivos.' };
    }
    if (name.includes('explorador')) {
      return { name: 'Explorador', hitDie: 10, primaryStat: 'Destreza y Sabiduría', description: 'Un cazador y rastreador letal de las tierras salvajes, diestro en guiar a su grupo.' };
    }
    return { name: className, hitDie: 8, primaryStat: 'Fuerza', description: 'Un intrépido héroe listo para la aventura.' };
  }

  getBackgroundData(bgName: string) {
    const name = (bgName || '').toLowerCase().trim();
    if (name.includes('acólito') || name.includes('acolito')) {
      return { name: 'Acólito', keyFeat: 'Iniciado en la Magia', concept: 'Sirves en un templo u orden religiosa. Eres un canal para los ritos divinos.', tools: 'Útiles de calígrafo o pintor' };
    }
    if (name.includes('charlatán') || name.includes('charlatan')) {
      return { name: 'Charlatán', keyFeat: 'Afortunado', concept: 'Te ganas la vida engañando a los demás con falsas promesas y astucia urbana.', tools: 'Estuche de disfraz' };
    }
    if (name.includes('criminal')) {
      return { name: 'Criminal', keyFeat: 'Alerta', concept: 'Conoces los callejones oscuros y el bajo mundo. Diestro en moverte sin ser visto.', tools: 'Herramientas de ladrón' };
    }
    if (name.includes('artista')) {
      return { name: 'Artista', keyFeat: 'Músico', concept: 'Vives del aplauso y el entretenimiento, actuando ante todo tipo de públicos.', tools: 'Un instrumento musical' };
    }
    if (name.includes('héroe del pueblo') || name.includes('heroe del pueblo')) {
      return { name: 'Héroe del Pueblo', keyFeat: 'Duro', concept: 'Vienes de un origen humilde y te alzaste para defender a tus vecinos del peligro.', tools: 'Herramientas de artesano' };
    }
    if (name.includes('artesano gremial') || name.includes('artesano')) {
      return { name: 'Artesano Gremial', keyFeat: 'Fabricante', concept: 'Eres miembro de un gremio comercial y dominas un oficio de manufactura de bienes.', tools: 'Herramientas de artesano' };
    }
    if (name.includes('ermitaño') || name.includes('ermitano')) {
      return { name: 'Ermitaño', keyFeat: 'Sanador', concept: 'Pasaste años aislado de la sociedad meditando y buscando la iluminación espiritual.', tools: 'Útiles de herborista' };
    }
    if (name.includes('noble')) {
      return { name: 'Noble', keyFeat: 'Músico', concept: 'Naciste en la aristocracia, posees títulos o sirves a la corte. Sabes de protocolo.', tools: 'Un instrumento musical' };
    }
    if (name.includes('forastero')) {
      return { name: 'Forastero', keyFeat: 'Duro', concept: 'Creciste en las tierras salvajes, lejos de las ciudades. Sabes subsistir en lo agreste.', tools: 'Instrumento rústico' };
    }
    if (name.includes('sabio')) {
      return { name: 'Sabio', keyFeat: 'Iniciado en la Magia', concept: 'Eres un estudioso del multiverso. Pasaste años en bibliotecas acumulando datos.', tools: 'Útiles de escriba' };
    }
    if (name.includes('marinero')) {
      return { name: 'Marinero', keyFeat: 'Duro', concept: 'Trabajaste en la tripulación de un navío, enfrentándote a tormentas y piratas.', tools: 'Herramientas de navegante' };
    }
    if (name.includes('soldado')) {
      return { name: 'Soldado', keyFeat: 'Alerta', concept: 'Fuiste miembro de un ejército o guardia. Conoces la disciplina militar.', tools: 'Juego de cartas o dados' };
    }
    if (name.includes('huérfano') || name.includes('huerfano')) {
      return { name: 'Huérfano', keyFeat: 'Afortunado', concept: 'Creciste solo en las calles, sobreviviendo gracias a tu rapidez física.', tools: 'Estuche de juego' };
    }
    return { name: bgName, keyFeat: 'Afortunado', concept: 'Un trasfondo humilde o misterioso.', tools: 'Herramientas básicas' };
  }

  getOriginData(raceName: string) {
    const r = (raceName || '').toLowerCase().trim();
    if (r.includes('aasimar')) return { name: 'Aasimar', speed: '30 pies (9m)', language: 'Común, Celestial' };
    if (r.includes('dracónido') || r.includes('draconido')) return { name: 'Dracónido', speed: '30 pies (9m)', language: 'Común, Dracónico' };
    if (r.includes('elfo')) return { name: 'Elfo', speed: '30 pies (9m)', language: 'Común, Élfico' };
    if (r.includes('enano')) return { name: 'Enano', speed: '30 pies (9m)', language: 'Común, Enano' };
    if (r.includes('gnomo')) return { name: 'Gnomo', speed: '30 pies (9m)', language: 'Común, Gnomo' };
    if (r.includes('goliat') || r.includes('goliath')) return { name: 'Goliat', speed: '35 pies (10.5m)', language: 'Común, Gigante' };
    if (r.includes('humano')) return { name: 'Humano', speed: '30 pies (9m)', language: 'Común, idioma extra' };
    if (r.includes('mediano')) return { name: 'Mediano', speed: '25 pies (7.5m)', language: 'Común, Mediano' };
    if (r.includes('orco')) return { name: 'Orco', speed: '30 pies (9m)', language: 'Común, Orco' };
    if (r.includes('tiflin') || r.includes('tiefling')) return { name: 'Tiflin', speed: '30 pies (9m)', language: 'Común, Infernal' };
    return { name: raceName, speed: '30 pies (9m)', language: 'Común' };
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
          '<strong>Intercambio de iniciativa:</strong> Justo después de tirar iniciativa, puedes cambiar tu posición en el orden con un aliado dispuesto.'
        ]
      };
    }
    if (cleanName.includes('salvaje') || cleanName.includes('atacante')) {
      return {
        title: 'Atacante Salvaje',
        benefits: [
          '<strong>Daño doble:</strong> Una vez por turno, cuando aciertes con un arma, puedes tirar dos veces los dados de daño del arma y usar el resultado que prefieras.'
        ]
      };
    }
    if (cleanName.includes('duro')) {
      return {
        title: 'Duro',
        benefits: [
          '<strong>Salud incrementada:</strong> Tus puntos de golpe máximos aumentan en una cantidad igual al doble de tu nivel.',
          '<strong>Crecimiento:</strong> Cada vez que subas de nivel, tus puntos de golpe aumentan en 2 puntos adicionales.'
        ]
      };
    }
    if (cleanName.includes('fabricante') || cleanName.includes('crafter')) {
      return {
        title: 'Fabricante',
        benefits: [
          '<strong>Herramientas:</strong> Competencia con 3 herramientas de artesano.',
          '<strong>Descuento:</strong> Consigues un 20% de descuento al comprar cualquier objeto no mágico.'
        ]
      };
    }
    if (cleanName.includes('habilidoso') || cleanName.includes('skilled')) {
      return {
        title: 'Habilidoso',
        benefits: [
          '<strong>Competencia extra:</strong> Ganas competencia en cualquier combinación de tres habilidades o herramientas que elijas.'
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
    if (cleanName.includes('matón') || cleanName.includes('maton') || cleanName.includes('taberna')) {
      return {
        title: 'Matón de Taberna',
        benefits: [
          '<strong>Ataque desarmado:</strong> Tu ataque sin armas causa 1d4 + mod. Fuerza.',
          '<strong>Armas improvisadas:</strong> Tienes competencia con armas improvisadas.'
        ]
      };
    }
    if (cleanName.includes('músico') || cleanName.includes('musico')) {
      return {
        title: 'Músico',
        benefits: [
          '<strong>Música Alentadora:</strong> Tocas para dar inspiración heroica a tus aliados tras finalizar un descanso.'
        ]
      };
    }
    if (cleanName.includes('sanador') || cleanName.includes('healer')) {
      return {
        title: 'Sanador',
        benefits: [
          '<strong>Médico de batalla:</strong> Cura a un aliado gastando un uso de útiles de sanador (dado de golpe + BC).'
        ]
      };
    }
    
    return {
      title: featName.split('(')[0].trim(),
      benefits: ['Dote de origen del manual. Confiere beneficios únicos y rasgos pasivos a tu aventurero.']
    };
  }

  getClassEquipmentOptions(name: string): { optionA: string, optionB: string } {
    if (!name) return { optionA: '—', optionB: '—' };
    const n = name.toLowerCase();
    if (n.includes('bárbaro') || n.includes('barbaro')) {
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
    if (n.includes('clérigo') || n.includes('clerigo')) {
      return {
        optionA: 'Lóriga (Chain Shirt), Escudo, Maza, Símbolo Sagrado, paquete de sacerdote y 7 po.',
        optionB: '110 po'
      };
    }
    if (n.includes('druida')) {
      return {
        optionA: 'Garrote, hoz, foco druídico, paquete de explorador, útiles de herborista y 9 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('explorador')) {
      return {
        optionA: 'Espada corta, arco corto, 20 flechas, carcaj, foco druídico, paquete de explorador y 7 po.',
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
    if (n.includes('paladín') || n.includes('paladin')) {
      return {
        optionA: 'Cota de malla, Escudo, espada larga, 6 jabalinas, Símbolo Sagrado, paquete de sacerdote y 9 po.',
        optionB: '150 po'
      };
    }
    if (n.includes('pícaro') || n.includes('picaro')) {
      return {
        optionA: 'Armadura de cuero, 2 dagas, espada corta, arco corto, 20 flechas, carcaj, herramientas de ladrón, paquete de ladrón y 8 po.',
        optionB: '100 po'
      };
    }
    return { optionA: '—', optionB: '—' };
  }

  getBgEquipmentOptions(bgName: string): { optionA: string, optionB: string } {
    const n = (bgName || '').toLowerCase().trim();
    if (n.includes('acólito') || n.includes('acolito')) {
      return { optionA: 'Símbolo sagrado, libro de oraciones, 5 varitas de incienso, vestiduras y 15 po.', optionB: '25 po' };
    }
    if (n.includes('charlatán') || n.includes('charlatan')) {
      return { optionA: 'Ropas finas, estuche de disfraz, 10 botellas vacías, baraja trucada y 15 po.', optionB: '25 po' };
    }
    if (n.includes('criminal')) {
      return { optionA: 'Palanca, ropas oscuras con capucha, herramientas de ladrón y 15 po.', optionB: '25 po' };
    }
    if (n.includes('artista')) {
      return { optionA: 'Instrumento musical, ropas de calidad, cartas de admiradores y 15 po.', optionB: '25 po' };
    }
    if (n.includes('héroe del pueblo') || n.includes('heroe del pueblo')) {
      return { optionA: 'Pala, olla de hierro, ropas de viaje, herramientas de artesano y 10 po.', optionB: '20 po' };
    }
    if (n.includes('artesano gremial') || n.includes('artesano')) {
      return { optionA: 'Herramientas de artesano, carta de recomendación de tu gremio, ropas de viaje y 15 po.', optionB: '25 po' };
    }
    if (n.includes('ermitaño') || n.includes('ermitano')) {
      return { optionA: 'Estuche de pergaminos, manta de viaje, útiles de herborista, ropas sencillas y 5 po.', optionB: '15 po' };
    }
    if (n.includes('noble')) {
      return { optionA: 'Ropas finas, anillo de sello, juego de dados y 25 po.', optionB: '35 po' };
    }
    if (n.includes('forastero')) {
      return { optionA: 'Bastón, trampa para cazar, ropas de viaje, odre y 10 po.', optionB: '20 po' };
    }
    if (n.includes('sabio')) {
      return { optionA: 'Tintero, pluma, cuchillo pequeño, ropas sencillas y 10 po.', optionB: '20 po' };
    }
    if (n.includes('marinero')) {
      return { optionA: 'Clavo de abordaje, 15 metros de cuerda de cáñamo, ropas de viaje y 10 po.', optionB: '20 po' };
    }
    if (n.includes('soldado')) {
      return { optionA: 'Insignia de rango, trofeo de guerra, juego de cartas, ropas de viaje y 10 po.', optionB: '20 po' };
    }
    if (n.includes('huérfano') || n.includes('huerfano')) {
      return { optionA: 'Cuchillo pequeño, mapa de tu ciudad natal, ratón mascota, ropas sencillas y 10 po.', optionB: '20 po' };
    }
    return { optionA: 'Ropas de viaje y 10 po.', optionB: '10 po' };
  }

  getStartingGold(): number {
    if (!this.character) return 10;
    const name = this.character.class.toLowerCase();
    let classGold = 10;
    if (name.includes('bárbaro') || name.includes('barbaro')) classGold = 15;
    else if (name.includes('bardo')) classGold = 19;
    else if (name.includes('brujo')) classGold = 15;
    else if (name.includes('clérigo') || name.includes('clerigo')) classGold = 7;
    else if (name.includes('druida')) classGold = 9;
    else if (name.includes('explorador')) classGold = 7;
    else if (name.includes('guerrero')) classGold = 4;
    else if (name.includes('hechicero')) classGold = 28;
    else if (name.includes('mago')) classGold = 5;
    else if (name.includes('monje')) classGold = 11;
    else if (name.includes('paladín') || name.includes('paladin')) classGold = 9;
    else if (name.includes('pícaro') || name.includes('picaro')) classGold = 8;

    const bgName = this.character.background.toLowerCase();
    let bgGold = 10;
    if (bgName.includes('acólito') || bgName.includes('acolito')) bgGold = 15;
    else if (bgName.includes('charlatán') || bgName.includes('charlatan')) bgGold = 15;
    else if (bgName.includes('criminal')) bgGold = 15;
    else if (bgName.includes('artista')) bgGold = 15;
    else if (bgName.includes('héroe') || bgName.includes('heroe')) bgGold = 10;
    else if (bgName.includes('artesano')) bgGold = 15;
    else if (bgName.includes('ermitaño') || bgName.includes('ermitano')) bgGold = 5;
    else if (bgName.includes('noble')) bgGold = 25;
    else if (bgName.includes('forastero')) bgGold = 10;
    else if (bgName.includes('sabio')) bgGold = 10;
    else if (bgName.includes('marinero')) bgGold = 10;
    else if (bgName.includes('soldado')) bgGold = 10;
    else if (bgName.includes('huérfano') || bgName.includes('huerfano')) bgGold = 10;

    return classGold + bgGold;
  }

  getMergedIndividualItems(): { name: string, quantity: number }[] {
    if (!this.character) return [];
    const className = this.character.class.toLowerCase();
    const items: { name: string, quantity: number }[] = [];

    if (className.includes('bárbaro') || className.includes('barbaro')) {
      items.push({ name: 'Hacha a dos manos', quantity: 1 });
      items.push({ name: 'Hacha de mano', quantity: 4 });
    } else if (className.includes('bardo')) {
      items.push({ name: 'Daga', quantity: 1 });
    } else if (className.includes('brujo')) {
      items.push({ name: 'Daga', quantity: 1 });
      items.push({ name: 'Hoz', quantity: 1 });
    } else if (className.includes('clérigo') || className.includes('clerigo')) {
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
    } else if (className.includes('paladín') || className.includes('paladin')) {
      items.push({ name: 'Espada larga', quantity: 1 });
      items.push({ name: 'Escudo', quantity: 1 });
      items.push({ name: 'Cota de malla', quantity: 1 });
      items.push({ name: 'Jabalina', quantity: 6 });
    } else if (className.includes('pícaro') || className.includes('picaro')) {
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
    if (name.includes('bárbaro') || name.includes('barbaro') || name.includes('guerrero') || 
        name.includes('paladín') || name.includes('paladin') || name.includes('explorador')) {
      return true;
    }
    if (category === 'sencilla') return true;
    
    const w = weaponName.toLowerCase();
    if (name.includes('bardo') || name.includes('pícaro') || name.includes('picaro')) {
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
    return name.includes('bárbaro') || name.includes('barbaro') || 
           name.includes('guerrero') || name.includes('paladín') || 
           name.includes('paladin') || name.includes('explorador');
  }

  getEquippedWeaponsDetails(): any[] {
    const list = this.getMergedIndividualItems();
    const weaponTable: { [key: string]: { name: string; damageDie: string; damageType: string; properties: string; mastery: string; weight: string; price: string; description: string; category: 'sencilla' | 'marcial'; type: 'cuerpo a cuerpo' | 'a distancia'; finesse: boolean } } = {
      'espada larga': {
        name: 'Espada larga',
        damageDie: '1d8',
        damageType: 'Cortante',
        properties: 'Versátil (1d10)',
        mastery: 'Debilitar',
        weight: '1,5 kg',
        price: '15 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrá desventaja en su próxima tirada de ataque antes del principio de tu siguiente turno.',
        category: 'marcial',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'ballesta ligera': {
        name: 'Ballesta ligera',
        damageDie: '1d8',
        damageType: 'Perforante',
        properties: 'A dos manos, munición (alcance 24/96; virote), recarga',
        mastery: 'Ralentizar',
        weight: '2,5 kg',
        price: '25 po',
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daño, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'a distancia',
        finesse: false
      },
      'lanza': {
        name: 'Lanza',
        damageDie: '1d6',
        damageType: 'Perforante',
        properties: 'Arrojadiza (alcance 6/18), versátil (1d8)',
        mastery: 'Debilitar',
        weight: '1,5 kg',
        price: '1 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrá desventaja en su próxima tirada de ataque antes del principio de tu siguiente turno.',
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
        description: 'Mellar: Cuando hagas el ataque extra de la propiedad "ligera", puedes hacerlo como parte de la acción de atacar en vez de como acción adicional. Solo puedes hacer este ataque extra una vez por turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: true
      },
      'arco corto': {
        name: 'Arco corto',
        damageDie: '1d6',
        damageType: 'Perforante',
        properties: 'A dos manos, munición (alcance 24/96; flecha)',
        mastery: 'Molestar',
        weight: '1 kg',
        price: '25 po',
        description: 'Molestar: Si aciertas a una criatura con esta arma y le causas daño, tendrás ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu siguiente turno.',
        category: 'sencilla',
        type: 'a distancia',
        finesse: false
      },
      'bastón': {
        name: 'Bastón',
        damageDie: '1d6',
        damageType: 'Contundente',
        properties: 'Versátil (1d8)',
        mastery: 'Derribar',
        weight: '2 kg',
        price: '2 pp',
        description: 'Derribar: Si aciertas a una criatura con esta arma, puedes obligarla a hacer una tirada de salvación de Constitución (CD 8 + mod. Característica + BC). Si la falla, quedará derribada.',
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
        description: 'Molestar: Si aciertas a una criatura con esta arma y le causas daño, tendrás ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu siguiente turno.',
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
        description: 'Mellar: Cuando hagas el ataque extra de la propiedad "ligera", puedes hacerlo como parte de la acción de atacar en vez de como acción adicional.',
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
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daño, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
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
        description: 'Ralentizar: Si aciertas a una criatura con esta arma y le causas daño, puedes reducir su velocidad en 3 m hasta el principio de tu siguiente turno.',
        category: 'sencilla',
        type: 'cuerpo a cuerpo',
        finesse: false
      },
      'maza': {
        name: 'Maza',
        damageDie: '1d6',
        damageType: 'Contundente',
        properties: '—',
        mastery: 'Debilitar',
        weight: '2 kg',
        price: '5 po',
        description: 'Debilitar: Si aciertas a una criatura con esta arma, tendrá desventaja en su próxima tirada de ataque antes del principio de tu siguiente turno.',
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
        description: 'Cortar: Si aciertas un ataque con esta arma, el daño sobrante se propaga a una criatura adyacente si superas su CA (máximo tu mod. característica).',
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
        ca: '14 + mod. Des (máx. 2)',
        strength: '—',
        stealth: 'Desventaja',
        weight: '22,5 kg',
        price: '50 po'
      },
      'armadura de cuero': {
        name: 'Armadura de cuero',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '11 + mod. Des',
        strength: '—',
        stealth: '—',
        weight: '5 kg',
        price: '10 po'
      },
      'armadura acolchada': {
        name: 'Armadura acolchada',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '11 + mod. Des',
        strength: '—',
        stealth: 'Desventaja',
        weight: '4 kg',
        price: '5 po'
      },
      'cuero tachonado': {
        name: 'Armadura de cuero tachonado',
        type: 'Ligera (1 min de poner/quitar)',
        ca: '12 + mod. Des',
        strength: '—',
        stealth: '—',
        weight: '6,5 kg',
        price: '45 po'
      },
      'escudo': {
        name: 'Escudo',
        type: 'Escudo (acción de equipar/desequipar)',
        ca: '+2',
        strength: '—',
        stealth: '—',
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
      return name.includes('guerrero') || name.includes('paladín') || name.includes('paladin') || 
             name.includes('bárbaro') || name.includes('barbaro') || name.includes('clérigo') || 
             name.includes('clerigo') || name.includes('druida') || name.includes('explorador');
    }
    if (type === 'pesadas') {
      return name.includes('guerrero') || name.includes('paladín') || name.includes('paladin');
    }
    if (type === 'escudos') {
      return name.includes('guerrero') || name.includes('paladín') || name.includes('paladin') || 
             name.includes('bárbaro') || name.includes('barbaro') || name.includes('clérigo') || 
             name.includes('clerigo') || name.includes('druida') || name.includes('explorador');
    }
    return false;
  }

  getClassWeaponsProficiency(): string {
    if (!this.character || !this.character.class) return 'Ninguna';
    const name = this.character.class.toLowerCase();
    
    if (name.includes('bárbaro') || name.includes('barbaro') || name.includes('guerrero') || 
        name.includes('paladín') || name.includes('paladin') || name.includes('explorador')) {
      return 'Armas sencillas, Armas marciales';
    }
    if (name.includes('bardo')) {
      return 'Armas sencillas, Ballestas de mano, Roperas, Espadas cortas';
    }
    if (name.includes('clérigo') || name.includes('clerigo') || name.includes('brujo')) {
      return 'Armas sencillas';
    }
    if (name.includes('druida')) {
      return 'Bastones, Dagas, Dardos, Jabalinas, Lanzas, Hondas, Cimitarras';
    }
    if (name.includes('monje')) {
      return 'Armas sencillas, Espadas cortas';
    }
    if (name.includes('pícaro') || name.includes('picaro')) {
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
    return name.includes('mago') || name.includes('hechicero') || name.includes('bardo') || 
           name.includes('brujo') || name.includes('clérigo') || name.includes('clerigo') || 
           name.includes('druida') || name.includes('paladín') || name.includes('paladin') || 
           name.includes('explorador');
  }

  getSpellcastingAbility(): string {
    if (!this.character || !this.character.class) return 'Ninguna';
    const name = this.character.class.toLowerCase();
    if (name.includes('mago')) return 'INT';
    if (name.includes('clérigo') || name.includes('clerigo') || name.includes('druida') || name.includes('explorador')) return 'SAB';
    if (name.includes('bardo') || name.includes('hechicero') || name.includes('brujo') || name.includes('paladín') || name.includes('paladin')) return 'CAR';
    return 'Ninguna';
  }

  getSpellcastingAbilityName(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'INT') return 'Inteligencia';
    if (key === 'SAB') return 'Sabiduría';
    if (key === 'CAR') return 'Carisma';
    return 'Ninguna';
  }

  getSpellSaveDC(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'Ninguna') return '—';
    const mod = this.getFinalModifierValue(key === 'INT' ? 'intelligence' : key === 'SAB' ? 'wisdom' : 'charisma');
    return `${8 + this.getProficiencyBonus() + mod}`;
  }

  getSpellAttackBonus(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'Ninguna') return '—';
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

const BARBARIAN_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Defensa sin armadura', 'Furia', 'Maestría con armas'] },
  2: { features: ['Ataque temerario', 'Sentir el peligro'] },
  3: { features: ['Conocimiento primigenio', 'Subclase de bárbaro'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Ataque adicional', 'Movimiento rápido'] },
  6: { features: ['Rasgo de subclase'] },
  7: { features: ['Instinto salvaje', 'Salto instintivo'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Golpe brutal'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Furia implacable'] },
  12: { features: ['Mejora de característica'] },
  13: { features: ['Golpe brutal mejorado'] },
  14: { features: ['Rasgo de subclase'] },
  15: { features: ['Furia persistente'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Golpe brutal mejorado'] },
  18: { features: ['Poderío indómito'] },
  19: { features: ['Don épico'] },
  20: { features: ['Campeón primordial'] }
};

const FEATURE_DESCRIPTIONS_MAP: { [key: string]: string } = {
  'Defensa sin armadura': 'Mientras no lleves armadura alguna, tu clase de armadura base será igual a 10 más tus modificadores por Destreza y Constitución. Obtienes este beneficio aunque lleves un escudo.',
  'Furia': 'Puedes imbuirte de un poder primigenio llamado furia, que te otorga una fuerza y resistencia extraordinarias. Puedes dejarte llevar por ella como acción adicional si no llevas puesta una armadura pesada.\n\nRecuperas uno de los usos gastados tras un descanso corto y todos tras un descanso largo.\n\nMientras estés enfurecido, usas las siguientes reglas:\n• Resistencia al daño: Tienes resistencia al daño contundente, cortante y perforante.\n• Daño por furia: Cuando llevas a cabo un ataque que use la Fuerza (ya sea con un arma o un ataque sin armas) y causas daño al objetivo, obtienes un bonificador al daño que aumenta conforme subes de nivel (+2 a +4).\n• Ventaja en Fuerza: Tienes ventaja en las pruebas de Fuerza y en las tiradas de salvación de Fuerza.\n• Sin concentración ni conjuros: No puedes mantener la concentración ni lanzar conjuros.\n• Duración: La furia dura hasta el final de tu siguiente turno y termina antes si te pones una armadura pesada o recibes el estado de incapacitado.',
  'Maestría con armas': 'Tu entrenamiento con armas te permite utilizar las propiedades de maestría con dos tipos de armas cuerpo a cuerpo sencillas o marciales de tu elección, como las hachas a dos manos y las hachas de mano. Tras finalizar un descanso largo, puedes cambiar una de dichas elecciones.\n\nCuando alcances ciertos niveles de bárbaro, adquirirás la capacidad de usar las propiedades de maestría con más tipos de armas, como se muestra en la columna "Maestría con armas".',
  'Ataque temerario': 'Puedes desechar toda preocupación por la defensa para atacar con ferocidad salvaje. Cuando realices tu primer ataque en tu turno, puedes decidir atacar de manera temeraria. Al hacerlo, tienes ventaja en las tiradas de ataque con armas cuerpo a cuerpo que usen Fuerza durante este turno, pero las tiradas de ataque contra ti tienen ventaja hasta tu siguiente turno.',
  'Sentir el peligro': 'Obtienes ventaja en las tiradas de salvación de Destreza contra efectos que puedas ver, como trampas y conjuros. Para obtener este beneficio, no puedes estar cegado, ensordecido ni incapacitado.',
  'Conocimiento primigenio': 'Ganas competencia en otra habilidad de la lista de habilidades de bárbaro. Además, mientras tu Furia esté activa, puedes usar tu Fuerza en lugar de la característica normal para realizar pruebas de ciertas habilidades (como Atletismo, Intimidación, etc.).',
  'Subclase de bárbaro': 'Eliges un camino de subclase (como Berserker, Tótem o Magia Salvaje) que te otorga rasgos especiales en los niveles 3, 6, 10 y 14.',
  'Mejora de característica': 'Puedes aumentar una puntuación de característica en 2, o dos puntuaciones en 1, o elegir una Dote.',
  'Ataque adicional': 'Puedes atacar dos veces en lugar de una siempre que realices la acción de Atacar en tu turno.',
  'Movimiento rápido': 'Tu velocidad aumenta en 10 pies (3m) mientras no lleves armadura pesada.',
  'Rasgo de subclase': 'Obtienes un beneficio específico de la subclase elegida para tu Bárbaro.',
  'Instinto salvaje': 'Tu instinto es tan agudo que obtienes ventaja en las tiradas de Iniciativa. Si estás sorprendido al principio del combate y no estás incapacitado, puedes actuar normalmente si entras en furia.',
  'Salto instintivo': 'Como parte de la acción adicional que usas para entrar en Furia, puedes moverte hasta la mitad de tu velocidad de movimiento.',
  'Golpe brutal': 'Cuando aciertes un ataque temerario, puedes aplicar efectos adicionales como empujar 15 pies, reducir velocidad o añadir daño adicional (+1d10).',
  'Furia implacable': 'Si caes a 0 HP mientras estás en furia, puedes hacer una salvación de Con CD 10 para quedarte a 1 HP. Cada uso exitoso aumenta la CD en 5 hasta un descanso corto o largo.',
  'Golpe brutal mejorado': 'Tus opciones de Golpe brutal mejoran, infligiendo más daño o aplicando peores efectos sobre los enemigos.',
  'Furia persistente': 'Tu furia es tan intensa que solo termina prematuramente si caes inconsciente o si decides finalizarla.',
  'Poderío indómito': 'Si el resultado de una prueba de Fuerza es menor que tu puntuación de Fuerza, puedes usar tu puntuación de Fuerza en lugar del resultado.',
  'Don épico': 'Obtienes un don épico que incrementa tus puntuaciones de característica de forma extraordinaria y confiere un beneficio legendario.',
  'Campeón primordial': 'Tus puntuaciones de Fuerza y Constitución aumentan en 4 puntos, hasta un máximo de 24.'
};
