import { Component } from '@angular/core';

/** Portada de marca para las pantallas de entrada (login y registro). */
@Component({
  selector: 'app-forja-hero',
  standalone: true,
  template: `
    <section class="hero" aria-labelledby="hero-titulo">
      <img class="hero-emblema" src="/assets/emblema.webp" alt="" aria-hidden="true" width="384" height="384" />
      <div class="hero-texto">
        <h1 id="hero-titulo" class="rotulo-forja encender">Forja de<br />Héroes</h1>
        <p class="hero-lema">
          Crea tu personaje de 5.ª edición paso a paso, súbelo de nivel y llévalo a la mesa.
        </p>
        <ul class="hero-lista">
          <li><span class="remache" aria-hidden="true"></span>Un creador guiado que explica cada elección</li>
          <li><span class="remache" aria-hidden="true"></span>Una hoja que crece contigo, del nivel 1 al 20</li>
          <li><span class="remache" aria-hidden="true"></span>Hasta 5 personajes guardados en tu cuenta</li>
        </ul>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .hero {
      position: relative;
      min-height: 100%;
      display: flex;
      align-items: center;
      padding: clamp(2rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4.5rem);
      overflow: hidden;
      isolation: isolate;
    }
    /* El emblema, grande y medio fuera del lienzo, como un sello en la pared de la fragua. */
    .hero-emblema {
      position: absolute;
      z-index: -1;
      width: min(78vh, 46rem);
      height: auto;
      right: -18%;
      top: 50%;
      transform: translateY(-50%) rotate(-8deg);
      opacity: 0.17;
      filter: saturate(0.8);
      pointer-events: none;
    }
    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background:
        radial-gradient(ellipse 60% 55% at 18% 62%, color-mix(in srgb, var(--color-brasa) 16%, transparent), transparent 70%),
        linear-gradient(90deg, var(--color-hollin) 30%, transparent 85%);
    }
    .hero-texto { max-width: 34rem; }
    h1 {
      font-size: clamp(3.6rem, 9vw, 7.5rem);
      margin: 0 0 1.5rem;
      padding-bottom: 0.08em;
    }
    .hero-lema {
      font-family: var(--font-serif);
      font-size: clamp(1.25rem, 2vw, 1.5rem);
      font-weight: 500;
      line-height: 1.3;
      color: var(--color-pergamino);
      margin: 0 0 1.75rem;
      max-width: 28ch;
    }
    .hero-lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.6rem;
      color: var(--color-ceniza);
      font-size: 1.05rem;
    }
    .hero-lista li { display: flex; align-items: baseline; gap: 0.75rem; }
    /* Remache de hierro con un punto de brasa */
    .remache {
      flex: none;
      width: 0.55rem;
      height: 0.55rem;
      transform: translateY(-0.1rem) rotate(45deg);
      background: var(--color-brasa);
      box-shadow: 0 0 10px var(--color-brasa);
    }
    @media (max-width: 899px) {
      .hero { padding-bottom: 0.5rem; }
      .hero-lista { display: none; }
      .hero-emblema { width: 22rem; right: -6rem; opacity: 0.16; }
      h1 { margin-bottom: 1rem; }
      .hero-lema { margin-bottom: 0; }
    }
  `],
})
export class ForjaHeroComponent {}
