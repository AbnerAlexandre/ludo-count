import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import { TtrMatch } from '../../../core/services/ttr-match';
import { MatchHistory, type HistoryPart } from '../../../core/services/match-history';
import { AuditSheet } from '../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { PageHeader } from '../../../shared/ui/page-header';
import { SiteFooter } from '../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../shared/ui/history-panel';
import { NumField } from '../../../shared/ui/num-field';
import { Switch } from '../../../shared/ui/switch';
import { ScoreTicker } from '../../../shared/motion/score-ticker';
import { pop } from '../../../shared/motion/motion-utils';
import { TtrLocomotive } from '../../../shared/svg/ttr-icons';
import {
  TTR_GENERIC_LOGO,
  bonusHint,
  bonusLabel,
  findVariant,
  variantName,
  variantNote,
  type BonusSpec,
  type TtrVariant,
} from '../scoring/ttr-variants';
import { SITE_URL } from '../../../core/seo/seo.config';

@Component({
  selector: 'app-ttr-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuditSheet,
    ConfirmDialog,
    PageHeader,
    SiteFooter,
    HistoryPanel,
    NumField,
    Switch,
    ScoreTicker,
    TtrLocomotive,
  ],
  templateUrl: './ttr-counter.html',
  styleUrl: './ttr-counter.scss',
})
export class TtrCounter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);
  readonly match = inject(TtrMatch);
  readonly i18n = inject(I18n);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | null>(null);

  /** valor do bilhete sendo registrado */
  readonly ticketValue = signal(8);
  readonly terrainEnabled = signal(false);

  readonly variant = this.match.variant;
  readonly finished = this.match.finished;
  readonly selectPath = computed(() => `${this.i18n.locale() === 'en' ? '/en' : ''}/ticket-to-ride`);

  readonly headerLogo = computed(() => this.variant()?.logo ?? TTR_GENERIC_LOGO);
  readonly usesGenericLogo = computed(() => !this.variant()?.logo);

  readonly routeLengths = computed(() => {
    const v = this.variant();
    return v
      ? Object.keys(v.routeTable)
          .map(Number)
          .sort((a, b) => a - b)
      : [];
  });

  readonly parts = computed<HistoryPart[]>(() => {
    const v = this.variant();
    const out: HistoryPart[] = [
      { key: 'history.part.routes', points: this.match.routesTotal() },
      { key: 'history.part.tickets', points: this.match.ticketsTotal() },
    ];
    if (v?.bonuses.length) out.push({ key: 'history.part.bonus', points: this.match.bonusesTotal() });
    return out;
  });

  /** nome da edição salva no histórico */
  readonly historyName = (id?: string) => {
    const v = id ? findVariant(id) : undefined;
    return v ? variantName(v, this.i18n.locale()) : 'Ticket to Ride';
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('variantId')!;
    if (!this.match.selectVariant(id)) this.router.navigateByUrl(this.selectPath());

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
        breadcrumbs: [
          { name: 'Ticket to Ride', basePath: '/ticket-to-ride' },
          { name, basePath: `/ticket-to-ride/${v.id}` },
        ],
      });
    });

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`Ticket - ${this.match.total()}`));
    }
  }

  variantName(): string {
    const v = this.variant();
    return v ? variantName(v, this.i18n.locale()) : '';
  }
  note(v: TtrVariant): string {
    return variantNote(v, this.i18n.locale());
  }
  bonusLabel(spec: BonusSpec): string {
    return bonusLabel(spec, this.i18n.locale());
  }
  bonusHint(spec: BonusSpec): string | undefined {
    return bonusHint(spec, this.i18n.locale());
  }
  points(v: TtrVariant, len: number): number {
    return this.terrainEnabled() && v.terrainTable ? v.terrainTable[len] : v.routeTable[len];
  }

  addRoute(length: number, event: Event): void {
    const v = this.variant();
    this.match.addRoute(length, !!v?.terrainTable && this.terrainEnabled());
    pop(event.currentTarget as Element, 0.9);
  }

  addTicket(completed: boolean): void {
    this.match.addTicket(this.ticketValue(), completed);
  }

  bonusNumber(spec: BonusSpec): number {
    const v = this.match.bonusValue(spec);
    return typeof v === 'number' ? v : 0;
  }
  bonusOn(spec: BonusSpec): boolean {
    return this.match.bonusValue(spec) === true;
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmFinish(): void {
    this.match.finish();
    this.history.record('ttr', {
      variantId: this.variant()?.id,
      total: this.match.total(),
      parts: this.parts().filter((p) => p.points !== 0),
    });
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.terrainEnabled.set(false);
    this.confirm.set(null);
    this.router.navigateByUrl(this.selectPath());
  }
}
