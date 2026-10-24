import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Seo } from '../../core/seo/seo';
import { I18n } from '../../core/i18n/i18n';
import { AzulMatch } from '../../core/services/azul-match';
import { MatchHistory, type HistoryPart } from '../../core/services/match-history';
import { AzulWall } from './wall/azul-wall';
import { RoundHistory } from './round-history/round-history';
import { AuditSheet } from '../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { PageHeader } from '../../shared/ui/page-header';
import { SiteFooter } from '../../shared/ui/site-footer';
import { HistoryPanel } from '../../shared/ui/history-panel';
import { ScoreTicker } from '../../shared/motion/score-ticker';
import { FLOOR_PENALTIES, floorPenalty } from './scoring/azul-scoring';
import { AzulVersions, azulVersionName } from './variants/azul-versions';

@Component({
  selector: 'app-azul-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AzulWall, RoundHistory, AuditSheet, ConfirmDialog, PageHeader, SiteFooter, HistoryPanel, ScoreTicker, AzulVersions],
  templateUrl: './azul-page.html',
  styleUrl: './azul-page.scss',
})
export class AzulPage {
  readonly match = inject(AzulMatch);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);
  readonly i18n = inject(I18n);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | null>(null);

  readonly draftCount = computed(() => this.match.draftPlacements().length);
  readonly preview = this.match.draftPreview;
  readonly isViewingHistory = computed(() => this.match.viewedRound() !== null);
  readonly finished = this.match.finished;
  readonly home = computed(() => (this.i18n.locale() === 'en' ? '/en' : '/'));

  readonly floorSlots = FLOOR_PENALTIES.map((_, i) => i + 1);

  /** nome da versão salva no histórico (partidas antigas não têm versão = Azul) */
  readonly historyName = (id?: string) => azulVersionName(id, this.i18n.locale());

  /** partes exibidas no placar (a soma sempre bate com o total) */
  readonly parts = computed(() => {
    const s = this.match.summary();
    const out: Array<{ key: string; points: number }> = [
      { key: 'history.part.wall', points: s.wall },
      { key: 'history.part.floor', points: s.floor },
    ];
    if (s.clamp) out.push({ key: 'history.part.clamp', points: s.clamp });
    if (this.finished()) out.push({ key: 'history.part.endgame', points: s.endgame });
    return out;
  });

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.azul.title'),
        description: this.i18n.t('seo.azul.desc'),
        basePath: '/azul',
        locale: this.i18n.locale(),
        breadcrumbs: [{ name: 'Azul', basePath: '/azul' }],
      });
    });

    // No browser o título acompanha o placar ao vivo; no prerender fica descritivo.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`Azul - ${this.match.finalTotal()}`));
    }
  }

  cumulativePenalty(slot: number): number {
    return floorPenalty(slot);
  }

  onFloorClick(slot: number): void {
    // comportamento de "nota": toca → seleciona 1..slot; tocar no último de novo recua um
    this.match.setFloor(this.match.draftFloor() === slot ? slot - 1 : slot);
  }

  commit(): void {
    this.match.commitRound();
  }

  confirmFinish(): void {
    this.match.finish();
    const parts: HistoryPart[] = this.parts().filter((p) => p.points !== 0);
    this.history.record('azul', { total: this.match.finalTotal(), parts });
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.confirm.set(null);
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
