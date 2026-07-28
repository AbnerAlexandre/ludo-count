import { Routes } from '@angular/router';
import { localeResolver } from './core/i18n/locale.resolver';

const landing = () => import('./features/landing/landing').then((m) => m.Landing);
const azul = () => import('./features/azul/azul-page').then((m) => m.AzulPage);
const ttrSelect = () =>
  import('./features/ticket-to-ride/variant-select/variant-select').then((m) => m.VariantSelect);
const ttrCounter = () => import('./features/ticket-to-ride/counter/ttr-counter').then((m) => m.TtrCounter);

/** Rotas de um idioma. `theme` alimenta o tema por jogo; `locale` alimenta o i18n. */
function localizedRoutes(locale: 'pt' | 'en'): Routes {
  return [
    { path: '', loadComponent: landing, data: { animation: 'landing', theme: 'default', locale } },
    { path: 'azul', loadComponent: azul, data: { animation: 'azul', theme: 'azul', locale } },
    { path: 'ticket-to-ride', loadComponent: ttrSelect, data: { animation: 'ttr-select', theme: 'ttr', locale } },
    {
      path: 'ticket-to-ride/:variantId',
      loadComponent: ttrCounter,
      data: { animation: 'ttr-counter', theme: 'ttr', locale },
    },
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
  { path: '**', redirectTo: '' },
];
