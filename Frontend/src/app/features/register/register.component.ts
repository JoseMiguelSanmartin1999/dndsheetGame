import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../data/services/auth.service';
import { ForjaHeroComponent } from '../../shared/components/forja-hero/forja-hero.component';
import { apiErrorMessage } from '../../core/api-error';

// Validador personalizado de edad mínima
export function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= minAge ? null : { minAge: { required: minAge, actual: age } };
  };
}

// Validador personalizado para confirmar coincidencia de contraseñas
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ForjaHeroComponent],
  template: `
    <main class="puerta">
      <app-forja-hero></app-forja-hero>

      <div class="puerta-panel">
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="puerta-form" novalidate>
          <h2 class="titulo">Crear cuenta</h2>
          <p class="intro">Es gratis. Tus personajes quedan guardados en tu cuenta.</p>

          <p *ngIf="errorMessage" class="aviso aviso-error" role="alert">{{ errorMessage }}</p>
          <p *ngIf="successMessage" class="aviso aviso-ok" role="status">{{ successMessage }}</p>

          <div class="pareja">
            <div class="campo">
              <label for="reg-username">Nombre de usuario</label>
              <input id="reg-username" type="text" formControlName="username" autocomplete="username" maxlength="10" />
              <p *ngIf="f['username'].touched && f['username'].errors" class="campo-error">
                <span *ngIf="f['username'].errors['required']">Elige un nombre de usuario.</span>
                <span *ngIf="f['username'].errors['maxlength']">Máximo 10 caracteres.</span>
              </p>
            </div>
            <div class="campo">
              <label for="reg-dob">Fecha de nacimiento</label>
              <input id="reg-dob" type="date" formControlName="dateOfBirth" autocomplete="bday" />
              <p *ngIf="f['dateOfBirth'].touched && f['dateOfBirth'].errors" class="campo-error">
                <span *ngIf="f['dateOfBirth'].errors['required']">Indica tu fecha de nacimiento.</span>
                <span *ngIf="f['dateOfBirth'].errors['minAge']">Necesitas tener al menos 12 años.</span>
              </p>
            </div>
          </div>

          <div class="campo">
            <label for="reg-email">Correo electrónico</label>
            <input id="reg-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@correo.com" />
            <p *ngIf="f['email'].touched && f['email'].errors" class="campo-error">
              <span *ngIf="f['email'].errors['required']">Escribe tu correo.</span>
              <span *ngIf="f['email'].errors['email']">Ese correo no tiene un formato válido.</span>
            </p>
          </div>

          <div class="pareja">
            <div class="campo">
              <label for="reg-password">Contraseña</label>
              <input id="reg-password" type="password" formControlName="password" autocomplete="new-password" />
            </div>
            <div class="campo">
              <label for="reg-password2">Repite la contraseña</label>
              <input id="reg-password2" type="password" formControlName="confirmPassword" autocomplete="new-password" />
            </div>
          </div>
          <p class="campo-ayuda" [class.campo-error]="f['password'].touched && f['password'].errors?.['pattern']">
            Al menos 6 caracteres, con una mayúscula, un número y un símbolo (. &#64; # $ ! % * ? &amp;).
          </p>
          <p *ngIf="registerForm.errors?.['passwordMismatch'] && f['confirmPassword'].touched" class="campo-error">
            Las contraseñas no coinciden.
          </p>

          <fieldset class="campo eleccion">
            <legend class="campo-etiqueta">¿Has jugado antes a juegos de rol de mesa?</legend>
            <label><input type="radio" value="false" formControlName="hasPlayedBefore" /> Es mi primera vez</label>
            <label><input type="radio" value="true" formControlName="hasPlayedBefore" /> Ya he jugado</label>
          </fieldset>

          <label class="terminos">
            <input type="checkbox" formControlName="acceptTerms" />
            <span>Acepto que mis datos y personajes se guarden en esta web.</span>
          </label>
          <p *ngIf="f['acceptTerms'].touched && f['acceptTerms'].errors" class="campo-error">Debes aceptarlo para crear la cuenta.</p>

          <button type="submit" class="btn-forja" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>

          <p class="puerta-pie">¿Ya tienes cuenta? <a routerLink="/login" class="enlace">Entrar</a></p>
        </form>
      </div>
    </main>
  `,
  styles: [`
    .pareja { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 480px) { .pareja { grid-template-columns: 1fr; } }
    .eleccion { border: 0; margin: 0; padding: 0; }
    .eleccion label, .terminos { display: flex; gap: 0.6rem; align-items: center; color: var(--color-pergamino); cursor: pointer; }
    .eleccion { gap: 0.45rem; }
    .terminos { align-items: flex-start; color: var(--color-ceniza); font-size: 0.95rem; }
    input[type='radio'], input[type='checkbox'] { accent-color: var(--color-brasa); width: 1.05rem; height: 1.05rem; margin-top: 0.15rem; }
  `],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Definimos el formulario con sus respectivas validaciones
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', [Validators.required, minAgeValidator(12)]],
      password: ['', [
        Validators.required, 
        // Valida: mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial de la lista (. @ # $ ! % * ? &)
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[.@#$!%*?&])[A-Za-z\d.@#$!%*?&]{6,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      hasPlayedBefore: ['false', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: passwordMatchValidator });
  }

  // Helper para acceder a los campos de manera abreviada en el template
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, email, dateOfBirth, password, hasPlayedBefore } = this.registerForm.value;

    this.authService.register({
      username,
      email,
      dateOfBirth,
      password,
      hasPlayedBefore: hasPlayedBefore === 'true'
    }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Cuenta creada. Te llevamos a la pantalla de entrada…';
        this.registerForm.reset({ hasPlayedBefore: 'false', acceptTerms: false });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = apiErrorMessage(err, 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.');
      }
    });
  }
}
