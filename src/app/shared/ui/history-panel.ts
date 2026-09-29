import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';
import { HISTORY_LIMIT, MatchHistory, type HistoryEntry, type HistoryGame } from '../../core/services/match-history';
import { Switch } from './switch';

/**
 * Últimas partidas terminadas do jogo (até 10), guardadas neste navegador.
 * Cada linha abre o detalhamento de pontos daquela partida.
 */
@Component({
  selector: 'app-history-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Switch],
  template: `
    <section class="hist" [attr.aria-labelledby]="titleId">
      <div class="head">
        <div>
          <h2 class="panel-title" [id]="titleId">{{ i18n.t('history.title') }}</h2>
          <p class="sub">{{ i18n.tp('history.sub', { n: entries().length, max: limit }) }}</p>
        </div>
        <label class="keep">
          <span>{{ i18n.t('history.keep') }}</span>
          <app-switch [checked]="history.enabled()" (checkedChange)="history.setEnabled($event)" [label]="i18n.t('history.keep')" />
        </label>
      </div>

      @if (entries().length === 0) {
        <p class="empty">{{ history.enabled() ? i18n.t('history.empty') : i18n.t('history.off') }}</p>
      } @else {
        <ol class="list" role="list">
          @for (e of entries(); track e.id; let i = $index) {
            <li class="item enter" [style.animation-delay.ms]="i * 40">
              <button type="button" class="row" [attr.aria-expanded]="open() === e.id" (click)="toggle(e.id)">
                <span class="meta">
                  <span class="date">{{ fmt(e.date) }}</span>
                  <span class="variant">
                    {{ variantName()(e.variantId) }}
                    @if (e.outcome) {
                      <span class="tag">{{ i18n.t(e.outcome) }}</span>
                    }
                  </span>
                </span>
                <span class="total tabular" [class.neg]="e.total < 0">{{ e.total }}</span>
                <svg class="chev" [class.up]="open() === e.id" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              @if (open() === e.id) {
                <div class="detail enter">
                  <ul class="parts" role="list">
                    @for (p of e.parts; track p.key) {
                      <li>
                        <span>{{ i18n.t(p.key) }}</span>
                        <b class="tabular" [class.pos]="p.points > 0" [class.neg]="p.points < 0">{{ signed(p.points) }}</b>
                      </li>
                    }
                  </ul>
                  <button type="button" class="del" (click)="history.remove(game(), e.id)">{{ i18n.t('history.remove') }}</button>
                </div>
              }
            </li>
          }
        </ol>
        <button type="button" class="btn btn-quiet clear" [class.armed]="arming()" (click)="clear()">
          {{ arming() ? i18n.t('history.clearConfirm') : i18n.t('history.clear') }}
        </button>
      }
    </section>
  `,
  styles: [
    `
      .hist {
        display: block;
      }
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .sub {
        margin: 2px 0 0;
        font-size: 0.82rem;
        color: var(--text-faint);
      }
      .keep {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 0.82rem;
        color: var(--text-dim);
        cursor: pointer;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--line);
      }
      .item {
        border-bottom: 1px solid var(--line);
      }
      .row {
        width: 100%;
        min-height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 4px;
        background: transparent;
        border: none;
        color: var(--text);
        text-align: left;
        cursor: pointer;
      }
      .meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .date {
        font-size: 0.78rem;
        color: var(--text-faint);
        font-variant-numeric: tabular-nums;
      }
      .variant {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 0.94rem;
      }
      .total {
        font-family: var(--font-display);
        font-size: 1.6rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .chev {
        color: var(--text-faint);
        transition: transform var(--dur-base) var(--ease-out);
      }
      .chev.up {
        transform: rotate(180deg);
      }
      .detail {
        padding: 0 4px 14px;
      }
      .parts {
        list-style: none;
        margin: 0 0 10px;
        padding: 10px 12px;
        border-radius: var(--radius);
        background: var(--surface-2);
      }
      .parts li {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 0.9rem;
        color: var(--text-dim);
      }
      .parts b {
        color: var(--text);
      }
      .parts b.pos {
        color: var(--good);
      }
      .parts b.neg {
        color: var(--bad);
      }
      .del {
        min-height: 40px;
        padding: 0 4px;
        border: none;
        background: none;
        color: var(--bad);
        font-weight: 700;
        font-size: 0.86rem;
        cursor: pointer;
      }
      .clear {
        margin-top: 14px;
        min-height: 44px;
        font-size: 0.88rem;
      }
      .clear.armed {
        border-color: var(--bad);
        color: var(--bad);
      }
      @media (hover: hover) and (pointer: fine) {
        .row:hover .total {
          color: var(--game-text);
        }
      }
    `,
  ],
})
export class HistoryPanel {
  readonly i18n = inject(I18n);
  readonly history = inject(MatchHistory);

  readonly game = input.required<HistoryGame>();
  /** resolve o nome da edição/variante salva */
  readonly variantName = input<(id?: string) => string>(() => '');

  readonly limit = HISTORY_LIMIT;
  readonly titleId = `hist-${Math.random().toString(36).slice(2, 8)}`;
  readonly open = signal<string | null>(null);
  readonly arming = signal(false);

  readonly entries = computed<HistoryEntry[]>(() => this.history.entries(this.game()));

  private armTimer?: ReturnType<typeof setTimeout>;

  toggle(id: string): void {
    this.open.set(this.open() === id ? null : id);
  }

  /** limpeza em dois toques: o primeiro arma, o segundo confirma */
  clear(): void {
    if (!this.arming()) {
      this.arming.set(true);
      clearTimeout(this.armTimer);
      this.armTimer = setTimeout(() => this.arming.set(false), 3500);
      return;
    }
    clearTimeout(this.armTimer);
    this.arming.set(false);
    this.history.clear(this.game());
  }

  fmt(iso: string): string {
    try {
      return new Intl.DateTimeFormat(this.i18n.locale() === 'en' ? 'en-US' : 'pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 16).replace('T', ' ');
    }
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
