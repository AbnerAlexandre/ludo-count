import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { I18n } from '../../core/i18n/i18n';
import { ThemeService } from '../../core/services/theme';

/**
 * Cabeçalho único de todas as telas: voltar, identidade (conteúdo projetado) e
 * os controles de idioma e tema no fluxo do layout — nada flutuando por cima
 * do conteúdo.
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="bar">
      <div class="inner">
        @if (back()) {
          <a class="icon-btn back" [routerLink]="back()" [attr.aria-label]="backLabel() || i18n.t('common.backHome')">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        }
        <div class="identity"><ng-content /></div>
        <div class="controls">
          <a
            class="icon-btn lang"
            [routerLink]="otherLocaleUrl()"
            [attr.hreflang]="i18n.locale() === 'en' ? 'pt-BR' : 'en'"
            [attr.aria-label]="i18n.t('lang.switchTo')"
            >{{ i18n.locale() === 'en' ? 'PT' : 'EN' }}</a
          >
          <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="i18n.t('common.themeToggle')">
            @if (theme.scheme() === 'dark') {
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z" />
              </svg>
            }
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 40;
      }
      .bar {
        background: color-mix(in srgb, var(--bg) 88%, transparent);
        backdrop-filter: blur(12px) saturate(1.2);
        -webkit-backdrop-filter: blur(12px) saturate(1.2);
        border-bottom: 1px solid var(--line);
        padding-top: env(safe-area-inset-top);
      }
      .inner {
        max-width: 1180px;
        margin: 0 auto;
        height: var(--header-h);
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .identity {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .controls {
        display: flex;
        gap: 8px;
      }
      .lang {
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class PageHeader {
  readonly i18n = inject(I18n);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  /** rota do botão voltar; sem valor, o botão não aparece */
  readonly back = input<string | null>(null);
  readonly backLabel = input<string>('');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** mesma página no outro idioma */
  readonly otherLocaleUrl = computed(() => {
    const url = this.url().split('#')[0].split('?')[0];
    if (url === '/en' || url.startsWith('/en/')) return url.slice(3) || '/';
    return url === '/' ? '/en' : `/en${url}`;
  });
}
