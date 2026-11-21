import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="pie">
      <div class="pie-marca">
        <img src="/assets/emblema-96.png" alt="" width="48" height="48" />
        <div>
          <p class="nombre">Forja de Héroes</p>
          <p>Hojas de personaje compatibles con la 5.ª edición. Hecho por Jose Miguel Sanmartín Galán.</p>
          <p><a class="enlace" href="https://github.com/JoseMiguelSanmartin1999/dndsheetGame" target="_blank" rel="noopener noreferrer">Código en GitHub</a></p>
        </div>
      </div>
      <p class="pie-licencia">
        Este sitio incluye material del System Reference Document 5.2.1 («SRD 5.2.1») de Wizards of the Coast LLC,
        disponible en <a class="enlace" href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener noreferrer">dndbeyond.com/srd</a>.
        El SRD 5.2.1 se publica bajo la licencia
        <a class="enlace" href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener noreferrer">Creative Commons Atribución 4.0 Internacional</a>.
        Las subclases, trasfondos y especies marcados como propios son contenido original de este sitio.
      </p>
    </footer>
  `,
  styles: [`
    .pie {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 2rem 3rem;
      padding: 2.5rem clamp(1rem, 4vw, 2.5rem);
      border-top: 1px solid color-mix(in srgb, var(--color-pergamino) 10%, transparent);
      background: var(--color-hollin);
      color: var(--color-ceniza);
      font-size: 0.95rem;
    }
    .pie p { margin: 0 0 0.4rem; max-width: 62ch; }
    .pie-marca { display: flex; gap: 1rem; align-items: flex-start; }
    .nombre { font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; color: var(--color-pergamino); line-height: 1; margin-bottom: 0.5rem !important; }
    .pie-licencia { font-size: 0.875rem; line-height: 1.6; }
    @media (max-width: 767px) { .pie { grid-template-columns: 1fr; } }
  `]
})
export class FooterComponent {}
