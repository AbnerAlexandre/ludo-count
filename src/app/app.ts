import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { I18n } from './core/i18n/i18n';
import { ThemeService, type GameTheme } from './core/services/theme';

/**
 * Shell do app: aplica o tema de cor do jogo a partir dos dados da rota. Os
 * controles de idioma e tema moram no cabeçalho de cada página.
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
  private readonly theme = inject(ThemeService);
  readonly i18n = inject(I18n);

  private readonly routeTheme = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let r = this.route.firstChild;
        while (r?.firstChild) r = r.firstChild;
        return ((r?.snapshot.data['theme'] as GameTheme) ?? 'default') as GameTheme;
      }),
    ),
    { initialValue: 'default' as GameTheme },
  );

  /** exposto para os testes do shell */
  readonly scheme = this.theme.scheme;

  constructor() {
    effect(() => this.theme.game.set(this.routeTheme()));
  }

  toggleScheme(): void {
    this.theme.toggle();
  }
}
