import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CharacterService, Character } from '../../data/services/character.service';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

      <!-- MODAL DE SUBIDA DE NIVEL Y PUNTOS DE GOLPE (HP) -->
      <div *ngIf="showLevelUpModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print">
        <div class="bg-[#121215] border border-[#d4af37]/35 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fade-in text-left">
          
          <button (click)="showLevelUpModal = false" class="absolute top-4 right-4 text-neutral-500 hover:text-neutral-200 text-lg focus:outline-none cursor-pointer">✕</button>
          
          <div class="text-center">
            <span class="text-3xl">🛡️</span>
            <h3 class="text-[#d4af37] font-fantasy uppercase tracking-widest text-sm font-bold mt-2">¡NUEVO NIVEL DISPONIBLE!</h3>
            <p class="text-[9.5px] text-neutral-450 mt-1 uppercase">Subiendo al Nivel {{ (character?.level || 0) + 1 }}</p>
          </div>

          <div class="border-t border-neutral-900 pt-3 space-y-4">
            <p class="text-[9.5px] text-neutral-350 text-center leading-relaxed font-sans">
              Elige cómo deseas incrementar tus Puntos de Golpe Máximos para este nivel. Tu Dado de Golpe es un <strong>d{{ getClassHitDie() }}</strong>.
            </p>

            <div class="grid grid-cols-2 gap-3.5 pt-2">
              <!-- Opción Promedio -->
              <button 
                (click)="selectAverageHp()"
                class="bg-neutral-900/60 border border-neutral-850 hover:border-amber-600/60 hover:bg-[#1c1815]/20 p-4 rounded-xl text-center transition cursor-pointer select-none focus:outline-none flex flex-col justify-between"
              >
                <div>
                  <span class="text-[7.5px] text-neutral-500 uppercase block font-bold tracking-wider mb-1">Usar Promedio</span>
                  <span class="text-base font-mono font-bold text-neutral-250 block">
                    +{{ Math.max(1, Math.floor(getClassHitDie() / 2) + 1 + getFinalModifierValue('constitution')) + getLevelUpHpBonus() }} HP
                  </span>
                </div>
                <span class="text-[6.5px] text-neutral-500 uppercase mt-2.5 block">Valor Fijo</span>
              </button>

              <!-- Opción Tirar Dado -->
              <button 
                (click)="rollHpDie()"
                class="bg-neutral-900/60 border border-neutral-850 hover:border-amber-600/60 hover:bg-[#1c1815]/20 p-4 rounded-xl text-center transition cursor-pointer select-none focus:outline-none flex flex-col justify-between"
              >
                <div>
                  <span class="text-[7.5px] text-neutral-500 uppercase block font-bold tracking-wider mb-1">Tirar d{{ getClassHitDie() }}</span>
                  <span class="text-base font-mono font-bold text-amber-500 block">
                    Tirar Dado
                  </span>
                </div>
                <span class="text-[6.5px] text-neutral-500 uppercase mt-2.5 block">Suerte / Azar</span>
              </button>
            </div>

            <!-- Mostrar resultado de tirada -->
            <div *ngIf="rolledHp !== null" class="mt-4 p-3 bg-neutral-950/40 border border-neutral-900 rounded-lg text-center animate-fade-in space-y-2">
              <div class="flex items-center justify-center gap-1.5 border-b border-neutral-900 pb-1.5">
                <span class="text-neutral-500 text-[8px] uppercase">Resultado d{{ getClassHitDie() }}:</span>
                <span class="text-amber-500 font-bold font-mono text-sm">{{ rolledHp }}</span>
              </div>
              <p class="text-[9.5px] text-neutral-350 font-sans">
                HP Obtenido: <strong>{{ rolledHp }}</strong> (dado) + <strong>{{ getFinalModifierValue('constitution') }}</strong> (CON)
                <span *ngIf="getLevelUpHpBonus() > 0"> + <strong>{{ getLevelUpHpBonus() }}</strong> (bonos)</span>
                = <strong class="text-[#d4af37] text-xs font-mono">+{{ Math.max(1, rolledHp + getFinalModifierValue('constitution')) + getLevelUpHpBonus() }} HP</strong>
              </p>
              
              <button 
                (click)="confirmRolledHp()"
                class="w-full bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/20 hover:border-[#d4af37]/50 text-[8px] font-bold py-2 rounded uppercase tracking-wider transition cursor-pointer select-none mt-2"
              >
                Aceptar Resultado
              </button>
            </div>
          </div>
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
            <a 
              [routerLink]="['/character-creator']"
              [queryParams]="{ edit: character.id }"
              class="bg-amber-600/20 hover:bg-amber-600/40 border border-amber-600/40 text-amber-300 hover:text-amber-200 py-1.5 px-3.5 rounded-lg text-[10px] uppercase tracking-widest transition flex items-center gap-2 cursor-pointer font-fantasy"
            >
              <span>⚙️</span> Editar Personaje
            </a>
            <div>
              <h2 class="font-fantasy text-[#d4af37] text-xs uppercase tracking-widest font-extrabold flex items-center gap-2">
                FORJA & LEYENDA
              </h2>
              <p class="text-[8px] text-neutral-455 uppercase tracking-wide">Ficha de Aventurero Oficial</p>
            </div>
          </div>
          
          <!-- Pestañas de la Ficha (Solo pantalla) -->
          <div class="flex bg-neutral-900/60 p-1 border border-neutral-800 rounded-lg shrink-0 gap-1 overflow-x-auto max-w-full">
             <button 
               (click)="activeTab = 1"
               class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none whitespace-nowrap"
               [class.bg-amber-600]="activeTab === 1"
               [class.text-white]="activeTab === 1"
               [class.text-neutral-400]="activeTab !== 1"
             >
               Ficha Principal
             </button>
             <button 
               (click)="activeTab = 2"
               class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none whitespace-nowrap"
               [class.bg-amber-600]="activeTab === 2"
               [class.text-white]="activeTab === 2"
               [class.text-neutral-400]="activeTab !== 2"
             >
               Grimorio y Equipo
             </button>
             <button 
               (click)="activeTab = 3"
               class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none whitespace-nowrap"
               [class.bg-amber-600]="activeTab === 3"
               [class.text-white]="activeTab === 3"
               [class.text-neutral-400]="activeTab !== 3"
             >
               Biografía y Aspecto
             </button>
             <button 
               (click)="activeTab = 4"
               class="px-4 py-1.5 rounded text-[10px] font-fantasy uppercase tracking-wider cursor-pointer transition select-none whitespace-nowrap"
               [class.bg-amber-600]="activeTab === 4"
               [class.text-white]="activeTab === 4"
               [class.text-neutral-400]="activeTab !== 4"
             >
               📖 Enciclopedia / Glosario
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
              
              <!-- Si no es elegible para subclase (nivel < 3) -->
              <div *ngIf="character.level < 3" class="text-xs text-neutral-500 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                Requiere Nvl 3
              </div>

              <!-- Si es elegible para subclase (nivel >= 3) -->
              <div *ngIf="character.level >= 3" class="relative">
                <select 
                  [disabled]="(character.level || 0) > 3 && !!character.subclass"
                  (change)="onSubclassSelected($event)"
                  class="w-full text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 hover:border-neutral-700 focus:border-[#d4af37] focus:outline-none px-3 py-1.5 rounded truncate min-h-[30px] cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-75"
                >
                  <option value="">-- Elige Subclase --</option>
                  <option 
                    *ngFor="let sub of getSubclassesForClass(character.class)" 
                    [value]="sub"
                    [selected]="character.subclass === sub"
                  >
                    {{ sub }}
                  </option>
                </select>
                <!-- Icono de flechita para el select -->
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#d4af37]">
                  <span class="text-[7px]">▼</span>
                </div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider font-fantasy">Origen / Raza</label>
              <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-855 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                {{ character.race }} {{ character.originLineage ? '(' + character.originLineage + ')' : '' }}
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
            
            <!-- Alerta de Subclase Obligatoria para avanzar de nivel -->
            <div *ngIf="subclassChoiceRequired" class="col-span-3 mt-2.5 p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl text-left text-[8.5px] text-red-400 font-sans flex items-start gap-2 animate-fade-in no-print">
              <span class="text-xs leading-none">⚠️</span>
              <div>
                <strong class="block text-red-300 font-bold mb-0.5">¡Subclase Requerida!</strong>
                Debes elegir una subclase en el selector de arriba antes de poder avanzar al Nivel 4.
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
            
            <!-- Tarjetas de Combate, Inspiración y HP -->
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
              
              <!-- Grid de Stats de Batalla (CA, Iniciativa, Velocidad, Inspiración) -->
              <div class="xl:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                <!-- CA Armadura -->
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden flex flex-col justify-between items-center card-print shadow-sm">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">CA Armadura</span>
                  <span class="text-xl font-black font-mono text-[#d4af37] my-1 block">
                    {{ getCalculatedArmorClass() }}
                  </span>
                  <span class="text-[7px] text-neutral-550 font-mono block truncate">
                    {{ isMonk() ? '(10+Des+Sab)' : (isBarbarian() ? '(10+Des+Con)' : '(10+Des)') }}
                  </span>
                </div>

                <!-- Iniciativa -->
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden flex flex-col justify-between items-center card-print shadow-sm">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Iniciativa</span>
                  <span class="text-xl font-black font-mono text-[#d4af37] my-1 block">
                    {{ getFinalModifier('dexterity') }}
                  </span>
                  <span class="text-[7px] text-neutral-550 font-mono block">(Mod Des)</span>
                </div>

                <!-- Velocidad -->
                <div class="bg-[#121215] border border-neutral-850 p-2 rounded-xl text-center relative overflow-hidden flex flex-col justify-between items-center card-print shadow-sm">
                  <span class="text-[7.5px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Velocidad</span>
                  <span class="text-base font-black text-amber-500 my-1 block font-mono">
                    {{ getOriginData(character.race).speed }}
                  </span>
                  <span class="text-[7px] text-neutral-550 font-mono block">Pies</span>
                </div>

                <!-- Inspiración Heroica -->
                <button 
                  type="button"
                  (click)="toggleHeroicInspiration()"
                  [title]="hasHeroicInspiration() ? 'Inspiración Heroica Activa. Haz clic para utilizarla.' : 'Sin Inspiración Heroica. Haz clic para otorgarla.'"
                  class="bg-[#121215] border p-2 rounded-xl text-center relative overflow-hidden flex flex-col justify-between items-center cursor-pointer transition-all duration-300 card-print group hover:scale-[1.02] shadow-sm select-none"
                  [ngClass]="hasHeroicInspiration() ? 'border-amber-500/80 shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-gradient-to-b from-[#1e190e] to-[#121215]' : 'border-neutral-850 hover:border-neutral-750'"
                >
                  <span class="text-[7.5px] uppercase font-bold tracking-wider block font-fantasy" [ngClass]="hasHeroicInspiration() ? 'text-amber-400' : 'text-neutral-500'">
                    Inspiración
                  </span>
                  
                  <div class="my-0.5 flex items-center justify-center relative">
                    <span 
                      class="text-2xl transition-transform duration-300 group-hover:scale-110 select-none"
                      [ngClass]="hasHeroicInspiration() ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse' : 'opacity-30 grayscale'"
                    >
                      🌟
                    </span>
                  </div>

                  <span 
                    class="text-[7px] font-bold font-mono uppercase tracking-wider block px-1.5 py-0.5 rounded"
                    [ngClass]="hasHeroicInspiration() ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm' : 'text-neutral-600 bg-neutral-900/60'"
                  >
                    {{ hasHeroicInspiration() ? 'Disponible' : 'Sin Usar' }}
                  </span>
                </button>

              </div>

              <!-- Panel Interactivo de Control de Salud (HP) -->
              <div class="xl:col-span-6 bg-gradient-to-br from-[#141419] to-[#0c0c0e] border border-amber-600/30 p-3 rounded-xl space-y-2.5 card-print text-left shadow-lg relative overflow-hidden flex flex-col justify-between">
                
                <!-- Encabezado del Panel -->
                <div class="flex justify-between items-center border-b border-neutral-850/80 pb-1.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs select-none">❤️</span>
                    <span class="text-[8.5px] text-[#d4af37] font-bold uppercase tracking-wider font-fantasy">Puntos de Golpe (PG)</span>
                  </div>
                  <span class="text-[8px] text-neutral-400 font-mono">
                    Nivel {{ character.level }} • Máx Cap: <strong class="text-amber-400 font-bold">{{ getMaxHp() }} HP</strong>
                  </span>
                </div>

                <!-- Display de Salud Actual vs Máxima y Barra Progresiva -->
                <div class="space-y-1.5">
                  <div class="flex justify-between items-baseline">
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-2xl font-black font-mono tracking-tight" [ngClass]="getCurrentHp() === 0 ? 'text-red-500 animate-pulse' : (getCurrentHp() === getMaxHp() ? 'text-emerald-400' : 'text-amber-400')">
                        {{ getCurrentHp() }}
                      </span>
                      <span class="text-xs text-neutral-450 font-mono font-bold">/ {{ getMaxHp() }} HP</span>
                    </div>
                    
                    <button 
                      (click)="restFullHeal()"
                      title="Descanso Largo: Restaurar Salud Completa al límite de tu nivel"
                      class="no-print bg-emerald-955/40 hover:bg-emerald-900/50 border border-emerald-600/50 text-emerald-300 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wide transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <span>💊</span> Rest. Total
                    </button>
                  </div>

                  <!-- Barra de Salud Visual con Colores Graduados -->
                  <div class="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5 flex items-center shadow-inner">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      [ngClass]="getHpBarColorClass()"
                      [style.width.%]="getHpBarPercentage()"
                    ></div>
                  </div>
                </div>

                <!-- Controles Simplificados de HP (+ / - con Cantidad) -->
                <div class="pt-2 border-t border-neutral-850/80 flex items-center justify-between gap-2 no-print">
                  <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-wider font-fantasy">Ajustar HP:</span>
                  
                  <div class="flex items-center gap-1.5 bg-[#0a0a0c] border border-neutral-800 p-1 rounded-lg">
                    <!-- Botón Restar / Daño (-) -->
                    <button 
                      (click)="applyHpDamage()" 
                      [title]="'Restar ' + (hpAdjustAmount || 1) + ' HP (Daño)'"
                      class="bg-red-955/50 hover:bg-red-900/70 border border-red-700/60 hover:border-red-500 text-red-300 font-mono font-black text-base w-7 h-7 rounded flex items-center justify-center cursor-pointer transition shadow-md hover:shadow-red-900/50 active:scale-95 shrink-0 select-none"
                    >
                      -
                    </button>
                    
                    <!-- Campo Numérico de Cantidad -->
                    <input 
                      type="number"
                      [(ngModel)]="hpAdjustAmount"
                      min="1"
                      placeholder="1"
                      class="w-14 bg-[#141418] border border-neutral-750 focus:border-[#d4af37] focus:outline-none text-center font-mono font-bold text-xs text-neutral-200 py-1 rounded appearance-none"
                    />

                    <!-- Botón Sumar / Curar (+) -->
                    <button 
                      (click)="applyHpHeal()" 
                      [title]="'Sumar ' + (hpAdjustAmount || 1) + ' HP (Curación)'"
                      class="bg-emerald-955/50 hover:bg-emerald-900/70 border border-emerald-700/60 hover:border-emerald-500 text-emerald-300 font-mono font-black text-base w-7 h-7 rounded flex items-center justify-center cursor-pointer transition shadow-md hover:shadow-emerald-900/50 active:scale-95 shrink-0 select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <!-- Info de Dados de Golpe y Constitución -->
                <div class="pt-1.5 border-t border-neutral-850/80 flex justify-between items-center text-[7.5px] text-neutral-450 font-mono">
                  <span>Dados Golpe: <strong class="text-amber-400 font-bold">{{ character.level }}d{{ getClassData(character.class).hitDie }}</strong></span>
                  <span>Mod Con: <strong class="text-neutral-300 font-bold">{{ getFinalModifier('constitution') }}</strong></span>
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
                  
                  <!-- Contenedor general para clases que tienen rasgos (Bárbaro, Hechicero, Guerrero, Monje, Paladín y Pícaro) -->
                  <div *ngIf="isBarbarian() || isSorcerer() || isFighter() || isMonk() || isPaladin() || isRogue()" class="space-y-2">
                    
                    <!-- Estadísticas Rápidas: Bárbaro -->
                    <div *ngIf="isBarbarian()" class="bg-[#121215] border border-neutral-855 p-2 rounded text-[8.5px] grid grid-cols-3 gap-1.5 text-center font-mono">
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

                    <!-- Estadísticas Rápidas: Hechicero -->
                    <div *ngIf="isSorcerer()" class="bg-[#121215] border border-neutral-855 p-2 rounded text-[8.5px] grid grid-cols-2 gap-1.5 text-center font-mono">
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Puntos Hechicería</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getSorcererPoints(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Metamagias</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ character.sorcererMetamagic?.length || 0 }}</span>
                      </div>
                    </div>

                    <!-- Estadísticas Rápidas: Monje (D&D 2024) -->
                    <div *ngIf="isMonk()" class="bg-[#121215] border border-neutral-855 p-2 rounded text-[8.5px] grid grid-cols-4 gap-1 gap-y-1.5 text-center font-mono">
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Concentración</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getMonkFocusPoints(character.level) - monkFocusSpent }} / {{ getMonkFocusPoints(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Artes M.</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getMonkMartialArtsDie(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Mov. Extra</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[8.5px]">{{ getMonkUnarmoredMovement(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">CD Salva</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getMonkFocusSaveDC() }}</span>
                      </div>
                    </div>

                    <!-- Estadísticas Rápidas: Paladín (D&D 2024) -->
                    <div *ngIf="isPaladin()" class="bg-[#121215] border border-neutral-855 p-2 rounded text-[8.5px] grid grid-cols-4 gap-1 gap-y-1.5 text-center font-mono">
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Reserva Cura</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getPaladinLayOnHandsMax(character.level) - paladinLayOnHandsSpent }} / {{ getPaladinLayOnHandsMax(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Canalizar D.</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getPaladinChannelDivinityMax(character.level) - paladinChannelDivinitySpent }} / {{ getPaladinChannelDivinityMax(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Bono Aura</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[9px]">{{ getPaladinAuraSaveBonus() }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Conj. Prep.</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getPaladinPreparedSpellsCount(character.level) }}</span>
                      </div>
                    </div>

                    <!-- Estadísticas Rápidas: Pícaro (D&D 2024) -->
                    <div *ngIf="isRogue()" class="bg-[#121215] border border-neutral-855 p-2 rounded text-[8.5px] grid grid-cols-4 gap-1 gap-y-1.5 text-center font-mono">
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Atq Furtivo</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getRogueSneakAttackDice(character.level) }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">CD Golp. Ast.</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[10px]">{{ getRogueCunningStrikeDC() }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Acc. Astuta</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[8.5px]">Nvl 2</span>
                      </div>
                      <div>
                        <span class="text-neutral-500 block text-[6.5px] uppercase">Talentos F.</span>
                        <span class="text-[#d4af37] font-bold font-serif text-[8.5px]">{{ character.level >= 7 ? 'Mín. 10' : 'Nvl 7' }}</span>
                      </div>
                    </div>

                    <!-- Panel Interactivo de Concentración y Acciones de Monje -->
                    <div *ngIf="isMonk()" class="space-y-2 mt-2 p-2.5 border border-[#d4af37]/20 rounded-xl bg-neutral-950/20 text-left text-[8.5px] no-print">
                      <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🥊 Reserva de Concentración</span>
                        <div class="flex items-center gap-1 font-mono">
                          <button (click)="spendMonkFocus(1)" class="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-red-400 font-bold rounded cursor-pointer transition text-[7.5px]">-1 Pt</button>
                          <button (click)="restMonkFocus()" class="px-2 py-0.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] font-bold rounded cursor-pointer transition text-[7.5px]">Descansar</button>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-1.5 pt-1">
                        <button (click)="rollUncannyMetabolism()" class="bg-amber-900/30 hover:bg-amber-800/40 border border-amber-600/30 text-amber-300 p-1.5 rounded text-center transition cursor-pointer text-[7.5px] font-bold">
                          ⚡ Metabolismo Asombroso
                        </button>
                        <button (click)="rollDeflectAttacks()" class="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 p-1.5 rounded text-center transition cursor-pointer text-[7.5px] font-bold">
                          🛡️ Desviar Ataques
                        </button>
                      </div>

                      <div *ngIf="uncannyMetabolismResult" class="p-2 bg-[#121215] border border-amber-600/30 rounded space-y-1 animate-fade-in">
                        <span class="text-amber-400 font-bold block">¡Metabolismo Asombroso!</span>
                        <p class="text-neutral-300">Recuperas <strong class="text-[#d4af37]">+{{ uncannyMetabolismResult.hpHealed }} HP</strong> y restauras todos tus Puntos de Concentración.</p>
                      </div>

                      <div *ngIf="deflectAttacksResult" class="p-2 bg-[#121215] border border-neutral-700 rounded space-y-1 animate-fade-in">
                        <span class="text-neutral-200 font-bold block">Desviar Ataques (Reacción):</span>
                        <p class="text-neutral-350">Reducción de daño: <strong class="text-amber-400">{{ deflectAttacksResult.reduction }} HP</strong>.</p>
                        <p class="text-neutral-350" *ngIf="character.level >= 3">Si reduces daño a 0 (gastando 1 Pt): Rediriges <strong class="text-red-400">{{ deflectAttacksResult.redirectDamage }} daño</strong> (Salvación DES vs CD {{ getMonkFocusSaveDC() }}).</p>
                      </div>
                    </div>

                    <!-- Panel Interactivo de Imponer las Manos y Canalizar Divinidad de Paladín -->
                    <div *ngIf="isPaladin()" class="space-y-2 mt-2 p-2.5 border border-[#d4af37]/20 rounded-xl bg-neutral-950/20 text-left text-[8.5px] no-print">
                      <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">✨ Imponer las Manos</span>
                        <div class="flex items-center gap-1 font-mono">
                          <button (click)="spendLayOnHands(5)" class="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded cursor-pointer transition text-[7.5px]">-5 HP</button>
                          <button (click)="restLayOnHands()" class="px-2 py-0.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] font-bold rounded cursor-pointer transition text-[7.5px]">Restablecer</button>
                        </div>
                      </div>

                      <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 pt-1">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">☀️ Canalizar Divinidad</span>
                        <div class="flex items-center gap-1 font-mono">
                          <button (click)="spendChannelDivinity(1)" [disabled]="character.level < 3" class="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded cursor-pointer transition text-[7.5px] disabled:opacity-50">-1 Uso</button>
                          <button (click)="restChannelDivinity()" [disabled]="character.level < 3" class="px-2 py-0.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] font-bold rounded cursor-pointer transition text-[7.5px] disabled:opacity-50">Restablecer</button>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-1.5 pt-1 font-mono">
                        <button (click)="toggleSmiteFreeUse()" class="p-1.5 rounded text-center transition cursor-pointer text-[7.5px] font-bold border"
                          [class.bg-emerald-950/40]="!paladinSmiteFreeUsed" [class.border-emerald-600/40]="!paladinSmiteFreeUsed" [class.text-emerald-300]="!paladinSmiteFreeUsed"
                          [class.bg-neutral-900]="paladinSmiteFreeUsed" [class.border-neutral-800]="paladinSmiteFreeUsed" [class.text-neutral-500]="paladinSmiteFreeUsed">
                          ⚔️ Castigo Gratis: {{ paladinSmiteFreeUsed ? 'Usado' : 'Disponible' }}
                        </button>

                        <button (click)="toggleSteedFreeUse()" [disabled]="character.level < 5" class="p-1.5 rounded text-center transition cursor-pointer text-[7.5px] font-bold border disabled:opacity-50"
                          [class.bg-amber-950/40]="!paladinSteedFreeUsed" [class.border-amber-600/40]="!paladinSteedFreeUsed" [class.text-amber-300]="!paladinSteedFreeUsed"
                          [class.bg-neutral-900]="paladinSteedFreeUsed" [class.border-neutral-800]="paladinSteedFreeUsed" [class.text-neutral-500]="paladinSteedFreeUsed">
                          🐴 Corcel Fiel Gratis: {{ paladinSteedFreeUsed ? 'Usado' : 'Disponible' }}
                        </button>
                      </div>
                    </div>

                    <!-- Panel Interactivo de Maniobras de Pícaro (D&D 2024) -->
                    <div *ngIf="isRogue()" class="space-y-2 mt-2 p-2.5 border border-[#d4af37]/20 rounded-xl bg-neutral-950/20 text-left text-[8.5px] no-print">
                      <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🗡️ Puntería Certera (Nvl 3)</span>
                        <button (click)="toggleSteadyAim()" [disabled]="character.level < 3"
                          class="px-2 py-0.5 rounded font-mono text-[7.5px] font-bold transition cursor-pointer border disabled:opacity-50"
                          [class.bg-amber-955/40]="rogueSteadyAimActive" [class.border-amber-600/40]="rogueSteadyAimActive" [class.text-amber-300]="rogueSteadyAimActive"
                          [class.bg-neutral-900]="!rogueSteadyAimActive" [class.border-neutral-800]="!rogueSteadyAimActive" [class.text-neutral-450]="!rogueSteadyAimActive">
                          {{ rogueSteadyAimActive ? '🎯 Ventaja Activa' : 'Activar Puntería' }}
                        </button>
                      </div>

                      <div *ngIf="character.level >= 5" class="space-y-1 pt-1">
                        <span class="text-[7.5px] text-neutral-400 font-bold block uppercase font-mono">Efectos de Golpe Astuto (Restan dados de Furtivo):</span>
                        <div class="grid grid-cols-2 gap-1 text-[7px] text-neutral-300 font-mono">
                          <span class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">🏃 Retirada (-1d6)</span>
                          <span class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">🦶 Tropiezo (-1d6, CD {{ getRogueCunningStrikeDC() }})</span>
                          <span class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">🧪 Veneno (-1d6, CD {{ getRogueCunningStrikeDC() }})</span>
                          <span *ngIf="character.level >= 14" class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">💫 Confundir (-2d6)</span>
                          <span *ngIf="character.level >= 14" class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">🙈 Ofuscar (-3d6)</span>
                          <span *ngIf="character.level >= 14" class="bg-neutral-900/60 border border-neutral-850 p-1 rounded">💤 Noquear (-6d6)</span>
                        </div>
                      </div>

                      <div *ngIf="character.level >= 20" class="pt-1 border-t border-neutral-900 flex justify-between items-center">
                        <span class="text-[7.5px] text-amber-400 font-bold uppercase font-mono">🎲 Golpe de Suerte (Nvl 20)</span>
                        <button (click)="toggleStrokeOfLuck()"
                          class="px-2 py-0.5 rounded font-mono text-[7.5px] font-bold transition cursor-pointer border"
                          [class.bg-emerald-955/40]="!rogueStrokeOfLuckUsed" [class.border-emerald-600/40]="!rogueStrokeOfLuckUsed" [class.text-emerald-300]="!rogueStrokeOfLuckUsed"
                          [class.bg-neutral-900]="rogueStrokeOfLuckUsed" [class.border-neutral-800]="rogueStrokeOfLuckUsed" [class.text-neutral-500]="rogueStrokeOfLuckUsed">
                          {{ rogueStrokeOfLuckUsed ? 'Usado' : 'd20 -> 20' }}
                        </button>
                      </div>
                    </div>

                    <!-- Listado de Rasgos Activos con Enlace a Enciclopedia -->
                    <div class="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar no-print">
                      <div 
                        *ngFor="let feature of getActiveFeatures()" 
                        (click)="viewFeatureInGlosary(feature)"
                        class="px-2.5 py-1.5 bg-[#121215]/50 border border-neutral-850 hover:border-amber-600/40 rounded flex justify-between items-center cursor-pointer hover:bg-[#1a1616]/40 transition group"
                      >
                        <span class="font-fantasy text-neutral-200 group-hover:text-amber-500 uppercase text-[8px] font-bold tracking-wide">{{ feature }}</span>
                        <span class="text-[7px] text-[#d4af37] flex items-center gap-1 group-hover:text-amber-500">📖 Leer Rasgo</span>
                      </div>
                    </div>

                    <!-- Metamagias elegidas (Solo Hechicero) -->
                    <div *ngIf="isSorcerer() && character.sorcererMetamagic && character.sorcererMetamagic.length > 0" class="space-y-1.5 mt-2">
                      <span class="text-[7.5px] text-neutral-450 uppercase font-bold tracking-widest block border-t border-neutral-900 pt-1.5">Metamagias Seleccionadas</span>
                      <div class="grid grid-cols-1 gap-1">
                        <div *ngFor="let meta of character.sorcererMetamagic" class="border border-neutral-850 rounded bg-[#121215]/20 p-2 text-left">
                          <span class="font-fantasy text-[#d4af37] uppercase text-[8px] font-bold block">{{ meta }}</span>
                          <span class="text-neutral-400 text-[7.5px] leading-normal font-sans block">{{ getMetamagicDescription(meta) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Simulador de Sobrecarga de Magia Salvaje (Solo Hechicero) -->
                    <div *ngIf="isSorcerer() && character.subclass && character.subclass.toLowerCase().includes('salvaje')" class="space-y-2 mt-3 p-3 border border-[#d4af37]/20 rounded-xl bg-neutral-950/20 text-left">
                      <div class="flex justify-between items-center">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🎲 Sobrecarga de Magia Salvaje (1d100)</span>
                        <button (click)="rollWildMagic()" class="bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/20 hover:border-[#d4af37]/50 text-[7.5px] font-bold px-2 py-1 rounded transition select-none cursor-pointer">
                          TIRAR d100
                        </button>
                      </div>
                      <div *ngIf="wildMagicRoll !== null" class="mt-2 p-2 bg-[#121215]/80 border border-neutral-850 rounded text-[9px] animate-fade-in space-y-1">
                        <div class="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-1">
                          <span class="text-neutral-500 font-mono text-[7.5px] uppercase">Resultado:</span>
                          <span class="text-[#d4af37] font-bold font-mono text-[10px]">{{ wildMagicRoll }}</span>
                        </div>
                        <p class="text-neutral-350 leading-relaxed font-sans text-[8.5px]">
                          {{ wildMagicEffect }}
                        </p>
                      </div>
                    </div>

                    <!-- Simulador de Manifestaciones del Orden (Solo Hechicero) -->
                    <div *ngIf="isSorcerer() && character.subclass && character.subclass.toLowerCase().includes('mecánica')" class="space-y-2 mt-3 p-3 border border-[#d4af37]/20 rounded-xl bg-neutral-950/20 text-left">
                      <div class="flex justify-between items-center">
                        <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">⚙️ Manifestación del Orden (1d6)</span>
                        <button (click)="rollOrderManifestation()" class="bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/20 hover:border-[#d4af37]/50 text-[7.5px] font-bold px-2 py-1 rounded transition select-none cursor-pointer">
                          TIRAR d6
                        </button>
                      </div>
                      <div *ngIf="orderRoll !== null" class="mt-2 p-2 bg-[#121215]/80 border border-neutral-850 rounded text-[9px] animate-fade-in space-y-1">
                        <div class="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-1">
                          <span class="text-neutral-500 font-mono text-[7.5px] uppercase">Resultado:</span>
                          <span class="text-[#d4af37] font-bold font-mono text-[10px]">{{ orderRoll }}</span>
                        </div>
                        <p class="text-neutral-350 leading-relaxed font-sans text-[8.5px]">
                          {{ orderEffect }}
                        </p>
                      </div>
                    </div>

                    <!-- Vista de Impresión -->
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
                  <p *ngIf="!isBarbarian() && !isSorcerer() && !isFighter() && !isMonk() && !isPaladin() && !isRogue()" class="text-[10px] text-neutral-400 leading-normal font-light italic font-fantasy">
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

              <!-- Ranuras de Conjuro Dinámicas e Interactivas -->
              <div *ngIf="getSpellSlotsList().length > 0" class="bg-neutral-900/45 border border-neutral-855 p-3.5 rounded-xl space-y-2.5 card-print text-left">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Ranuras de Conjuro</span>
                  
                  <button 
                    (click)="resetAllSpellSlots()"
                    class="text-[6.5px] text-neutral-450 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 px-2 py-0.5 rounded transition cursor-pointer select-none no-print uppercase font-mono"
                  >
                    Restablecer
                  </button>
                </div>
                
                <div class="space-y-2">
                  <div *ngFor="let slotGroup of getSpellSlotsList()" class="flex justify-between items-center py-1 border-b border-neutral-900/40 last:border-0">
                    <span class="text-[9.5px] font-fantasy text-neutral-350 uppercase tracking-wide font-bold">Nivel {{ slotGroup.level }}</span>
                    
                    <div class="flex gap-1.5">
                      <!-- Diamantes interactivos en pantalla -->
                      <button 
                        *ngFor="let i of getRange(slotGroup.max)"
                        (click)="toggleSpellSlot(slotGroup.level, i)"
                        class="w-4 h-4 rounded border transition duration-150 flex items-center justify-center text-[9px] select-none cursor-pointer focus:outline-none no-print font-mono"
                        [class.border-amber-600/70]="i >= getUsedSlotsForLevel(slotGroup.level)"
                        [class.text-amber-500]="i >= getUsedSlotsForLevel(slotGroup.level)"
                        [class.bg-amber-955/20]="i < getUsedSlotsForLevel(slotGroup.level)"
                        [class.border-[#d4af37]/80]="i < getUsedSlotsForLevel(slotGroup.level)"
                        [class.text-[#d4af37]]="i < getUsedSlotsForLevel(slotGroup.level)"
                        [class.font-bold]="i < getUsedSlotsForLevel(slotGroup.level)"
                      >
                        {{ i < getUsedSlotsForLevel(slotGroup.level) ? '◆' : '◇' }}
                      </button>
                      
                      <!-- Diamantes estáticos en impresión -->
                      <div class="hidden print:flex gap-1">
                        <span 
                          *ngFor="let i of getRange(slotGroup.max)"
                          class="w-3.5 h-3.5 border border-amber-600/60 rounded flex items-center justify-center text-[7.5px] text-amber-500 font-mono"
                        >
                          ◇
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Conjuros Preparados -->
              <div class="bg-neutral-900/40 border border-[#d4af37]/15 p-3.5 rounded-xl space-y-3 card-print">
                <div class="border-b border-neutral-900 pb-1.5 flex justify-between items-center">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">Conjuros Preparados</span>
                  
                  <button 
                    *ngIf="!editSpellsMode"
                    (click)="startEditingSpells()"
                    class="text-[7px] text-amber-500 hover:text-amber-400 bg-amber-955/20 border border-amber-900/50 hover:border-amber-500 px-2 py-0.5 rounded font-bold uppercase transition cursor-pointer select-none no-print"
                  >
                    ✏️ Gestionar
                  </button>
                </div>

                <!-- Modo Vista Normal -->
                <div *ngIf="!editSpellsMode">
                  <div *ngIf="character.preparedSpells && character.preparedSpells.length > 0; else noSpells" class="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar text-left text-[9.5px]">
                    <div class="grid grid-cols-1 gap-1">
                      <div 
                        *ngFor="let spell of character.preparedSpells" 
                        (click)="viewSpellInGlosary(spell)"
                        class="px-2.5 py-1.5 bg-[#121215]/60 border border-neutral-855 hover:border-amber-600/40 rounded flex justify-between items-center cursor-pointer hover:bg-[#1a1616]/40 transition group"
                      >
                        <span class="font-fantasy text-neutral-200 group-hover:text-amber-500 uppercase text-[8px] font-bold tracking-wide">{{ spell }}</span>
                        <span class="text-[7px] text-[#d4af37] flex items-center gap-1 group-hover:text-amber-500">📖 Leer Hechizo</span>
                      </div>
                    </div>
                  </div>
                  <ng-template #noSpells>
                    <div class="text-center py-4 text-neutral-500 italic text-[9.5px]">
                      No tienes conjuros preparados. Pulsa "Gestionar" para agregar.
                    </div>
                  </ng-template>
                </div>

                <!-- Modo Edición Directa -->
                <div *ngIf="editSpellsMode" class="space-y-3 text-left">
                  <!-- Info del Límite de Hechizos -->
                  <div class="flex justify-between items-center text-[7.5px] uppercase text-neutral-400 font-mono tracking-wider">
                    <span>Límite Estimado: {{ getCharacterSpellLimit() }} conjuros</span>
                    <span class="font-bold text-amber-500">{{ tempPreparedSpells.length }} preparados</span>
                  </div>

                  <!-- Lista Temporal de Conjuros -->
                  <div class="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar border border-neutral-900 p-1.5 rounded bg-neutral-950/20">
                    <div 
                      *ngFor="let spell of tempPreparedSpells"
                      class="px-2 py-1 bg-[#121215]/80 border border-neutral-850 rounded flex justify-between items-center text-[8px]"
                    >
                      <span class="font-fantasy text-neutral-300 uppercase font-bold">{{ spell }}</span>
                      <button 
                        (click)="removeSpellFromTemp(spell)"
                        class="text-[9px] text-red-500 hover:text-red-400 font-bold px-1.5 focus:outline-none transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div *ngIf="tempPreparedSpells.length === 0" class="text-center py-4 text-neutral-500 italic text-[8.5px]">
                      Ningún conjuro seleccionado.
                    </div>
                  </div>

                  <!-- Controles para agregar hechizos -->
                  <div class="space-y-2 border-t border-neutral-900 pt-2.5 no-print">
                    <span class="text-[7.5px] uppercase font-bold text-neutral-400 tracking-wider">Catálogo de Conjuros por Nivel:</span>
                    
                    <div class="flex flex-col gap-2">
                      <!-- Buscador y nivel activo -->
                      <div class="space-y-1.5">
                        <input 
                          type="text" 
                          placeholder="Buscar en este nivel..." 
                          (input)="spellSearchQuery = $any($event.target).value"
                          class="bg-neutral-950/80 border border-neutral-800 text-[8px] text-neutral-300 rounded px-2 py-1 w-full focus:outline-none focus:border-amber-600/50"
                        />
                        
                        <!-- Pestañas de niveles -->
                        <div class="flex flex-wrap gap-1">
                          <button 
                            *ngFor="let lvl of getAvailableSpellLevelTabs()"
                            (click)="activeSpellFilterLevel = lvl"
                            type="button"
                            [class.bg-amber-600]="activeSpellFilterLevel === lvl"
                            [class.text-white]="activeSpellFilterLevel === lvl"
                            [class.border-amber-500/50]="activeSpellFilterLevel === lvl"
                            class="text-[6.5px] font-bold uppercase px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:text-amber-500 hover:border-amber-500/30 transition cursor-pointer select-none"
                          >
                            {{ lvl }}
                          </button>
                        </div>
                      </div>

                      <!-- Lista scrollable de hechizos del nivel seleccionado -->
                      <div class="max-h-[140px] overflow-y-auto custom-scrollbar border border-neutral-900 rounded bg-[#101012]/40 divide-y divide-neutral-950 p-1">
                        <div 
                          *ngFor="let spellName of getFilteredSpellsForCurrentLevel()" 
                          class="flex items-center justify-between py-1 px-1.5 hover:bg-[#1a1616]/30 transition group rounded"
                        >
                          <span class="text-[7.5px] text-neutral-300 font-medium tracking-wide truncate max-w-[160px] group-hover:text-amber-500" [title]="spellName">
                            {{ spellName }}
                          </span>
                          
                          <button 
                            (click)="toggleSpellInTemp(spellName)"
                            type="button"
                            [class.bg-emerald-950/20]="isSpellPreparedInTemp(spellName)"
                            [class.text-emerald-500]="isSpellPreparedInTemp(spellName)"
                            [class.border-emerald-600/30]="isSpellPreparedInTemp(spellName)"
                            [class.bg-amber-950/20]="!isSpellPreparedInTemp(spellName)"
                            [class.text-amber-500]="!isSpellPreparedInTemp(spellName)"
                            [class.border-amber-900/30]="!isSpellPreparedInTemp(spellName)"
                            class="text-[6.5px] font-bold uppercase px-1.5 py-0.5 rounded border transition cursor-pointer select-none hover:brightness-125 font-mono"
                          >
                            {{ isSpellPreparedInTemp(spellName) ? '✓' : '+' }}
                          </button>
                        </div>
                        
                        <div *ngIf="getFilteredSpellsForCurrentLevel().length === 0" class="text-center py-4 text-neutral-500 italic text-[7.5px]">
                          Sin resultados.
                        </div>
                      </div>

                      <!-- Campo manual alternativo -->
                      <div class="space-y-1 pt-1 border-t border-neutral-950">
                        <span class="text-[6.5px] uppercase font-bold text-neutral-500 tracking-wider">¿No está en el glosario? Escríbelo:</span>
                        <div class="flex gap-1.5">
                          <input 
                            #manualInput
                            type="text" 
                            placeholder="Escribe otro hechizo..." 
                            class="bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-300 rounded px-2 py-1 w-full focus:outline-none focus:border-amber-600/40"
                          />
                          <button 
                            (click)="addSpellToTemp(manualInput.value); manualInput.value = '';"
                            type="button"
                            class="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[7.5px] px-2.5 py-1 rounded transition cursor-pointer shrink-0"
                          >
                            + Añadir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Botones de Acción final -->
                  <div class="flex gap-2 border-t border-neutral-900 pt-2 justify-end no-print">
                    <button 
                      (click)="editSpellsMode = false"
                      class="px-2.5 py-1 text-[8px] font-bold text-neutral-450 hover:text-neutral-250 uppercase transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      (click)="saveSpellsChanges()"
                      class="px-3.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[8px] rounded uppercase transition cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
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

                <div *ngIf="character.magicInitiateSpell || (character.magicInitiateCantrips && character.magicInitiateCantrips.length > 0)" class="mt-2.5 pt-2 border-t border-neutral-900 text-[10px] space-y-1 text-left bg-amber-955/15 p-2 rounded border border-amber-600/20">
                  <div class="text-amber-400 font-bold font-serif text-[9px] uppercase tracking-wider">✨ Iniciado en la Magia ({{ character.magicInitiateClass || 'Mago' }})</div>
                  <div class="text-neutral-300 text-[9px]">
                    <strong class="text-amber-300">Aptitud:</strong> {{ character.magicInitiateAbility || 'No especificada' }}
                  </div>
                  <div *ngIf="character.magicInitiateCantrips && character.magicInitiateCantrips.length > 0" class="text-neutral-300 text-[9px]">
                    <strong class="text-amber-300">Trucos:</strong> {{ character.magicInitiateCantrips.join(', ') }}
                  </div>
                  <div *ngIf="character.magicInitiateSpell" class="text-neutral-300 text-[9px]">
                    <strong class="text-amber-300">Conjuro Nivel 1 (1/Descanso largo gratis):</strong> {{ character.magicInitiateSpell }}
                  </div>
                </div>
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

        <!-- PESTAÑA 4: ENCICLOPEDIA / GLOSARIO (Sólo pantalla) -->
        <div *ngIf="activeTab === 4" class="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in no-print">
          
          <!-- LADO IZQUIERDO: RASGOS DE CLASE Y SUBCLASE -->
          <div class="md:col-span-6 space-y-4">
            <div class="bg-[#0e0e11]/90 border border-[#d4af37]/20 rounded-2xl p-5 space-y-4 shadow-xl">
              <div class="border-b border-neutral-900 pb-2 flex items-center justify-between">
                <h3 class="font-fantasy text-[#d4af37] text-xs uppercase tracking-widest font-extrabold flex items-center gap-2">
                  📖 Rasgos de Clase y Subclase
                </h3>
                <span class="text-[7.5px] text-neutral-500 uppercase font-mono">Total Activos: {{ getActiveFeatures().length }}</span>
              </div>

              <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1.5">
                <div 
                  *ngFor="let feature of getActiveFeatures()"
                  [id]="'glosary-' + feature.replace(' ', '-')"
                  class="p-3 border border-neutral-850 rounded-xl bg-neutral-950/20 text-left transition duration-300"
                  [class.border-[#d4af37]/50]="selectedGlosaryTerm === feature"
                  [class.bg-[#d4af37]/5]="selectedGlosaryTerm === feature"
                >
                  <span class="font-fantasy text-[#d4af37] uppercase text-[9px] font-bold block mb-1 tracking-wider">
                    {{ feature }}
                  </span>
                  <p class="text-neutral-350 text-[9px] leading-relaxed font-sans whitespace-pre-line">
                    {{ getFeatureDescription(feature) }}
                  </p>
                </div>
                
                <div *ngIf="getActiveFeatures().length === 0" class="text-center py-8 text-neutral-500 italic text-[9.5px]">
                  No posees ningún rasgo activo a este nivel.
                </div>
              </div>
            </div>
          </div>

          <!-- LADO DERECHO: CONJUROS PREPARADOS -->
          <div class="md:col-span-6 space-y-4">
            <div class="bg-[#0e0e11]/90 border border-[#d4af37]/20 rounded-2xl p-5 space-y-4 shadow-xl">
              <div class="border-b border-neutral-900 pb-2 flex items-center justify-between">
                <h3 class="font-fantasy text-[#d4af37] text-xs uppercase tracking-widest font-extrabold flex items-center gap-2">
                  ✨ Grimorio y Descripciones de Hechizos
                </h3>
                <span class="text-[7.5px] text-neutral-500 uppercase font-mono">Preparados: {{ character.preparedSpells?.length || 0 }}</span>
              </div>

              <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1.5">
                <div 
                  *ngFor="let spell of character.preparedSpells || []"
                  [id]="'glosary-' + spell.replace(' ', '-')"
                  class="p-3 border border-neutral-850 rounded-xl bg-neutral-950/20 text-left transition duration-300"
                  [class.border-[#d4af37]/50]="selectedGlosaryTerm === spell"
                  [class.bg-[#d4af37]/5]="selectedGlosaryTerm === spell"
                >
                  <span class="font-fantasy text-[#d4af37] uppercase text-[9px] font-bold block mb-1 tracking-wider">
                    {{ spell }}
                  </span>
                  <p class="text-neutral-350 text-[9px] leading-relaxed font-sans whitespace-pre-line">
                    {{ getSpellDescription(spell) }}
                  </p>
                </div>
                
                <div *ngIf="!character.preparedSpells || character.preparedSpells.length === 0" class="text-center py-8 text-neutral-500 italic text-[9.5px]">
                  No posees ningún conjuro preparado en tu grimorio.
                </div>
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
  subclassChoiceRequired = false;
  selectedGlosaryTerm: string | null = null;
  editSpellsMode = false;
  tempPreparedSpells: string[] = [];
  activeSpellFilterLevel = 'Trucos';
  spellSearchQuery = '';
  
  // Control interactivo de ranuras de conjuro usadas
  usedSpellSlots: { [key: number]: number } = {};

  getSpellSlotsList(): { level: number, max: number }[] {
    if (!this.character) return [];
    const lvl = this.character.level || 1;
    const className = this.character.class.toLowerCase();
    
    const isFullCaster = className.includes('hechicero') || className.includes('bardo') || 
                          className.includes('clérigo') || className.includes('clerigo') || 
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

  getSpellsByLevel(): { [key: string]: string[] } {
    const categories: { [key: string]: string[] } = {
      'Trucos': [],
      'Nivel 1': [],
      'Nivel 2': [],
      'Nivel 3': [],
      'Nivel 4': [],
      'Nivel 5': []
    };

    const spellLevels: { [key: string]: string } = {
      // ── Trucos ──────────────────────────────────────────────────────────
      'Salpicadura ácida': 'Trucos', 'Guardia de cuchillas': 'Trucos', 'Toque helado': 'Trucos',
      'Luces danzantes': 'Trucos', 'Descarga de fuego': 'Trucos', 'Amigos': 'Trucos', 'Luz': 'Trucos',
      'Mano de mago': 'Trucos', 'Ilusión menor': 'Trucos', 'Mensaje': 'Trucos', 'Salva de veneno': 'Trucos',
      'Elementalismo': 'Trucos', 'Fragmento mental': 'Trucos', 'Impacto certero': 'Trucos',
      'Reparar': 'Trucos', 'Tronar': 'Trucos', 'Prestidigitación': 'Trucos', 'Rayo de escarcha': 'Trucos',
      'Apretón electrizante': 'Trucos',
      // Trucos de mago
      'Agarre electrizante': 'Trucos', 'Amistad': 'Trucos', 'Tañido para los muertos': 'Trucos',
      'Rociado venenoso': 'Trucos',

      // ── Nivel 1 ─────────────────────────────────────────────────────────
      'Armadura de mago': 'Nivel 1', 'Dormir': 'Nivel 1', 'Falso vida': 'Nivel 1', 'Imagen silenciosa': 'Nivel 1',
      'Ola atronadora': 'Nivel 1', 'Rayo de hechicería': 'Nivel 1', 'Rayo nauseabundo': 'Nivel 1',
      'Rociada de color': 'Nivel 1', 'Salto': 'Nivel 1', 'Manos ardientes': 'Nivel 1', 'Encantarse': 'Nivel 1',
      'Orbe cromático': 'Nivel 1', 'Disparos de color': 'Nivel 1', 'Comprender idiomas': 'Nivel 1',
      'Detectar magia': 'Nivel 1', 'Disfrazarse': 'Nivel 1', 'Retirada expeditiva': 'Nivel 1',
      'Caída de pluma': 'Nivel 1', 'Nube de oscurecimiento': 'Nivel 1', 'Grasa': 'Nivel 1',
      'Cuchillo de hielo': 'Nivel 1', 'Proyectil mágico': 'Nivel 1', 'Escudo': 'Nivel 1',
      'Onda de choque': 'Nivel 1', 'Rayo de enfermedad': 'Nivel 1', 'Caída silenciosa': 'Nivel 1',
      'Alarma': 'Nivel 1', 'Protección contra el bien y el mal': 'Nivel 1',
      // Nivel 1 de mago (exclusivos)
      'Encontrar familiar': 'Nivel 1', 'Entender idiomas': 'Nivel 1', 'Identificar': 'Nivel 1',

      // ── Nivel 2 ─────────────────────────────────────────────────────────
      'Abrir': 'Nivel 2', 'Clavo mental': 'Nivel 2', 'Contorno borroso': 'Nivel 2', 'Esfera de flames': 'Nivel 2',
      'Fuerza fantasmal': 'Nivel 2', 'Hacer añicos': 'Nivel 2', 'Hoja de fuego': 'Nivel 2',
      'Inmovilizar persona': 'Nivel 2', 'Nube de dagas': 'Nivel 2', 'Potenciar característica': 'Nivel 2',
      'Rayo abrasador': 'Nivel 2', 'Telaraña': 'Nivel 2', 'Trepar cual arácnido': 'Nivel 2',
      'Vigor arcano': 'Nivel 2', 'Agrandar/Reducir': 'Nivel 2', 'Ceguera/Sordera': 'Nivel 2',
      'Fuerza de toro': 'Nivel 2', 'Nublar': 'Nivel 2', 'Corona de locura': 'Nivel 2', 'Oscuridad': 'Nivel 2',
      'Visión en la oscuridad': 'Nivel 2', 'Ver invisibilidad': 'Nivel 2', 'Ráfaga de viento': 'Nivel 2',
      'Hechizar persona': 'Nivel 2', 'Levitar': 'Nivel 2', 'Localizar objeto': 'Nivel 2',
      'Imagen múltiple': 'Nivel 2', 'Paso brumoso': 'Nivel 2', 'Rayo de debilitamiento': 'Nivel 2',
      'Piel de corteza': 'Nivel 2', 'Arma espiritual': 'Nivel 2', 'Restablecimiento menor': 'Nivel 2',
      'Auxilio': 'Nivel 2',
      // Nivel 2 de mago (exclusivos)
      'Aura mágica': 'Nivel 2', 'Auguría': 'Nivel 2', 'Aura mágica de Nystul': 'Nivel 2',
      'Bola mágica': 'Nivel 2', 'Cerradura arcana': 'Nivel 2', 'Detectar pensamientos': 'Nivel 2',
      'Dulce descanso': 'Nivel 2', 'Esfera de llamas': 'Nivel 2', 'Flecha ácida de Melf': 'Nivel 2',
      'Invisibilidad': 'Nivel 2', 'Llama permanente': 'Nivel 2',
      'Sugerencia': 'Nivel 2', 'Toque de cordura': 'Nivel 2', 'Truco de la cuerda': 'Nivel 2',

      // ── Nivel 3 ─────────────────────────────────────────────────────────
      'Acelerar': 'Nivel 3', 'Caminar sobre el agua': 'Nivel 3', 'Clarividencia': 'Nivel 3',
      'Contrahchizo': 'Nivel 3', 'Desplazamiento': 'Nivel 3', 'Don de lenguas': 'Nivel 3',
      'Forma gaseosa': 'Nivel 3', 'Imagen mayor': 'Nivel 3', 'Luz del día': 'Nivel 3',
      'Nube apestosa': 'Nivel 3', 'Patrón hipnótico': 'Nivel 3', 'Ralentizar': 'Nivel 3',
      'Respirar bajo el agua': 'Nivel 3', 'Toque vampírico': 'Nivel 3', 'Tormenta de aguanieve': 'Nivel 3',
      'Bola de fuego': 'Nivel 3', 'Relámpago': 'Nivel 3', 'Volar': 'Nivel 3', 'Disipar magia': 'Nivel 3',
      'Terror': 'Nivel 3', 'Alterar el propio aspecto': 'Nivel 3', 'Aliento de dragón': 'Nivel 3',
      'Invocar autómata': 'Nivel 3', 'Protección contra energía': 'Nivel 3',
      // Nivel 3 de mago (exclusivos)
      'Animar a los muertos': 'Nivel 3', 'Círculo mágico': 'Nivel 3',
      'Fingir muerte': 'Nivel 3', 'Glifo custodio': 'Nivel 3', 'Hablar con los muertos': 'Nivel 3',
      'Imponer maldición': 'Nivel 3', 'Indetectable': 'Nivel 3',
      'Invocar feerique': 'Nivel 3', 'Invocar muerto viviente': 'Nivel 3', 'Levantar maldición': 'Nivel 3',

      // ── Nivel 4 ─────────────────────────────────────────────────────────
      'Confusión': 'Nivel 4', 'Destierro': 'Nivel 4', 'Dominar bestia': 'Nivel 4',
      'Escudo de fuego': 'Nivel 4', 'Esfera vitriólica': 'Nivel 4', 'Invisibilidad mejorada': 'Nivel 4',
      'Marchitar': 'Nivel 4', 'Muro de fuego': 'Nivel 4', 'Piel pétrea': 'Nivel 4', 'Polimorfar': 'Nivel 4',
      'Puerta dimensional': 'Nivel 4', 'Tormenta de hielo': 'Nivel 4', 'Libertad de movimiento': 'Nivel 4',
      // Nivel 4 de mago (exclusivos)
      'Adivinación': 'Nivel 4', 'Asesino fantasmal': 'Nivel 4', 'Cofre oculto de Leomund': 'Nivel 4',
      'Conjurar elementales menores': 'Nivel 4', 'Controlar agua': 'Nivel 4',
      'Esfera elástica de Otiluke': 'Nivel 4', 'Fabricar': 'Nivel 4', 'Hechizar monstruo': 'Nivel 4',
      'Invocar aberración': 'Nivel 4', 'Invocar elemental': 'Nivel 4',
      'Localizar criatura': 'Nivel 4', 'Maldear la piedra': 'Nivel 4', 'Mastín fiel de Mordenkainen': 'Nivel 4',

      // ── Nivel 5 ─────────────────────────────────────────────────────────
      'Animar objetos': 'Nivel 5', 'Apariencia': 'Nivel 5', 'Círculo de teletransportación': 'Nivel 5',
      'Cono de frío': 'Nivel 5', 'Creación': 'Nivel 5', 'Dominar persona': 'Nivel 5',
      'Estática sináptica': 'Nivel 5', 'Inmovilizar monstruo': 'Nivel 5', 'Mano de Bigby': 'Nivel 5',
      'Muro de piedra': 'Nivel 5', 'Nube aniquiladora': 'Nivel 5', 'Plaga de insectos': 'Nivel 5',
      'Telequinesis': 'Nivel 5', 'Muro de fuerza': 'Nivel 5', 'Restablecimiento mayor': 'Nivel 5',
      'Conocer las leyendas': 'Nivel 5'
    };


    const spellNames = this.getGlosarySpellNames();
    for (const name of spellNames) {
      const lvl = spellLevels[name] || 'Trucos';
      if (!categories[lvl]) {
        categories[lvl] = [];
      }
      categories[lvl].push(name);
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

  getFilteredSpellsForCurrentLevel(): string[] {
    const allByCategory = this.getSpellsByLevel();
    const spellsInActiveLevel = allByCategory[this.activeSpellFilterLevel] || [];
    
    if (!this.spellSearchQuery.trim()) {
      return spellsInActiveLevel;
    }
    
    const query = this.spellSearchQuery.toLowerCase().trim();
    return spellsInActiveLevel.filter(s => s.toLowerCase().includes(query));
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
        1: 2, 2: 4 // El Hechicero tiene progresión especial a nivel 1 y 2
      };
      return cantrips + (spells[lvl] || 2);
    }
    
    if (name.includes('bardo')) {
      const cantrips = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2);
      return cantrips + (fullCasterTable[lvl] || 4);
    }

    if (name.includes('clérigo') || name.includes('clerigo')) {
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

    if (name.includes('paladín') || name.includes('paladin')) {
      return halfCasterTable[lvl] || 2;
    }

    if (name.includes('guerrero') && this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
      const cantrips = lvl >= 10 ? 3 : 2;
      return cantrips + (thirdCasterTable[lvl] || 0);
    }

    if (name.includes('pícaro') || name.includes('picaro')) {
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

    // Lanzadores Completos (Full Casters): Mago, Hechicero, Clérigo, Druida, Bardo
    if (name.includes('mago') || name.includes('hechicero') || name.includes('clérigo') || name.includes('clerigo') || name.includes('druida') || name.includes('bardo')) {
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

    // Semi-lanzadores (Half Casters): Explorador (Ranger) y Paladín (En D&D 2024 lanzan desde Nivel 1)
    if (name.includes('explorador') || name.includes('paladín') || name.includes('paladin')) {
      if (lvl >= 17) return 5;
      if (lvl >= 13) return 4;
      if (lvl >= 9) return 3;
      if (lvl >= 5) return 2;
      return 1;
    }

    // Lanzadores de Tercio (Third Casters): Guerrero Arcano, Pícaro Arcano
    if ((name.includes('guerrero') || name.includes('pícaro') || name.includes('picaro')) && this.character.subclass && this.character.subclass.toLowerCase().includes('arcano')) {
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

  addSpellToTemp(spellName: string): void {
    const trimmed = spellName.trim();
    if (!trimmed) return;
    if (this.tempPreparedSpells.includes(trimmed)) return;

    const limit = this.getCharacterSpellLimit();
    if (this.tempPreparedSpells.length >= limit) {
      alert(`Has alcanzado el límite máximo de ${limit} conjuros preparados para tu nivel.`);
      return;
    }

    this.tempPreparedSpells.push(trimmed);
    this.cdr.detectChanges();
  }

  removeSpellFromTemp(spellName: string): void {
    this.tempPreparedSpells = this.tempPreparedSpells.filter(s => s !== spellName);
    this.cdr.detectChanges();
  }

  saveSpellsChanges(): void {
    if (!this.character || !this.character.id) return;
    this.addLog('Guardando conjuros preparados en BD...');
    this.characterService.updateCharacter(this.character.id, { preparedSpells: this.tempPreparedSpells }).subscribe({
      next: (updated) => {
        this.addLog('Conjuros guardados con éxito.');
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
    return SPELL_DESCRIPTIONS_MAP[spellName] || 'Descripción mágica no detallada en este grimorio abreviado.';
  }

  isBarbarian(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('bárbaro') || name.includes('barbaro');
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
    return this.character.class.toLowerCase().includes('clérigo') || this.character.class.toLowerCase().includes('clerigo');
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
    return name.includes('paladín') || name.includes('paladin');
  }

  isRogue(): boolean {
    if (!this.character) return false;
    const name = this.character.class.toLowerCase();
    return name.includes('pícaro') || name.includes('picaro') || name.includes('rogue');
  }

  // Rogue D&D 2024 calculations & interactive state
  rogueStrokeOfLuckUsed: boolean = false;
  rogueSteadyAimActive: boolean = false;

  getRogueSneakAttackDice(level: number): string {
    const diceCount = Math.ceil(level / 2);
    return `${diceCount}d6`;
  }

  getRogueCunningStrikeDC(): string {
    if (!this.character) return '—';
    const dexMod = this.getFinalModifierValue('dexterity');
    return `${8 + dexMod + this.getProficiencyBonus()}`;
  }

  toggleSteadyAim(): void {
    this.rogueSteadyAimActive = !this.rogueSteadyAimActive;
    if (this.rogueSteadyAimActive) {
      this.addLog('Puntería Certera activada: Ventaja en tu próximo ataque (velocidad reducida a 0).');
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
    return '—';
  }

  getMonkFocusSaveDC(): string {
    if (!this.character) return '—';
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
    this.addLog(`Metabolismo Asombroso ejecutado: recupera ${hpHealed} HP (1d${dieMax}: ${dieRoll} + ${this.character.level}) y todos los Puntos de Concentración.`);
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
    this.addLog(`Desviar Ataques ejecutado: reduce ${reduction} daño. Daño redirigido: ${redirectDamage}.`);
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
  showLevelUpModal = false;
  rolledHp: number | null = null;
  hpChoiceType: 'average' | 'roll' | null = null;

  getClassHitDie(): number {
    if (!this.character) return 8;
    const name = this.character.class.toLowerCase();
    if (name.includes('bárbaro') || name.includes('barbaro')) return 12;
    if (name.includes('guerrero') || name.includes('paladín') || name.includes('paladin')) return 10;
    if (name.includes('mago') || name.includes('hechicero')) return 6;
    return 8; // Bardo, Brujo, Clérigo, Druida, Explorador, Pícaro, Monje
  }

  getLevelUpHpBonus(): number {
    let bonus = 0;
    if (this.isDwarfCharacter()) bonus += 1;
    if (this.hasToughFeat()) bonus += 2;
    if (this.character && this.isSorcerer() && this.character.subclass && (this.character.subclass.toLowerCase().includes('dracónica') || this.character.subclass.toLowerCase().includes('draconica'))) {
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

    if (this.isSorcerer() && this.character.subclass && (this.character.subclass.toLowerCase().includes('dracónica') || this.character.subclass.toLowerCase().includes('draconica'))) {
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
      this.addLog('✨ Has ganado Inspiración Heroica.');
    } else {
      this.addLog('🎲 Has utilizado tu Inspiración Heroica.');
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
        this.addLog(`Error al guardar Inspiración: ${err.message || JSON.stringify(err)}`);
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
      return ['Hechicería aberrante', 'Hechicería de magia salvaje', 'Hechicería dracónica', 'Hechicería mecánica'];
    }
    if (name.includes('bárbaro') || name.includes('barbaro')) {
      return ['Senda del Árbol del Mundo', 'Senda del Berserker', 'Senda del Corazón Salvaje', 'Senda del Fanático'];
    }
    if (name.includes('bardo')) {
      return ['Colegio de la Danza', 'Colegio del Conocimiento', 'Colegio del Glamour', 'Colegio del Valor'];
    }
    if (name.includes('brujo')) {
      return ['Patrón Celestial', 'Patrón Feérico', 'Patrón Infernal', 'Patrón Primigenio'];
    }
    if (name.includes('clérigo') || name.includes('clerigo')) {
      return ['Dominio de la Guerra', 'Dominio de la Luz', 'Dominio de la Vida', 'Dominio del Engaño'];
    }
    if (name.includes('druida')) {
      return ['Círculo de la Luna', 'Círculo de la Tierra (Árido)', 'Círculo de la Tierra (Polar)', 'Círculo de la Tierra (Templado)', 'Círculo de la Tierra (Tropical)', 'Círculo de las Estrellas', 'Círculo del Mar'];
    }
    if (name.includes('explorador')) {
      return ['Acechador en la penumbra', 'Cazador', 'Errante feérico', 'Señor de las bestias'];
    }
    if (name.includes('guerrero')) {
      return ['Caballero Arcano', 'Campeón', 'Guerrero Psiónico', 'Maestro del Combate'];
    }
    if (name.includes('mago')) {
      return ['Abjurador', 'Adivino', 'Evocador', 'Ilusionista'];
    }
    if (name.includes('paladín') || name.includes('paladin')) {
      return ['Juramento de entrega', 'Juramento de la gloria', 'Juramento de los antiguos', 'Juramento de venganza'];
    }
    if (name.includes('monje')) {
      return ['Guerrero de la Mano Abierta', 'Guerrero de la Misericordia', 'Guerrero de la Sombra', 'Guerrero de los Elementos'];
    }
    if (name.includes('pícaro') || name.includes('picaro') || name.includes('rogue')) {
      return ['Asesino', 'Embaucador arcano', 'Ladrón', 'Rebanaalmas'];
    }
    return [];
  }

  onSubclassChange(newSubclass: string): void {
    if (!this.character || !this.character.id) return;
    this.addLog(`Guardando nueva subclase "${newSubclass}" en BD...`);
    this.characterService.updateCharacter(this.character.id, { subclass: newSubclass }).subscribe({
      next: (updated) => {
        this.addLog(`Subclase actualizada en BD con éxito a: ${updated.subclass}`);
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
    return METAMAGIC_DESCRIPTIONS_MAP[name] || 'Sin descripción disponible.';
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
    this.addLog(`Guardando nuevo nivel ${this.character.level} y HP Máximos ${updatedHp} en BD...`);
    this.characterService.updateCharacter(this.character.id, { level: this.character.level, hp: updatedHp, currentHp: newCurrentHp }).subscribe({
      next: (updated) => {
        this.addLog(`Nivel actualizado en BD con éxito a ${updated.level} y HP a ${updated.hp}`);
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

  // Variables y métodos del simulador de Sobrecarga de Magia Salvaje y Manifestación del Orden
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
    this.addLog(`Tirada de Manifestación del Orden (1d6): ${this.orderRoll}`);
    this.cdr.detectChanges();
  }

  getWildMagicEffectDescription(roll: number): string {
    if (roll >= 1 && roll <= 4) return 'Tira en esta tabla al inicio de cada uno de tus turnos durante el próximo minuto (10 turnos).';
    if (roll >= 5 && roll <= 8) return 'Una criatura amistosa aleatoria aparece a 18 m de ti en un espacio desocupado (como un Modron, un Flumph o un Unicornio) y desaparece tras 1 minuto.';
    if (roll >= 9 && roll <= 12) return 'Recuperas 5 puntos de golpe al inicio de cada uno de tus turnos durante 1 minuto.';
    if (roll >= 13 && roll <= 16) return 'Los enemigos tienen desventaja contra la salvación de tu próximo conjuro que requiera tirada de salvación.';
    if (roll >= 17 && roll <= 20) return 'Tira 1d8 para un efecto aleatorio gracioso (aumento de tamaño, plumas, gritar mariposas, burbujas en la boca, piel azul, etc.).';
    if (roll >= 21 && roll <= 24) return 'Los conjuros que lances durante el próximo minuto tienen un tiempo de ejecución de 1 acción adicional.';
    if (roll >= 25 && roll <= 28) return 'Te teletransportas al Plano Astral hasta el final de tu próximo turno, regresando al mismo espacio u otro desocupado más cercano.';
    if (roll >= 29 && roll <= 32) return 'El próximo conjuro dañino que lances antes del final de tu turno causa el máximo daño posible.';
    if (roll >= 33 && roll <= 36) return 'Obtienes resistencia a todo el daño durante el próximo minuto.';
    if (roll >= 37 && roll <= 40) return 'Te transformas en una planta en una maceta hasta el principio de tu siguiente turno. Eres vulnerable a todo el daño e incapacitado. Si tus HP caen a 0, se rompe la maceta y vuelves a tu forma.';
    if (roll >= 41 && roll <= 44) return 'Durante el próximo minuto, puedes teletransportarte hasta 6 m como acción adicional durante cada uno de tus turnos.';
    if (roll >= 45 && roll <= 48) return 'Tú y hasta tres criaturas que elijas a 9 m tenéis el estado de invisibles durante 1 minuto. Termina si atacas, causas daño o lanzas conjuro.';
    if (roll >= 49 && roll <= 52) return 'Un escudo espectral levita cerca de ti por 1 minuto, otorgando +2 a la CA e inmunidad a proyectil mágico.';
    if (roll >= 53 && roll <= 56) return 'Puedes realizar una acción extra durante este turno.';
    if (roll >= 57 && roll <= 60) return 'Lanzas un conjuro aleatorio (1d10: 1: bola de fuego, 2: confusión, 3: grasa, 4: imagen múltiple, 5: levitar, 6: nube de oscurecimiento, 7: polimorfar en cabra si fallas salvación, 8: proyectil mágico nvl 5, 9: ver invisibilidad, 10: volar). No requiere concentración y dura su tiempo total.';
    if (roll >= 61 && roll <= 64) return 'Cualquier objeto no mágico inflamable que toques se prende fuego, sufre 1d4 daño de fuego y arde por 1 minuto.';
    if (roll >= 65 && roll <= 68) return 'Si mueres durante la próxima hora, revives inmediatamente como con el conjuro reencarnar.';
    if (roll >= 69 && roll <= 72) return 'Tienes el estado de asustado hasta el final de tu siguiente turno. Tu DM establece el motivo.';
    if (roll >= 73 && roll <= 76) return 'Te teletransportas hasta 18 m a un espacio desocupado visible.';
    if (roll >= 77 && roll <= 80) return 'Una criatura aleatoria a 18 m queda envenenada por 1d4 horas.';
    if (roll >= 81 && roll <= 84) return 'Emites luz brillante en 9 m por 1 minuto. Quien termine su turno a 1,5 m de ti queda cegado hasta su siguiente turno.';
    if (roll >= 85 && roll <= 88) return 'Hasta tres criaturas a 9 m sufren 1d10 daño necrótico y te sanas esa cantidad.';
    if (roll >= 89 && roll <= 92) return 'Hasta tres criaturas a 9 m sufren 4d10 daño de relámpago.';
    if (roll >= 93 && roll <= 96) return 'Tú y todos a 9 m tenéis vulnerabilidad al daño perforante por 1 minuto.';
    return 'Tira 1d6: 1: recuperas 2d10 HP, 2: aliado a 90 m recupera 2d10 HP, 3: recuperas espacio de conjuro menor, 4: aliado recupera espacio de conjuro menor, 5: recuperas todos tus puntos de hechicería, 6: se aplican todos los efectos de la fila 17-20.';
  }

  getOrderManifestationDescription(roll: number): string {
    if (roll === 1) return 'Unos engranajes espectrales levitan tras de ti.';
    if (roll === 2) return 'Las manecillas de un reloj giran en tus ojos.';
    if (roll === 3) return 'Tu piel resplandece con un brillo metálico.';
    if (roll === 4) return 'Objetos geométricos y ecuaciones flotantes recubren tu cuerpo.';
    if (roll === 5) return 'Tu canalizador mágico adopta temporariamente la forma de un mecanismo de relojería Diminuto.';
    return 'Tanto tú como aquellos afectados por tu magia podéis escuchar el tictac de los engranajes o el timbre de un reloj.';
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
      // Fallback genérico de progresión para clases sin mapa específico
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
        if (level >= 3) active.push('Técnica de la mano abierta');
        if (level >= 6) active.push('Plenitud de cuerpo');
        if (level >= 11) active.push('Paso veloz');
        if (level >= 17) active.push('Palma estremecedora');
      } else if (sub.includes('misericordia')) {
        if (level >= 3) {
          active.push('Instrumentos de misericordia');
          active.push('Mano de aflicción');
          active.push('Mano de curación');
        }
        if (level >= 6) active.push('Toque de Galeno');
        if (level >= 11) active.push('Ráfaga de curación y aflicción');
        if (level >= 17) active.push('Mano de misericordia suprema');
      } else if (sub.includes('sombra')) {
        if (level >= 3) active.push('Artes sombrías');
        if (level >= 6) active.push('Paso entre sombras');
        if (level >= 11) active.push('Paso entre sombras mejorado');
        if (level >= 17) active.push('Capa de sombras');
      } else if (sub.includes('elementos')) {
        if (level >= 3) {
          active.push('Armonía con los elementos');
          active.push('Manipular los elementos');
        }
        if (level >= 6) active.push('Explosión elemental');
        if (level >= 11) active.push('Paso de los elementos');
      }
    }

    if (this.isPaladin() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('entrega') || sub.includes('devoción') || sub.includes('devocion')) {
        if (level >= 3) {
          active.push('Arma sagrada');
          active.push('Conjuros del juramento de entrega');
        }
        if (level >= 7) active.push('Aura de entrega');
        if (level >= 15) active.push('Castigo protector');
        if (level >= 20) active.push('Halo sagrado');
      } else if (sub.includes('gloria')) {
        if (level >= 3) {
          active.push('Atleta sin parangón');
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
        if (level >= 20) active.push('Campeón ancestral');
      } else if (sub.includes('venganza')) {
        if (level >= 3) {
          active.push('Voto de enemistad');
          active.push('Conjuros del juramento de venganza');
        }
        if (level >= 7) active.push('Vengador implacable');
        if (level >= 15) active.push('Espíritu vengativo');
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
        if (level >= 9) active.push('Emboscada mágica');
        if (level >= 13) active.push('Embaucador versátil');
        if (level >= 17) active.push('Ladrón de conjuros');
      } else if (sub.includes('ladrón') || sub.includes('ladron')) {
        if (level >= 3) {
          active.push('Balconero');
          active.push('Manos rápidas');
        }
        if (level >= 9) active.push('Sigilo supremo');
        if (level >= 13) active.push('Usar objetos mágicos');
        if (level >= 17) active.push('Reflejos de ladrón');
      } else if (sub.includes('rebanaalmas') || sub.includes('soulknife')) {
        if (level >= 3) {
          active.push('Cuchillas psíquicas');
          active.push('Poder psiónico');
        }
        if (level >= 9) active.push('Cuchillas del alma');
        if (level >= 13) active.push('Velo psíquico');
        if (level >= 17) active.push('Desgarro mental');
      }
    }

    if (this.isSorcerer() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('aberrante')) {
        if (level >= 3) {
          active.push('Mente telepática');
          active.push('Conjuros psiónicos');
        }
        if (level >= 6) {
          active.push('Defensas psíquicas');
          active.push('Hechicería psiónica');
        }
        if (level >= 14) active.push('Revelación en carne');
        if (level >= 18) active.push('Implosión deformadora');
      } else if (sub.includes('salvaje')) {
        if (level >= 3) {
          active.push('Mareas del caos');
          active.push('Sobrecarga de magia salvaje');
        }
        if (level >= 6) active.push('Doblegar la suerte');
        if (level >= 14) active.push('Caos controlado');
        if (level >= 18) active.push('Sobrecarga domada');
      } else if (sub.includes('dracónica') || sub.includes('draconica')) {
        if (level >= 3) {
          active.push('Resiliencia dracónica');
          active.push('Conjuros dracónicos');
        }
        if (level >= 6) active.push('Afinidad elemental');
        if (level >= 14) active.push('Alas de dragón');
        if (level >= 18) active.push('Compañero dragón');
      } else if (sub.includes('mecánica') || sub.includes('mecanica')) {
        if (level >= 3) {
          active.push('Restablecer equilibrio');
          active.push('Conjuros mecánicos');
        }
        if (level >= 6) active.push('Bastión de la ley');
        if (level >= 14) active.push('Trance de orden');
        if (level >= 18) active.push('Cabalgata mecánica');
      }
    }

    if (this.isFighter() && this.character.subclass) {
      const sub = this.character.subclass.toLowerCase();
      if (sub.includes('campeón') || sub.includes('campeon')) {
        if (level >= 3) active.push('Crítico mejorado');
        if (level >= 7) active.push('Atleta notable');
        if (level >= 10) active.push('Estilo de combate adicional');
        if (level >= 15) active.push('Crítico superior');
        if (level >= 18) active.push('Superviviente (Campeón)');
      } else if (sub.includes('arcano')) {
        if (level >= 3) {
          active.push('Lanzamiento de conjuros (Arcano)');
          active.push('Vínculo con el arma');
        }
        if (level >= 7) active.push('Magia de guerra');
        if (level >= 10) active.push('Embate de carga');
        if (level >= 15) active.push('Teletransporte arcano');
        if (level >= 18) active.push('Magia de guerra mejorada');
      } else if (sub.includes('psiónico') || sub.includes('psionico')) {
        if (level >= 3) {
          active.push('Poder psiónico');
          active.push('Fuerza telequinética');
          active.push('Escudo mental');
        }
        if (level >= 7) active.push('Salto psiónico');
        if (level >= 10) active.push('Baluarte guardián');
        if (level >= 15) active.push('Empuje psiónico');
        if (level >= 18) active.push('Mente psiónica suprema');
      } else if (sub.includes('combate')) {
        if (level >= 3) {
          active.push('Dados de supremacía');
          active.push('Maniobras de combate');
          active.push('Estudiante de la guerra');
        }
        if (level >= 7) active.push('Conoce a tu enemigo');
        if (level >= 10) active.push('Supremacía mejorada');
        if (level >= 15) active.push('Implacable');
        if (level >= 18) active.push('Supremacía definitiva');
      }
    }

    // Agregar resolución dinámica genérica para cualquier otra subclase de las otras clases
    if (this.character.subclass) {
      const sub = this.character.subclass.trim();
      // Si el rasgo no está en la lista general, agregamos el indicador de subclase elegida
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
    const isSubclassArcane = !!(this.character.subclass && this.character.subclass.toLowerCase().includes('arcano'));
    return name.includes('mago') || name.includes('hechicero') || name.includes('bardo') || 
           name.includes('brujo') || name.includes('clérigo') || name.includes('clerigo') || 
           name.includes('druida') || name.includes('paladín') || name.includes('paladin') || 
           name.includes('explorador') ||
           ((name.includes('guerrero') || name.includes('pícaro') || name.includes('picaro')) && isSubclassArcane);
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

const MONK_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Artes marciales', 'Defensa sin armadura'] },
  2: { features: ['Concentración de monje', 'Metabolismo asombroso', 'Movimiento sin armadura'] },
  3: { features: ['Desviar ataques', 'Subclase de monje'] },
  4: { features: ['Caída lenta', 'Mejora de característica'] },
  5: { features: ['Ataque adicional', 'Golpe aturdidor'] },
  6: { features: ['Golpes potenciados', 'Rasgo de subclase'] },
  7: { features: ['Evasión'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Movimiento acrobático'] },
  10: { features: ['Autorrestablecimiento', 'Concentración agudizada'] },
  11: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de característica'] },
  13: { features: ['Desviar energía'] },
  14: { features: ['Superviviente disciplinado'] },
  15: { features: ['Concentración perfecta'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Rasgo de subclase'] },
  18: { features: ['Defensa superior'] },
  19: { features: ['Don épico'] },
  20: { features: ['Cuerpo y mente'] }
};

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

const SORCERER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'Hechicería innata'] },
  2: { features: ['Fuente de magia', 'Metamagia'] },
  3: { features: ['Subclase de hechicero'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Recuperación mágica'] },
  6: { features: ['Rasgo de subclase'] },
  7: { features: ['Encarnación mágica'] },
  8: { features: ['Mejora de característica'] },
  10: { features: ['Metamagia mejorada'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Metamagia suprema'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Apoteosis arcana'] }
};

const FIGHTER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Estilo de combate', 'Recuperación del viento', 'Maestría con armas'] },
  2: { features: ['Oleada de acción', 'Táctica defensiva'] },
  3: { features: ['Subclase de Guerrero'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Ataque adicional'] },
  6: { features: ['Mejora de característica'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Indómito'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Ataque adicional'] },
  12: { features: ['Mejora de característica'] },
  13: { features: ['Tácticas indómitas'] },
  14: { features: ['Mejora de característica'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Oleada de acción', 'Recuperación del viento'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Ataque adicional'] }
};

const BARD_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'Inspiración bárdica'] },
  2: { features: ['Polifacético', 'Canción de descanso'] },
  3: { features: ['Subclase de Bardo', 'Pericia'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Fuente de inspiración'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Pericia'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  18: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Inspiración superior'] }
};

const WARLOCK_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Magia del pacto', 'Favor del patrón', 'Magia sobrenatural'] },
  2: { features: ['Invocaciones sobrenaturales'] },
  3: { features: ['Subclase de Brujo', 'Regalo del pacto'] },
  4: { features: ['Mejora de característica'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de característica'] },
  10: { features: ['Rasgo de subclase'] },
  11: { features: ['Arcanismo místico (Nivel 6)'] },
  12: { features: ['Mejora de característica'] },
  13: { features: ['Arcanismo místico (Nivel 7)'] },
  14: { features: ['Rasgo de subclase'] },
  15: { features: ['Arcanismo místico (Nivel 8)'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Arcanismo místico (Nivel 9)'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Maestro sobrenatural'] }
};

const CLERIC_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'Canalizar divinidad'] },
  2: { features: ['Rasgo de subclase'] },
  3: { features: ['Subclase de Clérigo'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Destruir infrecuentes'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Rasgo de subclase'] },
  10: { features: ['Intervención divina'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Rasgo de subclase'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Intervención divina mejorada'] }
};

const DRUID_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Lanzamiento de conjuros', 'Druídico'] },
  2: { features: ['Forma salvaje', 'Subclase de Druida'] },
  3: { features: ['Subclase de Druida'] },
  4: { features: ['Forma salvaje mejorada', 'Mejora de característica'] },
  6: { features: ['Rasgo de subclase'] },
  8: { features: ['Forma salvaje mejorada', 'Mejora de característica'] },
  10: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  18: { features: ['Cuerpo atemporal', 'Conjuros bestiales'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Archidruida'] }
};

const RANGER_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Enemigo predilecto', 'Explorador natural'] },
  2: { features: ['Estilo de combate', 'Lanzamiento de conjuros'] },
  3: { features: ['Subclase de Explorador', 'Conciencia primigenia'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Ataque adicional'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Paso de las tierras', 'Mejora de característica'] },
  10: { features: ['Ocultación natural', 'Rasgo de subclase'] },
  11: { features: ['Rasgo de subclase'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Desvanecerse', 'Rasgo de subclase'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  18: { features: ['Sentidos feroces'] },
  19: { features: ['Don de final del juego'] },
  20: { features: ['Cazador del enemigo'] }
};

const PALADIN_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Imponer las manos', 'Lanzamiento de conjuros (Paladín)', 'Maestría con armas'] },
  2: { features: ['Castigo de paladín', 'Estilo de combate'] },
  3: { features: ['Canalizar divinidad', 'Subclase de paladín'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Ataque adicional', 'Corcel fiel'] },
  6: { features: ['Aura de protección'] },
  7: { features: ['Rasgo de subclase'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Abjurar de los enemigos'] },
  10: { features: ['Aura de coraje'] },
  11: { features: ['Golpes radiantes'] },
  12: { features: ['Mejora de característica'] },
  14: { features: ['Toque reparador'] },
  15: { features: ['Rasgo de subclase'] },
  16: { features: ['Mejora de característica'] },
  18: { features: ['Expansión de aura'] },
  19: { features: ['Don épico'] },
  20: { features: ['Rasgo de subclase'] }
};

const ROGUE_PROGRESS_MAP: { [key: number]: { features: string[] } } = {
  1: { features: ['Ataque furtivo', 'Jerga de ladrones', 'Maestría con armas', 'Pericia'] },
  2: { features: ['Acción astuta'] },
  3: { features: ['Puntería certera', 'Subclase de pícaro'] },
  4: { features: ['Mejora de característica'] },
  5: { features: ['Esquiva asombrosa', 'Golpe astuto'] },
  6: { features: ['Pericia'] },
  7: { features: ['Evasión', 'Talentos fiables'] },
  8: { features: ['Mejora de característica'] },
  9: { features: ['Rasgo de subclase'] },
  10: { features: ['Mejora de característica'] },
  11: { features: ['Golpe astuto mejorado'] },
  12: { features: ['Mejora de característica'] },
  13: { features: ['Rasgo de subclase'] },
  14: { features: ['Golpes taimados'] },
  15: { features: ['Mente escurridiza'] },
  16: { features: ['Mejora de característica'] },
  17: { features: ['Rasgo de subclase'] },
  18: { features: ['Elusivo'] },
  19: { features: ['Don épico'] },
  20: { features: ['Golpe de suerte'] }
};

const FEATURE_DESCRIPTIONS_MAP: { [key: string]: string } = {
  // Pícaro (Rogue D&D 2024)
  'Ataque furtivo': 'Una vez por turno, puedes infligir daño adicional (1d6 a nvl 1, aumentando hasta 10d6 a nvl 19) a una criatura a la que aciertes con un arma sutil o a distancia si tienes ventaja en la tirada. No necesitas ventaja si al menos un aliado no incapacitado está a 1,5 m del objetivo y no sufres desventaja.',
  'Jerga de ladrones': 'Conoces el dialecto secreto de los delincuentes y un idioma adicional de tu elección.',
  'Acción astuta': 'Tu agilidad mental te permite llevar a cabo una de las siguientes acciones como acción adicional en tu turno: Correr, Destrabarse o Esconderse.',
  'Puntería certera': 'Como acción adicional, te concedes ventaja en tu siguiente tirada de ataque del turno actual si no te has movido en este turno. Tras usarlo, tu velocidad es 0 hasta el final del turno.',
  'Subclase de pícaro': 'Consigues una subclase de pícaro de tu elección (Asesino, Embaucador arcano, Ladrón o Rebanaalmas) que te otorga rasgos en los niveles 3, 9, 13 y 17.',
  'Esquiva asombrosa': 'Cuando un atacante que puedas ver te acierte con una tirada de ataque, puedes usar tu reacción para reducir a la mitad el daño que te causa dicho ataque.',
  'Golpe astuto': 'Cuando infliges daño de Ataque furtivo, puedes renunciar a dados de daño para añadir efectos tácticos:\n• Retirada (coste: 1d6): Te mueves hasta la mitad de tu velocidad sin provocar ataques de oportunidad.\n• Tropiezo (coste: 1d6): Objetivo Grande o menor cae derribado si falla salvación de Destreza (CD = 8 + DES + BC).\n• Veneno (coste: 1d6): Envenenas al objetivo por 1 minuto si falla salvación de Constitución (requiere útiles de envenenador).',
  'Talentos fiables': 'Cuando hagas una prueba de característica que utilice una de tus competencias en habilidades o con herramientas, puedes sustituir un resultado de 9 o menos en el d20 por un 10.',
  'Golpe astuto mejorado': 'Puedes aplicar hasta dos efectos de Golpe astuto en el mismo Ataque furtivo pagando el coste en dados de cada efecto.',
  'Golpes taimados': 'Añades nuevas opciones avanzadas a tu Golpe astuto:\n• Confundir (coste: 2d6): Salvación de Constitución o el objetivo solo puede moverse, o hacer una acción, o hacer una acción adicional en su próximo turno.\n• Noquear (coste: 6d6): Salvación de Constitución o el objetivo queda inconsciente durante 1 minuto.\n• Ofuscar (coste: 3d6): Salvación de Destreza o el objetivo queda cegado hasta el final de su siguiente turno.',
  'Mente escurridiza': 'Tu disciplina mental te otorga competencia en las tiradas de salvación de Sabiduría y Carisma.',
  'Elusivo': 'Ninguna tirada de ataque contra ti tendrá ventaja a menos que tengas el estado de incapacitado.',
  'Golpe de suerte': 'Si fallas una prueba con d20, puedes convertir el resultado en un 20 automático (1 uso por descanso corto o largo).',

  // Subclase: Asesino
  'Asesinar': 'Se te da muy bien emboscar objetivos, lo que te otorga los siguientes beneficios:\n• Golpes sorprendentes: Durante el primer asalto de cada combate, tienes ventaja en las tiradas de ataque contra cualquier criatura que aún no haya jugado un turno. Si tu Ataque furtivo acierta a cualquier objetivo durante ese asalto, el objetivo recibirá un daño adicional del tipo del arma igual a tu nivel de pícaro.\n• Iniciativa: Tienes ventaja en las tiradas de iniciativa.',
  'Herramientas de asesino': 'Consigues útiles de envenenador y útiles para disfrazarse y tienes competencia con ellos.',
  'Pericia en infiltrarse': 'Eres experto en las siguientes técnicas de infiltración:\n• Imitación magistral: Puedes imitar a la perfección el habla de otra persona, su caligrafía o ambas si pasas al menos 1 hora estudiándolas.\n• Puntería ambulante: Tu velocidad no se reduce a 0 cuando usas Puntería certera.',
  'Envenenar armas': 'Cuando utilizas la opción de veneno de tu Golpe astuto, el objetivo también recibirá 2d6 de daño de veneno si falla la tirada de salvación. Este daño ignora la resistencia al daño de veneno.',
  'Golpe mortal': 'Cuando aciertes con tu Ataque furtivo en el primer asalto de un combate, el objetivo deberá hacer una tirada de salvación de Constitución (CD = 8 + mod. Destreza + BC). Si no la supera, se duplicará el daño del ataque contra el objetivo.',

  // Subclase: Embaucador Arcano
  'Lanzamiento de conjuros (Embaucador arcano)': 'Preparas y lanzas conjuros de la lista de mago usando Inteligencia como tu aptitud mágica (CD = 8 + mod. Inteligencia + BC). Conoces 3 trucos (incluyendo mano de mago) y preparas conjuros según la tabla de Embaucador arcano.',
  'Destreza con mano de mago': 'Cuando lanzas mano de mago, puedes hacerlo como acción adicional y de modo que la mano espectral sea invisible. Puedes controlar la mano como acción adicional y usarla para hacer pruebas de Destreza (Juego de manos).',
  'Emboscada mágica': 'Si tienes el estado de invisible cuando lanzes un conjuro sobre una criatura, tendrá desventaja en cualquier tirada de salvación que haga contra el conjuro ese mismo turno.',
  'Embaucador versátil': 'Obtienes la capacidad de distraer a los objetivos con tu mano de mago. Cuando utilizas la opción de tropiezo de tu Golpe astuto sobre una criatura, también podrás usar esa opción sobre otra criatura a 1,5 m o menos de la mano espectral.',
  'Ladrón de conjuros': 'Inmediatamente después de que una criatura lance un conjuro que te haga objetivo o cuya área te incluya, puedes usar tu reacción para obligar a la criatura a hacer una salvación de Inteligencia (vs tu CD de conjuros). Si la falla, anulas los efectos sobre ti y robas el conocimiento del conjuro durante 8 horas (la criatura no puede lanzarlo en ese tiempo). 1/descanso largo.',

  // Subclase: Ladrón
  'Balconero': 'Entrenamiento de exploración urbana y vertiginosa:\n• Escalador: Obtienes una velocidad trepando igual a tu velocidad de movimiento.\n• Saltador: Puedes determinar tu distancia de salto empleando tu Destreza en lugar de tu Fuerza.',
  'Manos rápidas': 'Como acción adicional en tu turno, puedes hacer una de las siguientes cosas:\n• Juego de manos: Prueba de Destreza (Juego de manos) para robar o usar herramientas de ladrón para forzar una cerradura o desarmar una trampa.\n• Usar un objeto: Empleas la acción de utilizar o la acción de magia para usar un objeto mágico que necesite una acción.',
  'Sigilo supremo': 'Obtienes la opción de Golpe astuto "Ataque sigiloso" (coste: 1d6): Si tienes el estado de invisible por una acción de esconderse, este ataque no pone fin a ese estado si terminas el turno tras cobertura tres cuartos o cobertura completa.',
  'Usar objetos mágicos': 'Máximo provecho de objetos mágicos:\n• Cargas: Al usar un objeto mágico que gaste cargas, tira 1d6. Si sacas 6, no gastas cargas.\n• Pergaminos: Usas cualquier pergamino de conjuro con Inteligencia. Lanzas de nivel 0-1 de forma fiable, o superando prueba de Inteligencia (Arcano) CD 10 + nivel para niveles superiores.\n• Sintonización: Te sintonizas con hasta 4 objetos mágicos a la vez.',
  'Reflejos de ladrón': 'Puedes actuar dos turnos durante el primer asalto de cualquier combate (el primero en tu iniciativa normal y el segundo a tu iniciativa menos 10).',

  // Subclase: Rebanaalmas
  'Cuchillas psíquicas': 'Manifestación de energía psiónica pura:\n• Ataque: Cuchilla psíquica sutil y arrojadiza (18/36 m) que inflige 1d6 de daño psíquico + mod. atributo.\n• Ataque extra: Como acción adicional tras atacar con la cuchilla, realizas un segundo ataque con otra cuchilla que inflige 1d4 de daño psíquico.',
  'Poder psiónico': 'Posees una reserva de Dados de energía psiónica (4d6 a nvl 3, aumentando a 12d12 a nvl 17) que recuperas tras descanso corto/largo:\n• Don psirreforzado: Si fallas una prueba de habilidad/herramienta competente, tiras 1 dado y lo sumas al resultado. El dado solo se gasta si la prueba tiene éxito.\n• Susurros psíquicos: Red telepática con hasta BC aliados por horas igual a la tirada (1ª vez gratis tras descanso largo).',
  'Cuchillas del alma': 'Mejoras con tu cuchilla psíquica:\n• Golpes teledirigidos: Si fallas un ataque con cuchilla psíquica, tiras 1 dado de energía psiónica y lo sumas a la tirada de ataque (solo se gasta si aciertas).\n• Teletransporte psíquico: Acción adicional gastando 1 dado para teletransportarte a hasta 3 × el resultado metros.',
  'Velo psíquico': 'Como acción de magia, te vuelves invisible durante 1 hora (termina si infliges daño o fuerzas salvación). 1/descanso largo o gastando 1 dado de energía psiónica.',
  'Desgarro mental': 'Cuando infligas daño de Ataque furtivo con tus cuchillas psíquicas, fuerzas al objetivo a superar una salvación de Sabiduría (CD = 8 + DES + BC) o quedará aturdido durante 1 minuto. 1/descanso largo o gastando 3 dados de energía psiónica.',
  // Paladín (Paladin D&D 2024)
  'Imponer las manos': 'Tu toque bendito puede curar heridas. Tienes una reserva de poder de curación que se rellena tras finalizar un descanso largo (igual a 5 veces tu nivel de paladín).\nComo acción adicional, puedes tocar a una criatura (que puedes ser tú) y extraer energía de la reserva para restaurar Puntos de Golpe.\nTambién puedes gastar 5 puntos de golpe de la reserva para eliminar el estado de envenenada de la criatura (o aturdida, cegada, ensordecida, hechizada o paralizada a nivel 14 con Toque reparador).',
  'Lanzamiento de conjuros (Paladín)': 'Has aprendido a lanzar conjuros gracias a la oración y la meditación. Utilizas tu Carisma como aptitud mágica para tus conjuros de paladín (CD de salvación = 8 + mod. Carisma + BC; Ataque = mod. Carisma + BC). Puedes utilizar un símbolo sagrado como canalizador mágico.',
  'Castigo de paladín': 'Siempre tienes el conjuro castigo divino preparado. Además, puedes lanzarlo una vez sin gastar un espacio de conjuro, recuperando la capacidad de hacerlo tras finalizar un descanso largo.',
  'Canalizar divinidad': 'Puedes canalizar energía divina directamente de los Planos Exteriores (2 usos a nivel 3, 3 a nivel 11). Recuperas 1 uso tras un descanso corto y todos tras un descanso largo.\nEmpiezas con Sentidos divinos: como acción adicional, detectas celestiales, infernales, muertos vivientes y zonas sagradas/profanadas a 18 m durante 10 minutos.',
  'Subclase de paladín': 'Consigues una subclase de paladín de tu elección (Juramento de entrega, Juramento de la gloria, Juramento de los antiguos o Juramento de venganza) que te otorga rasgos en los niveles 3, 7, 15 y 20.',
  'Corcel fiel': 'Puedes invocar la ayuda de un corcel sobrenatural. Siempre tienes el conjuro hallar corcel preparado. También puedes lanzarlo una vez sin gastar un espacio de conjuro por descanso largo.',
  'Aura de protección': 'Irradias un aura protectora e invisible en una emanación de 3 m (9 m a nivel 18). Tus aliados dentro del aura y tú obtenéis un bonificador a todas las tiradas de salvación igual a tu modificador por Carisma (mínimo de +1).',
  'Abjurar de los enemigos': 'Como acción de magia, puedes gastar uno de los usos de Canalizar divinidad para sobrecoger a tus enemigos. Muestras tu símbolo sagrado o arma a una cantidad de criaturas a 18 m o menos igual a tu modificador por Carisma (mínimo 1). Cada objetivo deberá superar una tirada de salvación de Sabiduría o quedará asustado durante 1 minuto.',
  'Aura de coraje': 'Tus aliados y tú tenéis inmunidad al estado de asustado mientras estéis dentro de tu Aura de protección.',
  'Golpes radiantes': 'Tus golpes tienen un poder sobrenatural. Cuando aciertes a un objetivo con una tirada de ataque usando un arma cuerpo a cuerpo o un ataque sin armas, el objetivo recibirá 1d8 de daño radiante adicional.',
  'Toque reparador': 'Cuando uses Imponer las manos sobre una criatura, también podrás eliminar uno o más de los siguientes estados gastando 5 puntos de golpe de la reserva por cada uno: asustado, aturdido, cegado, ensordecido, hechizado o paralizado.',
  'Expansión de aura': 'Tu Aura de protección ahora es una emanación de 9 m (30 ft) de radio.',

  // Subclase: Juramento de Entrega
  'Arma sagrada': 'Cuando realizas la acción de atacar, puedes gastar uno de los usos de Canalizar divinidad para imbuir de energía positiva un arma cuerpo a cuerpo que sostengas. Durante 10 minutos o hasta que vuelvas a usar este rasgo, sumas tu modificador por Carisma a las tiradas de ataque que hagas con esa arma (mínimo de +1), y cada vez que aciertes con ella, haces que inflija su tipo de daño normal o daño radiante. El arma emite luz brillante en un radio de 6 m y luz tenue 6 m más allá. Puedes poner fin a este efecto antes (no requiere acción). El efecto también terminará si no llevas el arma contigo.',
  'Conjuros del juramento de entrega': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\n• Nvl 3: Escudo de fe, Protección contra el bien y el mal\n• Nvl 5: Auxilio, Zona de la verdad\n• Nvl 9: Disipar magia, Señal de esperanza\n• Nvl 13: Guardián de la fe, Libertad de movimiento\n• Nvl 17: Comunión, Golpe flamígero',
  'Aura de entrega': 'Tus aliados y tú tenéis inmunidad al estado de hechizados mientras estéis dentro de tu Aura de protección. Si un aliado hechizado entra en el aura, ese estado no tendrá efecto en él mientras esté dentro.',
  'Castigo protector': 'Tu castigo mágico ahora irradia energía protectora. Siempre que lances castigo divino, tus aliados y tú tenéis cobertura media mientras estéis dentro de tu Aura de protección. El aura tiene este beneficio hasta el principio de tu siguiente turno.',
  'Halo sagrado': 'Como acción adicional, puedes imbuir de poder divino tu Aura de protección durante 10 minutos (1/descanso largo o gastando un espacio de conjuro de nivel 5):\n• Daño radiante: Los enemigos que comiencen su turno en el aura reciben daño radiante igual a tu modificador por Carisma + bonificador por competencia.\n• Luz solar: El aura está llena de luz brillante del sol.\n• Protección sagrada: Tienes ventaja en las tiradas de salvación contra infernales o muertos vivientes.',

  // Subclase: Juramento de la Gloria
  'Atleta sin parangón': 'Como acción adicional, puedes gastar uno de los usos de Canalizar divinidad para potenciar tus capacidades atléticas. Durante 1 hora, tendrás ventaja en las pruebas de Fuerza (Atletismo) y Destreza (Acrobacias) y la distancia de tus saltos de longitud y de altura aumentará en 3 m.',
  'Castigo inspirador': 'Inmediatamente después de que lances castigo divino, puedes gastar uno de los usos de Canalizar divinidad para distribuir puntos de golpe temporales entre criaturas de tu elección (que puede incluirte a ti) que estén a 9 m o menos de ti. La cantidad total es igual a 2d8 + nivel de paladín.',
  'Conjuros del juramento de gloria': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\n• Nvl 3: Heroísmo, Saeta guía\n• Nvl 5: Arma mágica, Potenciar característica\n• Nvl 9: Acelerar, Protección contra energía\n• Nvl 13: Compulsión, Libertad de movimiento\n• Nvl 17: Conocer las leyendas, Presencia regia de Yolande',
  'Aura de celeridad': 'Tu velocidad aumenta en 3 m. Además, siempre que un aliado entre en tu Aura de protección por primera vez en un turno o comience su turno dentro de ella, la velocidad de ese aliado aumentará en 3 m hasta el final de su próximo turno.',
  'Defensa gloriosa': 'Si una tirada de ataque acierta a ti o a una criatura a 3 m o menos de ti, puedes usar tu reacción para sumar un bonificador a la CA del objetivo igual a tu modificador por Carisma (mínimo de +1). Si el ataque falla, como parte de esta reacción puedes hacer un ataque con arma contra el atacante. Usos iguales a tu mod. Carisma por descanso largo.',
  'Leyenda viviente': 'Como acción adicional, obtienes beneficios durante 10 minutos (1/descanso largo o gastando un espacio de nivel 5):\n• Carismático: Ventaja en todas las pruebas de Carisma.\n• Golpe certero: 1/turno, si fallas una tirada de ataque con arma, puedes hacer que acierte.\n• Repetir tiradas de salvación: Si fallas una tirada de salvación, puedes usar tu reacción para repetirla.',

  // Subclase: Juramento de los Antiguos
  'Ira de la naturaleza': 'Como acción de magia, puedes gastar uno de los usos de Canalizar divinidad para invocar enredaderas espectrales. Todas las criaturas de tu elección a 4,5 m o menos deben superar una salvación de Fuerza o tendrán el estado de apresadas durante 1 minuto (pueden repetir la salvación al final de cada turno).',
  'Conjuros del juramento de los antiguos': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\n• Nvl 3: Golpe apresador, Hablar con los animales\n• Nvl 5: Paso brumoso, Rayo de luna\n• Nvl 9: Crecimiento vegetal, Protección contra energía\n• Nvl 13: Piel pétrea, Tormenta de hielo\n• Nvl 17: Comunión con la naturaleza, Paso arbóreo',
  'Aura de salvaguarda': 'Tus aliados y tú tenéis resistencia al daño necrótico, psíquico y radiante mientras estéis dentro de tu Aura de protección.',
  'Centinela imperecedero': 'Cuando tus puntos de golpe se reduzcan a 0 pero no mueres inmediatamente, puedes quedarte con 1 punto de golpe y recuperar puntos igual a 3 veces tu nivel de paladín (1/descanso largo). Además, no puedes envejecer por medios mágicos.',
  'Campeón ancestral': 'Como acción adicional, imbuyes tu aura durante 1 minuto (1/descanso largo o espacio nivel 5):\n• Conjuros veloces: Lanzas conjuros de 1 acción usando una acción adicional.\n• Mermar la oposición: Enemigos en el aura tienen desventaja en salvaciones contra tus conjuros y Canalizar divinidad.\n• Regeneración: Al principio de tu turno, recuperas 10 HP.',

  // Subclase: Juramento de Venganza
  'Voto de enemistad': 'Cuando realizas la acción de atacar, puedes gastar un uso de Canalizar divinidad para jurar enemistad contra una criatura a 9 m o menos. Tienes ventaja en las tiradas de ataque contra ella durante 1 minuto (si sus HP caen a 0, puedes transferir el voto a otra criatura a 9 m sin acción).',
  'Conjuros del juramento de venganza': 'La magia de tu juramento garantiza que siempre tengas ciertos conjuros preparados:\n• Nvl 3: Marca del cazador, Perdición\n• Nvl 5: Inmovilizar persona, Paso brumoso\n• Nvl 9: Acelerar, Protección contra energía\n• Nvl 13: Destierro, Puerta dimensional\n• Nvl 17: Escudriñar, Inmovilizar monstruo',
  'Vengador implacable': 'Cuando aciertes un ataque de oportunidad contra una criatura, puedes reducir su velocidad a 0 hasta el final del turno y moverte hasta la mitad de tu velocidad como parte de la misma reacción sin provocar ataques de oportunidad.',
  'Espíritu vengativo': 'Inmediatamente después de que una criatura bajo los efectos de tu Voto de enemistad acierte o falle un ataque, puedes usar tu reacción para hacer un ataque cuerpo a cuerpo contra ella.',
  'Ángel vengador': 'Como acción adicional, obtienes beneficios durante 10 minutos (1/descanso largo o espacio nivel 5):\n• Aura aterradora: Enemigos que comiencen su turno en tu aura deben superar una salvación de Sabiduría o quedan asustados por 1 min (ataques contra criaturas asustadas tienen ventaja).\n• Vuelo: Te crecen alas espectrales con velocidad volando de 18 m y levitación.',
  // Monje (Monk D&D 2024)
  'Artes marciales': 'La práctica de las artes marciales te otorga un dominio de los estilos de combate que emplean ataques sin armas y armas de monje (armas cuerpo a cuerpo sencillas y marciales ligeras):\n• Ataque sin armas adicional: Puedes hacer un ataque sin armas como acción adicional.\n• Dado de Artes marciales: Puedes tirar 1d6 (1d8 a nvl 5, 1d10 a nvl 11, 1d12 a nvl 17) en lugar del daño normal de tus ataques sin armas y armas de monje.\n• Ataques diestros: Puedes usar tu modificador por Destreza en lugar de Fuerza para las tiradas de ataque y daño de tus ataques sin armas y armas de monje. Además, cuando uses agarre o empujón con tu ataque sin armas, puedes usar Destreza en lugar de Fuerza para la CD de salvación (CD = 8 + mod. Destreza + BC).',
  'Concentración de monje': 'Tu concentración y entrenamiento marcial te permiten utilizar una reserva interna de Puntos de Concentración (igual a tu nivel de monje) que recuperas tras un descanso corto o largo. Tu CD de salvación para rasgos de concentración es igual a 8 + mod. Sabiduría + BC.\nEmpiezas con tres de estos rasgos:\n• Defensa paciente: Puedes llevar a cabo la acción de destrabarse como acción adicional. De manera alternativa, puedes gastar 1 punto de concentración para llevar a cabo tanto la acción de destrabarse como la de esquivar como acción adicional.\n• Paso del viento: Puedes llevar a cabo la acción de correr como acción adicional. De manera alternativa, puedes gastar 1 punto de concentración para llevar a cabo tanto la acción de destrabarse como la de correr como acción adicional, y tu distancia de salto se duplicará durante el turno.\n• Ráfaga de golpes: Puedes gastar 1 punto de concentración para hacer dos ataques sin armas como acción adicional.',
  'Metabolismo asombroso': 'Cuando tires iniciativa, puedes recuperar todos los puntos de concentración gastados. Cuando lo hagas, tira tu dado de Artes marciales y recupera una cantidad de puntos de golpe igual a tu nivel de monje más el resultado obtenido. 1 uso por descanso largo.',
  'Movimiento sin armadura': 'Tu velocidad aumenta en 3 m (10 ft) si no llevas armadura ni portas un escudo. Esta bonificación aumenta a +4,5 m (nvl 6), +6 m (nvl 10), +7,5 m (nvl 14) y +9 m (nvl 18).',
  'Desviar ataques': 'Cuando una tirada de ataque te acierte y su daño incluya los tipos contundente, cortante o perforante, puedes usar tu reacción para reducir el daño total en 1d10 + mod. Destreza + nivel de monje.\nSi reduces el daño a 0, puedes gastar 1 punto de concentración para redirigir el ataque: elige una criatura a 1,5 m o menos (cuerpo a cuerpo) o a 18 m o menos (a distancia). La criatura debe superar una tirada de salvación de Destreza (vs CD de Concentración) o sufrirá un daño igual a dos tiradas de tu dado de Artes marciales + mod. Destreza del mismo tipo de daño.',
  'Subclase de monje': 'Consigues una subclase de monje de tu elección (Guerrero de la Mano Abierta, Guerrero de la Misericordia, Guerrero de la Sombra o Guerrero de los Elementos) que te otorga rasgos en los niveles 3, 6, 11 y 17.',
  'Caída lenta': 'Puedes llevar a cabo una reacción cuando caigas para reducir cualquier daño que sufras de la caída en una cantidad igual a cinco veces tu nivel de monje.',
  'Golpe aturdidor': 'Una vez por turno cuando aciertes a una criatura con un arma de monje o un ataque sin armas, puedes gastar 1 punto de concentración para intentar propinar un golpe aturdidor. El objetivo deberá hacer una tirada de salvación de Constitución (vs CD de Concentración). Si la falla, tendrá el estado de aturdido hasta el principio de tu siguiente turno. Si la supera, su velocidad se reducirá a la mitad hasta el principio de tu siguiente turno y la siguiente tirada de ataque realizada contra él tendrá ventaja.',
  'Golpes potenciados': 'Siempre que inflijas daño con tu ataque sin armas, puedes elegir entre causar daño de fuerza o su tipo de daño normal.',
  'Evasión': 'Cuando sufras un efecto que te permita hacer una tirada de salvación de Destreza para sufrir solo la mitad de daño, no recibes daño alguno si la superas y solo sufres la mitad si la fallas. No te beneficias si tienes el estado de incapacitado.',
  'Movimiento acrobático': 'Mientras no lleves armadura ni portes un escudo, obtienes la capacidad de moverte por superficies verticales y sobre líquidos sin caerte.',
  'Autorrestablecimiento': 'Por pura fuerza de voluntad, puedes eliminar uno de los siguientes estados que te afecten al final de cada uno de tus turnos: asustado, envenenado o hechizado. Además, privarte de comida y bebida no te aplica niveles de cansancio.',
  'Concentración agudizada': 'Tus rasgos Defensa paciente, Paso del viento y Ráfaga de golpes obtienen los siguientes beneficios:\n• Defensa paciente: Cuando gastes un punto de concentración para usar Defensa paciente, obtienes una cantidad de puntos de golpe temporales igual al resultado de dos tiradas de tu dado de Artes marciales.\n• Paso del viento: Cuando gastes un punto de concentración para usar Paso del viento, puedes elegir una criatura voluntaria Grande o más pequeña que esté a 1,5 m o menos de ti. Moverás a la criatura contigo hasta el final de tu turno sin provocar ataques de oportunidad.\n• Ráfaga de golpes: Puedes gastar 1 punto de concentración para usar Ráfaga de golpes y hacer tres ataques sin armas en lugar de dos.',
  'Desviar energía': 'Ahora puedes usar tu rasgo Desviar ataques contra ataques que causen cualquier tipo de daño, no solo contundente, cortante o perforante.',
  'Superviviente disciplinado': 'Tu disciplina física y mental te otorga competencia en todas las tiradas de salvación. Además, cuando hagas una tirada de salvación y falles, puedes gastar 1 punto de concentración para repetirla, pero deberás utilizar el nuevo resultado.',
  'Concentración perfecta': 'Cuando tires iniciativa y no utilices Metabolismo asombroso, recuperas los puntos de concentración gastados hasta que tengas 4 si te quedan 3 o menos.',
  'Defensa superior': 'Al principio de tu turno, puedes gastar 3 puntos de concentración para protegerte del daño durante 1 minuto o hasta que tengas el estado de incapacitado. Durante ese tiempo, tendrás resistencia a todo el daño excepto al de fuerza.',
  'Cuerpo y mente': 'Has llevado tu cuerpo y mente a otro nivel. Tus puntuaciones de Destreza y Sabiduría aumentan en 4, hasta un máximo de 25.',

  // Guerrero de la Mano Abierta
  'Técnica de la mano abierta': 'Siempre que aciertes a una criatura con un ataque proporcionado por Ráfaga de golpes, puedes imponerle uno de los siguientes efectos:\n• Derribar: El objetivo deberá superar una tirada de salvación de Destreza (vs CD de Concentración) o tendrá el estado de derribado.\n• Desconcertar: El objetivo no podrá realizar ataques de oportunidad hasta el principio de su siguiente turno.\n• Empujar: El objetivo deberá superar una tirada de salvación de Fuerza (vs CD de Concentración) o será empujado hasta 4,5 m respecto a ti.',
  'Plenitud de cuerpo': 'Obtienes la capacidad de sanar tu propio cuerpo. Como acción adicional, puedes tirar tu dado de Artes marciales. Recuperas una cantidad de puntos de golpe igual al resultado más tu modificador por Sabiduría (recuperas 1 punto de golpe como mínimo).\nPuedes usar este rasgo una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez) y recuperas todos los usos tras finalizar un descanso largo.',
  'Paso veloz': 'Cuando utilices una acción adicional que no sea Paso del viento, podrás usar también Paso del viento inmediatamente después de esa acción adicional.',
  'Palma estremecedora': 'Consigues la capacidad de transmitir vibraciones letales al cuerpo de un oponente. Cuando aciertes a una criatura con un ataque sin armas, puedes gastar 4 puntos de concentración para iniciar estas vibraciones imperceptibles, que durarán tantos días como tu nivel de monje. Las vibraciones son inofensivas, salvo si usas tu acción para hacer que terminen. Como alternativa, cuando lleves a cabo la acción de atacar en tu turno, puedes renunciar a uno de los ataques para poner fin a las vibraciones. Para ello, el objetivo y tú debéis estar en el mismo plano de existencia. Cuando les pongas fin, el objetivo deberá realizar una tirada de salvación de Constitución (vs CD de Concentración); sufrirá 10d12 de daño de fuerza si la falla o la mitad del daño si la supera.\nSolo puedes tener a una criatura bajo el efecto de este rasgo al mismo tiempo. Puedes poner fin a las vibraciones de forma inocua (no requiere acción).',

  // Guerrero de la Misericordia
  'Instrumentos de misericordia': 'Ganas competencia en las habilidades Medicina y Perspicacia y con los útiles de herborista.',
  'Mano de aflicción': 'Una vez por turno, cuando aciertes a una criatura con un ataque sin armas y le causes daño, puedes gastar 1 punto de concentración para infligir una cantidad adicional de daño necrótico igual al resultado de una tirada de tu dado de Artes marciales más tu modificador por Sabiduría.',
  'Mano de curación': 'Como acción de magia, puedes gastar 1 punto de concentración para tocar a una criatura y hacer que recupere una cantidad de puntos de golpe igual al resultado de una tirada de tu dado de Artes marciales más tu modificador por Sabiduría.\nCuando uses Ráfaga de golpes, puedes sustituir uno de los ataques sin armas por un uso de este rasgo sin gastar un punto de concentración para curar.',
  'Toque de Galeno': 'Tu Mano de aflicción y Mano de curación mejoran:\n• Mano de aflicción: Cuando uses Mano de aflicción en una criatura, también podrás infligirle el estado de envenenada hasta el final de tu siguiente turno.\n• Mano de curación: Cuando uses Mano de curación, también podrás poner fin a uno de los siguientes estados en la criatura a la que cures: aturdida, cegada, ensordecida, envenenada o paralizada.',
  'Ráfaga de curación y aflicción': 'Cuando uses Ráfaga de golpes, puedes sustituir cada uno de los ataques sin armas por un uso de Mano de curación sin gastar puntos de concentración para curar.\nAdemás, cuando hagas un ataque sin armas con Ráfaga de golpes y causes daño, podrás usar Mano de aflicción en ese ataque sin gastar un punto de concentración (máximo una vez por turno).\nPuedes utilizar estos beneficios una cantidad de veces igual a tu modificador por Sabiduría (mínimo una vez). Recuperas todos los usos tras finalizar un descanso largo.',
  'Mano de misericordia suprema': 'Tu dominio de la energía vital te abre las puertas de la misericordia suprema. Como acción de magia, puedes tocar el cadáver de una criatura que haya muerto en las últimas 24 horas y gastar 5 puntos de concentración. La criatura volverá a la vida con una cantidad de puntos de golpe igual a 4d10 más tu modificador por Sabiduría. Si la criatura murió mientras tenía alguno de los siguientes estados, revivirá sin ellos: aturdida, cegada, ensordecida, envenenada y paralizada.\nCuando uses este rasgo, no podrás volver a hacerlo hasta que finalices un descanso largo.',

  // Guerrero de la Sombra
  'Artes sombrías': 'Has aprendido a manejar el poder del Páramo Sombrío, lo que te proporciona los siguientes beneficios:\n• Ilusiones sombrías: Conoces el truco ilusión menor. La Sabiduría es tu aptitud mágica para lanzarlo.\n• Oscuridad: Puedes gastar 1 punto de concentración para lanzar el conjuro oscuridad sin necesidad de componentes. Puedes ver dentro de la zona del conjuro cuando lo lanzas con este rasgo. Mientras se mantenga el conjuro, podrás mover la zona de oscuridad a un espacio a 18 m o menos de ti al principio de cada uno de tus turnos.\n• Visión en la oscuridad: Obtienes visión en la oscuridad hasta 18 m. Si ya posees visión en la oscuridad, su alcance aumenta en 18 m.',
  'Paso entre sombras': 'Cuando estés por completo en una zona de luz tenue u oscuridad, puedes utilizar una acción adicional para teletransportarte hasta 18 m a un espacio sin ocupar que puedas ver y que también esté en condiciones de luz tenue u oscuridad. Luego tendrás ventaja en el siguiente ataque cuerpo a cuerpo que hagas antes del final de ese turno.',
  'Paso entre sombras mejorado': 'Puedes recurrir a tu conexión con el Páramo Sombrío para potenciar tu teletransportación. Cuando uses Paso entre sombras, puedes gastar 1 punto de concentración para eliminar el requisito de comenzar y terminar en una zona de luz tenue u oscuridad para ese uso del rasgo. Como parte de esta acción adicional, puedes hacer un ataque sin armas inmediatamente después de teletransportarte.',
  'Capa de sombras': 'Como acción de magia cuando estés por completo en una zona de luz tenue u oscuridad, puedes gastar 3 puntos de concentración para envolverte en sombras durante 1 minuto, hasta que tengas el estado de incapacitado o hasta que me termines tu turno en una zona de luz brillante. Mientras estés envuelto en estas sombras, obtienes los siguientes beneficios:\n• Incorporeidad parcial: Puedes atravesar espacios ocupados como si fueran terreno difícil.\n• Invisibilidad: Tienes el estado de invisible.\n• Ráfaga de sombras: Puedes utilizar tu Ráfaga de golpes sin gastar puntos de concentración.',

  // Guerrero de los Elementos
  'Armonía con los elementos': 'Al principio de tu turno, puedes gastar 1 punto de concentración para imbuirte de energía elemental. La energía dura 10 minutos o hasta que tengas el estado de incapacitado. Mientras este rasgo esté activo, obtienes los siguientes beneficios:\n• Alcance: Cuando realizas un ataque sin armas, tu alcance es 3 m superior al normal, ya que la energía elemental surge de ti.\n• Golpes elementales: Siempre que aciertes con tu ataque sin armas, puedes hacer que cause el tipo de daño que quieras entre ácido, frío, fuego, relámpago o trueno en vez de su tipo de daño normal. Cuando inflijas uno de estos tipos con él, también puedes obligar al objetivo a hacer una tirada de salvación de Fuerza. Si la falla, puedes mover al objetivo hasta 3 m hacia ti o en dirección contraria, ya que la energía elemental se arremolina a su alrededor.',
  'Manipular los elementos': 'Conoces el truco elementalismo. La Sabiduría es tu aptitud mágica para lanzarlo.',
  'Explosión elemental': 'Como acción de magia, puedes gastar 2 puntos de concentración para que la energía elemental explote en una esfera de 6 m de radio centrada en un punto a 36 m o menos de ti. Elige un tipo de daño: ácido, frío, fuego, relámpago o trueno.\nTodas las criaturas situadas en esa esfera deberán hacer una tirada de salvación de Destreza. Si la fallan, sufrirán una cantidad de daño del tipo elegido igual al resultado de tres tiradas de tu dado de Artes marciales. Si la superan, recibirán la mitad de ese daño.',
  'Paso de los elementos': 'Mientras tu Armonía con los elementos esté activa, tendrás también una velocidad nadando y una velocidad volando iguales a tu velocidad.',
  'Paradigma elemental': 'Mientras tu Armonía con los elementos esté activa, obtienes también los siguientes beneficios:\n• Golpes potenciados: Una vez en cada uno de tus turnos, puedes causar a un objetivo una cantidad adicional de daño igual al resultado de una tirada de tu dado de Artes marciales cuando le aciertes con un ataque sin armas. El daño adicional será del mismo tipo que inflija el ataque.\n• Paso destructivo: Cuando utilices tu Paso del viento, tu velocidad aumenta en 6 m hasta el final del turno. Durante ese tiempo, cualquier criatura de tu elección sufre una cantidad de daño igual al resultado de una tirada de tu dado de Artes marciales cuando entres en un espacio a 1,5 m o menos de ella. Elige el tipo de daño: ácido, frío, fuego, relámpago o trueno. Una criatura solo puede sufrir este daño una vez por turno.\n• Resistencia al daño: Ganas resistencia a uno de los siguientes tipos de daño, a tu elección: ácido, frío, fuego, relámpago o trueno. Al principio de cada uno de tus turnos, puedes cambiar esta elección.',

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
  'Rasgo de subclase': 'Obtienes un beneficio específico de la subclase elegida para tu aventurero.',
  'Instinto salvaje': 'Tu instinto es tan agudo que obtienes ventaja en las tiradas de Iniciativa. Si estás sorprendido al principio del combate y no estás incapacitado, puedes actuar normalmente si entras en furia.',
  'Salto instintivo': 'Como parte de la acción adicional que usas para entrar en Furia, puedes moverte hasta la mitad de tu velocidad de movimiento.',
  'Golpe brutal': 'Cuando aciertes un ataque temerario, puedes aplicar efectos adicionales como empujar 15 pies, reducir velocidad o añadir daño adicional (+1d10).',
  'Furia implacable': 'Si caes a 0 HP mientras estás en furia, puedes hacer una salvación de Con CD 10 para quedarte a 1 HP. Cada uso exitoso aumenta la CD en 5 hasta un descanso corto o largo.',
  'Golpe brutal mejorado': 'Tus opciones de Golpe brutal mejoran, infligiendo más daño o aplicando peores efectos sobre los enemigos.',
  'Furia persistente': 'Tu furia es tan intensa que solo termina prematuramente si caes inconsciente o si decides finalizarla.',
  'Poderío indómito': 'Si el resultado de una prueba de Fuerza es menor que tu puntuación de Fuerza, puedes usar tu puntuación de Fuerza en lugar del resultado.',
  'Don épico': 'Obtienes un don épico que incrementa tus puntuaciones de característica de forma extraordinaria y confiere un beneficio legendario.',
  'Campeón primordial': 'Tus puntuaciones de Fuerza y Constitución aumentan en 4 puntos, hasta un máximo de 24.',

  'Lanzamiento de conjuros': 'Puedes lanzar conjuros gracias a tu magia innata. Utilizas tu Carisma como tu característica de lanzamiento para tus conjuros de hechicero.',
  'Hechicería innata': 'Como acción adicional, puedes desatar tu magia latente durante 1 minuto. Durante este tiempo:\n• La CD de salvación de tus conjuros de hechicero aumenta en 1.\n• Tienes ventaja en las tiradas de ataque de los conjuros de hechicero que lances.\nPuedes usar este rasgo dos veces y recuperas todos los usos tras finalizar un descanso largo.',
  'Fuente de magia': 'Puedes acceder a una fuente de magia que te otorga Puntos de Hechicería. Puedes gastar estos puntos para crear espacios de conjuro adicionales (de nivel 1 a 5) o convertir tus espacios de conjuro en puntos de hechicería.',
  'Metamagia': 'Ganas la capacidad de moldear tus conjuros. Eliges dos opciones de metamagia para alterar tus conjuros al lanzarlos gastando puntos de hechicería.',
  'Subclase de hechicero': 'Eliges tu origen mágico de subclase (como Hechicería aberrante, Hechicería de magia salvaje, Hechicería dracónica o Hechicería mecánica) que te otorga rasgos especiales en los niveles 3, 6, 14 y 18.',
  'Recuperación mágica': 'Tras finalizar un descanso corto, puedes recuperar una cantidad de puntos de hechicería igual o inferior a la mitad de tu nivel (redondeando hacia abajo). No podrás volver a hacerlo hasta que finalices un descanso largo.',
  'Encarnación mágica': 'Si no te quedan usos de Hechicería innata, puedes activar el rasgo gastando 2 puntos de hechicería. Además, mientras Hechicería innata esté activa, puedes usar hasta dos opciones de metamagia en un mismo conjuro.',
  'Metamagia mejorada': 'Obtienes dos opciones más de Metamagia a tu elección (totalizando 4 opciones).',
  'Metamagia suprema': 'Obtienes dos opciones más de Metamagia a tu elección (totalizando 6 opciones).',
  'Apoteosis arcana': 'Mientras tengas activo Hechicería innata, puedes usar una opción de metamagia en cada uno de tus turnos sin gastar puntos de hechicería.',

  // Guerrero (Fighter)
  'Estilo de combate': 'Adoptas un estilo de combate particular como tu especialidad (ej. Duelista, Gran arma, Defensa, Arquería, etc.) que te otorga bonos pasivos en combate.',
  'Recuperación del viento': 'Puedes activar una fuerza vital de reserva para sanarte. Como acción adicional, recuperas 1d10 + nivel de guerrero puntos de golpe.',
  'Oleada de acción': 'Puedes superar temporalmente tus límites normales. En tu turno, puedes realizar una acción adicional además de tu acción normal.',
  'Táctica defensiva': 'Obtienes un bonificador a tus tiradas de salvación de Destreza mientras lleves armadura.',
  'Subclase de Guerrero': 'Eliges una especialización de subclase (como Caballero Arcano, Campeón, Guerrero Psiónico o Maestro del Combate) que te otorga rasgos especiales en los niveles 3, 7, 10 y 15.',
  'Indómito': 'Puedes volver a lanzar una tirada de salvación fallida. Si lo haces, debes usar el nuevo resultado y sumas tu nivel de guerrero a la tirada.',
  'Tácticas indómitas': 'Cuando usas tu rasgo Indómito, puedes gastar un uso de Recuperación del viento para sumarle un bono extra a la tirada de salvación.',
  'Recuperación mejorada': 'Recuperas todos tus usos gastados de Recuperación del viento tras finalizar un descanso corto o largo.',

  // Guerrero Subclases: Campeón
  'Crítico mejorado': 'Tus ataques con arma obtienen un golpe crítico con un resultado de 19 o 20 en el d20.',
  'Atleta notable': 'Tienes ventaja en pruebas de Fuerza (Atletismo) y Destreza (Acrobacias). Además, la distancia de tus saltos aumenta.',
  'Estilo de combate adicional': 'Obtienes una segunda opción de Estilo de combate a tu elección.',
  'Crítico superior': 'Obtienes un golpe crítico con un resultado de 18, 19 o 20 en el d20.',
  'Superviviente (Campeón)': 'Al inicio de tu turno, si tienes menos de la mitad de tus HP máximos, recuperas una cantidad de HP igual a 5 + tu mod de Constitución.',

  // Caballero Arcano
  'Lanzamiento de conjuros (Arcano)': 'Puedes lanzar conjuros de mago seleccionados de la escuela de abjuración o evocación.',
  'Vínculo con el arma': 'Realizas un ritual con un arma para crear un vínculo. Puedes invocar el arma a tu mano como acción adicional y no te la pueden quitar.',
  'Magia de guerra': 'Cuando usas tu acción para lanzar un truco, puedes realizar un ataque con arma como acción adicional.',
  'Embate de carga': 'Cuando usas tu acción de Oleada de acción, puedes teletransportarte hasta 9 m a un espacio desocupado antes o después de la acción extra.',
  'Teletransporte arcano': 'Puedes teletransportarte hasta 9 m como parte de tu acción de Oleada de acción.',
  'Magia de guerra mejorada': 'Cuando lanzas un conjuro, puedes realizar un ataque con arma como acción adicional.',

  // Guerrero Psiónico
  'Poder psiónico (Guerrero)': 'Obtienes dados de energía psiónica (d6 a d12 según nivel) que alimentan tus habilidades psiónicas.',
  'Fuerza telequinética': 'Puedes mover mentalmente criaturas u objetos pesados a distancia.',
  'Escudo mental': 'Puedes levantar un escudo invisible de fuerza para proteger a un aliado de sufrir daño.',
  'Salto psiónico': 'Puedes impulsarte por el aire a tu velocidad de movimiento.',
  'Baluarte guardián': 'Creas una zona defensiva de protección para tus aliados.',
  'Empuje psiónico': 'Puedes infligir daño de fuerza adicional y derribar a un enemigo.',
  'Mente psiónica suprema': 'Tus dados psiónicos se regeneran más rápido y tus golpes psiónicos son devastadores.',

  // Maestro del Combate
  'Dados de supremacía': 'Ganas dados de supremacía d8 para alimentar tus maniobras tácticas de combate.',
  'Maniobras de combate': 'Aprendes maniobras tácticas de combate (ej. Ataque preciso, Finta, Parada, etc.) que aplican efectos especiales en tus ataques.',
  'Estudiante de la guerra': 'Competencia con un tipo de herramientas de artesano a tu elección.',
  'Conoce a tu enemigo': 'Si observas o interactúas con una criatura, el DM te dice características de esta.',
  'Supremacía mejorada': 'Tus dados de supremacía aumentan a d10.',
  'Implacable': 'Si empiezas un combate sin dados de supremacía, recuperas uno.',
  'Supremacía definitiva': 'Tus dados de supremacía aumentan a d12.',

  'Mente telepática': 'Como acción adicional, creas una conexión telepática con una criatura que puedas ver a un máximo de 9 metros. Puedes comunicarte telepáticamente a través de esta conexión mientras estéis a una distancia igual o inferior a tu nivel en millas.',
  'Conjuros psiónicos': 'Siempre tienes preparados ciertos conjuros psiónicos adicionales: Nvl 3: Brazos de Hadar, perdición, desintegrar, risa horrible de Tasha; Nvl 5: Detección de pensamientos, calmar emociones; Nvl 7: Enviar, desatar; Nvl 9: Conocer las leyendas, invocar dragón.',
  'Defensas psíquicas': 'Tienes resistencia al daño psíquico y ventaja en las tiradas de salvación para evitar o poner fin a los estados de asustado o hechizado.',
  'Hechicería psiónica': 'Cuando lanzas cualquier conjuro de tu rasgo Conjuros psiónicos, puedes gastar una cantidad de puntos de hechicería igual al nivel del conjuro en lugar de un espacio. Al hacerlo, no requieres componentes verbales, somáticos ni materiales (salvo consumibles/con coste).',
  'Revelación en carne': 'Como acción adicional, gastas 1+ puntos para alterar tu cuerpo por 10 min. Obtienes uno de estos por punto gastado:\n• Adaptación acuática: Duplica vel. nadar y respiras bajo el agua.\n• Movimiento anélido: Cuerpo baboso; te cuelas por huecos de 2.5 cm y escapas de agarres por 1.5 m.\n• Ver lo invisible: Ves criaturas invisibles a 18 m.\n• Vuelo brillante: Vuelas y levitas a tu velocidad.',
  'Implosión deformadora': 'Como acción de magia, te teletransportas hasta 36 m. Criaturas a 9 m del origen deben superar salvación de Fuerza o recibir 3d10 daño de fuerza y ser arrastradas al origen. 1 uso por descanso largo (o gastando 5 puntos).',

  'Mareas del caos': 'Puedes obtener ventaja en una prueba de d20. Recuperas el rasgo al lanzar un conjuro de espacio (tirando en la tabla de Sobrecarga de magia salvaje) o tras un descanso largo.',
  'Sobrecarga de magia salvaje': 'Al lanzar un conjuro con espacio de nivel 1+, puedes tirar 1d20. Si sacas un 20, tiras en la tabla de Sobrecarga de magia salvaje para desatar un efecto mágico caótico.',
  'Doblegar la suerte': 'Reacción. Cuando una criatura que veas tira un d20, puedes gastar 1 punto de hechicería para tirar 1d4 y sumarlo o restarlo a su resultado.',
  'Caos controlado': 'Siempre que tires en la tabla de Sobrecarga de magia salvaje, puedes tirar dos veces y elegir el efecto que prefieras.',
  'Sobrecarga domada': '1 vez por descanso largo, al lanzar un conjuro con espacio, puedes elegir directamente cualquier efecto de la tabla de Sobrecarga de magia salvaje (salvo la última fila) en lugar de tirar.',

  'Resiliencia dracónica': 'Tus puntos de golpe máximos aumentan en 3 y en 1 más por cada nivel de hechicero en el futuro. Mientras no lleves armadura, tu CA base es 10 + Destreza + Carisma.',
  'Conjuros dracónicos': 'Siempre tienes preparados: Nvl 3: Aliento de dragón, alterar el propio aspecto, orbe cromático, orden imperiosa; Nvl 5: Terror, volar; Nvl 7: Hechizar monstruo, ojo arcano; Nvl 9: Conocer las leyendas, invocar dragón.',
  'Afinidad elemental': 'Elige un tipo de daño (ácido, frío, fuego, relámpago o veneno). Tienes resistencia a ese daño, y al lanzar un conjuro de ese tipo sumas Carisma a una tirada de daño.',
  'Alas de dragón': 'Acción adicional. Te crecen alas por 1 hora. Vuelo de 18 m. Cuesta 3 puntos restablecer su uso antes de un descanso largo.',
  'Compañero dragón': 'Puedes lanzar invocar dragón sin componentes materiales y gratis una vez por descanso largo, pudiendo omitir concentración (duración 1 min).',

  'Conjuros mecánicos': 'Siempre tienes preparados: Nvl 3: Alarma, auxilio, protección contra el bien/mal, restablecimiento menor; Nvl 5: Disipar magia, protección contra energía; Nvl 7: Invocar autómata, libertad de movimiento; Nvl 9: Muro de fuerza, restablecimiento mayor.',
  'Restablecer equilibrio': 'Reacción para cancelar ventaja o desventaja en un d20 a 18 m. Usos iguales a tu modificador por Carisma (mínimo 1) por descanso largo.',
  'Bastión de la ley': 'Como acción de magia, gastas 1-5 puntos para escudo de dados d8. Reduces daño tirando dados d8. Dura hasta descanso largo o reuso.',
  'Trance de orden': 'Acción adicional. Entras en trance por 1 min. Ataques contra ti no tienen ventaja y tiradas de d20 menores o iguales a 9 se tratan como 10. Restablecer cuesta 5 puntos.',
  'Cabalgata mecánica': 'Acción de magia. Cubo de 9 m invoca espíritus autómatas por 1 turno: cura 100 HP repartidos, repara objetos dañados, o disipa conjuros de nivel 6 o inferior. Restablecer cuesta 7 puntos.'
};

const SPELL_DESCRIPTIONS_MAP: { [key: string]: string } = {
  // Trucos
  'Salpicadura ácida': 'Evocación (1 acción). Creas una burbuja de ácido. Uno o dos objetivos a 18m deben superar salvación de Destreza o recibir 1d6 daño ácido.',
  'Guardia de cuchillas': 'Abjuración (1 acción). Trazas un sigilo de protección en el aire. Tienes resistencia al daño físico hasta el final de tu próximo turno.',
  'Toque helado': 'Nigromancia (1 acción). Ataque de conjuro a 36m. Causa 1d8 daño necrótico y el objetivo no puede recuperar puntos de golpe hasta tu próximo turno.',
  'Luces danzantes': 'Evocación (Concentración). Creas hasta cuatro luces del tamaño de linternas que puedes mover como acción adicional.',
  'Descarga de fuego': 'Evocación (1 acción). Ataque de conjuro a 36m. Causa 1d10 daño de fuego y prende objetos inflamables.',
  'Amigos': 'Encantamiento (Concentración). Tienes ventaja en todas las pruebas de Carisma dirigidas a una criatura no hostil de tu elección.',
  'Luz': 'Evocación (1 acción). Hace que un objeto brille con luz brillante en 6m y luz tenue en 6m adicionales durante 1 hora.',
  'Mano de mago': 'Conjuración (1 acción). Invoca una mano espectral a 9m que puedes usar para manipular objetos (hasta 5 kg).',
  'Ilusión menor': 'Ilusión (1 acción). Creas un sonido o una imagen tridimensional a 9m que dura 1 minuto.',
  'Mensaje': 'Transmutación (1 acción). Envías un mensaje susurrado a una criatura a 36m que puede responder de la misma forma en secreto.',
  'Salva de veneno': 'Conjuración (1 acción). Creas una nube de gas venenoso. El objetivo a 3m debe superar salvación de Constitución o recibir 1d12 daño de veneno.',
  'Elementalismo': 'Transmutación. Creas efectos elementales menores como brisas, polvo, chispas o vapor.',
  'Fragmento mental': 'Encantamiento. Causa 1d6 daño psíquico y resta 1d4 a la próxima salvación del objetivo.',
  'Impacto certero': 'Adivinación. Obtienes ventaja en tu próxima tirada de ataque contra un objetivo a tu alcance.',
  'Reparar': 'Transmutación. Reparas una única rotura o fisura en un objeto de menos de 30 cm.',
  'Tronar': 'Evocación (1 acción). Creas una onda de fuerza sónica. 1d8 daño de trueno y empuja 3m.',
  'Armadura de mago': 'Abjuración (1 acción). Envuelve a una criatura sin armadura en fuerza mágica, CA base = 13 + Des.',
  'Dormir': 'Encantamiento. Duerme a criaturas en base a un pozo de 5d8 puntos de golpe.',
  'Falso vida': 'Nigromancia. Otorga 1d4+4 puntos de golpe temporales por 1 hora.',
  'Imagen silenciosa': 'Ilusión. Creas una imagen tridimensional a 18m sin sonido que puedes animar.',
  'Ola atronadora': 'Evocación. Causa 2d8 daño de trueno en un cubo de 4.5m y empuja a las criaturas.',
  'Rayo de hechicería': 'Evocación. Ataque de conjuro a 36m causa 1d12 daño de relámpago, y puedes infligir daño continuo en turnos siguientes.',
  'Rayo nauseabundo': 'Nigromancia. Ataque de conjuro causa 2d8 daño de veneno y envenena.',
  'Rociada de color': 'Ilusión. Destello de luces ciega a criaturas en cono de 4.5m.',
  'Salto': 'Transmutación. Triplica la distancia de salto de un objetivo durante 1 minuto.',
  'Abrir': 'Transmutación. Abre instantáneamente una puerta o cofre cerrado mágica o físicamente.',
  'Clavo mental': 'Adivinación. Inflige 3d6 daño psíquico a un objetivo a 18m y conoces su ubicación.',
  'Contorno borroso': 'Ilusión. Te vuelves borroso, haciendo que los atacantes tengan desventaja en sus tiradas.',
  'Esfera de flames': 'Conjuración. Crea una esfera de fuego de 1.5m que puedes mover para quemar enemigos por 2d6 daño.',
  'Fuerza fantasmal': 'Ilusión. Creas una ilusión mental que inflige daño psíquico al objetivo haciéndole creer que es real.',
  'Hacer añicos': 'Evocación. Ruido ensordecedor que inflige 3d8 daño de trueno, los objetos no orgánicos tienen desventaja.',
  'Hoja de fuego': 'Evocación. Creas una espada de fuego en tu mano que causa 3d6 daño de fuego al impactar.',
  'Inmovilizar persona': 'Encantamiento. Paraliza a un humanoide si falla su salvación de Sabiduría.',
  'Nube de dagas': 'Conjuración. Torbellino de dagas voladoras en un cubo de 1.5m causa 4d4 daño cortante continuo.',
  'Potenciar característica': 'Transmutación. Otorga ventaja en pruebas del atributo seleccionado.',
  'Rayo abrasador': 'Evocación. Disparas tres rayos de fuego de 2d6 de daño a 36m.',
  'Telaraña': 'Conjuración. Crea una red de telarañas resbaladizas y pegajosas que restringen a los enemigos.',
  'Trepar cual arácnido': 'Transmutación. Otorga la habilidad de trepar por paredes y techos con las manos libres.',
  'Vigor arcano': 'Abjuración. Recuperas 2d8 puntos de golpe como acción.',
  'Acelerar': 'Transmutación. Otorga una acción adicional, +2 CA y doble velocidad al objetivo durante 1 minuto.',
  'Caminar sobre el agua': 'Transmutación. Permite a diez aliados caminar sobre líquidos durante 1 hora.',
  'Clarividencia': 'Adivinación. Crea un sensor invisible para escuchar o ver un área distante.',
  'Contrahchizo': 'Abjuración. Reacción para interrumpir y anular el conjuro que está lanzando otra criatura.',
  'Desplazamiento': 'Transmutación. Te proyecta a un lado, causando desventaja en todos los ataques contra ti.',
  'Don de lenguas': 'Adivinación. Puedes entender y ser entendido en cualquier idioma hablado.',
  'Forma gaseosa': 'Transmutación. Transforma a un objetivo en una nube de gas con resistencia a daño.',
  'Imagen mayor': 'Ilusión. Crea una ilusión realista con sonido, olor y temperatura.',
  'Luz del día': 'Evocación. Esfera de 18m de luz brillante equivalente a la luz solar.',
  'Nube apestosa': 'Conjuración. Crea una nube de gas que causa náuseas a quienes fallen Constitución.',
  'Patrón hipnótico': 'Ilusión. Un patrón de colores parpadeantes incapacita y duerme a enemigos.',
  'Ralentizar': 'Transmutación. Reduce a la mitad la velocidad, CA y número de ataques de los enemigos.',
  'Respirar bajo el agua': 'Transmutación. Permite respirar bajo el agua durante 24 horas.',
  'Toque vampírico': 'Nigromancia. Ataque de toque causa 3d6 daño necrótico y te sana la mitad.',
  'Tormenta de aguanieve': 'Conjuración. Lluvia congelante crea terreno difícil y extingue fuegos.',
  'Confusión': 'Encantamiento. Confunde a los enemigos, obligándoles a actuar aleatoriamente.',
  'Destierro': 'Abjuración. Destierra a un objetivo a otro plano de existencia durante 1 minuto.',
  'Dominar bestia': 'Encantamiento. Tomas el control telepático absoluto de una bestia.',
  'Escudo de fuego': 'Evocación. Te rodeas de llamas que otorgan resistencia al frío o fuego y dañan a atacantes en 2d8.',
  'Esfera vitriólica': 'Evocación. Lanzas una bola de ácido que explota causando 10d4 daño de ácido.',
  'Invisibilidad mejorada': 'Ilusión. Te vuelves invisible y no se cancela aunque ataques o lances conjuros.',
  'Marchitar': 'Nigromancia. Absorbe la humedad corporal de un objetivo infligiendo 8d8 daño necrótico.',
  'Muro de fuego': 'Evocación. Crea una muralla de fuego ardiente que inflige 5d8 daño de fuego a quien pase.',
  'Piel pétrea': 'Abjuración. Otorga resistencia contra daño físico no mágico.',
  'Polimorfar': 'Transmutación. Transforma a una criatura en una bestia de tu elección.',
  'Puerta dimensional': 'Conjuración. Te teletransportas a ti y a un aliado a una distancia de hasta 150m.',
  'Tormenta de hielo': 'Evocación. Lluvia de granizo inflige 2d8 daño por impacto y 4d6 daño por frío.',
  'Animar objetos': 'Transmutación. Anima objetos inanimados para que ataquen a tus órdenes.',
  'Apariencia': 'Ilusión. Cambias el aspecto visual de hasta diez aliados.',
  'Círculo de teletransportación': 'Conjuración. Abre un portal de teletransportación a un círculo rúnico permanente.',
  'Cono de frío': 'Evocación. Ráfaga helada en cono de 18m causa 8d8 daño de frío.',
  'Creación': 'Ilusión. Creas materia no viva como madera, piedra o metal temporalmente.',
  'Dominar persona': 'Encantamiento. Tomas el control telepático absoluto de un humanoide.',
  'Estática sináptica': 'Evocación. Explosión de energía psíquica inflige 8d6 daño psíquico y confunde.',
  'Inmovilizar monstruo': 'Encantamiento. Paraliza a cualquier criatura que falle salvación de Sabiduría.',
  'Mano de Bigby': 'Evocación. Invoca una mano gigante de fuerza que golpea, empuja o sujeta enemigos.',
  'Muro de piedra': 'Evocación. Crea una barrera física de paneles de piedra sólida.',
  'Nube aniquiladora': 'Conjuración. Crea una nube de gas venenoso que desciende y causa 5d8 daño de veneno por ronda.',
  'Plaga de insectos': 'Conjuración. Enjambre de langostas devoradoras causa 4d10 daño perforante continuo.',
  'Telequinesis': 'Transmutación. Mueves o levantas mentalmente criaturas u objetos pesados.',
  'Prestidigitación': 'Transmutación (1 acción). Realizas trucos mágicos menores (limpiar/ensuciar, calentar/enfriar, encender velas, etc.).',
  'Rayo de escarcha': 'Evocación (1 acción). Rayo helado a 18m. Causa 1d8 daño de frío y reduce la velocidad del objetivo en 3m.',
  'Apretón electrizante': 'Evocación (1 acción). Toque eléctrico. Causa 1d8 daño de relámpago, da ventaja si lleva armadura de metal y no puede usar reacciones este turno.',

  // Nivel 1
  'Manos ardientes': 'Evocación. Cono de 4,5m causa 3d6 daño de fuego, mitad si supera salvación de Destreza.',
  'Encantarse': 'Encantamiento. Una criatura a 9m debe superar salvación de Sabiduría o quedará fascinada por ti.',
  'Orbe cromático': 'Evocación. Lanzador arroja una esfera de energía elemental a 27m que inflige 3d8 de daño del tipo elegido.',
  'Disparos de color': 'Ilusión. Un estallido de luces de colores a 4,5m ciega a criaturas según sus HP.',
  'Comprender idiomas': 'Adivinación. Entiendes el significado de cualquier idioma hablado o escrito durante 1 hora.',
  'Detectar magia': 'Adivinación (Concentración). Percibes la presencia de magia a 9m y ves el aura de escuelas mágicas.',
  'Disfrazarse': 'Ilusión. Alteras tu apariencia física y equipo con una ilusión durante 1 hora.',
  'Retirada expeditiva': 'Transmutación (Concentración). Permite realizar la acción de Correr como acción adicional.',
  'Caída de pluma': 'Transmutación (Reacción). Hasta 5 criaturas cayendo descienden lentamente (3m por ronda) y no sufren daño por caída.',
  'Nube de oscurecimiento': 'Conjuración. Creas una nube de niebla de 6m de radio que ciega la visión.',
  'Grasa': 'Conjuración. Terreno resbaladizo de 3m. Quien entre o empiece su turno debe superar Destreza o caer derribado.',
  'Cuchillo de hielo': 'Conjuración. Proyectil de hielo a 18m causa 1d10 daño perforante, y explota en frío causando 2d6 daño en 1,5m.',
  'Proyectil mágico': 'Evocación. Creas tres dardos mágicos infalibles que impactan causando 1d4+1 daño de fuerza cada uno.',
  'Escudo': 'Abjuración (Reacción). Te otorga +5 a la CA e inmunidad a proyectil mágico hasta el inicio de tu próximo turno.',
  'Onda de choque': 'Evocación. Onda de fuerza en 4,5m causa 2d8 daño de trueno y empuja 3m.',
  'Rayo de enfermedad': 'Nigromancia. Causa 2d8 daño de veneno y envenena si falla salvación de Constitución.',
  'Caída silenciosa': 'Ilusión. Creas una zona de silencio absoluto de 4,5m.',

  // Nivel 2
  'Agrandar/Reducir': 'Transmutación (Concentración). Duplica o divide a la mitad el tamaño y peso de un objetivo.',
  'Ceguera/Sordera': 'Nigromancia. Ciega o ensordece a un objetivo si falla salvación de Constitución.',
  'Fuerza de toro': 'Transmutación. Otorga ventaja en pruebas de Fuerza, Destreza o Constitución por 1 hora.',
  'Nublar': 'Ilusión (Concentración). Tu cuerpo se vuelve borroso, causando desventaja en los ataques contra ti.',
  'Corona de locura': 'Encantamiento (Concentración). Obliga a un humanoide a atacar a sus aliados.',
  'Oscuridad': 'Evocación (Concentración). Crea una esfera de oscuridad mágica de 4,5m de radio que bloquea la visión en penumbra.',
  'Visión en la oscuridad': 'Transmutación. Otorga visión en la oscuridad a 18m durante 8 horas.',
  'Ver invisibilidad': 'Adivinación. Ves criaturas y objetos invisibles o en el Plano Etereo durante 1 hora.',
  'Ráfaga de viento': 'Evocación (Concentración). Línea de viento de 18m empuja a criaturas y apaga llamas.',
  'Hechizar persona': 'Encantamiento. Hechiza a un humanoide si falla salvación de Sabiduría.',
  'Levitar': 'Transmutación (Concentración). Eleva a un objetivo hasta 6m verticalmente.',
  'Localizar objeto': 'Adivinación (Concentración). Sientes la dirección de un objeto conocido a 300m.',
  'Imagen múltiple': 'Ilusión. Creas tres duplicados ilusorios de ti mismo que confunden los ataques enemigos.',
  'Paso brumoso': 'Conjuración (Acción adicional). Te teletransportas hasta 9m a un espacio vacío visible.',
  'Rayo de debilitamiento': 'Nigromancia (Concentración). Rayo reduce a la mitad el daño de ataques físicos del objetivo.',
  'Piel de corteza': 'Abjuración (Concentración). La CA del objetivo no puede ser menor de 16.',
  'Arma espiritual': 'Evocación. Invoca un arma flotante que ataca como acción adicional e inflige 1d8 + mod daño de fuerza.',
  
  // Nivel 3
  'Bola de fuego': 'Evocación. Explosión de fuego en 6m de radio a 45m inflige 8d6 daño de fuego.',
  'Relámpago': 'Evocación. Línea eléctrica de 30m inflige 8d6 daño de relámpago.',
  'Volar': 'Transmutación (Concentración). Otorga velocidad de vuelo de 18m durante 10 minutos.',
  'Disipar magia': 'Abjuración. Termina conjuros activos en un objetivo u objeto.',
  'Terror': 'Ilusión (Concentración). Proyecta una imagen fantasmal que asusta a enemigos en un cono de 9m.',
  'Alterar el propio aspecto': 'Transmutación (Concentración). Modifica tu cuerpo para obtener respiración acuática, armas naturales o cambiar de apariencia.',
  'Aliento de dragón': 'Transmutación (Concentración). Escupes energía elemental (cono de 4,5m, 3d6 de daño) como acción en cada turno.',
  'Invocar autómata': 'Conjuración (Concentración). Invoca un espíritu mecánico con ataques de fuerza.',
  'Libertad de movimiento': 'Abjuración. El objetivo ignora terreno difícil y no puede ser paralizado ni retenido.',
  'Muro de fuerza': 'Evocación (Concentración). Crea una barrera invisible de fuerza indestructible de hasta 10 paneles de 3m.',
  'Restablecimiento mayor': 'Abjuración. Elimina reducciones de características, cansancio, maldiciones o petrificación.',
  'Restablecimiento menor': 'Abjuración. Cura los estados de cegado, ensordecido, paralizado o envenenado.',
  'Auxilio': 'Abjuración. Incrementa los puntos de golpe máximos y actuales en 5 a tres aliados durante 8 horas.',
  'Alarma': 'Abjuración. Protege un área dando una alerta mental o audible si una criatura entra.',
  'Protección contra el bien y el mal': 'Abjuración (Concentración). Protege contra aberraciones, celestiales, elementales, feéricos, demonios y muertos vivientes.',
  'Protección contra energía': 'Abjuración (Concentración). Otorga resistencia a ácido, frío, fuego, relámpago o trueno.',
  'Conocer las leyendas': 'Adivinación. Trae a tu mente relatos o datos históricos sobre una persona, lugar u objeto legendario.'
};

const METAMAGIC_DESCRIPTIONS_MAP: { [key: string]: string } = {
  'Conjuro Acelerado': 'Coste: 2 puntos. Permite lanzar un conjuro de 1 acción como acción adicional este turno.',
  'Conjuro Buscador': 'Coste: 1 punto. Permite volver a tirar un d20 fallido en un ataque de conjuro.',
  'Conjuro Cuidado': 'Coste: 1 punto. Protege hasta tu Carisma de aliados de sufrir daño en salvaciones de tus conjuros.',
  'Conjuro Distante': 'Coste: 1 punto. Duplica el alcance de un conjuro o da alcance de 9 m a uno de toque.',
  'Conjuro Extendido': 'Coste: 1 punto. Duplica la duración de un conjuro de al menos 1 minuto (máx. 24h) y da ventaja en salvaciones para mantener concentración.',
  'Conjuro Gemelo': 'Coste: 1 punto. Incrementa en 1 el nivel de un conjuro monobjetivo escalable para designar un objetivo extra.',
  'Conjuro Intensificado': 'Coste: 2 puntos. Da desventaja a un objetivo en su primera salvación contra el conjuro.',
  'Conjuro Potenciado': 'Coste: 1 punto. Permite repetir hasta Carisma dados de daño de un conjuro.',
  'Conjuro Sutil': 'Coste: 1 punto. Permite lanzar un conjuro sin componentes verbales, somáticos ni materiales (salvo consumibles/con coste).',
  'Conjuro Transmutado': 'Coste: 1 punto. Cambia el tipo de daño del conjuro a ácido, frío, fuego, rayo, trueno o veneno.'
};
