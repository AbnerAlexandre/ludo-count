import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Seo } from '../../../../core/seo/seo';
import { I18n } from '../../../../core/i18n/i18n';
import { AzulSintraMatch } from '../../../../core/services/azul-sintra-match';
import { MatchHistory } from '../../../../core/services/match-history';
import { AuditSheet } from '../../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { PageHeader } from '../../../../shared/ui/page-header';
import { SiteFooter } from '../../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../../shared/ui/history-panel';
import { NumField } from '../../../../shared/ui/num-field';
import { Choice, type ChoiceOption } from '../../../../shared/ui/choice';
import { ScoreTicker } from '../../../../shared/motion/score-ticker';
import { AzulVersions, azulVersionName } from '../azul-versions';
import {
  SINTRA_COLORS,
  SINTRA_ROUNDS,
  SINTRA_WINDOW_VALUES,
  type SintraColor,
  type SintraSide,
} from '../sintra-scoring';

@Component({
  selector: 'app-sintra-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuditSheet, ConfirmDialog, PageHeader, SiteFooter, HistoryPanel, NumField, Choice, ScoreTicker, AzulVersions],
  templateUrl: './sintra-page.html',
  styleUrls: ['../variant-common.scss', './sintra-page.scss'],
})
export class SintraPage {
  readonly m = inject(AzulSintraMatch);
  readonly i18n = inject(I18n);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | null>(null);

  readonly finished = this.m.finished;
  readonly home = computed(() => (this.i18n.locale() === 'en' ? '/en' : '/'));
  readonly name = computed(() => azulVersionName('sintra', this.i18n.locale()));
  readonly values = SINTRA_WINDOW_VALUES;
  readonly colors = SINTRA_COLORS;
  readonly rounds = SINTRA_ROUNDS;
  readonly ornaments = [0, 1, 2, 3];
  /** espaços de cada faixa de padrão (desenho) */
  readonly stripSpaces = [0, 1, 2, 3, 4];

  readonly sideOptions = computed<ChoiceOption[]>(() => [
    { value: 'A', label: this.i18n.t('sintra.side.a'), sub: this.i18n.t('sintra.side.aSub') },
    { value: 'B', label: this.i18n.t('sintra.side.b'), sub: this.i18n.t('sintra.side.bSub') },
  ]);
  readonly bonusOptions: ChoiceOption[] = [0, 1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

  readonly parts = computed(() => {
    const out = [
      { key: 'sintra.part.windows', points: this.m.windowPoints() },
      { key: 'sintra.part.color', points: this.m.colorPoints() },
    ];
    if (this.m.wraps()) out.push({ key: 'sintra.part.broken', points: this.m.wrapPenalty() });
    if (this.finished()) out.push({ key: 'history.part.endgame', points: this.m.endGame().total });
    return out;
  });

  readonly historyName = (id?: string) => azulVersionName(id, this.i18n.locale());

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.sintra.title'),
        description: this.i18n.t('seo.sintra.desc'),
        basePath: '/azul/sintra',
        locale: this.i18n.locale(),
        breadcrumbs: [
          { name: 'Azul', basePath: '/azul' },
          { name: this.name(), basePath: '/azul/sintra' },
        ],
      });
    });
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`${this.name()} - ${this.m.finalTotal()}`));
    }
  }

  pane(c: SintraColor): string {
    return `azul/sintra/pane-${c}.webp`;
  }
  count(i: number): number {
    return this.m.windows()[i].filter(Boolean).length;
  }
  /** a moldura que recebe a peça da faixa em andamento */
  isTarget(i: number, frame: number): boolean {
    return this.m.draftWindow() === i && this.count(i) === frame;
  }
  setSide(v: string | number | undefined): void {
    this.m.setSide(v === 'B' ? 'B' : ('A' as SintraSide));
  }
  setBonus(v: string | number | undefined): void {
    this.m.setDraftBonus(Number(v) || 0);
  }
  windowAria(i: number): string {
    return this.i18n.tp('sintra.windowAria', { n: i + 1, v: this.values[i], c: this.count(i) });
  }
  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmFinish(): void {
    this.m.finish();
    this.history.record('azul', {
      variantId: 'sintra',
      total: this.m.finalTotal(),
      parts: this.parts().filter((p) => p.points !== 0),
    });
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.m.reset();
    this.confirm.set(null);
  }
}
