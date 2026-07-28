import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import { TtrMatch } from '../../../core/services/ttr-match';
import { AuditSheet } from '../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { TtrLocomotive, TtrRail } from '../../../shared/svg/ttr-icons';
import { TTR_GENERIC_LOGO, bonusHint, bonusLabel, variantName, variantNote, type BonusSpec } from '../scoring/ttr-variants';
import { SITE_URL } from '../../../core/seo/seo.config';

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
  private readonly seo = inject(Seo);
  readonly match = inject(TtrMatch);
  readonly i18n = inject(I18n);

  readonly showAudit = signal(false);
  /** which confirmation dialog is open, if any */
  readonly confirm = signal<'finish' | 'new' | null>(null);

  /** ticket entry draft */
  readonly ticketValue = signal(1);

  readonly variant = this.match.variant;
  readonly finished = this.match.finished;

  /** edition logo for the header; editions without their own art use the generic one */
  readonly headerLogo = computed(() => this.variant()?.logo ?? TTR_GENERIC_LOGO);
  /** when the generic logo is used the edition isn't identifiable, so we caption it */
  readonly usesGenericLogo = computed(() => !this.variant()?.logo);

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
    if (!ok) this.router.navigate([...(this.i18n.locale() === 'en' ? ['/en'] : []), 'ticket-to-ride']);

    effect(() => {
      const v = this.match.variant();
      if (!v) return;
      const loc = this.i18n.locale();
      const name = variantName(v, loc);
      const bonuses = v.bonuses.map((b) => bonusLabel(b, loc)).join(', ');
      this.seo.update({
        title: this.i18n.tp('seo.ttrCounter.title', { name }),
        description: this.i18n.tp('seo.ttrCounter.desc', { name, bonuses }),
        basePath: `/ticket-to-ride/${v.id}`,
        locale: loc,
        image: v.logo ? `${SITE_URL}/${v.logo}` : undefined,
      });
    });

    // No browser o título acompanha o placar ao vivo. No prerender ele é
    // preservado descritivo, senão o buscador indexaria "Ticket - 0".
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => {
        this.seo.setTitle(`Ticket - ${this.match.total()}`);
      });
    }
  }

  variantName(): string {
    const v = this.variant();
    return v ? variantName(v, this.i18n.locale()) : '';
  }
  note(v: NonNullable<ReturnType<typeof this.variant>>): string {
    return variantNote(v, this.i18n.locale());
  }
  bonusLabel(spec: BonusSpec): string {
    return bonusLabel(spec, this.i18n.locale());
  }
  bonusHint(spec: BonusSpec): string | undefined {
    return bonusHint(spec, this.i18n.locale());
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

  confirmFinish(): void {
    this.match.finish();
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.terrainEnabled.set(false);
    this.confirm.set(null);
    this.router.navigate([...(this.i18n.locale() === 'en' ? ['/en'] : []), 'ticket-to-ride']);
  }
}
