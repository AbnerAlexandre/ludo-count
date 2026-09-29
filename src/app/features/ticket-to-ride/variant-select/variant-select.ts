import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import {
  TTR_GENERIC_LOGO,
  TTR_VARIANTS,
  bonusLabel,
  findVariant,
  variantName,
  variantNote,
  variantTag,
  type TtrVariant,
} from '../scoring/ttr-variants';
import { TtrMatch } from '../../../core/services/ttr-match';
import { PageHeader } from '../../../shared/ui/page-header';
import { SiteFooter } from '../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../shared/ui/history-panel';
import { Reveal } from '../../../shared/motion/reveal.directive';

/**
 * Escolha da edição. O contador só começa depois dela, porque a edição define a
 * tabela de rotas, os bônus e as mecânicas mostradas.
 */
@Component({
  selector: 'app-ttr-variant-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, SiteFooter, HistoryPanel, Reveal],
  templateUrl: './variant-select.html',
  styleUrl: './variant-select.scss',
})
export class VariantSelect {
  private readonly seo = inject(Seo);
  readonly match = inject(TtrMatch);
  readonly i18n = inject(I18n);

  readonly variants = TTR_VARIANTS;
  readonly genericLogo = TTR_GENERIC_LOGO;
  readonly activeId = computed(() => (this.match.hasProgress() ? (this.match.variant()?.id ?? null) : null));
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));

  /** nome da edição salva no histórico */
  readonly historyName = (id?: string) => {
    const v = id ? findVariant(id) : undefined;
    return v ? variantName(v, this.i18n.locale()) : 'Ticket to Ride';
  };

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.ttrSelect.title'),
        description: this.i18n.t('seo.ttrSelect.desc'),
        basePath: '/ticket-to-ride',
        locale: this.i18n.locale(),
        breadcrumbs: [{ name: 'Ticket to Ride', basePath: '/ticket-to-ride' }],
      });
    });
  }

  name(v: TtrVariant): string {
    return variantName(v, this.i18n.locale());
  }
  tag(v: TtrVariant): string {
    return variantTag(v, this.i18n.locale());
  }
  note(v: TtrVariant): string {
    return variantNote(v, this.i18n.locale());
  }
  bonus(v: TtrVariant): string[] {
    return v.bonuses.map((b) => bonusLabel(b, this.i18n.locale()));
  }
  lengths(table: Record<number, number>): number[] {
    return Object.keys(table)
      .map(Number)
      .sort((a, b) => a - b);
  }
}
