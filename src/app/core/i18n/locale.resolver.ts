import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { I18n, type Locale } from './i18n';

/**
 * Define o idioma a partir de `route.data.locale` antes da rota ativar. Como o
 * resolver roda de forma síncrona antes da renderização, o prerender já gera o
 * HTML no idioma certo e o navegador não pisca de pt para en.
 */
export const localeResolver: ResolveFn<Locale> = (route) => {
  const locale = (route.data['locale'] as Locale) ?? 'pt';
  inject(I18n).setLocale(locale);
  return locale;
};
