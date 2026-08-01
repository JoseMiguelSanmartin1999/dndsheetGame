import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, tap, combineLatest } from 'rxjs';
import { GameDataService, DndClass, DndOrigin, DndBackground } from '../../data/services/game-data.service';

interface Attribute {
  name: string;
  key: string;
  value: number;
  description: string;
}

interface GuideTab {
  title: string;
  icon: string;
  content: string;
}

@Component({
  selector: 'app-character-creator',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- CONTENEDOR DE CARGA / ERROR DE CONEXIÓN -->
    <div 
      *ngIf="loading || errorLoading" 
      class="min-h-screen bg-[#08080a] bg-radial from-[#130d0d] via-[#08080a] to-[#040405] text-neutral-200 flex items-center justify-center p-6"
    >
      <!-- Pantalla de Carga (Spinner) -->
      <div *ngIf="loading" class="text-center space-y-6 animate-pulse">
        <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
          <!-- Anillo de Fuego Externo Giratorio -->
          <div class="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-red-700 border-b-transparent border-l-transparent animate-spin duration-1000"></div>
          <!-- Icono de Dado en el centro -->
          <span class="text-4xl">🎲</span>
        </div>
        <div class="space-y-1">
          <h2 class="text-xl font-serif font-bold text-[#d4af37] tracking-widest uppercase">Invocando la Forja</h2>
          <p class="text-xs text-neutral-500">Cargando clases, trasfondos y orígenes ancestrales...</p>
          <p class="text-[10px] text-[#d4af37] font-mono mt-2 bg-[#18181c] border border-neutral-850 px-3 py-1 rounded inline-block">{{ debugStatus }}</p>
        </div>
      </div>

      <!-- Pantalla de Error (Servidor desconectado) -->
      <div 
        *ngIf="errorLoading" 
        class="w-full max-w-md bg-[#121215] border border-red-800/40 rounded-2xl p-8 shadow-2xl text-center space-y-6"
      >
        <span class="text-5xl">⚡</span>
        <div class="space-y-2">
          <h2 class="text-lg font-serif font-extrabold text-red-500 uppercase tracking-wider">Error de Conexión</h2>
          <p class="text-xs text-neutral-400 leading-relaxed">
            No se pudo establecer comunicación con el templo de datos. Asegúrate de que el servidor de NestJS esté en ejecución en el puerto 3000.
          </p>
        </div>
        <button 
          (click)="loadGameData()"
          class="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-700/50 text-red-200 font-semibold py-2.5 rounded-lg text-xs tracking-widest uppercase transition duration-200 cursor-pointer"
        >
          Reintentar Conexión
        </button>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL (CREADOR) -->
    <div 
      *ngIf="!loading && !errorLoading"
      class="min-h-screen bg-[#08080a] bg-radial from-[#130d0d] via-[#08080a] to-[#040405] text-neutral-200 p-6 md:p-10 pb-20 relative"
    >
      
      <!-- Modal de la Guía de Selección de Clases -->
      <div 
        *ngIf="showGuide" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      >
        <div class="w-full max-w-4xl bg-[#121215] border border-[#d4af37]/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Cabecera del Manual -->
          <div class="p-6 bg-[#0d0d0f]/90 border-b border-neutral-900 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
              <span class="text-3xl">📖</span>
              <div>
                <h2 class="text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase">
                  Manual de Selección de Clase
                </h2>
                <p class="text-xs text-neutral-500 font-light">Factores clave para forjar tu destino en el reino.</p>
              </div>
            </div>
            <button 
              (click)="showGuide = false"
              class="text-neutral-400 hover:text-red-400 transition text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          <!-- Cuerpo de la Guía -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div class="w-full md:w-1/3 bg-[#0d0d0f]/50 border-r border-neutral-900 p-4 overflow-y-auto space-y-1 shrink-0">
              <button 
                *ngFor="let tab of guideTabs; let idx = index"
                (click)="activeTab = idx"
                class="w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition duration-200 border cursor-pointer flex items-center gap-3 focus:outline-none uppercase tracking-wider"
                [ngClass]="activeTab === idx ? 'bg-red-950/20 border-red-500/40 text-[#d4af37] shadow-sm' : 'bg-transparent border-transparent hover:bg-neutral-855/40 text-neutral-400 hover:text-neutral-300'"
              >
                <span>{{ tab.icon }}</span>
                <span>{{ tab.title }}</span>
              </button>
            </div>

            <div class="flex-1 p-6 md:p-8 overflow-y-auto space-y-4">
              <h3 class="text-[#d4af37] font-serif font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                <span>{{ guideTabs[activeTab].icon }}</span>
                <span>{{ guideTabs[activeTab].title }}</span>
              </h3>
              <div 
                class="text-sm text-neutral-400 leading-relaxed space-y-4 font-light"
                [innerHTML]="guideTabs[activeTab].content"
              ></div>
            </div>
          </div>

          <!-- Pie del Manual -->
          <div class="p-6 bg-[#0d0d0f]/90 border-t border-neutral-900 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <span class="text-xs text-neutral-500 italic">"La mejor elección es con la que te sientas cómodo jugando."</span>
            <button 
              (click)="showGuide = false"
              class="w-full sm:w-auto bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition duration-300 uppercase tracking-widest border border-red-500/25 shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] font-serif cursor-pointer"
            >
              Comenzar la Forja de Héroe
            </button>
          </div>
        </div>
      </div>

      <!-- Interfaz Principal del Creador -->
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Cabecera e Indicadores de Progreso -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-6">
          <div class="space-y-1 text-center md:text-left flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h1 class="text-3xl font-serif font-extrabold tracking-wider text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FORJA DE AVENTUREROS
              </h1>
              <p class="text-xs text-neutral-400 font-light">Sigue los pasos ancestrales para dar vida a tu personaje.</p>
            </div>
            
            <div class="flex items-center gap-2 mt-1 self-center sm:self-auto">
              <button 
                *ngIf="currentStep === 1"
                (click)="showGuide = true"
                class="text-[11px] bg-[#1e1e24] hover:bg-neutral-800 border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5 h-fit"
              >
                📖 Manual de Guía
              </button>
              
              <button 
                (click)="showPreview = true"
                class="text-[11px] bg-gradient-to-r from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 border border-[#d4af37]/40 hover:border-[#d4af37] text-white px-3 py-1.5 rounded-lg font-serif transition duration-200 cursor-pointer flex items-center gap-1.5 h-fit shadow-md hover:shadow-[0_0_10px_rgba(212,175,55,0.25)] select-none"
              >
                🔍 Vista Previa Ficha
              </button>
            </div>
          </div>

          <!-- Barra de Progreso de Creación (Reordenado) -->
          <div class="flex items-center gap-2 md:gap-4 bg-[#121215] border border-neutral-800/80 px-4 py-2.5 rounded-xl shadow-lg">
            <!-- Paso 1: Clase -->
            <button (click)="goToStep(1)" class="flex items-center gap-1.5 cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 1 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-850 border border-neutral-700 text-neutral-400'"
              >
                1
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 1 ? 'text-[#d4af37]' : 'text-neutral-400'">Clase</span>
            </button>
            <div class="w-6 h-px bg-neutral-800"></div>

            <!-- Paso 2: Trasfondo -->
            <button (click)="goToStep(2)" [disabled]="!classChosen" class="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 2 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-850 border border-neutral-700 text-neutral-400'"
              >
                2
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 2 ? 'text-[#d4af37]' : 'text-neutral-400'">Trasfondo</span>
            </button>
            <div class="w-6 h-px bg-neutral-800"></div>

            <!-- Paso 3: Origen -->
            <button (click)="goToStep(3)" [disabled]="!backgroundChosen" class="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 3 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-850 border border-neutral-700 text-neutral-400'"
              >
                3
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 3 ? 'text-[#d4af37]' : 'text-neutral-400'">Origen</span>
            </button>
            <div class="w-6 h-px bg-neutral-800"></div>

            <!-- Paso 4: Atributos -->
            <button (click)="goToStep(4)" [disabled]="!originChosen" class="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 4 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-855 border border-neutral-700 text-neutral-400'"
              >
                4
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 4 ? 'text-[#d4af37]' : 'text-neutral-400'">Atributos</span>
            </button>
            <div class="w-6 h-px bg-neutral-800"></div>

            <!-- Paso 5: Equipo -->
            <button (click)="goToStep(5)" [disabled]="!attributesChosen" class="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 5 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-855 border border-neutral-700 text-neutral-400'"
              >
                5
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 5 ? 'text-[#d4af37]' : 'text-neutral-400'">Equipo</span>
            </button>
            <div class="w-6 h-px bg-neutral-800"></div>

            <!-- Paso 6: Resumen -->
            <button (click)="goToStep(6)" [disabled]="!equipmentChosen" class="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 6 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-855 border border-neutral-700 text-neutral-400'"
              >
                6
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 6 ? 'text-[#d4af37]' : 'text-neutral-400'">Resumen</span>
            </button>
          </div>
        </div>

        <!-- ================= PASO 1: SELECCIÓN DE CLASE ================= -->
        <div *ngIf="currentStep === 1" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          <!-- Columna 1: Menú Lateral de Clases -->
          <aside class="lg:col-span-3 bg-[#121215] border border-neutral-800/80 rounded-xl p-4 shadow-xl space-y-2 h-[680px] overflow-y-auto custom-scrollbar">
            <h3 class="text-[#d4af37] font-serif font-bold text-sm tracking-wider uppercase border-b border-neutral-900/80 pb-2 mb-3">
              Clases del Manual
            </h3>
            
            <button 
              *ngFor="let c of classes; let idx = index" 
              (click)="selectClass(idx)"
              class="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition duration-200 border cursor-pointer flex items-center justify-between focus:outline-none"
              [ngClass]="selectedClassIdx === idx ? 'bg-red-950/20 border-red-500/50 text-[#d4af37] shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-transparent border-transparent hover:bg-neutral-800/50 hover:text-neutral-200 text-neutral-400'"
            >
              <span class="flex items-center gap-2">
                <span class="text-base select-none">{{ c.icon }}</span>
                <span>{{ c.name }}</span>
              </span>
              <span *ngIf="selectedClassIdx === idx" class="text-red-500 text-xs animate-pulse">🔥</span>
            </button>
          </aside>

          <!-- Columna 2: Título e Imagen de la Clase -->
          <main class="lg:col-span-5 space-y-4">
            <div class="bg-[#121215] border border-[#d4af37]/15 rounded-xl overflow-hidden shadow-2xl relative group h-[680px] flex flex-col">
              <div class="p-4 bg-[#0d0d0f]/90 border-b border-neutral-900 flex justify-between items-center">
                <h2 class="text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase">
                  {{ activeClass.name }}
                </h2>
                <span class="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-red-950/40 border border-red-800/40 text-red-400 rounded-md">
                  {{ activeClass.preference }}
                </span>
              </div>

              <div class="flex-1 relative overflow-hidden bg-gradient-to-b from-[#141416] to-[#0c0c0f] flex items-center justify-center p-4">
                <img 
                  [src]="'/assets/clases/' + activeClass.image" 
                  [alt]="activeClass.name" 
                  class="max-w-full max-h-[550px] object-contain transition-all duration-500 select-none group-hover:scale-102 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                  (load)="onImageLoad()"
                  [class.opacity-0]="!imageLoaded"
                  [class.opacity-100]="imageLoaded"
                />
                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121215] to-transparent opacity-90 pointer-events-none"></div>
                
                <div *ngIf="!imageLoaded" class="absolute inset-0 flex items-center justify-center bg-[#121215]">
                  <svg class="animate-spin h-10 w-10 text-[#d4af37]" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <div class="absolute bottom-4 left-4 right-4 z-10 text-center">
                  <p class="text-xs italic text-neutral-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] bg-neutral-950/70 border border-neutral-850 px-4 py-2 rounded-lg max-w-md mx-auto leading-relaxed backdrop-blur-sm">
                    "{{ activeClass.quote }}"
                  </p>
                </div>
              </div>
            </div>
          </main>

          <!-- Columna 3: Características y Botón de Avance -->
          <section class="lg:col-span-4 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-xl h-[680px] flex flex-col justify-between overflow-hidden">
            <!-- Contenedor Scrollable -->
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4 text-left">
              <div class="border-b border-neutral-900 pb-3">
                <h3 class="text-[#d4af37] font-serif font-bold text-base tracking-wider uppercase">Características de Clase</h3>
                <p class="text-[10px] text-neutral-500">Mecánicas base y requisitos de rol.</p>
              </div>

              <!-- Atributo Requerido/Principal -->
              <div class="space-y-2 relative">
                <div class="flex items-center gap-1.5">
                  <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Atributo Primario Requerido</h4>
                  <div class="relative group inline-block">
                    <button type="button" class="w-4 h-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-[#d4af37] text-[10px] font-bold flex items-center justify-center cursor-pointer transition select-none focus:outline-none">
                      ?
                    </button>
                    <div class="absolute right-0 top-6 w-64 bg-[#16161a] border border-[#d4af37]/35 text-neutral-300 text-xs rounded-lg p-3 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 z-50 text-left whitespace-normal backdrop-blur-sm">
                      <p class="font-serif font-bold text-[#d4af37] border-b border-neutral-800 pb-1 mb-2 text-[10px] uppercase tracking-widest">¿Qué miden los Atributos?</p>
                      <div class="space-y-1.5 text-[11px] leading-relaxed">
                        <div><strong class="text-neutral-200">Fuerza:</strong> Poderío físico.</div>
                        <div><strong class="text-neutral-200">Destreza:</strong> Agilidad, reflejos y equilibrio.</div>
                        <div><strong class="text-neutral-200">Constitución:</strong> Salud y aguante.</div>
                        <div><strong class="text-neutral-200">Inteligencia:</strong> Raciocinio y memoria.</div>
                        <div><strong class="text-neutral-200">Sabiduría:</strong> Perspicacia y fortaleza mental.</div>
                        <div><strong class="text-neutral-200">Carisma:</strong> Confianza, aplomo y encanto.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xl">🌟</span>
                  <div>
                    <p class="text-sm font-bold text-neutral-200">{{ activeClass.primaryStat }}</p>
                    <p class="text-[10px] text-neutral-500 leading-tight">Preferencia estadística para lanzar conjuros y ataques base.</p>
                  </div>
                </div>
              </div>

              <!-- Complejidad -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Complejidad de Juego</h4>
                <div class="flex items-center justify-between bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xs font-semibold text-neutral-200">Nivel de Dificultad</span>
                  <div class="flex items-center gap-2">
                    <span 
                      class="text-[9px] uppercase font-bold px-2 py-0.5 rounded border"
                      [ngClass]="{
                        'bg-emerald-950/40 border-emerald-800/50 text-emerald-400': activeClass.complexity === 'Baja',
                        'bg-amber-950/40 border-amber-800/50 text-amber-400': activeClass.complexity === 'Media',
                        'bg-red-950/40 border-red-800/50 text-red-400': activeClass.complexity === 'Alta'
                      }"
                    >
                      {{ activeClass.complexity }}
                    </span>
                    <div class="flex gap-1">
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Baja' || activeClass.complexity === 'Media' || activeClass.complexity === 'Alta' ? 'bg-emerald-500' : 'bg-neutral-855'"></div>
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Media' || activeClass.complexity === 'Alta' ? 'bg-amber-500' : 'bg-neutral-855'"></div>
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Alta' ? 'bg-red-500' : 'bg-neutral-855'"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dado de Golpe -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Dado de Golpe (Resistencia)</h4>
                <div class="flex items-center justify-between bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-sm font-semibold text-neutral-200">{{ activeClass.hitDie }} por nivel</span>
                  <span class="text-lg font-bold text-[#d4af37] font-serif">🎲 {{ activeClass.hitDie }}</span>
                </div>
              </div>

              <!-- Competencias Iniciales de la Clase (Basado en la Tabla del Manual) -->
              <div class="space-y-2.5 bg-[#18181c]/60 border border-neutral-800 p-4 rounded-lg text-xs leading-relaxed text-neutral-300">
                <h4 class="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider mb-1.5 border-b border-neutral-800 pb-1">Competencias Iniciales</h4>
                <div><strong>Salvaciones:</strong> {{ getClassDetailsByClassName(activeClass.name).savingThrows }}</div>
                
                <!-- Habilidades a elegir -->
                <div class="mt-1.5 border-t border-neutral-900/60 pt-2 space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-[10px] uppercase font-bold text-neutral-450 tracking-wider">Habilidades a elegir:</span>
                    <span class="text-[9px] bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded text-red-400 font-mono font-bold select-none">
                      Elige {{ getClassSkillLimit(activeClass.name) }}
                    </span>
                  </div>
                  
                  <!-- Checkboxes sin Tooltips Clipeables -->
                  <div class="grid grid-cols-2 gap-2 pt-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let skill of getClassSkillList(activeClass.name)"
                      (mouseenter)="hoveredSkill = skill"
                      (mouseleave)="hoveredSkill = null"
                      class="flex items-center gap-1.5 p-1.5 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="isClassSkillSelected(skill) ? 'bg-amber-950/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-400'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="isClassSkillSelected(skill)"
                        (change)="toggleClassSkill(skill)"
                        [disabled]="!isClassSkillSelected(skill) && selectedClassSkills.length >= getClassSkillLimit(activeClass.name)"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40"
                      />
                      <span 
                        class="text-[10px] font-medium truncate"
                        (click)="toggleClassSkill(skill)"
                      >
                        {{ skill }}
                      </span>
                    </div>
                  </div>

                  <!-- Detalle de la Habilidad Dinámico (No se corta, Estilo Baldur's Gate 3) -->
                  <div class="mt-2 bg-[#0d0d0f] border border-neutral-850 rounded-lg p-3.5 min-h-[85px] flex flex-col justify-center transition-all duration-200">
                    <div *ngIf="hoveredSkill" class="space-y-1 animate-fade-in text-left">
                      <div class="flex justify-between items-center border-b border-neutral-800 pb-1">
                        <strong class="text-[#d4af37] text-[10px] font-serif uppercase tracking-wider font-extrabold">
                          {{ hoveredSkill }}
                        </strong>
                        <span class="text-[8px] bg-neutral-900 text-neutral-450 border border-neutral-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {{ getSkillAttribute(hoveredSkill) }}
                        </span>
                      </div>
                      <p class="text-[9px] text-neutral-350 leading-relaxed font-light font-sans mt-1">
                        {{ getSkillDescription(hoveredSkill) }}
                      </p>
                    </div>
                    
                    <div *ngIf="!hoveredSkill" class="text-center text-[9px] text-neutral-500 italic select-none">
                      Pasa el cursor sobre una habilidad para ver su uso y atributo.
                    </div>
                  </div>
                </div>

                <div class="mt-1 border-t border-neutral-900/60 pt-2"><strong>Herramientas:</strong> {{ getClassDetailsByClassName(activeClass.name).tools }}</div>
                <div class="mt-1"><strong>Armaduras:</strong> {{ getClassDetailsByClassName(activeClass.name).armor }}</div>
                <div class="mt-1"><strong>Armas:</strong> {{ getClassDetailsByClassName(activeClass.name).weapons }}</div>
              </div>

              <!-- Descripción Completa -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Descripción de tu Senda</h4>
                <p class="text-xs text-neutral-400 leading-relaxed bg-[#18181c] border border-neutral-800 p-4 rounded-lg h-36 overflow-y-auto custom-scrollbar">
                  {{ activeClass.description }}
                </p>
              </div>
            </div>

            <!-- Botón de Continuar Fijo Abajo -->
            <div class="border-t border-neutral-900 pt-4 bg-[#121215] shrink-0">
              <button 
                (click)="onConfirmClass()"
                [disabled]="selectedClassSkills.length < getClassSkillLimit(activeClass.name)"
                class="w-full bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-sm border-t border-red-500/20 font-serif cursor-pointer"
              >
                Elegir {{ activeClass.name }} y Continuar
              </button>
            </div>
          </section>

        </div>

        <!-- ================= PASO 2: SELECCIÓN DE TRASFONDO ================= -->
        <div *ngIf="currentStep === 2" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          <!-- Columna 1: Menú Lateral de Trasfondos -->
          <aside class="lg:col-span-3 bg-[#121215] border border-neutral-800/80 rounded-xl p-4 shadow-xl space-y-2 h-[680px] overflow-y-auto custom-scrollbar">
            <h3 class="text-[#d4af37] font-serif font-bold text-sm tracking-wider uppercase border-b border-neutral-900/80 pb-2 mb-3">
              Trasfondos ({{ backgrounds.length }})
            </h3>
            
            <button 
              *ngFor="let b of backgrounds; let idx = index" 
              (click)="selectBackground(idx)"
              class="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition duration-200 border cursor-pointer flex items-center justify-between focus:outline-none"
              [ngClass]="selectedBackgroundIdx === idx ? 'bg-red-950/20 border-red-500/50 text-[#d4af37] shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-transparent border-transparent hover:bg-neutral-800/50 hover:text-neutral-200 text-neutral-400'"
            >
              <span class="flex items-center gap-2">
                <span class="text-base select-none">{{ b.icon }}</span>
                <span>{{ b.name }}</span>
              </span>
              <span *ngIf="selectedBackgroundIdx === idx" class="text-amber-500 text-xs animate-pulse">📜</span>
            </button>
          </aside>

          <!-- Columna 2: Título e Imagen del Trasfondo -->
          <main class="lg:col-span-5 space-y-4">
            <div class="bg-[#121215] border border-[#d4af37]/15 rounded-xl overflow-hidden shadow-2xl relative group h-[680px] flex flex-col">
              <div class="p-4 bg-[#0d0d0f]/90 border-b border-neutral-900 flex justify-between items-center">
                <h2 class="text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase">
                  {{ activeBackground.name }}
                </h2>
                <span class="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-amber-950/40 border border-amber-800/40 text-amber-400 rounded-md">
                  Vida Pasada
                </span>
              </div>

              <div class="flex-1 relative overflow-hidden bg-gradient-to-b from-[#141416] to-[#0c0c0f] flex items-center justify-center p-4">
                <img 
                  [src]="'/assets/' + activeBackground.image" 
                  [alt]="activeBackground.name" 
                  class="max-w-full max-h-[550px] object-contain transition-all duration-500 select-none group-hover:scale-102"
                  (load)="onImageLoad()"
                  (error)="onBgImageError($event)"
                  [class.opacity-0]="!imageLoaded"
                  [class.opacity-100]="imageLoaded"
                />

                <!-- Renders overlay decorativo si es la imagen fallback (Logo.png) -->
                <div 
                  *ngIf="isFallbackBg" 
                  class="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 p-6 bg-neutral-950/30"
                >
                  <div class="w-36 h-36 rounded-full bg-[#18181c]/90 border border-[#d4af37]/35 flex items-center justify-center text-7xl shadow-2xl relative group-hover:scale-105 transition duration-500">
                    <span class="absolute inset-0 rounded-full bg-[#d4af37]/5 animate-ping"></span>
                    {{ activeBackground.icon }}
                  </div>
                  <h3 class="text-xs uppercase font-bold tracking-widest text-[#d4af37] font-serif">Concepto Narrativo</h3>
                </div>

                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121215] to-transparent opacity-90 pointer-events-none"></div>
                
                <div *ngIf="!imageLoaded" class="absolute inset-0 flex items-center justify-center bg-[#121215]">
                  <svg class="animate-spin h-10 w-10 text-[#d4af37]" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <div class="absolute bottom-4 left-4 right-4 z-20 text-center">
                  <p class="text-xs italic text-neutral-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] bg-neutral-950/70 border border-neutral-850 px-4 py-2 rounded-lg max-w-md mx-auto leading-relaxed backdrop-blur-sm">
                    "{{ activeBackground.concept }}"
                  </p>
                </div>
              </div>
            </div>
          </main>

          <!-- Columna 3: Características del Trasfondo -->
          <section class="lg:col-span-4 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-xl h-[680px] flex flex-col justify-between overflow-hidden">
            <!-- Contenedor Scrollable -->
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4 text-left">
              <div class="border-b border-neutral-900 pb-3">
                <h3 class="text-[#d4af37] font-serif font-bold text-base tracking-wider uppercase">Dotes y Habilidades</h3>
                <p class="text-[10px] text-neutral-500">Beneficios mecánicos de tu historia personal.</p>
              </div>

              <!-- Habilidades de Clase Ya Seleccionadas -->
              <div class="bg-neutral-900/50 border border-neutral-850/60 p-4 rounded-xl space-y-2">
                <h4 class="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">Habilidades ya elegidas (Clase)</h4>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span *ngIf="selectedClassSkills.length === 0" class="text-[10px] text-neutral-500 italic">Ninguna seleccionada</span>
                  <span 
                    *ngFor="let s of selectedClassSkills" 
                    class="text-[9px] bg-neutral-900/80 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded font-medium"
                  >
                    {{ s }}
                  </span>
                </div>
              </div>

              <!-- Puntuaciones que Mejora -->
              <div class="space-y-3">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex justify-between items-center">
                  <span>Atributos que potencia</span>
                  <span class="text-[10px] text-amber-500 font-bold bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded">
                    Reserva: {{ 3 - getUsedBackgroundStatsPoints() }} pts
                  </span>
                </h4>
                <div class="space-y-2 bg-[#18181c] border border-neutral-800 p-4 rounded-lg">
                  <p class="text-[10px] text-[#d4af37] font-bold font-serif uppercase tracking-wider mb-1">
                    {{ activeBackground.statImprovement }}
                  </p>
                  <p class="text-[9px] text-neutral-400 leading-tight mb-2">
                    Distribuye +2/+1 o +1/+1/+1 entre estos atributos (máx +2 por atributo):
                  </p>
                  
                  <div class="space-y-2">
                    <div *ngFor="let statKey of getAvailableBackgroundStats()" class="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-md text-left">
                      <span class="text-xs font-bold text-neutral-300">{{ getFullAttributeName(statKey) }}</span>
                      
                      <div class="flex items-center gap-2">
                        <button 
                          (click)="modifyBackgroundStat(statKey, -1)"
                          [disabled]="(backgroundStatsAllocation[statKey] || 0) <= 0"
                          class="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs cursor-pointer transition select-none"
                        >
                          -
                        </button>
                        <span class="text-sm font-bold text-amber-400 font-mono w-6 text-center">
                          +{{ backgroundStatsAllocation[statKey] || 0 }}
                        </span>
                        <button 
                          (click)="modifyBackgroundStat(statKey, 1)"
                          [disabled]="(backgroundStatsAllocation[statKey] || 0) >= 2 || getUsedBackgroundStatsPoints() >= 3"
                          class="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs cursor-pointer transition select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <span *ngIf="getUsedBackgroundStatsPoints() < 3" class="text-[9px] text-red-400 font-bold block mt-1 animate-pulse">
                    ⚠️ Debes asignar los 3 puntos antes de continuar.
                  </span>
                </div>
              </div>

              <!-- Dote Clave -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Dote Clave Obtenida</h4>
                <div 
                  (click)="featExpanded = !featExpanded"
                  class="flex flex-col bg-[#18181c] hover:bg-neutral-800/80 border border-neutral-800 hover:border-[#d4af37]/30 p-4 rounded-lg cursor-pointer transition select-none group/feat"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-[#d4af37] group-hover/feat:text-amber-400">
                      {{ getFeatInfo(activeBackground.keyFeat).title }}
                    </span>
                    <span class="text-xs text-neutral-500 transition duration-200" [class.rotate-180]="featExpanded">
                      ▼
                    </span>
                  </div>
                  <span class="text-[11px] text-neutral-400 mt-1 select-none leading-normal">{{ activeBackground.keyFeat }}</span>
                  
                  <!-- Dropdown descriptivo -->
                  <div 
                    *ngIf="featExpanded" 
                    class="mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-355 leading-relaxed animate-fade-in bg-[#0d0d0f] p-3.5 rounded-lg border border-amber-900/15 space-y-2 text-left"
                  >
                    <p class="font-bold text-amber-400 font-serif uppercase tracking-wider text-[9px] mb-1">Beneficios de la Dote:</p>
                    <ul class="space-y-1.5 list-none pl-0">
                      <li 
                        *ngFor="let benefit of getFeatInfo(activeBackground.keyFeat).benefits" 
                        class="flex items-start gap-2 text-neutral-350"
                      >
                        <span class="text-amber-500/80 mt-0.5 select-none shrink-0">•</span>
                        <span [innerHTML]="benefit"></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Competencias Habilidades -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Habilidades Clave</h4>
                <div class="flex items-center gap-3 bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xl">🎓</span>
                  <div>
                    <p class="text-xs font-bold text-neutral-200">{{ activeBackground.skills }}</p>
                    <p class="text-[9px] text-neutral-500 leading-tight">Obtienes entrenamiento y bonificaciones permanentes en estas destrezas.</p>
                  </div>
                </div>
              </div>

              <!-- Competencias Herramientas -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Herramientas / Juegos</h4>
                <div class="flex items-center gap-3 bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xl">🎲</span>
                  <div>
                    <p class="text-xs font-bold text-neutral-200">{{ activeBackground.tools }}</p>
                    <p class="text-[9px] text-neutral-500 leading-tight">Instrumental, juegos o útiles específicos con los que tienes maestría.</p>
                  </div>
                </div>
              </div>

              <!-- Sugerencias -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Sugerido para Clases</h4>
                <p class="text-xs text-neutral-400 leading-relaxed bg-[#18181c] border border-neutral-850 p-4 rounded-lg">
                  {{ activeBackground.recommendations }}
                </p>
              </div>
            </div>

            <!-- Botones de Acción Fijos Abajo -->
            <div class="flex gap-3 border-t border-neutral-900 pt-4 bg-[#121215] shrink-0">
              <button 
                (click)="goToStep(1)"
                class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-wider cursor-pointer transition duration-200"
              >
                Volver
              </button>
              <button 
                (click)="onConfirmBackground()"
                [disabled]="getUsedBackgroundStatsPoints() !== 3"
                class="flex-2 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-4 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-wider shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Confirmar Trasfondo
              </button>
            </div>
          </section>

        </div>

        <!-- ================= PASO 3: SELECCIÓN DE ORIGEN ================= -->
        <div *ngIf="currentStep === 3" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          <!-- Columna 1: Menú Lateral de Orígenes -->
          <aside class="lg:col-span-3 bg-[#121215] border border-neutral-800/80 rounded-xl p-4 shadow-xl space-y-2 h-[680px] overflow-y-auto custom-scrollbar">
            <h3 class="text-[#d4af37] font-serif font-bold text-sm tracking-wider uppercase border-b border-neutral-900/80 pb-2 mb-3">
              Orígenes Disponibles
            </h3>
            
            <button 
              *ngFor="let o of origins; let idx = index" 
              (click)="selectOrigin(idx)"
              class="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition duration-200 border cursor-pointer flex items-center justify-between focus:outline-none"
              [ngClass]="selectedOriginIdx === idx ? 'bg-red-950/20 border-red-500/50 text-[#d4af37] shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-transparent border-transparent hover:bg-neutral-800/50 hover:text-neutral-200 text-neutral-400'"
            >
              <span class="flex items-center gap-2">
                <span class="text-base select-none">{{ o.icon }}</span>
                <span>{{ o.name }}</span>
              </span>
              <span *ngIf="selectedOriginIdx === idx" class="text-amber-500 text-xs animate-pulse">✨</span>
            </button>
          </aside>

          <!-- Columna 2: Título e Imagen del Origen -->
          <main class="lg:col-span-5 space-y-4">
            <div class="bg-[#121215] border border-[#d4af37]/15 rounded-xl overflow-hidden shadow-2xl relative group h-[680px] flex flex-col">
              <div class="p-4 bg-[#0d0d0f]/90 border-b border-neutral-900 flex justify-between items-center">
                <h2 class="text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase">
                  {{ activeOrigin.name }}
                </h2>
                <span class="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-amber-950/40 border border-amber-800/40 text-amber-400 rounded-md">
                  Origen
                </span>
              </div>

              <div class="flex-1 relative overflow-hidden bg-gradient-to-b from-[#141416] to-[#0c0c0f] flex items-center justify-center p-4">
                <img 
                  [src]="'/assets/razas/' + activeOrigin.image" 
                  [alt]="activeOrigin.name" 
                  class="max-w-full max-h-[550px] object-contain transition-all duration-500 select-none group-hover:scale-102 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                  (load)="onImageLoad()"
                  (error)="onImageError($event)"
                  [class.opacity-0]="!imageLoaded"
                  [class.opacity-100]="imageLoaded"
                />
                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121215] to-transparent opacity-90 pointer-events-none"></div>
                
                <div *ngIf="!imageLoaded" class="absolute inset-0 flex items-center justify-center bg-[#121215]">
                  <svg class="animate-spin h-10 w-10 text-[#d4af37]" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <div class="absolute bottom-4 left-4 right-4 z-10 text-center">
                  <p class="text-xs italic text-neutral-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] bg-neutral-950/70 border border-neutral-850 px-4 py-2 rounded-lg max-w-md mx-auto leading-relaxed backdrop-blur-sm">
                    El linaje de tu aventurero define su fisionomía y dotes iniciales.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <!-- Columna 3: Características de Origen -->
          <section class="lg:col-span-4 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-xl h-[680px] flex flex-col justify-between overflow-y-auto">
            <div class="space-y-6">
              <div class="border-b border-neutral-900 pb-3">
                <h3 class="text-[#d4af37] font-serif font-bold text-base tracking-wider uppercase">Atributos de Origen</h3>
                <p class="text-[10px] text-neutral-500">Beneficios raciales de tu linaje ancestral.</p>
              </div>

              <!-- Incremento de Atributos -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Incremento de Atributo</h4>
                <div class="flex items-center gap-3 bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xl">📈</span>
                  <div>
                    <p class="text-sm font-bold text-neutral-200">{{ activeOrigin.bonus }}</p>
                    <p class="text-[10px] text-neutral-500 leading-tight">Mejora directa aplicada a tus puntuaciones de característica.</p>
                  </div>
                </div>
              </div>

              <!-- Velocidad de Movimiento -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Velocidad Base</h4>
                <div class="flex items-center justify-between bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xs font-semibold text-neutral-200">Capacidad de desplazamiento</span>
                  <span class="text-sm font-bold text-amber-400 font-serif">🏃 {{ activeOrigin.speed }}</span>
                </div>
              </div>

              <!-- Idiomas -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Idiomas Iniciales</h4>
                <div class="flex items-center justify-between bg-[#18181c] border border-neutral-800 px-4 py-3 rounded-lg">
                  <span class="text-xs font-semibold text-neutral-200">Lenguas dominadas</span>
                  <span class="text-xs font-bold text-neutral-300">{{ activeOrigin.language }}</span>
                </div>
              </div>

              <!-- Rasgo Especial -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Rasgo de Linaje Especial</h4>
                <div class="flex flex-col bg-[#18181c] border border-neutral-850 p-4 rounded-lg space-y-1">
                  <span class="text-xs font-bold text-[#d4af37]">{{ activeOrigin.trait.split('(')[0] }}</span>
                  <span class="text-[11px] text-neutral-400 leading-normal">{{ activeOrigin.trait }}</span>
                </div>
              </div>

              <!-- Descripción Completa -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Acerca del Linaje</h4>
                <p class="text-xs text-neutral-400 leading-relaxed bg-[#18181c] border border-neutral-800 p-4 rounded-lg h-32 overflow-y-auto custom-scrollbar">
                  {{ activeOrigin.description }}
                </p>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex gap-3 mt-6">
              <button 
                (click)="goToStep(2)"
                class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-wider cursor-pointer transition duration-200"
              >
                Volver
              </button>
              <button 
                (click)="onConfirmOrigin()"
                class="flex-2 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-4 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-wider shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Confirmar Origen
              </button>
            </div>
          </section>

        </div>

        <!-- ================= PASO 4: PUNTUACIONES DE ATRIBUTOS ================= -->
        <div *ngIf="currentStep === 4" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          <!-- Panel Izquierdo -->
          <div class="lg:col-span-4 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-xl space-y-6">
            <h3 class="text-[#d4af37] font-serif font-bold text-base tracking-wider uppercase border-b border-neutral-900 pb-2 mb-3">
              Asignación de Atributos
            </h3>
            <p class="text-xs text-neutral-400 leading-relaxed">
              Tienes un total de <strong class="text-amber-400">15 puntos de forja</strong> para gastar y mejorar las puntuaciones físicas e intelectuales de tu héroe.
            </p>
            <div class="bg-[#18181c] border border-neutral-800 p-4 rounded-lg space-y-2 text-xs">
              <div class="flex justify-between border-b border-neutral-900 pb-1.5 mb-1.5">
                <span class="font-bold text-[#d4af37]">Tu Clase Recomendada:</span>
                <span class="text-neutral-300 font-semibold">{{ activeClass.name }}</span>
              </div>
              <p class="text-neutral-450 leading-relaxed">
                El atributo primario de tu clase es la <strong class="text-[#d4af37]">{{ activeClass.primaryStat }}</strong>. Intenta concentrar tus puntos en ella para potenciar tu efectividad en combate y lanzamiento de conjuros.
              </p>
            </div>
            
            <div class="bg-[#18181c] border border-neutral-800 p-4 rounded-lg space-y-2 text-xs">
              <div class="flex justify-between border-b border-neutral-900 pb-1.5 mb-1.5">
                <span class="font-bold text-amber-500">Tu Origen Elegido:</span>
                <span class="text-neutral-300 font-semibold">{{ activeOrigin.name }}</span>
              </div>
              <p class="text-neutral-450 leading-relaxed">
                Tu linaje de origen te confiere un bono inicial gratuito: <strong class="text-amber-400">{{ activeOrigin.bonus }}</strong>. Este incremento se suma automáticamente al final de tus atributos base.
              </p>
            </div>
          </div>

          <!-- Panel Central -->
          <main class="lg:col-span-8 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-2xl space-y-6">
            <div class="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div>
                <h3 class="text-lg font-serif font-extrabold text-[#d4af37] uppercase tracking-wider">Tus Puntuaciones</h3>
                <p class="text-xs text-neutral-500">Distribuye tus puntos. Límite base: min 8, max 18.</p>
              </div>
              <div class="bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2 text-center shadow-inner">
                <div class="text-[9px] uppercase font-bold text-red-400 tracking-widest">Puntos Restantes</div>
                <div class="text-2xl font-serif font-bold text-[#d4af37]">{{ attributePointsPool }}</div>
              </div>
            </div>

            <!-- Lista de Atributos -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                *ngFor="let attr of attributes" 
                class="bg-[#18181c] border border-neutral-800/80 p-4 rounded-xl flex items-center justify-between shadow-md relative group hover:border-[#d4af37]/15 transition"
              >
                <div class="space-y-1 pr-4">
                  <h4 class="text-sm font-bold text-neutral-200 uppercase tracking-wide">
                    {{ attr.name }}
                  </h4>
                  <p class="text-[10px] text-neutral-500 leading-snug">
                    {{ attr.description }}
                  </p>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <button 
                    (click)="modifyAttribute(attr.key, -1)"
                    [disabled]="attr.value <= 8"
                    class="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer transition"
                  >
                    -
                  </button>

                  <div class="text-center w-16">
                    <div class="text-2xl font-serif font-bold text-[#d4af37]">
                      {{ getFinalAttributeScore(attr.key) }}
                    </div>
                    <div class="text-[9px] text-neutral-500 uppercase tracking-widest leading-none mt-0.5 space-y-0.5">
                      <div>Base: {{ attr.value }}</div>
                      <div class="flex flex-col gap-0.5">
                        <span *ngIf="getOriginModifier(attr.key) > 0" class="text-emerald-500 font-bold">+{{ getOriginModifier(attr.key) }} Or.</span>
                        <span *ngIf="(backgroundStatsAllocation[attr.key] || 0) > 0" class="text-amber-500 font-bold">+{{ backgroundStatsAllocation[attr.key] }} Tras.</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    (click)="modifyAttribute(attr.key, 1)"
                    [disabled]="attributePointsPool <= 0 || attr.value >= 18"
                    class="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex gap-4 border-t border-neutral-900 pt-6">
              <button 
                (click)="goToStep(3)"
                class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-wider cursor-pointer transition duration-200"
              >
                Volver
              </button>
              <button 
                (click)="onConfirmAttributes()"
                [disabled]="attributePointsPool > 0"
                class="flex-2 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-6 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-wider shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Confirmar Atributos y Finalizar
              </button>
            </div>
          </main>

        </div>

        <!-- ================= PASO 5: SELECCIÓN DE EQUIPO INICIAL ================= -->
        <div *ngIf="currentStep === 5" class="max-w-4xl mx-auto bg-[#121215] border border-[#d4af37]/35 rounded-2xl p-8 shadow-2xl space-y-8 animate-fade-in relative overflow-hidden text-left">
          <!-- Cabecera -->
          <div class="text-center space-y-2 border-b border-neutral-900 pb-6 relative z-10">
            <span class="text-5xl select-none">🎒</span>
            <h2 class="text-3xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Selección de Equipo Inicial
            </h2>
            <p class="text-xs text-neutral-455">Tu clase y tu trasfondo determinan las pertenencias y riquezas con las que comenzarás tu viaje.</p>
          </div>

          <div class="space-y-8 relative z-10">
            <!-- SECCIÓN 1: EQUIPO DE CLASE -->
            <div class="space-y-4">
              <h3 class="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider border-b border-neutral-900/60 pb-2">
                1. Equipo de Clase: {{ activeClass.name }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <!-- Opción A: Paquete Predefinido -->
                <div 
                  (click)="selectEquipmentOption('A')"
                  class="bg-gradient-to-b from-[#18181c] to-[#121215] border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-xl text-left"
                  [ngClass]="selectedEquipmentOption === 'A' ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.12)] bg-[#1c1c22]/30' : 'border-neutral-850 hover:border-neutral-700'"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <div>
                        <h4 class="text-sm font-serif font-bold text-neutral-200">Opción A: Equipo Predefinido</h4>
                        <p class="text-[9px] text-neutral-500">Mochila equipada de clase.</p>
                      </div>
                      <span class="text-xl select-none" [class.text-[#d4af37]]="selectedEquipmentOption === 'A'">
                        {{ selectedEquipmentOption === 'A' ? '✦' : '◇' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-neutral-350 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[80px] flex items-center">
                      {{ getClassEquipmentOptions(activeClass.name).optionA }}
                    </p>
                  </div>
                  <button 
                    class="w-full mt-4 py-2 rounded-lg text-[10px] font-serif uppercase tracking-widest transition duration-200"
                    [ngClass]="selectedEquipmentOption === 'A' ? 'bg-[#d4af37] text-black font-bold' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-450 border border-neutral-800'"
                  >
                    {{ selectedEquipmentOption === 'A' ? 'Seleccionado' : 'Elegir Paquete' }}
                  </button>
                </div>

                <!-- Opción B: Oro Inicial -->
                <div 
                  (click)="selectEquipmentOption('B')"
                  class="bg-gradient-to-b from-[#18181c] to-[#121215] border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-xl text-left"
                  [ngClass]="selectedEquipmentOption === 'B' ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.12)] bg-[#1c1c22]/30' : 'border-neutral-850 hover:border-neutral-700'"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <div>
                        <h4 class="text-sm font-serif font-bold text-neutral-200">Opción B: Oro Inicial</h4>
                        <p class="text-[9px] text-neutral-500">Monedas de oro de inicio.</p>
                      </div>
                      <span class="text-xl select-none" [class.text-[#d4af37]]="selectedEquipmentOption === 'B'">
                        {{ selectedEquipmentOption === 'B' ? '✦' : '◇' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-neutral-350 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[80px] flex items-center justify-center text-center">
                      Recibes <strong class="text-[#d4af37] text-sm mx-1.5 font-mono">{{ getClassEquipmentOptions(activeClass.name).optionB }}</strong> para comprar inventario inicial.
                    </p>
                  </div>
                  <button 
                    class="w-full mt-4 py-2 rounded-lg text-[10px] font-serif uppercase tracking-widest transition duration-200"
                    [ngClass]="selectedEquipmentOption === 'B' ? 'bg-[#d4af37] text-black font-bold' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-450 border border-neutral-800'"
                  >
                    {{ selectedEquipmentOption === 'B' ? 'Seleccionado' : 'Elegir Oro' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: EQUIPO DE TRASFONDO -->
            <div class="space-y-4">
              <h3 class="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider border-b border-neutral-900/60 pb-2">
                2. Equipo de Trasfondo: {{ activeBackground.name }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <!-- Opción A: Paquete Predefinido -->
                <div 
                  (click)="selectBgEquipmentOption('A')"
                  class="bg-gradient-to-b from-[#18181c] to-[#121215] border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-xl text-left"
                  [ngClass]="selectedBgEquipmentOption === 'A' ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.12)] bg-[#1c1c22]/30' : 'border-neutral-850 hover:border-neutral-700'"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <div>
                        <h4 class="text-sm font-serif font-bold text-neutral-200">Opción A: Equipo Temático</h4>
                        <p class="text-[9px] text-neutral-500">Pertenencias asociadas a tu vida pasada.</p>
                      </div>
                      <span class="text-xl select-none" [class.text-[#d4af37]]="selectedBgEquipmentOption === 'A'">
                        {{ selectedBgEquipmentOption === 'A' ? '✦' : '◇' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-neutral-350 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[80px] flex items-center text-left">
                      {{ getBgEquipmentOptions(activeBackground.name).optionA }}
                    </p>
                  </div>
                  <button 
                    class="w-full mt-4 py-2 rounded-lg text-[10px] font-serif uppercase tracking-widest transition duration-200"
                    [ngClass]="selectedBgEquipmentOption === 'A' ? 'bg-[#d4af37] text-black font-bold' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-450 border border-neutral-800'"
                  >
                    {{ selectedBgEquipmentOption === 'A' ? 'Seleccionado' : 'Elegir Temático' }}
                  </button>
                </div>

                <!-- Opción B: Oro Inicial -->
                <div 
                  (click)="selectBgEquipmentOption('B')"
                  class="bg-gradient-to-b from-[#18181c] to-[#121215] border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-xl text-left"
                  [ngClass]="selectedBgEquipmentOption === 'B' ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.12)] bg-[#1c1c22]/30' : 'border-neutral-850 hover:border-neutral-700'"
                >
                  <div class="space-y-3">
                    <div class="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <div>
                        <h4 class="text-sm font-serif font-bold text-neutral-200">Opción B: Oro de Trasfondo</h4>
                        <p class="text-[9px] text-neutral-500">Riquezas acumuladas de tu trasfondo.</p>
                      </div>
                      <span class="text-xl select-none" [class.text-[#d4af37]]="selectedBgEquipmentOption === 'B'">
                        {{ selectedBgEquipmentOption === 'B' ? '✦' : '◇' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-neutral-350 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[80px] flex items-center justify-center text-center">
                      Recibes <strong class="text-[#d4af37] text-sm mx-1.5 font-mono">{{ getBgEquipmentOptions(activeBackground.name).optionB }}</strong> adicionales de inicio.
                    </p>
                  </div>
                  <button 
                    class="w-full mt-4 py-2 rounded-lg text-[10px] font-serif uppercase tracking-widest transition duration-200"
                    [ngClass]="selectedBgEquipmentOption === 'B' ? 'bg-[#d4af37] text-black font-bold' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-450 border border-neutral-800'"
                  >
                    {{ selectedBgEquipmentOption === 'B' ? 'Seleccionado' : 'Elegir Oro' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: DOTE CLAVE "HABILIDOSO" (Si aplica) -->
            <div *ngIf="hasSkilledFeat()" class="space-y-4 border-t border-neutral-900 pt-6 text-left">
              <div class="flex justify-between items-center border-b border-neutral-900/60 pb-2">
                <div>
                  <h3 class="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider">
                    3. Beneficio de Dote: Habilidoso (Skilled)
                  </h3>
                  <p class="text-[10px] text-neutral-450 leading-relaxed">
                    Tu dote de trasfondo te otorga entrenamiento en cualquier combinación de <strong class="text-amber-500">3 Habilidades o Herramientas</strong> a tu elección.
                  </p>
                </div>
                <span class="text-xs bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded text-red-400 font-mono font-bold select-none shrink-0">
                  Elige {{ 3 - skilledFeatSelection.length }} restantes
                </span>
              </div>

              <!-- Listas de Habilidades y Herramientas a elegir -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Columna Habilidades -->
                <div class="space-y-3 bg-[#18181c] border border-neutral-800 p-4 rounded-xl">
                  <h4 class="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider border-b border-neutral-850 pb-1.5">
                    Habilidades Disponibles
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let skill of allSkillsList"
                      [class.opacity-40]="hasProficiency(skill)"
                      class="flex items-center gap-1.5 p-1.5 rounded border transition select-none"
                      [ngClass]="{
                        'bg-amber-950/20 border-amber-600/50 text-[#d4af37]': skilledFeatSelection.includes(skill),
                        'bg-neutral-900/30 border-neutral-850 text-neutral-400': !skilledFeatSelection.includes(skill)
                      }"
                    >
                      <input 
                        type="checkbox"
                        [checked]="skilledFeatSelection.includes(skill)"
                        [disabled]="hasProficiency(skill) || (!skilledFeatSelection.includes(skill) && skilledFeatSelection.length >= 3)"
                        (change)="toggleSkilledFeatSelection(skill)"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40"
                      />
                      <span 
                        class="text-[10px] font-medium truncate cursor-pointer"
                        (click)="!hasProficiency(skill) && toggleSkilledFeatSelection(skill)"
                      >
                        {{ skill }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Columna Herramientas -->
                <div class="space-y-3 bg-[#18181c] border border-neutral-800 p-4 rounded-xl">
                  <h4 class="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider border-b border-neutral-850 pb-1.5">
                    Herramientas / Juegos Disponibles
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let tool of allToolsList"
                      [class.opacity-40]="hasProficiency(tool)"
                      class="flex items-center gap-1.5 p-1.5 rounded border transition select-none"
                      [ngClass]="{
                        'bg-amber-950/20 border-amber-600/50 text-[#d4af37]': skilledFeatSelection.includes(tool),
                        'bg-neutral-900/30 border-neutral-850 text-neutral-400': !skilledFeatSelection.includes(tool)
                      }"
                    >
                      <input 
                        type="checkbox"
                        [checked]="skilledFeatSelection.includes(tool)"
                        [disabled]="hasProficiency(tool) || (!skilledFeatSelection.includes(tool) && skilledFeatSelection.length >= 3)"
                        (change)="toggleSkilledFeatSelection(tool)"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40"
                      />
                      <span 
                        class="text-[10px] font-medium truncate cursor-pointer"
                        (click)="!hasProficiency(tool) && toggleSkilledFeatSelection(tool)"
                      >
                        {{ tool }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Habilidades/Herramientas ya elegidas (Clase + Trasfondo) para recordarle al usuario -->
              <div class="bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl space-y-2">
                <span class="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Tus Competencias actuales (No elegibles):</span>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span 
                    *ngFor="let s of getAlreadySelectedSkills()" 
                    class="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded"
                  >
                    {{ s }}
                  </span>
                  <span 
                    *ngIf="activeBackground.tools"
                    class="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded italic font-medium"
                  >
                    🛠️ {{ activeBackground.tools }}
                  </span>
                  <span 
                    *ngIf="getClassDetailsByClassName(activeClass.name).tools"
                    class="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded italic font-medium"
                  >
                    🛠️ {{ getClassDetailsByClassName(activeClass.name).tools }}
                  </span>
                </div>
              </div>
            </div>
          </div>
 
          <!-- Botones de Acción -->
          <div class="flex flex-col sm:flex-row gap-4 border-t border-neutral-900 pt-6 relative z-10">
            <button 
              (click)="currentStep = 4"
              class="w-full sm:w-1/3 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-widest cursor-pointer transition duration-200"
            >
              Atrás (Atributos)
            </button>
            <button 
              (click)="onConfirmEquipment()"
              [disabled]="!selectedEquipmentOption || !selectedBgEquipmentOption || (hasSkilledFeat() && skilledFeatSelection.length !== 3)"
              class="w-full sm:w-2/3 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
            >
              Confirmar Equipo y Continuar
            </button>
          </div>
        </div>

        <!-- ================= PASO 6: RESUMEN FINAL / CONFIRMACIÓN ================= -->
        <div *ngIf="currentStep === 6" class="max-w-4xl mx-auto bg-[#121215] border border-[#d4af37]/35 rounded-2xl p-8 shadow-2xl space-y-8 animate-fade-in relative overflow-hidden">
          
          <!-- Cabecera -->
          <div class="text-center space-y-2 border-b border-neutral-900 pb-6 relative z-10">
            <span class="text-5xl">⚔️</span>
            <h2 class="text-3xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ¡Aventurero Creado con Éxito!
            </h2>
            <p class="text-xs text-neutral-455">Tu ficha ha sido templada en la Forja de Héroes y está lista para la aventura.</p>
          </div>

          <!-- Grid del Resumen -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-stretch">
            
            <!-- Identidad -->
            <div class="bg-[#18181c] border border-neutral-850 p-6 rounded-xl space-y-4 flex flex-col justify-between">
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Identidad</h4>
                <div class="space-y-2">
                  <div class="text-xs text-neutral-455 uppercase">Clase Elegida:</div>
                  <div class="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
                    <span>{{ activeClass.icon }}</span>
                    <span>{{ activeClass.name }}</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="text-xs text-neutral-455 uppercase">Origen Ancestral:</div>
                  <div class="text-lg font-serif font-bold text-neutral-200 flex items-center gap-2">
                    <span>{{ activeOrigin.icon }}</span>
                    <span>{{ activeOrigin.name }}</span>
                  </div>
                </div>
              </div>
              <div class="text-[10px] text-neutral-500">
                Velocidad: {{ activeOrigin.speed }}<br/>
                Dado de Golpe: {{ activeClass.hitDie }}
              </div>
            </div>

            <!-- Atributos Finales -->
            <div class="bg-[#18181c] border border-neutral-850 p-6 rounded-xl space-y-4">
              <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Atributos</h4>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div 
                  *ngFor="let attr of attributes" 
                  class="bg-neutral-900/60 p-2.5 rounded border border-neutral-800/50 flex justify-between items-center"
                >
                  <span class="font-bold text-neutral-300">{{ attr.key }}</span>
                  <span class="text-sm font-bold text-[#d4af37] font-serif">
                    {{ getFinalAttributeScore(attr.key) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Trasfondo y Dote -->
            <div class="bg-[#18181c] border border-neutral-850 p-6 rounded-xl space-y-4 flex flex-col justify-between">
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Trasfondo</h4>
                <div class="space-y-2">
                  <div class="text-xs text-neutral-455 uppercase">Vida Pasada:</div>
                  <div class="text-lg font-serif font-bold text-neutral-200 flex items-center gap-2">
                    <span>{{ activeBackground.icon }}</span>
                    <span>{{ activeBackground.name }}</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="text-xs text-neutral-455 uppercase">Dote Clave:</div>
                  <div 
                    (click)="featExpanded = !featExpanded"
                    class="bg-neutral-900/60 hover:bg-neutral-800/60 border border-neutral-800/80 hover:border-[#d4af37]/30 p-3 rounded-lg cursor-pointer transition select-none group/featSummary"
                  >
                    <div class="flex justify-between items-center text-xs text-amber-400 font-bold">
                      <span class="group-hover/featSummary:text-amber-300">
                        {{ getFeatInfo(activeBackground.keyFeat).title }}
                      </span>
                      <span class="text-[9px] text-neutral-500 transition duration-200" [class.rotate-180]="featExpanded">▼</span>
                    </div>
                    <div class="text-[10px] text-neutral-450 mt-0.5 leading-snug">{{ activeBackground.keyFeat }}</div>
                    
                    <div 
                      *ngIf="featExpanded" 
                      class="mt-2 pt-2 border-t border-neutral-850 text-[10px] text-neutral-350 leading-relaxed animate-fade-in bg-amber-950/15 p-2.5 rounded space-y-1.5 text-left"
                    >
                      <ul class="space-y-1.5 list-none pl-0">
                        <li 
                          *ngFor="let benefit of getFeatInfo(activeBackground.keyFeat).benefits" 
                          class="flex items-start gap-1.5 text-neutral-300"
                        >
                          <span class="text-amber-500/80 mt-0.5 select-none shrink-0">•</span>
                          <span [innerHTML]="benefit"></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-[10px] text-neutral-500 space-y-1">
                <div><strong>Habilidades:</strong> {{ activeBackground.skills }} <span *ngIf="hasSkilledFeat() && getSkilledSkillsOnly().length > 0" class="text-amber-500 font-bold">(+{{ getSkilledSkillsOnly().join(', ') }})</span></div>
                <div><strong>Herramientas:</strong> {{ activeBackground.tools }} <span *ngIf="hasSkilledFeat() && getSkilledToolsOnly().length > 0" class="text-amber-500 font-bold">(+{{ getSkilledToolsOnly().join(', ') }})</span></div>
                
                <button 
                  (click)="showPreview = true"
                  class="w-full mt-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 py-2 rounded text-[10px] uppercase tracking-widest font-bold transition"
                >
                  Ver Ficha Preliminar
                </button>
              </div>
            </div>

          </div>

          <!-- Equipo Inicial Seleccionado (Resumen) -->
          <div class="bg-[#18181c] border border-neutral-855 p-6 rounded-xl space-y-4 relative z-10 text-left">
            <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Equipo Inicial Seleccionado</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Equipo de Clase ({{ activeClass.name }}):</span>
                <p class="text-xs text-neutral-300 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[60px] flex items-center">
                  {{ selectedEquipmentOption === 'A' ? getClassEquipmentOptions(activeClass.name).optionA : 'Oro Inicial (' + getClassEquipmentOptions(activeClass.name).optionB + ')' }}
                </p>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Equipo de Trasfondo ({{ activeBackground.name }}):</span>
                <p class="text-xs text-neutral-300 leading-relaxed font-light bg-[#0e0e11] border border-neutral-900 p-3 rounded-lg min-h-[60px] flex items-center">
                  {{ selectedBgEquipmentOption === 'A' ? getBgEquipmentOptions(activeBackground.name).optionA : 'Oro Inicial (' + getBgEquipmentOptions(activeBackground.name).optionB + ')' }}
                </p>
              </div>
            </div>
            <div class="pt-2 border-t border-neutral-900 flex justify-between items-center text-xs">
              <span class="text-neutral-455 font-bold uppercase">Total Oro Inicial:</span>
              <span class="text-sm font-bold text-amber-400 font-mono">{{ getStartingGold() }} po</span>
            </div>
          </div>

          <!-- Acciones de Guardar / Reiniciar -->
          <div class="flex flex-col sm:flex-row gap-4 border-t border-neutral-900 pt-6 relative z-10">
            <button 
              (click)="restartCreator()"
              class="w-full sm:w-1/3 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-355 py-3 rounded-lg text-xs font-serif uppercase tracking-widest cursor-pointer transition duration-200"
            >
              Reiniciar Forja
            </button>
            <button 
              (click)="saveCharacter()"
              class="w-full sm:w-2/3 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-6 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
            >
              Registrar Personaje en la Campaña
            </button>
          </div>

        </div>

      </div>

      <!-- MODAL DE VISTA PREVIA DE LA FICHA DE PERSONAJE -->
      <div 
        *ngIf="showPreview" 
        class="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-left"
      >
        <div 
          class="bg-[#08080a] border border-[#d4af37]/35 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          <!-- CABECERA DE LA FICHA -->
          <div class="bg-gradient-to-r from-neutral-950 via-[#0e0e11] to-neutral-950 border-b border-[#d4af37]/20 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shrink-0">
            <div class="flex items-center gap-3">
              <span class="text-3xl select-none">🛡️</span>
              <div>
                <h2 class="font-serif text-[#d4af37] text-sm uppercase tracking-widest font-extrabold flex items-center gap-2">
                  FORJA & LEYENDA
                  <span class="text-[9px] bg-red-950/80 border border-red-800 text-red-400 px-2 py-0.5 rounded uppercase tracking-normal font-sans">Vista Previa</span>
                </h2>
                <p class="text-[9px] text-neutral-450 uppercase tracking-wide">Tu Hoja de Personaje en Tiempo Real</p>
              </div>
            </div>
            
            <!-- Pestañas de la Ficha -->
            <div class="flex bg-neutral-900/60 p-1 border border-neutral-800 rounded-lg shrink-0">
              <button 
                (click)="previewTab = 1"
                class="px-4 py-1.5 rounded text-[10px] font-serif uppercase tracking-wider cursor-pointer transition select-none"
                [class.bg-amber-600]="previewTab === 1"
                [class.text-white]="previewTab === 1"
                [class.text-neutral-450]="previewTab !== 1"
              >
                Ficha Principal
              </button>
              <button 
                (click)="previewTab = 2"
                class="px-4 py-1.5 rounded text-[10px] font-serif uppercase tracking-wider cursor-pointer transition select-none"
                [class.bg-amber-600]="previewTab === 2"
                [class.text-white]="previewTab === 2"
                [class.text-neutral-455]="previewTab !== 2"
              >
                Grimorio y Equipo
              </button>
            </div>

            <button 
              (click)="showPreview = false"
              class="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition"
            >
              Cerrar Preview
            </button>
          </div>

          <!-- CONTENIDO DE LA HOJA (SCROLLABLE) -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-radial-at-t from-neutral-950/80 via-[#08080a] to-[#08080a] space-y-6">
            
            <!-- FILA SUPERIOR: INFORMACIÓN GENERAL -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#121215] border border-neutral-850 p-4 rounded-xl">
              <div class="space-y-1">
                <label class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">Nombre del Aventurero</label>
                <input 
                  [(ngModel)]="characterName" 
                  placeholder="Nombre del héroe..."
                  class="w-full bg-[#18181c] border border-neutral-800 hover:border-neutral-750 focus:border-[#d4af37]/50 focus:outline-none px-3 py-1.5 rounded text-xs text-neutral-200 font-semibold"
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider">Clase</label>
                  <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-850 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                    {{ activeClass.name || 'Ninguna' }}
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider">Subclase</label>
                  <input 
                    [(ngModel)]="characterSubclass" 
                    placeholder="Ej: Campeón"
                    class="w-full bg-[#18181c] border border-neutral-800 focus:border-[#d4af37]/50 focus:outline-none px-3 py-1.5 rounded text-xs text-neutral-200 font-semibold"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider">Origen / Raza</label>
                  <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-850 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                    {{ activeOrigin.name || 'Ninguno' }}
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider">Trasfondo</label>
                  <div class="text-xs text-neutral-200 font-bold bg-neutral-900/80 border border-neutral-850 px-3 py-1.5 rounded truncate min-h-[30px] flex items-center">
                    {{ activeBackground.name || 'Ninguno' }}
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="space-y-1 text-center">
                  <label class="text-[8px] text-neutral-455 uppercase font-bold tracking-wider">Nivel</label>
                  <div class="text-xs text-amber-400 font-bold bg-neutral-900/80 border border-[#d4af37]/15 py-1 rounded min-h-[30px] flex items-center justify-center">
                    1
                  </div>
                </div>
                <div class="space-y-1 text-center col-span-2">
                  <label class="text-[8px] text-neutral-455 uppercase font-bold tracking-wider">Experiencia</label>
                  <div class="text-xs text-neutral-350 font-mono bg-neutral-900/80 border border-neutral-850 py-1 rounded min-h-[30px] flex items-center justify-center">
                    0 / 300
                  </div>
                </div>
              </div>
            </div>

            <!-- PESTAÑA 1: FICHA PRINCIPAL -->
            <div *ngIf="previewTab === 1" class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- COLUMNA 1: ATRIBUTOS (md:col-span-3) -->
              <div class="md:col-span-3 space-y-4">
                <h3 class="text-[9px] font-bold text-neutral-450 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Atributos</h3>
                <div class="space-y-2.5">
                  <div 
                    *ngFor="let attr of attributes" 
                    class="bg-[#121215] border border-neutral-850 hover:border-neutral-800 rounded-xl p-3 flex items-center justify-between transition"
                  >
                    <div class="space-y-0.5">
                      <span class="text-[10px] font-bold text-neutral-455 uppercase">{{ attr.name }}</span>
                      <div class="text-base font-bold text-neutral-200 flex items-baseline gap-1.5">
                        <span>{{ getFinalAttributeScore(attr.key) }}</span>
                        <span class="text-[9px] text-neutral-500 font-normal">({{ attr.value }}+{{ getOriginModifier(attr.key) }})</span>
                      </div>
                    </div>
                    <div class="bg-[#18181c] border border-neutral-800 text-amber-400 font-mono font-bold text-xs w-10 h-10 flex items-center justify-center rounded-lg shadow-inner select-none">
                      {{ getFinalModifier(attr.key) }}
                    </div>
                  </div>
                </div>
                
                <!-- Inspiración Heroica y Bonificador -->
                <div class="grid grid-cols-2 gap-3 mt-4">
                  <div class="bg-neutral-900/50 border border-neutral-850 p-2 rounded-xl text-center">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Inspiración</span>
                    <span class="text-xs font-bold text-neutral-200 mt-1 block">🎲 Sí</span>
                  </div>
                  <div class="bg-neutral-900/50 border border-neutral-855 p-2 rounded-xl text-center">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Competencia</span>
                    <span class="text-xs font-mono font-bold text-[#d4af37] mt-1 block">+2</span>
                  </div>
                </div>
              </div>

              <!-- COLUMNA 2: SALVACIONES Y HABILIDADES (md:col-span-4) -->
              <div class="md:col-span-4 space-y-4">
                <h3 class="text-[9px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Salvaciones & Habilidades</h3>
                
                <!-- Salvaciones -->
                <div class="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">Tiradas de Salvación</span>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px]">
                    <div 
                      *ngFor="let attr of attributes" 
                      class="flex items-center justify-between py-0.5 border-b border-neutral-900/30"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-[9px]" [class.text-[#d4af37]]="hasClassSavingThrowProficiency(attr.key)">
                          {{ hasClassSavingThrowProficiency(attr.key) ? '●' : '○' }}
                        </span>
                        <span class="text-neutral-350">{{ attr.name }}</span>
                      </div>
                      <span class="font-mono text-[10px] font-bold text-neutral-300">
                        {{ getSavingThrowModifier(attr.key) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Habilidades -->
                <div class="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-1.5">
                  <span class="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Competencias de Habilidad</span>
                  <div class="space-y-1 pt-1 text-[11px] max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    
                    <!-- Atletismo -->
                    <div class="flex justify-between items-center py-0.5 border-b border-neutral-900/20">
                      <div class="flex items-center gap-1.5">
                        <span [class.text-[#d4af37]]="hasSkillProficiency('Atletismo')">{{ hasSkillProficiency('Atletismo') ? '●' : '○' }}</span>
                        <span class="text-neutral-355">Atletismo <span class="text-[8px] text-neutral-600">(Fue)</span></span>
                      </div>
                      <span class="font-mono text-neutral-300 text-[10px]">{{ getSkillModifier('FUE', 'Atletismo') }}</span>
                    </div>

                    <!-- DES -->
                    <div 
                      *ngFor="let skill of [
                        {name: 'Acrobacias', attr: 'DES'},
                        {name: 'Juego de manos', attr: 'DES'},
                        {name: 'Sigilo', attr: 'DES'}
                      ]"
                      class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                    >
                      <div class="flex items-center gap-1.5">
                        <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                        <span class="text-neutral-355">{{ skill.name }} <span class="text-[8px] text-neutral-600">(Des)</span></span>
                      </div>
                      <span class="font-mono text-neutral-300 text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                    </div>

                    <!-- INT -->
                    <div 
                      *ngFor="let skill of [
                        {name: 'Conocimiento arcano', attr: 'INT'},
                        {name: 'Historia', attr: 'INT'},
                        {name: 'Investigación', attr: 'INT'},
                        {name: 'Naturaleza', attr: 'INT'},
                        {name: 'Religión', attr: 'INT'}
                      ]"
                      class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                    >
                      <div class="flex items-center gap-1.5">
                        <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                        <span class="text-neutral-355">{{ skill.name }} <span class="text-[8px] text-neutral-600">(Int)</span></span>
                      </div>
                      <span class="font-mono text-neutral-300 text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                    </div>

                    <!-- SAB -->
                    <div 
                      *ngFor="let skill of [
                        {name: 'Medicina', attr: 'SAB'},
                        {name: 'Percepción', attr: 'SAB'},
                        {name: 'Perspicacia', attr: 'SAB'},
                        {name: 'Supervivencia', attr: 'SAB'},
                        {name: 'Trato con animales', attr: 'SAB'}
                      ]"
                      class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                    >
                      <div class="flex items-center gap-1.5">
                        <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                        <span class="text-neutral-355">{{ skill.name }} <span class="text-[8px] text-neutral-600">(Sab)</span></span>
                      </div>
                      <span class="font-mono text-neutral-300 text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                    </div>

                    <!-- CAR -->
                    <div 
                      *ngFor="let skill of [
                        {name: 'Engaño', attr: 'CAR'},
                        {name: 'Interpretación', attr: 'CAR'},
                        {name: 'Intimidación', attr: 'CAR'},
                        {name: 'Persuasión', attr: 'CAR'}
                      ]"
                      class="flex justify-between items-center py-0.5 border-b border-neutral-900/20"
                    >
                      <div class="flex items-center gap-1.5">
                        <span [class.text-[#d4af37]]="hasSkillProficiency(skill.name)">{{ hasSkillProficiency(skill.name) ? '●' : '○' }}</span>
                        <span class="text-neutral-355">{{ skill.name }} <span class="text-[8px] text-neutral-600">(Car)</span></span>
                      </div>
                      <span class="font-mono text-neutral-300 text-[10px]">{{ getSkillModifier(skill.attr, skill.name) }}</span>
                    </div>

                  </div>
                </div>
              </div>

              <!-- COLUMNA 3: COMBATE, TRAITS Y EQUIPO (md:col-span-5) -->
              <div class="md:col-span-5 space-y-4">
                <h3 class="text-[10px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Combate & Habilidades</h3>
                
                <!-- Tarjetas de Combate -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-[#121215] border border-neutral-855 p-2.5 rounded-xl text-center shadow-inner relative overflow-hidden group">
                    <div class="absolute inset-x-0 top-0 h-[2px] bg-amber-600"></div>
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">CA (Armadura)</span>
                    <span class="text-xl font-bold font-mono text-neutral-200 mt-1 block">
                      {{ 10 + getFinalModifierValue('DES') }}
                    </span>
                    <span class="text-[8px] text-neutral-600">(10 + Des)</span>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-2.5 rounded-xl text-center shadow-inner relative overflow-hidden">
                    <div class="absolute inset-x-0 top-0 h-[2px] bg-red-800"></div>
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Iniciativa</span>
                    <span class="text-xl font-bold font-mono text-neutral-200 mt-1 block">
                      {{ getFinalModifier('DES') }}
                    </span>
                    <span class="text-[8px] text-neutral-600">(Mod Des)</span>
                  </div>
                  <div class="bg-[#121215] border border-neutral-855 p-2.5 rounded-xl text-center shadow-inner relative overflow-hidden flex flex-col justify-between">
                    <div class="absolute inset-x-0 top-0 h-[2px] bg-green-800"></div>
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Velocidad</span>
                    <span class="text-xs font-bold text-[#d4af37] mt-2 block font-mono">
                      {{ activeOrigin.speed || '30 pies' }}
                    </span>
                    <span class="text-[8px] text-neutral-600">(Racial)</span>
                  </div>
                </div>

                <!-- Puntos de Golpe -->
                <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl grid grid-cols-2 gap-4">
                  <div class="space-y-0.5">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">PG Máximos</span>
                    <span class="text-lg font-bold text-neutral-200 font-mono">
                      {{ getHitDieValue() + getFinalModifierValue('CON') }}
                    </span>
                    <span class="text-[8px] text-neutral-600 block">Dado: 1d{{ getHitDieValue() }} + Con</span>
                  </div>
                  <div class="space-y-0.5">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Dado de Golpe</span>
                    <span class="text-sm font-bold text-[#d4af37] font-mono mt-1 block">
                      1d{{ getHitDieValue() }}
                    </span>
                    <span class="text-[8px] text-neutral-600 block">Nivel 1</span>
                  </div>
                </div>

                <!-- Rasgos de Clase -->
                <div class="bg-neutral-900/40 border border-[#d4af37]/10 p-4 rounded-xl space-y-2">
                  <div class="flex items-center justify-between border-b border-neutral-900 pb-1">
                    <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">Rasgos de {{ activeClass.name }}</span>
                    <span class="text-[9px] text-neutral-600">Dado: d{{ activeClass.hitDie || 8 }}</span>
                  </div>
                  <div class="text-[11px] text-neutral-350 leading-relaxed font-light space-y-1">
                    <p class="font-serif italic text-amber-500/80">"{{ activeClass.description || 'Tu clase determina tus destrezas iniciales y poderes.' }}"</p>
                    <p><strong>Aptitud Primaria:</strong> {{ activeClass.primaryStat }}</p>
                  </div>
                </div>

                <!-- ENTRENAMIENTO Y COMPETENCIAS CON EQUIPO -->
                <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-3 text-left">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Entrenamiento y Competencias con Equipo</span>
                  
                  <!-- Armaduras -->
                  <div class="space-y-1">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">Entrenamiento con Armaduras</span>
                    <div class="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[10px] text-neutral-300">
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs" [class.text-[#d4af37]]="hasClassArmorProficiency('ligeras')">
                          {{ hasClassArmorProficiency('ligeras') ? '✦' : '◇' }}
                        </span>
                        <span>Ligeras</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs" [class.text-[#d4af37]]="hasClassArmorProficiency('medias')">
                          {{ hasClassArmorProficiency('medias') ? '✦' : '◇' }}
                        </span>
                        <span>Medias</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs" [class.text-[#d4af37]]="hasClassArmorProficiency('pesadas')">
                          {{ hasClassArmorProficiency('pesadas') ? '✦' : '◇' }}
                        </span>
                        <span>Pesadas</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs" [class.text-[#d4af37]]="hasClassArmorProficiency('escudos')">
                          {{ hasClassArmorProficiency('escudos') ? '✦' : '◇' }}
                        </span>
                        <span>Escudos</span>
                      </div>
                    </div>
                  </div>

                  <!-- Armas -->
                  <div class="space-y-0.5 border-t border-neutral-900/50 pt-2">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">Armas</span>
                    <p class="text-[10px] text-neutral-350 leading-relaxed font-light">
                      {{ getClassWeaponsProficiency() }}
                    </p>
                  </div>

                  <!-- Herramientas -->
                  <div class="space-y-0.5 border-t border-neutral-900/50 pt-2">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">Herramientas</span>
                    <p class="text-[10px] text-neutral-350 leading-relaxed font-light">
                      {{ activeBackground.tools || 'Herramientas básicas de oficio' }}
                      <span *ngIf="hasSkilledFeat() && getSkilledToolsOnly().length > 0" class="text-amber-500 font-semibold">
                        , {{ getSkilledToolsOnly().join(', ') }} (Dote)
                      </span>
                    </p>
                  </div>

                  <!-- Idiomas -->
                  <div class="space-y-0.5 border-t border-neutral-900/50 pt-2">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">Idiomas Conocidos</span>
                    <p class="text-[10px] text-neutral-350 leading-relaxed font-light">
                      {{ activeOrigin.language || 'Común e idioma extra' }}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <!-- PESTAÑA 2: GRIMORIO Y EQUIPO -->
            <div *ngIf="previewTab === 2" class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- COLUMNA 1: APARATO MÁGICO (md:col-span-4) -->
              <div class="md:col-span-4 space-y-4">
                <h3 class="text-[10px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Grimorio & Aptitud Mágica</h3>
                
                <div *ngIf="!isSpellcaster()" class="bg-neutral-900/20 border border-neutral-900 p-6 rounded-xl text-center text-xs text-neutral-500 italic">
                  Tu clase activa no posee entrenamiento formal en lanzamiento de conjuros al Nivel 1.
                </div>

                <div *ngIf="isSpellcaster()" class="space-y-3">
                  <div class="bg-neutral-900/40 border border-neutral-855 p-4 rounded-xl space-y-3">
                    <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                      <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">Aptitud Mágica</span>
                      <span class="text-[10px] font-bold text-neutral-200">{{ getSpellcastingAbilityName() }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="bg-[#121215] border border-neutral-800 p-2.5 rounded text-center">
                        <span class="text-[8px] text-neutral-500 uppercase block">CD Salvación</span>
                        <span class="text-xl font-bold font-mono text-amber-400 mt-1 block">
                          {{ getSpellSaveDC() }}
                        </span>
                      </div>
                      <div class="bg-[#121215] border border-neutral-800 p-2.5 rounded text-center">
                        <span class="text-[8px] text-neutral-500 block">Ataque Conjuro</span>
                        <span class="text-xl font-bold font-mono text-amber-400 mt-1 block">
                          {{ getSpellAttackBonus() }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Ranuras de Conjuro Nivel 1 -->
                  <div class="bg-neutral-900/45 border border-neutral-855 p-4 rounded-xl space-y-2">
                    <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider block">Ranuras de Conjuro (Nivel 1)</span>
                    <div class="flex items-center gap-3 pt-1">
                      <span class="text-[10px] text-neutral-350 font-mono">Espacios:</span>
                      <div class="flex gap-2">
                        <div class="w-4 h-4 border border-amber-600/60 rounded flex items-center justify-center text-[8px] text-amber-500 select-none">◇</div>
                        <div class="w-4 h-4 border border-amber-600/60 rounded flex items-center justify-center text-[8px] text-amber-500 select-none">◇</div>
                      </div>
                      <span class="text-[9px] text-neutral-500 font-light ml-2">(2 Ranuras totales al Nivel 1)</span>
                    </div>
                  </div>
                </div>

                <!-- Dote de Origen en la Ficha -->
                <div class="bg-neutral-900/40 border border-[#d4af37]/10 p-4 rounded-xl space-y-3">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Dote de Trasfondo</span>
                  <div>
                    <h4 class="text-xs text-neutral-200 font-bold mb-1">{{ getFeatInfo(activeBackground.keyFeat).title }}</h4>
                    <ul class="space-y-1.5 list-none pl-0 mt-2">
                      <li 
                        *ngFor="let benefit of getFeatInfo(activeBackground.keyFeat).benefits" 
                        class="flex items-start gap-1.5 text-[10px] text-neutral-300 leading-normal"
                      >
                        <span class="text-amber-555 select-none shrink-0">•</span>
                        <span [innerHTML]="benefit"></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- COLUMNA 2: CONJUROS PREPARADOS / EQUIPO (md:col-span-8) -->
              <div class="md:col-span-8 space-y-4">
                <h3 class="text-[10px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Equipo Inicial & Monedas</h3>
                
                <!-- Monedas -->
                <div class="bg-neutral-900/35 border border-neutral-855 p-4 rounded-xl space-y-2">
                  <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider block">Monedas de Inicio</span>
                  <div class="grid grid-cols-5 gap-3 pt-1 text-center">
                    <div class="bg-[#121215] border border-neutral-855 p-2 rounded">
                      <div class="text-[8px] text-neutral-500 font-bold">PC (Cobre)</div>
                      <div class="text-xs text-amber-700 font-bold mt-1">0</div>
                    </div>
                    <div class="bg-[#121215] border border-neutral-855 p-2 rounded">
                      <div class="text-[8px] text-neutral-500 font-bold">PP (Plata)</div>
                      <div class="text-xs text-neutral-350 font-bold mt-1">0</div>
                    </div>
                    <div class="bg-[#121215] border border-neutral-855 p-2 rounded">
                      <div class="text-[8px] text-neutral-500 font-bold">PE (Electra)</div>
                      <div class="text-xs text-cyan-600 font-bold mt-1">0</div>
                    </div>
                    <div class="bg-[#121215] border border-neutral-855 p-2 rounded">
                      <div class="text-[8px] text-neutral-500 font-bold">PO (Oro)</div>
                      <div class="text-xs text-[#d4af37] font-bold mt-1">{{ getStartingGold() }}</div>
                    </div>
                    <div class="bg-[#121215] border border-neutral-855 p-2 rounded">
                      <div class="text-[8px] text-neutral-500 font-bold">PPt (Platino)</div>
                      <div class="text-xs text-teal-400 font-bold mt-1">0</div>
                    </div>
                  </div>
                </div>

                <!-- Lista de Equipo -->
                <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-2 text-left">
                  <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block">Inventario Inicial</span>
                  <div class="text-xs text-neutral-350 space-y-2 leading-relaxed font-light">
                    <p><strong>Equipo de Clase:</strong> {{ selectedEquipmentOption === 'A' ? getClassEquipmentOptions(activeClass.name).optionA : 'Oro Inicial de Clase (' + getClassEquipmentOptions(activeClass.name).optionB + ')' }}</p>
                    <p class="border-t border-neutral-900/60 pt-1.5"><strong>Equipo de Trasfondo:</strong> {{ selectedBgEquipmentOption === 'A' ? getBgEquipmentOptions(activeBackground.name).optionA : 'Oro Inicial de Trasfondo (' + getBgEquipmentOptions(activeBackground.name).optionB + ')' }}</p>
                  </div>
                </div>

                <!-- Resumen Conceptual Narrativo -->
                <div class="bg-neutral-900/40 border border-[#d4af37]/10 p-4 rounded-xl space-y-2">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Concepto Narrativo (Vida Pasada)</span>
                  <p class="text-xs text-neutral-300 leading-relaxed font-light">
                    {{ activeBackground.concept || 'Tu historia previa moldea tus competencias básicas y tu actitud hacia el peligro.' }}
                  </p>
                </div>

              </div>

            </div>

          </div>

          <!-- PIE DE LA VISTA PREVIA -->
          <div class="bg-neutral-950 border-t border-neutral-900 p-4 flex justify-between items-center shrink-0">
            <p class="text-[10px] text-neutral-550 font-serif italic">"Una hoja forjada para el combate y la leyenda."</p>
            <button 
              (click)="showPreview = false"
              class="bg-amber-600 hover:bg-amber-500 text-white font-serif uppercase tracking-widest px-6 py-2 rounded-lg text-xs cursor-pointer transition select-none"
            >
              Cerrar Hoja
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #18181c;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(212, 175, 55, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #d4af37;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .flex-2 {
      flex: 2 2 0%;
    }
  `]
})
export class CharacterCreatorComponent implements OnInit {
  // Servicios Inyectados
  private gameDataService = inject(GameDataService);
  private cdr = inject(ChangeDetectorRef);

  // Datos Dinámicos de la BD
  classes: DndClass[] = [];
  origins: DndOrigin[] = [];
  backgrounds: DndBackground[] = [];

  debugStatus = 'Inicializando...';
  featExpanded = false;

  // Estado de la Vista Previa de la Ficha
  showPreview = false;
  previewTab = 1;
  characterName = 'Héroe de la Forja';
  characterSubclass = '';

  // Estado de Selección
  selectedClassIdx = 0;
  selectedOriginIdx = 0;
  selectedBackgroundIdx = 0;
  selectedClassSkills: string[] = [];
  hoveredSkill: string | null = null;

  skillsMetadata: { [key: string]: { attribute: string, description: string } } = {
    'Acrobacias': { attribute: 'Destreza', description: 'Conservar el equilibrio en situaciones difíciles o realizar una proeza acrobática.' },
    'Atletismo': { attribute: 'Fuerza', description: 'Saltar más lejos de lo normal, mantenerse a flote en aguas revueltas o romper algo.' },
    'Conocimiento arcano': { attribute: 'Inteligencia', description: 'Recordar información acerca de conjuros, objetos mágicos y los planos de existencia.' },
    'Engaño': { attribute: 'Carisma', description: 'Contar una mentira convincente o llevar un disfraz de manera creíble.' },
    'Historia': { attribute: 'Inteligencia', description: 'Recordar información sobre acontecimientos, personas, naciones y culturas de carácter histórico.' },
    'Interpretación': { attribute: 'Carisma', description: 'Actuar, contar una historia, tocar un instrumento o bailar.' },
    'Intimidación': { attribute: 'Carisma', description: 'Asustar o amenazar a alguien para que haga lo que tú quieres.' },
    'Investigación': { attribute: 'Inteligencia', description: 'Encontrar información oculta en libros o deducir cómo funciona algo.' },
    'Juego de manos': { attribute: 'Destreza', description: 'Vaciar los bolsillos a alguien, ocultar un objeto que llevas en la mano o hacer trucos de prestidigitación.' },
    'Medicina': { attribute: 'Sabiduría', description: 'Diagnosticar una enfermedad o determinar de qué ha muerto un fallecido reciente.' },
    'Naturaleza': { attribute: 'Inteligencia', description: 'Recordar información acerca del terreno, la flora, la fauna y el clima.' },
    'Percepción': { attribute: 'Sabiduría', description: 'Mediante una combinación de sentidos, darse cuenta de algo que es fácil pasar por alto.' },
    'Perspicacia': { attribute: 'Sabiduría', description: 'Discernir el estado de ánimo y las intenciones de una persona.' },
    'Persuasión': { attribute: 'Carisma', description: 'Convencer a alguien de algo de una manera sincera y amable.' },
    'Religión': { attribute: 'Inteligencia', description: 'Recordar información sobre dioses, rituales religiosos y símbolos sagrados.' },
    'Sigilo': { attribute: 'Destreza', description: 'Pasar desapercibido al caminar en silencio y ocultarse detrás de las cosas.' },
    'Supervivencia': { attribute: 'Sabiduría', description: 'Seguir huellas, forrajear, encontrar un camino o evitar peligros naturales.' },
    'Trato con animales': { attribute: 'Sabiduría', description: 'Tranquilizar o adiestrar a un animal, conseguir que se comporte de una determinada forma.' }
  };

  // Carga e Interfaces
  loading = true;
  errorLoading = false;
  imageLoaded = false;
  isFallbackBg = false;
  showGuide = true; 
  activeTab = 0;

  // Estado del creador
  currentStep = 1;
  classChosen = false;
  backgroundChosen = false;
  originChosen = false;
  attributesChosen = false;
  equipmentChosen = false;
  selectedEquipmentOption: 'A' | 'B' | null = null;
  selectedEquipmentDescription = '';
  selectedBgEquipmentOption: 'A' | 'B' | null = null;
  selectedBgEquipmentDescription = '';

  // Pool de puntos de atributos base
  attributePointsPool = 15;

  attributes: Attribute[] = [
    { name: 'Fuerza', key: 'FUE', value: 10, description: 'Poderío físico y fuerza muscular.' },
    { name: 'Destreza', key: 'DES', value: 10, description: 'Agilidad, reflejos y equilibrio.' },
    { name: 'Constitución', key: 'CON', value: 10, description: 'Salud, aguante y puntos de golpe.' },
    { name: 'Inteligencia', key: 'INT', value: 10, description: 'Raciocinio, memoria y erudición.' },
    { name: 'Sabiduría', key: 'SAB', value: 10, description: 'Perspicacia, percepción y fortaleza mental.' },
    { name: 'Carisma', key: 'CAR', value: 10, description: 'Confianza, elocuencia, aplomo y encanto.' }
  ];

  backgroundStatsAllocation: { [key: string]: number } = {
    FUE: 0,
    DES: 0,
    CON: 0,
    INT: 0,
    SAB: 0,
    CAR: 0
  };

  skilledFeatSelection: string[] = [];

  allSkillsList: string[] = [
    'Atletismo',
    'Acrobacias',
    'Juego de manos',
    'Sigilo',
    'Conocimiento arcano',
    'Historia',
    'Investigación',
    'Naturaleza',
    'Religión',
    'Medicina',
    'Percepción',
    'Perspicacia',
    'Supervivencia',
    'Trato con animales',
    'Engaño',
    'Interpretación',
    'Intimidación',
    'Persuasión'
  ];

  allToolsList: string[] = [
    'Herramientas de ladrón',
    'Herramientas de navegante',
    'Útiles de herborista',
    'Útiles para falsificar',
    'Suministros de calígrafo',
    'Herramientas de carpintero',
    'Herramientas de cartógrafo',
    'Instrumentos musicales',
    'Herramientas de artesano',
    'Útiles de juego'
  ];

  guideTabs: GuideTab[] = [
    {
      title: '1. Estilo de Juego Ideal',
      icon: '⚔️',
      content: `
        <p>Elegir tu clase define tu forma de interactuar con el mundo y los desafíos de combate:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>Cuerpo a Cuerpo (Tanque/DPS):</strong> Si disfrutas estar en el centro de la acción, absorber daño y golpear duro, clases como el <strong class="text-amber-400">Bárbaro</strong>, el <strong class="text-amber-400">Guerrero</strong> y el <strong class="text-amber-400">Paladín</strong> son tu mejor opción.</li>
          <li><strong>Combate a Distancia:</strong> Si prefieres atacar de lejos con arcos, ballestas o hechizos arcanos tácticos, considera el <strong class="text-amber-400">Explorador</strong>, el <strong class="text-amber-400">Pícaro</strong> (arquero) o magos.</li>
          <li><strong>Lanzamiento de Magia Pura:</strong> Si te atrae la idea de canalizar conjuros poderosos y efectos variables, el <strong class="text-amber-400">Mago</strong>, el <strong class="text-amber-400">Hechicero</strong>, el <strong class="text-amber-400">Brujo</strong> y el <strong class="text-amber-400">Clérigo</strong> son la clave arquetípica.</li>
          <li><strong>Sigilo y Habilidad:</strong> Si prefieres usar la astucia, desactivar trampas y sorprender por la espalda, el <strong class="text-amber-400">Pícaro</strong> y el <strong class="text-amber-400">Explorador</strong> son maestros.</li>
          <li><strong>Soporte y Curación:</strong> Para curar heridas, bendecir a tus aliados y potenciar al grupo, el <strong class="text-amber-400">Clérigo</strong>, el <strong class="text-amber-400">Bardo</strong> y el <strong class="text-amber-400">Druida</strong> son esenciales.</li>
        </ul>
      `
    },
    {
      title: '2. Nivel de Experiencia',
      icon: '🎲',
      content: `
        <p>D&D ofrece mecánicas con diferentes niveles de complejidad para adaptarse a ti:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>Nivel Principiante:</strong> Si eres nuevo en D&D, te recomendamos iniciar con clases directas y de mecánicas estables como el <strong class="text-amber-400">Guerrero</strong>, el <strong class="text-amber-400">Bárbaro</strong> o el <strong class="text-amber-400">Pícaro</strong>. Te permitirán aprender las bases sin abrumarte gestionando hechizos diarios.</li>
          <li><strong>Nivel Experimentado:</strong> Si ya conoces las reglas y buscas mayor profundidad estratégica, aventúrate con clases que administran recursos cambiantes como el <strong class="text-amber-400">Mago</strong> (grimorio), el <strong class="text-amber-400">Hechicero</strong> (metamagia) y el <strong class="text-amber-400">Druida</strong> (forma salvaje).</li>
        </ul>
      `
    },
    {
      title: '3. Trasfondo e Historia',
      icon: '📜',
      content: `
        <p>La clase es el marco narrativo para moldear la personalidad de tu héroe:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>¿Cómo imaginas a tu personaje?:</strong> ¿Es un caballero noble custodiando un juramento sagrado, un mago erudito buscando tomos prohibidos, o un pícaro astuto criado en los barrios bajos?</li>
          <li><strong>¿Qué lo motiva a ir de aventura?:</strong> ¿Busca venganza, obtener un conocimiento olvidado, redimir sus pecados, o simplemente conseguir oro? Tu clase proporciona los recursos y habilidades de combate para respaldar sus motivos.</li>
        </ul>
      `
    },
    {
      title: '4. El Rol en el Grupo',
      icon: '👥',
      content: `
        <p>Un buen grupo de aventureros equilibra sus talentos en la mesa:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>El Tanque:</strong> Absorbe daño y defiende a los aliados débiles (<strong class="text-amber-400">Guerrero, Bárbaro, Paladín</strong>).</li>
          <li><strong>El Apoyo/Sanador:</strong> Restaura puntos de golpe y otorga ventajas tácticas (<strong class="text-amber-400">Clérigo, Bardo, Druida</strong>).</li>
          <li><strong>Daño por Hechizos:</strong> Inflige daño mágico en área o controla el campo (<strong class="text-amber-400">Mago, Hechicero, Brujo</strong>).</li>
          <li><strong>Utilidad / Infiltración:</strong> Abre cerraduras, encuentra trampas y obtiene información de espionaje (<strong class="text-amber-400">Pícaro, Explorador</strong>).</li>
        </ul>
      `
    },
    {
      title: '5. Tus Preferencias',
      icon: '🌟',
      content: `
        <p>Alinea tu clase con los atributos físicos o mentales que más te atraigan:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>Fuerza y Poder Físico:</strong> Bárbaro, Guerrero, Paladín.</li>
          <li><strong>Agilidad y Reflejos:</strong> Pícaro, Explorador, Monje.</li>
          <li><strong>Inteligencia y Estudio Arcane:</strong> Mago.</li>
          <li><strong>Sabiduría y Conexión Espiritual/Natural:</strong> Clérigo, Druida, Monje.</li>
          <li><strong>Carisma y Presencia/Liderazgo:</strong> Bardo, Hechicero, Brujo, Paladín.</li>
        </ul>
      `
    },
    {
      title: '6. Estilo de Campaña',
      icon: '🗺️',
      content: `
        <p>Habla con tu Dungeon Master (DM) para conocer el tono de la partida:</p>
        <ul class="list-disc pl-5 mt-2 space-y-2">
          <li><strong>Campañas de Combate y Mazmorras:</strong> Clases con fuerte aguante y daño sostenido serán altamente resolutivas (<strong class="text-amber-400">Guerrero, Bárbaro, Clérigo</strong>).</li>
          <li><strong>Campañas de Intriga Política y Rol Social:</strong> Clases con alto Carisma y habilidades de persuasión o engaño brillarán más (<strong class="text-amber-400">Bardo, Pícaro, Hechicero</strong>).</li>
          <li><strong>Campañas de Exploración y Zonas Salvajes:</strong> Clases expertas en rastreo y geografía salvaje serán fundamentales (<strong class="text-amber-400">Explorador, Druida</strong>).</li>
        </ul>
      `
    }
  ];

  ngOnInit(): void {
    this.loadGameData();
  }

  loadGameData(): void {
    this.loading = true;
    this.errorLoading = false;
    this.debugStatus = 'Estableciendo conexión con el servidor D&D...';
    this.cdr.detectChanges();

    console.log('loadGameData started');

    const classesObs = this.gameDataService.getClasses().pipe(
      tap({
        next: (val) => {
          console.log('Classes loaded:', val.length);
          this.debugStatus = `Clases cargadas: ${val.length} items`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Classes error:', err);
          this.debugStatus = `Error Clases: ${err.status || err.message || err}`;
          this.cdr.detectChanges();
        }
      })
    );

    const backgroundsObs = this.gameDataService.getBackgrounds().pipe(
      tap({
        next: (val) => {
          console.log('Backgrounds loaded:', val.length);
          this.debugStatus = `Trasfondos cargados: ${val.length} items`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Backgrounds error:', err);
          this.debugStatus = `Error Trasfondos: ${err.status || err.message || err}`;
          this.cdr.detectChanges();
        }
      })
    );

    const originsObs = this.gameDataService.getOrigins().pipe(
      tap({
        next: (val) => {
          console.log('Origins loaded:', val.length);
          this.debugStatus = `Orígenes cargados: ${val.length} items`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Origins error:', err);
          this.debugStatus = `Error Orígenes: ${err.status || err.message || err}`;
          this.cdr.detectChanges();
        }
      })
    );

    combineLatest([classesObs, backgroundsObs, originsObs]).subscribe({
      next: ([classes, backgrounds, origins]) => {
        console.log('combineLatest emitted data successfully');
        this.debugStatus = 'Procesando respuesta del servidor...';
        this.cdr.detectChanges();

        // Ordenar alfabéticamente respetando acentos en español (localeCompare)
        this.classes = classes.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        this.backgrounds = backgrounds.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        const sortedOrigins = origins.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

        // Mapear los statModifiers que vienen de MongoDB a un objeto clave-valor simple
        this.origins = sortedOrigins.map(origin => {
          let modifiers: { [key: string]: number } = {};
          if (origin.statModifiers) {
            // Mongoose a veces devuelve statModifiers como un objeto JS o Map
            const rawMap = origin.statModifiers as any;
            if (rawMap instanceof Map) {
              rawMap.forEach((val, key) => { modifiers[key] = val; });
            } else if (typeof rawMap === 'object') {
              modifiers = { ...rawMap };
            }
          }
          return {
            ...origin,
            statModifiers: modifiers
          };
        });

        // Asegurar la correspondencia del índice inicial seleccionado con el primer elemento del ordenamiento
        this.selectedClassIdx = 0;
        this.selectedBackgroundIdx = 0;
        this.selectedOriginIdx = 0;

        this.debugStatus = 'Carga completa.';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error general cargando los datos de juego:', err);
        this.debugStatus = `Fallo en combineLatest: ${err.status || err.message || 'Error Desconocido'}`;
        this.loading = false;
        this.errorLoading = true;
        this.cdr.detectChanges();
      }
    });
  }

  get activeClass(): DndClass {
    return this.classes[this.selectedClassIdx] || {} as DndClass;
  }

  get activeOrigin(): DndOrigin {
    return this.origins[this.selectedOriginIdx] || {} as DndOrigin;
  }

  get activeBackground(): DndBackground {
    return this.backgrounds[this.selectedBackgroundIdx] || {} as DndBackground;
  }

  selectClass(index: number): void {
    if (this.selectedClassIdx !== index) {
      this.selectedClassIdx = index;
      this.selectedClassSkills = [];
      this.imageLoaded = false;
    }
  }

  selectOrigin(index: number): void {
    if (this.selectedOriginIdx !== index) {
      this.selectedOriginIdx = index;
      this.imageLoaded = false;
    }
  }

  selectBackground(index: number): void {
    if (this.selectedBackgroundIdx !== index) {
      this.selectedBackgroundIdx = index;
      this.imageLoaded = false;
      this.isFallbackBg = false;
      this.featExpanded = false;
      this.backgroundStatsAllocation = {
        FUE: 0,
        DES: 0,
        CON: 0,
        INT: 0,
        SAB: 0,
        CAR: 0
      };
      this.skilledFeatSelection = [];
    }
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
          '<strong>Competencia en iniciativa:</strong> Sumas tu bonificador por competencia a tus tiradas de iniciativa.',
          '<strong>Intercambio de iniciativa:</strong> Justo después de tirar iniciativa, puedes cambiar tu posición en el orden de combate con un aliado dispuesto que no esté incapacitado.'
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
          '<strong>Salud incrementada:</strong> Tus puntos de golpe máximos aumentan en una cantidad igual al doble de tu nivel de personaje.',
          '<strong>Crecimiento por nivel:</strong> Cada vez que subas de nivel, tus puntos de golpe máximos aumentan en 2 puntos adicionales.'
        ]
      };
    }
    if (cleanName.includes('fabricante') || cleanName.includes('crafter')) {
      return {
        title: 'Fabricante',
        benefits: [
          '<strong>Competencia con herramientas:</strong> Ganas competencia con tres herramientas de artesano que elijas de la tabla "Fabricación rápida".',
          '<strong>Descuento del 20%:</strong> Consigues un 20% de descuento al comprar cualquier objeto no mágico.',
          '<strong>Fabricación rápida:</strong> Tras un descanso largo, puedes crear un objeto temporal (linterna, red, yesca, escalera) que durará hasta tu próximo descanso largo.'
        ]
      };
    }
    if (cleanName.includes('habilidoso') || cleanName.includes('skilled')) {
      return {
        title: 'Habilidoso',
        benefits: [
          '<strong>Competencia extra:</strong> Ganas competencia en cualquier combinación de tres habilidades o herramientas que elijas.',
          '<strong>Repetible:</strong> Puedes elegir esta dote más de una vez.'
        ]
      };
    }
    if (cleanName.includes('iniciado en la magia') || cleanName.includes('magic initiate')) {
      return {
        title: 'Iniciado en la Magia',
        benefits: [
          '<strong>Dos trucos:</strong> Aprendes dos trucos a tu elección de la lista de clérigo, druida o mago.',
          '<strong>Conjuro de nivel 1:</strong> Eliges un conjuro de nivel 1 de la misma lista. Siempre lo tienes preparado y lo puedes lanzar gratis una vez por descanso largo.',
          '<strong>Aptitud mágica:</strong> Usas Inteligencia, Sabiduría o Carisma como aptitud para lanzarlos (a tu elección al seleccionar la dote).'
        ]
      };
    }
    if (cleanName.includes('matón') || cleanName.includes('maton') || cleanName.includes('taberna')) {
      return {
        title: 'Matón de Taberna',
        benefits: [
          '<strong>Ataque desarmado mejorado:</strong> Tu ataque sin armas causa 1d4 + mod. Fuerza de daño contundente.',
          '<strong>Repetir tiradas de daño:</strong> Puedes volver a tirar los 1 en tus dados de daño de ataques desarmados.',
          '<strong>Armas improvisadas:</strong> Tienes competencia con armas improvisadas.',
          '<strong>Empujar:</strong> Al acertar un ataque sin armas, puedes empujar a la criatura 1.5 metros (una vez por turno).'
        ]
      };
    }
    if (cleanName.includes('músico') || cleanName.includes('musico')) {
      return {
        title: 'Músico',
        benefits: [
          '<strong>Formación instrumental:</strong> Ganas competencia con tres instrumentos musicales de tu elección.',
          '<strong>Canción alentadora:</strong> Tras finalizar un descanso corto o largo, tocas para dar inspiración heroica a tus aliados (hasta tu bonificador por competencia).'
        ]
      };
    }
    if (cleanName.includes('sanador') || cleanName.includes('healer')) {
      return {
        title: 'Sanador',
        benefits: [
          '<strong>Médico de batalla:</strong> Gasta un uso de útiles de sanador como acción para tratar a un aliado; este gasta un dado de golpe y recupera esa cantidad + tu bonificador de competencia.',
          '<strong>Repetir curación:</strong> Puedes volver a tirar los 1 al restaurar puntos de golpe con un conjuro o médico de batalla.'
        ]
      };
    }
    
    return {
      title: featName.split('(')[0].trim(),
      benefits: ['Dote de origen del manual. Confiere beneficios únicos y rasgos pasivos a tu aventurero.']
    };
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onImageError(event: any): void {
    event.target.src = '/assets/Logo.png'; 
  }

  onBgImageError(event: any): void {
    event.target.src = '/assets/Logo.png';
    this.isFallbackBg = true;
  }

  onConfirmClass(): void {
    this.classChosen = true;
    this.currentStep = 2;
  }

  onConfirmBackground(): void {
    this.backgroundChosen = true;
    this.currentStep = 3;
    this.imageLoaded = false;
  }

  onConfirmOrigin(): void {
    this.originChosen = true;
    this.currentStep = 4;
  }

  onConfirmAttributes(): void {
    if (this.attributePointsPool === 0) {
      this.attributesChosen = true;
      this.currentStep = 5;
    }
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.currentStep = 1;
    } else if (step === 2 && this.classChosen) {
      this.currentStep = 2;
      this.imageLoaded = false;
      this.isFallbackBg = false;
    } else if (step === 3 && this.backgroundChosen) {
      this.currentStep = 3;
      this.imageLoaded = false;
    } else if (step === 4 && this.originChosen) {
      this.currentStep = 4;
    } else if (step === 5 && this.attributesChosen) {
      this.currentStep = 5;
    } else if (step === 6 && this.equipmentChosen) {
      this.currentStep = 6;
    }
  }

  getOriginModifier(key: string): number {
    return this.activeOrigin.statModifiers ? (this.activeOrigin.statModifiers[key] || 0) : 0;
  }

  getAvailableBackgroundStats(): string[] {
    if (!this.activeBackground || !this.activeBackground.statImprovement) return [];
    const statsStr = this.activeBackground.statImprovement;
    return statsStr.split(',').map(s => {
      const clean = s.trim().toLowerCase();
      if (clean.startsWith('fue')) return 'FUE';
      if (clean.startsWith('des')) return 'DES';
      if (clean.startsWith('con')) return 'CON';
      if (clean.startsWith('int')) return 'INT';
      if (clean.startsWith('sab')) return 'SAB';
      if (clean.startsWith('car')) return 'CAR';
      return '';
    }).filter(k => k !== '');
  }

  getUsedBackgroundStatsPoints(): number {
    const keys = this.getAvailableBackgroundStats();
    let sum = 0;
    keys.forEach(k => {
      sum += this.backgroundStatsAllocation[k] || 0;
    });
    return sum;
  }

  modifyBackgroundStat(key: string, amount: number): void {
    const currentVal = this.backgroundStatsAllocation[key] || 0;
    const totalUsed = this.getUsedBackgroundStatsPoints();

    if (amount > 0) {
      if (currentVal >= 2) return;
      if (totalUsed >= 3) return;
      this.backgroundStatsAllocation[key] = currentVal + 1;
    } else if (amount < 0) {
      if (currentVal <= 0) return;
      this.backgroundStatsAllocation[key] = currentVal - 1;
    }
  }

  getFullAttributeName(key: string): string {
    const names: { [key: string]: string } = {
      FUE: 'Fuerza',
      DES: 'Destreza',
      CON: 'Constitución',
      INT: 'Inteligencia',
      SAB: 'Sabiduría',
      CAR: 'Carisma'
    };
    return names[key] || '';
  }

  modifyAttribute(key: string, amount: number): void {
    const attr = this.attributes.find(a => a.key === key);
    if (!attr) return;

    if (amount > 0 && this.attributePointsPool > 0 && attr.value < 18) {
      attr.value += 1;
      this.attributePointsPool -= 1;
    } else if (amount < 0 && attr.value > 8) {
      attr.value -= 1;
      this.attributePointsPool += 1;
    }
  }

  hasSkilledFeat(): boolean {
    if (!this.activeBackground || !this.activeBackground.keyFeat) return false;
    const cleanFeat = this.activeBackground.keyFeat.toLowerCase();
    return cleanFeat.includes('skilled') || cleanFeat.includes('habilidoso');
  }

  toggleSkilledFeatSelection(item: string): void {
    const idx = this.skilledFeatSelection.indexOf(item);
    if (idx >= 0) {
      this.skilledFeatSelection.splice(idx, 1);
    } else {
      if (this.skilledFeatSelection.length < 3) {
        this.skilledFeatSelection.push(item);
      }
    }
  }

  hasProficiency(name: string): boolean {
    const clean = name.toLowerCase().trim();
    if (this.selectedClassSkills.some(s => s.toLowerCase().trim() === clean)) {
      return true;
    }
    if (this.activeBackground && this.activeBackground.skills) {
      const bgSkills = this.activeBackground.skills.toLowerCase().split(',').map(s => s.trim());
      if (bgSkills.includes(clean)) return true;
    }
    if (this.activeBackground && this.activeBackground.tools) {
      const bgTools = this.activeBackground.tools.toLowerCase().split(',').map(s => s.trim());
      if (bgTools.some(t => t.includes(clean) || clean.includes(t))) return true;
    }
    const classDetails = this.getClassDetailsByClassName(this.activeClass.name);
    if (classDetails && classDetails.tools) {
      const classTools = classDetails.tools.toLowerCase().split(',').map(s => s.trim());
      if (classTools.some(t => t.includes(clean) || clean.includes(t))) return true;
    }
    return false;
  }

  getSkilledSkillsOnly(): string[] {
    return this.skilledFeatSelection.filter(s => this.allSkillsList.includes(s));
  }

  getSkilledToolsOnly(): string[] {
    return this.skilledFeatSelection.filter(t => this.allToolsList.includes(t));
  }

  getAlreadySelectedSkills(): string[] {
    const list: string[] = [...this.selectedClassSkills];
    if (this.activeBackground && this.activeBackground.skills) {
      this.activeBackground.skills.split(',').forEach(s => {
        const clean = s.trim();
        if (clean && !list.includes(clean)) {
          list.push(clean);
        }
      });
    }
    return list;
  }

  restartCreator(): void {
    this.currentStep = 1;
    this.classChosen = false;
    this.backgroundChosen = false;
    this.originChosen = false;
    this.attributesChosen = false;
    this.equipmentChosen = false;
    this.selectedEquipmentOption = null;
    this.selectedEquipmentDescription = '';
    this.selectedBgEquipmentOption = null;
    this.selectedBgEquipmentDescription = '';
    this.selectedClassSkills = [];
    this.attributePointsPool = 15;
    this.selectedClassIdx = 0;
    this.selectedOriginIdx = 0;
    this.selectedBackgroundIdx = 0;
    this.attributes.forEach(a => a.value = 10);
    this.isFallbackBg = false;
    this.backgroundStatsAllocation = {
      FUE: 0,
      DES: 0,
      CON: 0,
      INT: 0,
      SAB: 0,
      CAR: 0
    };
    this.skilledFeatSelection = [];
  }

  saveCharacter(): void {
    const finalStats = this.attributes.map(a => ({
      name: a.name,
      value: this.getFinalAttributeScore(a.key)
    }));
    console.log('Guardando personaje forjado:', {
      clase: this.activeClass.name,
      trasfondo: this.activeBackground.name,
      origen: this.activeOrigin.name,
      atributos: finalStats,
      habilidadesClase: this.selectedClassSkills,
      doteHabilidosoSeleccion: this.hasSkilledFeat() ? this.skilledFeatSelection : []
    });
    alert(`¡Felicidades! Tu aventurero (${this.characterName || 'Héroe'} - ${this.activeClass.name} ${this.activeOrigin.name}, Trasfondo: ${this.activeBackground.name}) ha sido registrado en la mesa de juego.`);
    this.restartCreator();
  }

  // Métodos de cálculo de atributos y habilidades para la Vista Previa
  getFinalAttributeScore(key: string): number {
    const attr = this.attributes.find(a => a.key === key);
    if (!attr) return 10;
    return attr.value + this.getOriginModifier(key) + (this.backgroundStatsAllocation[key] || 0);
  }

  getFinalModifierValue(key: string): number {
    const score = this.getFinalAttributeScore(key);
    return Math.floor((score - 10) / 2);
  }

  getFinalModifier(key: string): string {
    const mod = this.getFinalModifierValue(key);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  hasSkillProficiency(skillName: string): boolean {
    const cleanSkill = skillName.toLowerCase().trim();
    if (this.selectedClassSkills.some(s => s.toLowerCase().trim() === cleanSkill)) {
      return true;
    }
    const skillsList = this.activeBackground.skills.toLowerCase().split(',').map(s => s.trim());
    return skillsList.some(s => s === cleanSkill || s.includes(cleanSkill));
  }

  hasClassSavingThrowProficiency(key: string): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const className = this.activeClass.name.toLowerCase();
    
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
    let modVal = this.getFinalModifierValue(key);
    if (this.hasClassSavingThrowProficiency(key)) {
      modVal += 2;
    }
    return modVal >= 0 ? `+${modVal}` : `${modVal}`;
  }

  getSkillModifier(attrKey: string, skillName: string): string {
    let modVal = this.getFinalModifierValue(attrKey);
    if (this.hasSkillProficiency(skillName)) {
      modVal += 2;
    }
    return modVal >= 0 ? `+${modVal}` : `${modVal}`;
  }

  isSpellcaster(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    return name.includes('mago') || name.includes('hechicero') || name.includes('bardo') || 
           name.includes('brujo') || name.includes('clérigo') || name.includes('clerigo') || 
           name.includes('druida') || name.includes('paladín') || name.includes('paladin') || 
           name.includes('explorador');
  }

  getSpellcastingAbility(): string {
    if (!this.activeClass || !this.activeClass.name) return 'Ninguna';
    const name = this.activeClass.name.toLowerCase();
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
    const mod = this.getFinalModifierValue(key);
    return `${8 + 2 + mod}`;
  }

  getSpellAttackBonus(): string {
    const key = this.getSpellcastingAbility();
    if (key === 'Ninguna') return '—';
    const mod = this.getFinalModifierValue(key);
    const bonus = 2 + mod;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  }

  getHitDieValue(): number {
    return this.activeClass && this.activeClass.hitDie ? Number(this.activeClass.hitDie) : 8;
  }

  hasClassArmorProficiency(type: 'ligeras' | 'medias' | 'pesadas' | 'escudos'): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    
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
    if (!this.activeClass || !this.activeClass.name) return 'Ninguna';
    const name = this.activeClass.name.toLowerCase();
    
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

  getClassDetailsByClassName(name: string): { savingThrows: string, skills: string, tools: string, armor: string, weapons: string } {
    if (!name) return { savingThrows: '—', skills: '—', tools: '—', armor: '—', weapons: '—' };
    const n = name.toLowerCase();
    
    if (n.includes('bárbaro') || n.includes('barbaro')) {
      return {
        savingThrows: 'Fuerza y Constitución',
        skills: 'Elige dos entre: Atletismo, Intimidación, Naturaleza, Percepción, Supervivencia, o Trato con animales.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, escudos',
        weapons: 'Sencillas, marciales'
      };
    }
    if (n.includes('bardo')) {
      return {
        savingThrows: 'Destreza y Carisma',
        skills: 'Elige tres habilidades cualesquiera de tu elección.',
        tools: 'Tres instrumentos musicales cualesquiera.',
        armor: 'Ligeras',
        weapons: 'Sencillas'
      };
    }
    if (n.includes('brujo')) {
      return {
        savingThrows: 'Sabiduría y Carisma',
        skills: 'Elige dos entre: Conocimiento Arcano, Engaño, Historia, Intimidación, Investigación, Naturaleza, o Religión.',
        tools: 'Ninguna',
        armor: 'Ligeras',
        weapons: 'Sencillas'
      };
    }
    if (n.includes('clérigo') || n.includes('clerigo')) {
      return {
        savingThrows: 'Sabiduría y Carisma',
        skills: 'Elige dos entre: Conocimiento Arcano, Historia, Medicina, Persuasión, o Religión.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, escudos*',
        weapons: 'Sencillas**'
      };
    }
    if (n.includes('druida')) {
      return {
        savingThrows: 'Inteligencia y Sabiduría',
        skills: 'Elige dos entre: Conocimiento Arcano, Medicina, Naturaleza, Percepción, Perspicacia, Religión, Supervivencia, o Trato con animales.',
        tools: 'Útiles de herborista.',
        armor: 'Ligeras, medias, escudos***',
        weapons: 'Sencillas***'
      };
    }
    if (n.includes('explorador')) {
      return {
        savingThrows: 'Fuerza y Destreza',
        skills: 'Elige tres entre: Atletismo, Investigación, Naturaleza, Percepción, Perspicacia, Sigilo, Supervivencia, o Trato con animales.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, escudos',
        weapons: 'Sencillas, marciales'
      };
    }
    if (n.includes('guerrero')) {
      return {
        savingThrows: 'Fuerza y Constitución',
        skills: 'Elige dos entre: Acrobacias, Atletismo, Historia, Intimidación, Percepción, Perspicacia, o Supervivencia.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, pesadas, escudos',
        weapons: 'Sencillas, marciales'
      };
    }
    if (n.includes('hechicero')) {
      return {
        savingThrows: 'Constitución y Carisma',
        skills: 'Elige dos entre: Conocimiento Arcano, Engaño, Intimidación, Persuasión, o Religión.',
        tools: 'Ninguna',
        armor: 'Ninguna',
        weapons: 'Sencillas'
      };
    }
    if (n.includes('mago')) {
      return {
        savingThrows: 'Inteligencia y Sabiduría',
        skills: 'Elige dos entre: Conocimiento Arcano, Historia, Investigación, Medicina, o Religión.',
        tools: 'Ninguna',
        armor: 'Ninguna',
        weapons: 'Sencillas'
      };
    }
    if (n.includes('monje')) {
      return {
        savingThrows: 'Fuerza y Destreza',
        skills: 'Elige dos entre: Acrobacias, Atletismo, Historia, Percepción, Perspicacia, o Sigilo.',
        tools: 'Una: herramienta de artesano o instrumento musical.',
        armor: 'Ninguna****',
        weapons: 'Sencillas****'
      };
    }
    if (n.includes('paladín') || n.includes('paladin')) {
      return {
        savingThrows: 'Sabiduría y Carisma',
        skills: 'Elige dos entre: Atletismo, Intimidación, Medicina, Percepción, Persuasión, o Religión.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, pesadas, escudos',
        weapons: 'Sencillas, marciales'
      };
    }
    if (n.includes('pícaro') || n.includes('picaro')) {
      return {
        savingThrows: 'Destreza e Inteligencia',
        skills: 'Elige cuatro entre: Acrobacias, Atletismo, Engaño, Interpretación, Intimidación, Investigación, Percepción, Perspicacia, Persuasión, Juego de Manos, o Sigilo.',
        tools: 'Herramientas de ladrón.',
        armor: 'Ligeras',
        weapons: 'Sencillas'
      };
    }
    return { savingThrows: '—', skills: '—', tools: '—', armor: '—', weapons: '—' };
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
        optionA: 'Daga, un instrumento musical a tu elección, paquete de artista y 19 po.',
        optionB: '90 po'
      };
    }
    if (n.includes('brujo')) {
      return {
        optionA: 'Daga, hoz, foco arcano (orbe o bastón), libro (conocimiento oculto), paquete de erudito y 15 po.',
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
        optionA: 'Garrote, hoz, foco druídico (rama de muérdago o bastón), paquete de explorador, útiles de herborista y 9 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('explorador')) {
      return {
        optionA: 'Espada corta, arco corto, 20 flechas, carcaj, foco druídico (rama de muérdago o bastón), paquete de explorador y 7 po.',
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
        optionA: 'Daga, ballesta ligera, 20 virotes, foco arcano (orbe o bastón), paquete de erudito y 28 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('mago')) {
      return {
        optionA: 'Daga, foco arcano (orbe o bastón), libro de conjuros, paquete de erudito y 5 po.',
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

  selectEquipmentOption(opt: 'A' | 'B'): void {
    this.selectedEquipmentOption = opt;
    const opts = this.getClassEquipmentOptions(this.activeClass.name);
    this.selectedEquipmentDescription = opt === 'A' ? opts.optionA : opts.optionB;
  }

  onConfirmEquipment(): void {
    if (this.selectedEquipmentOption && this.selectedBgEquipmentOption) {
      this.equipmentChosen = true;
      this.currentStep = 6;
    } else {
      alert('Por favor, selecciona una opción de equipo de clase y una de trasfondo antes de continuar.');
    }
  }

  getStartingGold(): string {
    let classGold = 0;
    if (this.selectedEquipmentOption === 'B') {
      const goldStr = this.getClassEquipmentOptions(this.activeClass.name).optionB;
      classGold = Number(goldStr.replace('po', '').trim()) || 0;
    } else if (this.selectedEquipmentOption === 'A') {
      const desc = this.getClassEquipmentOptions(this.activeClass.name).optionA;
      const match = desc.match(/(\d+)\s*po/i);
      classGold = match ? Number(match[1]) : 0;
    }

    let bgGold = 0;
    if (this.selectedBgEquipmentOption === 'B') {
      const goldStr = this.getBgEquipmentOptions(this.activeBackground.name).optionB;
      bgGold = Number(goldStr.replace('po', '').trim()) || 0;
    } else if (this.selectedBgEquipmentOption === 'A') {
      const desc = this.getBgEquipmentOptions(this.activeBackground.name).optionA;
      const match = desc.match(/(\d+)\s*po/i);
      bgGold = match ? Number(match[1]) : 0;
    }

    return String(classGold + bgGold);
  }

getClassSkillLimit(className: string): number {
    if (!className) return 2;
    const n = className.toLowerCase();
    if (n.includes('bardo')) return 3;
    if (n.includes('explorador')) return 3;
    if (n.includes('pícaro') || n.includes('picaro')) return 4;
    return 2;
  }

  getClassSkillList(className: string): string[] {
    if (!className) return [];
    const n = className.toLowerCase();
    if (n.includes('bárbaro') || n.includes('barbaro')) {
      return ['Atletismo', 'Intimidación', 'Naturaleza', 'Percepción', 'Supervivencia', 'Trato con animales'];
    }
    if (n.includes('bardo')) {
      return Object.keys(this.skillsMetadata);
    }
    if (n.includes('brujo')) {
      return ['Conocimiento arcano', 'Engaño', 'Historia', 'Intimidación', 'Investigación', 'Naturaleza', 'Religión'];
    }
    if (n.includes('clérigo') || n.includes('clerigo')) {
      return ['Conocimiento arcano', 'Historia', 'Medicina', 'Persuasión', 'Religión'];
    }
    if (n.includes('druida')) {
      return ['Conocimiento arcano', 'Medicina', 'Naturaleza', 'Percepción', 'Perspicacia', 'Religión', 'Supervivencia', 'Trato con animales'];
    }
    if (n.includes('explorador')) {
      return ['Atletismo', 'Investigación', 'Naturaleza', 'Percepción', 'Perspicacia', 'Sigilo', 'Supervivencia', 'Trato con animales'];
    }
    if (n.includes('guerrero')) {
      return ['Acrobacias', 'Atletismo', 'Historia', 'Intimidación', 'Percepción', 'Perspicacia', 'Supervivencia'];
    }
    if (n.includes('hechicero')) {
      return ['Conocimiento arcano', 'Engaño', 'Intimidación', 'Persuasión', 'Religión'];
    }
    if (n.includes('mago')) {
      return ['Conocimiento arcano', 'Historia', 'Investigación', 'Medicina', 'Religión'];
    }
    if (n.includes('monje')) {
      return ['Acrobacias', 'Atletismo', 'Historia', 'Percepción', 'Perspicacia', 'Sigilo'];
    }
    if (n.includes('paladín') || n.includes('paladin')) {
      return ['Atletismo', 'Intimidación', 'Medicina', 'Percepción', 'Persuasión', 'Religión'];
    }
    if (n.includes('pícaro') || n.includes('picaro')) {
      return ['Acrobacias', 'Atletismo', 'Engaño', 'Interpretación', 'Intimidación', 'Investigación', 'Percepción', 'Perspicacia', 'Persuasión', 'Juego de manos', 'Sigilo'];
    }
    return [];
  }

  isClassSkillSelected(skill: string): boolean {
    return this.selectedClassSkills.includes(skill);
  }

  toggleClassSkill(skill: string): void {
    const limit = this.getClassSkillLimit(this.activeClass.name);
    const index = this.selectedClassSkills.indexOf(skill);
    if (index > -1) {
      this.selectedClassSkills.splice(index, 1);
    } else if (this.selectedClassSkills.length < limit) {
      this.selectedClassSkills.push(skill);
    }
  }

  getSkillAttribute(skillName: string): string {
    const clean = skillName.trim();
    const key = Object.keys(this.skillsMetadata).find(k => k.toLowerCase() === clean.toLowerCase());
    if (key && this.skillsMetadata[key]) {
      return this.skillsMetadata[key].attribute;
    }
    return '—';
  }

  getSkillDescription(skillName: string): string {
    const clean = skillName.trim();
    const key = Object.keys(this.skillsMetadata).find(k => k.toLowerCase() === clean.toLowerCase());
    if (key && this.skillsMetadata[key]) {
      return this.skillsMetadata[key].description;
    }
    return '—';
  }

  getBgEquipmentOptions(name: string): { optionA: string, optionB: string } {
    if (!name) return { optionA: '—', optionB: '—' };
    const n = name.toLowerCase();
    
    if (n.includes('acólito') || n.includes('acolito')) {
      return {
        optionA: 'Suministros de calígrafo, libro (de oraciones), pergamino (10 hojas), símbolo sagrado, túnica y 8 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('animador')) {
      return {
        optionA: 'Instrumento musical (a tu elección), 2 disfraces, espejo, perfume, ropas de viaje y 11 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('artesano')) {
      return {
        optionA: 'Herramientas de artesano (a tu elección), 2 bolsas, ropas de viaje y 32 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('campesino')) {
      return {
        optionA: 'Hoz, herramientas de carpintero, útiles de sanador, olla de hierro, pala, ropas de viaje y 30 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('charlatán') || n.includes('charlatan')) {
      return {
        optionA: 'Útiles para falsificar, disfraz, ropas de calidad y 15 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('comerciante')) {
      return {
        optionA: 'Herramientas de navegante, 2 bolsas, ropas de viaje y 22 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('criminal')) {
      return {
        optionA: '2 dagas, herramientas de ladrón, 2 bolsas, palanqueta, ropas de viaje y 16 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('ermitaño') || n.includes('ermitanno')) {
      return {
        optionA: 'Bastón, útiles de herborista, aceite (3 frascos), lámpara, libro (de filosofía), petate, ropas de viaje y 16 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('erudito')) {
      return {
        optionA: 'Bastón, suministros de calígrafo, libro (de historia), pergamino (8 hojas), túnica y 8 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('escriba')) {
      return {
        optionA: 'Suministros de calígrafo, aceite (3 frascos), lámpara, pergamino (12 hojas), ropas de calidad y 23 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('guardia')) {
      return {
        optionA: 'Lanza, ballesta ligera, 20 virotes, juego (a tu elección), aljaba, esposas, linterna sorda, ropas de viaje y 12 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('guía') || n.includes('guia')) {
      return {
        optionA: 'Arco corto, 20 flechas, herramientas de cartógrafo, aljaba, petate, tienda de campaña, ropas de viaje y 3 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('marinero')) {
      return {
        optionA: 'Daga, herramientas de navegante, cuerda, ropas de viaje y 20 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('noble')) {
      return {
        optionA: 'Juego (a tu elección), perfume, ropas de calidad y 29 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('soldado')) {
      return {
        optionA: 'Lanza, arco corto, 20 flechas, aljaba, juego (a tu elección), útiles de sanador, ropas de viaje y 14 po.',
        optionB: '50 po'
      };
    }
    if (n.includes('vagabundo')) {
      return {
        optionA: '2 dagas, herramientas de ladrón, juego (a tu elección), 2 bolsas, petate, ropas de viaje y 16 po.',
        optionB: '50 po'
      };
    }
    return { optionA: '—', optionB: '—' };
  }

  selectBgEquipmentOption(opt: 'A' | 'B'): void {
    this.selectedBgEquipmentOption = opt;
    const opts = this.getBgEquipmentOptions(this.activeBackground.name);
    this.selectedBgEquipmentDescription = opt === 'A' ? opts.optionA : opts.optionB;
  }
}
