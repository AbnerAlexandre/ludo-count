import { Routes } from '@angular/router';
import { localeResolver } from './core/i18n/locale.resolver';

const landing = () => import('./features/landing/landing').then((m) => m.Landing);
const azul = () => import('./features/azul/azul-page').then((m) => m.AzulPage);
const ttrSelect = () =>
  import('./features/ticket-to-ride/variant-select/variant-select').then((m) => m.VariantSelect);
const ttrCounter = () => import('./features/ticket-to-ride/counter/ttr-counter').then((m) => m.TtrCounter);
const swSelect = () => import('./features/seven-wonders/variant-select/sw-select').then((m) => m.SwSelect);
const swCounter = () => import('./features/seven-wonders/counter/sw-counter').then((m) => m.SwCounter);
const notFound = () => import('./features/not-found/not-found').then((m) => m.NotFound);

/** Rotas de um idioma. `theme` alimenta a cor do jogo; `locale` alimenta o i18n. */
function localizedRoutes(locale: 'pt' | 'en'): Routes {
  return [
    { path: '', loadComponent: landing, data: { theme: 'default', locale } },
    { path: 'azul', loadComponent: azul, data: { theme: 'azul', locale } },
    { path: 'ticket-to-ride', loadComponent: ttrSelect, data: { theme: 'ttr', locale } },
    { path: 'ticket-to-ride/:variantId', loadComponent: ttrCounter, data: { theme: 'ttr', locale } },
    { path: '7-wonders', loadComponent: swSelect, data: { theme: 'sw', locale } },
    { path: '7-wonders/:variantId', loadComponent: swCounter, data: { theme: 'sw', locale } },
    { path: '404', loadComponent: notFound, data: { theme: 'default', locale } },
    { path: '**', loadComponent: notFound, data: { theme: 'default', locale } },
  ];
}

export const routes: Routes = [
  // inglês sob /en
  {
    path: 'en',
    resolve: { locale: localeResolver },
    data: { locale: 'en' },
    children: localizedRoutes('en'),
  },
  // português na raiz (idioma padrão)
  {
    path: '',
    resolve: { locale: localeResolver },
    data: { locale: 'pt' },
    children: localizedRoutes('pt'),
  },
];
