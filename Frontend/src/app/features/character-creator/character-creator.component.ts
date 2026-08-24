import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, tap, combineLatest } from 'rxjs';
import { GameDataService, DndClass, DndOrigin, DndBackground } from '../../data/services/game-data.service';
import { CharacterService, Character } from '../../data/services/character.service';
import { AuthService } from '../../data/services/auth.service';

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

const DND_PACKAGES: { [key: string]: { title: string, items: string[] } } = {
  'paquete de artista': {
    title: 'Paquete de Artista',
    items: ['Campana', 'Cantimplora', '3 disfraces', 'Espejo', '8 frascos de aceite', 'Linterna de ojo de buey', 'Mochila', 'Petate', 'Raciones para 9 días', 'Yesquero']
  },
  'paquete de diplomático': {
    title: 'Paquete de Diplomático',
    items: ['Cofre', '2 estuches para mapas o pergaminos', '4 frascos de aceite', '5 hojas de papel', '5 hojas de pergamino', 'Lámpara', 'Perfume', '5 plumas', 'Ropas de calidad', 'Tinta', 'Yesquero']
  },
  'paquete de erudito': {
    title: 'Paquete de Erudito',
    items: ['10 frascos de aceite', '10 hojas de pergamino', 'Lámpara', 'Libro', 'Mochila', 'Pluma', 'Tinta', 'Yesquero']
  },
  'paquete de explorador': {
    title: 'Paquete de Explorador',
    items: ['10 antorchas', 'Cantimplora', 'Cuerda', '2 frascos de aceite', 'Mochila', 'Petate', 'Raciones para 10 días', 'Yesquero']
  },
  'paquete de explorador de mazmorras': {
    title: 'Paquete de Explorador de Mazmorras',
    items: ['Abrojos', '10 antorchas', 'Cantimplora', 'Cuerda', '2 frascos de aceite', 'Mochila', 'Palanqueta', 'Raciones para 10 días', 'Yesquero']
  },
  'paquete de ladrón': {
    title: 'Paquete de Ladrón',
    items: ['Bolas de metal', 'Campana', 'Cantimplora', 'Cuerda', '7 frascos de aceite', 'Linterna sorda', 'Mochila', 'Palanqueta', 'Raciones para 5 días', '10 velas', 'Yesquero']
  },
  'paquete de sacerdote': {
    title: 'Paquete de Sacerdote',
    items: ['Agua bendita', 'Lámpara', 'Manta', 'Mochila', 'Raciones para 7 días', 'Túnica', 'Yesquero']
  }
};

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

              <!-- SECCIÓN DE SELECCIÓN DE HECHIZOS PARA BARDO (Dinámico por Nivel) -->
              <div *ngIf="isBard()" class="bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl space-y-4 text-left animate-fade-in">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">📜 Hechizos de Bardo (D&D 2024)</span>
                  <span class="text-[8px] bg-amber-955/20 border border-amber-600/30 px-2 py-0.5 rounded text-amber-500 font-mono font-bold select-none">
                    Nivel {{ characterLevel }}
                  </span>
                </div>
                
                <!-- Selector de Nivel Inicial (Mover o duplicar aquí para que sea interactivo con hechizos) -->
                <div class="space-y-1 bg-amber-955/10 border border-amber-500/20 p-2.5 rounded-lg text-left">
                  <label class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Establecer Nivel Inicial:</label>
                  <select
                    [(ngModel)]="characterLevel"
                    (change)="onLevelChange()"
                    class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-3 py-1.5 rounded text-xs text-neutral-200 font-semibold cursor-pointer"
                  >
                    <option *ngFor="let lvl of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]" [value]="lvl">
                      Nivel {{ lvl }}
                    </option>
                  </select>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos y hechizos preparados según la tabla.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-400 leading-normal font-light font-sans">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getBardCantripsLimit() }} trucos** y **{{ getBardSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getBardMaxSpellLevel() }}**:
                </p>

                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Bardo (Elige exactamente {{ getBardCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedBardCantrips.length }} / {{ getBardCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of bardCantripsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedBardCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedBardCantrips.includes(cantrip.name)"
                        (change)="toggleBardCantrip(cantrip.name)"
                        [disabled]="!selectedBardCantrips.includes(cantrip.name) && selectedBardCantrips.length >= getBardCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleBardCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getBardSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedBardSpells.length }} / {{ getBardSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <!-- Iteramos sobre los niveles de conjuro válidos -->
                    <div *ngFor="let lvl of getAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 gap-1">
                        <div 
                          *ngFor="let spell of getSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedBardSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedBardSpells.includes(spell.name)"
                            (change)="toggleBardSpell(spell.name)"
                            [disabled]="!selectedBardSpells.includes(spell.name) && selectedBardSpells.length >= getBardSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleBardSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Hechizos e Invocaciones del Brujo (D&D 2024) -->
              <div *ngIf="isWarlock()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🔮 Grimorio e Invocaciones del Brujo</span>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos, hechizos e invocaciones.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-400 leading-normal font-light font-sans">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getWarlockCantripsLimit() }} trucos**, **{{ getWarlockSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getWarlockMaxSpellLevel() }}**, y seleccionas **{{ getWarlockInvocationsLimit() }} invocación(es) sobrenatural(es)**:
                </p>

                <!-- Selección de Invocaciones Sobrenaturales -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Invocaciones Sobrenaturales (Elige exactamente {{ getWarlockInvocationsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedWarlockInvocations.length }} / {{ getWarlockInvocationsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let invocation of warlockInvocationsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedWarlockInvocations.includes(invocation.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedWarlockInvocations.includes(invocation.name)"
                        (change)="toggleWarlockInvocation(invocation.name)"
                        [disabled]="!selectedWarlockInvocations.includes(invocation.name) && selectedWarlockInvocations.length >= getWarlockInvocationsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleWarlockInvocation(invocation.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ invocation.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ invocation.desc }} <span class="text-[#d4af37] font-mono">({{ invocation.req }})</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Brujo (Elige exactamente {{ getWarlockCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedWarlockCantrips.length }} / {{ getWarlockCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of warlockCantripsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedWarlockCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedWarlockCantrips.includes(cantrip.name)"
                        (change)="toggleWarlockCantrip(cantrip.name)"
                        [disabled]="!selectedWarlockCantrips.includes(cantrip.name) && selectedWarlockCantrips.length >= getWarlockCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleWarlockCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getWarlockSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedWarlockSpells.length }} / {{ getWarlockSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getWarlockAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 gap-1">
                        <div 
                          *ngFor="let spell of getWarlockSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedWarlockSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedWarlockSpells.includes(spell.name)"
                            (change)="toggleWarlockSpell(spell.name)"
                            [disabled]="!selectedWarlockSpells.includes(spell.name) && selectedWarlockSpells.length >= getWarlockSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleWarlockSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Orden Divina y Hechizos del Clérigo (D&D 2024) -->
              <div *ngIf="isCleric()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">☀️ Orden Divina y Hechizos de Clérigo</span>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos y conjuros preparados.
                  </span>
                </div>

                <!-- Selección de Orden Divina (Nivel 1) -->
                <div class="space-y-2">
                  <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Elige tu Orden Divina (Nivel 1):</span>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- Protector -->
                    <div 
                      (click)="selectClericDivineOrderOption('Protector')"
                      class="p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none bg-neutral-900/40"
                      [ngClass]="selectedClericDivineOrder === 'Protector' ? 'border-[#d4af37] bg-amber-955/10' : 'border-neutral-850 hover:border-neutral-800'"
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm">🛡️</span>
                        <strong class="text-[10px] font-fantasy uppercase tracking-wider" [ngClass]="selectedClericDivineOrder === 'Protector' ? 'text-[#d4af37]' : 'text-neutral-300'">Protector</strong>
                      </div>
                      <p class="text-[8px] text-neutral-400 leading-normal font-light">
                        Te has entrenado para el combate. Ganas competencia con armas marciales y entrenamiento con armaduras pesadas.
                      </p>
                    </div>

                    <!-- Taumaturgo -->
                    <div 
                      (click)="selectClericDivineOrderOption('Taumaturgo')"
                      class="p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none bg-neutral-900/40"
                      [ngClass]="selectedClericDivineOrder === 'Taumaturgo' ? 'border-[#d4af37] bg-amber-955/10' : 'border-neutral-850 hover:border-neutral-800'"
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm">📖</span>
                        <strong class="text-[10px] font-fantasy uppercase tracking-wider" [ngClass]="selectedClericDivineOrder === 'Taumaturgo' ? 'text-[#d4af37]' : 'text-neutral-300'">Taumaturgo</strong>
                      </div>
                      <p class="text-[8px] text-neutral-400 leading-normal font-light">
                        Ganas un truco adicional del clérigo y sumas tu modificador de Sabiduría a tus tiradas de Inteligencia (Conocimiento arcano y Religión).
                      </p>
                    </div>
                  </div>
                </div>

                <p class="text-[9px] text-neutral-455 leading-normal font-light font-sans pt-2 border-t border-neutral-900">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getClericCantripsLimit() }} trucos** y **{{ getClericSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getClericMaxSpellLevel() }}**:
                </p>

                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Clérigo (Elige exactamente {{ getClericCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedClericCantrips.length }} / {{ getClericCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of clericCantripsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedClericCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedClericCantrips.includes(cantrip.name)"
                        (change)="toggleClericCantrip(cantrip.name)"
                        [disabled]="!selectedClericCantrips.includes(cantrip.name) && selectedClericCantrips.length >= getClericCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleClericCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getClericSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedClericSpells.length }} / {{ getClericSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getClericAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div 
                          *ngFor="let spell of getClericSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedClericSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedClericSpells.includes(spell.name)"
                            (change)="toggleClericSpell(spell.name)"
                            [disabled]="!selectedClericSpells.includes(spell.name) && selectedClericSpells.length >= getClericSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleClericSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
 
              <!-- Configuración de Orden Primigenia y Hechizos del Druida (D&D 2024) -->
              <div *ngIf="isDruid()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🍃 Orden Primigenia y Hechizos de Druida</span>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos y preparados.
                  </span>
                </div>
 
                <!-- Selección de Orden Primigenia (Nivel 1) -->
                <div class="space-y-2">
                  <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Elige tu Orden Primigenia (Nivel 1):</span>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- Guardián -->
                    <div 
                      (click)="selectDruidPrimalOrderOption('Guardián')"
                      class="p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none bg-neutral-900/40"
                      [ngClass]="selectedDruidPrimalOrder === 'Guardián' ? 'border-[#d4af37] bg-amber-955/10' : 'border-neutral-850 hover:border-neutral-800'"
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm">🛡️</span>
                        <strong class="text-[10px] font-fantasy uppercase tracking-wider" [ngClass]="selectedDruidPrimalOrder === 'Guardián' ? 'text-[#d4af37]' : 'text-neutral-300'">Guardián</strong>
                      </div>
                      <p class="text-[8px] text-neutral-400 leading-normal font-light">
                        Te has entrenado para el combate. Ganas competencia con armas marciales y entrenamiento con armaduras medias.
                      </p>
                    </div>
 
                    <!-- Naturalista -->
                    <div 
                      (click)="selectDruidPrimalOrderOption('Naturalista')"
                      class="p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none bg-neutral-900/40"
                      [ngClass]="selectedDruidPrimalOrder === 'Naturalista' ? 'border-[#d4af37] bg-amber-955/10' : 'border-neutral-850 hover:border-neutral-800'"
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm">🌱</span>
                        <strong class="text-[10px] font-fantasy uppercase tracking-wider" [ngClass]="selectedDruidPrimalOrder === 'Naturalista' ? 'text-[#d4af37]' : 'text-neutral-300'">Naturalista</strong>
                      </div>
                      <p class="text-[8px] text-neutral-400 leading-normal font-light">
                        Conoces un truco adicional. Además, sumas tu modificador de Sabiduría a tus tiradas de Inteligencia (Conocimiento arcano y Naturaleza).
                      </p>
                    </div>
                  </div>
                </div>
 
                <p class="text-[9px] text-neutral-455 leading-normal font-light font-sans pt-2 border-t border-neutral-900">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getDruidCantripsLimit() }} trucos** y **{{ getDruidSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getClericMaxSpellLevel() }}**:
                </p>
 
                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Druida (Elige exactamente {{ getDruidCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedDruidCantrips.length }} / {{ getDruidCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of druidCantripsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedDruidCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedDruidCantrips.includes(cantrip.name)"
                        (change)="toggleDruidCantrip(cantrip.name)"
                        [disabled]="!selectedDruidCantrips.includes(cantrip.name) && selectedDruidCantrips.length >= getDruidCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleDruidCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>
 
                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getDruidSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedDruidSpells.length }} / {{ getDruidSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getClericAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div 
                          *ngFor="let spell of getDruidSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedDruidSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedDruidSpells.includes(spell.name)"
                            (change)="toggleDruidSpell(spell.name)"
                            [disabled]="!selectedDruidSpells.includes(spell.name) && selectedDruidSpells.length >= getDruidSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleDruidSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Hechizos del Explorador (D&D 2024) -->
              <div *ngIf="isRanger()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🏹 Hechizos de Explorador</span>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de conjuros preparados.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-455 leading-normal font-light font-sans pt-2">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getRangerSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getRangerMaxSpellLevel() }}**:
                </p>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getRangerSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedRangerSpells.length }} / {{ getRangerSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getRangerAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div 
                          *ngFor="let spell of getRangerSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedRangerSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedRangerSpells.includes(spell.name)"
                            (change)="toggleRangerSpell(spell.name)"
                            [disabled]="!selectedRangerSpells.includes(spell.name) && selectedRangerSpells.length >= getRangerSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleRangerSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Hechizos del Paladín (D&D 2024) -->
              <div *ngIf="isPaladin()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl animate-fade-in text-left">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">🛡️ Hechizos de Paladín</span>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de conjuros preparados.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-455 leading-normal font-light font-sans pt-2">
                  De acuerdo con las reglas de D&D 2024, a nivel {{ characterLevel }} preparas exactamente **{{ getPaladinSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getPaladinMaxSpellLevel() }}**:
                </p>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getPaladinSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedPaladinSpells.length }} / {{ getPaladinSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getPaladinAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div 
                          *ngFor="let spell of getPaladinSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedPaladinSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedPaladinSpells.includes(spell.name)"
                            (change)="togglePaladinSpell(spell.name)"
                            [disabled]="!selectedPaladinSpells.includes(spell.name) && selectedPaladinSpells.length >= getPaladinSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="togglePaladinSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Hechizos y Metamagia del Hechicero (D&D 2024) -->
              <div *ngIf="isSorcerer()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl text-left animate-fade-in">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">✨ Hechizos y Metamagia del Hechicero</span>
                  <span class="text-[8px] bg-amber-955/20 border border-amber-600/30 px-2 py-0.5 rounded text-amber-500 font-mono font-bold select-none">
                    Nivel {{ characterLevel }}
                  </span>
                </div>

                <!-- Selector de Nivel Inicial -->
                <div class="space-y-1 bg-amber-955/10 border border-amber-500/20 p-2.5 rounded-lg">
                  <label class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Establecer Nivel de Hechicero:</label>
                  <select
                    [(ngModel)]="characterLevel"
                    (change)="onLevelChange()"
                    class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-3 py-1.5 rounded text-xs text-neutral-200 font-semibold cursor-pointer"
                  >
                    <option *ngFor="let lvl of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]" [value]="lvl">
                      Nivel {{ lvl }}
                    </option>
                  </select>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos, conjuros preparados y opciones de metamagia.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-400 leading-normal font-light font-sans">
                  A nivel {{ characterLevel }} preparas exactamente **{{ getSorcererCantripsLimit() }} trucos**, **{{ getSorcererSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getSorcererMaxSpellLevel() }}**, y seleccionas **{{ getSorcererMetamagicLimit() }} opción(es) de Metamagia**:
                </p>

                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Hechicero (Elige exactamente {{ getSorcererCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedSorcererCantrips.length }} / {{ getSorcererCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of getSorcererCantrips()"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedSorcererCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedSorcererCantrips.includes(cantrip.name)"
                        (change)="toggleSorcererCantrip(cantrip.name)"
                        [disabled]="!selectedSorcererCantrips.includes(cantrip.name) && selectedSorcererCantrips.length >= getSorcererCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleSorcererCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getSorcererSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedSorcererSpells.length }} / {{ getSorcererSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getAvailableSpellLevelsForSorcerer()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        <div 
                          *ngFor="let spell of getSorcererSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedSorcererSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedSorcererSpells.includes(spell.name)"
                            (change)="toggleSorcererSpell(spell.name)"
                            [disabled]="!selectedSorcererSpells.includes(spell.name) && selectedSorcererSpells.length >= getSorcererSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleSorcererSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Metamagia (Nivel 2+) -->
                <div *ngIf="characterLevel >= 2" class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-[#d4af37] tracking-wider">Metamagia (Elige exactamente {{ getSorcererMetamagicLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedSorcererMetamagic.length }} / {{ getSorcererMetamagicLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let meta of sorcererMetamagicList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedSorcererMetamagic.includes(meta.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedSorcererMetamagic.includes(meta.name)"
                        (change)="toggleSorcererMetamagic(meta.name)"
                        [disabled]="!selectedSorcererMetamagic.includes(meta.name) && selectedSorcererMetamagic.length >= getSorcererMetamagicLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleSorcererMetamagic(meta.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ meta.name }} (Coste: {{ meta.cost }} po)</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ meta.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración de Hechizos del Mago (D&D 2024) -->
              <div *ngIf="isMago()" class="space-y-4 md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl text-left animate-fade-in">
                <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5 shrink-0">
                  <span class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider font-fantasy">📖 Libro de Conjuros del Mago (D&D 2024)</span>
                  <span class="text-[8px] bg-amber-955/20 border border-amber-600/30 px-2 py-0.5 rounded text-amber-500 font-mono font-bold select-none">
                    Nivel {{ characterLevel }}
                  </span>
                </div>

                <!-- Selector de Nivel Inicial -->
                <div class="space-y-1 bg-amber-955/10 border border-amber-500/20 p-2.5 rounded-lg">
                  <label class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Establecer Nivel de Mago:</label>
                  <select
                    [(ngModel)]="characterLevel"
                    (change)="onLevelChange()"
                    class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-3 py-1.5 rounded text-xs text-neutral-200 font-semibold cursor-pointer"
                  >
                    <option *ngFor="let lvl of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]" [value]="lvl">
                      Nivel {{ lvl }}
                    </option>
                  </select>
                  <span class="text-[8px] text-neutral-500 italic block mt-0.5">
                    * Modificar el nivel ajustará el límite de trucos y conjuros en tu Libro de Conjuros.
                  </span>
                </div>

                <p class="text-[9px] text-neutral-400 leading-normal font-light font-sans">
                  A nivel {{ characterLevel }} tu Libro de Conjuros contiene **{{ getMagoCantripsLimit() }} trucos** y **{{ getMagoSpellsLimit() }} conjuros** de nivel inferior o igual a **{{ getMagoMaxSpellLevel() }}**:
                </p>

                <!-- Selección de Trucos (Cantrips) -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-350 tracking-wider">Trucos de Mago (Elige exactamente {{ getMagoCantripsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedMagoCantrips.length }} / {{ getMagoCantripsLimit() }}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <div 
                      *ngFor="let cantrip of magoCantripsList"
                      class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                      [ngClass]="selectedMagoCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                    >
                      <input 
                        type="checkbox"
                        [checked]="selectedMagoCantrips.includes(cantrip.name)"
                        (change)="toggleMagoCantrip(cantrip.name)"
                        [disabled]="!selectedMagoCantrips.includes(cantrip.name) && selectedMagoCantrips.length >= getMagoCantripsLimit()"
                        class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                      />
                      <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleMagoCantrip(cantrip.name)">
                        <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                        <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selección de Conjuros para el Libro de Conjuros -->
                <div class="space-y-2 pt-2 border-t border-neutral-900">
                  <div class="flex justify-between items-center">
                    <span class="text-[9px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros del Libro (Elige exactamente {{ getMagoSpellsLimit() }}):</span>
                    <span class="text-[8.5px] font-mono text-[#d4af37] font-bold">{{ selectedMagoSpells.length }} / {{ getMagoSpellsLimit() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <div *ngFor="let lvl of getMagoAvailableSpellLevels()" class="space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
                        <div 
                          *ngFor="let spell of getMagoSpellsForLevel(lvl)"
                          class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                          [ngClass]="selectedMagoSpells.includes(spell.name) ? 'bg-amber-955/20 border-amber-600/50 text-[#d4af37]' : 'bg-neutral-900/30 border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                        >
                          <input 
                            type="checkbox"
                            [checked]="selectedMagoSpells.includes(spell.name)"
                            (change)="toggleMagoSpell(spell.name)"
                            [disabled]="!selectedMagoSpells.includes(spell.name) && selectedMagoSpells.length >= getMagoSpellsLimit()"
                            class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                          />
                          <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleMagoSpell(spell.name)">
                            <strong class="font-fantasy text-[#d4af37] tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                            <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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

            <div class="border-t border-neutral-900 pt-4 bg-[#121215] shrink-0">
              <button 
                (click)="onConfirmClass()"
                [disabled]="selectedClassSkills.length < getClassSkillLimit(activeClass.name) || 
                            (isBard() && (selectedBardCantrips.length !== getBardCantripsLimit() || selectedBardSpells.length !== getBardSpellsLimit())) ||
                            (isWarlock() && (selectedWarlockCantrips.length !== getWarlockCantripsLimit() || selectedWarlockSpells.length !== getWarlockSpellsLimit() || selectedWarlockInvocations.length !== getWarlockInvocationsLimit())) ||
                            (isCleric() && (!selectedClericDivineOrder || selectedClericCantrips.length !== getClericCantripsLimit() || selectedClericSpells.length !== getClericSpellsLimit())) ||
                            (isDruid() && (!selectedDruidPrimalOrder || selectedDruidCantrips.length !== getDruidCantripsLimit() || selectedDruidSpells.length !== getDruidSpellsLimit())) ||
                            (isSorcerer() && (selectedSorcererCantrips.length !== getSorcererCantripsLimit() || selectedSorcererSpells.length !== getSorcererSpellsLimit() || selectedSorcererMetamagic.length !== getSorcererMetamagicLimit())) ||
                            (isRanger() && (selectedRangerSpells.length !== getRangerSpellsLimit())) ||
                            (isPaladin() && (selectedPaladinSpells.length !== getPaladinSpellsLimit())) ||
                            (isMago() && (selectedMagoCantrips.length !== getMagoCantripsLimit() || selectedMagoSpells.length !== getMagoSpellsLimit()))"
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
                  [src]="'/assets/Razas/' + activeOrigin.image" 
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

              <!-- Selección de Linaje o Ancestro Dracónico (Si aplica) -->
              <div *ngIf="isOriginLineageRequired()" class="space-y-3 bg-[#18181c] border border-[#d4af37]/30 p-4 rounded-xl text-left">
                <span class="text-[10px] uppercase font-bold text-[#d4af37] tracking-wider block">
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('elfo')">Selecciona tu Linaje Élfico</span>
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('dracónido') || activeOrigin.name.toLowerCase().includes('draconido')">Selecciona tu Ancestro Dracónico</span>
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('gnomo')">Selecciona tu Linaje Gnomo</span>
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('goliat')">Selecciona tu Linaje Gigante</span>
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('tiflin') || activeOrigin.name.toLowerCase().includes('tiefling')">Selecciona tu Legado Infernal</span>
                  <span *ngIf="activeOrigin.name.toLowerCase().includes('aasimar')">Selecciona tu Revelación Celestial</span>
                </span>
                <p class="text-[10px] text-neutral-400 leading-tight">
                  Este origen define tus dotes adicionales, conjuros iniciales o resistencias elementales.
                </p>

                <!-- Elfo Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('elfo')" class="space-y-2">
                  <div 
                    *ngFor="let el of elvenLineages"
                    (click)="selectedOriginLineage = el.name"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5"
                    [ngClass]="selectedOriginLineage === el.name ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200 shadow-[0_0_10px_rgba(212,175,55,0.06)]' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1.5">
                      <span class="text-xs" [class.text-[#d4af37]]="selectedOriginLineage === el.name">
                        {{ selectedOriginLineage === el.name ? '✦' : '◇' }}
                      </span>
                      {{ el.name }}
                    </span>
                    <span class="text-[10px] text-neutral-450 leading-relaxed font-light pl-4">{{ el.desc }}</span>
                  </div>
                </div>

                <!-- Dragonborn Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('dracónido') || activeOrigin.name.toLowerCase().includes('draconido')" class="grid grid-cols-2 gap-2">
                  <button 
                    *ngFor="let drag of dragonLineages"
                    type="button"
                    (click)="selectedOriginLineage = drag.name + ' (' + drag.element + ')'"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5 w-full focus:outline-none"
                    [ngClass]="selectedOriginLineage.startsWith(drag.name) ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1">
                      <span class="text-[10px]" [class.text-[#d4af37]]="selectedOriginLineage.startsWith(drag.name)">
                        {{ selectedOriginLineage.startsWith(drag.name) ? '✦' : '◇' }}
                      </span>
                      {{ drag.name }}
                    </span>
                    <span class="text-[9px] text-neutral-550 font-mono pl-3">Daño: {{ drag.element }}</span>
                  </button>
                </div>

                <!-- Gnome Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('gnomo')" class="space-y-2">
                  <div 
                    *ngFor="let gn of gnomeLineages"
                    (click)="selectedOriginLineage = gn.name"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5"
                    [ngClass]="selectedOriginLineage === gn.name ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200 shadow-[0_0_10px_rgba(212,175,55,0.06)]' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1.5">
                      <span class="text-xs" [class.text-[#d4af37]]="selectedOriginLineage === gn.name">
                        {{ selectedOriginLineage === gn.name ? '✦' : '◇' }}
                      </span>
                      {{ gn.name }}
                    </span>
                    <span class="text-[10px] text-neutral-450 leading-relaxed font-light pl-4">{{ gn.desc }}</span>
                  </div>
                </div>

                <!-- Goliath Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('goliat')" class="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  <div 
                    *ngFor="let gol of goliathLineages"
                    (click)="selectedOriginLineage = gol.name"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5 mb-2 last:mb-0"
                    [ngClass]="selectedOriginLineage === gol.name ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200 shadow-[0_0_10px_rgba(212,175,55,0.06)]' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1.5">
                      <span class="text-xs" [class.text-[#d4af37]]="selectedOriginLineage === gol.name">
                        {{ selectedOriginLineage === gol.name ? '✦' : '◇' }}
                      </span>
                      {{ gol.name }}
                    </span>
                    <span class="text-[10px] text-neutral-450 leading-relaxed font-light pl-4">{{ gol.desc }}</span>
                  </div>
                </div>

                <!-- Tiefling Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('tiflin') || activeOrigin.name.toLowerCase().includes('tiefling')" class="space-y-2">
                  <div 
                    *ngFor="let tf of tieflingLineages"
                    (click)="selectedOriginLineage = tf.name"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5"
                    [ngClass]="selectedOriginLineage === tf.name ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200 shadow-[0_0_10px_rgba(212,175,55,0.06)]' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1.5">
                      <span class="text-xs" [class.text-[#d4af37]]="selectedOriginLineage === tf.name">
                        {{ selectedOriginLineage === tf.name ? '✦' : '◇' }}
                      </span>
                      {{ tf.name }}
                    </span>
                    <span class="text-[10px] text-neutral-450 leading-relaxed font-light pl-4">{{ tf.desc }}</span>
                  </div>
                </div>

                <!-- Aasimar Lineages -->
                <div *ngIf="activeOrigin.name.toLowerCase().includes('aasimar')" class="space-y-2">
                  <div 
                    *ngFor="let aa of aasimarLineages"
                    (click)="selectedOriginLineage = aa.name"
                    class="p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex flex-col gap-0.5"
                    [ngClass]="selectedOriginLineage === aa.name ? 'bg-amber-955/15 border-[#d4af37] text-neutral-200 shadow-[0_0_10px_rgba(212,175,55,0.06)]' : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-700 text-neutral-400'"
                  >
                    <span class="text-xs font-bold text-neutral-250 flex items-center gap-1.5">
                      <span class="text-xs" [class.text-[#d4af37]]="selectedOriginLineage === aa.name">
                        {{ selectedOriginLineage === aa.name ? '✦' : '◇' }}
                      </span>
                      {{ aa.name }}
                    </span>
                    <span class="text-[10px] text-neutral-450 leading-relaxed font-light pl-4">{{ aa.desc }}</span>
                  </div>
                </div>
                
                <span *ngIf="!selectedOriginLineage" class="text-[9px] text-red-400 font-bold block mt-1 animate-pulse">
                  ⚠️ Debes seleccionar un linaje antes de continuar.
                </span>
              </div>

              <!-- Rasgo Especial del Origen en DB -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Rasgo de Linaje Especial</h4>
                <div class="flex flex-col bg-[#18181c] border border-neutral-850 p-4 rounded-lg space-y-1">
                  <span class="text-xs font-bold text-[#d4af37]">{{ activeOrigin.trait.split('(')[0] }}</span>
                  <span class="text-[11px] text-neutral-400 leading-normal">{{ activeOrigin.trait }}</span>
                </div>
              </div>

              <!-- Atributos Detallados del Manual (D&D 2024) -->
              <div *ngIf="getOriginManualAttributes(activeOrigin.name).length > 0" class="space-y-2.5">
                <h4 class="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Atributos del Manual (D&D 2024)</h4>
                <div class="space-y-3 bg-[#18181c] border border-neutral-850 p-4 rounded-lg text-left">
                  <div *ngFor="let attr of getOriginManualAttributes(activeOrigin.name)" class="border-b border-neutral-900 pb-2.5 last:border-0 last:pb-0 space-y-0.5">
                    <span class="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider block">{{ attr.title }}</span>
                    <p class="text-[11px] text-neutral-350 leading-relaxed font-light">{{ attr.desc }}</p>
                  </div>
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
            <div class="flex gap-3 mt-6 shrink-0">
              <button 
                (click)="goToStep(2)"
                class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-lg text-xs font-serif uppercase tracking-wider cursor-pointer transition duration-200"
              >
                Volver
              </button>
              <button 
                (click)="onConfirmOrigin()"
                [disabled]="isOriginLineageRequired() && !selectedOriginLineage"
                class="flex-2 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-4 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-wider shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
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
            
            <div *ngIf="attributeMethod === 'array'" class="space-y-4">
              <p class="text-xs text-neutral-400 leading-relaxed">
                El <strong class="text-amber-400">Conjunto Estándar</strong> ofrece un balance equilibrado de puntuaciones: <strong class="text-[#d4af37]">15, 14, 13, 12, 10 y 8</strong>. 
              </p>
              <p class="text-xs text-neutral-450 leading-relaxed">
                Asigna cada una de estas puntuaciones a tus características en la derecha. Te sugerimos poner los valores más altos en el atributo recomendado de tu clase.
              </p>
            </div>

            <div *ngIf="attributeMethod === 'random'" class="space-y-4">
              <p class="text-xs text-neutral-400 leading-relaxed">
                La <strong class="text-amber-400">Generación Aleatoria</strong> introduce el azar. Lanzas <strong class="text-amber-400">4d6</strong> para cada una de las 6 características y **sumas los 3 dados más altos**, descartando el menor.
              </p>
              <p class="text-xs text-neutral-450 leading-relaxed">
                Una vez completes las 6 tiradas de dados obligatorias, podrás asignar los resultados libremente a tus atributos mediante los menús desplegables.
              </p>
            </div>

            <div *ngIf="attributeMethod === 'buy'" class="space-y-4">
              <p class="text-xs text-neutral-400 leading-relaxed">
                En la <strong class="text-amber-400">Compra de Puntos</strong>, dispones de un presupuesto de <strong class="text-[#d4af37]">27 puntos</strong>. Todas tus características comienzan en 8 y puedes comprarlas hasta un máximo de 15.
              </p>
              
              <!-- Tabla de costos oficial -->
              <div class="bg-[#18181c] border border-neutral-800 rounded-lg p-3">
                <span class="text-[9px] uppercase font-bold text-[#d4af37] block mb-2 text-center tracking-wider">Tabla de Costos de D&D 5e</span>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 8:</span>
                    <span class="text-amber-400 font-bold">Coste 0</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 12:</span>
                    <span class="text-amber-400 font-bold">Coste 4</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 9:</span>
                    <span class="text-amber-400 font-bold">Coste 1</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 13:</span>
                    <span class="text-amber-400 font-bold">Coste 5</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 10:</span>
                    <span class="text-amber-400 font-bold">Coste 2</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 14:</span>
                    <span class="text-amber-400 font-bold">Coste 7</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 11:</span>
                    <span class="text-amber-400 font-bold">Coste 3</span>
                  </div>
                  <div class="flex justify-between border-b border-neutral-900/50 pb-0.5">
                    <span class="text-neutral-400">Punt. 15:</span>
                    <span class="text-amber-400 font-bold">Coste 9</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Caja dinámica de recomendación de clase -->
            <div class="bg-[#18181c] border border-neutral-800 p-4 rounded-lg space-y-2 text-xs">
              <div class="flex justify-between border-b border-neutral-900 pb-1.5 mb-1.5">
                <span class="font-bold text-[#d4af37]">Tu Clase Recomendada:</span>
                <span class="text-neutral-300 font-semibold">{{ activeClass.name }}</span>
              </div>
              <p class="text-neutral-450 leading-relaxed">
                El atributo primario de tu clase es la <strong class="text-[#d4af37]">{{ activeClass.primaryStat }}</strong>. Intenta concentrar tus puntos en ella para potenciar tu efectividad en combate y lanzamiento de conjuros.
              </p>
            </div>
          </div>

          <!-- Panel Central -->
          <main class="lg:col-span-8 bg-[#121215] border border-neutral-800/80 rounded-xl p-6 shadow-2xl space-y-6">
            
            <!-- Selector de Métodos de Generación -->
            <div class="flex bg-neutral-950/60 p-1 border border-neutral-850 rounded-lg max-w-md mx-auto relative z-10">
              <button 
                (click)="changeAttributeMethod('array')"
                class="flex-1 text-center py-1.5 rounded text-[10px] font-serif uppercase tracking-wider transition cursor-pointer select-none"
                [class.bg-amber-600]="attributeMethod === 'array'"
                [class.text-white]="attributeMethod === 'array'"
                [class.text-neutral-455]="attributeMethod !== 'array'"
              >
                Conjunto Estándar
              </button>
              <button 
                (click)="changeAttributeMethod('random')"
                class="flex-1 text-center py-1.5 rounded text-[10px] font-serif uppercase tracking-wider transition cursor-pointer select-none"
                [class.bg-amber-600]="attributeMethod === 'random'"
                [class.text-white]="attributeMethod === 'random'"
                [class.text-neutral-455]="attributeMethod !== 'random'"
              >
                Tirada Aleatoria
              </button>
              <button 
                (click)="changeAttributeMethod('buy')"
                class="flex-1 text-center py-1.5 rounded text-[10px] font-serif uppercase tracking-wider transition cursor-pointer select-none"
                [class.bg-amber-600]="attributeMethod === 'buy'"
                [class.text-white]="attributeMethod === 'buy'"
                [class.text-neutral-455]="attributeMethod !== 'buy'"
              >
                Compra de Puntos
              </button>
            </div>

            <!-- Cabecera de Puntuación -->
            <div class="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div>
                <h3 class="text-base font-serif font-extrabold text-[#d4af37] uppercase tracking-wider">Tus Puntuaciones</h3>
                <p class="text-xs text-neutral-500">
                  <span *ngIf="attributeMethod === 'array'">Asigna las puntuaciones del conjunto estándar.</span>
                  <span *ngIf="attributeMethod === 'random' && activeRollIndex < 6">Lanza los dados 6 veces para rellenar la reserva.</span>
                  <span *ngIf="attributeMethod === 'random' && activeRollIndex === 6">Asigna las puntuaciones de tus dados lanzados.</span>
                  <span *ngIf="attributeMethod === 'buy'">Usa los 27 puntos para comprar. Máx base: 15.</span>
                </p>
              </div>
              
              <!-- Puntos Restantes o Asignados -->
              <div *ngIf="attributeMethod === 'buy'" class="bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2 text-center shadow-inner">
                <div class="text-[9px] uppercase font-bold text-red-400 tracking-widest">Puntos Restantes</div>
                <div class="text-2xl font-serif font-bold text-[#d4af37]">{{ attributePointsPool }}</div>
              </div>
              <div *ngIf="attributeMethod === 'array' || attributeMethod === 'random'" class="bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-2 text-center shadow-inner">
                <div class="text-[9px] uppercase font-bold text-amber-400 tracking-widest">Asignadas</div>
                <div class="text-2xl font-serif font-bold text-neutral-200">
                  {{ attributePool.filter(item => item.assignedTo !== null).length }} / 6
                </div>
              </div>
            </div>

            <!-- Reservorio de Puntos (Standard Array & Random Roll) -->
            <div *ngIf="attributeMethod === 'array' || (attributeMethod === 'random' && attributePool.length > 0)" class="bg-neutral-900/35 border border-neutral-855 p-4 rounded-xl">
              <span class="text-[9px] text-neutral-450 uppercase font-bold tracking-wider block mb-3 text-center">Reserva de Puntuaciones Disponibles</span>
              <div class="flex gap-3 justify-center">
                <div 
                  *ngFor="let item of attributePool; let i = index" 
                  class="w-12 h-12 rounded-lg border flex flex-col items-center justify-center relative shadow transition-all duration-200"
                  [ngClass]="{
                    'border-amber-600/60 bg-amber-950/10 text-[#d4af37] font-bold': item.assignedTo === null,
                    'border-neutral-900 bg-neutral-950/50 text-neutral-600': item.assignedTo !== null
                  }"
                >
                  <span class="text-sm font-mono font-bold">{{ item.value }}</span>
                  <span *ngIf="item.assignedTo" class="text-[7px] uppercase font-bold text-neutral-500 absolute bottom-1 leading-none">
                    {{ item.assignedTo }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Tablero de Tirada Aleatoria (4d6) -->
            <div *ngIf="attributeMethod === 'random' && activeRollIndex < 6" class="bg-[#18181c] border border-neutral-800/80 p-6 rounded-xl space-y-6 text-center">
              <div class="space-y-1">
                <span class="text-[10px] text-neutral-450 uppercase font-bold tracking-wider block">Sistema 4d6 Drop Lowest</span>
                <h4 class="text-base font-serif font-extrabold text-[#d4af37]">TIRADA {{ activeRollIndex + 1 }} DE 6</h4>
              </div>

              <!-- Animación de Dados -->
              <div class="flex gap-4 justify-center items-center py-4">
                <div 
                  *ngFor="let die of rolledStats[activeRollIndex]?.dice; let dIdx = index" 
                  class="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all duration-75 select-none"
                  [ngClass]="{
                    'bg-[#0e0e11] border-neutral-850 text-neutral-600': !rolledStats[activeRollIndex]?.completed && !rolledStats[activeRollIndex]?.rolling,
                    'bg-amber-955/20 border-amber-600/70 text-amber-500 animate-bounce scale-105 shadow-[0_0_15px_rgba(212,175,55,0.15)]': rolledStats[activeRollIndex]?.rolling,
                    'bg-amber-900/10 border-amber-500 text-amber-400 font-bold shadow-[0_0_12px_rgba(212,175,55,0.25)]': rolledStats[activeRollIndex]?.completed && dIdx !== getDiscardedIdx(activeRollIndex),
                    'bg-red-955/20 border-red-900/60 text-red-500/50 line-through scale-90 opacity-40': rolledStats[activeRollIndex]?.completed && dIdx === getDiscardedIdx(activeRollIndex)
                  }"
                >
                  {{ die }}
                </div>
              </div>

              <!-- Resultados de Tirada -->
              <div *ngIf="rolledStats[activeRollIndex]?.completed" class="bg-neutral-950/60 border border-neutral-900 p-4 rounded-lg inline-block text-center mx-auto space-y-1">
                <span class="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Puntuación Obtenida</span>
                <div class="text-3xl font-serif font-bold text-[#d4af37] font-mono leading-none">
                  {{ rolledStats[activeRollIndex]?.sum }}
                </div>
                <span class="text-[9px] text-neutral-500 block leading-tight pt-1">
                  Suma de los 3 mayores (Descartado el {{ getDiscardedDieValue(activeRollIndex) }})
                </span>
              </div>

              <div>
                <button 
                  (click)="rollDiceStats()"
                  [disabled]="isRollingAll || activeRollIndex >= 6"
                  class="bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-500 hover:to-[#d4af37] text-neutral-950 font-serif uppercase tracking-widest font-extrabold px-8 py-3 rounded-lg text-xs cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition disabled:opacity-40 disabled:cursor-not-allowed select-none"
                >
                  {{ isRollingAll ? 'Lanzando Dados...' : 'Lanzar Dados (4d6)' }}
                </button>
              </div>
            </div>

            <!-- Caja de Reinicio de Tiradas Aleatorias -->
            <div *ngIf="attributeMethod === 'random' && activeRollIndex === 6" class="bg-[#18181c] border border-neutral-800 p-4 rounded-xl flex items-center justify-between gap-4">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🎲</span>
                <div class="text-left">
                  <span class="text-xs font-bold text-neutral-200 block">Tiradas de dados completadas</span>
                  <span class="text-[10px] text-neutral-500">Asigna estos 6 valores a tus características abajo</span>
                </div>
              </div>
              <button 
                (click)="changeAttributeMethod('random')"
                class="px-4 py-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-[10px] font-bold uppercase transition cursor-pointer select-none"
              >
                Volver a Tirar
              </button>
            </div>

            <!-- Listado de Atributos (Point Buy) -->
            <div *ngIf="attributeMethod === 'buy'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                *ngFor="let attr of attributes" 
                class="bg-[#18181c] border border-neutral-800/80 p-4 rounded-xl flex items-center justify-between shadow-md hover:border-[#d4af37]/15 transition"
              >
                <div class="space-y-1 pr-4 text-left">
                  <h4 class="text-sm font-bold text-neutral-200 uppercase tracking-wide">
                    {{ attr.name }}
                  </h4>
                  <p class="text-[10px] text-neutral-500 leading-snug">
                    {{ attr.description }}
                  </p>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <button 
                    (click)="modifyAttributePointBuy(attr.key, -1)"
                    [disabled]="attr.value <= 8"
                    class="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer transition select-none"
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
                        <span *ngIf="(backgroundStatsAllocation[attr.key] || 0) > 0" class="text-amber-500 font-bold">+{{ backgroundStatsAllocation[attr.key] }} Tras.</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    (click)="modifyAttributePointBuy(attr.key, 1)"
                    [disabled]="attr.value >= 15"
                    class="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer transition select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Listado de Atributos (Standard Array / Random Roll) -->
            <div *ngIf="attributeMethod === 'array' || (attributeMethod === 'random' && activeRollIndex === 6)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                *ngFor="let attr of attributes" 
                class="bg-[#18181c] border border-neutral-800/80 p-4 rounded-xl flex items-center justify-between shadow-md hover:border-[#d4af37]/15 transition animate-fade-in"
              >
                <div class="space-y-1 pr-4 text-left">
                  <h4 class="text-sm font-bold text-neutral-200 uppercase tracking-wide">
                    {{ attr.name }}
                  </h4>
                  <p class="text-[10px] text-neutral-500 leading-snug">
                    {{ attr.description }}
                  </p>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                  <!-- Asignador de Puntuación Dropdown -->
                  <div class="space-y-1 text-right">
                    <label class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Asignar</label>
                    <select 
                      [ngModel]="getAttributePoolIndexFor(attr.key)"
                      (ngModelChange)="assignPoolValue(attr.key, $event)"
                      class="bg-neutral-900 border border-neutral-800 text-[#d4af37] font-mono text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]/45 cursor-pointer max-w-[120px]"
                    >
                      <option [value]="''">-- Elegir --</option>
                      <option 
                        *ngFor="let item of attributePool; let i = index" 
                        [value]="i"
                        [disabled]="item.assignedTo !== null && item.assignedTo !== attr.key"
                      >
                        {{ item.value }} {{ item.assignedTo && item.assignedTo !== attr.key ? '(' + item.assignedTo + ')' : '' }}
                      </option>
                    </select>
                  </div>

                  <!-- Visualizador del Valor Final -->
                  <div class="text-center w-14">
                    <div class="text-2xl font-serif font-bold text-[#d4af37]">
                      {{ getFinalAttributeScore(attr.key) }}
                    </div>
                    <div class="text-[9px] text-neutral-500 uppercase tracking-widest leading-none mt-0.5">
                      <div>Base: {{ attr.value }}</div>
                      <div *ngIf="(backgroundStatsAllocation[attr.key] || 0) > 0" class="text-amber-500 font-bold mt-0.5">+{{ backgroundStatsAllocation[attr.key] }} Tras.</div>
                    </div>
                  </div>
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
                [disabled]="!isAttributesSelectionValid()"
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
                    <span>{{ selectedOriginLineage ? activeOrigin.name + ' (' + selectedOriginLineage + ')' : activeOrigin.name }}</span>
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

          <!-- Detalles Estadísticos del Equipo Equipado -->
          <div *ngIf="selectedEquipmentOption === 'A' || selectedBgEquipmentOption === 'A'" class="space-y-4 relative z-10">
            <!-- Tabla de Armas -->
            <div *ngIf="getEquippedWeaponsDetails().length > 0" class="bg-[#18181c] border border-neutral-855 p-6 rounded-xl space-y-4 text-left">
              <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Especificaciones de Armas Equipadas</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      <th class="py-2 pr-4">Nombre / Cant</th>
                      <th class="py-2 pr-4 text-center">Bono de Ataque</th>
                      <th class="py-2 pr-4 text-center">Daño / Tipo</th>
                      <th class="py-2 pr-4">Propiedades</th>
                      <th *ngIf="hasWeaponMastery()" class="py-2 pr-4 text-center">Maestría</th>
                      <th class="py-2 pr-4 text-center">Peso</th>
                      <th class="py-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let weapon of getEquippedWeaponsDetails()" class="border-b border-neutral-900/60 hover:bg-neutral-900/20 transition">
                      <td class="py-3 pr-4 font-bold text-neutral-200 flex items-center gap-2">
                        <span class="bg-[#121215] border border-neutral-800 text-neutral-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                          {{ weapon.quantity }}x
                        </span>
                        <span>{{ weapon.name }}</span>
                      </td>
                      <td class="py-3 pr-4 text-center font-bold text-amber-500 font-mono text-[12px]">
                        {{ weapon.attackBonus }}
                        <span class="text-[8px] text-neutral-500 block font-sans font-light mt-0.5 whitespace-nowrap">
                          1d20 + {{ weapon.abilityModValue }} ({{ weapon.abilityModKey }}) + {{ weapon.profBonus }} (Comp)
                        </span>
                      </td>
                      <td class="py-3 pr-4 text-center">
                        <span class="font-semibold text-red-400 font-mono text-[12px] block">
                          {{ weapon.fullDamage }}
                        </span>
                        <span class="text-[9px] text-neutral-450 block font-sans font-light mt-0.5">
                          {{ weapon.damageType }}
                        </span>
                      </td>
                      <td class="py-3 pr-4 text-neutral-400 leading-snug font-light text-[11px]">{{ weapon.properties }}</td>
                      <td *ngIf="hasWeaponMastery()" class="py-3 pr-4 text-center">
                        <span class="bg-amber-955/20 border border-amber-600/30 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold cursor-help" [title]="weapon.description">
                          {{ weapon.mastery }}
                        </span>
                      </td>
                      <td class="py-3 pr-4 text-center font-mono text-[11px] text-neutral-400">{{ weapon.weight }}</td>
                      <td class="py-3 text-right font-mono text-[11px] text-amber-450">{{ weapon.price }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Glosario de Maestría con Armas (Solo si tiene Maestría) -->
              <div *ngIf="hasWeaponMastery()" class="mt-4 bg-[#121215] border border-amber-600/15 p-4 rounded-xl space-y-2">
                <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Propiedades de Maestría con Armas (Especialización)</span>
                <p class="text-[10px] text-neutral-450 leading-relaxed font-light">
                  Como tu clase posee <strong>Maestría con Armas</strong> al nivel 1, puedes aprovechar estas propiedades de maestría adicionales cuando atacas con ellas:
                </p>
                <div class="space-y-2 pt-1">
                  <div *ngFor="let weapon of getEquippedWeaponsDetails()" class="text-[10px] bg-[#18181c] p-2.5 rounded-lg border border-neutral-900 flex flex-col gap-0.5">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-neutral-350">{{ weapon.name }}</span>
                      <span class="text-amber-500 font-bold uppercase text-[9px]">{{ weapon.mastery }}</span>
                    </div>
                    <p class="text-neutral-450 font-light leading-snug mt-1">{{ weapon.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabla de Armaduras y Escudo -->
            <div *ngIf="getEquippedArmorsDetails().length > 0" class="bg-[#18181c] border border-neutral-855 p-6 rounded-xl space-y-4 text-left">
              <h4 class="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Especificaciones de Armaduras & Escudos</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      <th class="py-2 pr-4">Armadura</th>
                      <th class="py-2 pr-4">Categoría / Tipo</th>
                      <th class="py-2 pr-4 text-center">CA (Clase Armadura)</th>
                      <th class="py-2 pr-4 text-center">Fuerza Requerida</th>
                      <th class="py-2 pr-4 text-center">Sigilo</th>
                      <th class="py-2 pr-4 text-center">Peso</th>
                      <th class="py-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let armor of getEquippedArmorsDetails()" class="border-b border-neutral-900/60 hover:bg-neutral-900/20 transition">
                      <td class="py-2.5 pr-4 font-bold text-neutral-200">{{ armor.name }}</td>
                      <td class="py-2.5 pr-4 text-neutral-400 font-light text-[11px]">{{ armor.type }}</td>
                      <td class="py-2.5 pr-4 text-center font-bold text-amber-400 font-mono text-[13px]">{{ armor.ca }}</td>
                      <td class="py-2.5 pr-4 text-center font-mono text-[11px] text-neutral-400">{{ armor.strength }}</td>
                      <td class="py-2.5 pr-4 text-center">
                        <span *ngIf="armor.stealth === 'Desventaja'" class="bg-red-955/20 border border-red-800/40 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold">
                          Desventaja
                        </span>
                        <span *ngIf="armor.stealth !== 'Desventaja'" class="text-neutral-500">—</span>
                      </td>
                      <td class="py-2.5 pr-4 text-center font-mono text-[11px] text-neutral-400">{{ armor.weight }}</td>
                      <td class="py-2.5 text-right font-mono text-[11px] text-amber-450">{{ armor.price }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Sugerencias de Adjetivos Narrativos por Atributos -->
          <div class="bg-[#18181c]/55 border border-[#d4af37]/20 p-6 rounded-xl space-y-3 text-left relative z-10">
            <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block border-b border-neutral-900 pb-1.5">
              💡 Sugerencias para tu Descripción e Historia (basado en tus atributos)
            </span>
            <p class="text-[10px] text-neutral-450 leading-relaxed font-light">
              Tus características físicas y mentales sugieren ciertos adjetivos que puedes elegir y combinar si lo deseas para describir físicamente a tu personaje o guiar su historia (no es obligatorio usarlos, son solo una orientación):
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
              <div 
                *ngFor="let suggestion of getSuggestedAdjectives()" 
                class="bg-[#121215] border border-neutral-800 p-2.5 rounded-lg text-center flex flex-col justify-between hover:border-[#d4af37]/15 transition duration-200"
              >
                <div>
                  <span class="text-[9px] text-neutral-500 uppercase font-bold block">{{ suggestion.attribute }}</span>
                  <span class="text-xs font-bold block font-mono mt-0.5" [ngClass]="suggestion.type === 'Alta' ? 'text-amber-400' : 'text-neutral-400'">
                    {{ suggestion.score }} ({{ suggestion.type }})
                  </span>
                </div>
                <div class="mt-2 space-y-1">
                  <span 
                    *ngFor="let adj of suggestion.adjectives" 
                    class="block text-[9px] text-neutral-300 bg-[#18181c] border border-neutral-900 px-1 py-0.5 rounded font-light"
                  >
                    {{ adj }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles de la Leyenda y Aspecto -->
          <div class="bg-[#18181c]/55 border border-neutral-850 p-6 rounded-xl space-y-6 relative z-10 text-left">
            <h3 class="text-sm font-serif font-bold text-[#d4af37] uppercase tracking-wider border-b border-neutral-900 pb-2 flex items-center gap-2">
              <span>✍️</span> Detalles de la Leyenda y Aspecto
            </h3>

            <!-- Nombre del Aventurero y Nivel Inicial -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-neutral-900/60">
              <div class="space-y-2">
                <label class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider block">Nombre del Aventurero <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="characterName"
                  placeholder="Escribe el nombre de tu aventurero..."
                  class="w-full bg-[#0e0e11] border border-neutral-850 hover:border-neutral-750 focus:border-[#d4af37]/50 focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold"
                />
                <span *ngIf="!characterName.trim()" class="text-[9px] text-amber-500/80 italic block">
                  * El nombre es obligatorio para registrar al aventurero.
                </span>
              </div>
              
              <div class="space-y-2">
                <label class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider block">Nivel Inicial de Aventura (1 - 20)</label>
                <select
                  [(ngModel)]="characterLevel"
                  class="w-full bg-[#0e0e11] border border-neutral-850 hover:border-neutral-750 focus:border-[#d4af37]/50 focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option *ngFor="let lvl of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]" [value]="lvl">
                    Nivel {{ lvl }}
                  </option>
                </select>
                <span class="text-[9px] text-neutral-500 italic block">
                  Elige un nivel superior si la campaña comienza en un rango más alto.
                </span>
              </div>

              <!-- Selector de Subclase Bárbaro para Nivel >= 3 -->
              <div *ngIf="isBarbarianLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Senda de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Senda del Bárbaro --</option>
                  <option value="Senda del Árbol del Mundo">Senda del Árbol del Mundo</option>
                  <option value="Senda del Berserker">Senda del Berserker</option>
                  <option value="Senda del Corazón Salvaje">Senda del Corazón Salvaje</option>
                  <option value="Senda del Fanático">Senda del Fanático</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Bárbaro de nivel 3 o superior. Elige tu senda de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Bardo para Nivel >= 3 -->
              <div *ngIf="isBardLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Colegio de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Colegio del Bardo --</option>
                  <option value="Colegio de la Danza">Colegio de la Danza</option>
                  <option value="Colegio del Conocimiento">Colegio del Conocimiento</option>
                  <option value="Colegio del Glamour">Colegio del Glamour</option>
                  <option value="Colegio del Valor">Colegio del Valor</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Bardo de nivel 3 o superior. Elige tu colegio de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Brujo para Nivel >= 3 -->
              <div *ngIf="isWarlockLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Patrón de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Patrón del Brujo --</option>
                  <option value="Patrón Celestial">Patrón Celestial</option>
                  <option value="Patrón Feérico">Patrón Feérico</option>
                  <option value="Patrón Infernal">Patrón Infernal</option>
                  <option value="Patrón Primigenio">Patrón Primigenio</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Brujo de nivel 3 o superior. Elige tu patrón de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Clérigo para Nivel >= 3 -->
              <div *ngIf="isClericLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Dominio Divino de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Dominio del Clérigo --</option>
                  <option value="Dominio de la Guerra">Dominio de la Guerra</option>
                  <option value="Dominio de la Luz">Dominio de la Luz</option>
                  <option value="Dominio de la Vida">Dominio de la Vida</option>
                  <option value="Dominio del Engaño">Dominio del Engaño</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Clérigo de nivel 3 o superior. Elige tu dominio de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Hechicero para Nivel >= 3 -->
              <div *ngIf="isSorcererLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Origen de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Origen del Hechicero --</option>
                  <option value="Hechicería aberrante">Hechicería aberrante</option>
                  <option value="Hechicería de magia salvaje">Hechicería de magia salvaje</option>
                  <option value="Hechicería dracónica">Hechicería dracónica</option>
                  <option value="Hechicería mecánica">Hechicería mecánica</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Hechicero de nivel 3 o superior. Elige tu origen de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Druida para Nivel >= 3 -->
              <div *ngIf="isDruidLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Círculo Druídico de Subclase (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Círculo del Druida --</option>
                  <option value="Círculo de la Luna">Círculo de la Luna</option>
                  <option value="Círculo de la Tierra (Árido)">Círculo de la Tierra (Árido)</option>
                  <option value="Círculo de la Tierra (Polar)">Círculo de la Tierra (Polar)</option>
                  <option value="Círculo de la Tierra (Templado)">Círculo de la Tierra (Templado)</option>
                  <option value="Círculo de la Tierra (Tropical)">Círculo de la Tierra (Tropical)</option>
                  <option value="Círculo de las Estrellas">Círculo de las Estrellas</option>
                  <option value="Círculo del Mar">Círculo del Mar</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Druida de nivel 3 o superior. Elige tu círculo de subclase para desbloquear tus poderes.
                </span>
              </div>

              <!-- Selector de Subclase Explorador para Nivel >= 3 -->
              <div *ngIf="isRangerLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Subclase de Explorador (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Subclase de Explorador --</option>
                  <option value="Acechador en la penumbra">Acechador en la penumbra</option>
                  <option value="Cazador">Cazador</option>
                  <option value="Errante feérico">Errante feérico</option>
                  <option value="Señor de las bestias">Señor de las bestias</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Explorador de nivel 3 o superior. Elige tu subclase para desbloquear tus rasgos.
                </span>

                <!-- Dádiva de los Parajes Feéricos (Errante Feérico) -->
                <div *ngIf="selectedSubclass === 'Errante feérico'" class="space-y-2 mt-3 animate-fade-in bg-purple-950/10 border border-purple-500/20 p-3 rounded-lg text-left">
                  <label class="text-[9px] text-purple-400 uppercase font-bold tracking-wider block font-fantasy">Dádiva de los Parajes Feéricos (Bendición)</label>
                  <select
                    [(ngModel)]="selectedRangerFeyGift"
                    class="w-full bg-[#0e0e11] border border-purple-500/30 focus:border-purple-400 focus:outline-none px-3 py-2 rounded text-[11px] text-neutral-200 cursor-pointer"
                  >
                    <option value="">-- Selecciona una Dádiva (Bendición) --</option>
                    <option value="Unas mariposas ilusorias revolotean a tu alrededor mientras haces un descanso corto o largo.">1. Mariposas ilusorias en descansos</option>
                    <option value="Te brotan flores en el pelo cada amanecer.">2. Flores en el pelo cada amanecer</option>
                    <option value="Emanas un ligero olor a canela, lavanda, nuez moscada u otra hierba o especia agradable.">3. Aroma agradable (canela/lavanda/nuez moscada)</option>
                    <option value="Tu sombra baila cuando nadie la mira directamente.">4. Sombra danzante</option>
                    <option value="De tu cabeza brotan cuernos o astas.">5. Cuernos o astas</option>
                    <option value="Tu piel y tu cabello cambian de color cada amanecer.">6. Piel y cabello cambiantes</option>
                  </select>
                </div>

                <!-- Compañero Primigenio (Señor de las bestias) -->
                <div *ngIf="selectedSubclass === 'Señor de las bestias'" class="space-y-2 mt-3 animate-fade-in bg-emerald-950/10 border border-emerald-500/20 p-3 rounded-lg text-left">
                  <label class="text-[9px] text-emerald-400 uppercase font-bold tracking-wider block font-fantasy">Compañero Primigenio (Bestia)</label>
                  <select
                    [(ngModel)]="selectedRangerPrimalCompanion"
                    class="w-full bg-[#0e0e11] border border-emerald-500/30 focus:border-emerald-450 focus:outline-none px-3 py-2 rounded text-[11px] text-neutral-200 cursor-pointer"
                  >
                    <option value="">-- Selecciona un Perfil de Bestia --</option>
                    <option value="Bestia de los mares">Bestia de los mares (Nadar, Agarre)</option>
                    <option value="Bestia de tierra firme">Bestia de tierra firme (Correr, Carga y Derribo)</option>
                    <option value="Bestia del cielo">Bestia del cielo (Vuelo, sin Ataques de oportunidad)</option>
                  </select>
                </div>
              </div>

              <!-- Selector de Subclase Guerrero para Nivel >= 3 -->
              <div *ngIf="isFighterLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Subclase de Guerrero (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Subclase de Guerrero --</option>
                  <option value="Caballero Arcano">Caballero Arcano (Lanzador de Conjuros)</option>
                  <option value="Campeón">Campeón (Fuerza física y críticos)</option>
                  <option value="Guerrero Psiónico">Guerrero Psiónico (Poderes telequinéticos)</option>
                  <option value="Maestro del Combate">Maestro del Combate (Tácticas y maniobras)</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Guerrero de nivel 3 o superior. Elige tu subclase para desbloquear tus rasgos.
                </span>

                <!-- Conjuros del Caballero Arcano (Fighter Nivel >= 3 + Caballero Arcano) -->
                <div *ngIf="selectedSubclass === 'Caballero Arcano'" class="space-y-4 mt-3 animate-fade-in bg-blue-950/10 border border-blue-500/20 p-4 rounded-xl text-left">
                  <div class="border-b border-blue-500/20 pb-2">
                    <label class="text-[10px] text-blue-400 uppercase font-bold tracking-wider block font-fantasy">🛡️ Magia de Caballero Arcano (Nivel {{ characterLevel }})</label>
                    <span class="text-[8px] text-neutral-450 block mt-0.5 leading-normal">
                      Preparas **{{ getEldritchKnightCantripsLimit() }} Trucos** y **{{ getEldritchKnightSpellsLimit() }} Conjuros** de nivel inferior o igual a **{{ getEldritchKnightMaxSpellLevel() }}**.
                    </span>
                  </div>

                  <!-- Selección de Trucos -->
                  <div class="space-y-2 pt-1">
                    <div class="flex justify-between items-center">
                      <span class="text-[8.5px] uppercase font-bold text-neutral-355 tracking-wider">Trucos de Mago (Elige exactamente {{ getEldritchKnightCantripsLimit() }}):</span>
                      <span class="text-[8.5px] font-mono text-blue-400 font-bold">{{ selectedEldritchKnightCantrips.length }} / {{ getEldritchKnightCantripsLimit() }}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div 
                        *ngFor="let cantrip of eldritchKnightCantripsList"
                        class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                        [ngClass]="selectedEldritchKnightCantrips.includes(cantrip.name) ? 'bg-blue-955/20 border-blue-600/50 text-blue-300' : 'bg-[#0e0e11] border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                      >
                        <input 
                          type="checkbox"
                          [checked]="selectedEldritchKnightCantrips.includes(cantrip.name)"
                          (change)="toggleEldritchKnightCantrip(cantrip.name)"
                          [disabled]="!selectedEldritchKnightCantrips.includes(cantrip.name) && selectedEldritchKnightCantrips.length >= getEldritchKnightCantripsLimit()"
                          class="w-3.5 h-3.5 accent-blue-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                        />
                        <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleEldritchKnightCantrip(cantrip.name)">
                          <strong class="font-fantasy text-blue-400 tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                          <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Selección de Hechizos Preparados -->
                  <div class="space-y-2 pt-2 border-t border-neutral-900">
                    <div class="flex justify-between items-center">
                      <span class="text-[8.5px] uppercase font-bold text-neutral-355 tracking-wider">Conjuros Preparados (Elige exactamente {{ getEldritchKnightSpellsLimit() }}):</span>
                      <span class="text-[8.5px] font-mono text-blue-400 font-bold">{{ selectedEldritchKnightSpells.length }} / {{ getEldritchKnightSpellsLimit() }}</span>
                    </div>
                    <div class="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                      <div *ngFor="let lvl of getEldritchKnightAvailableSpellLevels()" class="space-y-1.5">
                        <span class="text-[8px] text-blue-400 font-bold uppercase tracking-widest block font-fantasy">Conjuros Nivel {{ lvl }}</span>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          <div 
                            *ngFor="let spell of getEldritchKnightSpellsForLevel(lvl)"
                            class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                            [ngClass]="selectedEldritchKnightSpells.includes(spell.name) ? 'bg-blue-955/20 border-blue-600/50 text-blue-300' : 'bg-[#0e0e11] border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                          >
                            <input 
                              type="checkbox"
                              [checked]="selectedEldritchKnightSpells.includes(spell.name)"
                              (change)="toggleEldritchKnightSpell(spell.name)"
                              [disabled]="!selectedEldritchKnightSpells.includes(spell.name) && selectedEldritchKnightSpells.length >= getEldritchKnightSpellsLimit()"
                              class="w-3.5 h-3.5 accent-blue-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                            />
                            <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleEldritchKnightSpell(spell.name)">
                              <strong class="font-fantasy text-blue-400 tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                              <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selector de Subclase Mago para Nivel >= 3 -->
              <div *ngIf="isMagoLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Escuela de Magia (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Escuela del Mago --</option>
                  <option value="Abjurador">Abjurador</option>
                  <option value="Adivino">Adivino</option>
                  <option value="Evocador">Evocador</option>
                  <option value="Ilusionista">Ilusionista</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Mago de nivel 3 o superior. Elige tu escuela de magia para especializarte.
                </span>
              </div>

              <!-- Selector de Subclase Paladín para Nivel >= 3 -->
              <div *ngIf="isPaladinLvl3()" class="space-y-2 mt-4 animate-fade-in md:col-span-2 bg-[#121215]/80 border border-[#d4af37]/25 p-4 rounded-xl">
                <label class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider block">Juramento Sagrado (Nivel 3+)</label>
                <select
                  [(ngModel)]="selectedSubclass"
                  class="w-full bg-[#0e0e11] border border-[#d4af37]/35 focus:border-[#d4af37] focus:outline-none px-4 py-2.5 rounded-lg text-xs text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="">-- Selecciona tu Juramento del Paladín --</option>
                  <option value="Juramento de la Devoción">Juramento de la Devoción</option>
                  <option value="Juramento de las Antiguas">Juramento de las Antiguas</option>
                  <option value="Juramento de la Venganza">Juramento de la Venganza</option>
                  <option value="Juramento de la Gloria">Juramento de la Gloria</option>
                </select>
                <span class="text-[9px] text-[#d4af37]/80 italic block">
                  * Has seleccionado un Paladín de nivel 3 o superior. Elige tu juramento de subclase para desbloquear tus rasgos.
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Historia de Origen -->
              <div class="space-y-2">
                <label class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider block">Historia de Origen</label>
                <textarea
                  [(ngModel)]="characterHistory"
                  rows="4"
                  placeholder="Escribe aquí cómo comenzó tu viaje, tus motivaciones, o los secretos de tu pasado..."
                  class="w-full bg-[#0e0e11] border border-neutral-800 hover:border-neutral-750 focus:border-[#d4af37]/50 focus:outline-none p-3 rounded-lg text-xs text-neutral-350 leading-relaxed resize-none custom-scrollbar"
                ></textarea>
                <span *ngIf="!characterHistory.trim()" class="text-[9px] text-amber-500/80 italic block">
                  * Cuéntanos qué motiva a tu aventurero a arriesgar su vida.
                </span>
              </div>
              
              <!-- Descripción Física -->
              <div class="space-y-2">
                <label class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider block">Apariencia y Descripción Física</label>
                <textarea
                  [(ngModel)]="characterPhysicalDesc"
                  rows="4"
                  placeholder="Describe los rasgos físicos más llamativos: cicatrices, color de ojos, vestimenta, complexión..."
                  class="w-full bg-[#0e0e11] border border-neutral-800 hover:border-neutral-750 focus:border-[#d4af37]/50 focus:outline-none p-3 rounded-lg text-xs text-neutral-350 leading-relaxed resize-none custom-scrollbar"
                ></textarea>
                <span *ngIf="!characterPhysicalDesc.trim()" class="text-[9px] text-amber-500/80 italic block">
                  * Describe rasgos particulares, marcas de nacimiento o apariencia singular.
                </span>
              </div>
            </div>

            <!-- Selección de Categoría de Tamaño y Altura -->
            <div class="border-t border-neutral-900/60 pt-4 space-y-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#121215] border border-neutral-800/80 p-4 rounded-xl">
                
                <!-- Categoría de Tamaño -->
                <div class="space-y-1.5 min-w-[200px]">
                  <span class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider block">Categoría de Tamaño</span>
                  
                  <!-- Si la raza tiene elección de tamaño (Humano, Aasimar, Tiefling) -->
                  <div *ngIf="activeSizeInfo?.hasChoice" class="flex gap-2">
                    <label 
                      *ngFor="let size of activeSizeInfo?.sizes"
                      class="flex-1 text-center py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition select-none flex items-center justify-center gap-1.5"
                      [ngClass]="selectedSizeClass === size.name ? 'bg-amber-955/20 border-[#d4af37] text-[#d4af37]' : 'bg-[#18181c] border-neutral-800 text-neutral-400 hover:border-neutral-700'"
                    >
                      <input 
                        type="radio" 
                        name="sizeClassRadio"
                        [(ngModel)]="selectedSizeClass"
                        [value]="size.name"
                        (change)="onSizeClassChange()"
                        class="hidden"
                      />
                      <span>{{ size.name }}</span>
                    </label>
                  </div>

                  <!-- Si la raza tiene tamaño fijo -->
                  <div *ngIf="!activeSizeInfo?.hasChoice" class="text-xs font-bold text-[#d4af37] bg-[#18181c] border border-neutral-800 px-4 py-2 rounded-lg inline-block uppercase tracking-wider">
                    Tamaño: {{ selectedSizeClass }}
                  </div>
                </div>

                <!-- Slider de Altura -->
                <div class="flex-1 w-full space-y-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-455 uppercase font-bold tracking-wider text-[10px]">Altura del Personaje</span>
                    <span class="text-sm font-bold text-amber-400 font-mono bg-[#0e0e11] px-3 py-0.5 border border-neutral-800 rounded">
                      {{ characterHeight }} m
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <span class="text-[10px] text-neutral-500 font-mono shrink-0">
                      {{ getMinHeight() }} m
                    </span>
                    
                    <input 
                      type="range"
                      [(ngModel)]="characterHeight"
                      [min]="getMinHeight()"
                      [max]="getMaxHeight()"
                      step="0.01"
                      class="flex-1 h-1.5 bg-[#0e0e11] border border-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    
                    <span class="text-[10px] text-neutral-500 font-mono shrink-0">
                      {{ getMaxHeight() }} m
                    </span>
                  </div>
                  
                  <!-- Texto descriptivo del rango -->
                  <div class="text-[9px] text-neutral-500 italic">
                    Rango para un {{ activeOrigin.name }} ({{ selectedSizeClass }}): {{ getSizeDescription() }}
                  </div>
                </div>

              </div>

              <!-- Ficha Técnica de Carga y Categoría Identificada -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#121215]/80 border border-neutral-850 p-4 rounded-xl items-center mt-4">
                <!-- Identificador de Tamaño -->
                <div class="flex items-center gap-3">
                  <span class="text-[10px] text-neutral-450 uppercase font-bold tracking-wider block">Identificador:</span>
                  <div class="relative group">
                    <span 
                      class="w-10 h-10 rounded-full border-2 border-amber-600/70 text-[#d4af37] bg-[#0c0c0e] flex items-center justify-center font-serif font-bold text-sm cursor-help hover:bg-amber-600/20 hover:border-amber-500 transition shadow-md select-none"
                      [title]="'Categoría de tamaño de criatura: ' + selectedSizeClass"
                    >
                      {{ getSizeLetter(selectedSizeClass) }}
                    </span>
                    <!-- Custom tooltip visual -->
                    <div class="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-[#16161a] border border-[#d4af37]/45 text-neutral-355 text-[10px] rounded px-3 py-1.5 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 z-50 whitespace-nowrap">
                      Tamaño: <strong class="text-amber-400 font-semibold">{{ selectedSizeClass }}</strong>
                    </div>
                  </div>
                  <div>
                    <span class="text-[9px] text-neutral-500 block leading-tight">Pasa el cursor para ver el tamaño completo</span>
                  </div>
                </div>

                <!-- Capacidad de Carga Máxima -->
                <div class="bg-neutral-900/40 border border-neutral-850 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block">Capacidad de Carga</span>
                    <span class="text-xs font-mono font-bold text-neutral-200 mt-0.5 block">
                      {{ carryingCapacity.maxKg }} kg / {{ carryingCapacity.maxLb }} lb
                    </span>
                  </div>
                  <span class="text-lg select-none">🎒</span>
                </div>

                <!-- Arrastrar, levantar o empujar -->
                <div class="bg-neutral-900/40 border border-neutral-850 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block">Arrastrar / Levantar / Empujar</span>
                    <span class="text-xs font-mono font-bold text-neutral-200 mt-0.5 block">
                      {{ carryingCapacity.dragKg }} kg / {{ carryingCapacity.dragLb }} lb
                    </span>
                  </div>
                  <span class="text-lg select-none">💪</span>
                </div>
              </div>
            </div>

            </div>

            <!-- Selector de Dote: Iniciado en la Magia -->
            <div *ngIf="hasMagicInitiateFeat()" class="space-y-4 mt-6 animate-fade-in md:col-span-2 bg-[#121215]/90 border border-amber-500/40 p-5 rounded-xl text-left shadow-lg relative z-10">
              <div class="border-b border-amber-500/25 pb-3 flex justify-between items-center">
                <div>
                  <h3 class="text-sm font-serif font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>✨</span> Dote Clave: Iniciado en la Magia
                  </h3>
                  <p class="text-[10px] text-neutral-400 mt-0.5">
                    Has obtenido la dote <strong>Iniciado en la Magia</strong> por tu trasfondo. Debes elegir la lista de clase, tu aptitud mágica, 2 trucos y 1 conjuro de nivel 1.
                  </p>
                </div>
                <span class="text-xs font-mono font-bold text-amber-400 bg-amber-955/40 border border-amber-600/30 px-2.5 py-1 rounded">
                  D&D 2024
                </span>
              </div>

              <!-- Configuración 1: Lista de Clase y Aptitud Mágica -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0e0e11] border border-neutral-850 p-3.5 rounded-lg">
                <div class="space-y-1.5">
                  <label class="text-[9.5px] text-amber-300 font-bold uppercase tracking-wider block">1. Lista de Clase de Hechizos</label>
                  <select
                    [(ngModel)]="magicInitiateClass"
                    (change)="onMagicInitiateClassChange()"
                    class="w-full bg-[#18181c] border border-amber-600/30 focus:border-amber-400 focus:outline-none px-3 py-2 rounded text-xs text-neutral-200 cursor-pointer font-semibold"
                  >
                    <option value="Clérigo">Clérigo</option>
                    <option value="Druida">Druida</option>
                    <option value="Mago">Mago</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[9.5px] text-amber-300 font-bold uppercase tracking-wider block">2. Aptitud Mágica (Atributo de Lanzamiento)</label>
                  <select
                    [(ngModel)]="magicInitiateAbility"
                    class="w-full bg-[#18181c] border border-amber-600/30 focus:border-amber-400 focus:outline-none px-3 py-2 rounded text-xs text-neutral-200 cursor-pointer font-semibold"
                  >
                    <option value="">-- Elige Aptitud Mágica --</option>
                    <option value="Inteligencia">Inteligencia (INT)</option>
                    <option value="Sabiduría">Sabiduría (SAB)</option>
                    <option value="Carisma">Carisma (CAR)</option>
                  </select>
                </div>
              </div>

              <!-- Configuración 2: Selección de 2 Trucos -->
              <div class="space-y-2 pt-2 border-t border-neutral-900">
                <div class="flex justify-between items-center">
                  <span class="text-[9px] uppercase font-bold text-neutral-300 tracking-wider">
                    3. Trucos de {{ getEffectiveMagicInitiateClass() }} (Elige exactamente 2):
                  </span>
                  <span class="text-[9px] font-mono text-amber-400 font-bold">
                    {{ magicInitiateCantrips.length }} / 2
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  <div 
                    *ngFor="let cantrip of getMagicInitiateCantripsList()"
                    class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                    [ngClass]="magicInitiateCantrips.includes(cantrip.name) ? 'bg-amber-955/20 border-amber-600/60 text-amber-300' : 'bg-[#0e0e11] border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                  >
                    <input 
                      type="checkbox"
                      [checked]="magicInitiateCantrips.includes(cantrip.name)"
                      (change)="toggleMagicInitiateCantrip(cantrip.name)"
                      [disabled]="!magicInitiateCantrips.includes(cantrip.name) && magicInitiateCantrips.length >= 2"
                      class="w-3.5 h-3.5 accent-amber-600 cursor-pointer disabled:opacity-40 mt-0.5 shrink-0"
                    />
                    <div class="text-[8.5px] leading-snug w-full h-full" (click)="toggleMagicInitiateCantrip(cantrip.name)">
                      <strong class="font-fantasy text-amber-400 tracking-wide block uppercase text-[8.5px]">{{ cantrip.name }}</strong>
                      <span class="text-neutral-400 text-[8px] font-light">{{ cantrip.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuración 3: Selección de 1 Conjuro de Nivel 1 -->
              <div class="space-y-2 pt-2 border-t border-neutral-900">
                <div class="flex justify-between items-center">
                  <span class="text-[9px] uppercase font-bold text-neutral-300 tracking-wider">
                    4. Conjuro Nivel 1 de {{ getEffectiveMagicInitiateClass() }} (Elige exactamente 1):
                  </span>
                  <span class="text-[9px] font-mono text-amber-400 font-bold">
                    {{ magicInitiateSpell ? '1 / 1 (' + magicInitiateSpell + ')' : '0 / 1' }}
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  <div 
                    *ngFor="let spell of getMagicInitiateSpellsList()"
                    class="flex items-start gap-2 p-2 rounded border transition-all duration-150 relative cursor-pointer select-none"
                    [ngClass]="magicInitiateSpell === spell.name ? 'bg-amber-955/20 border-amber-600/60 text-amber-300' : 'bg-[#0e0e11] border-neutral-850 hover:border-neutral-800 text-neutral-450'"
                  >
                    <input 
                      type="radio"
                      name="magicInitiateSpellRadio"
                      [checked]="magicInitiateSpell === spell.name"
                      (change)="selectMagicInitiateSpell(spell.name)"
                      class="w-3.5 h-3.5 accent-amber-600 cursor-pointer mt-0.5 shrink-0"
                    />
                    <div class="text-[8.5px] leading-snug w-full h-full" (click)="selectMagicInitiateSpell(spell.name)">
                      <strong class="font-fantasy text-amber-400 tracking-wide block uppercase text-[8.5px]">{{ spell.name }}</strong>
                      <span class="text-neutral-400 text-[8px] font-light">{{ spell.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          <!-- Advertencia de campos incompletos -->
          <div *ngIf="!characterName.trim() || !characterHistory.trim() || !characterPhysicalDesc.trim() || (isSubclassRequired() && !selectedSubclass) || !isRangerSubclassConfigComplete() || !isFighterSubclassConfigComplete() || !isMagicInitiateConfigComplete()" class="bg-red-955/10 border border-red-800/40 p-4 rounded-xl text-left relative z-10 flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <div class="text-xs text-red-300 leading-relaxed font-light">
              <span *ngIf="!characterName.trim() || !characterHistory.trim() || !characterPhysicalDesc.trim()">
                Debes rellenar el <strong class="text-red-200">Nombre del Aventurero</strong>, la <strong class="text-red-200">Historia de Origen</strong> y la <strong class="text-red-200">Apariencia Física</strong>.
              </span>
              <span *ngIf="isSubclassRequired() && !selectedSubclass" class="block mt-1">
                Además, debes seleccionar tu <strong class="text-red-200">Subclase de Nivel 3 o superior</strong>.
              </span>
              <span *ngIf="isRanger() && selectedSubclass === 'Errante feérico' && !selectedRangerFeyGift" class="block mt-1">
                Además, debes seleccionar tu <strong class="text-red-200">Dádiva de los Parajes Feéricos</strong>.
              </span>
              <span *ngIf="isRanger() && selectedSubclass === 'Señor de las bestias' && !selectedRangerPrimalCompanion" class="block mt-1">
                Además, debes seleccionar tu <strong class="text-red-200">Compañero Primigenio (Bestia)</strong>.
              </span>
              <span *ngIf="isFighter() && selectedSubclass === 'Caballero Arcano' && !isFighterSubclassConfigComplete()" class="block mt-1">
                Además, debes seleccionar todos tus <strong class="text-red-200">Trucos y Conjuros Preparados de Caballero Arcano</strong> ({{ selectedEldritchKnightCantrips.length }}/{{ getEldritchKnightCantripsLimit() }} trucos y {{ selectedEldritchKnightSpells.length }}/{{ getEldritchKnightSpellsLimit() }} conjuros).
              </span>
              <span *ngIf="hasMagicInitiateFeat() && !isMagicInitiateConfigComplete()" class="block mt-1">
                Además, debes seleccionar la <strong class="text-red-200">Aptitud Mágica</strong>, los <strong class="text-red-200">2 Trucos</strong> y el <strong class="text-red-200">Conjuro de Nivel 1</strong> de tu dote <strong class="text-amber-300">Iniciado en la Magia</strong> ({{ magicInitiateCantrips.length }}/2 trucos y {{ magicInitiateSpell ? 1 : 0 }}/1 conjuro).
              </span>
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
              [disabled]="!characterName.trim() || !characterHistory.trim() || !characterPhysicalDesc.trim() || (isSubclassRequired() && !selectedSubclass) || !isRangerSubclassConfigComplete() || !isFighterSubclassConfigComplete() || !isMagicInitiateConfigComplete()"
              class="w-full sm:w-2/3 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg text-sm border-t border-red-500/20 font-serif cursor-pointer transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
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
              <button 
                (click)="previewTab = 3"
                class="px-4 py-1.5 rounded text-[10px] font-serif uppercase tracking-wider cursor-pointer transition select-none"
                [class.bg-amber-600]="previewTab === 3"
                [class.text-white]="previewTab === 3"
                [class.text-neutral-455]="previewTab !== 3"
              >
                Biografía y Aspecto
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
                    {{ selectedOriginLineage ? activeOrigin.name + ' (' + selectedOriginLineage + ')' : (activeOrigin.name || 'Ninguno') }}
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
                        <span class="text-[9px] text-neutral-500 font-normal">({{ attr.value }}+{{ backgroundStatsAllocation[attr.key] || 0 }})</span>
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
                  <div class="space-y-0.5 text-left">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">PG Máximos</span>
                    <span class="text-lg font-bold text-neutral-200 font-mono block">
                      {{ calculateMaxHp() }} HP
                    </span>
                    <span class="text-[8px] text-neutral-400 block font-sans">Nivel {{ characterLevel }} • Con: {{ getFinalModifier('CON') }}</span>
                    <span class="text-[7.5px] text-neutral-550 block font-sans leading-normal mt-1">
                      Cálculo: {{ getHitDieValue() }} (Max Dado) {{ getFinalModifierValue('CON') >= 0 ? '+' : '' }}{{ getFinalModifierValue('CON') }} (Con)
                      <span *ngIf="characterLevel > 1">
                         + {{ (mathFloor(getHitDieValue() / 2) + 1 + getFinalModifierValue('CON')) * (characterLevel - 1) }} (Nivel Up)
                      </span>
                      <span *ngIf="isDwarfCharacter()" class="text-amber-500 font-semibold block mt-0.5">✦ +{{ characterLevel }} (Especie Enano)</span>
                      <span *ngIf="hasToughFeat()" class="text-amber-500 font-semibold block mt-0.5">✦ +{{ 2 * characterLevel }} (Dote Dureza)</span>
                    </span>
                  </div>
                  <div class="space-y-0.5 text-left">
                    <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block font-fantasy">Dados de Golpe</span>
                    <span class="text-sm font-bold text-[#d4af37] font-mono mt-1 block">
                      {{ characterLevel }}d{{ getHitDieValue() }}
                    </span>
                    <span class="text-[8px] text-neutral-600 block">Dado Clase</span>
                  </div>
                </div>

                <!-- Capacidad de Carga y Tamaño -->
                <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-3 text-left">
                  <div class="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                    <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Carga y Tamaño de Criatura</span>
                    
                    <!-- Letra de tamaño con tooltip -->
                    <div class="relative group select-none">
                      <span 
                        class="w-6 h-6 rounded-full border border-amber-600/70 text-amber-500 bg-[#0c0c0e] flex items-center justify-center font-serif font-bold text-[10px] cursor-help hover:bg-amber-600/20 transition shadow"
                        [title]="'Tamaño de criatura: ' + (selectedSizeClass || 'Mediano')"
                      >
                        {{ getSizeLetter(selectedSizeClass || 'Mediano') }}
                      </span>
                      <!-- Tooltip visual del tamaño -->
                      <div class="absolute bottom-8 right-0 bg-[#16161a] border border-[#d4af37]/45 text-neutral-355 text-[9px] rounded px-2.5 py-1 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 whitespace-nowrap z-50">
                        Tamaño: <strong class="text-amber-400 font-semibold">{{ selectedSizeClass || 'Mediano' }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3 text-[10px]">
                    <div class="bg-[#121215] border border-neutral-850 p-2 rounded relative">
                      <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block mb-0.5">Carga Máxima</span>
                      <span class="font-mono font-bold text-neutral-200 block">
                        {{ carryingCapacity.maxKg }} kg / {{ carryingCapacity.maxLb }} lb
                      </span>
                    </div>

                    <div class="bg-[#121215] border border-neutral-850 p-2 rounded relative">
                      <span class="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block mb-0.5">Arrastrar/Levantar/Empujar</span>
                      <span class="font-mono font-bold text-neutral-200 block">
                        {{ carryingCapacity.dragKg }} kg / {{ carryingCapacity.dragLb }} lb
                      </span>
                    </div>
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

                <!-- Detalles Estadísticos del Equipo Equipado en Ficha -->
                <div *ngIf="selectedEquipmentOption === 'A' || selectedBgEquipmentOption === 'A'" class="space-y-4">
                  <!-- Tabla de Armas -->
                  <div *ngIf="getEquippedWeaponsDetails().length > 0" class="bg-neutral-900/35 border border-neutral-855 p-4 rounded-xl space-y-3 text-left">
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block border-b border-neutral-900 pb-1">Especificaciones de Armas</span>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr class="border-b border-neutral-800 text-[8px] uppercase font-bold text-neutral-500 tracking-wider">
                            <th class="py-1.5 pr-2">Nombre / Cant</th>
                            <th class="py-1.5 pr-2 text-center">Bono de Ataque</th>
                            <th class="py-1.5 pr-2 text-center">Daño / Tipo</th>
                            <th class="py-1.5 pr-2">Propiedades</th>
                            <th *ngIf="hasWeaponMastery()" class="py-1.5 pr-2 text-center">Maestría</th>
                            <th class="py-1.5 pr-2 text-center">Peso</th>
                            <th class="py-1.5 text-right">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let weapon of getEquippedWeaponsDetails()" class="border-b border-neutral-900/60 hover:bg-neutral-900/10 transition duration-150">
                            <td class="py-2.5 pr-2 font-bold text-neutral-200 flex items-center gap-1.5">
                              <span class="bg-[#121215] border border-neutral-800 text-neutral-400 font-mono text-[8px] px-1 py-0.5 rounded font-bold">
                                {{ weapon.quantity }}x
                              </span>
                              <span>{{ weapon.name }}</span>
                            </td>
                            <td class="py-2.5 pr-2 text-center font-bold text-amber-500 font-mono text-[11px]">
                              {{ weapon.attackBonus }}
                              <span class="text-[8px] text-neutral-500 block font-sans font-light mt-0.5 whitespace-nowrap">
                                1d20 + {{ weapon.abilityModValue }} ({{ weapon.abilityModKey }}) + {{ weapon.profBonus }} (Comp)
                              </span>
                            </td>
                            <td class="py-2.5 pr-2 text-center">
                              <span class="font-semibold text-red-400 font-mono text-[11px] block">
                                {{ weapon.fullDamage }}
                              </span>
                              <span class="text-[9px] text-neutral-450 block font-sans font-light mt-0.5">
                                {{ weapon.damageType }}
                              </span>
                            </td>
                            <td class="py-2.5 pr-2 text-neutral-400 text-[10px] leading-tight font-light">{{ weapon.properties }}</td>
                            <td *ngIf="hasWeaponMastery()" class="py-2.5 pr-2 text-center">
                              <span class="bg-amber-955/20 border border-amber-600/30 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-help" [title]="weapon.description">
                                {{ weapon.mastery }}
                              </span>
                            </td>
                            <td class="py-2.5 pr-2 text-center font-mono text-[10px] text-neutral-400">{{ weapon.weight }}</td>
                            <td class="py-2 text-right font-mono text-[10px] text-amber-450">{{ weapon.price }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <!-- Glosario de Maestría con Armas (Solo si tiene Maestría) -->
                    <div *ngIf="hasWeaponMastery()" class="mt-2 bg-[#121215] border border-amber-600/15 p-3 rounded-lg space-y-1.5">
                      <span class="text-[8px] text-[#d4af37] uppercase font-bold tracking-wider block">Propiedades de Maestría con Armas</span>
                      <div class="space-y-1.5">
                        <div *ngFor="let weapon of getEquippedWeaponsDetails()" class="text-[10px] bg-[#18181c] p-2 rounded border border-neutral-900/50">
                          <div class="flex justify-between items-center text-[9px]">
                            <span class="font-bold text-neutral-355">{{ weapon.name }}</span>
                            <span class="text-amber-500 font-bold uppercase">{{ weapon.mastery }}</span>
                          </div>
                          <p class="text-neutral-450 font-light leading-snug mt-1 text-[9px]">{{ weapon.description }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tabla de Armaduras y Escudo -->
                  <div *ngIf="getEquippedArmorsDetails().length > 0" class="bg-neutral-900/35 border border-neutral-855 p-4 rounded-xl space-y-3 text-left">
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block border-b border-neutral-900 pb-1">Especificaciones de Armaduras & Escudos</span>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr class="border-b border-neutral-800 text-[8px] uppercase font-bold text-neutral-500 tracking-wider">
                            <th class="py-1.5 pr-2">Armadura</th>
                            <th class="py-1.5 pr-2">Tipo</th>
                            <th class="py-1.5 pr-2 text-center">CA</th>
                            <th class="py-1.5 pr-2 text-center">Fuerza</th>
                            <th class="py-1.5 pr-2 text-center">Sigilo</th>
                            <th class="py-1.5 pr-2 text-center">Peso</th>
                            <th class="py-1.5 text-right">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let armor of getEquippedArmorsDetails()" class="border-b border-neutral-900/60">
                            <td class="py-2 pr-2 font-bold text-neutral-200">{{ armor.name }}</td>
                            <td class="py-2 pr-2 text-neutral-400 text-[10px] leading-tight font-light">{{ armor.type }}</td>
                            <td class="py-2 pr-2 text-center font-bold text-amber-400 font-mono text-[12px]">{{ armor.ca }}</td>
                            <td class="py-2 pr-2 text-center font-mono text-[10px] text-neutral-400">{{ armor.strength }}</td>
                            <td class="py-2 pr-2 text-center">
                              <span *ngIf="armor.stealth === 'Desventaja'" class="bg-red-955/20 border border-red-800/40 text-red-500 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                Desventaja
                              </span>
                              <span *ngIf="armor.stealth !== 'Desventaja'" class="text-neutral-500">—</span>
                            </td>
                            <td class="py-2 pr-2 text-center font-mono text-[10px] text-neutral-400">{{ armor.weight }}</td>
                            <td class="py-2 text-right font-mono text-[10px] text-amber-450">{{ armor.price }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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

            <!-- PESTAÑA 3: BIOGRAFÍA Y ASPECTO -->
            <div *ngIf="previewTab === 3" class="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
              
              <!-- COLUMNA 1: DETALLES DE APARIENCIA (md:col-span-4) -->
              <div class="md:col-span-4 space-y-4">
                <h3 class="text-[10px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Aspecto Físico</h3>
                
                <div class="bg-[#121215] border border-neutral-850 p-5 rounded-xl space-y-4">
                  <!-- Altura -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Altura</span>
                    <div class="text-sm font-bold text-neutral-200 bg-[#18181c] border border-neutral-800 px-3 py-2 rounded font-mono">
                      {{ characterHeight ? characterHeight + ' m' : 'No seleccionada' }}
                    </div>
                  </div>

                  <!-- Categoría de Tamaño -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block">Categoría de Tamaño</span>
                    <div class="text-xs font-bold text-neutral-200 bg-[#18181c] border border-neutral-800 px-3 py-2 rounded uppercase tracking-wider">
                      {{ selectedSizeClass || 'Ninguno' }}
                    </div>
                  </div>

                  <!-- Raza/Origen -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-neutral-455 uppercase font-bold tracking-wider block">Especie / Raza</span>
                    <div class="text-xs font-bold text-neutral-250 bg-[#18181c] border border-neutral-800 px-3 py-2 rounded">
                      {{ activeOrigin.name }}
                    </div>
                  </div>
                </div>

                <!-- Resumen de Rasgos Físicos -->
                <div class="bg-neutral-900/30 border border-neutral-855 p-4 rounded-xl space-y-2 text-left">
                  <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Detalles de Apariencia</span>
                  <div class="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-wrap max-h-[220px] overflow-y-auto custom-scrollbar">
                    {{ characterPhysicalDesc.trim() || 'Sin descripción física escrita aún.' }}
                  </div>
                </div>
              </div>

              <!-- COLUMNA 2: NARRATIVA E HISTORIA (md:col-span-8) -->
              <div class="md:col-span-8 space-y-4">
                <h3 class="text-[10px] font-bold text-neutral-455 uppercase tracking-widest border-b border-neutral-900 pb-1.5 mb-2">Historia de Origen</h3>
                
                <div class="bg-[#121215] border border-neutral-850 p-6 rounded-xl relative overflow-hidden min-h-[300px] flex flex-col justify-between">
                  <!-- Decoración de pergamino/libro -->
                  <div class="absolute top-4 right-4 text-4xl opacity-10 select-none">📜</div>
                  
                  <div class="space-y-4">
                    <span class="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider block">Crónica del Aventurero</span>
                    <p class="text-xs text-neutral-300 leading-relaxed font-serif italic whitespace-pre-wrap pl-4 border-l-2 border-[#d4af37]/35 max-h-[380px] overflow-y-auto custom-scrollbar">
                      "{{ characterHistory.trim() || 'Esta historia aún no ha sido escrita en los anales del reino...' }}"
                    </p>
                  </div>

                  <div class="pt-4 border-t border-neutral-900/60 mt-4 text-[9px] text-neutral-500 font-serif italic text-right">
                    — Forjado como {{ activeClass.name }} con trasfondo de {{ activeBackground.name }}
                  </div>
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);

  // Datos Dinámicos de la BD
  classes: DndClass[] = [];
  origins: DndOrigin[] = [];
  backgrounds: DndBackground[] = [];

  debugStatus = 'Inicializando...';
  featExpanded = false;

  // Estado de la Vista Previa de la Ficha
  showPreview = false;
  previewTab = 1;
  characterId: string | null = null;
  characterLevel = 1;
  characterName = '';
  characterSubclass = '';
  characterHistory = '';
  characterPhysicalDesc = '';
  selectedSizeClass = '';
  characterHeight = 0;

  // Estado de Selección
  selectedClassIdx = 0;
  selectedOriginIdx = 0;
  selectedBackgroundIdx = 0;
  selectedClassSkills: string[] = [];
  hoveredSkill: string | null = null;

  // Estado de Conjuros del Bardo (D&D 2024)
  selectedBardCantrips: string[] = ['Burla dañina', 'Luces danzantes'];
  selectedBardSpells: string[] = ['Hechizar persona', 'Palabra de curación', 'Rociada de color', 'Susurros discordantes'];

  // Estado de Conjuros e Invocaciones del Brujo (D&D 2024)
  selectedWarlockCantrips: string[] = ['Descarga sobrenatural', 'Prestidigitación'];
  selectedWarlockSpells: string[] = ['Maleficio', 'Armadura de Agathys'];
  selectedWarlockInvocations: string[] = ['Pacto del filo'];

  // Estado de Conjuros y Orden Divina del Clérigo (D&D 2024)
  selectedClericDivineOrder: string = '';
  selectedClericCantrips: string[] = ['Llama sagrada', 'Luz', 'Taumaturgia'];
  selectedClericSpells: string[] = ['Bendición', 'Curar heridas', 'Escudo de fe', 'Saeta guía'];

  // Estado de Conjuros y Metamagia del Hechicero (D&D 2024)
  selectedSorcererCantrips: string[] = ['Agarre electrizante', 'Estallido mágico', 'Luz', 'Prestidigitación'];
  selectedSorcererSpells: string[] = ['Detectar magia', 'Manos ardientes'];
  selectedSorcererMetamagic: string[] = [];

  // Estado de Conjuros del Paladín (D&D 2024)
  selectedPaladinSpells: string[] = ['Bendición', 'Curar heridas'];

  paladinSpellsList = [
    // Nivel 1
    { level: 1, name: 'Bendición', desc: 'Encantamiento (Concentración). Bendice a tres criaturas, añadiendo 1d4 a sus ataques y salvaciones.' },
    { level: 1, name: 'Castigo abrasador', desc: 'Evocación (Concentración). Tu próximo ataque cuerpo a cuerpo causa 1d6 de daño por fuego y prende fuego al objetivo.' },
    { level: 1, name: 'Castigo divino', desc: 'Evocación. Tu ataque causa 2d8 de daño radiante adicional a un enemigo.' },
    { level: 1, name: 'Curar heridas', desc: 'Abjuración. Cura 2d8 + modificador de Carisma a una criatura al tocarla.' },
    { level: 1, name: 'Detectar el bien y el mal', desc: 'Adivinación (Concentración). Detectas celestiales, elementales, feéricos, fiordos, no muertos y aberraciones.' },
    { level: 1, name: 'Duelo compelido', desc: 'Encantamiento (Concentración). Obligas a un enemigo a centrar sus ataques en ti.' },
    { level: 1, name: 'Escudo de fe', desc: 'Abjuración (Concentración, Acción adicional). Otorga +2 a la CA a una criatura elegida.' },
    { level: 1, name: 'Favor divino', desc: 'Evocación (Concentración, Acción adicional). Tus ataques con armas infligen 1d4 daño radiante extra.' },
    { level: 1, name: 'Heroísmo', desc: 'Encantamiento (Concentración). Da inmunidad al miedo y puntos de golpe temporales por turno.' },
    { level: 1, name: 'Protección contra el bien y el mal', desc: 'Abjuración (Concentración). Protege a una criatura de aberraciones, celestiales, elementales, etc.' },
    { level: 1, name: 'Purificar comida y bebida', desc: 'Transmutación (Ritual). Purifica toda la comida y bebida no mágica en un radio de 1.5 metros.' },

    // Nivel 2
    { level: 2, name: 'Arma mágica', desc: 'Transmutación (Concentración). El arma se vuelve mágica con un bonificador de +1 a ataques y daño.' },
    { level: 2, name: 'Auxilio', desc: 'Abjuración. Incrementa los puntos de golpe máximos y actuales de tres criaturas en 5.' },
    { level: 2, name: 'Castigo marcado', desc: 'Evocación (Concentración). Tu próximo ataque causa 2d6 daño radiante y revela al objetivo invisible.' },
    { level: 2, name: 'Encontrar corcel', desc: 'Conjuración. Convocas un espíritu divino que toma forma de un corcel leal.' },
    { level: 2, name: 'Localizar objeto', desc: 'Adivinación (Concentración). Sientes la dirección de un objeto conocido a 300 metros.' },
    { level: 2, name: 'Protección contra veneno', desc: 'Abjuración. Da resistencia al veneno y neutraliza venenos activos.' },
    { level: 2, name: 'Restablecimiento menor', desc: 'Abjuración. Cura ceguedad, sordera, parálisis o envenenamiento.' },
    { level: 2, name: 'Zona de la verdad', desc: 'Encantamiento. Impide mentir en una esfera de 4.5 metros.' },

    // Nivel 3
    { level: 3, name: 'Arma de energía', desc: 'Transmutación (Concentración). El arma inflige 1d4 de daño elemental adicional.' },
    { level: 3, name: 'Castigo deslumbrante', desc: 'Evocación (Concentración). Tu próximo ataque causa 3d8 daño radiante y ciega al objetivo.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Cancela conjuros o efectos mágicos activos de nivel 3 o inferior.' },
    { level: 3, name: 'Luz del día', desc: 'Evocación. Esfera de 18 m emite luz brillante equivalente a la luz solar.' },
    { level: 3, name: 'Manto del cruzado', desc: 'Evocación (Concentración). Otorga a tus aliados cercanos +1d4 daño radiante en sus ataques.' },
    { level: 3, name: 'Revivir', desc: 'Nigromancia. Devuelve la vida a una criatura muerta en el último minuto con 1 HP.' },
    { level: 3, name: 'Sudario de espíritus', desc: 'Nigromancia (Concentración). Espíritus te rodean, dañando a tus enemigos y evitando su curación.' },

    // Nivel 4
    { level: 4, name: 'Aura de vida', desc: 'Abjuración (Concentración). Aura protege a aliados de reducciones de HP y los levanta si caen a 0 HP.' },
    { level: 4, name: 'Aura de pureza', desc: 'Abjuración (Concentración). Protege a aliados de enfermedades, venenos y condiciones mentales.' },
    { level: 4, name: 'Destierro', desc: 'Abjuración (Concentración). Desplazas a una criatura a un semiplano o su plano de origen.' },
    { level: 4, name: 'Castigo estupefaciente', desc: 'Evocación (Concentración). Tu próximo ataque causa 4d6 daño psíquico y desventaja en tiradas.' },
    { level: 4, name: 'Localizar criatura', desc: 'Adivinación (Concentración). Sientes la dirección de una criatura conocida a 300 metros.' },

    // Nivel 5
    { level: 5, name: 'Castigo desterrador', desc: 'Abjuración (Concentración). Tu próximo ataque causa 5d10 daño por fuerza y puede desterrar al objetivo.' },
    { level: 5, name: 'Círculo de poder', desc: 'Abjuración (Concentración). Esfera de 9 m protege a aliados, dándoles ventaja en salvaciones mágicas.' },
    { level: 5, name: 'Ola destructiva', desc: 'Evocación. Creas una onda de fuerza que inflige 5d6 daño radiante y 5d6 daño de trueno.' },
    { level: 5, name: 'Geas', desc: 'Encantamiento. Mandato mágico obliga a criatura a seguir tus órdenes bajo pena de daño.' },
    { level: 5, name: 'Revivir a los muertos', desc: 'Nigromancia. Devuelve la vida a un cadáver muerto hace menos de 10 días.' }
  ];

  // Estado de Conjuros del Mago / Libro de Conjuros (D&D 2024)
  selectedMagoCantrips: string[] = ['Rayo de escarcha', 'Prestidigitación', 'Salpicadura ácida'];
  selectedMagoSpells: string[] = ['Proyectil mágico', 'Escudo', 'Detectar magia', 'Armadura de mago', 'Dormir', 'Grasa'];

  magoCantripsList = [
    { name: 'Agarre electrizante', desc: 'Evocación. Toque cargado con 1d8 de daño de relámpago.' },
    { name: 'Amistad', desc: 'Encantamiento. Ventaja en pruebas de Carisma contra un objetivo no hostil (Concentración).' },
    { name: 'Apretón electrizante', desc: 'Evocación. Ataque de toque; 1d8 daño de relámpago. El objetivo con armadura metálica sufre desventaja.' },
    { name: 'Descarga de fuego', desc: 'Evocación. Ataque de conjuro a 36 m; 1d10 daño de fuego.' },
    { name: 'Elementalismo', desc: 'Transmutación. Crea efectos elementales menores (brisas, chispas, vapor, calor).' },
    { name: 'Fragmento mental', desc: 'Encantamiento. Causa 1d6 daño psíquico y resta 1d4 a la próxima salvación del objetivo.' },
    { name: 'Guardia de cuchillas', desc: 'Abjuración. Resistencia a daño físico hasta el final de tu próximo turno.' },
    { name: 'Impacto certero', desc: 'Adivinación. Ventaja en tu próxima tirada de ataque contra un objetivo a tu alcance.' },
    { name: 'Ilusión menor', desc: 'Ilusionismo. Creas un sonido o imagen hasta tu siguiente turno o 1 minuto.' },
    { name: 'Luz', desc: 'Evocación. Un objeto emite luz brillante en 6 m durante 1 hora.' },
    { name: 'Mano de mago', desc: 'Conjuración. Mano espectral para manipular objetos o abrir puertas a 9 m.' },
    { name: 'Mensaje', desc: 'Transmutación. Susurras un mensaje a distancia a una criatura que puede responderte.' },
    { name: 'Prestidigitación', desc: 'Transmutación. Trucos mágicos menores: limpiar, colorear, encender o enfriar objetos.' },
    { name: 'Rayo de escarcha', desc: 'Evocación (Recomendado). Ataque de conjuro a 18 m; 1d8 daño de frío y reduce velocidad en 3 m.' },
    { name: 'Reparar', desc: 'Transmutación. Repara una fisura en un objeto de menos de 30 cm.' },
    { name: 'Rociado venenoso', desc: 'Conjuración. Proyectas gas venenoso; el objetivo sufre 1d12 daño de veneno (Salvador de Constitución).' },
    { name: 'Salpicadura ácida', desc: 'Evocación (Recomendado). Burbuja de ácido; uno o dos objetivos sufren 1d6 daño ácido.' },
    { name: 'Tañido para los muertos', desc: 'Nigromancia. Envuelve a un objetivo en energía espectral; 1d8 daño necrótico (Salvador de Sabiduría).' },
    { name: 'Toque helado', desc: 'Nigromancia. Ataque de conjuro a 36 m; 1d8 daño necrótico y el objetivo no puede recuperar PG.' },
    { name: 'Tronar', desc: 'Evocación. 1d8 daño de trueno en una onda de fuerza y empuja 3 m.' }
  ];

  magoSpellsList: { level: number, name: string, desc: string }[] = [
    // Nivel 1
    { level: 1, name: 'Alarma', desc: 'Abjuración (Ritual). Creas una alarma mágica que avisa si alguien cruza un área de 6 m.' },
    { level: 1, name: 'Armadura de mago', desc: 'Abjuración (Recomendado). CA base = 13 + mod. Des hasta que te pongas armadura o el conjuro acabe.' },
    { level: 1, name: 'Caída de pluma', desc: 'Transmutación (Reacción). Hasta 5 criaturas descienden a 18 m/ronda y no reciben daño de caída.' },
    { level: 1, name: 'Comprender idiomas', desc: 'Adivinación (Ritual). Entiendes cualquier idioma hablado o escrito durante 1 hora.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación (Ritual, Recomendado). Percibes magia y su escuela a 9 m (Concentración).' },
    { level: 1, name: 'Disfrazarse', desc: 'Ilusionismo. Cambias tu apariencia (ropa, rasgos) durante 1 hora.' },
    { level: 1, name: 'Dormir', desc: 'Encantamiento. Duerme criaturas que sumen hasta 5d8 PG en un área de 4,5 m.' },
    { level: 1, name: 'Encontrar familiar', desc: 'Conjuración (Ritual). Convocas un espíritu feérico como animal familiar permanente.' },
    { level: 1, name: 'Entender idiomas', desc: 'Adivinación (Ritual). Comprendes literalmente cualquier idioma hablado o escrito durante 1 hora.' },
    { level: 1, name: 'Escudo', desc: 'Abjuración (Reacción). +5 a la CA e inmunidad a proyectil mágico hasta el inicio de tu turno.' },
    { level: 1, name: 'Falso vida', desc: 'Nigromancia. Ganas 1d4+4 PG temporales durante 1 hora.' },
    { level: 1, name: 'Grasa', desc: 'Conjuración. Terreno resbaladizo en un área de 3 m; las criaturas que fallen Destreza caen derribadas.' },
    { level: 1, name: 'Identificar', desc: 'Adivinación (Ritual). Determinas las propiedades mágicas de un objeto o conjuro activo.' },
    { level: 1, name: 'Imagen silenciosa', desc: 'Ilusionismo (Concentración). Creas una imagen tridimensional inmóvil a 18 m.' },
    { level: 1, name: 'Manos ardientes', desc: 'Evocación. Cono de fuego de 4,5 m que inflige 3d6 daño de fuego (Salvador Destreza mitad).' },
    { level: 1, name: 'Nube de oscurecimiento', desc: 'Conjuración (Concentración). Nube opaca en esfera de 6 m a 18 m durante 10 min.' },
    { level: 1, name: 'Proyectil mágico', desc: 'Evocación (Recomendado). Tres dardos infalibles de 1d4+1 daño de fuerza cada uno.' },
    { level: 1, name: 'Rayo de enfermedad', desc: 'Nigromancia. Ataque de conjuro; 2d8 daño veneno y envenenado (Salvador Constitución).' },
    { level: 1, name: 'Rociada de color', desc: 'Ilusionismo. Destello de luz que ciega criaturas en un cono de 4,5 m.' },
    { level: 1, name: 'Salto', desc: 'Transmutación. Triplica la distancia de salto de un objetivo durante 1 min.' },

    // Nivel 2
    { level: 2, name: 'Aura mágica de Nystul', desc: 'Ilusionismo. Oculta o falsifica el aura mágica de un objeto o criatura durante 24 h.' },
    { level: 2, name: 'Cerradura arcana', desc: 'Abjuración. Sella mágicamente una puerta o contenedor; solo tú puedes abrirlo.' },
    { level: 2, name: 'Contorno borroso', desc: 'Ilusionismo (Concentración). Tu cuerpo se vuelve borroso; los ataques contra ti tienen desventaja.' },
    { level: 2, name: 'Corona de locura', desc: 'Encantamiento (Concentración). Obliga a un humanoide a atacar a sus aliados.' },
    { level: 2, name: 'Detectar pensamientos', desc: 'Adivinación (Concentración). Lees los pensamientos superficiales de criaturas a 9 m.' },
    { level: 2, name: 'Flecha ácida de Melf', desc: 'Evocación. Proyectil de ácido; 4d4 daño más 2d4 al inicio de tu próximo turno.' },
    { level: 2, name: 'Fuerza fantasmal', desc: 'Ilusionismo (Concentración). Creas una ilusión que el objetivo cree real e inflige daño psíquico.' },
    { level: 2, name: 'Imagen múltiple', desc: 'Ilusionismo. Creas tres duplicados ilusorios que confunden los ataques enemigos.' },
    { level: 2, name: 'Invisibilidad', desc: 'Ilusionismo (Concentración). El objetivo se vuelve invisible hasta que ataque o lance un conjuro.' },
    { level: 2, name: 'Levitar', desc: 'Transmutación (Concentración). Eleva a un objetivo hasta 6 m verticalmente.' },
    { level: 2, name: 'Localizar objeto', desc: 'Adivinación (Concentración). Sientes la dirección de un objeto conocido a 300 m.' },
    { level: 2, name: 'Nube de dagas', desc: 'Conjuración (Concentración). Torbellino de dagas voladoras en cubo de 1,5 m; 4d4 daño cortante.' },
    { level: 2, name: 'Oscuridad', desc: 'Evocación (Concentración). Esfera de oscuridad mágica de 4,5 m de radio.' },
    { level: 2, name: 'Paso brumoso', desc: 'Conjuración (Acción adicional). Te teletransportas hasta 9 m a un espacio visible.' },
    { level: 2, name: 'Ráfaga de viento', desc: 'Evocación (Concentración). Viento fuerte de 18 m empuja a las criaturas y dispersa gases.' },
    { level: 2, name: 'Rayo abrasador', desc: 'Evocación. Disparas hasta tres rayos de fuego de 2d6 cada uno a 36 m.' },
    { level: 2, name: 'Rayo debilitador', desc: 'Nigromancia (Concentración). Ataque de conjuro; el objetivo causa la mitad de daño con armas de Fuerza.' },
    { level: 2, name: 'Sordera/ceguera', desc: 'Transmutación. Ciega o ensordece a un objetivo que falle salvación de Constitución.' },
    { level: 2, name: 'Sugerencia', desc: 'Encantamiento (Concentración). El objetivo sigue tu sugerencia si falla Sabiduría.' },
    { level: 2, name: 'Telaraña', desc: 'Conjuración (Concentración). Red pegajosa que restringe a las criaturas en un cubo de 6 m.' },
    { level: 2, name: 'Trepar cual arácnido', desc: 'Transmutación (Concentración). El objetivo gana velocidad de trepar igual a su velocidad caminar por 1 hora.' },
    { level: 2, name: 'Truco de la cuerda', desc: 'Transmutación. Cuerda vertical con abertura extradimensional oculta para hasta 8 criaturas.' },
    { level: 2, name: 'Ver invisibilidad', desc: 'Adivinación. Ves criaturas invisibles durante 1 hora.' },
    { level: 2, name: 'Vigor arcano', desc: 'Abjuración. Te da 2d12+4 puntos de golpe temporales por 1 hora.' },
    { level: 2, name: 'Visión en la oscuridad', desc: 'Transmutación. El objetivo ve en penumbra como luz brillante a 18 m durante 8 horas.' },

    // Nivel 3
    { level: 3, name: 'Acelerar', desc: 'Transmutación (Concentración). Dobla la velocidad, +2 CA, y da una acción adicional de ataque durante 1 min.' },
    { level: 3, name: 'Animar a los muertos', desc: 'Nigromancia. Creas un guerrero no muerto de un cadáver que controlas.' },
    { level: 3, name: 'Bola de fuego', desc: 'Evocación (Recomendado). Explosión en esfera de 6 m de radio; 8d6 daño de fuego.' },
    { level: 3, name: 'Círculo mágico', desc: 'Abjuración. Cilindro de energía de 3 m de radio que protege contra ciertos tipos de criaturas.' },
    { level: 3, name: 'Clarividencia', desc: 'Adivinación (Concentración). Sensor invisible para ver o escuchar un lugar a distancia.' },
    { level: 3, name: 'Contrahechizo', desc: 'Abjuración (Reacción). Interrumpe el conjuro que otra criatura está lanzando.' },
    { level: 3, name: 'Corcel fantasma', desc: 'Ilusionismo (Ritual). Convocas a un caballo de monta ilusorio y veloz durante 1 hora.' },
    { level: 3, name: 'Desplazamiento', desc: 'Ilusionismo (Concentración). Proyecta tu imagen a un lado; los atacantes tienen desventaja.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Termina conjuros activos en un objetivo.' },
    { level: 3, name: 'Don de lenguas', desc: 'Adivinación. El objetivo puede entender y ser entendido en cualquier idioma.' },
    { level: 3, name: 'Fingir muerte', desc: 'Nigromancia (Ritual). El objetivo parece muerto durante 1 hora; protegido contra hechizos.' },
    { level: 3, name: 'Forma gaseosa', desc: 'Transmutación (Concentración). Un objetivo se convierte en nube gaseosa con resistencias.' },
    { level: 3, name: 'Glifo custodio', desc: 'Abjuración (Ritual). Inscribes un glifo que lanza un conjuro de nivel ≤ 3 al activarse.' },
    { level: 3, name: 'Hablar con los muertos', desc: 'Nigromancia. Concedes vida temporal a un cadáver para hacerle hasta 5 preguntas.' },
    { level: 3, name: 'Imagen mayor', desc: 'Ilusionismo (Concentración). Ilusión realista de objeto, criatura o fenómeno con sonido.' },
    { level: 3, name: 'Imponer maldición', desc: 'Nigromancia (Concentración). Maldices a una criatura restando en tiradas o causando daño extra.' },
    { level: 3, name: 'Indetectable', desc: 'Abjuración. Un objetivo no puede ser detectado por magia de adivinación durante 24 horas.' },
    { level: 3, name: 'Invocar feérico', desc: 'Conjuración (Concentración). Convocas un espíritu feérico que lucha a tus órdenes.' },
    { level: 3, name: 'Invocar muerto viviente', desc: 'Nigromancia (Concentración). Convocas un espíritu no muerto que lucha a tu lado.' },
    { level: 3, name: 'Levantar maldición', desc: 'Abjuración. Termina con todas las maldiciones en una criatura u objeto tocado.' },
    { level: 3, name: 'Nube apestosa', desc: 'Conjuración (Concentración). Nube que hace que las criaturas que fallen Constitución pierdan su acción.' },
    { level: 3, name: 'Relámpago', desc: 'Evocación. Línea de relámpago de 30 m; 8d6 daño (Salvador Destreza mitad).' },
    { level: 3, name: 'Respirar bajo el agua', desc: 'Transmutación. Hasta 10 criaturas pueden respirar bajo el agua durante 24 horas.' },
    { level: 3, name: 'Volar', desc: 'Transmutación (Concentración). Otorga vuelo de 18 m durante 10 minutos.' },

    // Nivel 4
    { level: 4, name: 'Adivinación', desc: 'Adivinación (Ritual). Recibes presagio sobre el resultado de una acción en los próximos 7 días.' },
    { level: 4, name: 'Asesino fantasmal', desc: 'Ilusionismo (Concentración). Imagen aterradora solo para el objetivo; 4d10 daño psíquico.' },
    { level: 4, name: 'Cofre oculto de Leomund', desc: 'Conjuración. Cofre extradimensional al que solo tú accedes mediante una réplica miniatura.' },
    { level: 4, name: 'Confusión', desc: 'Encantamiento (Concentración). Las criaturas en 3 m actúan aleatoriamente.' },
    { level: 4, name: 'Conjurar elementales menores', desc: 'Conjuración (Concentración). Invocas espíritus elementales que dañan enemigos.' },
    { level: 4, name: 'Controlar agua', desc: 'Transmutación (Concentración). Manipulas agua: dividir, elevar o crear remolino.' },
    { level: 4, name: 'Destierro', desc: 'Abjuración (Concentración). Desplazas a una criatura a un semiplano o su plano de origen.' },
    { level: 4, name: 'Escudo de fuego', desc: 'Evocación. Te rodeas de llamas que te dan resistencia y dañan a atacantes.' },
    { level: 4, name: 'Esfera elástica de Otiluke', desc: 'Abjuración (Concentración). Esfera de fuerza de 3 m de diámetro que encierra a un objetivo.' },
    { level: 4, name: 'Esfera vitriólica', desc: 'Evocación. Explosión de ácido inflige 10d4 daño de ácido (y 5d4 el próximo turno).' },
    { level: 4, name: 'Fabricar', desc: 'Transmutación. Transformas materia prima en un objeto usando tu competencia en herramientas.' },
    { level: 4, name: 'Hechizar monstruo', desc: 'Encantamiento (Concentración). Hechizas a cualquier criatura si falla Sabiduría.' },
    { level: 4, name: 'Invisibilidad mejorada', desc: 'Ilusionismo (Concentración). El objetivo se vuelve invisible durante 1 minuto.' },
    { level: 4, name: 'Invocar aberración', desc: 'Conjuración (Concentración). Convocas una aberración con ataques de tentáculos o rayos oculares.' },
    { level: 4, name: 'Invocar autómata', desc: 'Conjuración (Concentración). Convocas un autómata metálico robusto que ataca a tu señal.' },
    { level: 4, name: 'Invocar elemental', desc: 'Conjuración (Concentración). Convocas un espíritu elemental con ataques de fuego, agua, tierra o aire.' },
    { level: 4, name: 'Localizar criatura', desc: 'Adivinación (Concentración). Detectas la presencia de un tipo de criatura a 300 m.' },
    { level: 4, name: 'Marchitar', desc: 'Nigromancia. Absorbe la humedad de una criatura, causando 8d8 daño necrótico.' },
    { level: 4, name: 'Mastín fiel de Mordenkainen', desc: 'Conjuración. Perro guardián invisible que vigila y muerde a intrusos (4d8 daño).' },
    { level: 4, name: 'Moldear la piedra', desc: 'Transmutación. Das una nueva forma a una piedra existente de tamaño mediano o menor.' },
    { level: 4, name: 'Muro de fuego', desc: 'Evocación (Concentración). Crea un muro de llamas que causa 5d8 daño de fuego a quienes lo crucen.' },
    { level: 4, name: 'Ojo arcano', desc: 'Adivinación (Concentración). Creas un ojo invisible flotante que puedes desplazar para explorar.' },
    { level: 4, name: 'Piel pétrea', desc: 'Transmutación (Concentración). Concedes resistencia al daño físico no mágico a una criatura.' },
    { level: 4, name: 'Polimorfar', desc: 'Transmutación (Concentración). Transforma una criatura en una bestia de CR igual o menor.' },
    { level: 4, name: 'Puerta dimensional', desc: 'Conjuración. Teletransportas a ti mismo y a un acompañante a cualquier lugar a 150 m.' },
    { level: 4, name: 'Sanctasanctórum privado de Mordenkainen', desc: 'Abjuración. Proteges un área contra sensores, teletransporte e intrusos.' },
    { level: 4, name: 'Tentáculos negros de Evard', desc: 'Conjuración (Concentración). Tentáculos pegajosos que agarran y dañan (3d6) en un área.' },
    { level: 4, name: 'Terreno alucinatorio', desc: 'Ilusionismo. Haces que un terreno natural parezca, suene y huela como otro distinto.' },
    { level: 4, name: 'Tormenta de hielo', desc: 'Evocación. Cilindro de granizo y frío; 2d8 contundente + 4d6 frío.' },

    // Nivel 5
    { level: 5, name: 'Alterar los recuerdos', desc: 'Encantamiento (Concentración). Modificas la memoria reciente de una criatura.' },
    { level: 5, name: 'Animar objetos', desc: 'Transmutación (Concentración). Animas hasta 10 objetos no mágicos que atacan como tus aliados.' },
    { level: 5, name: 'Apariencia', desc: 'Ilusionismo. Altera la apariencia física de cualquier número de criaturas.' },
    { level: 5, name: 'Atadura planar', desc: 'Abjuración. Obliga a un celestial, elemental, feérico o fiordo a servirte.' },
    { level: 5, name: 'Círculo de poder', desc: 'Abjuración (Concentración). Esfera de 9 m protege a tus aliados contra efectos mágicos.' },
    { level: 5, name: 'Círculo de teletransportación', desc: 'Conjuración. Abre un portal hacia un círculo de teletransportación permanente.' },
    { level: 5, name: 'Conjurar elemental', desc: 'Conjuración (Concentración). Convocas un elemental mayor.' },
    { level: 5, name: 'Cono de frío', desc: 'Evocación. Cono de 18 m de frío; 8d8 daño de frío.' },
    { level: 5, name: 'Conocer las leyendas', desc: 'Adivinación. Conoces historias/leyendas de una persona, lugar u objeto.' },
    { level: 5, name: 'Contactar con otro plano', desc: 'Adivinación. Haces hasta 5 preguntas a una entidad planar de forma mental.' },
    { level: 5, name: 'Creación', desc: 'Ilusionismo. Creas una copia de materia no viva de hasta 5 pies cúbicos.' },
    { level: 5, name: 'Dominar persona', desc: 'Encantamiento (Concentración). Controlas a un humanoide que falle Sabiduría.' },
    { level: 5, name: 'Engañar', desc: 'Ilusionismo (Concentración). Te vuelves invisible y creas un doble ilusorio activo.' },
    { level: 5, name: 'Enlace telepático de Rary', desc: 'Adivinación (Ritual). Enlace mental para comunicarse sin importar distancia.' },
    { level: 5, name: 'Ensueño', desc: 'Ilusionismo. Envías un mensajero a los sueños de una criatura para conversar.' },
    { level: 5, name: 'Escudriñar', desc: 'Adivinación (Concentración). Ves y oyes a un objetivo lejano a través de un sensor mágico.' },
    { level: 5, name: 'Estática sináptica', desc: 'Encantamiento. Daño psíquico en esfera de 6 m; 8d6 y los afectados restan 1d6 a sus ataques.' },
    { level: 5, name: 'Geas', desc: 'Encantamiento. Mandato mágico obliga a criatura a seguir tus órdenes.' },
    { level: 5, name: 'Golpe de viento acerado', desc: 'Conjuración. Te teletransportas atacando a hasta cinco objetivos por 6d10 daño de fuerza.' },
    { level: 5, name: 'Inmovilizar monstruo', desc: 'Encantamiento (Concentración). Paraliza a cualquier criatura si falla Sabiduría.' },
    { level: 5, name: 'Invocar dragón', desc: 'Conjuración (Concentración). Convocas un espíritu de dragón menor que ataca con su aliento.' },
    { level: 5, name: 'Mano de Bigby', desc: 'Evocación (Concentración). Mano de fuerza gigante que ataca o bloquea.' },
    { level: 5, name: 'Muro de fuerza', desc: 'Evocación (Concentración). Barrera invisible de fuerza indestructible.' },
    { level: 5, name: 'Muro de piedra', desc: 'Evocación (Concentración). Creas un muro de piedra sólido que puede volverse permanente.' },
    { level: 5, name: 'Nube aniquiladora', desc: 'Conjuración (Concentración). Nube de gas ácido verde que causa 10d8 daño ácido.' },
    { level: 5, name: 'Pasamuros', desc: 'Transmutación. Abre un pasaje temporal de hasta 6 m de profundidad en una pared.' },
    { level: 5, name: 'Presencia regia de Yolande', desc: 'Encantamiento (Concentración). Emanación derriba a tus enemigos e inflige daño radiante.' },
    { level: 5, name: 'Telequinesis', desc: 'Transmutación (Concentración). Mueves o levantas mentalmente criaturas u objetos pesados.' },
    { level: 5, name: 'Tormenta resplandeciente de Jallarzi', desc: 'Evocación (Concentración). Tormenta causa daño radiante y silencia a lanzadores.' },

    // Nivel 6
    { level: 6, name: 'Baile irresistible de Otto', desc: 'Encantamiento (Concentración). El objetivo baila incontrolablemente, perdiendo ataques y CA.' },
    { level: 6, name: 'Caldero burbujeante de Tasha', desc: 'Conjuración. Convocas un caldero mágico para crear pociones y vapores dañinos.' },
    { level: 6, name: 'Círculo de muerte', desc: 'Nigromancia. Explosión de energía necrótica causa 8d6 daño en esfera de 18 m de radio.' },
    { level: 6, name: 'Contingencia', desc: 'Abjuración. Preparas un conjuro para que se active automáticamente al cumplirse una condición.' },
    { level: 6, name: 'Crear muerto viviente', desc: 'Nigromancia. Creas guls bajo tu control a partir de cadáveres.' },
    { level: 6, name: 'De la carne a la piedra', desc: 'Transmutación (Concentración). Petrificas gradualmente a una criatura si falla salvaciones.' },
    { level: 6, name: 'Desintegrar', desc: 'Transmutación. Rayo desintegrador inflige 10d6+40 de daño por fuerza; reduce a polvo al morir.' },
    { level: 6, name: 'Esfera congelante de Otiluke', desc: 'Evocación. Esfera de frío estalla infligiendo 10d6 daño de frío en área grande.' },
    { level: 6, name: 'Globo de invulnerabilidad', desc: 'Abjuración (Concentración). Barrera móvil bloquea todos los conjuros de nivel 5 o inferior.' },
    { level: 6, name: 'Guardas y guardias', desc: 'Abjuración. Protege un área con niebla, cerraduras mágicas y efectos ilusorios.' },
    { level: 6, name: 'Ilusión programada', desc: 'Ilusionismo. Crea una ilusión realista que se activa ante un detonante específico.' },
    { level: 6, name: 'Invocación instantánea de Drawmij', desc: 'Conjuración (Ritual). Teletransporta un objeto marcado directamente a tu mano.' },
    { level: 6, name: 'Invocar infernal', desc: 'Conjuración (Concentración). Convocas un diablo o demonio para luchar por ti.' },
    { level: 6, name: 'Mal de ojo', desc: 'Nigromancia (Concentración). Tu mirada asusta, duerme o debilita a criaturas.' },
    { level: 6, name: 'Mover la tierra', desc: 'Transmutación (Concentración). Modificas la topografía de tierra o arena en un área.' },
    { level: 6, name: 'Muro de hielo', desc: 'Evocación (Concentración). Creas una barrera de hielo que daña a quienes la crucen.' },
    { level: 6, name: 'Puerto arcano', desc: 'Conjuración. Crea un portal temporal entre dos localizaciones conocidas.' },
    { level: 6, name: 'Rayo solar', desc: 'Evocación (Concentración). Haz de luz solar inflige 6d8 daño radiante y ciega en una línea.' },
    { level: 6, name: 'Relámpago en cadena', desc: 'Evocación. Disparas un relámpago que salta a hasta cuatro objetivos por 10d8 daño.' },
    { level: 6, name: 'Sugestión en masa', desc: 'Encantamiento. Sugieres una línea de conducta a hasta 12 criaturas por 24 horas.' },
    { level: 6, name: 'Urna mágica', desc: 'Nigromancia. Transfieres tu alma a una gema y puedes poseer cuerpos ajenos.' },
    { level: 6, name: 'Visión veraz', desc: 'Adivinación. Ves la realidad: lo invisible, ilusiones y el plano etéreo por 1 hora.' },

    // Nivel 7
    { level: 7, name: 'Bola de fuego de explosión retardada', desc: 'Evocación (Concentración). Bola de fuego que acumula daño por ronda (12d6 base).' },
    { level: 7, name: 'Dedo de la muerte', desc: 'Nigromancia. Inflige 7d8+30 daño necrótico; si el objetivo muere, se levanta como zombi fiel.' },
    { level: 7, name: 'Desplazamiento entre planos', desc: 'Conjuración. Transporta a hasta 8 criaturas voluntarias a otro plano de existencia.' },
    { level: 7, name: 'Espada de Mordenkainen', desc: 'Evocación (Concentración). Espada flotante de fuerza ataca infligiendo 3d10 daño por fuerza.' },
    { level: 7, name: 'Espejismo arcano', desc: 'Ilusionismo. Altera la apariencia y geografía de un área de 1.5 km permanentemente.' },
    { level: 7, name: 'Excursión etérea', desc: 'Conjuración. Entras al Plano Etéreo para moverte a través de objetos del plano material.' },
    { level: 7, name: 'Invertir la gravedad', desc: 'Transmutación (Concentración). Invierte la gravedad en un cilindro, elevando a criaturas al cielo.' },
    { level: 7, name: 'Jaula de fuerza', desc: 'Evocación. Crea una jaula o caja invisible de fuerza indestructible que atrapa criaturas.' },
    { level: 7, name: 'Mansión magnífica de Mordenkainen', desc: 'Conjuración. Abre un portal hacia una mansión extradimensional con comida y sirvientes.' },
    { level: 7, name: 'Proyectar imagen', desc: 'Ilusionismo (Concentración). Proyectas un duplicado de ti mismo que puede ver, oír y hablar.' },
    { level: 7, name: 'Recluir', desc: 'Transmutación. Envías a un objetivo a un estado de animación suspendida e invisible.' },
    { level: 7, name: 'Rociada prismática', desc: 'Evocación. Ocho rayos de luz de colores infligen daño elemental o estados negativos.' },
    { level: 7, name: 'Símbolo', desc: 'Abjuración. Inscribes una runa dañina que aplica efectos nocivos al ser leída o activada.' },
    { level: 7, name: 'Simulacro', desc: 'Ilusionismo. Creas un duplicado de hielo de una criatura con la mitad de sus HP.' },
    { level: 7, name: 'Teletransporte', desc: 'Conjuración. Teletransporta instantáneamente a tu grupo a cualquier lugar del mismo plano.' },

    // Nivel 8
    { level: 8, name: 'Antipatía/simpatía', desc: 'Encantamiento. Atrae o repele a un tipo de criatura hacia un objeto o área.' },
    { level: 8, name: 'Campo antimagia', desc: 'Abjuración (Concentración). Esfera de 3 m de radio suprime toda magia en su interior.' },
    { level: 8, name: 'Clon', desc: 'Nigromancia. Creas un duplicado inerte de una criatura; tu alma se transfiere a él si mueres.' },
    { level: 8, name: 'Controlar el clima', desc: 'Transmutación (Concentración). Cambias la temperatura, viento y precipitación exterior.' },
    { level: 8, name: 'Dominar monstruo', desc: 'Encantamiento (Concentración). Tomas el control mental absoluto de cualquier criatura.' },
    { level: 8, name: 'Explosión solar', desc: 'Evocación. Destello de luz solar causa 12d6 daño radiante y ceguera permanente en área grande.' },
    { level: 8, name: 'Laberinto', desc: 'Conjuración (Concentración). Destierras a una criatura a un laberinto extradimensional.' },
    { level: 8, name: 'Mente en blanco', desc: 'Abjuración. Inmuniza al objetivo contra daño psíquico, detección y lectura de mente.' },
    { level: 8, name: 'Nube incendiaria', desc: 'Conjuración (Concentración). Nube de humo ardiente causa 10d8 daño de fuego por ronda.' },
    { level: 8, name: 'Ofuscación', desc: 'Encantamiento. Vuelves invisible e indetectable a una criatura durante 8 horas.' },
    { level: 8, name: 'Palabra de poder: aturdir', desc: 'Encantamiento. Aturde instantáneamente a una criatura si tiene 150 HP o menos.' },
    { level: 8, name: 'Semiplano', desc: 'Conjuración. Abre un portal de 12 metros a un semiplano de piedra vacío creado por ti.' },
    { level: 8, name: 'Telepatía', desc: 'Adivinación. Crea un enlace mental bidireccional ilimitado con una criatura que conozcas.' },

    // Nivel 9
    { level: 9, name: 'Cambiar de forma', desc: 'Transmutación (Concentración). Te transformas en cualquier criatura de tu CR o inferior.' },
    { level: 9, name: 'Cautiverio', desc: 'Abjuración. Aprisiona a una criatura bajo tierra, en una gema o en cadenas de forma permanente.' },
    { level: 9, name: 'Deseo', desc: 'Conjuración. El conjuro más poderoso; puede duplicar cualquier hechizo de nivel 8 o inferior o pedir deseos.' },
    { level: 9, name: 'Muro prismático', desc: 'Abjuración. Crea una barrera multicolor de 7 capas protectoras que dañan a atacantes.' },
    { level: 9, name: 'Palabra de poder: matar', desc: 'Encantamiento. Mata instantáneamente a una criatura si tiene 100 HP o menos.' },
    { level: 9, name: 'Parar el tiempo', desc: 'Transmutación. Detiene el tiempo para los demás durante 1d4+1 rondas.' },
    { level: 9, name: 'Polimorfar verdadero', desc: 'Transmutación (Concentración). Transforma una criatura en otra de forma permanente.' },
    { level: 9, name: 'Portal', desc: 'Conjuración (Concentración). Abre un portal interplanar hacia un lugar específico o una criatura.' },
    { level: 9, name: 'Presciencia', desc: 'Adivinación. Otorga ventaja en todas las tiradas y desventaja a tus atacantes por 8 horas.' },
    { level: 9, name: 'Proyección astral', desc: 'Nigromancia. Proyectas tu cuerpo astral al Plano Astral, dejando tu cuerpo físico.' },
    { level: 9, name: 'Terror abyecto', desc: 'Ilusionismo (Concentración). Creas una pesadilla viviente que incapacita a todos tus enemigos.' },
    { level: 9, name: 'Tormenta de meteoritos', desc: 'Evocación. Lluvia de meteoros inflige 20d6 daño de fuego y 20d6 daño contundente.' }
  ];

  bardCantripsList = [
    { name: 'Amistad', desc: 'Encantamiento. Otorga ventaja en pruebas de Carisma contra un humanoide no hostil (Concentración).' },
    { name: 'Burla dañina', desc: 'Encantamiento (Recomendado). Causa 1d4 daño psíquico y desventaja en la próxima tirada de ataque del objetivo.' },
    { name: 'Guardia de cuchillas', desc: 'Abjuración. Obtienes resistencia contra daño contundente, perforante y cortante de ataques con armas.' },
    { name: 'Ilusión menor', desc: 'Ilusionismo. Creas una imagen o sonido menor en un punto a tu alcance durante 1 minuto.' },
    { name: 'Impacto certero', desc: 'Adivinación. Obtienes ventaja en tu próxima tirada de ataque contra un objetivo a tu alcance.' },
    { name: 'Luces danzantes', desc: 'Ilusionismo (Recomendado). Creas hasta cuatro luces flotantes que puedes mover como acción adicional (Concentración).' },
    { name: 'Luz', desc: 'Evocación. Hace que un objeto emita luz brillante en un radio de 6 m.' },
    { name: 'Mano de mago', desc: 'Conjuración. Creas una mano espectral invisible o visible para manipular objetos a 9 m.' },
    { name: 'Mensaje', desc: 'Transmutación. Envías un mensaje susurrado a una criatura a 36 m que puede responderte en secreto.' },
    { name: 'Prestidigitación', desc: 'Transmutación. Realizas trucos de magia menores (limpiar, calentar, colorear objetos, encender velas).' },
    { name: 'Reparar', desc: 'Transmutación. Reparas una única rotura o fisura en un objeto de menos de 30 cm.' },
    { name: 'Tronar', desc: 'Evocación. Creas un estallido de sonido que causa 1d6 daño de trueno y empuja 3 m.' },
    { name: 'Voluta estelar', desc: 'Evocación. Creas un destello de luz estelar que causa 1d4 daño radiante y evita que el objetivo use reacciones.' }
  ];

  bardSpellsList = [
    // Nivel 1
    { level: 1, name: 'Caída de pluma', desc: 'Transmutación. Reduce la velocidad de caída de hasta 5 criaturas a 18 m; sufren 0 daño al caer.' },
    { level: 1, name: 'Curar heridas', desc: 'Abjuración. Cura 1d8 + modificador de Carisma a una criatura al tocarla.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación. Percibes la presencia de magia y su escuela a 9 m (Concentración, Ritual).' },
    { level: 1, name: 'Disfrazarse', desc: 'Ilusionismo. Cambias tu apariencia física (ropa, estatura, rasgos) durante 1 hora.' },
    { level: 1, name: 'Dormir', desc: 'Encantamiento. Duermes a criaturas en un área basadas en una tirada de 5d8 puntos de golpe totales.' },
    { level: 1, name: 'Encantar animal', desc: 'Encantamiento. Convence a una bestia de que no eres una amenaza (Concentración).' },
    { level: 1, name: 'Entender idiomas', desc: 'Adivinación. Entiendes el significado literal de cualquier idioma hablado o escrito (Ritual).' },
    { level: 1, name: 'Fuego feérico', desc: 'Evocación. Otorga ventaja en tiradas de ataque contra objetivos en el área (Concentración).' },
    { level: 1, name: 'Hablar con los animales', desc: 'Adivinación. Obtienes la capacidad de comunicarte verbalmente con bestias durante 10 minutos (Ritual).' },
    { level: 1, name: 'Hechizar persona', desc: 'Encantamiento (Recomendado). Encanta a un humanoide a 9 m; te ve como un conocido amistoso.' },
    { level: 1, name: 'Heroísmo', desc: 'Encantamiento. Otorga inmunidad al miedo y puntos de golpe temporales iguales a tu mod. Carisma (Concentración).' },
    { level: 1, name: 'Identificar', desc: 'Adivinación. Conoces las propiedades mágicas, maldiciones y usos de un objeto al tocarlo (Ritual).' },
    { level: 1, name: 'Imagen silenciosa', desc: 'Ilusionismo. Creas la imagen visual de un objeto o criatura en un cubo de 4.5 m (Concentración).' },
    { level: 1, name: 'Ola atronadora', desc: 'Evocación. Ola de fuerza que causa 2d8 daño de trueno y empuja 3 m en un cubo de 4.5 m.' },
    { level: 1, name: 'Orden imperiosa', desc: 'Encantamiento. Das una orden de una sola palabra que el objetivo debe obedecer.' },
    { level: 1, name: 'Palabra de curación', desc: 'Abjuración (Recomendado). Acción adicional. Cura 1d4 + modificador de Carisma a una criatura a 18 m.' },
    { level: 1, name: 'Perdición', desc: 'Encantamiento. Hasta 3 criaturas restan 1d4 a sus tiradas de ataque y salvación (Concentración).' },
    { level: 1, name: 'Risa horrible de Tasha', desc: 'Encantamiento. Hace que una criatura caiga al suelo propensa e incapacitada por la risa (Concentración).' },
    { level: 1, name: 'Rociada de color', desc: 'Ilusionismo (Recomendado). Ciega a criaturas en un cono de 4.5 m basadas en una tirada de 6d10 puntos de golpe.' },
    { level: 1, name: 'Sirviente invisible', desc: 'Conjuración. Crea una fuerza invisible e informe que realiza tareas sencillas a tus órdenes (Ritual).' },
    { level: 1, name: 'Susurros discordantes', desc: 'Encantamiento (Recomendado). Causa 3d6 daño psíquico y obliga al objetivo a huir usando su reacción.' },
    { level: 1, name: 'Texto ilusorio', desc: 'Ilusionismo. Escribes un mensaje ocultando su verdadero significado con magia (Ritual).' },
    { level: 1, name: 'Zancada prodigiosa', desc: 'Transmutación. Aumenta la velocidad de movimiento de una criatura en 3 m durante 1 hora.' },
 
    // Nivel 2
    { level: 2, name: 'Abrir', desc: 'Transmutación. Abre una puerta o cofre cerrado con llave o magia.' },
    { level: 2, name: 'Agrandar/reducir', desc: 'Transmutación. Duplica o reduce el tamaño de una criatura/objeto (Concentración).' },
    { level: 2, name: 'Auxilio', desc: 'Abjuración. Aumenta HP máximo y HP actual de 3 aliados en 5.' },
    { level: 2, name: 'Boca mágica', desc: 'Ilusionismo. Objeto repite un mensaje prefijado al cumplirse un activador (Ritual).' },
    { level: 2, name: 'Calentar metal', desc: 'Transmutación. Calienta metal causando 2d8 daño ígneo al portador (Concentración).' },
    { level: 2, name: 'Calmar emociones', desc: 'Encantamiento. Suprime miedo/encanto o apacigua hostilidad (Concentración).' },
    { level: 2, name: 'Corona de la locura', desc: 'Encantamiento. Obliga a humanoide a atacar a sus aliados (Concentración).' },
    { level: 2, name: 'Detectar pensamientos', desc: 'Adivinación. Lees pensamientos superficiales de criaturas a 9 m (Concentración).' },
    { level: 2, name: 'Embelesar', desc: 'Encantamiento. Distrae a criaturas para que tengan desventaja en Percepción.' },
    { level: 2, name: 'Fuerza fantasmal', desc: 'Ilusionismo. Creas una ilusión mental que inflige daño psíquico (Concentración).' },
    { level: 2, name: 'Hacer añicos', desc: 'Evocación. Estallido sonoro que causa 3d8 daño de trueno en área.' },
    { level: 2, name: 'Imagen múltiple', desc: 'Ilusionismo. Creas 3 duplicados ilusorios de ti para desviar ataques.' },
    { level: 2, name: 'Inmovilizar persona', desc: 'Encantamiento. Paraliza a un humanoide a 18 m (Concentración).' },
    { level: 2, name: 'Invisibilidad', desc: 'Ilusionismo. Vuelves invisible a una criatura al tocarla (Concentración).' },
    { level: 2, name: 'Localizar animales o plantas', desc: 'Adivinación. Conoces dirección/distancia de una especie a 8 km (Ritual).' },
    { level: 2, name: 'Localizar objeto', desc: 'Adivinación. Sientes dirección de un objeto conocido a 300 m (Concentración).' },
    { level: 2, name: 'Mensajero animal', desc: 'Encantamiento. Envías a un animal pequeño a entregar un mensaje (Ritual).' },
    { level: 2, name: 'Nube de dagas', desc: 'Conjuración. Cubo de dagas giratorias causa 4d4 daño cortante (Concentración).' },
    { level: 2, name: 'Potenciar característica', desc: 'Transmutación. Otorga ventaja en pruebas de una característica elegida (Concentración).' },
    { level: 2, name: 'Restablecimiento menor', desc: 'Abjuración. Cura ceguera, sordera, parálisis o envenenamiento.' },
    { level: 2, name: 'Silencio', desc: 'Ilusionismo. Inmuniza contra sonido en esfera de 6m (Concentración, Ritual).' },
    { level: 2, name: 'Sordera/ceguera', desc: 'Transmutación. Ciega o ensordece a un objetivo a 9 m.' },
    { level: 2, name: 'Sugestión', desc: 'Encantamiento. Influyes en una criatura con orden razonable por 8h (Concentración).' },
    { level: 2, name: 'Ver invisibilidad', desc: 'Adivinación. Ves criaturas y objetos invisibles o en el plano Etereo.' },
    { level: 2, name: 'Zona de la verdad', desc: 'Encantamiento. Impide mentir en una esfera de 4.5 m.' },
 
    // Nivel 3
    { level: 3, name: 'Clarividencia', desc: 'Adivinación. Creas un sensor para oír o ver un punto lejano (Concentración).' },
    { level: 3, name: 'Crecimiento vegetal', desc: 'Transmutación. Llena de vegetación un área haciendo el terreno muy difícil.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Termina efectos de conjuros activos en un objetivo.' },
    { level: 3, name: 'Don de lenguas', desc: 'Adivinación. Permite entender y hablar cualquier idioma por 1 hora.' },
    { level: 3, name: 'Fingir muerte', desc: 'Nigromancia. Pone a criatura en estado cataléptico de muerte simulada (Ritual).' },
    { level: 3, name: 'Glifo custodio', desc: 'Abjuración. Inscribe runa explosiva o cargada con un conjuro.' },
    { level: 3, name: 'Hablar con las plantas', desc: 'Transmutación. Te comunicas con plantas y las interrogas.' },
    { level: 3, name: 'Hablar con los muertos', desc: 'Nigromancia. Concedes vida temporal a un cadáver para hacerle 5 preguntas.' },
    { level: 3, name: 'Imagen mayor', desc: 'Ilusionismo. Creas ilusión compleja con sonido, olor y temperatura (Concentración).' },
    { level: 3, name: 'Imponer maldición', desc: 'Nigromancia. Maldices a criatura restando tiradas o causando daño (Concentración).' },
    { level: 3, name: 'Indetectable', desc: 'Abjuración. Oculta de sensores de adivinación y escudriñamiento.' },
    { level: 3, name: 'Nube apestosa', desc: 'Conjuración. Nube de gas que asquea e incapacita a criaturas (Concentración).' },
    { level: 3, name: 'Palabra de curación en masa', desc: 'Abjuración. Cura 1d4 + mod Carisma a hasta 6 criaturas.' },
    { level: 3, name: 'Patrón hipnótico', desc: 'Ilusionismo. Patrón de luces que incapacita y paraliza (Concentración).' },
    { level: 3, name: 'Pequeña choza de Leomund', desc: 'Evocación. Cúpula de fuerza protectora de 3 m de radio (Ritual).' },
    { level: 3, name: 'Ralentizar', desc: 'Transmutación. Altera tiempo reduciendo CA, velocidad y reacciones de 6 enemigos (Concentración).' },
    { level: 3, name: 'Recado', desc: 'Adivinación. Envías un mensaje mental a cualquier distancia y recibes respuesta.' },
    { level: 3, name: 'Terror', desc: 'Ilusionismo. Creas una imagen terrorífica que hace huir a enemigos (Concentración).' },
 
    // Nivel 4
    { level: 4, name: 'Asesino fantasmal', desc: 'Ilusionismo. Ilusión terrorífica inflige 4d10 daño psíquico por turno (Concentración).' },
    { level: 4, name: 'Compulsión', desc: 'Encantamiento. Obliga a enemigos elegidos a moverse en la dirección que indiques (Concentración).' },
    { level: 4, name: 'Confusión', desc: 'Encantamiento. Confunde a criaturas haciéndolas actuar erráticamente (Concentración).' },
    { level: 4, name: 'Fuente de luz lunar', desc: 'Evocación. Crea luz brillante, inflige daño radiante y te vuelve invisible (Concentración).' },
    { level: 4, name: 'Hechizar monstruo', desc: 'Encantamiento. Encanta a una criatura a 9 m; te ve como aliado amistoso.' },
    { level: 4, name: 'Invisibilidad mejorada', desc: 'Ilusionismo. Vuelve invisible a criatura incluso si ataca o lanza conjuros (Concentración).' },
    { level: 4, name: 'Libertad de movimiento', desc: 'Abjuración. Ignora terreno difícil, parálisis y ataduras.' },
    { level: 4, name: 'Localizar criatura', desc: 'Adivinación. Siente dirección de criatura conocida a 300 m (Concentración).' },
    { level: 4, name: 'Polimorfar', desc: 'Transmutación. Transforma a criatura en una bestia (Concentración).' },
    { level: 4, name: 'Puerta dimensional', desc: 'Conjuración. Te teletransporta a ti y un aliado a cualquier punto a 150 m.' },
    { level: 4, name: 'Terreno alucinatorio', desc: 'Ilusionismo. Hace que un terreno parezca, suene y huela diferente.' },
 
    // Nivel 5
    { level: 5, name: 'Alterar los recuerdos', desc: 'Encantamiento. Modificas la memoria reciente de una criatura (Concentración).' },
    { level: 5, name: 'Alzar a los muertos', desc: 'Nigromancia. Devuelve a la vida a un cadáver muerto hace menos de 10 días.' },
    { level: 5, name: 'Animar objetos', desc: 'Transmutación. Das vida y controlas a hasta 10 objetos no mágicos (Concentración).' },
    { level: 5, name: 'Apariencia', desc: 'Ilusionismo. Altera la apariencia física de cualquier número de criaturas.' },
    { level: 5, name: 'Atadura planar', desc: 'Abjuración. Obliga a un celestial, elemental, feérico o fiordo a servirte.' },
    { level: 5, name: 'Círculo de teletransportación', desc: 'Conjuración. Crea portal de 1 turno hacia un círculo permanente.' },
    { level: 5, name: 'Conocer las leyendas', desc: 'Adivinación. Conoces historias/leyendas de una persona, lugar u objeto.' },
    { level: 5, name: 'Curar heridas en masa', desc: 'Abjuración. Cura 3d8 + mod Carisma a hasta 6 aliados a 9 m.' },
    { level: 5, name: 'Despertar', desc: 'Transmutación. Concede intelecto humano y lenguaje a una planta o bestia.' },
    { level: 5, name: 'Dominar persona', desc: 'Encantamiento. Tomas el control telepático completo de un humanoide (Concentración).' },
    { level: 5, name: 'Engañar', desc: 'Ilusionismo. Te vuelves invisible y creas un doble ilusorio activo (Concentración).' },
    { level: 5, name: 'Enlace telepático de Rary', desc: 'Adivinación. Enlace mental para comunicarse sin importar distancia (Ritual).' },
    { level: 5, name: 'Ensueño', desc: 'Ilusionismo. Envías un mensajero a los sueños de una criatura para conversar.' },
    { level: 5, name: 'Escudriñar', desc: 'Adivinación. Ves y oyes a un objetivo lejano a través de un sensor mágico (Concentración).' },
    { level: 5, name: 'Estática sináptica', desc: 'Encantamiento. Explosión mental causa 8d6 daño psíquico y resta 1d6 a tiradas.' },
    { level: 5, name: 'Geas', desc: 'Encantamiento. Ordenas a criatura cumplir una misión bajo pena de daño psíquico.' },
    { level: 5, name: 'Inmovilizar monstruo', desc: 'Encantamiento. Paraliza a cualquier tipo de criatura a 27 m (Concentración).' },
    { level: 5, name: 'Presencia regia de Yolande', desc: 'Encantamiento. Emanación de 9 m derriba e inflige daño radiante a enemigos (Concentración).' },
    { level: 5, name: 'Restablecimiento mayor', desc: 'Abjuración. Cura fatiga, petrificación, maldiciones o reducciones de stats.' },
 
    // Nivel 6
    { level: 6, name: 'Baile irresistible de Otto', desc: 'Encantamiento. Criatura baila incontrolablemente, perdiendo ataques/CA (Concentración).' },
    { level: 6, name: 'Encontrar el camino', desc: 'Adivinación. Conoces ruta más corta hacia una localización conocida (Concentración).' },
    { level: 6, name: 'Festín de héroes', desc: 'Conjuración. Banquete otorga inmunidad a veneno/miedo y +2d10 HP max.' },
    { level: 6, name: 'Guardas y guardias', desc: 'Abjuración. Protege área con niebla, cerraduras mágicas y escaleras bloqueadas.' },
    { level: 6, name: 'Ilusión programada', desc: 'Ilusionismo. Creas una ilusión de 5 minutos al activarse un detonante.' },
    { level: 6, name: 'Mal de ojo', desc: 'Nigromancia. Tu mirada asusta, duerme o reduce velocidad de objetivos (Concentración).' },
    { level: 6, name: 'Sugestión en masa', desc: 'Encantamiento. Sugieres una orden razonable a hasta 12 criaturas por 24h.' },
    { level: 6, name: 'Visión veraz', desc: 'Adivinación. Otorga visión verdadera para ver lo invisible.' },
 
    // Nivel 7
    { level: 7, name: 'Espada de Mordenkainen', desc: 'Evocación. Creas espada flotante que ataca (Concentración).' },
    { level: 7, name: 'Espejismo arcano', desc: 'Ilusionismo. Altera completamente el aspecto físico de un área de 1.5 km.' },
    { level: 7, name: 'Excursión etérea', desc: 'Conjuración. Entras en el Plano Etereo para moverte a través de objetos.' },
    { level: 7, name: 'Jaula de fuerza', desc: 'Evocación. Encierra a criaturas en una jaula o caja de fuerza indestructible.' },
    { level: 7, name: 'Mansión magnífica de Mordenkainen', desc: 'Conjuración. Crea un refugio extradimensional con sirvientes y comida.' },
    { level: 7, name: 'Palabra de poder: fortalecer', desc: 'Encantamiento. Otorga 150 pg temporales a hasta 6 aliados.' },
    { level: 7, name: 'Proyectar imagen', desc: 'Ilusionismo. Proyectas una copia de ti mismo que puede ver y hablar (Concentración).' },
    { level: 7, name: 'Regenerar', desc: 'Transmutación. Regenera HP y extremidades amputadas de una criatura.' },
    { level: 7, name: 'Resurrección', desc: 'Nigromancia. Resucita a un cadáver muerto hace menos de un siglo.' },
    { level: 7, name: 'Rociada prismática', desc: 'Evocación. Rayos de colores causan daño elemental y estados negativos.' },
    { level: 7, name: 'Símbolo', desc: 'Abjuración. Inscribe runa que aplica efectos fatales al activarse.' },
    { level: 7, name: 'Teletransporte', desc: 'Conjuración. Te teletransporta instantáneamente a ti y aliados.' },
 
    // Nivel 8
    { level: 8, name: 'Antipatía/simpatía', desc: 'Encantamiento. Atrae o repele a especies específicas hacia un objeto.' },
    { level: 8, name: 'Dominar monstruo', desc: 'Encantamiento. Tomas el control telepático completo de cualquier criatura (Concentración).' },
    { level: 8, name: 'Labia', desc: 'Encantamiento. Cualquier tirada de Engaño/Persuasión inferior a 15 se convierte en 15.' },
    { level: 8, name: 'Mente en blanco', desc: 'Abjuración. Inmuniza contra daño psíquico, lectura de mente y estados mentales.' },
    { level: 8, name: 'Ofuscación', desc: 'Encantamiento. Vuelve invisible e indetectable a criatura.' },
    { level: 8, name: 'Palabra de poder: aturdir', desc: 'Encantamiento. Aturde instantáneamente a criatura con menos de 150 pg.' },
 
    // Nivel 9
    { level: 9, name: 'Muro prismático', desc: 'Abjuración. Muro multicolor de 7 capas que bloquea todo ataque y causa daño.' },
    { level: 9, name: 'Palabra de poder: matar', desc: 'Encantamiento. Mata instantáneamente a criatura con 100 pg o menos.' },
    { level: 9, name: 'Palabra de poder: sanar', desc: 'Encantamiento. Sana por completo todos los pg de criatura.' },
    { level: 9, name: 'Polimorfar verdadero', desc: 'Transmutación. Transforma permanentemente criatura en otra criatura o en objeto (Concentración).' },
    { level: 9, name: 'Presencia', desc: 'Adivinación. Concedes ventaja en ataques/salvaciones y desventaja a tus atacantes.' }
  ];
 
  warlockCantripsList = [
    { name: 'Descarga sobrenatural', desc: 'Evocación. Rayo de energía que inflige 1d10 de daño de fuerza (36 m).' },
    { name: 'Prestidigitación', desc: 'Transmutación. Realizas trucos mágicos menores e inofensivos.' },
    { name: 'Ilusión menor', desc: 'Ilusionismo. Creas una imagen o sonido menor (9 m).' },
    { name: 'Toque helado', desc: 'Nigromancia. Mano esquelética inflige 1d8 de daño necrótico y evita curación.' },
    { name: 'Mano de mago', desc: 'Conjuración. Creas una mano espectral flotante para manipular objetos.' },
    { name: 'Guardia de cuchillas', desc: 'Abjuración. Obtienes resistencia contra daño físico de armas.' }
  ];

  warlockSpellsList = [
    // Nivel 1
    { level: 1, name: 'Maleficio', desc: 'Encantamiento. Infliges 1d6 de daño necrótico extra al objetivo y le das desventaja en una característica (Concentración).' },
    { level: 1, name: 'Hechizar persona', desc: 'Encantamiento. Encanta a un humanoide a 9 m; te ve como un conocido amistoso.' },
    { level: 1, name: 'Armadura de Agathys', desc: 'Abjuración. Ganas 5 HP temporales y si te golpean cuerpo a cuerpo, inflige 5 de daño de frío.' },
    { level: 1, name: 'Reprensión infernal', desc: 'Evocación. Reacción al recibir daño; rodea al atacante en llamas infligiendo 2d10 de daño de fuego.' },
    { level: 1, name: 'Brazos de Hadar', desc: 'Conjuración. Tentáculos oscuros infligen 2d6 de daño de fuerza y evitan reacciones.' },
    // Nivel 2
    { level: 2, name: 'Paso brumoso', desc: 'Conjuración. Teletransportación instantánea hasta 9 m como acción adicional.' },
    { level: 2, name: 'Invisibilidad', desc: 'Ilusionismo. Vuelves invisible a una criatura al tocarla (Concentración).' },
    { level: 2, name: 'Sugestión', desc: 'Encantamiento. Sugieres un curso de acción razonable a una criatura; lo sigue durante 8 horas (Concentración).' },
    // Nivel 3
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Termina efectos de conjuro en un objetivo o área.' },
    { level: 3, name: 'Volar', desc: 'Transmutación. Concede velocidad de vuelo de 18 m a una criatura (Concentración).' },
    { level: 3, name: 'Hambre de Hadar', desc: 'Conjuración. Esfera de oscuridad que inflige daño de frío y ácido, y causa ceguera.' },
    // Nivel 4
    { level: 4, name: 'Desterrar', desc: 'Abjuración. Envía temporalmente a una criatura a otro plano de existencia (Concentración).' },
    { name: 'Puerta dimensional', level: 4, desc: 'Conjuración. Teletransporta a ti y a un aliado hasta 150 m.' },
    // Nivel 5
    { level: 5, name: 'Retener monstruo', desc: 'Encantamiento. Paraliza a cualquier criatura que falle salvación de Sabiduría (Concentración).' },
    { level: 5, name: 'Comunión con la naturaleza', desc: 'Adivinación. Obtienes conocimiento espiritual del entorno (Ritual).' }
  ];

  warlockInvocationsList = [
    { name: 'Armadura de sombras', req: 'Nivel 1', desc: 'Puedes lanzar armadura de mago sobre ti mismo a voluntad sin gastar espacio de conjuro.' },
    { name: 'Castigo arcano', req: 'Nivel 5, Pacto del filo', desc: 'Al golpear con tu arma de pacto, puedes gastar espacio de conjuro para causar 1d8 daño de fuerza por nivel y derribar.' },
    { name: 'Descarga agónica', req: 'Nivel 2', desc: 'Sumas tu modificador de Carisma a las tiradas de daño de tu Descarga Sobrenatural.' },
    { name: 'Descarga ahuyentadora', req: 'Nivel 2', desc: 'Cuando aciertas con tu Descarga Sobrenatural, puedes empujar a la criatura hasta 3 metros en línea recta.' },
    { name: 'Devorador de vida', req: 'Nivel 9, Pacto del filo', desc: 'Al golpear con tu arma de pacto, causas daño necrótico adicional igual a tu modificador de Carisma.' },
    { name: 'Don de las profundidades', req: 'Nivel 5', desc: 'Puedes respirar bajo el agua y obtienes una velocidad de nado igual a tu velocidad de caminar.' },
    { name: 'Don de los protectores', req: 'Nivel 9, Pacto del grimorio', desc: 'Una criatura cuyo nombre figure en tu grimorio y caiga a 0 HP, cae a 1 HP en su lugar.' },
    { name: 'Filo sediento', req: 'Nivel 5, Pacto del filo', desc: 'Puedes realizar dos ataques con tu arma de pacto en lugar de uno cuando usas la acción de atacar.' },
    { name: 'Hoja devoradora', req: 'Nivel 12, Pacto del filo', desc: 'Puedes realizar tres ataques con tu arma de pacto en lugar de uno cuando usas la acción de atacar.' },
    { name: 'Inversión del amo de las cadenas', req: 'Nivel 5, Pacto de la cadena', desc: 'Tu familiar ataca como acción adicional, tiene resistencia a daño y puedes hacer que use tu CD de salvación.' },
    { name: 'Lanza sobrenatural', req: 'Nivel 1', desc: 'Cuando lanzas Descarga Sobrenatural, su alcance aumenta a 90 metros.' },
    { name: 'Lecciones de los primeros', req: 'Nivel 2', desc: 'Obtienes una dote de nivel 1 de tu elección de entre las dotes de origen.' },
    { name: 'Maestro de las formas innumerables', req: 'Nivel 5', desc: 'Puedes lanzar alterar el propio aspecto a voluntad sin gastar espacio de conjuro.' },
    { name: 'Máscara de los mil rostros', req: 'Nivel 2', desc: 'Puedes lanzar disfrazarse a voluntad sin gastar espacio de conjuro.' },
    { name: 'Mente sobrenatural', req: 'Nivel 1', desc: 'Tienes ventaja en las tiradas de salvación de Constitución para mantener la concentración.' },
    { name: 'Mirada de las dos mentes', req: 'Nivel 5', desc: 'Acción para percibir a través de los sentidos de un humanoide voluntario y poder lanzar conjuros desde su posición.' },
    { name: 'Pacto de la cadena', req: 'Nivel 1', desc: 'Puedes lanzar encontrar familiar como acción de magia sin gastar espacio de conjuro para invocar familiares especiales.' },
    { name: 'Pacto del filo', req: 'Nivel 1', desc: 'Conjuras en tu mano un arma de pacto cuerpo a cuerpo sencilla o marcial. Atacas y dañas usando tu Carisma.' },
    { name: 'Pacto del grimorio', req: 'Nivel 1', desc: 'Conjuras un Libro de las Sombras con 3 trucos y 2 conjuros rituales de nivel 1 de cualquier clase.' },
    { name: 'Paso ascendente', req: 'Nivel 5', desc: 'Puedes lanzar levitar sobre ti mismo a voluntad sin gastar espacio de conjuro.' },
    { name: 'Salto sobrenatural', req: 'Nivel 2', desc: 'Puedes lanzar salto sobre ti mismo a voluntad sin gastar espacio de conjuro.' },
    { name: 'Susurros del sepulcro', req: 'Nivel 7', desc: 'Puedes lanzar hablar con los muertos a voluntad sin gastar espacio de conjuro.' },
    { name: 'Uno con las sombras', req: 'Nivel 5', desc: 'En luz tenue u oscuridad, puedes usar tu acción para volverte invisible hasta que te muevas o actúes.' },
    { name: 'Vigor infernal', req: 'Nivel 2', desc: 'Puedes lanzar falsa vida sobre ti a voluntad sin gastar espacio de conjuro.' },
    { name: 'Visión bruja', req: 'Nivel 15', desc: 'Puedes ver la verdadera forma de cualquier criatura oculta por magia a 9 metros.' },
    { name: 'Visiones brumosas', req: 'Nivel 2', desc: 'Puedes lanzar imagen silenciosa a voluntad sin gastar espacio de conjuro.' },
    { name: 'Visiones de reinos remotos', req: 'Nivel 9', desc: 'Puedes lanzar ojo arcano a voluntad sin gastar espacio de conjuro.' },
    { name: 'Vista del diablo', req: 'Nivel 2', desc: 'Puedes ver normalmente en la oscuridad tanto mágica como no mágica a una distancia de 36 metros.' }
  ];

  clericCantripsList = [
    { name: 'Guía', desc: 'Adivinación (Concentración). Otorga +1d4 a una prueba de característica.' },
    { name: 'Llama sagrada', desc: 'Evocación. Llama descendente inflige 1d8 daño radiante a un objetivo.' },
    { name: 'Luz', desc: 'Evocación. Objeto emite luz brillante en 6 m y tenue otros 6 m.' },
    { name: 'Palabra de resplandor', desc: 'Evocación. Explosión de luz radiante causa 1d6 de daño a enemigos cercanos.' },
    { name: 'Piedad con los moribundos', desc: 'Nigromancia. Estabiliza a una criatura moribunda con 0 puntos de golpe.' },
    { name: 'Reparar', desc: 'Transmutación. Reparas una única rotura o fisura de hasta 30 cm en un objeto.' },
    { name: 'Resistencia', desc: 'Abjuración (Concentración). Aliado gana +1d4 en su próxima tirada de salvación.' },
    { name: 'Tañido por los muertos', desc: 'Nigromancia. Tañido causa 1d8 daño de necro (o 1d12 si no tiene todos los HP).' },
    { name: 'Taumaturgia', desc: 'Transmutación. Manifestaciones divinas menores (cambiar ojos, voz alta, abrir puertas).' }
  ];

  clericSpellsList = [
    // Nivel 1
    { level: 1, name: 'Bendición', desc: 'Encantamiento (Concentración). Hasta tres criaturas suman 1d4 a tiradas de ataque y salvación.' },
    { level: 1, name: 'Crear o destruir agua', desc: 'Transmutación. Crea o destruye hasta 40 litros de agua en recipientes o lluvia.' },
    { level: 1, name: 'Curar heridas', desc: 'Abjuración. Sana a una criatura tocada por valor de 2d8 + modificador de Sabiduría.' },
    { level: 1, name: 'Detectar el bien y el mal', desc: 'Adivinación (Concentración). Conoces presencia de celestiales, fiadores, muertos vivientes, etc.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación (Ritual). Percibes la presencia de auras mágicas a 9 metros.' },
    { level: 1, name: 'Detectar venenos y enfermedades', desc: 'Adivinación (Ritual). Detectas veneno, criaturas venenosas y enfermedades a 9 m.' },
    { level: 1, name: 'Escudo de fe', desc: 'Abjuración (Concentración). Otorga +2 a la Clase de Armadura de un aliado a 18 m.' },
    { level: 1, name: 'Infligir heridas', desc: 'Nigromancia. Ataque de conjuro cuerpo a cuerpo causa 3d10 daño necrótico.' },
    { level: 1, name: 'Orden imperiosa', desc: 'Encantamiento. Ordenas a un objetivo obedecer un comando de una palabra (Huye, Suelta, etc.).' },
    { level: 1, name: 'Palabra de curación', desc: 'Abjuración. Sana a un aliado visible a 18 m por 1d8 + modificador de Sabiduría.' },
    { level: 1, name: 'Perdición', desc: 'Encantamiento (Concentración). Hasta tres criaturas restan 1d4 a ataques y salvaciones.' },
    { level: 1, name: 'Protección contra el bien y el mal', desc: 'Abjuración (Concentración). Protege contra aberraciones, celestiales, elementales, etc.' },
    { level: 1, name: 'Purificar comida y bebida', desc: 'Transmutación (Ritual). Comida y bebida no mágica queda libre de veneno y enfermedad.' },
    { level: 1, name: 'Saeta guía', desc: 'Evocación. Rayo inflige 4d6 daño radiante; próximo ataque contra él tiene ventaja.' },
    { level: 1, name: 'Santuario', desc: 'Abjuración. Protege a criatura elegida; atacantes deben superar salvación de Sabiduría.' },

    // Nivel 2
    { level: 2, name: 'Arma espiritual', desc: 'Evocación. Creas un arma flotante que ataca como acción adicional causando 1d8 + mod Sab.' },
    { level: 2, name: 'Augurio', desc: 'Adivinación (Ritual). Indagas si una acción próxima traerá buenos o malos resultados.' },
    { level: 2, name: 'Auxilio', desc: 'Abjuración. Aumenta el HP máximo y actual de tres criaturas en 5 durante 8 horas.' },
    { level: 2, name: 'Calmar emociones', desc: 'Encantamiento (Concentración). Calma emociones de humanoides en radio de 6 m.' },
    { level: 2, name: 'Detectar trampas', desc: 'Adivinación. Detectas la presencia de cualquier trampa a 36 metros en tu línea de visión.' },
    { level: 2, name: 'Dulce descanso', desc: 'Nigromancia (Ritual). Impide que cadáver sea convertido en no-muerto o empiece a descomponerse.' },
    { level: 2, name: 'Inmovilizar persona', desc: 'Encantamiento (Concentración). Paraliza a un humanoide que falle salvación de Sabiduría.' },
    { level: 2, name: 'Llama permanente', desc: 'Evocación. Antorcha sin calor que brilla indefinidamente sin combustible.' },
    { level: 2, name: 'Localizar objeto', desc: 'Adivinación (Concentración). Sientes la dirección en la que está un objeto conocido a 110 m.' },
    { level: 2, name: 'Plegaria de curación', desc: 'Abjuración. Cura a hasta seis criaturas aliadas que puedas ver por 2d8 + mod Sab.' },
    { level: 2, name: 'Potenciar característica', desc: 'Transmutación (Concentración). Otorga ventaja en pruebas de un atributo elegido.' },
    { level: 2, name: 'Protección contra veneno', desc: 'Abjuración. Otorga resistencia a veneno y neutraliza venenos activos.' },
    { level: 2, name: 'Restablecimiento menor', desc: 'Abjuración. Cura ceguedad, sordera, parálisis o envenenamiento.' },
    { level: 2, name: 'Silencio', desc: 'Ilusionismo (Ritual). Crea esfera de 6m de radio donde no se puede emitir ningún sonido.' },
    { level: 2, name: 'Sordera/ceguera', desc: 'Transmutación. Ciega o ensordece a un enemigo que falle salvación de Constitución.' },
    { level: 2, name: 'Vínculo protector', desc: 'Abjuración. Proteges a un aliado; ganas resistencia a todo daño pero sufres su mismo daño.' },
    { level: 2, name: 'Zona de la verdad', desc: 'Encantamiento. Criaturas en esfera de 4.5m no pueden decir mentiras deliberadas.' },

    // Nivel 3
    { level: 3, name: 'Animar a los muertos', desc: 'Nigromancia. Convierte un montón de huesos o cadáver en un esqueleto o zombi a tu servicio.' },
    { level: 3, name: 'Aura de vitalidad', desc: 'Abjuración (Concentración). Aura cura 2d6 HP a un aliado a tu elección como acción adicional.' },
    { level: 3, name: 'Caminar sobre el agua', desc: 'Transmutación (Ritual). Permite caminar sobre agua, barro, nieve o lava a diez criaturas.' },
    { level: 3, name: 'Círculo mágico', desc: 'Abjuración. Crea cilindro de energía que contiene o excluye a tipos de criaturas elegidas.' },
    { level: 3, name: 'Clarividencia', desc: 'Adivinación (Concentración). Sensor te permite ver u oír un punto elegido a distancia.' },
    { level: 3, name: 'Crear comida y agua', desc: 'Conjuración. Crea 20 kilos de comida y 110 litros de agua limpia.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Cancela conjuros o efectos mágicos activos de nivel 3 o inferior.' },
    { level: 3, name: 'Don de lenguas', desc: 'Adivinación. Criatura comprende y habla cualquier idioma de forma fluida.' },
    { level: 3, name: 'Espíritus guardianes', desc: 'Conjuración (Concentración). Espíritus giran a tu alrededor dañando y ralentizando enemigos a 4.5 m.' },
    { level: 3, name: 'Fingir muerte', desc: 'Nigromancia (Ritual). Pon en estado cataléptico a un aliado simulando muerte perfecta.' },
    { level: 3, name: 'Fundirse con la piedra', desc: 'Transmutación (Ritual). Te introduces físicamente en un bloque de piedra sólido.' },
    { level: 3, name: 'Glifo custodio', desc: 'Abjuración. Inscribe runa que detona con daño o conjuro al ser cruzada o activada.' },
    { level: 3, name: 'Hablar con los muertos', desc: 'Nigromancia. Haces hasta 5 preguntas al cadáver de una criatura.' },
    { level: 3, name: 'Imponer maldición', desc: 'Nigromancia (Concentración). Maldices a un objetivo para mermar sus pruebas, ataques o salvaciones.' },
    { level: 3, name: 'Levantar maldición', desc: 'Abjuración. Retira todas las maldiciones activas que afecten a la criatura u objeto tocado.' },
    { level: 3, name: 'Luz del día', desc: 'Evocación. Esfera de 18 m emite luz brillante equivalente a la luz solar.' },
    { level: 3, name: 'Palabra de curación en masa', desc: 'Abjuración. Sana a hasta seis criaturas visibles a 18 m por 1d4 + mod Sab de forma instantánea.' },
    { level: 3, name: 'Protección contra energía', desc: 'Abjuración (Concentración). Otorga resistencia a ácido, frío, fuego, rayo o trueno.' },
    { level: 3, name: 'Recado', desc: 'Adivinación. Envías un mensaje telepático breve a una criatura y recibes respuesta.' },
    { level: 3, name: 'Revivir', desc: 'Nigromancia. Devuelve la vida a una criatura muerta en el último minuto con 1 HP.' },
    { level: 3, name: 'Señal de esperanza', desc: 'Abjuración (Concentración). Aliados curan el máximo posible y tienen ventaja en salvaciones de Sabiduría.' },

    // Nivel 4
    { level: 4, name: 'Adivinación', desc: 'Adivinación (Ritual). Preguntas a tu deidad sobre una actividad futura específica en los próximos 7 días.' },
    { level: 4, name: 'Aura de pureza', desc: 'Abjuración (Concentración). Aura protege de venenos, enfermedades y condiciones cegado, hechizado, asustado.' },
    { level: 4, name: 'Aura de vida', desc: 'Abjuración (Concentración). Aliados a 9 m recuperan 1 HP si caen a 0 al inicio de su turno.' },
    { level: 4, name: 'Controlar agua', desc: 'Transmutación (Concentración). Manipulas masas de agua libre (inundar, dividir, remolino).' },
    { level: 4, name: 'Destierro', desc: 'Abjuración (Concentración). Envías a una criatura a otro plano de existencia temporal o permanentemente.' },
    { level: 4, name: 'Guarda contra la muerte', desc: 'Abjuración. Si la criatura cae a 0 HP, en su lugar se mantiene con 1 HP por primera vez.' },
    { level: 4, name: 'Guardián de la fe', desc: 'Conjuración. Guardián inmóvil ataca a enemigos cercanos infligiendo daño radiante.' },
    { level: 4, name: 'Libertad de movimiento', desc: 'Abjuración. Ignoras terreno difícil, parálisis, constricciones mágicas y no puedes ser apresado.' },
    { level: 4, name: 'Localizar criatura', desc: 'Adivinación (Concentración). Sientes la dirección en la que está una criatura conocida a 90 m.' },
    { level: 4, name: 'Moldear la piedra', desc: 'Transmutación. Modificas la forma de un bloque de piedra a tu elección (crear pasaje, armas, etc.).' },

    // Nivel 5
    { level: 5, name: 'Alzar a los muertos', desc: 'Nigromancia. Resucita a criatura muerta en los últimos 10 días (con penalizador de -4 a tiradas).' },
    { level: 5, name: 'Atadura planar', desc: 'Abjuración. Fuerza a un celestial, elemental, feérico o fiador a servirte durante 24 horas.' },
{ level: 5, name: 'Círculo de poder', desc: 'Abjuración (Concentración). Aura otorga ventaja en tiradas de salvación contra conjuros mágicos.' },
    { level: 5, name: 'Comunión', desc: 'Adivinación (Ritual). Haces tres preguntas de Sí o No directamente a tu deidad.' },
    { level: 5, name: 'Conocer las leyendas', desc: 'Adivinación. Obtienes un resumen de mitos, leyendas o rumores de una persona, lugar u objeto histórico.' },
    { level: 5, name: 'Consagrar', desc: 'Abjuración. Consagra un área impidiendo la entrada de celestiales/fiadores y bendice el terreno.' },
    { level: 5, name: 'Contagio', desc: 'Nigromancia. Tu golpe transmite una enfermedad debilitante al objetivo (ceguera, fiebre, etc.).' },
    { level: 5, name: 'Curar heridas en masa', desc: 'Abjuración. Cura a hasta seis criaturas aliadas por valor de 3d8 + mod Sab.' },
    { level: 5, name: 'Disipar el bien y el mal', desc: 'Abjuración (Concentración). Te protege de aberraciones, celestiales, elementales, etc.' },
    { level: 5, name: 'Escudriñar', desc: 'Adivinación (Concentración). Ves y oyes a una criatura lejana; requiere salvación de Sabiduría.' },
    { level: 5, name: 'Geas', desc: 'Encantamiento. Mandato mágico que obliga a una criatura a obedecerte bajo castigo de daño psíquico.' },
    { level: 5, name: 'Golpe flamígero', desc: 'Evocación. Columna de fuego inflige 4d6 daño de fuego y 4d6 daño radiante en radio de 3 m.' },
    { level: 5, name: 'Invocar celestial', desc: 'Conjuración (Concentración). Invocas a un espíritu celestial para luchar en combate.' },
    { level: 5, name: 'Plaga de insectos', desc: 'Conjuración (Concentración). Esfera de langostas muerde e inflige 4d10 daño perforante.' },
    { level: 5, name: 'Restablecimiento mayor', desc: 'Abjuración. Reduce cansancio, elimina petrificación, maldición, encanto o reducción de atributo.' }
  ];

  selectedDruidPrimalOrder: string = '';
  selectedDruidCantrips: string[] = ['Crear llama', 'Saber druídico'];
  selectedDruidSpells: string[] = ['Curar heridas', 'Encantar animal', 'Fuego feérico', 'Ola atronadora'];

  druidCantripsList = [
    { name: 'Crear llama', desc: 'Conjuración (Recomendado). Llama en tu mano que da luz o arrojas para hacer 1d8 daño de fuego.' },
    { name: 'Elementalismo', desc: 'Transmutación. Creas un efecto elemental inofensivo menor (brisa, chispa, lodo, vapor).' },
    { name: 'Guía', desc: 'Adivinación (Concentración). Criatura sumará +1d4 a una prueba de característica.' },
    { name: 'Látigo de espinas', desc: 'Transmutación. Ataque cuerpo a cuerpo a 9 m inflige 1d6 daño perforante y acerca 3 m.' },
    { name: 'Mensaje', desc: 'Transmutación. Envías un susurro secreto a un objetivo a 36 m.' },
    { name: 'Piedad con los moribundos', desc: 'Nigromancia. Estabilizas a una criatura moribunda al tocarla.' },
    { name: 'Reparar', desc: 'Transmutación. Reparas una única rotura o fisura de hasta 30 cm en un objeto.' },
    { name: 'Resistencia', desc: 'Abjuración (Concentración). Aliado sumará +1d4 a su próxima tirada de salvación.' },
    { name: 'Rociada venenosa', desc: 'Nigromancia. Genera una bocanada de gas tóxico que inflige 1d12 daño de veneno.' },
    { name: 'Saber druídico', desc: 'Transmutación (Recomendado). Creas un efecto natural menor o predices el tiempo.' },
    { name: 'Shillelagh', desc: 'Transmutación. Imbuye tu bastón o garrote para usar Sabiduría en ataque e infligir 1d8 daño de fuerza.' },
    { name: 'Tronar', desc: 'Evocación. Onda sonora inflige 1d6 daño de trueno y empuja 3 m.' },
    { name: 'Voluta estelar', desc: 'Evocación. Destello de luz radiante causa 1d4 daño radiante y evita reacciones.' }
  ];

  druidSpellsList = [
    // Nivel 1
    { level: 1, name: 'Buenas bayas', desc: 'Conjuración. Creas 10 bayas mágicas; cada una sana 1 pg y alimenta por un día.' },
    { level: 1, name: 'Crear o destruir agua', desc: 'Transmutación. Crea o destruye hasta 40 litros de agua en recipientes o lluvia.' },
    { level: 1, name: 'Cuchillo de hielo', desc: 'Conjuración. Cuchillo inflige 1d10 daño perforante y explota causando 2d6 daño de frío en área.' },
    { level: 1, name: 'Curar heridas', desc: 'Abjuración (Recomendado). Sana a una criatura tocada por valor de 2d8 + modificador de Sabiduría.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación (Ritual). Percibes la presencia de auras mágicas a 9 metros.' },
    { level: 1, name: 'Detectar venenos y enfermedades', desc: 'Adivinación (Ritual). Detectas veneno, criaturas venenosas y enfermedades a 9 m.' },
    { level: 1, name: 'Encantar animal', desc: 'Encantamiento (Recomendado, Concentración). Convence a una bestia de que no eres una amenaza.' },
    { level: 1, name: 'Enmarañar', desc: 'Conjuración (Concentración). Plantas enredan y retienen a criaturas en un área.' },
    { level: 1, name: 'Fuego feérico', desc: 'Evocación (Recomendado, Concentración). Luz de color rodea objetivos dando ventaja al atacarlos.' },
    { level: 1, name: 'Hablar con los animales', desc: 'Adivinación (Ritual). Te comunicas verbalmente con bestias por 10 minutos.' },
    { level: 1, name: 'Hechizar persona', desc: 'Encantamiento. Hace que una criatura que falle salvación te considere un conocido amistoso.' },
    { level: 1, name: 'Nube de oscurecimiento', desc: 'Conjuración (Concentración). Nube densa que bloquea totalmente la visión.' },
    { level: 1, name: 'Ola atronadora', desc: 'Evocación (Recomendado). Onda de choque inflige 2d8 daño de trueno y empuja 3 m.' },
    { level: 1, name: 'Palabra de curación', desc: 'Abjuración. Sana a un aliado visible a 18 m por 1d8 + modificador de Sabiduría.' },
    { level: 1, name: 'Protección contra el bien y el mal', desc: 'Abjuración (Concentración). Protege contra aberraciones, celestiales, elementales, etc.' },
    { level: 1, name: 'Purificar comida y bebida', desc: 'Transmutación (Ritual). Comida y bebida no mágica queda libre de veneno y enfermedad.' },
    { level: 1, name: 'Salto', desc: 'Transmutación. Triplica la distancia de salto de una criatura por 1 minuto.' },
    { level: 1, name: 'Zancada prodigiosa', desc: 'Transmutación. Aumenta la velocidad de movimiento de una criatura en 3 m por 1 hora.' }
  ];

  sorcererSpellsList = [
    // Trucos (Nivel 0)
    { level: 0, name: 'Agarre electrizante', desc: 'Evocación. Canalizas electricidad; causa 1d8 daño eléctrico y quita la reacción del objetivo.' },
    { level: 0, name: 'Amistad', desc: 'Encantamiento (Concentración). Ventaja en pruebas de Carisma contra un humanoide no hostil.' },
    { level: 0, name: 'Descarga de fuego', desc: 'Evocación. Lanzas una chispa de fuego que causa 1d10 daño ígneo al acertar.' },
    { level: 0, name: 'Elementalismo', desc: 'Transmutación. Creas efectos elementales menores como brisas, polvo, chispas o vapor.' },
    { level: 0, name: 'Estallido mágico', desc: 'Evocación. Lanzas rayo de magia pura; inflige 1d6 daño elemental (ácido, frío, fuego, rayo, veneno o trueno). Si sacas un 6, explota.' },
    { level: 0, name: 'Fragmento mental', desc: 'Encantamiento. Causa 1d6 daño psíquico y resta 1d4 a la próxima salvación del objetivo.' },
    { level: 0, name: 'Guardia de cuchillas', desc: 'Abjuración. Obtienes resistencia contra daño contundente, perforante y cortante de ataques con armas.' },
    { level: 0, name: 'Ilusión menor', desc: 'Ilusionismo. Creas una imagen o sonido menor en un punto a tu alcance por 1 minuto.' },
    { level: 0, name: 'Impacto certero', desc: 'Adivinación. Obtienes ventaja en tu próxima tirada de ataque contra un objetivo a tu alcance.' },
    { level: 0, name: 'Luces danzantes', desc: 'Ilusionismo (Concentración). Creas hasta cuatro luces flotantes que puedes mover.' },
    { level: 0, name: 'Luz', desc: 'Evocación. Hace que un objeto emita luz brillante en un radio de 6 metros.' },
    { level: 0, name: 'Mano de mago', desc: 'Conjuración. Creas una mano espectral invisible/visible para manipular objetos a 9 m.' },
    { level: 0, name: 'Mensaje', desc: 'Transmutación. Envías un mensaje susurrado a una criatura a 36 m que puede responder en secreto.' },
    { level: 0, name: 'Prestidigitación', desc: 'Transmutación. Realizas trucos de magia menores e inofensivos (limpiar, calentar, etc.).' },
    { level: 0, name: 'Rayo de escarcha', desc: 'Evocación. Causa 1d8 daño de frío y reduce la velocidad del objetivo en 3 m.' },
    { level: 0, name: 'Reparar', desc: 'Transmutación. Reparas una única rotura o fisura en un objeto de menos de 30 cm.' },
    { level: 0, name: 'Rociada venenosa', desc: 'Nigromancia. Proyectas una bocanada de gas nocivo que causa 1d12 daño de veneno.' },
    { level: 0, name: 'Salpicadura de ácido', desc: 'Conjuración. Lanzas burbuja de ácido que hace 1d6 daño a una o dos criaturas juntas.' },
    { level: 0, name: 'Toque helado', desc: 'Nigromancia. Mano espectral causa 1d8 daño necrótico y evita que el objetivo se cure.' },
    { level: 0, name: 'Tronar', desc: 'Evocación. Onda de sonido causa 1d6 daño de trueno y empuja 3 m si fallan salvación.' },

    // Nivel 1
    { level: 1, name: 'Armadura de mago', desc: 'Abjuración. CA del objetivo sin armadura pasa a ser 13 + Mod. Destreza por 8 horas.' },
    { level: 1, name: 'Caída de pluma', desc: 'Transmutación. Reacción. Ralentiza la caída de hasta 5 criaturas; sufren 0 daño al caer.' },
    { level: 1, name: 'Cuchillo de hielo', desc: 'Conjuración. Cuchillo inflige 1d10 daño perforante y explota causando 2d6 daño de frío en área.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación (Ritual, Concentración). Sientes la presencia de auras mágicas a 9 metros.' },
    { level: 1, name: 'Disfrazarse', desc: 'Ilusionismo. Cambias tu apariencia física y ropa temporalmente por 1 hora.' },
    { level: 1, name: 'Dormir', desc: 'Encantamiento. Sumes a criaturas en un letargo mágico según una tirada de 5d8.' },
    { level: 1, name: 'Entender idiomas', desc: 'Adivinación (Ritual). Comprendes cualquier idioma hablado o escrito que escuches o toques.' },
    { level: 1, name: 'Escudo', desc: 'Abjuración. Reacción. Sumas +5 a tu CA y eres inmune a Proyectil mágico por 1 turno.' },
    { level: 1, name: 'Falsa vida', desc: 'Nigromancia. Obtienes 1d4+4 puntos de golpe temporales por 1 hora.' },
    { level: 1, name: 'Grasa', desc: 'Conjuración. Suelo resbaladizo derriba a criaturas que fallen salvación de Destreza.' },
    { level: 1, name: 'Hechizar persona', desc: 'Encantamiento. Hace que una criatura que falle salvación te considere un conocido amistoso.' },
    { level: 1, name: 'Imagen silenciosa', desc: 'Ilusionismo (Concentración). Creas una ilusión visual de una criatura u objeto de tamaño mediano.' },
    { level: 1, name: 'Manos ardientes', desc: 'Evocación. Cono de llamas que causa 3d6 daño de fuego a quienes fallen salvación.' },
    { level: 1, name: 'Nube de oscurecimiento', desc: 'Conjuración (Concentración). Nube densa que bloquea totalmente la visión por 10 min.' },
    { level: 1, name: 'Ola atronadora', desc: 'Evocación. Onda de choque inflige 2d8 daño de trueno y empuja a objetivos a 3 m.' },
    { level: 1, name: 'Orbe cromático', desc: 'Evocación. Lanzas orbe elemental que inflige 3d8 de daño del tipo elemental que elijas.' },
    { level: 1, name: 'Proyectil mágico', desc: 'Evocación. Tres dardos que aciertan automáticamente infligiendo 1d4+1 daño de fuerza.' },
    { level: 1, name: 'Rayo de hechicería', desc: 'Evocación (Concentración). Rayo inflige 1d12 daño de rayo; puedes repetir daño usando tu acción.' },
    { level: 1, name: 'Rayo nauseabundo', desc: 'Nigromancia. Rayo causa 2d8 daño de veneno y envenena si fallan salvación.' },
    { level: 1, name: 'Retirada expeditiva', desc: 'Transmutación (Concentración). Acción adicional. Permite correr/destrabarse.' },
    { level: 1, name: 'Rociada de color', desc: 'Ilusionismo. Ráfaga de luz brillante que ciega a criaturas según sus pg.' },
    { level: 1, name: 'Salto', desc: 'Transmutación. Triplica la distancia de salto de una criatura por 1 minuto.' },

    // Nivel 2
    { level: 2, name: 'Abrir', desc: 'Transmutación. Abre una puerta, cofre o cerradura cerrada mágica o físicamente.' },
    { level: 2, name: 'Agrandar/reducir', desc: 'Transmutación (Concentración). Duplica o reduce a la mitad el tamaño y peso de una criatura.' },
    { level: 2, name: 'Aliento de dragón', desc: 'Transmutación (Concentración). Exhalas cono de daño elemental que causa 3d6 en cada turno.' },
    { level: 2, name: 'Alterar el propio aspecto', desc: 'Transmutación (Concentración). Cambias tu fisionomía, adaptas branquias o garras.' },
    { level: 2, name: 'Arma mágica', desc: 'Transmutación (Concentración). Arma no mágica obtiene +1 en tiradas de ataque y daño.' },
    { level: 2, name: 'Clavo mental', desc: 'Adivinación (Concentración). Flecha psíquica inflige 3d6 daño y rastreas la ubicación del objetivo.' },
    { level: 2, name: 'Contorno borroso', desc: 'Ilusionismo (Concentración). Tu cuerpo se vuelve borroso; ataques contra ti tienen desventaja.' },
    { level: 2, name: 'Corona de la locura', desc: 'Encantamiento (Concentración). Fuerza a un humanoide a atacar a sus aliados en cada turno.' },
    { level: 2, name: 'Detectar pensamientos', desc: 'Adivinación (Concentración). Lees pensamientos superficiales y profundos de criaturas a 9 m.' },
    { level: 2, name: 'Esfera de llamas', desc: 'Evocación (Concentración). Crea esfera de fuego rodante que inflige 2d6 daño en área.' },
    { level: 2, name: 'Fuerza fantasmal', desc: 'Ilusionismo (Concentración). Crea ilusión mental tan realista que causa 1d6 daño psíquico.' },
    { level: 2, name: 'Hacer añicos', desc: 'Evocación. Estallido sonoro que causa 3d8 daño de trueno en una esfera de 3 m.' },
    { level: 2, name: 'Hoja de fuego', desc: 'Evocación (Concentración). Creas una espada de fuego que causa 3d6 daño ígneo al golpear.' },
    { level: 2, name: 'Imagen múltiple', desc: 'Ilusionismo. Creas tres duplicados ilusorios de ti para desviar los ataques.' },
    { level: 2, name: 'Inmovilizar persona', desc: 'Encantamiento (Concentración). Paraliza a un humanoide visible a 18 m.' },
    { level: 2, name: 'Invisibilidad', desc: 'Ilusionismo (Concentración). Una criatura elegida se vuelve invisible durante 1 hora.' },
    { level: 2, name: 'Levitar', desc: 'Transmutación (Concentración). Eleva al objetivo verticalmente hasta 6 metros.' },
    { level: 2, name: 'Nube de dagas', desc: 'Conjuración (Concentración). Cubo de dagas giratorias causa 4d4 daño cortante en área.' },
    { level: 2, name: 'Oscuridad', desc: 'Evocación (Concentración). Crea una esfera de 4.5 m de oscuridad mágica que bloquea visión.' },
    { level: 2, name: 'Paso brumoso', desc: 'Conjuración. Acción adicional. Te teletransportas hasta 9 metros a un lugar visible.' },
    { level: 2, name: 'Potenciar característica', desc: 'Transmutación (Concentración). Otorga ventaja en pruebas de una característica elegida.' },
    { level: 2, name: 'Ráfaga de viento', desc: 'Evocación (Concentración). Línea de viento fuerte empuja a criaturas y apaga fuegos.' },
    { level: 2, name: 'Rayo abrasador', desc: 'Evocación. Lanzas tres rayos de fuego; cada uno causa 2d6 daño de fuego.' },
    { level: 2, name: 'Sordera/ceguera', desc: 'Transmutación. Ciega o ensordece a un objetivo que falle salvación de Constitución.' },
    { level: 2, name: 'Sugestión', desc: 'Encantamiento (Concentración). Sugieres curso de acción a criatura; le obliga a obedecer.' },
    { level: 2, name: 'Telaraña', desc: 'Conjuración (Concentración). Telarañas pegajosas que retienen y ralentizan en un área.' },
    { level: 2, name: 'Trepar cual arácnido', desc: 'Transmutación (Concentración). Permite caminar por paredes y techos con manos libres.' },
    { level: 2, name: 'Ver invisibilidad', desc: 'Adivinación. Ves criaturas y objetos invisibles o en el Plano Etéreo.' },
    { level: 2, name: 'Vigor arcano', desc: 'Abjuración. Te sanas a ti mismo en caso de emergencia recuperando 2d8 + Mod Carisma.' },
    { level: 2, name: 'Visión en la oscuridad', desc: 'Transmutación. Otorga visión en la oscuridad con alcance de 18 m por 8 horas.' },

    // Nivel 3
    { level: 3, name: 'Acelerar', desc: 'Transmutación (Concentración). Duplica velocidad del objetivo, da +2 CA y acción adicional.' },
    { level: 3, name: 'Bola de fuego', desc: 'Evocación. Esfera de fuego causa 8d6 daño de fuego en área de 6 m de radio.' },
    { level: 3, name: 'Caminar sobre el agua', desc: 'Transmutación (Ritual). Permite caminar sobre agua, barro, nieve o lava por 1 hora.' },
    { level: 3, name: 'Clarividencia', desc: 'Adivinación (Concentración). Creas sensor invisible para ver u oír en un lugar familiar o lejano.' },
    { level: 3, name: 'Contrahechizo', desc: 'Abjuración. Reacción. Interrumpes el lanzamiento de un conjuro enemigo.' },
    { level: 3, name: 'Desplazamiento', desc: 'Transmutación. Te teletransportas a ti mismo o a otra criatura a un lugar visible a 9 m.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Cancela los efectos mágicos activos en un objetivo.' },
    { level: 3, name: 'Don de lenguas', desc: 'Adivinación. Permite hablar y entender cualquier idioma por 1 hora.' },
    { level: 3, name: 'Forma gaseosa', desc: 'Transmutación (Concentración). Transforma objetivo en nube brumosa con resistencia a daño.' },
    { level: 3, name: 'Imagen mayor', desc: 'Ilusionismo (Concentración). Crea ilusión física tridimensional con sonido, olor y calor.' },
    { level: 3, name: 'Luz del día', desc: 'Evocación. Crea esfera de luz brillante de 18 m que dispersa oscuridad mágica.' },
    { level: 3, name: 'Nube apestosa', desc: 'Conjuración (Concentración). Nube de gas pestilente que incapacita a criaturas.' },
    { level: 3, name: 'Patrón hipnótico', desc: 'Ilusionismo (Concentración). Patrón de luces incapacita y paraliza a quienes lo miren.' },
    { level: 3, name: 'Protección contra energía', desc: 'Abjuración (Concentración). Otorga resistencia a ácido, frío, fuego, rayo o trueno.' },
    { level: 3, name: 'Ralentizar', desc: 'Transmutación (Concentración). Reduce velocidad, CA y ataques de enemigos en área.' },
    { level: 3, name: 'Relámpago', desc: 'Evocación. Línea de rayo inflige 8d6 daño eléctrico a quienes fallen.' },
    { level: 3, name: 'Respirar bajo el agua', desc: 'Transmutación (Ritual). Permite respirar bajo el agua a 10 criaturas por 24 horas.' },
    { level: 3, name: 'Terror', desc: 'Ilusionismo (Concentración). Proyecta imagen aterradora que obliga a huir a los objetivos.' },
    { level: 3, name: 'Toque vampírico', desc: 'Nigromancia (Concentración). Tu toque causa 3d6 daño necrótico y te sana.' },
    { level: 3, name: 'Tormenta de aguanieve', desc: 'Conjuración (Concentración). Lluvia helada dificulta movimiento y rompe concentración.' },
    { level: 3, name: 'Volar', desc: 'Transmutación (Concentración). Otorga velocidad de vuelo de 18 metros por 10 minutos.' },

    // Nivel 4
    { level: 4, name: 'Confusión', desc: 'Encantamiento (Concentración). Asalta la mente de criaturas obligándolas a actuar erráticamente.' },
    { level: 4, name: 'Destierro', desc: 'Abjuración (Concentración). Envías temporalmente a una criatura a otro plano de existencia.' },
    { level: 4, name: 'Dominar bestia', desc: 'Encantamiento (Concentración). Tomas el control absoluto de una bestia.' },
    { level: 4, name: 'Escudo de fuego', desc: 'Evocación. Te rodeas de llamas que dan resistencia a frío/fuego y dañan atacantes.' },
    { level: 4, name: 'Esfera vitriólica', desc: 'Evocación. Ácido causa 10d4 daño inicial y 5d4 daño el próximo turno.' },
    { level: 4, name: 'Hechizar monstruo', desc: 'Encantamiento. Hace que una criatura te considere un aliado amistoso por 1 hora.' },
    { level: 4, name: 'Invisibilidad mejorada', desc: 'Ilusionismo (Concentración). Te vuelves invisible; no se rompe al atacar/conjurar.' },
    { level: 4, name: 'Marchitar', desc: 'Nigromancia. Drenas la energía vital de una criatura infligiendo 8d8 daño necrótico.' },
    { level: 4, name: 'Muro de fuego', desc: 'Evocación (Concentración). Muro de llamas causa 5d8 daño de fuego en su área.' },
    { level: 4, name: 'Piel pétrea', desc: 'Transmutación (Concentración). Otorga resistencia a daño contundente/perforante/cortante físico.' },
    { level: 4, name: 'Polimorfar', desc: 'Transmutación (Concentración). Transforma a una criatura en una bestia.' },
    { level: 4, name: 'Puerta dimensional', desc: 'Conjuración. Te teletransportas a ti y a un aliado hasta 150 metros.' },
    { level: 4, name: 'Tormenta de hielo', desc: 'Evocación. Granizo causa 2d8 daño por impacto y 4d6 daño por frío en área.' },

    // Nivel 5
    { level: 5, name: 'Animar objetos', desc: 'Transmutación (Concentración). Das vida a objetos inanimados para que ataquen.' },
    { level: 5, name: 'Apariencia', desc: 'Ilusionismo. Altera la apariencia física de cualquier número de criaturas.' },
    { level: 5, name: 'Círculo de teletransportación', desc: 'Conjuración. Crea portal de 1 asalto a un círculo permanente conocido.' },
    { level: 5, name: 'Cono de frío', desc: 'Evocación. Ráfaga de aire helado causa 8d8 daño de frío en un cono de 18 m.' },
    { level: 5, name: 'Creación', desc: 'Ilusionismo. Materializa objetos inanimados temporales a partir de sombras.' },
    { level: 5, name: 'Dominar persona', desc: 'Encantamiento (Concentración). Controlas telepáticamente a un humanoide.' },
    { level: 5, name: 'Estática sináptica', desc: 'Encantamiento. Explosión psíquica inflige 8d6 daño y reduce tiradas enemigas en 1d6.' },
    { level: 5, name: 'Inmovilizar monstruo', desc: 'Encantamiento (Concentración). Paraliza a cualquier tipo de criatura a tu alcance.' },
    { level: 5, name: 'Mano de Bigby', desc: 'Evocación (Concentración). Creas mano de fuerza para golpear, empujar o proteger.' },
    { level: 5, name: 'Muro de piedra', desc: 'Evocación (Concentración). Crea barrera física de piedra permanente al concentrarse.' },
    { level: 5, name: 'Nube aniquiladora', desc: 'Conjuración (Concentración). Gas tóxico causa 5d10 daño veneno y avanza en cada turno.' },
    { level: 5, name: 'Plaga de insectos', desc: 'Conjuración (Concentración). Enjambre causa 4d10 daño perforante y bloquea visión.' },
    { level: 5, name: 'Telequinesis', desc: 'Transmutación (Concentración). Mueves mentalmente criaturas u objetos pesados.' },

    // Nivel 6
    { level: 6, name: 'Círculo de muerte', desc: 'Nigromancia. Esfera de energía necrótica inflige 8d6 daño necrótico a objetivos en área.' },
    { level: 6, name: 'De la carne a la piedra', desc: 'Transmutación (Concentración). Petrifica gradualmente a una criatura.' },
    { level: 6, name: 'Desintegrar', desc: 'Transmutación. Rayo causa 10d6+40 daño de fuerza; desintegra a cenizas si reduce a 0 HP.' },
    { level: 6, name: 'Esfera congelante de Otiluke', desc: 'Evocación. Globo de hielo causa 10d6 daño de frío en área grande.' },
    { level: 6, name: 'Globo de invulnerabilidad', desc: 'Abjuración (Concentración). Barrera impide el paso de conjuros de nivel 5 o inferior.' },
    { level: 6, name: 'Mal de ojo', desc: 'Nigromancia (Concentración). Mirada causa terror, sueño o debilidad a un enemigo por turno.' },
    { level: 6, name: 'Mover la tierra', desc: 'Transmutación (Concentración). Modificas el terreno natural lentamente.' },
    { level: 6, name: 'Puerta arcana', desc: 'Conjuración (Concentración). Crea dos portales de teletransporte conectados.' },
    { level: 6, name: 'Rayo solar', desc: 'Evocación (Concentración). Haz de luz inflige 6d8 daño radiante y ciega en una línea.' },
    { level: 6, name: 'Relámpago en cadena', desc: 'Evocación. Relámpago inflige 10d8 daño eléctrico y salta a hasta tres objetivos más.' },
    { level: 6, name: 'Sugestión en masa', desc: 'Encantamiento. Sugieres un curso de acción a hasta 12 criaturas por 24 horas.' },
    { level: 6, name: 'Visión veraz', desc: 'Adivinación. Permite ver cosas como son en realidad (ilusiones, invisibilidad).' },

    // Nivel 7
    { level: 7, name: 'Bola de fuego de explosión retardada', desc: 'Evocación (Concentración). Cuenta atrás táctica acumula daño (+1d6/turno) hasta explotar.' },
    { level: 7, name: 'Dedo de la muerte', desc: 'Nigromancia. Dolor extremo causa 7d8+30 daño necrótico; alza como zombi si mata.' },
    { level: 7, name: 'Desplazamiento entre planos', desc: 'Conjuración. Transporta a hasta 8 criaturas a otro plano de existencia.' },
    { level: 7, name: 'Excursión etérea', desc: 'Conjuración. Te desplazas al Plano Etéreo para moverte invisible e intangible.' },
    { level: 7, name: 'Invertir la gravedad', desc: 'Transmutación (Concentración). Invierte gravedad haciendo caer a criaturas hacia arriba.' },
    { level: 7, name: 'Rociada prismática', desc: 'Evocación. Ráfagas de luz multicolor infligen daño aleatorio o estados alterados.' },
    { level: 7, name: 'Teletransporte', desc: 'Conjuración. Teletransporta instantáneamente a tu grupo a cualquier lugar del mundo.' },
    { level: 7, name: 'Tormenta de fuego', desc: 'Evocación. Tormenta de fuego causa 7d10 daño de fuego en múltiples cubos.' },

    // Nivel 8
    { level: 8, name: 'Dominar monstruo', desc: 'Encantamiento (Concentración). Control total sobre cualquier criatura.' },
    { level: 8, name: 'Explosión solar', desc: 'Evocación. Destello causa 12d6 daño radiante y ciega permanentemente.' },
    { level: 8, name: 'Nube incendiaria', desc: 'Conjuración (Concentración). Nube causa 10d8 daño de fuego por turno en su área.' },
    { level: 8, name: 'Palabra de poder: aturdir', desc: 'Encantamiento. Aturde instantáneamente a una criatura con menos de 150 HP.' },
    { level: 8, name: 'Semiplano', desc: 'Conjuración. Crea una habitación dimensional vacía conectada por una puerta en una pared.' },
    { level: 8, name: 'Terremoto', desc: 'Transmutación (Concentración). Sacudida sísmica derriba estructuras y abre fisuras.' },

    // Nivel 9
    { level: 9, name: 'Deseo', desc: 'Conjuración. El conjuro más poderoso; replica cualquier otro conjuro o altera la realidad.' },
    { level: 9, name: 'Palabra de poder: matar', desc: 'Encantamiento. Mata al instante a una criatura si tiene 100 HP o menos.' },
    { level: 9, name: 'Parar el tiempo', desc: 'Transmutación. Detienes el paso del tiempo para todos excepto tú durante 1d4+1 turnos.' },
    { level: 9, name: 'Portal', desc: 'Conjuración (Concentración). Abre portal bidireccional permanente a otro plano.' },
    { level: 9, name: 'Tormenta de meteoritos', desc: 'Evocación. Meteoros causan 20d6 daño de fuego y 20d6 daño contundente.' }
  ];

  sorcererMetamagicList = [
    { name: 'Conjuro Acelerado', cost: 2, desc: 'Cuando lanzas un conjuro con tiempo de una acción, gastas 2 puntos para lanzarlo como acción adicional. No puedes lanzar otro conjuro de nivel 1+ este turno tras usarlo.' },
    { name: 'Conjuro Buscador', cost: 1, desc: 'Si fallas una tirada de ataque con un conjuro, gastas 1 punto para volver a lanzar el d20. Puedes usarlo con otra metamagia.' },
    { name: 'Conjuro Cuidado', cost: 1, desc: 'Al lanzar un conjuro con tirada de salvación, gastas 1 punto y proteges hasta Carisma (mín. 1) criaturas. Tienen éxito automático y no sufren daño si normalmente recibirían la mitad.' },
    { name: 'Conjuro Distante', cost: 1, desc: 'Duplica el alcance de un conjuro de al menos 1.5 m, o hace que un conjuro de toque tenga un alcance de 9 m.' },
    { name: 'Conjuro Extendido', cost: 1, desc: 'Duplica la duración de un conjuro de al menos 1 minuto (máx. 24h). Otorga ventaja para mantener la concentración en ese conjuro.' },
    { name: 'Conjuro Gemelo', cost: 1, desc: 'Al lanzar un conjuro monobjetivo modificable por nivel para añadir objetivos, gastas 1 punto para incrementar su nivel efectivo en 1.' },
    { name: 'Conjuro Intensificado', cost: 2, desc: 'Gasta 2 puntos para dar desventaja a un objetivo en su primera tirada de salvación contra el conjuro.' },
    { name: 'Conjuro Potenciado', cost: 1, desc: 'Gasta 1 punto para repetir hasta tu modificador de Carisma (mín. 1) dados de daño de un conjuro.' },
    { name: 'Conjuro Sutil', cost: 1, desc: 'Gasta 1 punto para lanzar el conjuro sin componentes verbales, somáticos ni materiales (salvo consumibles o con coste).' },
    { name: 'Conjuro Transmutado', cost: 1, desc: 'Gasta 1 punto para cambiar el tipo de daño de un conjuro a ácido, frío, fuego, relámpago, trueno o veneno.' }
  ];

  isDruid(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('druida');
  }

  selectDruidPrimalOrderOption(option: string): void {
    this.selectedDruidPrimalOrder = option;
    const limit = this.getDruidCantripsLimit();
    if (this.selectedDruidCantrips.length > limit) {
      this.selectedDruidCantrips = this.selectedDruidCantrips.slice(0, limit);
    }
    this.cdr.detectChanges();
  }

  getDruidCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    let baseLimit = 2;
    if (lvl >= 4 && lvl <= 9) baseLimit = 3;
    else if (lvl >= 10) baseLimit = 4;
 
    if (this.selectedDruidPrimalOrder === 'Naturalista') {
      baseLimit += 1;
    }
    return baseLimit;
  }
 
  getDruidSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
      10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22
    };
    return table[lvl] || 4;
  }

  isSorcerer(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('hechicero');
  }

  isSorcererLvl3(): boolean {
    return this.isSorcerer() && Number(this.characterLevel) >= 3;
  }

  getSorcererCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 3) return 4;
    if (lvl <= 9) return 5;
    return 6;
  }

  getSorcererSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 2, 2: 4, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
      10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22
    };
    return table[lvl] || 2;
  }

  getSorcererMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 2) return 1;
    if (lvl <= 4) return 2;
    if (lvl <= 6) return 3;
    if (lvl <= 8) return 4;
    if (lvl <= 10) return 5;
    if (lvl <= 12) return 6;
    if (lvl <= 14) return 7;
    if (lvl <= 16) return 8;
    return 9;
  }

  getSorcererMetamagicLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl < 2) return 0;
    if (lvl <= 9) return 2;
    if (lvl <= 16) return 4;
    return 6;
  }

  getSorcererSpellsForLevel(level: number) {
    return this.sorcererSpellsList.filter(s => s.level === level);
  }

  getSorcererCantrips() {
    return this.sorcererSpellsList.filter(s => s.level === 0);
  }

  getAvailableSpellLevelsForSorcerer(): number[] {
    const maxLvl = this.getSorcererMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  toggleSorcererCantrip(cantripName: string): void {
    const limit = this.getSorcererCantripsLimit();
    const idx = this.selectedSorcererCantrips.indexOf(cantripName);
    if (idx > -1) {
      this.selectedSorcererCantrips.splice(idx, 1);
    } else if (this.selectedSorcererCantrips.length < limit) {
      this.selectedSorcererCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleSorcererSpell(spellName: string): void {
    const limit = this.getSorcererSpellsLimit();
    const idx = this.selectedSorcererSpells.indexOf(spellName);
    if (idx > -1) {
      this.selectedSorcererSpells.splice(idx, 1);
    } else if (this.selectedSorcererSpells.length < limit) {
      this.selectedSorcererSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  toggleSorcererMetamagic(metamagicName: string): void {
    const limit = this.getSorcererMetamagicLimit();
    const idx = this.selectedSorcererMetamagic.indexOf(metamagicName);
    if (idx > -1) {
      this.selectedSorcererMetamagic.splice(idx, 1);
    } else if (this.selectedSorcererMetamagic.length < limit) {
      this.selectedSorcererMetamagic.push(metamagicName);
    }
    this.cdr.detectChanges();
  }

  isBard(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('bardo');
  }

  isCleric(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('clérigo') || this.activeClass.name.toLowerCase().includes('clerigo');
  }
 
  getBardCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 3) return 2;
    if (lvl <= 9) return 3;
    return 4;
  }
 
  getBardSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
      10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22
    };
    return table[lvl] || 4;
  }
 
  getBardMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 2) return 1;
    if (lvl <= 4) return 2;
    if (lvl <= 6) return 3;
    if (lvl <= 8) return 4;
    if (lvl <= 10) return 5;
    if (lvl <= 12) return 6;
    if (lvl <= 14) return 7;
    if (lvl <= 16) return 8;
    return 9;
  }
 
  getAvailableSpellLevels(): number[] {
    const maxLvl = this.getBardMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }
 
  getSpellsForLevel(level: number) {
    return this.bardSpellsList.filter(s => s.level === level);
  }
 
  onLevelChange(): void {
    const maxLvl = this.getBardMaxSpellLevel();
    this.selectedBardSpells = this.selectedBardSpells.filter(spellName => {
      const sp = this.bardSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= maxLvl;
    });
 
    const cantripLimit = this.getBardCantripsLimit();
    if (this.selectedBardCantrips.length > cantripLimit) {
      this.selectedBardCantrips = this.selectedBardCantrips.slice(0, cantripLimit);
    }
 
    const spellLimit = this.getBardSpellsLimit();
    if (this.selectedBardSpells.length > spellLimit) {
      this.selectedBardSpells = this.selectedBardSpells.slice(0, spellLimit);
    }
 
    // Limpieza de niveles de Brujo
    const wlMaxLvl = this.getWarlockMaxSpellLevel();
    this.selectedWarlockSpells = this.selectedWarlockSpells.filter(spellName => {
      const sp = this.warlockSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= wlMaxLvl;
    });

    const wlCantripLimit = this.getWarlockCantripsLimit();
    if (this.selectedWarlockCantrips.length > wlCantripLimit) {
      this.selectedWarlockCantrips = this.selectedWarlockCantrips.slice(0, wlCantripLimit);
    }

    const wlInvLimit = this.getWarlockInvocationsLimit();
    if (this.selectedWarlockInvocations.length > wlInvLimit) {
      this.selectedWarlockInvocations = this.selectedWarlockInvocations.slice(0, wlInvLimit);
    }

    // Limpieza de niveles de Clérigo
    const clMaxLvl = this.getClericMaxSpellLevel();
    this.selectedClericSpells = this.selectedClericSpells.filter(spellName => {
      const sp = this.clericSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= clMaxLvl;
    });

    const clCantripLimit = this.getClericCantripsLimit();
    if (this.selectedClericCantrips.length > clCantripLimit) {
      this.selectedClericCantrips = this.selectedClericCantrips.slice(0, clCantripLimit);
    }

    const clSpellLimit = this.getClericSpellsLimit();
    if (this.selectedClericSpells.length > clSpellLimit) {
      this.selectedClericSpells = this.selectedClericSpells.slice(0, clSpellLimit);
    }

    // Limpieza de niveles de Hechicero
    const sorcMaxLvl = this.getSorcererMaxSpellLevel();
    this.selectedSorcererSpells = this.selectedSorcererSpells.filter(spellName => {
      const sp = this.sorcererSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= sorcMaxLvl;
    });

    const sorcCantripLimit = this.getSorcererCantripsLimit();
    if (this.selectedSorcererCantrips.length > sorcCantripLimit) {
      this.selectedSorcererCantrips = this.selectedSorcererCantrips.slice(0, sorcCantripLimit);
    }

    const sorcSpellLimit = this.getSorcererSpellsLimit();
    if (this.selectedSorcererSpells.length > sorcSpellLimit) {
      this.selectedSorcererSpells = this.selectedSorcererSpells.slice(0, sorcSpellLimit);
    }

    const sorcMetamagicLimit = this.getSorcererMetamagicLimit();
    if (this.selectedSorcererMetamagic.length > sorcMetamagicLimit) {
      this.selectedSorcererMetamagic = this.selectedSorcererMetamagic.slice(0, sorcMetamagicLimit);
    }
 
    if (Number(this.characterLevel) < 3) {
      this.selectedSubclass = '';
    }

    // Limpieza de niveles del Mago
    const magoMaxLvl = this.getMagoMaxSpellLevel();
    this.selectedMagoSpells = this.selectedMagoSpells.filter(spellName => {
      const sp = this.magoSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= magoMaxLvl;
    });
    const magoCantripLimit = this.getMagoCantripsLimit();
    if (this.selectedMagoCantrips.length > magoCantripLimit) {
      this.selectedMagoCantrips = this.selectedMagoCantrips.slice(0, magoCantripLimit);
    }
    const magoSpellLimit = this.getMagoSpellsLimit();
    if (this.selectedMagoSpells.length > magoSpellLimit) {
      this.selectedMagoSpells = this.selectedMagoSpells.slice(0, magoSpellLimit);
    }

    // Limpieza de niveles de Explorador (Ranger)
    const rangerMaxLvl = this.getRangerMaxSpellLevel();
    this.selectedRangerSpells = this.selectedRangerSpells.filter(spellName => {
      const sp = this.rangerSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= rangerMaxLvl;
    });
    const rangerSpellLimit = this.getRangerSpellsLimit();
    if (this.selectedRangerSpells.length > rangerSpellLimit) {
      this.selectedRangerSpells = this.selectedRangerSpells.slice(0, rangerSpellLimit);
    }

    // Limpieza de niveles de Paladín
    const paladinMaxLvl = this.getPaladinMaxSpellLevel();
    this.selectedPaladinSpells = this.selectedPaladinSpells.filter(spellName => {
      const sp = this.paladinSpellsList.find(s => s.name === spellName);
      return sp && sp.level <= paladinMaxLvl;
    });
    const paladinSpellLimit = this.getPaladinSpellsLimit();
    if (this.selectedPaladinSpells.length > paladinSpellLimit) {
      this.selectedPaladinSpells = this.selectedPaladinSpells.slice(0, paladinSpellLimit);
    }
    
    this.cdr.detectChanges();
  }

  isMago(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('mago');
  }

  isMagoLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    return name.includes('mago') && Number(this.characterLevel) >= 3;
  }

  getMagoCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 3) return 3;
    if (lvl <= 9) return 4;
    return 5;
  }

  getMagoSpellsLimit(): number {
    // El Libro de Conjuros inicia con 6 hechizos de nivel 1 y gana 2 por nivel
    const lvl = Number(this.characterLevel) || 1;
    return 6 + (lvl - 1) * 2;
  }

  getMagoMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 2) return 1;
    if (lvl <= 4) return 2;
    if (lvl <= 6) return 3;
    if (lvl <= 8) return 4;
    if (lvl <= 10) return 5;
    if (lvl <= 12) return 6;
    if (lvl <= 14) return 7;
    if (lvl <= 16) return 8;
    return 9;
  }

  getMagoAvailableSpellLevels(): number[] {
    const maxLvl = this.getMagoMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getMagoSpellsForLevel(level: number) {
    return this.magoSpellsList.filter(s => s.level === level);
  }

  toggleMagoCantrip(cantripName: string): void {
    const limit = this.getMagoCantripsLimit();
    const idx = this.selectedMagoCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedMagoCantrips.splice(idx, 1);
    } else if (this.selectedMagoCantrips.length < limit) {
      this.selectedMagoCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleMagoSpell(spellName: string): void {
    const limit = this.getMagoSpellsLimit();
    const idx = this.selectedMagoSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedMagoSpells.splice(idx, 1);
    } else if (this.selectedMagoSpells.length < limit) {
      this.selectedMagoSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  isWarlock(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('brujo');
  }


  getWarlockCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 3) return 2;
    if (lvl <= 9) return 3;
    return 4;
  }

  getWarlockSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
      10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13,
      17: 14, 18: 14, 19: 15, 20: 15
    };
    return table[lvl] || 2;
  }

  getWarlockInvocationsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 1, 2: 3, 3: 3, 4: 3, 5: 5, 6: 5, 7: 6, 8: 6, 9: 7,
      10: 7, 11: 7, 12: 8, 13: 8, 14: 8, 15: 9, 16: 9, 17: 9,
      18: 10, 19: 10, 20: 10
    };
    return table[lvl] || 1;
  }

  getWarlockMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 2) return 1;
    if (lvl <= 4) return 2;
    if (lvl <= 6) return 3;
    if (lvl <= 8) return 4;
    return 5;
  }

  getWarlockAvailableSpellLevels(): number[] {
    const maxLvl = this.getWarlockMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getWarlockSpellsForLevel(level: number) {
    return this.warlockSpellsList.filter(s => s.level === level);
  }

  toggleWarlockCantrip(cantripName: string): void {
    const cantripLimit = this.getWarlockCantripsLimit();
    const idx = this.selectedWarlockCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedWarlockCantrips.splice(idx, 1);
    } else if (this.selectedWarlockCantrips.length < cantripLimit) {
      this.selectedWarlockCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleWarlockSpell(spellName: string): void {
    const spellLimit = this.getWarlockSpellsLimit();
    const idx = this.selectedWarlockSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedWarlockSpells.splice(idx, 1);
    } else if (this.selectedWarlockSpells.length < spellLimit) {
      this.selectedWarlockSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  toggleWarlockInvocation(invName: string): void {
    const invLimit = this.getWarlockInvocationsLimit();
    const idx = this.selectedWarlockInvocations.indexOf(invName);
    if (idx !== -1) {
      this.selectedWarlockInvocations.splice(idx, 1);
    } else if (this.selectedWarlockInvocations.length < invLimit) {
      this.selectedWarlockInvocations.push(invName);
    }
    this.cdr.detectChanges();
  }
 
  toggleBardCantrip(cantripName: string): void {
    const idx = this.selectedBardCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedBardCantrips.splice(idx, 1);
    } else if (this.selectedBardCantrips.length < this.getBardCantripsLimit()) {
      this.selectedBardCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }
 
  toggleBardSpell(spellName: string): void {
    const idx = this.selectedBardSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedBardSpells.splice(idx, 1);
    } else if (this.selectedBardSpells.length < this.getBardSpellsLimit()) {
      this.selectedBardSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  getClericCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    let baseLimit = 3;
    if (lvl >= 4 && lvl <= 9) baseLimit = 4;
    else if (lvl >= 10) baseLimit = 5;

    if (this.selectedClericDivineOrder === 'Taumaturgo') {
      baseLimit += 1;
    }
    return baseLimit;
  }

  getClericSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14,
      10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18,
      17: 19, 18: 20, 19: 21, 20: 22
    };
    return table[lvl] || 4;
  }

  getClericMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 2) return 1;
    if (lvl <= 4) return 2;
    if (lvl <= 6) return 3;
    if (lvl <= 8) return 4;
    if (lvl <= 10) return 5;
    if (lvl <= 12) return 6;
    if (lvl <= 14) return 7;
    if (lvl <= 16) return 8;
    return 9;
  }

  getClericAvailableSpellLevels(): number[] {
    const maxLvl = this.getClericMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getClericSpellsForLevel(level: number) {
    return this.clericSpellsList.filter(s => s.level === level);
  }

  selectClericDivineOrderOption(option: string): void {
    this.selectedClericDivineOrder = option;
    const limit = this.getClericCantripsLimit();
    if (this.selectedClericCantrips.length > limit) {
      this.selectedClericCantrips = this.selectedClericCantrips.slice(0, limit);
    }
    this.cdr.detectChanges();
  }

  toggleClericCantrip(cantripName: string): void {
    const cantripLimit = this.getClericCantripsLimit();
    const idx = this.selectedClericCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedClericCantrips.splice(idx, 1);
    } else if (this.selectedClericCantrips.length < cantripLimit) {
      this.selectedClericCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleClericSpell(spellName: string): void {
    const spellLimit = this.getClericSpellsLimit();
    const idx = this.selectedClericSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedClericSpells.splice(idx, 1);
    } else if (this.selectedClericSpells.length < spellLimit) {
      this.selectedClericSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  getDruidSpellsForLevel(level: number) {
    return this.druidSpellsList.filter(s => s.level === level);
  }

  toggleDruidCantrip(cantripName: string): void {
    const cantripLimit = this.getDruidCantripsLimit();
    const idx = this.selectedDruidCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedDruidCantrips.splice(idx, 1);
    } else if (this.selectedDruidCantrips.length < cantripLimit) {
      this.selectedDruidCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleDruidSpell(spellName: string): void {
    const spellLimit = this.getDruidSpellsLimit();
    const idx = this.selectedDruidSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedDruidSpells.splice(idx, 1);
    } else if (this.selectedDruidSpells.length < spellLimit) {
      this.selectedDruidSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  selectedRangerSpells: string[] = ['Curar heridas', 'Golpe apresador'];
  selectedRangerFeyGift: string = '';
  selectedRangerPrimalCompanion: string = '';

  selectedEldritchKnightCantrips: string[] = ['Agarre electrizante', 'Rayo de escarcha'];
  selectedEldritchKnightSpells: string[] = ['Escudo', 'Manos ardientes', 'Salto'];

  eldritchKnightCantripsList = [
    { name: 'Agarre electrizante', desc: 'Evocación (Recomendado). Ataque de conjuro cuerpo a cuerpo hace 1d8 daño de rayo y evita reacciones.' },
    { name: 'Rayo de escarcha', desc: 'Evocación (Recomendado). Rayo de frío causa 1d8 daño de frío y reduce velocidad 3 m.' },
    { name: 'Ilusión menor', desc: 'Ilusionismo. Crea un sonido o imagen en un punto a 9 m.' },
    { name: 'Mano de mago', desc: 'Conjuración. Crea una mano espectral para manipular objetos.' },
    { name: 'Salpicadura ácida', desc: 'Conjuración. Burbuja de ácido causa 1d6 daño de ácido a una o dos criaturas a 1.5 m de distancia entre sí.' },
    { name: 'Prestidigitación', desc: 'Transmutación. Efectos mágicos menores e inofensivos.' },
    { name: 'Guardia de cuchillas', desc: 'Abjuración. Da resistencia contra daño físico de armas.' }
  ];

  eldritchKnightSpellsList = [
    // Nivel 1
    { level: 1, name: 'Escudo', desc: 'Abjuración (Recomendado). Reacción. Otorga +5 a CA e inmunidad a proyectil mágico.' },
    { level: 1, name: 'Manos ardientes', desc: 'Evocación (Recomendado). Cono de fuego de 4.5 m causa 3d6 daño de fuego.' },
    { level: 1, name: 'Salto', desc: 'Transmutación (Recomendado). Triplica la distancia de salto de una criatura por 1 minuto.' },
    { level: 1, name: 'Proyectil mágico', desc: 'Evocación. Tres dardos mágicos causan 1d4+1 daño de fuerza cada uno, impactando automáticamente.' },
    { level: 1, name: 'Grasa', desc: 'Conjuración. Terreno de 3 m se vuelve resbaladizo; criaturas pueden caer propensas.' },
    { level: 1, name: 'Caída de pluma', desc: 'Transmutación. Reacción. Ralentiza caída de hasta 5 criaturas evitando daño de impacto.' },
    { level: 1, name: 'Detección de magia', desc: 'Adivinación (Ritual). Sientes auras mágicas a 9 m.' },

    // Nivel 2
    { level: 2, name: 'Paso brumoso', desc: 'Conjuración. Acción adicional. Teletransporte hasta 9 m.' },
    { level: 2, name: 'Invisibilidad', desc: 'Ilusionismo. Vuelves invisible a una criatura al tocarla (Concentración).' },
    { level: 2, name: 'Hacer añicos', desc: 'Evocación. Ruido ensordecedor causa 3d8 daño de trueno en área.' },
    { level: 2, name: 'Imagen múltiple', desc: 'Ilusionismo. Tres duplicados desvían ataques.' },
    { level: 2, name: 'Inmovilizar persona', desc: 'Encantamiento. Paraliza a un humanoide a 18 m (Concentración).' },
    { level: 2, name: 'Fuerza fantasmal', desc: 'Ilusionismo. Creas una ilusión mental que inflige daño psíquico (Concentración).' }
  ];

  rangerSpellsList = [
    // Nivel 1
    { level: 1, name: 'Alarma', desc: 'Abjuración (Ritual). Avisa de intrusos en el área mediante un sonido o alarma mental.' },
    { level: 1, name: 'Buenas bayas', desc: 'Conjuración. Creas 10 bayas mágicas; cada una sana 1 pg y alimenta por un día.' },
    { level: 1, name: 'Curar heridas', desc: 'Abjuración. Sana a una criatura tocada por valor de 2d8 + modificador de Sabiduría.' },
    { level: 1, name: 'Detectar magia', desc: 'Adivinación (Ritual). Percibes la presencia de auras mágicas a 9 metros.' },
    { level: 1, name: 'Detectar venenos y enfermedades', desc: 'Adivinación (Ritual). Detectas veneno, criaturas venenosas y enfermedades a 9 m.' },
    { level: 1, name: 'Encantar animal', desc: 'Encantamiento (Concentración). Convence a una bestia de que no eres una amenaza.' },
    { level: 1, name: 'Enmarañar', desc: 'Conjuración (Concentración). Plantas enredan y retienen a criaturas en un área.' },
    { level: 1, name: 'Golpe apresador', desc: 'Conjuración (Concentración). Tu próximo ataque de arma atrapa a la víctima en enredaderas.' },
    { level: 1, name: 'Hablar con los animales', desc: 'Adivinación (Ritual). Te comunicas verbalmente con bestias por 10 minutos.' },
    { level: 1, name: 'Marca del cazador', desc: 'Adivinación (Concentración). Eliges objetivo; tus ataques le infligen 1d6 de daño extra.' },
    { level: 1, name: 'Nube de oscurecimiento', desc: 'Conjuración (Concentración). Nube densa que bloquea totalmente la visión.' },
    { level: 1, name: 'Salto', desc: 'Transmutación. Triplica la distancia de salto de una criatura por 1 minuto.' },
    { level: 1, name: 'Tormenta de espinas', desc: 'Conjuración. Flecha estalla en espinas infligiendo daño perforante en área.' },
    { level: 1, name: 'Zancada prodigiosa', desc: 'Transmutación. Aumenta la velocidad de movimiento de una criatura en 3 m por 1 hora.' },

    // Nivel 2
    { level: 2, name: 'Arma mágica', desc: 'Transmutación (Concentración). El arma se vuelve mágica con un bonificador de +1 a ataques y daño.' },
    { level: 2, name: 'Auxilio', desc: 'Abjuración. Incrementa el HP máximo y actual de tres criaturas en 5.' },
    { level: 2, name: 'Cordón de flechas', desc: 'Transmutación. Inyectas magia en 4 flechas que se disparan si una criatura se acerca.' },
    { level: 2, name: 'Crecimiento espinoso', desc: 'Transmutación. Terreno se llena de espinas infligiendo daño al moverse (Concentración).' },
    { level: 2, name: 'Detectar trampas', desc: 'Adivinación. Sientes la presencia de trampas a la vista.' },
    { level: 2, name: 'Invocar bestia', desc: 'Conjuración. Invocas a un espíritu animal terrestre, acuático o aéreo (Concentración).' },
    { level: 2, name: 'Localizar animales o plantas', desc: 'Adivinación (Ritual). Sientes dirección de una especie animal o vegetal.' },
    { level: 2, name: 'Localizar objeto', desc: 'Adivinación. Sientes dirección de un objeto conocido a 110 m (Concentración).' },
    { level: 2, name: 'Mensajero animal', desc: 'Encantamiento. Envías a un animal pequeño a entregar un mensaje (Ritual).' },
    { level: 2, name: 'Pasar sin rastro', desc: 'Abjuración (Concentración). +10 a pruebas de Sigilo para aliados cercanos.' },
    { level: 2, name: 'Piel robliza', desc: 'Transmutación. Piel se endurece haciendo que la CA mínima sea 16.' },
    { level: 2, name: 'Potenciar característica', desc: 'Transmutación. Otorga ventaja en pruebas de un atributo elegido (Concentración).' },
    { level: 2, name: 'Protección contra veneno', desc: 'Abjuración. Da resistencia al veneno y neutraliza venenos activos.' },
    { level: 2, name: 'Ráfaga de viento', desc: 'Evocación. Genera una línea de viento fuerte que empuja y apaga fuegos (Concentración).' },
    { level: 2, name: 'Restablecimiento menor', desc: 'Abjuración. Cura ceguedad, sordera, parálisis o envenenamiento.' },
    { level: 2, name: 'Sentidos de la bestia', desc: 'Adivinación (Ritual). Usas sentidos de una bestia voluntaria (Concentración).' },
    { level: 2, name: 'Silencio', desc: 'Ilusionismo. Esfera de 6m de radio donde no se puede emitir ningún sonido (Concentración).' },
    { level: 2, name: 'Visión en la oscuridad', desc: 'Transmutación. Concede visión en la oscuridad a 18 m por 8 horas.' },

    // Nivel 3
    { level: 3, name: 'Arma elemental', desc: 'Transmutación (Concentración). Arma causa 1d4 daño elemental extra y gana +1 a ataques.' },
    { level: 3, name: 'Caminar sobre el agua', desc: 'Transmutación (Ritual). Permite caminar sobre líquidos a diez criaturas.' },
    { level: 3, name: 'Conjurar animales', desc: 'Conjuración (Concentración). Invocas espíritus que toman forma de bestias.' },
    { level: 3, name: 'Conjurar descarga de proyectiles', desc: 'Evocación. Creas una lluvia de proyectiles que causa 8d8 daño en área.' },
    { level: 3, name: 'Crecimiento vegetal', desc: 'Transmutación. Llena de vegetación un área haciendo el terreno muy difícil.' },
    { level: 3, name: 'Disipar magia', desc: 'Abjuración. Cancela conjuros o efectos mágicos activos de nivel 3 o inferior.' },
    { level: 3, name: 'Flecha de relámpago', desc: 'Transmutación. Tu próximo disparo de arma causa 4d8 daño de relámpago y explota.' },
    { level: 3, name: 'Fundirse con la piedra', desc: 'Transmutación (Ritual). Te introduces físicamente en un bloque de piedra sólido.' },
    { level: 3, name: 'Hablar con las plantas', desc: 'Transmutación. Te comunicas con plantas y las interrogas.' },
    { level: 3, name: 'Indetectabilidad', desc: 'Abjuración. Protege a una criatura contra adivinación y sensores mágicos.' },
    { level: 3, name: 'Invocar feérico', desc: 'Conjuración (Concentración). Invocas a un espíritu feérico que lucha a tus órdenes.' },
    { level: 3, name: 'Luz del día', desc: 'Evocación. Esfera de 18 m emite luz brillante equivalente a la luz solar.' },
    { level: 3, name: 'Muro de viento', desc: 'Evocación. Muro de viento repele flechas, gases e inflige daño (Concentración).' },
    { level: 3, name: 'Protección contra energía', desc: 'Abjuración (Concentración). Otorga resistencia a un tipo de daño elemental.' },
    { level: 3, name: 'Respirar bajo el agua', desc: 'Transmutación (Ritual). Concede capacidad de respirar bajo el agua por 24 horas.' },
    { level: 3, name: 'Revivir', desc: 'Nigromancia. Devuelve la vida a una criatura muerta en el último minuto con 1 HP.' },

    // Nivel 4
    { level: 4, name: 'Conjurar seres del bosque', desc: 'Conjuración (Concentración). Invocas espíritus feéricos de la naturaleza.' },
    { level: 4, name: 'Dominar bestia', desc: 'Encantamiento. Tomas el control telepático completo de una bestia (Concentración).' },
    { level: 4, name: 'Enredadera', desc: 'Conjuración (Concentración). Enredadera inteligente apresa y arrastra a enemigos.' },
    { level: 4, name: 'Invocar elemental', desc: 'Conjuración (Concentración). Invocas a un espíritu elemental (Tierra, Aire, Fuego, Agua).' },
    { level: 4, name: 'Libertad de movimiento', desc: 'Abjuración. Ignora terreno difícil, parálisis, constricciones y apresamientos.' },
    { level: 4, name: 'Localizar criatura', desc: 'Adivinación (Concentración). Sientes dirección de criatura conocida a 90 m.' },
    { level: 4, name: 'Piel pétrea', desc: 'Abjuración (Concentración). Concede resistencia a daño físico no mágico.' },

    // Nivel 5
    { level: 5, name: 'Corcaj veloz', desc: 'Transmutación (Concentración). Permite realizar dos ataques adicionales con proyectiles por turno como acción adicional.' },
    { level: 5, name: 'Comunión con la naturaleza', desc: 'Adivinación (Ritual). Te vuelves uno con el entorno conociendo terreno, agua o criaturas.' },
    { level: 5, name: 'Conjurar lluvia de flechas', desc: 'Conjuración. Lluvia de flechas causa 8d8 daño en área.' },
    { level: 5, name: 'Golpe de viento acerado', desc: 'Conjuración. Te teletransportas atacando a hasta cinco objetivos por 6d10 daño de fuerza.' },
    { level: 5, name: 'Paso arbóreo', desc: 'Conjuración. Te teletransportas de un árbol a otro consumiendo movimiento (Concentración).' },
    { level: 5, name: 'Restablecimiento mayor', desc: 'Abjuración. Reduce cansancio, elimina petrificación, maldición o encanto.' }
  ];

  isRanger(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('explorador');
  }

  getRangerSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9,
      10: 9, 11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12,
      17: 14, 18: 14, 19: 15, 20: 15
    };
    return table[lvl] || 2;
  }

  getRangerMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 4) return 1;
    if (lvl <= 8) return 2;
    if (lvl <= 12) return 3;
    if (lvl <= 16) return 4;
    return 5;
  }

  getRangerAvailableSpellLevels(): number[] {
    const maxLvl = this.getRangerMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getRangerSpellsForLevel(level: number) {
    return this.rangerSpellsList.filter(s => s.level === level);
  }

  toggleRangerSpell(spellName: string): void {
    const spellLimit = this.getRangerSpellsLimit();
    const idx = this.selectedRangerSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedRangerSpells.splice(idx, 1);
    } else if (this.selectedRangerSpells.length < spellLimit) {
      this.selectedRangerSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  isPaladin(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('paladín') || this.activeClass.name.toLowerCase().includes('paladin');
  }

  isPaladinLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    return (name.includes('paladín') || name.includes('paladin')) && Number(this.characterLevel) >= 3;
  }

  getPaladinSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9,
      10: 9, 11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12,
      17: 14, 18: 14, 19: 15, 20: 15
    };
    return table[lvl] || 2;
  }

  getPaladinMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 4) return 1;
    if (lvl <= 8) return 2;
    if (lvl <= 12) return 3;
    if (lvl <= 16) return 4;
    return 5;
  }

  getPaladinAvailableSpellLevels(): number[] {
    const maxLvl = this.getPaladinMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getPaladinSpellsForLevel(level: number) {
    return this.paladinSpellsList.filter(s => s.level === level);
  }

  togglePaladinSpell(spellName: string): void {
    const spellLimit = this.getPaladinSpellsLimit();
    const idx = this.selectedPaladinSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedPaladinSpells.splice(idx, 1);
    } else if (this.selectedPaladinSpells.length < spellLimit) {
      this.selectedPaladinSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

  isFighter(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    return this.activeClass.name.toLowerCase().includes('guerrero');
  }

  isFighterLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isFighter = name.includes('guerrero');
    return isFighter && Number(this.characterLevel) >= 3;
  }

  getEldritchKnightCantripsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl < 10) return 2;
    return 3;
  }

  getEldritchKnightSpellsLimit(): number {
    const lvl = Number(this.characterLevel) || 1;
    const table: { [key: number]: number } = {
      1: 0, 2: 0, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6,
      10: 7, 11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11,
      18: 11, 19: 12, 20: 13
    };
    return table[lvl] || 0;
  }

  getEldritchKnightMaxSpellLevel(): number {
    const lvl = Number(this.characterLevel) || 1;
    if (lvl <= 6) return 1;
    if (lvl <= 12) return 2;
    if (lvl <= 18) return 3;
    return 4;
  }

  getEldritchKnightAvailableSpellLevels(): number[] {
    const maxLvl = this.getEldritchKnightMaxSpellLevel();
    const lvls: number[] = [];
    for (let i = 1; i <= maxLvl; i++) {
      lvls.push(i);
    }
    return lvls;
  }

  getEldritchKnightSpellsForLevel(level: number) {
    return this.eldritchKnightSpellsList.filter(s => s.level === level);
  }

  toggleEldritchKnightCantrip(cantripName: string): void {
    const cantripLimit = this.getEldritchKnightCantripsLimit();
    const idx = this.selectedEldritchKnightCantrips.indexOf(cantripName);
    if (idx !== -1) {
      this.selectedEldritchKnightCantrips.splice(idx, 1);
    } else if (this.selectedEldritchKnightCantrips.length < cantripLimit) {
      this.selectedEldritchKnightCantrips.push(cantripName);
    }
    this.cdr.detectChanges();
  }

  toggleEldritchKnightSpell(spellName: string): void {
    const spellLimit = this.getEldritchKnightSpellsLimit();
    const idx = this.selectedEldritchKnightSpells.indexOf(spellName);
    if (idx !== -1) {
      this.selectedEldritchKnightSpells.splice(idx, 1);
    } else if (this.selectedEldritchKnightSpells.length < spellLimit) {
      this.selectedEldritchKnightSpells.push(spellName);
    }
    this.cdr.detectChanges();
  }

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
  selectedOriginLineage = '';
  selectedSubclass = '';

  // Pool de puntos de atributos base
  attributePointsPool = 27; // 27 points for Point Buy
  attributeMethod: 'array' | 'random' | 'buy' = 'array';
  attributePool: { value: number; assignedTo: string | null }[] = [
    { value: 15, assignedTo: 'FUE' },
    { value: 14, assignedTo: 'DES' },
    { value: 13, assignedTo: 'CON' },
    { value: 12, assignedTo: 'INT' },
    { value: 10, assignedTo: 'SAB' },
    { value: 8, assignedTo: 'CAR' }
  ];
  pointBuyCosts: { [key: number]: number } = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  rolledStats: { dice: number[]; sortedDice: number[]; sum: number; rolling: boolean; completed: boolean; discardedIdx: number }[] = Array.from({ length: 6 }, () => ({
    dice: [1, 1, 1, 1],
    sortedDice: [1, 1, 1, 1],
    sum: 0,
    rolling: false,
    completed: false,
    discardedIdx: -1
  }));
  activeRollIndex = 0;
  isRollingAll = false;
  activeSizeInfo: any = {
    hasChoice: false,
    sizes: [
      { name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano (entre 1.0 y 2.0 m)' }
    ]
  };
  carryingCapacity = { maxKg: 75, maxLb: 150, dragKg: 150, dragLb: 300 };

  attributes: Attribute[] = [
    { name: 'Fuerza', key: 'FUE', value: 15, description: 'Poderío físico y fuerza muscular.' },
    { name: 'Destreza', key: 'DES', value: 14, description: 'Agilidad, reflejos y equilibrio.' },
    { name: 'Constitución', key: 'CON', value: 13, description: 'Salud, aguante y puntos de golpe.' },
    { name: 'Inteligencia', key: 'INT', value: 12, description: 'Raciocinio, memoria y erudición.' },
    { name: 'Sabiduría', key: 'SAB', value: 10, description: 'Perspicacia, percepción y fortaleza mental.' },
    { name: 'Carisma', key: 'CAR', value: 8, description: 'Confianza, elocuencia, aplomo y encanto.' }
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

  magicInitiateClass: string = '';
  magicInitiateAbility: string = '';
  magicInitiateCantrips: string[] = [];
  magicInitiateSpell: string = '';

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
    this.route.queryParams.subscribe(params => {
      const editId = params['edit'];
      if (editId) {
        this.characterId = editId;
      }
    });
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
        
        if (this.characterId) {
          this.loadCharacterForEdit(this.characterId);
        } else {
          this.cdr.detectChanges();
        }
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
      this.selectedSubclass = '';
      if (this.isBard()) {
        this.selectedBardCantrips = ['Burla dañina', 'Luces danzantes'];
        this.selectedBardSpells = ['Hechizar persona', 'Palabra de curación', 'Rociada de color', 'Susurros discordantes'];
        this.selectedWarlockCantrips = [];
        this.selectedWarlockSpells = [];
        this.selectedWarlockInvocations = [];
        this.selectedClericCantrips = [];
        this.selectedClericSpells = [];
        this.selectedClericDivineOrder = '';
      } else if (this.isWarlock()) {
        this.selectedWarlockCantrips = ['Descarga sobrenatural', 'Prestidigitación'];
        this.selectedWarlockSpells = ['Maleficio', 'Armadura de Agathys'];
        this.selectedWarlockInvocations = ['Pacto del filo'];
        this.selectedBardCantrips = [];
        this.selectedBardSpells = [];
        this.selectedClericCantrips = [];
        this.selectedClericSpells = [];
        this.selectedClericDivineOrder = '';
      } else if (this.isCleric()) {
        this.selectedClericDivineOrder = 'Protector';
        this.selectedClericCantrips = ['Llama sagrada', 'Luz', 'Taumaturgia'];
        this.selectedClericSpells = ['Bendición', 'Curar heridas', 'Escudo de fe', 'Saeta guía'];
        this.selectedBardCantrips = [];
        this.selectedBardSpells = [];
        this.selectedWarlockCantrips = [];
        this.selectedWarlockSpells = [];
        this.selectedWarlockInvocations = [];
      } else {
        this.selectedBardCantrips = [];
        this.selectedBardSpells = [];
        this.selectedWarlockCantrips = [];
        this.selectedWarlockSpells = [];
        this.selectedWarlockInvocations = [];
        this.selectedClericCantrips = [];
        this.selectedClericSpells = [];
        this.selectedClericDivineOrder = '';
      }
    }
  }

  selectOrigin(index: number): void {
    if (this.selectedOriginIdx !== index) {
      this.selectedOriginIdx = index;
      this.imageLoaded = false;
      this.selectedOriginLineage = '';
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
    if (this.hasMagicInitiateFeat()) {
      this.magicInitiateClass = this.getMagicInitiateDefaultClass() || 'Mago';
    }
  }

  onConfirmOrigin(): void {
    if (this.isOriginLineageRequired() && !this.selectedOriginLineage) {
      alert('Por favor, selecciona un linaje o ancestro dracónico antes de continuar.');
      return;
    }
    this.originChosen = true;
    this.currentStep = 4;
    this.loadRaceSizeInfo();
    this.updateCarryingCapacity();
  }

  onConfirmAttributes(): void {
    if (this.isAttributesSelectionValid()) {
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
      this.loadRaceSizeInfo();
      this.updateCarryingCapacity();
    } else if (step === 5 && this.attributesChosen) {
      this.currentStep = 5;
    } else if (step === 6 && this.equipmentChosen) {
      this.currentStep = 6;
      this.initializeBiographicalData();
    }
  }

  getOriginModifier(key: string): number {
    return 0;
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

  hasMagicInitiateFeat(): boolean {
    if (!this.activeBackground || !this.activeBackground.keyFeat) return false;
    const cleanFeat = this.activeBackground.keyFeat.toLowerCase();
    return cleanFeat.includes('iniciado en la magia') || cleanFeat.includes('magic initiate');
  }

  getMagicInitiateDefaultClass(): string {
    if (!this.activeBackground || !this.activeBackground.keyFeat) return '';
    const feat = this.activeBackground.keyFeat;
    if (feat.includes('Clérigo') || feat.includes('Clerigo')) return 'Clérigo';
    if (feat.includes('Druida')) return 'Druida';
    if (feat.includes('Mago')) return 'Mago';
    return '';
  }

  getEffectiveMagicInitiateClass(): string {
    return this.magicInitiateClass || this.getMagicInitiateDefaultClass() || 'Mago';
  }

  onMagicInitiateClassChange(): void {
    this.magicInitiateCantrips = [];
    this.magicInitiateSpell = '';
  }

  getMagicInitiateCantripsList(): { name: string; desc: string }[] {
    const cls = this.getEffectiveMagicInitiateClass();
    if (cls === 'Clérigo') return this.clericCantripsList;
    if (cls === 'Druida') return this.druidCantripsList;
    return this.magoCantripsList;
  }

  getMagicInitiateSpellsList(): { level: number; name: string; desc: string }[] {
    const cls = this.getEffectiveMagicInitiateClass();
    if (cls === 'Clérigo') return this.clericSpellsList.filter(s => s.level === 1);
    if (cls === 'Druida') return this.druidSpellsList.filter(s => s.level === 1);
    return this.magoSpellsList.filter(s => s.level === 1);
  }

  toggleMagicInitiateCantrip(cantripName: string): void {
    const idx = this.magicInitiateCantrips.indexOf(cantripName);
    if (idx >= 0) {
      this.magicInitiateCantrips.splice(idx, 1);
    } else {
      if (this.magicInitiateCantrips.length < 2) {
        this.magicInitiateCantrips.push(cantripName);
      }
    }
  }

  selectMagicInitiateSpell(spellName: string): void {
    this.magicInitiateSpell = (this.magicInitiateSpell === spellName) ? '' : spellName;
  }

  isMagicInitiateConfigComplete(): boolean {
    if (!this.hasMagicInitiateFeat()) return true;
    const cls = this.getEffectiveMagicInitiateClass();
    if (!cls) return false;
    if (!this.magicInitiateAbility) return false;
    if (this.magicInitiateCantrips.length !== 2) return false;
    if (!this.magicInitiateSpell) return false;
    return true;
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
    this.attributePointsPool = 27;
    this.selectedClassIdx = 0;
    this.selectedOriginIdx = 0;
    this.selectedBackgroundIdx = 0;
    this.selectedOriginLineage = '';
    this.selectedSubclass = '';
    this.attributeMethod = 'array';
    this.attributePool = [
      { value: 15, assignedTo: 'FUE' },
      { value: 14, assignedTo: 'DES' },
      { value: 13, assignedTo: 'CON' },
      { value: 12, assignedTo: 'INT' },
      { value: 10, assignedTo: 'SAB' },
      { value: 8, assignedTo: 'CAR' }
    ];
    this.syncAttributesFromPool();
    this.rolledStats = Array.from({ length: 6 }, () => ({
      dice: [1, 1, 1, 1],
      sortedDice: [1, 1, 1, 1],
      sum: 0,
      rolling: false,
      completed: false,
      discardedIdx: -1
    }));
    this.activeRollIndex = 0;
    this.isRollingAll = false;
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
    this.characterHistory = '';
    this.characterPhysicalDesc = '';
    this.characterHeight = 0;
    this.selectedSizeClass = '';
    this.characterId = null;
    this.characterLevel = 1;
    this.characterName = '';
  }

  loadCharacterForEdit(id: string): void {
    this.characterService.getCharacterById(id).subscribe({
      next: (char) => {
        this.characterName = char.name;
        this.characterLevel = char.level;
        this.characterHistory = char.history;
        this.characterPhysicalDesc = char.physicalDesc;
        this.characterHeight = char.height;
        this.selectedSizeClass = char.sizeClass;

        // Find and select Class
        const classIdx = this.classes.findIndex(c => c.name === char.class);
        if (classIdx !== -1) {
          this.selectedClassIdx = classIdx;
          this.classChosen = true;
        }

        // Find and select Background
        const bgIdx = this.backgrounds.findIndex(b => b.name === char.background);
        if (bgIdx !== -1) {
          this.selectedBackgroundIdx = bgIdx;
          this.backgroundChosen = true;
        }

        // Find and select Origin
        const originIdx = this.origins.findIndex(o => o.name === char.race);
        if (originIdx !== -1) {
          this.selectedOriginIdx = originIdx;
          this.originChosen = true;
        }

        this.selectedOriginLineage = char.originLineage || '';
        this.selectedSubclass = char.subclass || '';

        // Restore Attributes
        if (char.baseStats) {
          this.attributes.forEach(a => {
            const keyMap: { [key: string]: keyof typeof char.baseStats } = {
              'FUE': 'strength',
              'DES': 'dexterity',
              'CON': 'constitution',
              'INT': 'intelligence',
              'SAB': 'wisdom',
              'CAR': 'charisma'
            };
            const mappedKey = keyMap[a.key];
            if (mappedKey && char.baseStats[mappedKey] !== undefined) {
              a.value = char.baseStats[mappedKey];
            }
          });
        }

        // Restore Background Stats Allocation
        if (char.backgroundStatsAllocation) {
          const keyMap: { [key: string]: keyof typeof char.backgroundStatsAllocation } = {
            'FUE': 'strength',
            'DES': 'dexterity',
            'CON': 'constitution',
            'INT': 'intelligence',
            'SAB': 'wisdom',
            'CAR': 'charisma'
          };
          Object.keys(this.backgroundStatsAllocation).forEach((key) => {
            const mappedKey = keyMap[key];
            if (mappedKey && char.backgroundStatsAllocation[mappedKey] !== undefined) {
              this.backgroundStatsAllocation[key as any] = char.backgroundStatsAllocation[mappedKey];
            }
          });
        }

        // Restore skills selection
        this.selectedClassSkills = [...char.classSkills];
        this.skilledFeatSelection = char.skilledFeatSelection ? [...char.skilledFeatSelection] : [];

        // Restore prepared spells if editing
        if (char.preparedSpells) {
          this.selectedBardCantrips = char.preparedSpells.filter(s => 
            this.bardCantripsList.some(c => c.name === s)
          );
          this.selectedBardSpells = char.preparedSpells.filter(s => 
            this.bardSpellsList.some(sp => sp.name === s)
          );

          this.selectedWarlockCantrips = char.preparedSpells.filter(s => 
            this.warlockCantripsList.some(c => c.name === s)
          );
          this.selectedWarlockSpells = char.preparedSpells.filter(s => 
            this.warlockSpellsList.some(sp => sp.name === s)
          );

          this.selectedClericCantrips = char.preparedSpells.filter(s => 
            this.clericCantripsList.some(c => c.name === s)
          );
          this.selectedClericSpells = char.preparedSpells.filter(s => 
            this.clericSpellsList.some(sp => sp.name === s)
          );

          this.selectedDruidCantrips = char.preparedSpells.filter(s => 
            this.druidCantripsList.some(c => c.name === s)
          );
          this.selectedDruidSpells = char.preparedSpells.filter(s => 
            this.druidSpellsList.some(sp => sp.name === s)
          );
          this.selectedRangerSpells = char.preparedSpells.filter(s => 
            this.rangerSpellsList.some(sp => sp.name === s)
          );
          this.selectedPaladinSpells = char.preparedSpells.filter(s => 
            this.paladinSpellsList.some(sp => sp.name === s)
          );
          this.selectedSorcererCantrips = char.preparedSpells.filter(s => 
            this.sorcererSpellsList.some(c => c.name === s && c.level === 0)
          );
          this.selectedSorcererSpells = char.preparedSpells.filter(s => 
            this.sorcererSpellsList.some(sp => sp.name === s && sp.level > 0)
          );
          this.selectedMagoCantrips = char.preparedSpells.filter(s => 
            this.magoCantripsList.some(c => c.name === s)
          );
          this.selectedMagoSpells = char.preparedSpells.filter(s => 
            this.magoSpellsList.some(sp => sp.name === s)
          );
          this.selectedEldritchKnightCantrips = char.preparedSpells.filter(s => 
            this.eldritchKnightCantripsList.some(c => c.name === s)
          );
          this.selectedEldritchKnightSpells = char.preparedSpells.filter(s => 
            this.eldritchKnightSpellsList.some(sp => sp.name === s)
          );
        } else {
          this.selectedBardCantrips = ['Burla dañina', 'Luces danzantes'];
          this.selectedBardSpells = ['Hechizar persona', 'Palabra de curación', 'Rociada de color', 'Susurros discordantes'];
          this.selectedWarlockCantrips = ['Descarga sobrenatural', 'Prestidigitación'];
          this.selectedWarlockSpells = ['Maleficio', 'Armadura de Agathys'];
          this.selectedClericCantrips = ['Llama sagrada', 'Luz', 'Taumaturgia'];
          this.selectedClericSpells = ['Bendición', 'Curar heridas', 'Escudo de fe', 'Saeta guía'];
          this.selectedDruidCantrips = ['Crear llama', 'Saber druídico'];
          this.selectedDruidSpells = ['Curar heridas', 'Encantar animal', 'Fuego feérico', 'Ola atronadora'];
          this.selectedRangerSpells = ['Curar heridas', 'Golpe apresador'];
          this.selectedPaladinSpells = ['Bendición', 'Curar heridas'];
          this.selectedSorcererCantrips = ['Agarre electrizante', 'Estallido mágico', 'Luz', 'Prestidigitación'];
          this.selectedSorcererSpells = ['Detectar magia', 'Manos ardientes'];
          this.selectedMagoCantrips = ['Rayo de escarcha', 'Prestidigitación', 'Salpicadura ácida'];
          this.selectedMagoSpells = ['Proyectil mágico', 'Escudo', 'Detectar magia', 'Armadura de mago', 'Dormir', 'Grasa'];
          this.selectedEldritchKnightCantrips = ['Agarre electrizante', 'Rayo de escarcha'];
          this.selectedEldritchKnightSpells = ['Escudo', 'Manos ardientes', 'Salto'];
        }
        this.selectedWarlockInvocations = char.warlockInvocations ? [...char.warlockInvocations] : ['Pacto del filo'];
        this.selectedSorcererMetamagic = char.sorcererMetamagic ? [...char.sorcererMetamagic] : [];
        this.selectedClericDivineOrder = char.clericDivineOrder || '';
        this.selectedDruidPrimalOrder = char.druidPrimalOrder || '';
        this.selectedRangerFeyGift = char.rangerFeyGift || '';
        this.selectedRangerPrimalCompanion = char.rangerPrimalCompanion || '';

        // Equipment options
        this.equipmentChosen = true;
        this.selectedEquipmentOption = 'A';
        this.selectedBgEquipmentOption = 'A';

        // Go directly to step 6 (Summary)
        this.currentStep = 6;
        this.updateCarryingCapacity();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading character for edit:', err);
        alert('No se pudo cargar el personaje para editar.');
      }
    });
  }

  isDwarfCharacter(): boolean {
    if (!this.activeOrigin) return false;
    return (this.activeOrigin.name || '').toLowerCase().includes('enano');
  }

  hasToughFeat(): boolean {
    if (!this.activeBackground || !this.activeBackground.keyFeat) return false;
    const feat = this.activeBackground.keyFeat.toLowerCase();
    return feat.includes('tough') || feat.includes('dureza') || feat.includes('duro');
  }

  mathFloor(val: number): number {
    return Math.floor(val);
  }

  calculateMaxHp(): number {
    const hitDie = this.getHitDieValue();
    const conMod = this.getFinalModifierValue('CON');
    const level = this.characterLevel || 1;
    
    let baseHp = Math.max(1, hitDie + conMod);
    if (level > 1) {
      const avgHitDie = Math.floor(hitDie / 2) + 1;
      baseHp += Math.max(1, avgHitDie + conMod) * (level - 1);
    }
    
    // Bonificadores adicionales
    if (this.isDwarfCharacter()) {
      baseHp += level;
    }
    
    if (this.hasToughFeat()) {
      baseHp += 2 * level;
    }
    
    return baseHp;
  }

  saveCharacter(): void {
    const userId = this.authService.currentUser()?.id || (this.authService.currentUser() as any)?._id || '';
    if (!userId) {
      alert('Debes iniciar sesión para guardar un personaje.');
      return;
    }

    const finalStatsObj = {
      strength: this.getFinalAttributeScore('FUE'),
      dexterity: this.getFinalAttributeScore('DES'),
      constitution: this.getFinalAttributeScore('CON'),
      intelligence: this.getFinalAttributeScore('INT'),
      wisdom: this.getFinalAttributeScore('SAB'),
      charisma: this.getFinalAttributeScore('CAR'),
    };

    const baseStatsObj = {
      strength: this.attributes.find(a => a.key === 'FUE')?.value || 8,
      dexterity: this.attributes.find(a => a.key === 'DES')?.value || 8,
      constitution: this.attributes.find(a => a.key === 'CON')?.value || 8,
      intelligence: this.attributes.find(a => a.key === 'INT')?.value || 8,
      wisdom: this.attributes.find(a => a.key === 'SAB')?.value || 8,
      charisma: this.attributes.find(a => a.key === 'CAR')?.value || 8,
    };

    const backgroundStatsAllocationObj = {
      strength: this.backgroundStatsAllocation['FUE'] || 0,
      dexterity: this.backgroundStatsAllocation['DES'] || 0,
      constitution: this.backgroundStatsAllocation['CON'] || 0,
      intelligence: this.backgroundStatsAllocation['INT'] || 0,
      wisdom: this.backgroundStatsAllocation['SAB'] || 0,
      charisma: this.backgroundStatsAllocation['CAR'] || 0,
    };

    const characterData: Character = {
      userId,
      name: this.characterName,
      class: this.activeClass.name,
      race: this.activeOrigin.name,
      level: Number(this.characterLevel),
      avatar: '', 
      hp: this.calculateMaxHp(),
      currentHp: this.calculateMaxHp(),
      stats: finalStatsObj,
      baseStats: baseStatsObj,
      backgroundStatsAllocation: backgroundStatsAllocationObj,
      background: this.activeBackground.name,
      originLineage: this.selectedOriginLineage || undefined,
      subclass: this.selectedSubclass || undefined,
      classSkills: this.selectedClassSkills,
      skilledFeatSelection: this.hasSkilledFeat() ? this.skilledFeatSelection : undefined,
      preparedSpells: this.isBard() ? [...this.selectedBardCantrips, ...this.selectedBardSpells] : 
                      this.isWarlock() ? [...this.selectedWarlockCantrips, ...this.selectedWarlockSpells] : 
                      this.isCleric() ? [...this.selectedClericCantrips, ...this.selectedClericSpells] : 
                      this.isDruid() ? [...this.selectedDruidCantrips, ...this.selectedDruidSpells] : 
                      this.isSorcerer() ? [...this.selectedSorcererCantrips, ...this.selectedSorcererSpells] :
                      this.isMago() ? [...this.selectedMagoCantrips, ...this.selectedMagoSpells] :
                      this.isRanger() ? [...this.selectedRangerSpells] : 
                      this.isPaladin() ? [...this.selectedPaladinSpells] : 
                      (this.isFighter() && this.selectedSubclass === 'Caballero Arcano') ? [...this.selectedEldritchKnightCantrips, ...this.selectedEldritchKnightSpells] : undefined,
      warlockInvocations: this.isWarlock() ? this.selectedWarlockInvocations : undefined,
      sorcererMetamagic: this.isSorcerer() ? this.selectedSorcererMetamagic : undefined,
      clericDivineOrder: this.isCleric() ? this.selectedClericDivineOrder : undefined,
      druidPrimalOrder: this.isDruid() ? this.selectedDruidPrimalOrder : undefined,
      rangerFeyGift: this.isRanger() && this.selectedSubclass === 'Errante feérico' ? this.selectedRangerFeyGift : undefined,
      rangerPrimalCompanion: this.isRanger() && this.selectedSubclass === 'Señor de las bestias' ? this.selectedRangerPrimalCompanion : undefined,
      magicInitiateClass: this.hasMagicInitiateFeat() ? this.getEffectiveMagicInitiateClass() : undefined,
      magicInitiateAbility: this.hasMagicInitiateFeat() ? this.magicInitiateAbility : undefined,
      magicInitiateCantrips: this.hasMagicInitiateFeat() ? this.magicInitiateCantrips : undefined,
      magicInitiateSpell: this.hasMagicInitiateFeat() ? this.magicInitiateSpell : undefined,
      history: this.characterHistory,
      physicalDesc: this.characterPhysicalDesc,
      height: this.characterHeight,
      sizeClass: this.selectedSizeClass,
    };

    if (this.characterId) {
      this.characterService.updateCharacter(this.characterId, characterData).subscribe({
        next: (res) => {
          alert(`¡Personaje ${res.name} actualizado con éxito!`);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar el personaje: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.characterService.createCharacter(characterData).subscribe({
        next: (res) => {
          alert(`¡Personaje ${res.name} forjado y guardado con éxito!`);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear el personaje: ' + (err.error?.message || err.message));
        }
      });
    }
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
    if (!this.activeClass || !this.activeClass.hitDie) return 8;
    const clean = this.activeClass.hitDie.replace(/[^0-9]/g, '');
    const num = Number(clean);
    return isNaN(num) || num === 0 ? 8 : num;
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
        skills: 'Elige dos entre: Historia, Medicina, Perspicacia, Persuasión, o Religión.',
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
        skills: 'Elige dos entre: Acrobacias, Atletismo, Historia, Perspicacia, Religión, o Sigilo.',
        tools: 'Una: herramienta de artesano o instrumento musical.',
        armor: 'Ninguna',
        weapons: 'Sencillas, marciales con la propiedad "ligera"'
      };
    }
    if (n.includes('paladín') || n.includes('paladin')) {
      return {
        savingThrows: 'Sabiduría y Carisma',
        skills: 'Elige dos entre: Atletismo, Intimidación, Medicina, Perspicacia, Persuasión, o Religión.',
        tools: 'Ninguna',
        armor: 'Ligeras, medias, pesadas, escudos',
        weapons: 'Sencillas, marciales'
      };
    }
    if (n.includes('pícaro') || n.includes('picaro')) {
      return {
        savingThrows: 'Destreza e Inteligencia',
        skills: 'Elige cuatro entre: Acrobacias, Atletismo, Engaño, Intimidación, Investigación, Juego de manos, Percepción, Perspicacia, Persuasión, o Sigilo.',
        tools: 'Herramientas de ladrón',
        armor: 'Armaduras ligeras',
        weapons: 'Armas sencillas y marciales ligeras o sutiles'
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
        optionA: 'Camisa de malla, escudo, maza, paquete de sacerdote, símbolo sagrado y 7 po.',
        optionB: '110 po'
      };
    }
    if (n.includes('druida')) {
      return {
        optionA: 'Armadura de cuero, escudo, hoz, canalizador druídico (bastón), paquete de explorador, útiles de herborista y 9 po.',
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
        optionA: 'Cota de malla, espadón, mangual, 8 jabalinas, paquete de explorador de mazmorras y 4 po.',
        optionB: 'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, paquete de explorador de mazmorras y 11 po.'
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
        optionA: 'Lanza, 5 dagas, herramientas de artesano o instrumento musical, paquete de explorador y 11 po.',
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
      this.initializeBiographicalData();
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
      return ['Historia', 'Medicina', 'Perspicacia', 'Persuasión', 'Religión'];
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
      return ['Acrobacias', 'Atletismo', 'Historia', 'Perspicacia', 'Religión', 'Sigilo'];
    }
    if (n.includes('paladín') || n.includes('paladin')) {
      return ['Atletismo', 'Intimidación', 'Medicina', 'Perspicacia', 'Persuasión', 'Religión'];
    }
    if (n.includes('pícaro') || n.includes('picaro')) {
      return ['Acrobacias', 'Atletismo', 'Engaño', 'Intimidación', 'Investigación', 'Juego de manos', 'Percepción', 'Perspicacia', 'Persuasión', 'Sigilo'];
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

  parseEquipmentText(text: string): { individualItems: string[], packages: { title: string, items: string[] }[] } {
    const individualItems: string[] = [];
    const packages: { title: string, items: string[] }[] = [];

    if (!text || text === '—' || text.startsWith('Oro Inicial')) {
      return { individualItems, packages };
    }

    let normalizedText = text.trim();
    if (normalizedText.endsWith('.')) {
      normalizedText = normalizedText.substring(0, normalizedText.length - 1);
    }
    
    // Replace " y " (and) with a comma so we can split easily
    let processed = normalizedText.replace(/,\s*y\s+/gi, ',').replace(/\s+y\s+/gi, ',');
    const parts = processed.split(',');

    for (let part of parts) {
      part = part.trim();
      if (!part) continue;

      let matchedPack = false;
      const lowerPart = part.toLowerCase();

      // Check if it's one of the packages
      for (const key of Object.keys(DND_PACKAGES)) {
        if (lowerPart.includes(key)) {
          packages.push({
            title: DND_PACKAGES[key].title,
            items: [...DND_PACKAGES[key].items]
          });
          matchedPack = true;
          break;
        }
      }

      if (!matchedPack) {
        // Capitalize first letter of the individual item
        const capitalized = part.charAt(0).toUpperCase() + part.slice(1);
        individualItems.push(capitalized);
      }
    }

    return { individualItems, packages };
  }

  getMergedIndividualItems(): { name: string, quantity: number }[] {
    const itemsMap = new Map<string, number>();

    const addIndividualItems = (text: string) => {
      const { individualItems } = this.parseEquipmentText(text);
      for (const item of individualItems) {
        let qty = 1;
        let itemName = item;
        
        // Match starting number (e.g., "6 jabalinas")
        const numStartMatch = item.match(/^(\d+)\s+(.+)$/);
        if (numStartMatch) {
          qty = parseInt(numStartMatch[1], 10);
          itemName = numStartMatch[2];
        } else {
          // Match parenthesis quantity (e.g. "aceite (3 frascos)", "pergamino (10 hojas)")
          const parenMatch = item.match(/^(.+)\s*\((\d+)\s+([^)]+)\)$/);
          if (parenMatch) {
            const base = parenMatch[1].trim().toLowerCase();
            const unit = parenMatch[3].trim().toLowerCase();
            if (base === 'pergamino') {
              itemName = 'hoja de pergamino';
            } else if (base === 'aceite') {
              itemName = 'frasco de aceite';
            } else {
              itemName = `${base} (${unit})`;
            }
            qty = parseInt(parenMatch[2], 10);
          }
        }
        
        itemName = itemName.trim().toLowerCase();
        itemName = itemName.replace(/^(un|una|unos|unas)\s+/, '');
        
        // Filter out gold/coins from the final list
        if (/^\d+\s*po$/i.test(itemName) || itemName === 'po' || itemName.includes('po')) {
          continue;
        }
        
        // Normalize names for duplication detection
        if (itemName === 'dagas') itemName = 'daga';
        if (itemName === 'flechas') itemName = 'flecha';
        if (itemName === 'virotes') itemName = 'virote';
        if (itemName === 'bolsas') itemName = 'bolsa';
        if (itemName === 'jabalinas') itemName = 'jabalina';
        if (itemName === 'disfraces') itemName = 'disfraz';
        if (itemName === 'hachas de mano') itemName = 'hacha de mano';
        if (itemName === 'hojas de pergamino' || itemName === 'pergamino (hojas)' || itemName === 'pergamino') itemName = 'hoja de pergamino';
        if (itemName === 'frascos de aceite' || itemName === 'aceite (frascos)' || itemName === 'aceite') itemName = 'frasco de aceite';
        if (itemName === 'útiles de herborista' || itemName === 'útiles para herborista') itemName = 'útiles de herborista';
        if (itemName === 'carcaj' || itemName === 'aljaba') itemName = 'carcaj / aljaba';
        if (itemName === 'ropa de viaje' || itemName === 'ropas de viaje') itemName = 'ropas de viaje';
        if (itemName === 'ropa de calidad' || itemName === 'ropas de calidad') itemName = 'ropas de calidad';
        
        const existingQty = itemsMap.get(itemName) || 0;
        itemsMap.set(itemName, existingQty + qty);
      }
    };

    if (this.selectedEquipmentOption === 'A') {
      const classEquip = this.getClassEquipmentOptions(this.activeClass.name).optionA;
      addIndividualItems(classEquip);
    }
    if (this.selectedBgEquipmentOption === 'A') {
      const bgEquip = this.getBgEquipmentOptions(this.activeBackground.name).optionA;
      addIndividualItems(bgEquip);
    }

    const mergedList: { name: string, quantity: number }[] = [];
    itemsMap.forEach((qty, name) => {
      let displayName = name.charAt(0).toUpperCase() + name.slice(1);
      
      if (qty > 1) {
        if (displayName === 'Arco corto') displayName = 'Arcos cortos';
        else if (displayName === 'Daga') displayName = 'Dagas';
        else if (displayName === 'Escudo') displayName = 'Escudos';
        else if (displayName === 'Espada corta') displayName = 'Espadas cortas';
        else if (displayName === 'Espada larga') displayName = 'Espadas largas';
        else if (displayName === 'Bastón') displayName = 'Bastones';
        else if (displayName === 'Lanza') displayName = 'Lanzas';
        else if (displayName === 'Carcaj / aljaba') displayName = 'Carcajes / aljabas';
        else if (displayName === 'Bolsa') displayName = 'Bolsas';
        else if (displayName === 'Disfraz') displayName = 'Disfraces';
        else if (displayName === 'Hacha de mano') displayName = 'Hachas de mano';
        else if (displayName === 'Hoja de pergamino') displayName = 'Hojas de pergamino';
        else if (displayName === 'Frasco de aceite') displayName = 'Frascos de aceite';
        else if (displayName === 'Paquete de explorador') displayName = 'Paquetes de explorador';
        else if (displayName === 'Paquete de artista') displayName = 'Paquetes de artista';
        else if (displayName === 'Paquete de erudito') displayName = 'Paquetes de erudito';
        else if (displayName === 'Paquete de sacerdote') displayName = 'Paquetes de sacerdote';
        else if (displayName === 'Paquete de ladrón') displayName = 'Paquetes de ladrón';
      }
      
      mergedList.push({ name: displayName, quantity: qty });
    });

    return mergedList;
  }

  getSelectedPackages(): { title: string, items: string[] }[] {
    const packages: { title: string, items: string[] }[] = [];

    if (this.selectedEquipmentOption === 'A') {
      const classEquip = this.getClassEquipmentOptions(this.activeClass.name).optionA;
      const parsed = this.parseEquipmentText(classEquip);
      packages.push(...parsed.packages);
    }
    if (this.selectedBgEquipmentOption === 'A') {
      const bgEquip = this.getBgEquipmentOptions(this.activeBackground.name).optionA;
      const parsed = this.parseEquipmentText(bgEquip);
      packages.push(...parsed.packages);
    }

    return packages;
  }

  isOriginLineageRequired(): boolean {
    if (!this.activeOrigin || !this.activeOrigin.name) return false;
    const name = this.activeOrigin.name.toLowerCase();
    return name.includes('elfo') || 
           name.includes('dracónido') || 
           name.includes('draconido') || 
           name.includes('gnomo') || 
           name.includes('goliat') ||
           name.includes('tiflin') ||
           name.includes('tiefling');
  }

  isBarbarianLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isBarb = name.includes('bárbaro') || name.includes('barbaro');
    return isBarb && Number(this.characterLevel) >= 3;
  }

  isBardLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isBard = name.includes('bardo');
    return isBard && Number(this.characterLevel) >= 3;
  }

  isWarlockLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isWarlock = name.includes('brujo');
    return isWarlock && Number(this.characterLevel) >= 3;
  }

  isClericLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isCleric = name.includes('clérigo') || name.includes('clerigo');
    return isCleric && Number(this.characterLevel) >= 3;
  }

  isDruidLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isDruid = name.includes('druida');
    return isDruid && Number(this.characterLevel) >= 3;
  }

  isRangerLvl3(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    const isRanger = name.includes('explorador');
    return isRanger && Number(this.characterLevel) >= 3;
  }

  isRangerSubclassConfigComplete(): boolean {
    if (!this.isRanger() || Number(this.characterLevel) < 3) return true;
    if (this.selectedSubclass === 'Errante feérico') {
      return !!this.selectedRangerFeyGift;
    }
    if (this.selectedSubclass === 'Señor de las bestias') {
      return !!this.selectedRangerPrimalCompanion;
    }
    return true;
  }

  isFighterSubclassConfigComplete(): boolean {
    if (!this.isFighter() || Number(this.characterLevel) < 3) return true;
    if (this.selectedSubclass === 'Caballero Arcano') {
      const cantripsLimit = this.getEldritchKnightCantripsLimit();
      const spellsLimit = this.getEldritchKnightSpellsLimit();
      return this.selectedEldritchKnightCantrips.length === cantripsLimit &&
             this.selectedEldritchKnightSpells.length === spellsLimit;
    }
    return true;
  }

  isSubclassRequired(): boolean {
    const level = Number(this.characterLevel);
    if (level < 3) return false;
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase();
    return name.includes('bárbaro') || name.includes('barbaro') ||
           name.includes('bardo') ||
           name.includes('brujo') ||
           name.includes('clérigo') || name.includes('clerigo') ||
           name.includes('druida') ||
           name.includes('explorador') ||
           name.includes('guerrero') ||
           name.includes('hechicero') ||
           name.includes('mago') ||
           name.includes('paladín') || name.includes('paladin');
  }

  getOriginManualAttributes(name: string): { title: string, desc: string }[] {
    if (!name) return [];
    const n = name.toLowerCase();
    if (n.includes('elfo')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,5 y 1,8 m de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Linaje Feérico', desc: 'Tienes ventaja en las tiradas de salvación para evitar o poner fin al estado de hechizado.' },
        { title: 'Sentidos Agudos', desc: 'Tienes competencia en la habilidad de Percepción, Perspicacia o Supervivencia.' },
        { title: 'Trance', desc: 'No necesitas dormir y la magia no puede dormirte. Finalizas un descanso largo en 4 horas de meditación.' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 18 m.' }
      ];
    }
    if (n.includes('enano')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,2 y 1,5 m de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Afinidad con la Piedra', desc: 'Como acción adicional, ganas la capacidad de sentir vibraciones con un alcance de 18 m durante 10 minutos (usos igual a tu bonificador de competencia, se recuperan con descanso largo).' },
        { title: 'Aguante Enano', desc: 'Tus puntos de golpe máximos se incrementan en 1 y aumentarán en 1 más cada vez que subas un nivel.' },
        { title: 'Resistencia Enana', desc: 'Resistencia al daño por veneno y ventaja en tiradas de salvación contra envenenado.' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 36 m.' }
      ];
    }
    if (n.includes('dracónido') || n.includes('draconido')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,5 y 2,1 m de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Ataque de Aliento', desc: 'Exhalación elemental en cono de 4.5m o línea de 9m (daño 1d10, tirada Destreza CD 8 + Constitución + Competencia).' },
        { title: 'Resistencia al Daño', desc: 'Resistencia al daño determinado por tu ancestro dracónico.' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 18 m.' },
        { title: 'Vuelo Dracónico', desc: 'A partir de nivel 5, puedes canalizar magia dracónica para brotar alas espectrales y volar durante 10 minutos (1 vez por descanso largo).' }
      ];
    }
    if (n.includes('humano')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,2 y 2,1 m) o Pequeño (entre 60 cm y 1,2 m), elegido al seleccionar la especie.' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Diestro', desc: 'Ganas competencia en una habilidad de tu elección.' },
        { title: 'Ingenioso', desc: 'Obtienes inspiración heroica tras finalizar un descanso largo.' },
        { title: 'Versátil', desc: 'Obtienes una dote de origen de tu elección (se recomienda la dote Habilidoso).' }
      ];
    }
    if (n.includes('mediano')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Pequeño (entre 60 y 90 cm de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Agilidad de Mediano', desc: 'Puedes moverte a través del espacio ocupado por cualquier criatura de tamaño superior al tuyo (no puedes terminar tu movimiento en su espacio).' },
        { title: 'Fortuna', desc: 'Cuando sacas un 1 natural en una prueba de d20 (ataque, habilidad o salvación), puedes volver a tirar el dado y usar el nuevo resultado.' },
        { title: 'Sigiloso por Naturaleza', desc: 'Puedes realizar la acción de esconderte incluso si estás oculto tras una criatura de al menos una categoría de tamaño superior a la tuya.' },
        { title: 'Valiente', desc: 'Tienes ventaja en tiradas de salvación para evitar o poner fin al estado de asustado.' }
      ];
    }
    if (n.includes('orco')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,8 y 2,1 m de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Aguante Incansable', desc: 'Cuando tus puntos de golpe se reducen a 0 pero no mueres, puedes recuperar 1 punto de golpe (1 vez por descanso largo).' },
        { title: 'Descarga de Adrenalina', desc: 'Puedes realizar la acción de Correr como acción adicional. Al hacerlo, ganas puntos de golpe temporales igual a tu bonificador por competencia (usos por competencia, se recuperan con descanso corto o largo).' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 36 m.' }
      ];
    }
    if (n.includes('gnomo')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Pequeño (entre 90 cm y 1,2 m de altura)' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Astucia Gnoma', desc: 'Tienes ventaja en las tiradas de salvación de Inteligencia, Sabiduría y Carisma.' },
        { title: 'Linaje Gnomo', desc: 'Elige un linaje que te otorga capacidades sobrenaturales adicionales. Tu Inteligencia, Sabiduría o Carisma será tu aptitud mágica para los conjuros de linaje.' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 18 m.' }
      ];
    }
    if (n.includes('goliat')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 2,1 y 2,4 m de altura)' },
        { title: 'Velocidad', desc: '10,5 m' },
        { title: 'Constitución Poderosa', desc: 'Tienes ventaja en salvaciones para poner fin al estado de agarrado. Para la capacidad de carga, cuentas como si fueses una categoría de tamaño superior.' },
        { title: 'Forma Grande', desc: 'A partir de nivel 5, puedes cambiar tu tamaño a Grande como acción adicional (dura 10 mins). Obtienes ventaja en pruebas de Fuerza y +3m de velocidad (1 uso por descanso largo).' },
        { title: 'Linaje Gigante', desc: 'Elige un linaje de ancestro gigante que te otorga un beneficio sobrenatural activo por competencia veces al día.' }
      ];
    }
    if (n.includes('tiefling') || n.includes('tiflin')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,2 y 2,1 m) o Pequeño (entre 90 cm y 1,2 m), elegido al seleccionar la especie.' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Legado Infernal', desc: 'Elige un legado de la tabla "Legados infernales" (Abisal, Ctónico o Infernal). Obtienes resistencias y conjuros según el legado seleccionado. Inteligencia, Sabiduría o Carisma es tu aptitud mágica para ellos.' },
        { title: 'Presencia Sobrenatural', desc: 'Conoces el truco taumaturgia (usa la misma aptitud mágica que Legado Infernal).' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 18 m.' }
      ];
    }
    if (n.includes('aasimar')) {
      return [
        { title: 'Tipo de Criatura', desc: 'Humanoide' },
        { title: 'Tamaño', desc: 'Mediano (entre 1,2 y 2,1 m de altura) o Pequeño (entre 60 cm y 1,2 m de altura), elegido al seleccionar la especie.' },
        { title: 'Velocidad', desc: '9 m' },
        { title: 'Manos Curativas', desc: 'Como acción de magia, tocas a una criatura y tiras d4s igual a tu bonificador por competencia. Se recuperan Puntos de Golpe igual al total (1 vez por descanso largo).' },
        { title: 'Portador de Luz', desc: 'Conoces el truco luz (Carisma es tu aptitud mágica).' },
        { title: 'Resistencia Celestial', desc: 'Resistencia al daño necrótico y al daño radiante.' },
        { title: 'Visión en la Oscuridad', desc: 'Tienes visión en la oscuridad hasta 18 m.' },
        { title: 'Revelación Celestial', desc: 'A partir de nivel 3, puedes transformarte como acción adicional durante 1 minuto. Puedes infligir daño adicional igual a tu BC una vez por turno (daño necrótico o radiante según la opción de transformación). Se recupera con descanso largo.' }
      ];
    }
    return [];
  }

  elvenLineages = [
    { name: 'Alto elfo', desc: 'Truco prestidigitación. Nivel 3: Detectar magia, Nivel 5: Paso brumoso.' },
    { name: 'Drow', desc: 'Visión en la oscuridad 36m, truco luces danzantes. Nivel 3: Fuego feérico, Nivel 5: Oscuridad.' },
    { name: 'Elfo de los bosques', desc: 'Velocidad +1.5m (10.5m total), truco saber druídico. Nivel 3: Zancada prodigiosa, Nivel 5: Pasar sin rastro.' }
  ];

  dragonLineages = [
    { name: 'Rojo', element: 'Fuego' },
    { name: 'Oro', element: 'Fuego' },
    { name: 'Oropel', element: 'Fuego' },
    { name: 'Azul', element: 'Relámpago' },
    { name: 'Bronce', element: 'Relámpago' },
    { name: 'Blanco', element: 'Frío' },
    { name: 'Plata', element: 'Frío' },
    { name: 'Cobre', element: 'Ácido' },
    { name: 'Negro', element: 'Ácido' },
    { name: 'Verde', element: 'Veneno' }
  ];

  gnomeLineages = [
    { name: 'Gnomo de las rocas', desc: 'Trucos prestidigitación y reparar. Crea un dispositivo mecánico Diminuto (CA 5, 1 pg) con efecto mágico.' },
    { name: 'Gnomo de los bosques', desc: 'Truco ilusión menor. Lanza hablar con los animales de forma gratuita un número de veces igual a tu bonificador por competencia.' }
  ];

  goliathLineages = [
    { name: 'Gigante de Fuego (Abrasión del fuego)', desc: 'Al golpear a un objetivo, puedes causarle 1d10 daño de fuego adicional (usos igual a tu bonificador por competencia).' },
    { name: 'Gigante de las Colinas (Caída de las colinas)', desc: 'Al golpear a una criatura Grande o menor, puedes infligirle el estado de derribada (usos igual a tu bonificador por competencia).' },
    { name: 'Gigante de las Nubes (Excursión de las nubes)', desc: 'Acción adicional: te teletransportas mágicamente hasta 9 m a un espacio vacío (usos igual a tu bonificador por competencia).' },
    { name: 'Gigante de Escarcha (Frío de la escarcha)', desc: 'Al golpear a un objetivo, causas 1d6 daño de frío y reduces su velocidad 3m (usos igual a tu bonificador por competencia).' },
    { name: 'Gigante de Piedra (Resistencia de la piedra)', desc: 'Reacción al recibir daño: tiras 1d12 + mod Constitución y reduces el daño recibido en ese total (usos igual a tu bonificador por competencia).' },
    { name: 'Gigante de las Tormentas (Trueno de la tormenta)', desc: 'Reacción cuando una criatura a 18 m o menos te causa daño: le infliges 1d8 daño de trueno (usos igual a tu bonificador por competencia).' }
  ];

  tieflingLineages = [
    { name: 'Abisal', desc: 'Resistencia al veneno y truco rociada venenosa. Nivel 3: Rayo nauseabundo. Nivel 5: Inmovilizar persona.' },
    { name: 'Ctónico', desc: 'Resistencia a necrótico y truco toque helado. Nivel 3: Falsa vida. Nivel 5: Rayo debilitador.' },
    { name: 'Infernal', desc: 'Resistencia al fuego y truco descarga de fuego. Nivel 3: Reprensión infernal. Nivel 5: Oscuridad.' }
  ];

  aasimarLineages = [
    { name: 'Alas celestiales', desc: 'Dos alas espectrales brotan temporalmente. Obtienes una velocidad de vuelo igual a tu velocidad actual y tu daño adicional es radiante.' },
    { name: 'Fulgor interior', desc: 'Emites luz brillante en radio de 3m. Al final de tu turno, enemigos a 3m o menos reciben daño radiante igual a tu BC. Daño adicional es radiante.' },
    { name: 'Mortaja necrótica', desc: 'Tus ojos se vuelven pozos de oscuridad. Criaturas a 3m o menos deben superar salvación de Carisma (CD 8 + Car + BC) o asustarse. Daño adicional es necrótico.' }
  ];

  initializeBiographicalData(): void {
    const sizeInfo = this.activeSizeInfo || { sizes: [{ name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano' }] };
    if (!this.selectedSizeClass || !sizeInfo.sizes.some((s: any) => s.name === this.selectedSizeClass)) {
      this.selectedSizeClass = sizeInfo.sizes[0].name;
    }
    const currentSize = sizeInfo.sizes.find((s: any) => s.name === this.selectedSizeClass) || sizeInfo.sizes[0];
    if (this.characterHeight < currentSize.min || this.characterHeight > currentSize.max) {
      this.characterHeight = Math.round(((currentSize.min + currentSize.max) / 2) * 100) / 100;
    }
    this.updateCarryingCapacity();
  }

  onSizeClassChange(): void {
    const sizeInfo = this.activeSizeInfo || { sizes: [{ name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano' }] };
    const currentSize = sizeInfo.sizes.find((s: any) => s.name === this.selectedSizeClass) || sizeInfo.sizes[0];
    this.characterHeight = Math.round(((currentSize.min + currentSize.max) / 2) * 100) / 100;
    this.updateCarryingCapacity();
  }

  getMinHeight(): number {
    const sizeInfo = this.activeSizeInfo || { sizes: [{ name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano' }] };
    const size = sizeInfo.sizes.find((s: any) => s.name === this.selectedSizeClass) || sizeInfo.sizes[0];
    return size ? size.min : 0.6;
  }

  getMaxHeight(): number {
    const sizeInfo = this.activeSizeInfo || { sizes: [{ name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano' }] };
    const size = sizeInfo.sizes.find((s: any) => s.name === this.selectedSizeClass) || sizeInfo.sizes[0];
    return size ? size.max : 2.4;
  }

  getSizeDescription(): string {
    const sizeInfo = this.activeSizeInfo || { sizes: [{ name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano' }] };
    const size = sizeInfo.sizes.find((s: any) => s.name === this.selectedSizeClass) || sizeInfo.sizes[0];
    return size ? size.description : '';
  }

  getSizeLetter(sizeName: string): string {
    const s = (sizeName || '').toLowerCase().trim();
    if (s === 'diminuto') return 'D';
    if (s === 'pequeño') return 'P';
    if (s === 'mediano') return 'M';
    if (s === 'grande') return 'G';
    if (s === 'enorme') return 'E';
    if (s === 'gargantuesco') return 'Gr';
    return 'M';
  }

  getSizeFullName(letter: string): string {
    const l = (letter || '').trim();
    if (l === 'D') return 'Diminuto';
    if (l === 'P') return 'Pequeño';
    if (l === 'M') return 'Mediano';
    if (l === 'G') return 'Grande';
    if (l === 'E') return 'Enorme';
    if (l === 'Gr') return 'Gargantuesco';
    return 'Mediano';
  }

  loadRaceSizeInfo(): void {
    if (!this.activeOrigin || !this.activeOrigin.name) return;
    this.gameDataService.getRaceSizeInfo(this.activeOrigin.name).subscribe(info => {
      this.activeSizeInfo = info;
      this.initializeBiographicalData();
      this.cdr.detectChanges();
    });
  }

  updateCarryingCapacity(): void {
    const strength = this.getFinalAttributeScore('FUE');
    const sizeClass = this.selectedSizeClass || 'Mediano';
    const isGoliath = (this.activeOrigin?.name || '').toLowerCase().includes('goliat');
    
    this.gameDataService.calculateCarryingCapacity(strength, sizeClass, isGoliath).subscribe(cap => {
      this.carryingCapacity = cap;
      this.cdr.detectChanges();
    });
  }

  changeAttributeMethod(method: 'array' | 'random' | 'buy'): void {
    this.attributeMethod = method;
    if (method === 'array') {
      this.attributePool = [
        { value: 15, assignedTo: 'FUE' },
        { value: 14, assignedTo: 'DES' },
        { value: 13, assignedTo: 'CON' },
        { value: 12, assignedTo: 'INT' },
        { value: 10, assignedTo: 'SAB' },
        { value: 8, assignedTo: 'CAR' }
      ];
      this.syncAttributesFromPool();
    } else if (method === 'random') {
      this.attributePool = [];
      this.rolledStats = Array.from({ length: 6 }, () => ({
        dice: [1, 1, 1, 1],
        sortedDice: [1, 1, 1, 1],
        sum: 0,
        rolling: false,
        completed: false,
        discardedIdx: -1
      }));
      this.activeRollIndex = 0;
      this.isRollingAll = false;
      this.attributes.forEach(a => a.value = 8);
    } else if (method === 'buy') {
      this.attributes.forEach(a => a.value = 8);
      this.attributePointsPool = 27;
    }
    this.updateCarryingCapacity();
  }

  assignPoolValue(attrKey: string, poolIndex: number | string): void {
    const idx = poolIndex === '' || poolIndex === null ? null : Number(poolIndex);
    const prevItemIdx = this.attributePool.findIndex(item => item.assignedTo === attrKey);
    
    if (idx === null) {
      if (prevItemIdx !== -1) {
        this.attributePool[prevItemIdx].assignedTo = null;
      }
    } else {
      const newAssignedAttr = this.attributePool[idx].assignedTo;
      if (newAssignedAttr && newAssignedAttr !== attrKey) {
        if (prevItemIdx !== -1) {
          this.attributePool[prevItemIdx].assignedTo = newAssignedAttr;
        } else {
          this.attributePool[idx].assignedTo = null;
        }
      } else {
        if (prevItemIdx !== -1) {
          this.attributePool[prevItemIdx].assignedTo = null;
        }
      }
      this.attributePool[idx].assignedTo = attrKey;
    }
    this.syncAttributesFromPool();
    this.updateCarryingCapacity();
  }

  syncAttributesFromPool(): void {
    this.attributes.forEach(attr => {
      const poolItem = this.attributePool.find(item => item.assignedTo === attr.key);
      attr.value = poolItem ? poolItem.value : 8;
    });
  }

  modifyAttributePointBuy(key: string, amount: number): void {
    const attr = this.attributes.find(a => a.key === key);
    if (!attr) return;
    
    const currentVal = attr.value;
    const newVal = currentVal + amount;
    
    if (newVal < 8 || newVal > 15) return;
    
    const currentCost = this.pointBuyCosts[currentVal] || 0;
    const newCost = this.pointBuyCosts[newVal] || 0;
    const costDiff = newCost - currentCost;
    
    const currentSpent = this.getPointBuyPointsSpent();
    if (currentSpent + costDiff > 27) {
      return;
    }
    
    attr.value = newVal;
    this.attributePointsPool = 27 - this.getPointBuyPointsSpent();
    this.updateCarryingCapacity();
  }

  getPointBuyPointsSpent(): number {
    let total = 0;
    this.attributes.forEach(attr => {
      total += this.pointBuyCosts[attr.value] || 0;
    });
    return total;
  }

  isAttributesSelectionValid(): boolean {
    if (this.attributeMethod === 'buy') {
      return this.getPointBuyPointsSpent() === 27;
    }
    const assignedCount = this.attributePool.filter(item => item.assignedTo !== null).length;
    return assignedCount === 6;
  }

  getAttributePoolIndexFor(attrKey: string): number | string {
    const idx = this.attributePool.findIndex(item => item.assignedTo === attrKey);
    return idx === -1 ? '' : idx;
  }

  rollDiceStats(): void {
    if (this.activeRollIndex >= 6 || this.isRollingAll) return;
    
    this.isRollingAll = true;
    const currentRoll = this.rolledStats[this.activeRollIndex];
    currentRoll.rolling = true;
    currentRoll.completed = false;
    
    const interval = setInterval(() => {
      currentRoll.dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    }, 60);

    this.gameDataService.rollSingleStat().subscribe({
      next: (res) => {
        setTimeout(() => {
          clearInterval(interval);
          
          currentRoll.dice = res.dice;
          currentRoll.sortedDice = res.sortedDice;
          currentRoll.sum = res.sum;
          currentRoll.discardedIdx = res.discardedIdx;
          
          currentRoll.rolling = false;
          currentRoll.completed = true;
          this.isRollingAll = false;
          
          this.attributePool.push({ value: res.sum, assignedTo: null });
          
          this.activeRollIndex++;
          this.updateCarryingCapacity();
          this.cdr.detectChanges();
        }, 1000);
      },
      error: (err) => {
        clearInterval(interval);
        currentRoll.rolling = false;
        this.isRollingAll = false;
        alert('Error al lanzar los dados en el servidor.');
      }
    });
  }

  getDiscardedIdx(rollIndex: number): number {
    const roll = this.rolledStats[rollIndex];
    return roll ? roll.discardedIdx : -1;
  }

  getDiscardedDieValue(rollIndex: number): number {
    const roll = this.rolledStats[rollIndex];
    if (!roll || roll.discardedIdx === undefined || roll.discardedIdx === -1) return 0;
    return roll.dice[roll.discardedIdx] || 0;
  }

  getSuggestedAdjectives(): { attribute: string; score: number; type: 'Alta' | 'Baja'; adjectives: string[] }[] {
    const list = [];
    const adjMap: { [key: string]: { high: string[], low: string[] } } = {
      FUE: { high: ['Musculoso', 'Fibroso', 'Protector', 'Directo'], low: ['Débil', 'Flaco', 'Apocado', 'Evasivo'] },
      DES: { high: ['Ágil', 'Dinámico', 'Inquieto', 'Equilibrado'], low: ['Nervioso', 'Torpe', 'Indeciso', 'Inseguro'] },
      CON: { high: ['Enérgico', 'Saludable', 'Afable', 'Estable'], low: ['Frágil', 'Aprensivo', 'Apático', 'Vulnerable'] },
      INT: { high: ['Decidido', 'Lógico', 'Instructivo', 'Curioso'], low: ['Tosco', 'Ilógico', 'Ignorante', 'Frívolo'] },
      SAB: { high: ['Sereno', 'Considerado', 'Atento', 'Precavido'], low: ['Impulsivo', 'Distraído', 'Impasible', 'Ingenuo'] },
      CAR: { high: ['Encantador', 'Dominante', 'Divertido', 'Inspirador'], low: ['Pedante', 'Soso', 'Reservado', 'Insensible'] }
    };

    for (const attr of this.attributes) {
      const score = this.getFinalAttributeScore(attr.key);
      const isHigh = score >= 11;
      list.push({
        attribute: attr.name,
        score,
        type: isHigh ? 'Alta' as const : 'Baja' as const,
        adjectives: isHigh ? adjMap[attr.key].high : adjMap[attr.key].low
      });
    }
    return list;
  }

  hasWeaponMastery(): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const name = this.activeClass.name.toLowerCase().trim();
    return name.includes('guerrero') || 
           name.includes('bárbaro') || name.includes('barbaro') || 
           name.includes('explorador') || 
           name.includes('paladín') || name.includes('paladin') || 
           name.includes('pícaro') || name.includes('picaro');
  }

  isProficientWithWeapon(weaponName: string, category: 'sencilla' | 'marcial'): boolean {
    if (!this.activeClass || !this.activeClass.name) return false;
    const className = this.activeClass.name.toLowerCase();
    
    if (className.includes('guerrero') || className.includes('bárbaro') || className.includes('barbaro') ||
        className.includes('paladín') || className.includes('paladin') || className.includes('explorador')) {
      return true;
    }
    
    if (className.includes('pícaro') || className.includes('picaro')) {
      return true;
    }

    if (category === 'sencilla') return true;

    if (className.includes('bardo')) {
      const lower = weaponName.toLowerCase();
      return lower.includes('estoque') || lower.includes('espada corta') || lower.includes('espada larga') || lower.includes('daga');
    }

    return false;
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
        const profBonus = isProficient ? 2 : 0;
        
        let abilityModKey = 'FUE';
        let abilityModValue = this.getFinalModifierValue('FUE');
        
        if (weaponData.type === 'a distancia') {
          abilityModKey = 'DES';
          abilityModValue = this.getFinalModifierValue('DES');
        } else if (weaponData.finesse) {
          const strMod = this.getFinalModifierValue('FUE');
          const dexMod = this.getFinalModifierValue('DES');
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
}
