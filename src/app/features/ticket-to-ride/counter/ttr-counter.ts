import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TtrMatch } from '../../../core/services/ttr-match';
import { AuditSheet } from '../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { TtrLocomotive, TtrRail } from '../../../shared/svg/ttr-icons';
import type { BonusSpec } from '../scoring/ttr-variants';

@Component({
  selector: 'app-ttr-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AuditSheet, ConfirmDialog, TtrLocomotive, TtrRail],
  templateUrl: './ttr-counter.html',
  styleUrl: './ttr-counter.scss',
})
export class TtrCounter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly match = inject(TtrMatch);

  readonly showAudit = signal(false);
  readonly showConfirm = signal(false);

  /** ticket entry draft */
  readonly ticketValue = signal(1);

  readonly variant = this.match.variant;

  readonly routeLengths = computed(() => {
    const v = this.variant();
    if (!v) return [];
    return Object.keys(v.routeTable)
      .map(Number)
      .sort((a, b) => a - b);
  });

  readonly terrainEnabled = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('variantId')!;
    const ok = this.match.selectVariant(id);
    if (!ok) this.router.navigate(['/ticket-to-ride']);
  }

  addRoute(length: number): void {
    const v = this.variant();
    const terrain = !!v?.terrainTable && this.terrainEnabled();
    this.match.addRoute(length, terrain);
  }

  addTicket(completed: boolean): void {
    this.match.addTicket(this.ticketValue(), completed);
  }

  /** Keep the ticket-value input strictly numeric. */
  onTicketInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/[^0-9]/g, '').slice(0, 3);
    el.value = digits;
    this.ticketValue.set(digits === '' ? 0 : parseInt(digits, 10));
  }

  /** Block non-numeric keys (e, E, +, -, ., etc.) that type=number would otherwise allow. */
  blockNonNumericKey(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
  }

  /** On blur, an empty field falls back to 1 so the stepper stays usable. */
  normalizeTicketValue(): void {
    if (this.ticketValue() < 1) this.ticketValue.set(1);
  }

  // bonus helpers ------------------------------------------------------------
  bonusNumber(spec: BonusSpec): number {
    const v = this.match.bonusValue(spec);
    return typeof v === 'number' ? v : 0;
  }
  bonusOn(spec: BonusSpec): boolean {
    return this.match.bonusValue(spec) === true;
  }
  toggleBonus(spec: BonusSpec): void {
    this.match.setBonus(spec, !this.bonusOn(spec));
  }
  bumpBonus(spec: BonusSpec, dir: number): void {
    this.match.adjustBonus(spec, dir);
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.terrainEnabled.set(false);
    this.showConfirm.set(false);
    this.router.navigate(['/ticket-to-ride']);
  }
}
