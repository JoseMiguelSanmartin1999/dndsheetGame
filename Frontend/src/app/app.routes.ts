import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'character-creator',
    canActivate: [authGuard],
    loadComponent: () => import('./features/character-creator/character-creator.component').then(m => m.CharacterCreatorComponent)
  },
  {
    path: 'character-sheet/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/character-sheet/character-sheet.component').then(m => m.CharacterSheetComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
