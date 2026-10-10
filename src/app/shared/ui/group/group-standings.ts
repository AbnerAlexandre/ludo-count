import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import type { Standing } from '../../../core/group/group-models';

/** Placar ao vivo da mesa (coluna lateral no computador). */
@Component({
  selector: 'app-group-standings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.aria-labelledby]="titleId">
      <h2 class="panel-title" [id]="titleId">{{ i18n.t('group.live.title') }}</h2>
      <ol class="list" role="list">
        @for (s of standings(); track s.id) {
          <li>
            <button
              type="button"
              class="row"
              [class.on]="s.id === activeId()"
              [attr.aria-current]="s.id === activeId() ? 'true' : null"
              [style.--c]="s.color"
              (click)="select.emit(s.id)"
            >
              <span class="place-n tabular">{{ s.rank }}º</span>
              <span class="dot" aria-hidden="true"></span>
              <span class="nm">{{ s.name }}</span>
              @if (s.outcome) {
                <span class="tag">{{ i18n.t(s.outcome) }}</span>
              }
              <b class="tot tabular" [class.neg]="s.total < 0">{{ s.total }}</b>
            </button>
          </li>
        }
      </ol>
    </section>
  `,
  styles: [
    `
      .list {
        list-style: none;
        margin: 12px 0 0;
        padding: 0;
        display: grid;
        gap: 4px;
      }
      .row {
        width: 100%;
        display: grid;
        grid-template-columns: 30px 10px minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 10px;
        border-radius: var(--radius);
        border: 1px solid transparent;
        background: transparent;
        color: var(--text);
        text-align: left;
        cursor: pointer;
        transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .row.on {
        background: var(--surface-2);
        border-color: var(--line-strong);
      }
      .place-n {
        font-weight: 800;
        color: var(--text-faint);
        font-size: 0.86rem;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        background: var(--c);
      }
      .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 700;
      }
      .tag {
        grid-column: 4;
      }
      .tot {
        grid-column: 5;
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 800;
      }
      .tot.neg {
        color: var(--bad);
      }
      @media (hover: hover) and (pointer: fine) {
        .row:not(.on):hover {
          background: var(--surface-2);
        }
      }
    `,
  ],
})
export class GroupStandings {
  readonly i18n = inject(I18n);
  readonly standings = input.required<Standing[]>();
  readonly activeId = input<string | null>(null);
  readonly select = output<string>();
  readonly titleId = `live-${Math.random().toString(36).slice(2, 8)}`;
}
