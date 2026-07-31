import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-[#0b0b0d] text-neutral-400 text-xs py-12 px-6 border-t border-[#d4af37]/20 relative z-10">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Columna 1: Logo y Marca -->
        <div class="space-y-4 flex flex-col items-center md:items-start">
          <div class="flex items-center gap-3">
            <img src="/assets/Logo.png" alt="Forja de Héroes Logo" class="h-16 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <div class="flex flex-col">
              <span class="font-serif font-bold text-lg tracking-wider text-[#d4af37]">
                Forja de <span class="text-red-500">Héroes</span>
              </span>
              <span class="text-[9px] uppercase tracking-widest text-neutral-600 font-sans">
                Forjando Leyendas
              </span>
            </div>
          </div>
          <p class="text-neutral-500 text-[11px] leading-relaxed text-center md:text-left">
            Una plataforma diseñada para crear y gestionar hojas de personaje D&D 5e adaptadas al español.
          </p>
          <p class="text-neutral-600 text-[10px] text-center md:text-left pt-2 border-t border-neutral-900 w-full">
            © 2026 Forja de Héroes.<br>Desarrollado con 🎲 por Jose Miguel Sanmartín Galán.
          </p>
        </div>

        <!-- Columna 2: Enlaces del Gremio -->
        <div class="flex flex-col items-center md:items-start space-y-3">
          <h3 class="text-[#d4af37] font-semibold tracking-wider text-xs uppercase font-serif border-b border-red-500/20 pb-1 w-2/3 md:w-auto">
            El Gremio
          </h3>
          <a routerLink="/privacidad" class="hover:text-red-400 transition hover:underline">Política de Privacidad</a>
          <a routerLink="/terminos" class="hover:text-red-400 transition hover:underline">Términos de Uso</a>
          <a href="https://github.com/JoseMiguelSanmartin1999/dndsheetGame" target="_blank" rel="noopener noreferrer" class="hover:text-red-400 transition hover:underline">Repositorio GitHub</a>
        </div>

        <!-- Columna 3 y 4: Avisos Legales y Licencias (Ancho: 2 columnas) -->
        <div class="md:col-span-2 space-y-4 text-center md:text-left border-t md:border-t-0 md:border-l border-neutral-800/80 pt-6 md:pt-0 md:pl-8">
          <h3 class="text-[#d4af37] font-semibold tracking-wider text-xs uppercase font-serif">
            Aviso Legal & Contenido de Fans
          </h3>
          <p class="leading-relaxed text-[11px] text-neutral-500">
            <em class="text-neutral-400">Forja de Héroes</em> es un proyecto no oficial permitido bajo la Política de Contenido de Fans de Wizards of the Coast. Este sitio incluye material extraído del Documento de Referencia del Sistema 5.1 (“SRD 5.1”) de Wizards of the Coast LLC, disponible en 
            <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noopener noreferrer" class="underline hover:text-amber-400 text-amber-500/80">dnd.wizards.com</a> 
            y licenciado bajo la licencia Creative Commons Atribución 4.0 Internacional (CC-BY-4.0).
          </p>
          <p class="leading-relaxed text-[11px] text-neutral-500">
            Dungeons & Dragons, D&D, Wizards of the Coast y sus respectivos logotipos son marcas registradas de Wizards of the Coast LLC.
          </p>
        </div>

      </div>
    </footer>
  `
})
export class FooterComponent {}
