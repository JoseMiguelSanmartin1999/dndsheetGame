import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../data/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="barra" aria-label="Principal">
      <a [routerLink]="authService.isAuthenticated() ? '/dashboard' : '/login'" class="marca" (click)="closeMenu()">
        <img src="/assets/emblema-96.png" alt="" width="40" height="40" />
        <span>Forja de Héroes</span>
      </a>

      <button
        type="button"
        class="menu-boton"
        (click)="toggleMenu()"
        [attr.aria-expanded]="isMenuOpen"
        aria-controls="menu-principal"
      >
        <span class="sr">Menú</span>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path *ngIf="!isMenuOpen" d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
          <path *ngIf="isMenuOpen" d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
        </svg>
      </button>

      <div id="menu-principal" class="menu" [class.abierto]="isMenuOpen">
        <ng-container *ngIf="authService.currentUser() as user; else invitado">
          <ul class="enlaces">
            <li><a routerLink="/dashboard" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">Mis personajes</a></li>
            <li><a routerLink="/character-creator" routerLinkActive="activo" (click)="closeMenu()">Crear personaje</a></li>
          </ul>
          <div class="cuenta">
            <span class="usuario">
              {{ user.username }}
              <small>{{ user.role === 'admin' ? 'Administrador' : 'Jugador' }}</small>
            </span>
            <button type="button" class="btn-hierro" (click)="onLogout()">Cerrar sesión</button>
          </div>
        </ng-container>
        <ng-template #invitado>
          <div class="cuenta">
            <a routerLink="/login" class="btn-hierro" (click)="closeMenu()">Entrar</a>
            <a routerLink="/register" class="btn-hierro" (click)="closeMenu()">Crear cuenta</a>
          </div>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .barra {
      position: sticky; top: 0; z-index: 50;
      height: 4.5rem;
      display: flex; align-items: center; gap: 2rem;
      padding: 0 clamp(1rem, 3vw, 2rem);
      background: color-mix(in srgb, var(--color-hollin) 92%, transparent);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid color-mix(in srgb, var(--color-pergamino) 10%, transparent);
    }
    .marca { display: flex; align-items: center; gap: 0.7rem; text-decoration: none; }
    .marca img { width: 40px; height: 40px; }
    .marca span { font-family: var(--font-display); font-weight: 800; font-size: 1.7rem; color: var(--color-pergamino); line-height: 1; }
    .menu { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
    .enlaces { list-style: none; display: flex; gap: 0.25rem; margin: 0; padding: 0; }
    .enlaces a {
      display: block; padding: 0.5rem 0.8rem; border-radius: 6px;
      color: var(--color-ceniza); text-decoration: none; font-weight: 500;
    }
    .enlaces a:hover { color: var(--color-pergamino); }
    .enlaces a.activo { color: var(--color-pergamino); box-shadow: inset 0 -2px 0 var(--color-brasa); border-radius: 0; }
    .cuenta { display: flex; align-items: center; gap: 1rem; margin-left: auto; }
    .usuario { display: grid; text-align: right; line-height: 1.15; font-weight: 500; }
    .usuario small { color: var(--color-ceniza); font-weight: 400; font-size: 0.85rem; }
    .menu-boton { display: none; margin-left: auto; background: none; border: 0; color: var(--color-pergamino); padding: 0.5rem; cursor: pointer; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

    @media (max-width: 767px) {
      .menu-boton { display: block; }
      .menu {
        display: none;
        position: absolute; top: 4.5rem; left: 0; right: 0;
        flex-direction: column; align-items: stretch; gap: 1rem;
        padding: 1rem clamp(1rem, 3vw, 2rem) 1.25rem;
        background: var(--color-fragua);
        border-bottom: 1px solid color-mix(in srgb, var(--color-pergamino) 10%, transparent);
      }
      .menu.abierto { display: flex; }
      .enlaces { flex-direction: column; }
      .cuenta { margin-left: 0; justify-content: space-between; }
      .usuario { text-align: left; }
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
