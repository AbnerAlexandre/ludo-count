import { Component, DOCUMENT, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { I18n } from './core/i18n/i18n';

/**
 * App shell. Drives the per-game color theme from the active route's data and
 * exposes a light/dark scheme toggle. The router itself provides the animated
 * page transitions (withViewTransitions).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doc = inject(DOCUMENT);
  readonly i18n = inject(I18n);
  /** localStorage não existe durante o prerender (Node) */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly scheme = signal<'dark' | 'light'>('dark');

  /** URL atual (para calcular o link do outro idioma) */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Mesma página no outro idioma, para o botão de troca. */
  readonly otherLocaleUrl = computed(() => {
    const url = this.currentUrl().split('#')[0].split('?')[0];
    if (url === '/en' || url.startsWith('/en/')) {
      return url.slice(3) || '/'; // en -> pt
    }
    return url === '/' ? '/en' : `/en${url}`; // pt -> en
  });

  /** current route's theme tag ('azul' | 'ttr' | 'default') */
  private readonly theme = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let r = this.route.firstChild;
        while (r?.firstChild) r = r.firstChild;
        return (r?.snapshot.data['theme'] as string) ?? 'default';
      }),
    ),
    { initialValue: 'default' },
  );

  constructor() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('ludocount:scheme');
      if (saved === 'light' || saved === 'dark') this.scheme.set(saved);
    }

    effect(() => {
      const el = this.doc.documentElement;
      const theme = this.theme();
      if (theme === 'default') el.removeAttribute('data-theme');
      else el.setAttribute('data-theme', theme);
    });

    effect(() => {
      const s = this.scheme();
      const el = this.doc.documentElement;
      if (s === 'light') el.setAttribute('data-scheme', 'light');
      else el.removeAttribute('data-scheme');
      if (this.isBrowser) localStorage.setItem('ludocount:scheme', s);
    });
  }

  toggleScheme(): void {
    this.scheme.update((s) => (s === 'dark' ? 'light' : 'dark'));
  }
}
