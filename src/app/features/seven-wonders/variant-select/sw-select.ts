import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import { SevenWondersMatch } from '../../../core/services/sw-match';
import { PageHeader } from '../../../shared/ui/page-header';
import { SiteFooter } from '../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../shared/ui/history-panel';
import { Reveal } from '../../../shared/motion/reveal.directive';
import { SW_VARIANTS, findSwVariant, swExpName, swName, swNote, swTag, type SwVariant } from '../scoring/sw-variants';

/** Escolha da versão do 7 Wonders (base, Duel ou Architects). */
@Component({
  selector: 'app-sw-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, SiteFooter, HistoryPanel, Reveal],
  template: `
    <app-page-header [back]="base() || '/'">
      <img class="head-logo" src="7-wonders/7wonders-logo.png" alt="7 Wonders" width="1200" height="356" />
    </app-page-header>

    <main id="conteudo" class="wrap">
      <div class="intro">
        <p class="eyebrow">{{ i18n.t('sw.select.eyebrow') }}</p>
        <h1 class="display">{{ i18n.t('sw.select.h1') }}</h1>
        <p class="lede">{{ i18n.t('sw.select.lede') }}</p>
      </div>

      @if (active(); as a) {
        <a class="resume" [routerLink]="base() + '/7-wonders/' + a.id">
          <span class="dot" aria-hidden="true"></span>
          <span>
            {{ i18n.t('sw.select.resumePre') }} <strong>{{ name(a) }}</strong>
            @if (resumeGroup()) {
              <span class="tag">{{ i18n.tp('group.resume.tag', { n: resumeGroup() }) }}</span>
            }
            {{ i18n.t('sw.select.resumePost') }}
          </span>
          <span class="resume-go">{{ i18n.t('ttr.select.resumeGo') }} →</span>
        </a>
      }

      <ul class="list" role="list">
        @for (v of variants; track v.id; let i = $index) {
          <li class="enter" [style.animation-delay.ms]="i * 60">
            <a class="variant" [routerLink]="base() + '/7-wonders/' + v.id">
              <span class="num tabular" aria-hidden="true">0{{ i + 1 }}</span>
              <span class="body">
                <h2 class="display">{{ name(v) }}</h2>
                <span class="tag-line">{{ tag(v) }}</span>
                <span class="note">{{ note(v) }}</span>
                @if (v.expansions.length) {
                  <span class="exps">
                    @for (e of v.expansions; track e.id) {
                      <span class="tag">{{ exp(e) }}</span>
                    }
                  </span>
                }
              </span>
              <span class="go" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
            </a>
          </li>
        }
      </ul>

      <section class="panel hist" appReveal>
        <app-history-panel [game]="'sw'" [variantName]="historyName" />
      </section>
    </main>

    <app-site-footer />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 28px 16px 8px;
      }
      .intro {
        max-width: 62ch;
        margin-bottom: 22px;
      }
      .intro .eyebrow {
        margin: 0 0 10px;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 8vw, 3.2rem);
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.035em;
      }
      .lede {
        margin: 12px 0 0;
        color: var(--text-dim);
        font-size: 1.05rem;
        line-height: 1.6;
      }
      .resume {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px 12px;
        margin: 0 0 20px;
        padding: 14px 16px;
        border-radius: var(--radius-lg);
        background: color-mix(in srgb, var(--sw-fill) 12%, var(--surface));
        border: 1px solid color-mix(in srgb, var(--sw-fill) 40%, var(--line));
        color: var(--text-dim);
        text-decoration: none;
        font-size: 0.93rem;
      }
      .resume .tag {
        margin: 0 6px;
        vertical-align: 1px;
      }
      .resume strong {
        color: var(--text);
      }
      .resume .dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: var(--sw-fill);
      }
      .resume-go {
        margin-left: auto;
        font-weight: 800;
        color: var(--sw-text);
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--line);
      }
      .variant {
        position: relative;
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 22px 4px;
        border-bottom: 1px solid var(--line);
        color: var(--text);
        text-decoration: none;
        transition: background-color var(--dur-fast) ease;
      }
      @media (min-width: 700px) {
        .variant {
          grid-template-columns: 72px minmax(0, 1fr) 52px;
          gap: 16px;
          padding: 28px 12px;
        }
      }
      .num {
        font-family: var(--font-display);
        font-size: clamp(1.6rem, 6vw, 2.4rem);
        font-weight: 800;
        line-height: 1;
        color: var(--sw-text);
      }
      .body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      h2 {
        margin: 0;
        padding-right: 48px;
        font-size: clamp(1.4rem, 5vw, 1.9rem);
        font-weight: 800;
        letter-spacing: -0.025em;
      }
      @media (min-width: 700px) {
        h2 {
          padding-right: 0;
        }
      }
      .tag-line {
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-faint);
      }
      .note {
        max-width: 64ch;
        color: var(--text-dim);
        line-height: 1.55;
      }
      .exps {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      /* no celular a seta vira um selo no canto, para o texto usar a largura toda */
      .go {
        position: absolute;
        top: 18px;
        right: 4px;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: var(--radius);
        border: 1px solid var(--line);
        background: var(--surface);
        transition:
          transform 260ms var(--ease-out),
          background-color var(--dur-fast) ease,
          color var(--dur-fast) ease;
      }
      @media (min-width: 700px) {
        .go {
          position: static;
          width: 44px;
          height: 44px;
          align-self: center;
        }
      }
      .variant:active .go {
        transform: scale(0.94);
      }
      @media (hover: hover) and (pointer: fine) {
        .variant:hover {
          background: color-mix(in srgb, var(--sw-fill) 6%, transparent);
        }
        .variant:hover .go {
          transform: translateX(4px);
          background: var(--sw-fill);
          border-color: var(--sw-fill);
          color: var(--sw-ink);
        }
      }
      .hist {
        margin-top: 28px;
      }
    `,
  ],
})
export class SwSelect {
  private readonly seo = inject(Seo);
  private readonly m = inject(SevenWondersMatch);
  readonly i18n = inject(I18n);

  readonly variants = SW_VARIANTS;
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));
  readonly active = computed(() => {
    const r = this.m.resume();
    return r ? (findSwVariant(r.variantId) ?? null) : null;
  });
  /** partida em andamento é da mesa toda (quantos jogadores) */
  readonly resumeGroup = computed(() => (this.m.resume()?.group ? this.m.table.players().length : 0));

  readonly historyName = (id?: string) => {
    const v = id ? findSwVariant(id) : undefined;
    return v ? swName(v, this.i18n.locale()) : '7 Wonders';
  };

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.swSelect.title'),
        description: this.i18n.t('seo.swSelect.desc'),
        basePath: '/7-wonders',
        locale: this.i18n.locale(),
        breadcrumbs: [{ name: '7 Wonders', basePath: '/7-wonders' }],
      });
    });
  }

  name(v: SwVariant): string {
    return swName(v, this.i18n.locale());
  }
  tag(v: SwVariant): string {
    return swTag(v, this.i18n.locale());
  }
  note(v: SwVariant): string {
    return swNote(v, this.i18n.locale());
  }
  exp(e: SwVariant['expansions'][number]): string {
    return swExpName(e, this.i18n.locale());
  }
}
