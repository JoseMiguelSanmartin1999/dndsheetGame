import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';

interface MockCharacter {
  id: string;
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
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#08080a] bg-radial from-[#130d0d] via-[#08080a] to-[#040405] text-neutral-200 p-6 md:p-10">
      
      <!-- Contenedor Centrado -->
      <div class="max-w-7xl mx-auto space-y-10">
        
        <!-- Encabezado del Perfil (Bienvenida Inmersiva) -->
        <header class="bg-[#121215] border border-[#d4af37]/20 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div class="absolute -right-10 -top-10 text-9xl opacity-5 select-none pointer-events-none font-serif">🎲</div>
          
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
            <!-- Inicial del Nombre en Grande -->
            <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-red-800 to-amber-500 flex items-center justify-center font-serif text-white font-bold text-4xl border-2 border-[#d4af37]/40 shadow-xl uppercase shrink-0">
              {{ (authService.currentUser()?.username || 'A').charAt(0) }}
            </div>
            
            <div class="space-y-2">
              <span class="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">El Gremio de Aventureros</span>
              <h1 class="text-3xl md:text-4xl font-serif font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-[#d4af37] to-neutral-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Saludos, {{ authService.currentUser()?.username || 'Aventurero' }}
              </h1>
              <p class="text-sm text-neutral-400 font-light max-w-2xl leading-relaxed">
                Bienvenido de vuelta a la taberna de <span class="text-red-400">Forja de Héroes</span>. Aquí reposa tu pergamino de aventurero. A continuación, puedes consultar tu hoja de personajes activos en tu campaña.
              </p>
            </div>
          </div>
        </header>

        <!-- Sección de Hojas de Personaje -->
        <section class="space-y-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-4">
            <div class="space-y-1 text-center sm:text-left">
              <h2 class="text-2xl font-serif font-bold text-[#d4af37] tracking-wider uppercase">Mis Aventureros</h2>
              <p class="text-xs text-neutral-500">Consulta, edita o crea nuevas hojas de personaje de D&D 5e.</p>
            </div>
            
            <!-- Botón de crear personaje -->
            <a 
              routerLink="/character-creator"
              class="bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition duration-300 uppercase tracking-widest border border-red-500/25 shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] font-serif flex items-center gap-2 cursor-pointer"
            >
              <span>⚔️</span> Forjar Nuevo Aventurero
            </a>
          </div>

          <!-- Cuadrícula de Tarjetas de Hojas de Personajes -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Recorrer aventureros mockeados para demostración premium -->
            <div 
              *ngFor="let char of mockCharacters"
              class="bg-[#121215] border border-neutral-800/80 hover:border-[#d4af37]/30 rounded-xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition duration-300 group flex flex-col justify-between"
            >
              <div>
                <!-- Banner de Clase/Color -->
                <div class="h-2 bg-gradient-to-r from-red-700 via-amber-500 to-red-700"></div>

                <!-- Cabecera de Tarjeta -->
                <div class="p-5 flex items-center gap-4 border-b border-neutral-900">
                  <div class="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-2xl border border-neutral-700 shadow-md">
                    {{ char.avatar }}
                  </div>
                  <div>
                    <h3 class="font-serif font-bold text-lg text-neutral-200 group-hover:text-amber-400 transition">
                      {{ char.name }}
                    </h3>
                    <p class="text-xs text-neutral-400 leading-none mt-1">
                      Nivel {{ char.level }} • {{ char.race }} {{ char.class }}
                    </p>
                  </div>
                </div>

                <!-- Atributos Core D&D -->
                <div class="p-5 grid grid-cols-6 gap-2 text-center bg-[#0d0d0f]/50">
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">FUE</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.strength }}</span>
                  </div>
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">DES</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.dexterity }}</span>
                  </div>
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">CON</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.constitution }}</span>
                  </div>
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">INT</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.intelligence }}</span>
                  </div>
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">SAB</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.wisdom }}</span>
                  </div>
                  <div class="bg-[#18181c] border border-neutral-900 rounded p-1.5 flex flex-col justify-center">
                    <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-sans">CAR</span>
                    <span class="text-sm font-bold text-neutral-200">{{ char.stats.charisma }}</span>
                  </div>
                </div>

                <!-- Estadísticas Secundarias -->
                <div class="p-5 space-y-3">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-neutral-400">Puntos de Golpe Máximos:</span>
                    <span class="font-bold text-red-400">{{ char.hp }} HP</span>
                  </div>
                  <div class="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-red-600 h-1.5 rounded-full" style="width: 100%"></div>
                  </div>
                </div>
              </div>

              <!-- Acciones de Tarjeta -->
              <div class="p-5 pt-0 flex gap-2">
                <button class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 py-2 rounded text-xs transition duration-200 cursor-pointer">
                  Ver Hoja
                </button>
                <button class="flex-1 bg-[#1e1e24] hover:bg-red-950 border border-neutral-800 hover:border-red-900/50 text-neutral-300 hover:text-red-300 py-2 rounded text-xs transition duration-200 cursor-pointer">
                  Editar
                </button>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>
  `
})
export class DashboardComponent {
  authService = inject(AuthService);

  // Datos mockeados de demostración inmersiva
  mockCharacters: MockCharacter[] = [
    {
      id: 'char-1',
      name: 'Valen Woodwind',
      class: 'Bardo',
      race: 'Elfo',
      level: 4,
      avatar: '🎵',
      hp: 28,
      stats: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 13,
        wisdom: 10,
        charisma: 18
      }
    },
    {
      id: 'char-2',
      name: 'Krag Thorin',
      class: 'Guerrero',
      race: 'Enano',
      level: 6,
      avatar: '🛡️',
      hp: 52,
      stats: {
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 9,
        wisdom: 11,
        charisma: 10
      }
    },
    {
      id: 'char-3',
      name: 'Seraphina',
      class: 'Brujo',
      race: 'Tiflin',
      level: 9,
      avatar: '🔥',
      hp: 68,
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 14,
        wisdom: 12,
        charisma: 20
      }
    }
  ];
}
