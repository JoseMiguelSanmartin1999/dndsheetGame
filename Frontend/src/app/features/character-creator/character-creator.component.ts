import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DndClass {
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

interface DndOrigin {
  name: string;
  icon: string;
  bonus: string;
  speed: string;
  language: string;
  trait: string;
  image: string;
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
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#08080a] bg-radial from-[#130d0d] via-[#08080a] to-[#040405] text-neutral-200 p-6 md:p-10 pb-20 relative">
      
      <!-- Modal / Overlay de la Guía de Selección de Clases -->
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

          <!-- Cuerpo: Grid con pestañas izquierdas y contenido derecho -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            <!-- Pestañas (Izquierda) -->
            <div class="w-full md:w-1/3 bg-[#0d0d0f]/50 border-r border-neutral-900 p-4 overflow-y-auto space-y-1 shrink-0">
              <button 
                *ngFor="let tab of guideTabs; let idx = index"
                (click)="activeTab = idx"
                class="w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition duration-200 border cursor-pointer flex items-center gap-3 focus:outline-none uppercase tracking-wider"
                [ngClass]="activeTab === idx ? 'bg-red-950/20 border-red-500/40 text-[#d4af37] shadow-sm' : 'bg-transparent border-transparent hover:bg-neutral-850/40 text-neutral-400 hover:text-neutral-300'"
              >
                <span>{{ tab.icon }}</span>
                <span>{{ tab.title }}</span>
              </button>
            </div>

            <!-- Contenido de la pestaña activa (Derecha) -->
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

          <!-- Pie del Manual con Botón de Continuar -->
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
      <div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        <!-- Barra de progreso superior -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-6">
          <div class="space-y-1 text-center md:text-left flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h1 class="text-3xl font-serif font-extrabold tracking-wider text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FORJA DE AVENTUREROS
              </h1>
              <p class="text-xs text-neutral-400 font-light">Sigue los pasos ancestrales para dar vida a tu personaje.</p>
            </div>
            
            <!-- Botón flotante del manual (solo visible en paso 1 de Clases) -->
            <button 
              *ngIf="currentStep === 1"
              (click)="showGuide = true"
              class="text-xs bg-[#1e1e24] hover:bg-neutral-800 border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5 h-fit mt-1 self-center"
            >
              📖 Manual de Guía
            </button>
          </div>

          <!-- Barra de Progreso de Creación -->
          <div class="flex items-center gap-2 md:gap-4 bg-[#121215] border border-neutral-800/80 px-4 py-2.5 rounded-xl shadow-lg">
            <!-- Paso 1: Clase -->
            <button 
              (click)="goToStep(1)" 
              class="flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 1 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-850 border border-neutral-700 text-neutral-400'"
              >
                1
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 1 ? 'text-[#d4af37]' : 'text-neutral-400'">Clase</span>
            </button>
            <div class="w-8 h-px bg-neutral-800"></div>

            <!-- Paso 2: Origen -->
            <button 
              (click)="goToStep(2)" 
              [disabled]="currentStep < 2 && !classChosen" 
              class="flex items-center gap-1.5 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition"
                [ngClass]="currentStep >= 2 ? 'bg-gradient-to-tr from-red-800 to-amber-500 border border-[#d4af37]/50 shadow-red-900/30' : 'bg-neutral-850 border border-neutral-700 text-neutral-400'"
              >
                2
              </div>
              <span class="text-xs font-bold transition" [ngClass]="currentStep === 2 ? 'text-[#d4af37]' : 'text-neutral-400'">Origen</span>
            </button>
            <div class="w-8 h-px bg-neutral-800"></div>

            <!-- Paso 3: Atributos -->
            <div class="flex items-center gap-1.5 opacity-40">
              <div class="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">3</div>
              <span class="text-xs font-medium text-neutral-400">Atributos</span>
            </div>
            <div class="w-8 h-px bg-neutral-800"></div>

            <!-- Paso 4: Trasfondo -->
            <div class="flex items-center gap-1.5 opacity-40">
              <div class="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">4</div>
              <span class="text-xs font-medium text-neutral-400">Trasfondo</span>
            </div>
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
          <section class="lg:col-span-4 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-xl h-[680px] flex flex-col justify-between overflow-y-auto">
            <div class="space-y-6">
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
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Baja' || activeClass.complexity === 'Media' || activeClass.complexity === 'Alta' ? 'bg-emerald-500' : 'bg-neutral-850'"></div>
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Media' || activeClass.complexity === 'Alta' ? 'bg-amber-500' : 'bg-neutral-850'"></div>
                      <div class="w-1.5 h-3 rounded" [ngClass]="activeClass.complexity === 'Alta' ? 'bg-red-500' : 'bg-neutral-850'"></div>
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

              <!-- Descripción Completa -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Descripción de tu Senda</h4>
                <p class="text-xs text-neutral-400 leading-relaxed bg-[#18181c] border border-neutral-800 p-4 rounded-lg h-36 overflow-y-auto custom-scrollbar">
                  {{ activeClass.description }}
                </p>
              </div>
            </div>

            <button 
              (click)="onConfirmClass()"
              class="w-full mt-6 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-sm border-t border-red-500/20 font-serif cursor-pointer"
            >
              Elegir {{ activeClass.name }} y Continuar
            </button>
          </section>

        </div>

        <!-- ================= PASO 2: SELECCIÓN DE ORIGEN ================= -->
        <div *ngIf="currentStep === 2" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
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

          <!-- Columna 2: Título e Imagen del Origen (con fallback) -->
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
                <div class="flex flex-col bg-[#18181c] border border-neutral-800 p-4 rounded-lg space-y-1">
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

            <!-- Botones de navegación en Paso 2 -->
            <div class="flex gap-3 mt-6">
              <button 
                (click)="goToStep(1)"
                class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-wider cursor-pointer transition duration-200"
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
  `]
})
export class CharacterCreatorComponent {
  selectedClassIdx = 0;
  selectedOriginIdx = 0;
  imageLoaded = false;
  showGuide = true; 
  activeTab = 0;

  // Estado del paso actual (Paso 1: Clase, Paso 2: Origen)
  currentStep = 1;
  classChosen = false; // Bandera para saber si ya seleccionó al menos una clase

  classes: DndClass[] = [
    {
      name: 'Bárbaro',
      icon: '🪓',
      preference: 'Batalla',
      primaryStat: 'Fuerza',
      complexity: 'Media',
      image: 'Barbaros.png',
      hitDie: 'd12',
      quote: 'Entra en una furia berserker desatando el caos y la violencia.',
      description: 'Un fiero guerrero de trasfondo primitivo que puede entrar en una furia de combate física brutal. Resiste grandes cantidades de daño y domina el uso de armas de gran tamaño para sembrar la devastación en primera línea.'
    },
    {
      name: 'Bardo',
      icon: '🎵',
      preference: 'Actuación',
      primaryStat: 'Carisma',
      complexity: 'Alta',
      image: 'Bardo.png',
      hitDie: 'd8',
      quote: 'La música es el lenguaje primordial del multiverso.',
      description: 'Un músico y erudito que inspira a sus aliados con música y arte. Puede conjurar ilusiones, sanar heridas y manipular los pensamientos de otros gracias a la magia sónica que fluye a través de sus acordes y poemas.'
    },
    {
      name: 'Brujo',
      icon: '👁️',
      preference: 'Ocultismo',
      primaryStat: 'Carisma',
      complexity: 'Alta',
      image: 'Brujo.png',
      hitDie: 'd8',
      quote: 'Pactar con la oscuridad es el precio a pagar por el conocimiento.',
      description: 'Un taumaturgo que pacta con entidades de otros mundos, como señores demoníacos o arcanos antiguos, a cambio de poderes mágicos oscuros. Utiliza trucos muy potentes y posee dones misticos únicos conferidos por su patrón.'
    },
    {
      name: 'Clérigo',
      icon: '☀️',
      preference: 'Dioses',
      primaryStat: 'Sabiduría',
      complexity: 'Media',
      image: 'Clerigo.png',
      hitDie: 'd8',
      quote: 'Mi fe es el escudo de mi pueblo y el martillo de mi señor.',
      description: 'Un sacerdote consagrado que canaliza el poder divino de su deidad para curar a sus aliados, expulsar a los no-muertos o golpear a los infieles con fuegos y rayos divinos en el campo de batalla.'
    },
    {
      name: 'Druida',
      icon: '🌿',
      preference: 'Naturaleza',
      primaryStat: 'Sabiduría',
      complexity: 'Alta',
      image: 'Druida.png',
      hitDie: 'd8',
      quote: 'El bosque reclama lo que el hombre le ha robado.',
      description: 'Un guardián del mundo natural capaz de conjurar las fuerzas elementales del viento, la tormenta o las plantas. Su don más célebre es la Forma Salvaje, que le permite transformarse en animales temibles.'
    },
    {
      name: 'Explorador',
      icon: '🏹',
      preference: 'Supervivencia',
      primaryStat: 'Destreza y Sabiduría',
      complexity: 'Media',
      image: 'Explorador.png',
      hitDie: 'd10',
      quote: 'Ningún rastro se me escapa, ninguna presa vive para contarlo.',
      description: 'Un cazador y rastreador letal especializado en la supervivencia salvaje y el combate a distancia o con dos armas. Domina técnicas de emboscada y utiliza un vínculo espiritual sutil con el entorno natural.'
    },
    {
      name: 'Guerrero',
      icon: '⚔️',
      preference: 'Armas',
      primaryStat: 'Fuerza o Destreza',
      complexity: 'Baja',
      image: 'Guerrero.png',
      hitDie: 'd10',
      quote: 'El acero y la táctica deciden el destino de los reinos.',
      description: 'Un maestro táctico experto en el combate armado y el uso de armaduras de todo tipo. Versátil, letal y resistente, el guerrero es capaz de realizar múltiples ataques en un solo instante y sostener el combate frontal.'
    },
    {
      name: 'Hechicero',
      icon: '✨',
      preference: 'Poderes',
      primaryStat: 'Carisma',
      complexity: 'Alta',
      image: 'Hechicero.png',
      hitDie: 'd6',
      quote: 'La magia no es algo que estudio, es lo que soy.',
      description: 'Un taumaturgo innato que manipula la magia a través de un don de nacimiento (como sangre de dragón o magia salvaje). Utiliza su Metamagia para alterar la duración, alcance o potencia de sus conjuros al vuelo.'
    },
    {
      name: 'Mago',
      icon: '📖',
      preference: 'Libros de conjuros',
      primaryStat: 'Inteligencia',
      complexity: 'Media',
      image: 'Mago.png',
      hitDie: 'd6',
      quote: 'El conocimiento absoluto aguarda en las páginas correctas.',
      description: 'Un estudiante erudito que memoriza, estudia y cataloga conjuros en su grimorio personal. Al aprender magia a través de fórmulas y la ciencia, posee el catálogo de conjuros más versátil y letal del juego.'
    },
    {
      name: 'Monje',
      icon: '🥊',
      preference: 'Combate sin armas y Sabiduría',
      primaryStat: 'Destreza y Sabiduría',
      complexity: 'Alta',
      image: 'Monje.png',
      hitDie: 'd8',
      quote: 'El cuerpo es el arma definitiva, la mente su único maestro.',
      description: 'Un artista marcial que canaliza su energía vital espiritual (Ki) para acelerar sus movimientos, esquivar ataques sin armadura y derribar oponentes con golpes desarmados veloces y debilitantes.'
    },
    {
      name: 'Paladín',
      icon: '🛡️',
      preference: 'Defensa y Carisma',
      primaryStat: 'Fuerza y Carisma',
      complexity: 'Media',
      image: 'Paladin.png',
      hitDie: 'd10',
      quote: 'Por el juramento que hice, seré la luz en la oscuridad.',
      description: 'Un guerrero sagrado ligado a un juramento inquebrantable de justicia y protección. Imbuye sus golpes con Castigo Divino y genera auras que protegen la mente y cuerpo de sus aliados más cercanos.'
    },
    {
      name: 'Pícaro',
      icon: '🗡️',
      preference: 'Sigilo',
      primaryStat: 'Destreza',
      complexity: 'Baja',
      image: 'Picaro.png',
      hitDie: 'd8',
      quote: 'Las mejores batallas se ganan sin que el enemigo sepa que empezaron.',
      description: 'Un especialista táctico que prefiere las sombras, la infiltración y los ataques furtivos letales. Domina el desarmado de trampas, el robo y el posicionamiento astuto para golpear los puntos vulnerables.'
    }
  ];

  origins: DndOrigin[] = [
    {
      name: 'Humano',
      icon: '👤',
      bonus: '+1 a todas las puntuaciones de característica',
      speed: '30 pies (9 metros)',
      language: 'Común y un idioma extra a elección',
      trait: 'Versatilidad Humana (Obtienes competencias adicionales a elección).',
      image: 'Humano.png',
      description: 'Los humanos son los más adaptables y diversos de todos los pueblos. No tienen una inclinación extrema hacia la magia o la fuerza, sino que destacan en todas las disciplinas por su inmensa ambición, adaptabilidad y resiliencia en cualquier entorno.'
    },
    {
      name: 'Elfo',
      icon: '🧝',
      bonus: '+2 Destreza, +1 Inteligencia (Elfo Alto) o Sabiduría (Elfo de los Bosques)',
      speed: '30 pies (9 metros) o 35 pies (Elfo de los Bosques)',
      language: 'Común y Élfico',
      trait: 'Ancestros Feéricos (Ventaja contra ser hechizado y la magia no te puede dormir).',
      image: 'Elfo.png',
      description: 'Seres mágicos de gracia sobrenatural, los elfos viven en comunión con la naturaleza y la magia antigua. Tienen vidas de más de 700 años, visión en la oscuridad y un refinamiento innato en arquería, espada y artes místicas.'
    },
    {
      name: 'Enano',
      icon: '🧔',
      bonus: '+2 Constitución, +1 Fuerza (Enano de la Montaña) o Sabiduría (Enano de la Colina)',
      speed: '25 pies (7.5 metros), no reducida por armadura pesada',
      language: 'Común y Enano',
      trait: 'Resistencia Enana (Ventaja en tiradas de salvación contra veneno y resistencia al daño por veneno).',
      image: 'Enano.png',
      description: 'Fuertes, tenaces y orgullosos, los enanos habitan en fortalezas labradas bajo las montañas. Poseen una afinidad ancestral por los metales y las piedras preciosas, una gran destreza en la herrería y una resistencia física insuperable.'
    },
    {
      name: 'Mediano',
      icon: '🍀',
      bonus: '+2 Destreza, +1 Carisma (Piesligeros) o Constitución (Fuerte)',
      speed: '25 pies (7.5 metros)',
      language: 'Común y Mediano',
      trait: 'Afortunado (Cuando obtienes un 1 natural en un d20 de ataque, salvación o habilidad, puedes repetir el dado).',
      image: 'Mediano.png',
      description: 'Los medianos prefieren una vida apacible, alejada de monstruos y batallas, enfocándose en la buena comida y la calidez del hogar. Sin embargo, su tamaño pequeño, pies sigilosos, agilidad excepcional y asombrosa suerte los convierte en increíbles pícaros y aventureros.'
    },
    {
      name: 'Dracónido',
      icon: '🐲',
      bonus: '+2 Fuerza, +1 Carisma',
      speed: '30 pies (9 metros)',
      language: 'Común y Dracónico',
      trait: 'Arma de Aliento (Exhalas energía elemental destructiva de fuego, hielo, rayo o ácido según tu ancestro dracónico).',
      image: 'Draconido.png',
      description: 'Orgullosos descendientes de los dragones, los dracónidos caminan con honor y devoción a sus clanes. Poseen escamas gruesas de colores brillantes que les otorgan resistencia al elemento de su ancestro protector y canalizan su furia elemental en un temible aliento.'
    },
    {
      name: 'Tiflin',
      icon: '😈',
      bonus: '+2 Carisma, +1 Inteligencia',
      speed: '30 pies (9 metros)',
      language: 'Común e Infernal',
      trait: 'Resistencia Elemental (Resistencia al daño por fuego) y Legado Infernal (Magia innata).',
      image: 'Tiflin.png',
      description: 'Portadores de un linaje infernal antiguo debido a pactos pasados en sus familias, los tiflin a menudo enfrentan recelo. Son astutos, autosuficientes y poseen un control innato sobre la magia oscura y las llamas.'
    }
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

  get activeClass(): DndClass {
    return this.classes[this.selectedClassIdx];
  }

  get activeOrigin(): DndOrigin {
    return this.origins[this.selectedOriginIdx];
  }

  selectClass(index: number): void {
    if (this.selectedClassIdx !== index) {
      this.selectedClassIdx = index;
      this.imageLoaded = false;
    }
  }

  selectOrigin(index: number): void {
    if (this.selectedOriginIdx !== index) {
      this.selectedOriginIdx = index;
      this.imageLoaded = false;
    }
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onImageError(event: any): void {
    event.target.src = '/assets/Logo.png'; 
  }

  onConfirmClass(): void {
    this.classChosen = true;
    this.currentStep = 2;
    this.imageLoaded = false;
  }

  onConfirmOrigin(): void {
    console.log(`Origen elegido: ${this.activeOrigin.name}`);
    alert(`Has elegido el origen ${this.activeOrigin.name} para tu personaje clase ${this.activeClass.name}. ¡Siguiente paso: Atributos! (Próximamente)`);
  }

  goToStep(step: number): void {
    if (step === 1 || (step === 2 && this.classChosen)) {
      this.currentStep = step;
      this.imageLoaded = false;
    }
  }
}
