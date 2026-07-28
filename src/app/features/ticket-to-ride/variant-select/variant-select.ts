import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import { TTR_GENERIC_LOGO, TTR_VARIANTS, variantName, variantNote, variantTag } from '../scoring/ttr-variants';
import { TtrMatch } from '../../../core/services/ttr-match';
import { TtrRail } from '../../../shared/svg/ttr-icons';

/**
 * Variant / edition picker. The counter only starts after a variant is chosen,
 * which determines the route table, the bonuses, and the mechanics shown.
 */
@Component({
  selector: 'app-ttr-variant-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TtrRail],
  templateUrl: './variant-select.html',
  styleUrl: './variant-select.scss',
})
export class VariantSelect {
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  readonly match = inject(TtrMatch);
  readonly i18n = inject(I18n);

  readonly variants = TTR_VARIANTS;
  readonly genericLogo = TTR_GENERIC_LOGO;
  readonly activeId = computed(() => this.match.variant()?.id ?? null);
  readonly hasProgress = this.match.hasProgress;

  /** Prefixo de rota do idioma atual. */
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.ttrSelect.title'),
        description: this.i18n.t('seo.ttrSelect.desc'),
        basePath: '/ticket-to-ride',
        locale: this.i18n.locale(),
      });
    });
  }

  name(v: (typeof TTR_VARIANTS)[number]): string {
    return variantName(v, this.i18n.locale());
  }
  tag(v: (typeof TTR_VARIANTS)[number]): string {
    return variantTag(v, this.i18n.locale());
  }
  note(v: (typeof TTR_VARIANTS)[number]): string {
    return variantNote(v, this.i18n.locale());
  }

  choose(id: string): void {
    this.match.selectVariant(id);
    this.router.navigate([...(this.i18n.locale() === 'en' ? ['/en'] : []), 'ticket-to-ride', id]);
  }

  lengths(table: Record<number, number>): number[] {
    return Object.keys(table).map(Number).sort((a, b) => a - b);
  }
}
