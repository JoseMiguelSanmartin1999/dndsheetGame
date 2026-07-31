import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
];
