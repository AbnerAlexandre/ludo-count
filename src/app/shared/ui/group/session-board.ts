import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import type { BoardRow } from '../../../core/group/group-models';

/**
 * Ranking temporário da sessão: vitórias e pontos somados entre as partidas
 * da mesma turma. Fica neste navegador até alguém zerar.
 */
@Component({
  selector: 'app-session-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="board" [attr.aria-labelledby]="titleId">
      <div class="head">
        <div>
          <h2 class="panel-title" [id]="titleId">{{ i18n.t('group.session.title') }}</h2>
          <p class="sub">
            {{ matches() === 1 ? i18n.t('group.session.subOne') : i18n.tp('group.session.sub', { n: matches() }) }}
          </p>
        </div>
      </div>

      @if (rows().length === 0) {
        <p class="empty">{{ i18n.t('group.session.empty') }}</p>
      } @else {
        <table class="tbl">
          <thead>
            <tr>
              <th scope="col" class="c-pos"><span class="sr-only">{{ i18n.t('group.session.pos') }}</span></th>
              <th scope="col" class="c-name">{{ i18n.t('group.session.player') }}</th>
              <th scope="col" class="c-num" [attr.title]="i18n.t('group.session.wins')">
                <abbr [attr.title]="i18n.t('group.session.wins')">{{ i18n.t('group.session.winsShort') }}</abbr>
              </th>
              <th scope="col" class="c-num">{{ i18n.t('group.session.points') }}</th>
              <th scope="col" class="c-num c-avg">{{ i18n.t('group.session.avg') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.playerId; let i = $index) {
              <tr class="enter" [class.lead]="r.pos === 1" [style.animation-delay.ms]="i * 40" [style.--c]="r.color">
                <td class="c-pos tabular">{{ r.pos }}º</td>
                <th scope="row" class="c-name">
                  <span class="dot" aria-hidden="true"></span>
                  <span class="nm">{{ r.name }}</span>
                  <span class="m">{{ r.matches === 1 ? i18n.t('group.session.matchOne') : i18n.tp('group.session.matchMany', { n: r.matches }) }}</span>
                </th>
                <td class="c-num tabular wins">{{ r.wins }}</td>
                <td class="c-num tabular">{{ r.points }}</td>
                <td class="c-num c-avg tabular">{{ r.avg }}</td>
              </tr>
            }
          </tbody>
        </table>
        <button type="button" class="btn btn-quiet reset" [class.armed]="arming()" (click)="askReset()">
          {{ arming() ? i18n.t('group.session.resetConfirm') : i18n.t('group.session.reset') }}
        </button>
      }
    </section>
  `,
  styles: [
    `
      .head {
        margin-bottom: 12px;
      }
      .sub {
        margin: 2px 0 0;
        font-size: 0.82rem;
        color: var(--text-faint);
      }
      .tbl {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
      }
      .tbl th,
      .tbl td {
        padding: 9px 4px;
        border-bottom: 1px solid var(--line);
        text-align: left;
      }
      .tbl thead th {
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-faint);
      }
      .tbl abbr {
        text-decoration: none;
      }
      .c-pos {
        width: 34px;
        font-weight: 800;
        color: var(--text-faint);
      }
      .c-name {
        font-weight: 700;
      }
      .tbl tbody .c-name {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        column-gap: 8px;
      }
      .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .m {
        grid-column: 2;
        font-size: 0.74rem;
        font-weight: 500;
        color: var(--text-faint);
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        background: var(--c);
      }
      .c-num {
        text-align: right !important;
        font-weight: 700;
        white-space: nowrap;
      }
      .wins {
        font-family: var(--font-display);
        font-size: 1.12rem;
        font-weight: 800;
      }
      .lead .c-pos,
      .lead .wins {
        color: var(--game-text);
      }
      @media (max-width: 380px) {
        .c-avg {
          display: none;
        }
      }
      .reset {
        margin-top: 14px;
        min-height: 44px;
        font-size: 0.88rem;
      }
      .reset.armed {
        border-color: var(--bad);
        color: var(--bad);
      }
    `,
  ],
})
export class SessionBoard {
  readonly i18n = inject(I18n);
  readonly rows = input.required<BoardRow[]>();
  readonly matches = input(0);
  readonly reset = output<void>();

  readonly titleId = `sess-${Math.random().toString(36).slice(2, 8)}`;
  readonly arming = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  /** dois toques: o primeiro arma, o segundo zera */
  askReset(): void {
    if (!this.arming()) {
      this.arming.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.arming.set(false), 3500);
      return;
    }
    clearTimeout(this.timer);
    this.arming.set(false);
    this.reset.emit();
  }
}
