import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../../core/seo/seo';
import { I18n } from '../../core/i18n/i18n';
import { PageHeader } from '../../shared/ui/page-header';
import { SiteFooter } from '../../shared/ui/site-footer';
import { BrandMark } from '../../shared/svg/marks';

/** Página não encontrada — marcada como noindex, com atalhos para os contadores. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, SiteFooter, BrandMark],
  template: `
    <app-page-header>
      <a class="brand" [routerLink]="base() || '/'">
        <app-brand-mark />
        <span class="brand-type">LudoCount</span>
      </a>
    </app-page-header>
    <main id="conteudo" class="nf">
      <p class="code display" aria-hidden="true">404</p>
      <h1 class="display">{{ i18n.t('nf.h1') }}</h1>
      <p class="lede">{{ i18n.t('nf.p') }}</p>
      <nav class="links" [attr.aria-label]="i18n.t('footer.nav')">
        <a class="btn btn-quiet" [routerLink]="base() + '/azul'">Azul</a>
        <a class="btn btn-quiet" [routerLink]="base() + '/ticket-to-ride'">Ticket to Ride</a>
        <a class="btn btn-quiet" [routerLink]="base() + '/7-wonders'">7 Wonders</a>
        <a class="btn btn-primary" [routerLink]="base() || '/'">{{ i18n.t('nf.home') }}</a>
      </nav>
    </main>
    <app-site-footer />
  `,
  styles: [
    `
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--text);
        text-decoration: none;
        font-size: 1.28rem;
        font-weight: 800;
      }
      .nf {
        max-width: 720px;
        margin: 0 auto;
        padding: 64px 16px 24px;
      }
      .code {
        margin: 0;
        font-size: clamp(5rem, 26vw, 9rem);
        font-weight: 800;
        line-height: 0.9;
        letter-spacing: -0.05em;
        color: var(--line-strong);
      }
      h1 {
        margin: 12px 0 0;
        font-size: clamp(1.7rem, 6vw, 2.4rem);
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .lede {
        margin: 10px 0 24px;
        color: var(--text-dim);
        line-height: 1.6;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
    `,
  ],
})
export class NotFound {
  readonly i18n = inject(I18n);
  private readonly seo = inject(Seo);
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('nf.title'),
        description: this.i18n.t('nf.p'),
        basePath: '/404',
        locale: this.i18n.locale(),
        noindex: true,
      });
    });
  }
}
