import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TTR_GENERIC_LOGO, TTR_VARIANTS } from '../scoring/ttr-variants';
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
  readonly match = inject(TtrMatch);

  readonly variants = TTR_VARIANTS;
  readonly genericLogo = TTR_GENERIC_LOGO;
  readonly activeId = computed(() => this.match.variant()?.id ?? null);
  readonly hasProgress = this.match.hasProgress;

  constructor() {
    inject(Title).setTitle('Ticket to Ride — LudoCount');
  }

  choose(id: string): void {
    this.match.selectVariant(id);
    this.router.navigate(['/ticket-to-ride', id]);
  }

  lengths(table: Record<number, number>): number[] {
    return Object.keys(table).map(Number).sort((a, b) => a - b);
  }
}
