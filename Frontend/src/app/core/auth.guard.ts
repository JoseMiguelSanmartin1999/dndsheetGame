import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../data/services/auth.service';

/** Solo deja pasar con sesión iniciada; si no, manda al login y recuerda a dónde iba. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Solo para administradores. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated() && auth.currentUser()?.role === 'admin') return true;
  return inject(Router).createUrlTree(['/dashboard']);
};

/** Si ya hay sesión, el login y el registro llevan directo al panel. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
