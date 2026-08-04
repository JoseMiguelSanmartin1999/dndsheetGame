import { Component, inject, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';
import { CharacterService, Character } from '../../data/services/character.service';

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
              <p class="text-xs text-neutral-500">Consulta, edita o crea nuevas hojas de personaje de D&D 5e (Máximo 5).</p>
            </div>
            
            <!-- Botón de crear personaje (Deshabilitado si tiene 5 o más) -->
            <a 
              *ngIf="characters().length < 5"
              routerLink="/character-creator"
              class="bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition duration-300 uppercase tracking-widest border border-red-500/25 shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] font-serif flex items-center gap-2 cursor-pointer"
            >
              <span>⚔️</span> Forjar Nuevo Aventurero
            </a>
            <div 
              *ngIf="characters().length >= 5"
              class="bg-red-955/20 border border-red-800/40 text-red-400 font-semibold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider font-serif flex items-center gap-2 select-none"
              title="Has alcanzado el límite de 5 personajes"
            >
              <span>⚠️</span> Límite de 5 Personajes Alcanzado
            </div>
          </div>

          <!-- Mensaje cuando no hay personajes -->
          <div 
            *ngIf="characters().length === 0" 
            class="text-center py-16 bg-[#121215] border border-neutral-900 rounded-xl space-y-4"
          >
            <span class="text-5xl block">📜</span>
            <div class="space-y-1">
              <h3 class="font-serif font-bold text-[#d4af37] text-lg">Aún no has forjado ningún aventurero</h3>
              <p class="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Tus crónicas están en blanco. Visita la Forja para crear tu primer héroe de campaña de D&D.
              </p>
            </div>
            <a 
              routerLink="/character-creator"
              class="inline-block bg-gradient-to-r from-red-800 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-lg transition font-serif cursor-pointer"
            >
              Forjar Aventurero
            </a>
          </div>

          <!-- Cuadrícula de Tarjetas de Hojas de Personajes -->
          <div *ngIf="characters().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Recorrer aventureros reales guardados en la BD -->
            <div 
              *ngFor="let char of characters()"
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
                      Nivel {{ char.level }} • {{ char.race }}{{ char.originLineage ? ' (' + char.originLineage + ')' : '' }} {{ char.class }}
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

              <!-- Acciones de Tarjeta (Observar, Editar, Eliminar) -->
              <div class="p-5 pt-0 flex gap-2">
                <button 
                  (click)="observeCharacter(char)"
                  class="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 py-2 rounded text-xs transition duration-200 cursor-pointer"
                >
                  👀 Observar
                </button>
                <button 
                  (click)="editCharacter(char)"
                  class="flex-1 bg-[#1e1e24] hover:bg-[#d4af37]/10 border border-neutral-800 hover:border-[#d4af37]/45 text-neutral-300 hover:text-[#d4af37] py-2 rounded text-xs transition duration-200 cursor-pointer"
                >
                  ✍️ Editar
                </button>
                <button 
                  (click)="deleteCharacter(char)"
                  class="bg-[#1e1e24] hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/50 text-neutral-400 hover:text-red-400 px-3.5 rounded text-xs transition duration-200 cursor-pointer"
                  title="Eliminar Aventurero"
                >
                  🗑️
                </button>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>

    <!-- MODAL DE OBSERVAR: DETALLE COMPLETO DEL PERSONAJE (INMERSIVO) -->
    <div 
      *ngIf="showObserveModal && selectedChar" 
      class="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-left"
    >
      <div 
        class="bg-[#08080a] border border-[#d4af37]/35 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <!-- Cabecera del Modal -->
        <div class="bg-gradient-to-r from-neutral-950 via-[#0e0e11] to-neutral-950 border-b border-[#d4af37]/20 p-5 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ selectedChar.avatar }}</span>
            <div>
              <h2 class="font-serif text-[#d4af37] text-lg uppercase tracking-widest font-extrabold">
                {{ selectedChar.name }}
              </h2>
              <p class="text-[9px] text-neutral-450 uppercase tracking-wide">
                Nivel {{ selectedChar.level }} • {{ selectedChar.race }}{{ selectedChar.originLineage ? ' (' + selectedChar.originLineage + ')' : '' }} {{ selectedChar.class }}
              </p>
            </div>
          </div>
          <button 
            (click)="closeObserveModal()"
            class="text-neutral-400 hover:text-red-400 transition text-2xl font-bold cursor-pointer focus:outline-none"
          >
            &times;
          </button>
        </div>

        <!-- Contenido Scrollable -->
        <div class="flex-1 overflow-y-auto p-6 bg-[#0c0c0f]/50 space-y-6 custom-scrollbar">
          
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            <!-- Bloque Izquierdo (Atributos): 4 cols -->
            <div class="md:col-span-4 bg-[#121215] border border-neutral-900 rounded-xl p-5 space-y-4">
              <h3 class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider border-b border-neutral-900 pb-2">Atributos del Aventurero</h3>
              
              <div class="space-y-3">
                <div 
                  *ngFor="let attr of getAttributesArray(selectedChar)" 
                  class="flex justify-between items-center bg-[#18181c] border border-neutral-850 p-2.5 rounded-lg"
                >
                  <div>
                    <span class="text-[10px] font-bold text-neutral-350 block leading-tight">{{ attr.name }}</span>
                    <span class="text-[8px] text-neutral-500 uppercase">{{ attr.key }}</span>
                  </div>
                  <div class="text-right flex items-center gap-3">
                    <span class="text-sm font-bold text-neutral-200 font-mono">{{ attr.value }}</span>
                    <span class="text-[11px] font-bold text-amber-500 font-mono bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded shadow-inner min-w-[32px] text-center">
                      {{ getModifier(attr.value) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloque Central (Detalles e Historia): 8 cols -->
            <div class="md:col-span-8 space-y-6">
              
              <!-- Ficha General Rápida -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-[#121215] border border-neutral-900 p-4 rounded-xl text-center">
                  <span class="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Puntos de Golpe</span>
                  <span class="text-base font-bold text-red-500 font-mono mt-1 block">{{ selectedChar.hp }} HP</span>
                </div>
                <div class="bg-[#121215] border border-neutral-900 p-4 rounded-xl text-center">
                  <span class="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Trasfondo</span>
                  <span class="text-xs font-bold text-neutral-200 truncate mt-1 block">{{ selectedChar.background }}</span>
                </div>
                <div class="bg-[#121215] border border-neutral-900 p-4 rounded-xl text-center">
                  <span class="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Altura</span>
                  <span class="text-xs font-bold text-[#d4af37] font-mono mt-1 block">{{ selectedChar.height }} m</span>
                </div>
                <div class="bg-[#121215] border border-neutral-900 p-4 rounded-xl text-center">
                  <span class="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Tamaño</span>
                  <span class="text-xs font-bold text-neutral-200 mt-1 block">{{ selectedChar.sizeClass }}</span>
                </div>
              </div>

              <!-- Habilidades Competentes -->
              <div class="bg-[#121215] border border-neutral-900 p-5 rounded-xl space-y-3">
                <h4 class="text-[10px] text-[#d4af37] uppercase font-bold tracking-wider border-b border-neutral-900 pb-2">Habilidades con Competencia</h4>
                <div class="flex flex-wrap gap-2 pt-1">
                  <span *ngIf="selectedChar.classSkills.length === 0" class="text-[10px] text-neutral-500 italic">Ninguna seleccionada</span>
                  <span 
                    *ngFor="let skill of selectedChar.classSkills"
                    class="text-[10px] bg-red-950/20 border border-red-800/40 text-red-400 px-3 py-1 rounded-full font-medium"
                  >
                    {{ skill }}
                  </span>
                  <span 
                    *ngFor="let skilledFeat of selectedChar.skilledFeatSelection || []"
                    class="text-[10px] bg-amber-955/20 border border-amber-600/40 text-[#d4af37] px-3 py-1 rounded-full font-medium"
                  >
                    {{ skilledFeat }} (Habilidoso)
                  </span>
                </div>
              </div>

              <!-- Biografía y Crónicas -->
              <div class="bg-[#121215] border border-neutral-900 p-5 rounded-xl space-y-4">
                <div>
                  <h4 class="text-[10px] text-neutral-450 uppercase font-bold tracking-wider mb-1.5 border-b border-neutral-900 pb-1">Historia de Origen</h4>
                  <p class="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {{ selectedChar.history || 'Este aventurero no ha registrado su historia de origen.' }}
                  </p>
                </div>
                
                <div class="pt-2 border-t border-neutral-900/60">
                  <h4 class="text-[10px] text-neutral-455 uppercase font-bold tracking-wider mb-1.5 border-b border-neutral-900 pb-1">Aspecto Físico</h4>
                  <p class="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {{ selectedChar.physicalDesc || 'Este aventurero no ha registrado su apariencia física.' }}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- Pie de Modal -->
        <div class="p-5 bg-gradient-to-r from-neutral-950 via-[#0e0e11] to-neutral-950 border-t border-[#d4af37]/20 flex justify-end gap-2 shrink-0">
          <button 
            (click)="editCharacter(selectedChar)"
            class="bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-neutral-950 font-serif font-bold py-2 px-6 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Editar Ficha
          </button>
          <button 
            (click)="closeObserveModal()"
            class="bg-[#121215] hover:bg-neutral-850 border border-neutral-800 text-neutral-300 py-2 px-6 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  characterService = inject(CharacterService);
  router = inject(Router);

  // Lista real de personajes de la BD
  characters = signal<Character[]>([]);

  // Estado del modal de observación
  showObserveModal = false;
  selectedChar: Character | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadCharacters();
      } else {
        this.characters.set([]);
      }
    });
  }

  ngOnInit(): void {
  }

  loadCharacters(): void {
    const userObj = this.authService.currentUser();
    const userId = userObj?.id || (userObj as any)?._id;
    
    if (userId) {
      this.characterService.getCharacters(userId).subscribe({
        next: (chars) => {
          this.characters.set(chars);
        },
        error: (err) => {
          console.error('Error cargando personajes del gremio:', err);
        }
      });
    }
  }

  editCharacter(char: Character): void {
    this.closeObserveModal();
    this.router.navigate(['/character-creator'], { queryParams: { edit: char.id } });
  }

  deleteCharacter(char: Character): void {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al aventurero "${char.name}"? Esta acción no se puede deshacer.`)) {
      if (char.id) {
        this.characterService.deleteCharacter(char.id).subscribe({
          next: () => {
            alert(`Aventurero "${char.name}" ha sido retirado del Gremio.`);
            this.loadCharacters();
          },
          error: (err) => {
            console.error(err);
            alert('No se pudo retirar al aventurero. Inténtalo de nuevo.');
          }
        });
      }
    }
  }

  observeCharacter(char: Character): void {
    this.router.navigate(['/character-sheet', char.id]);
  }

  closeObserveModal(): void {
    this.showObserveModal = false;
    this.selectedChar = null;
  }

  getModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  getAttributesArray(char: Character): { name: string; key: string; value: number }[] {
    if (!char || !char.stats) return [];
    return [
      { name: 'Fuerza', key: 'FUE', value: char.stats.strength },
      { name: 'Destreza', key: 'DES', value: char.stats.dexterity },
      { name: 'Constitución', key: 'CON', value: char.stats.constitution },
      { name: 'Inteligencia', key: 'INT', value: char.stats.intelligence },
      { name: 'Sabiduría', key: 'SAB', value: char.stats.wisdom },
      { name: 'Carisma', key: 'CAR', value: char.stats.charisma }
    ];
  }
}
