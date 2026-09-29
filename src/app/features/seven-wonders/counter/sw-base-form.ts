import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import { SevenWondersMatch } from '../../../core/services/sw-match';
import { NumField } from '../../../shared/ui/num-field';
import { Switch } from '../../../shared/ui/switch';
import { Choice, type ChoiceOption } from '../../../shared/ui/choice';
import { TokenTray, type TokenSpec } from '../../../shared/ui/token-tray';
import { BABEL_TOWER_VP, type MilitaryToken, type NavalToken, type SwBaseState } from '../scoring/sw-scoring';
import { SwCat } from './sw-cat';

/** Planilha do 7 Wonders (base, 1ª e 2ª edição) + expansões ligadas. */
@Component({
  selector: 'app-sw-base-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwCat, NumField, Switch, Choice, TokenTray],
  templateUrl: './sw-base-form.html',
  styleUrl: './sw-form.scss',
})
export class SwBaseForm {
  readonly m = inject(SevenWondersMatch);
  readonly i18n = inject(I18n);

  readonly s = this.m.base;
  readonly ex = computed(() => this.s().expansions);
  readonly locked = this.m.finished;
  readonly sci = computed(() => this.m.result().science);

  readonly militaryTokens: TokenSpec[] = [
    { id: 'v1', value: 1 },
    { id: 'v3', value: 3 },
    { id: 'v5', value: 5 },
    { id: 'd1', value: -1 },
  ];
  readonly navalTokens: TokenSpec[] = [
    { id: 'v1', value: 1 },
    { id: 'v3', value: 3 },
    { id: 'v5', value: 5 },
    { id: 'v7', value: 7 },
    { id: 'd1', value: -1 },
    { id: 'd2', value: -2 },
    { id: 'd3', value: -3 },
  ];

  readonly towerOptions = computed<ChoiceOption[]>(() =>
    BABEL_TOWER_VP.map((vp, n) => ({ value: n, label: String(n), sub: `${vp} ${this.i18n.t('common.pts')}` })),
  );

  t(key: string): string {
    return this.i18n.t(key);
  }

  pts(key: string): number {
    return this.m.points(key);
  }

  patch(p: Partial<SwBaseState>): void {
    this.m.patchBase(p);
  }

  setMilitary(counts: Record<string, number>): void {
    this.patch({ military: counts as Record<MilitaryToken, number> });
  }
  setNaval(counts: Record<string, number>): void {
    this.patch({ naval: counts as Record<NavalToken, number> });
  }
  setScience(k: 'tablet' | 'compass' | 'gear' | 'wild', v: number): void {
    this.patch({ science: { ...this.s().science, [k]: v } });
  }

  /** frase explicando a conta da ciência (e a escolha dos coringas) */
  readonly sciExplain = computed(() => {
    const r = this.sci();
    if (!r || r.points === 0) return '';
    const t = this.i18n;
    const sq = `${r.tablet}² + ${r.compass}² + ${r.gear}² = ${r.squares}`;
    const sets = r.sets ? ` · ${t.tp('sw.audit.sets', { n: r.sets, v: r.setValue })} = ${r.sets * r.setValue}` : '';
    const wild = this.s().science.wild
      ? ' · ' +
        t.t('sw.sci.wildBest') +
        ' ' +
        (['tablet', 'compass', 'gear'] as const)
          .filter((k) => r.wildTo[k] > 0)
          .map((k) => `${r.wildTo[k]}× ${t.t(`sw.sym.${k}`)}`)
          .join(', ')
      : '';
    return sq + sets + wild;
  });
}
