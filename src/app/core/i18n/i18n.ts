import { Injectable, signal } from '@angular/core';
import { DICT } from './dictionary';

export type Locale = 'pt' | 'en';

export const LOCALES: Locale[] = ['pt', 'en'];

/**
 * i18n em tempo de execução, baseado em signals. O idioma vem do prefixo da URL
 * (`/` = pt, `/en` = en), resolvido antes de cada rota renderizar — então o
 * prerender gera o HTML no idioma certo e a troca no navegador é instantânea
 * (as expressões `i18n.t(...)` nos templates são reativas ao signal `locale`).
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  readonly locale = signal<Locale>('pt');

  setLocale(l: Locale): void {
    if (l !== this.locale()) this.locale.set(l);
  }

  /** Tradução simples por chave, com fallback para pt e depois para a própria chave. */
  t(key: string): string {
    const l = this.locale();
    return DICT[l][key] ?? DICT.pt[key] ?? key;
  }

  /** Tradução com interpolação de {placeholders}. */
  tp(key: string, params: Record<string, string | number>): string {
    let s = this.t(key);
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return s;
  }
}

/** Caminho localizado a partir do caminho-base em pt. '' = home. */
export function localizedPath(basePath: string, locale: Locale): string {
  const base = basePath === '/' ? '' : basePath;
  if (locale === 'en') return base === '' ? '/en' : `/en${base}`;
  return base === '' ? '/' : base;
}
