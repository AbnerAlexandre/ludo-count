import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../core/i18n/i18n';
import { TTR_VARIANTS, variantName } from '../../features/ticket-to-ride/scoring/ttr-variants';
import { SW_VARIANTS, swName } from '../../features/seven-wonders/scoring/sw-variants';
import { BrandMark } from '../svg/marks';

/**
 * Rodapé de todas as páginas: navegação para cada contador (ajuda o jogador e
 * dá ao buscador um caminho até todas as páginas), contato e nota de privacidade.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BrandMark],
  template: `
    <footer class="foot">
      <div class="inner">
        <div class="brand-col">
          <a class="brand" [routerLink]="base() || '/'">
            <app-brand-mark />
            <span class="brand-type">LudoCount</span>
          </a>
          <p class="privacy">{{ i18n.t('footer.privacy') }}</p>
          <div class="contact">
            <span class="label">{{ i18n.t('landing.contact.label') }}</span>
            <div class="links">
              <a href="https://www.linkedin.com/in/abner-da-silva-394296161/" target="_blank" rel="noopener noreferrer me">LinkedIn</a>
              <button type="button" (click)="copyDiscord()" [attr.aria-label]="i18n.t('landing.contact.copyDiscord') + ' ' + discord">
                {{ copied() ? i18n.t('landing.contact.copied') : 'Discord ' + discord }}
              </button>
            </div>
          </div>
        </div>

        <nav class="nav" [attr.aria-label]="i18n.t('footer.nav')">
          <div class="col">
            <h2 class="col-title">Azul</h2>
            <a [routerLink]="base() + '/azul'">{{ i18n.t('footer.azulCounter') }}</a>
          </div>
          <div class="col">
            <h2 class="col-title">Ticket to Ride</h2>
            <a [routerLink]="base() + '/ticket-to-ride'">{{ i18n.t('footer.allEditions') }}</a>
            <ul role="list" class="inline">
              @for (v of ttr(); track v.id) {
                <li><a [routerLink]="base() + '/ticket-to-ride/' + v.id">{{ v.name }}</a></li>
              }
            </ul>
          </div>
          <div class="col">
            <h2 class="col-title">7 Wonders</h2>
            @for (v of sw(); track v.id) {
              <a [routerLink]="base() + '/7-wonders/' + v.id">{{ v.name }}</a>
            }
          </div>
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
      .foot {
        border-top: 1px solid var(--line);
        margin-top: 64px;
        padding: 40px 16px calc(40px + env(safe-area-inset-bottom));
        color: var(--text-dim);
        font-size: 0.9rem;
      }
      .inner {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 36px;
      }
      @media (min-width: 900px) {
        .inner {
          grid-template-columns: minmax(240px, 0.8fr) 2fr;
        }
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--text);
        text-decoration: none;
        font-size: 1.3rem;
        font-weight: 800;
      }
      .privacy {
        margin: 12px 0 18px;
        max-width: 36ch;
        line-height: 1.55;
      }
      .label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-faint);
        font-size: 0.82rem;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
      }
      .links a,
      .links button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        padding: 0;
        border: none;
        background: none;
        color: var(--text);
        font: inherit;
        font-weight: 700;
        text-decoration: underline;
        text-decoration-color: var(--line-strong);
        text-underline-offset: 4px;
        cursor: pointer;
      }
      .nav {
        display: grid;
        gap: 28px;
      }
      @media (min-width: 640px) {
        .nav {
          grid-template-columns: 0.7fr 1.6fr 1fr;
        }
      }
      .col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .col-title {
        margin: 0 0 6px;
        font-family: var(--font-display);
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text);
      }
      .col a {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        color: var(--text-dim);
        text-decoration: none;
      }
      .inline {
        list-style: none;
        margin: 4px 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0 14px;
      }
      .inline a {
        font-size: 0.86rem;
        color: var(--text-faint);
      }
      @media (hover: hover) and (pointer: fine) {
        .col a:hover,
        .links a:hover,
        .links button:hover {
          color: var(--text);
          text-decoration-color: currentColor;
        }
      }
    `,
  ],
})
export class SiteFooter {
  readonly i18n = inject(I18n);
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));
  readonly discord = '@graaay.sh';
  readonly copied = signal(false);

  readonly ttr = computed(() => TTR_VARIANTS.map((v) => ({ id: v.id, name: variantName(v, this.i18n.locale()) })));
  readonly sw = computed(() => SW_VARIANTS.map((v) => ({ id: v.id, name: swName(v, this.i18n.locale()) })));

  copyDiscord(): void {
    navigator.clipboard?.writeText(this.discord).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      },
      () => {},
    );
  }
}
