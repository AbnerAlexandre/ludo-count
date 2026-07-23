import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { AuditEntry } from '../../core/models/audit.models';

interface AuditGroup {
  name: string;
  entries: AuditEntry[];
  subtotal: number;
}

/**
 * Read-only breakdown of every point in the current match. Fed the same audit
 * array the totals are computed from, so it can never drift from the score.
 */
@Component({
  selector: 'app-audit-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('backdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('180ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('160ms ease', style({ opacity: 0 }))]),
    ]),
    trigger('sheet', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.22,1,0.36,1)', style({ transform: 'none' })),
      ]),
      transition(':leave', [animate('220ms ease', style({ transform: 'translateY(100%)' }))]),
    ]),
  ],
  template: `
    <div class="backdrop" @backdrop (click)="close.emit()">
      <section
        class="sheet"
        @sheet
        role="dialog"
        aria-modal="true"
        aria-label="Auditoria de pontos"
        (click)="$event.stopPropagation()"
      >
        <header>
          <div class="grabber" aria-hidden="true"></div>
          <div class="head-row">
            <div>
              <h2 class="display">Auditoria</h2>
              <p>De onde vem cada ponto do total.</p>
            </div>
            <button type="button" class="close" aria-label="Fechar" (click)="close.emit()">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div class="scroll">
          @if (groups().length === 0) {
            <p class="empty">Nenhum ponto registrado ainda.</p>
          }
          @for (g of groups(); track g.name) {
            <div class="group">
              <div class="group-head">
                <span>{{ g.name }}</span>
                <span class="tabular" [class.neg]="g.subtotal < 0">{{ signed(g.subtotal) }}</span>
              </div>
              @for (e of g.entries; track e.id) {
                <div class="row" [attr.data-kind]="e.kind">
                  <div class="row-main">
                    <span class="label">{{ e.label }}</span>
                    @if (e.detail) {
                      <span class="detail">{{ e.detail }}</span>
                    }
                  </div>
                  <span class="pts tabular" [class.neg]="e.points < 0" [class.pos]="e.points > 0">
                    {{ signed(e.points) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <footer>
          <span>Total</span>
          <span class="total tabular" [class.neg]="total() < 0">{{ signed(total()) }}</span>
        </footer>
      </section>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 55;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: rgba(5, 9, 18, 0.6);
        backdrop-filter: blur(5px);
      }
      .sheet {
        width: min(560px, 100%);
        max-height: 86vh;
        display: flex;
        flex-direction: column;
        background: var(--bg-elev);
        border: 1px solid var(--line);
        border-bottom: none;
        border-radius: 26px 26px 0 0;
        box-shadow: var(--shadow);
      }
      header {
        padding: 10px 20px 12px;
        border-bottom: 1px solid var(--line-soft);
      }
      .grabber {
        width: 44px;
        height: 5px;
        border-radius: 999px;
        background: var(--line);
        margin: 4px auto 12px;
      }
      .head-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      h2 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      header p {
        margin: 2px 0 0;
        color: var(--text-faint);
        font-size: 0.85rem;
      }
      .close {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--line);
        background: var(--bg-elev-2);
        color: var(--text);
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .scroll {
        overflow-y: auto;
        padding: 8px 16px 16px;
      }
      .empty {
        text-align: center;
        color: var(--text-faint);
        padding: 40px 0;
      }
      .group {
        margin-top: 14px;
      }
      .group-head {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        color: var(--text-faint);
        padding: 0 6px 6px;
        font-weight: 700;
      }
      .group-head .neg {
        color: var(--bad);
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 11px 12px;
        background: var(--bg-elev-2);
        border: 1px solid var(--line-soft);
        border-radius: 12px;
        margin-bottom: 6px;
      }
      .row-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .label {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .detail {
        font-size: 0.78rem;
        color: var(--text-faint);
      }
      .pts {
        font-weight: 800;
        font-size: 1.05rem;
        white-space: nowrap;
      }
      .pts.pos {
        color: var(--good);
      }
      .pts.neg,
      .total.neg {
        color: var(--bad);
      }
      footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 22px;
        border-top: 1px solid var(--line);
        font-weight: 700;
        font-size: 1.1rem;
      }
      .total {
        font-size: 1.6rem;
        font-weight: 900;
        color: var(--good);
      }
    `,
  ],
})
export class AuditSheet {
  readonly entries = input.required<AuditEntry[]>();
  readonly total = input.required<number>();
  readonly close = output<void>();

  readonly groups = computed<AuditGroup[]>(() => {
    const order: string[] = [];
    const map = new Map<string, AuditEntry[]>();
    for (const e of this.entries()) {
      if (!map.has(e.group)) {
        map.set(e.group, []);
        order.push(e.group);
      }
      map.get(e.group)!.push(e);
    }
    return order.map((name) => {
      const entries = map.get(name)!;
      return { name, entries, subtotal: entries.reduce((s, e) => s + e.points, 0) };
    });
  });

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
