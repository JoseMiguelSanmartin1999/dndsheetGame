import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#08080a] bg-radial from-[#1b1111] via-[#08080a] to-[#040405] flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Decoración de Fondo (Partículas de Lava y Humo) -->
      <div class="absolute top-10 left-10 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-red-500/5 to-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Contenedor Principal (Tarjeta de Pergamino/Piedra Oscura) -->
      <div class="w-full max-w-md bg-[#121215] border border-[#d4af37]/25 rounded-xl shadow-2xl relative z-10 overflow-hidden backdrop-blur-md">
        
        <!-- Línea superior de Lava Brillante -->
        <div class="h-1.5 bg-gradient-to-r from-red-700 via-amber-500 to-red-700 shadow-[0_2px_15px_rgba(239,68,68,0.6)]"></div>

        <!-- Encabezado de la Tarjeta con Logo -->
        <div class="p-8 text-center border-b border-neutral-900 bg-[#0d0d0f]/90 flex flex-col items-center justify-center gap-2">
          <img src="/assets/Logo.png" alt="Forja de Héroes" class="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)] animate-pulse-slow">
          <h2 class="text-3xl font-serif font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase mt-2">
            Entrar a la Taberna
          </h2>
          <p class="text-xs text-neutral-400 font-light max-w-sm">
            Inicia sesión con tu pergamino de aventurero para acceder a tus hojas de personaje.
          </p>
        </div>

        <!-- Alertas de Éxito / Error -->
        <div class="px-8 pt-6" *ngIf="errorMessage || successMessage">
          <div *ngIf="errorMessage" class="bg-red-950/40 border border-red-500/50 text-red-300 text-sm rounded-lg p-4 flex items-start gap-3 shadow-lg">
            <svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="leading-relaxed">{{ errorMessage }}</span>
          </div>
          <div *ngIf="successMessage" class="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-sm rounded-lg p-4 flex items-start gap-3 shadow-lg">
            <svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </div>

        <!-- Formulario de Login -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="p-8 space-y-6">
          
          <!-- Correo Electrónico -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-[#d4af37] uppercase tracking-widest">Correo Electrónico</label>
            <input 
              type="email" 
              formControlName="email"
              class="w-full bg-[#18181c] text-neutral-200 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-950 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:shadow-[0_0_10px_rgba(239,68,68,0.15)] placeholder-neutral-600"
              placeholder="aventurero@ejemplo.com"
            />
            <div *ngIf="f['email'].touched && f['email'].errors" class="text-red-400 text-xs font-medium">
              <span *ngIf="f['email'].errors['required']">El correo es obligatorio.</span>
              <span *ngIf="f['email'].errors['email']">Ingresa un correo electrónico válido.</span>
            </div>
          </div>

          <!-- Contraseña -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="block text-xs font-semibold text-[#d4af37] uppercase tracking-widest">Contraseña</label>
            </div>
            <input 
              type="password" 
              formControlName="password"
              class="w-full bg-[#18181c] text-neutral-200 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-950 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:shadow-[0_0_10px_rgba(239,68,68,0.15)] placeholder-[#33333b]"
              placeholder="••••••••"
            />
            <div *ngIf="f['password'].touched && f['password'].errors" class="text-red-400 text-xs font-medium">
              <span *ngIf="f['password'].errors['required']">La contraseña es obligatoria.</span>
            </div>
          </div>

          <!-- Enlace de ir al Registro -->
          <div class="text-right">
            <span class="text-xs text-neutral-500">¿Aún no tienes cuenta? </span>
            <a routerLink="/register" class="text-xs text-[#d4af37] hover:text-amber-400 hover:underline transition">Regístrate aquí</a>
          </div>

          <!-- Botón de Envío (Lava / Magma Fundido) -->
          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isSubmitting"
            class="w-full bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:from-red-700 hover:to-amber-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 uppercase tracking-widest shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm border-t border-red-500/20 font-serif"
          >
            <span *ngIf="!isSubmitting">Entrar a la Taberna</span>
            <span *ngIf="isSubmitting" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Invocando...
            </span>
          </button>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .animate-pulse-slow {
      animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .85; transform: scale(0.96); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `¡Bienvenido de vuelta, ${response.user.username}! Entrando a la taberna...`;
        this.loginForm.reset();
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Error al intentar conectar con el servidor de la taberna.';
      }
    });
  }
}
