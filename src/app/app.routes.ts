import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'game', loadComponent: () => import('./features/game/game.component').then(m => m.GameComponent) },
  { path: 'result', loadComponent: () => import('./features/result/result.component').then(m => m.ResultComponent) },
  { path: '**', redirectTo: '' }
];
