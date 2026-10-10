import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import type { Standing } from '../../../core/group/group-models';
import type { BreakdownRow } from '../../../core/services/ttr-match';

/**
 * Resultado da partida em grupo: classificação com os desempates da regra,
 * pontos por categoria de cada jogador e as ações para a próxima partida.
 */
@Component({
  selector: 'app-group-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel results" aria-labelledby="res-title">
      <p class="eyebrow">{{ i18n.t('group.results.eyebrow') }} · {{ variantName() }}</p>
      <h2 id="res-title" class="headline display">{{ headline() }}</h2>

      <ol class="places" role="list">
        @for (s of standings(); track s.id; let i = $index) {
          <li class="place" [class.first]="s.rank === 1" [style.--c]="s.color" [style.animation-delay.ms]="i * 70">
            <span class="place-n tabular" aria-hidden="true">{{ s.rank }}º</span>
            <span class="who">
              <span class="nm">
                <span class="dot" aria-hidden="true"></span>
                <span class="sr-only">{{ i18n.tp('group.results.posSr', { n: s.rank }) }}</span>
                {{ s.name }}
              </span>
              @if (s.outcome || s.decidedBy !== undefined || s.shared) {
                <span class="why">
                  @if (s.outcome) {
                    <span class="tag win">{{ i18n.t(s.outcome) }}</span>
                  }
                  @if (s.decidedBy !== undefined) {
                    <span>{{ tieNote(s) }}</span>
                  } @else if (s.shared) {
                    <span>{{ i18n.t('group.results.tied') }}</span>
                  }
                </span>
              }
            </span>
            <span class="pts tabular" [class.neg]="s.total < 0">{{ s.total }}</span>
            <button type="button" class="see" (click)="view.emit(s.id)" [attr.aria-label]="i18n.tp('group.results.view', { name: s.name })">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </li>
        }
      </ol>

      @if (showTie()) {
        <div class="tie" role="group" [attr.aria-label]="i18n.t('group.tie.title')">
          <p class="tie-title">{{ i18n.t('group.tie.title') }}</p>
          @if (manualTieRule(); as rule) {
            <p class="tie-rule">{{ rule }}</p>
            <p class="tie-ask">{{ i18n.t('group.tie.ask') }}</p>
            <div class="tie-opts">
              @for (s of topTie(); track s.id) {
                <button type="button" class="opt" [class.on]="manualWinner() === s.id" [style.--c]="s.color" (click)="pickWinner.emit(s.id)">
                  <span class="dot" aria-hidden="true"></span>{{ s.name }}
                </button>
              }
              <button type="button" class="opt" [class.on]="!manualWinner()" (click)="pickWinner.emit(null)">{{ i18n.t('group.tie.share') }}</button>
            </div>
          } @else {
            <p class="tie-rule">{{ sharedTieRule() }}</p>
          }
        </div>
      }

      @if (breakdown().length) {
        <h3 class="bd-title">{{ i18n.t('group.results.breakdown') }}</h3>
        <div class="bd-wrap" tabindex="0" [attr.aria-label]="i18n.t('group.results.breakdown')">
          <table class="bd">
            <thead>
              <tr>
                <th scope="col">{{ i18n.t('group.results.category') }}</th>
                @for (s of standings(); track s.id) {
                  <th scope="col" [style.--c]="s.color"><span class="dot" aria-hidden="true"></span>{{ s.name }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of breakdown(); track row.key) {
                <tr>
                  <th scope="row">{{ row.label }}</th>
                  @for (v of row.values; track $index) {
                    <td class="tabular" [class.neg]="v < 0" [class.zero]="v === 0">{{ v }}</td>
                  }
                </tr>
              }
              <tr class="sum">
                <th scope="row">{{ i18n.t('group.results.total') }}</th>
                @for (s of standings(); track s.id) {
                  <td class="tabular">{{ s.total }}</td>
                }
              </tr>
            </tbody>
          </table>
        </div>
      }

      <div class="actions">
        <button type="button" class="btn btn-primary" (click)="rematch.emit()">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          {{ i18n.t('group.rematch') }}
        </button>
        <button type="button" class="btn btn-quiet" (click)="changePlayers.emit()">{{ i18n.t('group.changePlayers') }}</button>
      </div>
    </section>
  `,
  styles: [
    `
      .eyebrow {
        margin: 0 0 6px;
      }
      .headline {
        margin: 0 0 16px;
        font-size: clamp(1.6rem, 6.4vw, 2.2rem);
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.03em;
        text-wrap: balance;
      }
      .places {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }
      .place {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto 36px;
        align-items: center;
        gap: 10px;
        min-height: 56px;
        padding: 6px 6px 6px 10px;
        border-radius: var(--radius);
        background: var(--surface-2);
        border: 1px solid var(--line);
        animation: place-in 420ms var(--ease-out) both;
      }
      .place.first {
        background: var(--game);
        border-color: var(--game);
        color: var(--game-ink);
        min-height: 68px;
      }
      @keyframes place-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
      }
      .place-n {
        font-family: var(--font-display);
        font-size: 1.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        opacity: 0.85;
      }
      .first .place-n {
        font-size: 1.6rem;
        opacity: 1;
      }
      .who {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .nm {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-weight: 800;
        font-size: 1rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .first .nm {
        font-size: 1.12rem;
      }
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        flex: 0 0 auto;
        border-radius: 3px;
        background: var(--c);
      }
      .first .dot {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--game-ink) 50%, transparent);
      }
      .why {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: var(--text-faint);
      }
      .first .why {
        color: inherit;
        opacity: 0.85;
      }
      .tag.win {
        background: color-mix(in srgb, currentColor 14%, transparent);
        border-color: color-mix(in srgb, currentColor 30%, transparent);
        color: inherit;
      }
      .pts {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .first .pts {
        font-size: 1.9rem;
      }
      .pts.neg {
        color: var(--bad);
      }
      .first .pts.neg {
        color: inherit;
      }
      .see {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-sm);
        border: none;
        background: color-mix(in srgb, currentColor 8%, transparent);
        color: inherit;
        cursor: pointer;
        transition: transform var(--dur-press) var(--ease-out), background-color var(--dur-fast) ease;
      }
      .see:active {
        transform: scale(0.92);
      }

      .tie {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: var(--radius);
        background: color-mix(in srgb, var(--warn) 11%, var(--surface));
        border: 1px solid color-mix(in srgb, var(--warn) 38%, var(--line));
      }
      .tie-title {
        margin: 0;
        font-weight: 800;
      }
      .tie-rule,
      .tie-ask {
        margin: 4px 0 0;
        font-size: 0.88rem;
        color: var(--text-dim);
        line-height: 1.45;
      }
      .tie-ask {
        color: var(--text);
        font-weight: 600;
        margin-top: 10px;
      }
      .tie-opts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      .opt {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: var(--radius);
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--text);
        font-weight: 700;
        cursor: pointer;
        transition: transform var(--dur-press) var(--ease-out), background-color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .opt:active {
        transform: scale(0.96);
      }
      .opt.on {
        background: var(--game);
        border-color: var(--game);
        color: var(--game-ink);
      }

      .bd-title {
        margin: 22px 0 10px;
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
      }
      .bd-wrap {
        overflow-x: auto;
        margin: 0 -18px;
        padding: 0 18px;
        scrollbar-width: thin;
      }
      .bd {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.88rem;
      }
      .bd th,
      .bd td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--line);
        white-space: nowrap;
      }
      .bd thead th {
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--text-dim);
        text-align: right;
      }
      .bd thead th .dot {
        margin-right: 6px;
        vertical-align: 1px;
      }
      .bd th[scope='row'],
      .bd thead th:first-child {
        position: sticky;
        left: 0;
        z-index: 1;
        background: var(--surface);
        text-align: left;
        font-weight: 600;
        color: var(--text-dim);
        max-width: 46vw;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bd td {
        text-align: right;
        font-weight: 700;
      }
      .bd td.zero {
        color: var(--text-faint);
        font-weight: 500;
      }
      .bd td.neg {
        color: var(--bad);
      }
      .bd .sum th,
      .bd .sum td {
        border-bottom: none;
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--text);
      }

      .actions {
        display: grid;
        gap: 8px;
        margin-top: 18px;
      }
      .actions .btn-primary {
        min-height: 54px;
      }
      @media (min-width: 560px) {
        .actions {
          grid-template-columns: 1fr auto;
        }
      }
      @media (hover: hover) and (pointer: fine) {
        .see:hover {
          background: color-mix(in srgb, currentColor 16%, transparent);
        }
        .opt:not(.on):hover {
          border-color: var(--game-text);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .place {
          animation: none;
        }
      }
    `,
  ],
})
export class GroupResults {
  readonly i18n = inject(I18n);

  readonly standings = input.required<Standing[]>();
  readonly breakdown = input<BreakdownRow[]>([]);
  readonly tieLabels = input<string[]>([]);
  readonly manualTieRule = input<string | null>(null);
  readonly sharedTieRule = input('');
  /** desempate escolhido pela mesa (id do vencedor) */
  readonly manualWinner = input<string | null>(null);
  readonly variantName = input('');

  readonly pickWinner = output<string | null>();
  readonly rematch = output<void>();
  readonly changePlayers = output<void>();
  readonly view = output<string>();

  /** quem empatou em pontos no topo (antes de qualquer desempate) */
  readonly topTie = computed(() => {
    const st = this.standings();
    const top = st[0];
    if (!top) return [];
    return st.filter((s) => s.total === top.total && !!s.forced === !!top.forced);
  });

  /**
   * Aviso de empate no topo: quando a mesa precisa decidir (regra fora da
   * planilha) ou quando nem os critérios separaram e a vitória fica dividida.
   * Se um critério da planilha resolveu, a nota em cada linha já explica.
   */
  readonly showTie = computed(() => {
    const tied = this.topTie();
    if (tied.length < 2) return false;
    if (this.manualTieRule()) return true;
    return this.standings().filter((s) => s.rank === 1).length > 1;
  });

  readonly headline = computed(() => {
    const winners = this.standings().filter((s) => s.rank === 1);
    if (!winners.length) return '';
    if (winners.length === 1) return this.i18n.tp('group.results.won', { name: winners[0].name });
    const names = winners.map((w) => w.name);
    const list = names.slice(0, -1).join(', ') + this.i18n.t('group.results.and') + names.at(-1);
    return this.i18n.tp('group.results.shared', { names: list });
  });

  tieNote(s: Standing): string {
    if (s.decidedBy === undefined) return '';
    if (s.decidedBy < 0) return this.i18n.t('group.results.tieManual');
    return this.i18n.tp('group.results.tieBy', { label: this.tieLabels()[s.decidedBy] ?? '' });
  }
}
