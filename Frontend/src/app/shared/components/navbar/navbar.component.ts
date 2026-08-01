import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../data/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-[#121214] border-b border-[#d4af37]/20 text-neutral-200 px-4 py-3 relative z-50 shadow-lg">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        
        <!-- Logo / Nombre de Marca -->
        <a routerLink="/" class="flex items-center gap-3 group cursor-pointer select-none">
          <img src="/assets/Logo.png" alt="Forja de Héroes Logo" class="h-12 w-auto md:h-14 object-contain transition duration-300 group-hover:scale-108 drop-shadow-[0_0_8px_rgba(212,175,55,0.25)] group-hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">
          <span class="font-serif font-bold text-xl tracking-wider text-[#d4af37] group-hover:text-amber-400 transition">
            Forja de <span class="text-red-500">Héroes</span>
          </span>
        </a>

        <!-- Links de Navegación (Pantallas Medianas/Grandes) -->
        <div class="hidden md:flex items-center gap-6">
          <a 
            routerLink="/dashboard" 
            routerLinkActive="text-[#d4af37] border-b-2 border-red-500 shadow-[0_4px_10px_-4px_#ef4444]" 
            [routerLinkActiveOptions]="{exact: true}"
            class="px-2 py-1 text-sm font-semibold hover:text-amber-400 transition duration-200 border-b-2 border-transparent"
          >
            Mis Personajes
          </a>
          <a 
            routerLink="/character-creator" 
            routerLinkActive="text-[#d4af37] border-b-2 border-red-500 shadow-[0_4px_10px_-4px_#ef4444]" 
            class="px-2 py-1 text-sm font-semibold hover:text-amber-400 transition duration-200 border-b-2 border-transparent"
          >
            Creador
          </a>
          <a 
            routerLink="/spells" 
            routerLinkActive="text-[#d4af37] border-b-2 border-red-500 shadow-[0_4px_10px_-4px_#ef4444]" 
            class="px-2 py-1 text-sm font-semibold hover:text-amber-400 transition duration-200 border-b-2 border-transparent"
          >
            Conjuros
          </a>
        </div>

        <!-- Sección de Usuario / Acción (Derecha) -->
        <div class="hidden md:flex items-center gap-4">
          <ng-container *ngIf="authService.currentUser() as user; else noUser">
            <!-- Perfil del Aventurero Logueado -->
            <div class="flex items-center gap-2 border-l border-neutral-800 pl-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-red-700 to-amber-500 flex items-center justify-center font-serif text-white font-bold text-sm border border-[#d4af37]/30 shadow-md uppercase">
                {{ user.username.charAt(0) }}
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-neutral-200 leading-tight">{{ user.username }}</span>
                <span class="text-[9px] uppercase tracking-wider text-[#d4af37] font-semibold leading-none mt-0.5">
                  {{ user.role === 'admin' ? 'DM' : 'Jugador' }}
                </span>
              </div>
            </div>

            <!-- Botón Salir -->
            <button 
              (click)="onLogout()"
              class="text-xs bg-[#1e1e24] hover:bg-red-950 border border-neutral-700 hover:border-red-500/50 text-neutral-300 hover:text-red-300 px-3 py-1.5 rounded transition duration-200 cursor-pointer"
            >
              Salir de Campaña
            </button>
          </ng-container>

          <ng-template #noUser>
            <a 
              routerLink="/login"
              class="text-xs font-semibold text-neutral-300 hover:text-amber-400 transition"
            >
              Iniciar Sesión
            </a>
            <a 
              routerLink="/register"
              class="text-xs bg-gradient-to-r from-red-800 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-semibold px-3 py-1.5 rounded border border-[#d4af37]/20 shadow-md transition"
            >
              Unirse
            </a>
          </ng-template>
        </div>

        <!-- Botón del Menú Móvil (Hamburguesa) -->
        <button 
          (click)="toggleMenu()" 
          class="md:hidden p-2 text-neutral-400 hover:text-[#d4af37] focus:outline-none"
          aria-label="Abrir Menú"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path *ngIf="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path *ngIf="isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

      </div>

      <!-- Menú Desplegable Móvil -->
      <div 
        *ngIf="isMenuOpen" 
        class="md:hidden mt-3 p-4 bg-[#16161a] border border-[#d4af37]/10 rounded-lg space-y-3 absolute left-4 right-4 shadow-xl z-50 animate-fade-in"
      >
        <a 
          routerLink="/dashboard" 
          routerLinkActive="text-[#d4af37] bg-red-950/20 border-l-2 border-red-500"
          [routerLinkActiveOptions]="{exact: true}"
          (click)="closeMenu()"
          class="block px-3 py-2 rounded text-sm font-semibold hover:bg-neutral-800 hover:text-[#d4af37] transition"
        >
          Mis Personajes
        </a>
        <a 
          routerLink="/character-creator" 
          routerLinkActive="text-[#d4af37] bg-red-950/20 border-l-2 border-red-500"
          (click)="closeMenu()"
          class="block px-3 py-2 rounded text-sm font-semibold hover:bg-neutral-800 hover:text-[#d4af37] transition"
        >
          Creador
        </a>
        <a 
          routerLink="/spells" 
          routerLinkActive="text-[#d4af37] bg-red-950/20 border-l-2 border-red-500"
          (click)="closeMenu()"
          class="block px-3 py-2 rounded text-sm font-semibold hover:bg-neutral-800 hover:text-[#d4af37] transition"
        >
          Conjuros
        </a>

        <!-- Sección de Usuario Móvil -->
        <div class="h-px bg-neutral-850 my-2"></div>
        <div class="pt-1">
          <ng-container *ngIf="authService.currentUser() as user; else noUserMobile">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-red-700 to-amber-500 flex items-center justify-center text-white font-bold text-sm border border-[#d4af37]/30 uppercase">
                  {{ user.username.charAt(0) }}
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-neutral-200 leading-tight">{{ user.username }}</span>
                  <span class="text-[9px] uppercase tracking-wider text-[#d4af37] font-semibold leading-none mt-0.5">
                    {{ user.role === 'admin' ? 'DM' : 'Jugador' }}
                  </span>
                </div>
              </div>
              <button 
                (click)="onLogout()"
                class="text-xs bg-[#1e1e24] hover:bg-red-950 border border-neutral-700 hover:border-red-500/50 text-neutral-300 hover:text-red-300 px-3 py-1.5 rounded transition"
              >
                Salir de Campaña
              </button>
            </div>
          </ng-container>

          <ng-template #noUserMobile>
            <div class="flex items-center justify-between gap-4 pt-1">
              <a 
                routerLink="/login"
                (click)="closeMenu()"
                class="text-sm font-semibold text-neutral-300 hover:text-amber-400 transition"
              >
                Iniciar Sesión
              </a>
              <a 
                routerLink="/register"
                (click)="closeMenu()"
                class="text-xs bg-gradient-to-r from-red-800 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-semibold px-3 py-1.5 rounded border border-[#d4af37]/20 shadow-md transition"
              >
                Unirse
              </a>
            </div>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
