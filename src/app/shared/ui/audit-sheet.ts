import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, input, output } from '@angular/core';
import type { AuditEntry } from '../../core/models/audit.models';
import { I18n } from '../../core/i18n/i18n';

interface AuditGroup {
  name: string;
  entries: AuditEntry[];
  subtotal: number;
}

/**
 * Detalhamento somente-leitura de cada ponto da partida. Recebe o mesmo array
 * de onde o total é calculado, então nunca diverge do placar.
 * Folha que sobe do rodapé no celular; painel lateral no desktop.
 */
@Component({
  selector: 'app-audit-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="backdrop" animate.enter="in" animate.leave="out" (click)="close.emit()">
      <section
        class="sheet"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="i18n.t('audit.title')"
        (click)="$event.stopPropagation()"
      >
        <header>
          <div class="grabber" aria-hidden="true"></div>
          <div class="head-row">
            <div>
              <h2 class="display">{{ owner() ? i18n.tp('audit.titleOf', { name: owner()! }) : i18n.t('audit.title') }}</h2>
              <p>{{ i18n.t('audit.subtitle') }}</p>
            </div>
            <button type="button" class="icon-btn close" [attr.aria-label]="i18n.t('common.close')" (click)="close.emit()">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div class="scroll">
          @if (groups().length === 0) {
            <p class="empty">{{ i18n.t('audit.empty') }}</p>
          }
          @for (g of groups(); track g.name) {
            <div class="group">
              <div class="group-head">
                <span>{{ g.name }}</span>
                <span class="tabular" [class.neg]="g.subtotal < 0">{{ signed(g.subtotal) }}</span>
              </div>
              <ul role="list">
                @for (e of g.entries; track e.id) {
                  <li class="row" [attr.data-kind]="e.kind">
                    <div class="row-main">
                      <span class="label">{{ e.label }}</span>
                      @if (e.detail) {
                        <span class="detail">{{ e.detail }}</span>
                      }
                    </div>
                    <span class="pts tabular" [class.neg]="e.points < 0" [class.pos]="e.points > 0">{{ signed(e.points) }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <footer>
          <span>{{ i18n.t('common.total') }}</span>
          <span class="total tabular" [class.neg]="total() < 0">{{ total() }}</span>
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
        background: rgba(6, 8, 12, 0.6);
      }
      .sheet {
        width: min(560px, 100%);
        max-height: 88dvh;
        display: flex;
        flex-direction: column;
        background: var(--surface);
        border: 1px solid var(--line);
        border-bottom: none;
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        box-shadow: var(--shadow);
        padding-bottom: env(safe-area-inset-bottom);
      }
      @media (min-width: 960px) {
        .backdrop {
          justify-content: flex-end;
          align-items: stretch;
        }
        .sheet {
          width: 440px;
          max-height: none;
          border-radius: 0;
          border: none;
          border-left: 1px solid var(--line);
        }
        .grabber {
          display: none;
        }
      }
      header {
        padding: 10px 20px 14px;
        border-bottom: 1px solid var(--line);
      }
      .grabber {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: var(--line-strong);
        margin: 4px auto 12px;
      }
      .head-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      h2 {
        margin: 0;
        font-size: 1.45rem;
        font-weight: 800;
      }
      header p {
        margin: 2px 0 0;
        color: var(--text-faint);
        font-size: 0.86rem;
      }
      .scroll {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 6px 20px 16px;
      }
      .group {
        margin-top: 16px;
      }
      .group-head {
        display: flex;
        justify-content: space-between;
        padding-bottom: 6px;
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-faint);
      }
      .group-head .neg {
        color: var(--bad);
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--line);
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid var(--line);
      }
      .row-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .label {
        font-weight: 600;
        font-size: 0.94rem;
      }
      .detail {
        font-size: 0.8rem;
        color: var(--text-faint);
      }
      .pts {
        font-weight: 800;
        font-size: 1.02rem;
        white-space: nowrap;
      }
      footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px 16px;
        border-top: 1px solid var(--line);
        font-weight: 700;
      }
      .total {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 800;
        color: var(--game-text);
      }
      .total.neg {
        color: var(--bad);
      }
      .backdrop.in {
        animation: fade-in 220ms var(--ease-out);
      }
      .backdrop.in .sheet {
        animation: sheet-in 380ms var(--ease-drawer);
      }
      .backdrop.out {
        animation: fade-out 240ms var(--ease-out) forwards;
      }
      .backdrop.out .sheet {
        animation: sheet-out 240ms var(--ease-drawer) forwards;
      }
      @media (min-width: 960px) {
        .backdrop.in .sheet {
          animation-name: panel-in;
        }
        .backdrop.out .sheet {
          animation-name: panel-out;
        }
      }
      @keyframes panel-in {
        from {
          transform: translateX(100%);
        }
      }
      @keyframes panel-out {
        to {
          transform: translateX(100%);
        }
      }
    `,
  ],
})
export class AuditSheet {
  readonly i18n = inject(I18n);
  readonly entries = input.required<AuditEntry[]>();
  readonly total = input.required<number>();
  /** partida em grupo: de quem é esta planilha */
  readonly owner = input<string | null>(null);
  readonly close = output<void>();

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    afterNextRender(() => (host.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.close')?.focus());
  }

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
