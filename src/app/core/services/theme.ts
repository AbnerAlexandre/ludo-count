import { DOCUMENT, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Scheme = 'dark' | 'light';
export type GameTheme = 'default' | 'azul' | 'ttr' | 'sw';

const KEY = 'ludocount:scheme';

/**
 * Esquema claro/escuro e tema de cor do jogo ativo. Sem escolha salva, segue a
 * preferência do sistema operacional.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly scheme = signal<Scheme>('dark');
  readonly game = signal<GameTheme>('default');

  constructor() {
    if (this.isBrowser) {
      const saved = this.read();
      if (saved) this.scheme.set(saved);
      else if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches) {
        this.scheme.set('light');
      }
    }

    effect(() => {
      const el = this.doc.documentElement;
      if (this.scheme() === 'light') el.setAttribute('data-scheme', 'light');
      else el.removeAttribute('data-scheme');
    });

    effect(() => {
      this.doc.documentElement.setAttribute('data-theme', this.game());
    });
  }

  toggle(): void {
    const next: Scheme = this.scheme() === 'dark' ? 'light' : 'dark';
    this.scheme.set(next);
    if (this.isBrowser) {
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* armazenamento indisponível */
      }
    }
  }

  private read(): Scheme | null {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch {
      return null;
    }
  }
}
