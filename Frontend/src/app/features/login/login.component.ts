import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';
import { ForjaHeroComponent } from '../../shared/components/forja-hero/forja-hero.component';
import { apiErrorMessage } from '../../core/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ForjaHeroComponent],
  template: `
    <main class="puerta">
      <app-forja-hero></app-forja-hero>

      <div class="puerta-panel">
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="puerta-form" novalidate>
          <h2 class="titulo">Entrar</h2>
          <p class="intro">Inicia sesión para ver y editar tus personajes.</p>

          <p *ngIf="sessionExpired && !errorMessage" class="aviso aviso-info" role="status">
            Tu sesión ha caducado. Vuelve a iniciar sesión.
          </p>
          <p *ngIf="errorMessage" class="aviso aviso-error" role="alert">{{ errorMessage }}</p>

          <div class="campo">
            <label for="login-email">Correo electrónico</label>
            <input id="login-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@correo.com" />
            <p *ngIf="f['email'].touched && f['email'].errors" class="campo-error">
              <span *ngIf="f['email'].errors['required']">Escribe tu correo.</span>
              <span *ngIf="f['email'].errors['email']">Ese correo no tiene un formato válido.</span>
            </p>
          </div>

          <div class="campo">
            <label for="login-password">Contraseña</label>
            <input id="login-password" type="password" formControlName="password" autocomplete="current-password" />
            <p *ngIf="f['password'].touched && f['password'].errors?.['required']" class="campo-error">Escribe tu contraseña.</p>
          </div>

          <button type="submit" class="btn-forja" [disabled]="loginForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Entrando…' : 'Entrar' }}
          </button>

          <p class="puerta-pie">
            ¿Aún no tienes cuenta? <a routerLink="/register" class="enlace">Crear cuenta</a>
          </p>
        </form>
      </div>
    </main>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  sessionExpired = this.route.snapshot.queryParamMap.has('expired');

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
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Solo rutas internas, para no redirigir a otra web.
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = apiErrorMessage(err, 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.');
      },
    });
  }
}
