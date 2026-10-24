import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Seo } from '../../../../core/seo/seo';
import { I18n } from '../../../../core/i18n/i18n';
import { AzulPavilionMatch } from '../../../../core/services/azul-pavilion-match';
import { MatchHistory } from '../../../../core/services/match-history';
import { AuditSheet } from '../../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { PageHeader } from '../../../../shared/ui/page-header';
import { SiteFooter } from '../../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../../shared/ui/history-panel';
import { NumField } from '../../../../shared/ui/num-field';
import { ScoreTicker } from '../../../../shared/motion/score-ticker';
import { AzulVersions, azulVersionName } from '../azul-versions';
import { PavilionBoard } from './pavilion-board';
import { BONUS_TILES } from '../pavilion-geometry';
import {
  PAVILION_COLORS,
  PAVILION_KEEP,
  PAVILION_NUMBER_BONUS,
  PAVILION_ROUNDS,
  PAVILION_STARS,
  PAVILION_STAR_BONUS,
  PAVILION_START,
  PAVILION_WILD,
  type PavilionColor,
} from '../pavilion-scoring';

@Component({
  selector: 'app-pavilion-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuditSheet, ConfirmDialog, PageHeader, SiteFooter, HistoryPanel, NumField, ScoreTicker, AzulVersions, PavilionBoard],
  templateUrl: './pavilion-page.html',
  styleUrls: ['../variant-common.scss', './pavilion-page.scss'],
})
export class PavilionPage {
  readonly m = inject(AzulPavilionMatch);
  readonly i18n = inject(I18n);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | null>(null);
  /** casa do centro esperando a escolha da cor */
  readonly centerPick = signal<number | null>(null);

  readonly finished = this.m.finished;
  readonly home = computed(() => (this.i18n.locale() === 'en' ? '/en' : '/'));
  readonly name = computed(() => azulVersionName('summer-pavilion', this.i18n.locale()));
  readonly colors = PAVILION_COLORS;
  readonly roundsMax = PAVILION_ROUNDS;
  readonly keep = PAVILION_KEEP;
  readonly wildByRound = PAVILION_WILD;
  readonly bonusTiles = BONUS_TILES;
  readonly starBonus = PAVILION_STARS.map((s) => ({ star: s, points: PAVILION_STAR_BONUS[s] }));
  readonly numberBonus = [1, 2, 3, 4].map((v) => ({ v, points: PAVILION_NUMBER_BONUS[v] }));

  readonly parts = computed(() => {
    const s = this.m.summary();
    const out = [
      { key: 'pav.part.start', points: PAVILION_START },
      { key: 'pav.part.tiles', points: s.tiles },
      { key: 'pav.part.penalties', points: s.penalties },
    ];
    if (this.finished()) {
      out.push({ key: 'history.part.endgame', points: s.end });
      if (s.corners) out.push({ key: 'pav.part.corners', points: s.corners });
    }
    return out;
  });

  readonly historyName = (id?: string) => azulVersionName(id, this.i18n.locale());

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.pavilion.title'),
        description: this.i18n.t('seo.pavilion.desc'),
        basePath: '/azul/summer-pavilion',
        locale: this.i18n.locale(),
        breadcrumbs: [
          { name: 'Azul', basePath: '/azul' },
          { name: this.name(), basePath: '/azul/summer-pavilion' },
        ],
      });
    });
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`${this.name()} - ${this.m.finalTotal()}`));
    }
  }

  tile(c: PavilionColor): string {
    return `azul/summer-pavilion/tile-${c}.webp`;
  }
  starName(s: string): string {
    return this.i18n.t(`pav.star.${s}`);
  }
  pickColor(c: PavilionColor): void {
    const idx = this.centerPick();
    if (idx == null) return;
    this.m.toggle('center', idx, c);
    this.centerPick.set(null);
  }
  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmFinish(): void {
    this.m.finish();
    this.history.record('azul', {
      variantId: 'summer-pavilion',
      total: this.m.finalTotal(),
      parts: this.parts().filter((p) => p.points !== 0),
    });
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.m.reset();
    this.centerPick.set(null);
    this.confirm.set(null);
  }
}
