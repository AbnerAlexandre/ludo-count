import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Seo } from '../../../../core/seo/seo';
import { I18n } from '../../../../core/i18n/i18n';
import { AzulGardenMatch } from '../../../../core/services/azul-garden-match';
import { MatchHistory } from '../../../../core/services/match-history';
import { AuditSheet } from '../../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { PageHeader } from '../../../../shared/ui/page-header';
import { SiteFooter } from '../../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../../shared/ui/history-panel';
import { NumField } from '../../../../shared/ui/num-field';
import { Switch } from '../../../../shared/ui/switch';
import { ScoreTicker } from '../../../../shared/motion/score-ticker';
import { AzulVersions, azulVersionName } from '../azul-versions';
import { GardenBoard, type GardenBrush } from './garden-board';
import { isTile, type GardenGroupScore, type GardenTile } from '../garden-grid';
import {
  GARDEN_COLORS,
  GARDEN_EXPANSION_COST,
  GARDEN_PATTERNS,
  GARDEN_ROUNDS,
  GARDEN_START,
  PATTERN_VALUE,
  type GardenColor,
  type GardenItem,
  type GardenPattern,
} from '../garden-scoring';

@Component({
  selector: 'app-garden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuditSheet, ConfirmDialog, PageHeader, SiteFooter, HistoryPanel, NumField, Switch, ScoreTicker, AzulVersions, GardenBoard],
  templateUrl: './garden-page.html',
  styleUrls: ['../variant-common.scss', './garden-page.scss'],
})
export class GardenPage {
  readonly m = inject(AzulGardenMatch);
  readonly i18n = inject(I18n);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | null>(null);

  readonly finished = this.m.finished;
  readonly home = computed(() => (this.i18n.locale() === 'en' ? '/en' : '/'));
  readonly name = computed(() => azulVersionName('queens-garden', this.i18n.locale()));
  readonly colors = GARDEN_COLORS;
  readonly patterns = GARDEN_PATTERNS;
  readonly value = PATTERN_VALUE;
  readonly roundsMax = GARDEN_ROUNDS;
  readonly expansionCost = GARDEN_EXPANSION_COST;
  readonly slots = [0, 1, 2];

  /* peça escolhida para tocar no jardim */
  readonly color = signal<GardenColor>('blue');
  readonly pattern = signal<GardenPattern>('tree');
  readonly tool = signal<'tile' | 'pavilion' | 'erase'>('tile');
  readonly brush = computed<GardenBrush>(() =>
    this.tool() === 'tile' ? { mode: 'tile', color: this.color(), pattern: this.pattern() } : { mode: this.tool() as 'pavilion' | 'erase' },
  );

  readonly parts = computed(() => {
    const s = this.m.summary();
    const out = [
      { key: 'garden.part.start', points: GARDEN_START },
      { key: 'garden.part.wheel', points: s.wheel },
      { key: 'garden.part.costs', points: s.costs },
    ];
    if (this.finished()) out.push({ key: 'history.part.endgame', points: s.end });
    return out;
  });

  readonly historyName = (id?: string) => azulVersionName(id, this.i18n.locale());

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.garden.title'),
        description: this.i18n.t('seo.garden.desc'),
        basePath: '/azul/queens-garden',
        locale: this.i18n.locale(),
        breadcrumbs: [
          { name: 'Azul', basePath: '/azul' },
          { name: this.name(), basePath: '/azul/queens-garden' },
        ],
      });
    });
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`${this.name()} - ${this.m.finalTotal()}`));
    }
  }

  hex(color: GardenColor, pattern: GardenPattern): string {
    return `azul/queens-garden/${color}-${pattern}.webp`;
  }
  pickColor(c: GardenColor): void {
    this.color.set(c);
    this.tool.set('tile');
  }
  pickPattern(p: GardenPattern): void {
    this.pattern.set(p);
    this.tool.set('tile');
  }
  /** valor do <select> da roda: '' = nada escolhido */
  setItem(slot: number, v: string): void {
    this.m.setWheel(slot, { item: (v || null) as GardenItem | null });
  }
  /** hexágonos do grupo, na ordem do jardim, para desenhar a fileira */
  groupTiles(g: GardenGroupScore): string[] {
    return g.keys.map((k) => this.m.cells()[k]).filter(isTile).map((t: GardenTile) => this.hex(t.color, t.pattern));
  }
  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmFinish(): void {
    this.m.finish();
    this.history.record('azul', {
      variantId: 'queens-garden',
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
