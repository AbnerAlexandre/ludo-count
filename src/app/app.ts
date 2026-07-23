import { Component, DOCUMENT, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * App shell. Drives the per-game color theme from the active route's data and
 * exposes a light/dark scheme toggle. The router itself provides the animated
 * page transitions (withViewTransitions).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doc = inject(DOCUMENT);

  readonly scheme = signal<'dark' | 'light'>('dark');

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
    const saved = localStorage.getItem('ludocount:scheme');
    if (saved === 'light' || saved === 'dark') this.scheme.set(saved);

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
      localStorage.setItem('ludocount:scheme', s);
    });
  }

  toggleScheme(): void {
    this.scheme.update((s) => (s === 'dark' ? 'light' : 'dark'));
  }
}
