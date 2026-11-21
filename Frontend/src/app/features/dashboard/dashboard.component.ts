import { Component, inject, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';
import { CharacterService, Character } from '../../data/services/character.service';
import { apiErrorMessage } from '../../core/api-error';

/** Imagen de cada clase en /assets/clases (nombre sin tildes). */
const CLASS_IMAGES: Record<string, string> = {
  barbaro: 'Barbaros.png', bardo: 'Bardo.png', brujo: 'Brujo.png', clerigo: 'Clerigo.png',
  druida: 'Druida.png', explorador: 'Explorador.png', guerrero: 'Guerrero.png', hechicero: 'Hechicero.png',
  mago: 'Mago.png', monje: 'Monje.png', paladin: 'Paladin.png', picaro: 'Picaro.png',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="salon">
      <header class="salon-cabecera">
        <div>
          <h1 class="titulo">Tus personajes</h1>
          <p class="salon-sub">
            {{ characters().length }} de {{ maxCharacters() }} huecos ocupados
            <ng-container *ngIf="authService.currentUser() as user">en la cuenta de {{ user.username }}</ng-container>
          </p>
        </div>
        <a *ngIf="characters().length < maxCharacters()" routerLink="/character-creator" class="btn-forja">Crear personaje</a>
      </header>

      <p *ngIf="loadError" class="aviso aviso-error" role="alert">{{ loadError }}</p>

      <ul class="estante" aria-label="Personajes">
        <li *ngFor="let char of characters()" class="ficha">
          <div class="ficha-retrato">
            <img [src]="portrait(char)" alt="" loading="lazy" (error)="onPortraitError($event)" />
            <span class="ficha-nivel" [attr.aria-label]="'Nivel ' + char.level">{{ char.level }}</span>
          </div>
          <div class="ficha-cuerpo">
            <h2 class="ficha-nombre">{{ char.name }}</h2>
            <p class="ficha-linaje">{{ char.class }} de nivel {{ char.level }}</p>
            <p class="ficha-origen">{{ char.race }}<span *ngIf="char.originLineage"> ({{ char.originLineage }})</span>, {{ char.background }}</p>

            <dl class="ficha-atributos">
              <div *ngFor="let attr of getAttributesArray(char)" [title]="attr.name">
                <dt>{{ attr.key }}</dt>
                <dd>{{ attr.value }}<small>{{ getModifier(attr.value) }}</small></dd>
              </div>
            </dl>

            <p class="ficha-pg">
              <span>Puntos de golpe</span>
              <strong>{{ char.currentHp ?? char.hp }} / {{ char.hp }}</strong>
            </p>
            <div class="ficha-barra" role="presentation">
              <span [style.width.%]="hpPercent(char)"></span>
            </div>
          </div>
          <div class="ficha-acciones">
            <button type="button" class="btn-hierro principal" (click)="observeCharacter(char)">Abrir hoja</button>
            <button type="button" class="btn-hierro" (click)="editCharacter(char)">Editar</button>
            <button type="button" class="btn-hierro peligro" (click)="deleteCharacter(char)" [attr.aria-label]="'Eliminar a ' + char.name" title="Eliminar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </li>

        <li *ngFor="let slot of emptySlots(); let first = first" class="hueco">
          <a *ngIf="first" routerLink="/character-creator" class="hueco-enlace">
            <span class="hueco-yunque" aria-hidden="true">
              <svg viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8h42c0 6 6 9 12 9-4 5-12 6-18 6l-2 9h8v4H16v-4h8l-2-9C12 23 6 17 6 8Z" stroke-linejoin="round"/></svg>
            </span>
            <span class="hueco-texto">{{ characters().length === 0 ? 'Crea tu primer personaje' : 'Crear otro personaje' }}</span>
            <span class="hueco-ayuda">El creador te guía paso a paso.</span>
          </a>
          <span *ngIf="!first" class="hueco-libre">Hueco libre</span>
        </li>
      </ul>

      <p *ngIf="characters().length >= maxCharacters()" class="salon-limite">
        Has llenado tus {{ maxCharacters() }} huecos. Para crear otro personaje, elimina uno.
      </p>
    </main>
  `,
  styles: [`
    .salon { max-width: 80rem; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2.5rem) 4rem; }
    .salon-cabecera { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem 2rem; margin-bottom: 2rem; }
    .salon-cabecera h1 { font-size: clamp(2.4rem, 5vw, 3.4rem); margin: 0; }
    .salon-sub { margin: 0.35rem 0 0; color: var(--color-ceniza); font-size: 1.05rem; }
    .aviso { margin-bottom: 1.5rem; }

    .estante { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr)); }
    /* En pantallas anchas, los cinco huecos de la cuenta en una sola fila */
    @media (min-width: 1180px) { .estante { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; } .ficha-nombre { font-size: 1.5rem; } .ficha-cuerpo, .ficha-acciones { padding-left: 0.85rem; padding-right: 0.85rem; } .ficha-atributos { gap: 0.25rem; } }

    .ficha {
      display: flex; flex-direction: column;
      background: var(--color-fragua);
      border: 1px solid color-mix(in srgb, var(--color-pergamino) 10%, transparent);
      border-radius: 10px;
      overflow: hidden;
    }
    .ficha-retrato { position: relative; aspect-ratio: 16 / 10; background: var(--color-yunque); }
    .ficha-retrato img { width: 100%; height: 100%; object-fit: cover; object-position: center 22%; display: block; }
    .ficha-retrato::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, var(--color-fragua) 100%); }
    /* Nivel grabado en una placa de hierro, el detalle que se ve primero */
    .ficha-nivel {
      position: absolute; z-index: 1; top: 0.75rem; left: 0.75rem;
      min-width: 2.6rem; height: 2.6rem; padding: 0 0.4rem;
      display: grid; place-items: center;
      font-family: var(--font-serif); font-weight: 700; font-size: 1.35rem; color: #fff3e0;
      background: radial-gradient(circle at 50% 35%, var(--color-brasa), var(--color-escoria));
      border: 2px solid color-mix(in srgb, var(--color-incandescente) 55%, transparent);
      border-radius: 999px;
      box-shadow: 0 4px 14px -4px #000;
    }
    .ficha-cuerpo { padding: 0 1.1rem 1rem; margin-top: -1.6rem; position: relative; z-index: 1; }
    .ficha-nombre { font-family: var(--font-serif); font-weight: 700; font-size: 1.75rem; line-height: 1.05; margin: 0; color: var(--color-pergamino); overflow-wrap: anywhere; }
    .ficha-linaje { margin: 0.3rem 0 0; color: var(--color-amber-300); font-weight: 500; }
    .ficha-origen { margin: 0.1rem 0 0; color: var(--color-ceniza); font-size: 0.95rem; }

    .ficha-atributos { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.35rem; margin: 1rem 0 0; }
    .ficha-atributos div { background: var(--color-yunque); border-radius: 6px; padding: 0.35rem 0 0.4rem; text-align: center; }
    .ficha-atributos dt { font-size: 0.75rem; color: var(--color-ceniza); }
    .ficha-atributos dd { margin: 0; font-weight: 700; font-size: 1.05rem; font-variant-numeric: lining-nums tabular-nums; line-height: 1.1; }
    .ficha-atributos small { display: block; font-weight: 500; font-size: 0.75rem; color: var(--color-amber-300); }

    .ficha-pg { display: flex; justify-content: space-between; margin: 0.9rem 0 0.35rem; font-size: 0.95rem; color: var(--color-ceniza); }
    .ficha-pg strong { color: var(--color-pergamino); font-variant-numeric: tabular-nums; }
    .ficha-barra { height: 6px; border-radius: 99px; background: var(--color-yunque); overflow: hidden; }
    .ficha-barra span { display: block; height: 100%; background: linear-gradient(90deg, #9c2a1c, #d9483a); }

    .ficha-acciones { margin-top: auto; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.25rem 1.1rem 1.1rem; }
    .ficha-acciones > * { flex: 1 1 auto; }
    .ficha-acciones .principal { flex: 1 1 100%; border-color: color-mix(in srgb, var(--color-brasa) 45%, transparent); }
    .ficha-acciones .peligro:hover { border-color: #d9534a; color: #f6c7c1; background: color-mix(in srgb, #b3261e 18%, var(--color-yunque)); }

    .hueco {
      min-height: 14rem;
      border: 2px dashed color-mix(in srgb, var(--color-pergamino) 14%, transparent);
      border-radius: 10px;
      display: grid;
    }
    .hueco-libre { place-self: center; color: var(--color-neutral-600); }
    .hueco-enlace {
      display: grid; place-content: center; justify-items: center; gap: 0.35rem; text-align: center;
      padding: 1.5rem; color: var(--color-pergamino); text-decoration: none; border-radius: 8px;
      transition: background 0.15s;
    }
    .hueco-enlace:hover { background: color-mix(in srgb, var(--color-brasa) 7%, transparent); }
    .hueco:has(.hueco-enlace:hover) { border-color: color-mix(in srgb, var(--color-brasa) 60%, transparent); }
    .hueco-yunque { color: var(--color-brasa); margin-bottom: 0.5rem; }
    .hueco-texto { font-family: var(--font-serif); font-weight: 700; font-size: 1.5rem; line-height: 1.15; }
    .hueco-ayuda { color: var(--color-ceniza); }
    .salon-limite { margin-top: 1.5rem; color: var(--color-ceniza); }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  characterService = inject(CharacterService);
  router = inject(Router);

  characters = signal<Character[]>([]);
  loadError = '';
  maxCharacters = computed(() => this.authService.currentUser()?.maxCharacters ?? 5);
  emptySlots = computed(() => Array.from({ length: Math.max(0, this.maxCharacters() - this.characters().length) }));

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
    if (this.authService.isAuthenticated()) {
      this.characterService.getCharacters().subscribe({
        next: (chars) => {
          this.loadError = '';
          this.characters.set(chars);
        },
        error: (err) => {
          this.loadError = apiErrorMessage(err, 'No se pudieron cargar tus personajes. Comprueba que el servidor está en marcha y recarga la página.');
        }
      });
    }
  }

  editCharacter(char: Character): void {
    this.router.navigate(['/character-creator'], { queryParams: { edit: char.id } });
  }

  deleteCharacter(char: Character): void {
    if (!char.id) return;
    if (!confirm(`¿Eliminar a ${char.name}? Dejará libre su hueco y no aparecerá más en tu lista.`)) return;
    this.characterService.deleteCharacter(char.id).subscribe({
      next: () => this.loadCharacters(),
      error: (err) => {
        this.loadError = apiErrorMessage(err, `No se pudo eliminar a ${char.name}. Inténtalo de nuevo.`);
      }
    });
  }

  observeCharacter(char: Character): void {
    this.router.navigate(['/character-sheet', char.id]);
  }

  portrait(char: Character): string {
    const key = (char.class || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return `/assets/clases/${CLASS_IMAGES[key] ?? 'Guerrero.png'}`;
  }

  onPortraitError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/emblema.webp';
  }

  hpPercent(char: Character): number {
    const max = Number(char.hp) || 1;
    const current = Number(char.currentHp ?? char.hp) || 0;
    return Math.max(0, Math.min(100, (current / max) * 100));
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
