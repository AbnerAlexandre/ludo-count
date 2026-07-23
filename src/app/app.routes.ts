import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
    data: { animation: 'landing', theme: 'default' },
  },
  {
    path: 'azul',
    loadComponent: () => import('./features/azul/azul-page').then((m) => m.AzulPage),
    data: { animation: 'azul', theme: 'azul' },
  },
  {
    path: 'ticket-to-ride',
    loadComponent: () =>
      import('./features/ticket-to-ride/variant-select/variant-select').then((m) => m.VariantSelect),
    data: { animation: 'ttr-select', theme: 'ttr' },
  },
  {
    path: 'ticket-to-ride/:variantId',
    loadComponent: () =>
      import('./features/ticket-to-ride/counter/ttr-counter').then((m) => m.TtrCounter),
    data: { animation: 'ttr-counter', theme: 'ttr' },
  },
  { path: '**', redirectTo: '' },
];
