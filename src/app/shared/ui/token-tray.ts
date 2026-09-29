import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';
import { pop } from '../motion/motion-utils';

export interface TokenSpec {
  id: string;
  /** valor em pontos da ficha (negativo para derrotas/penalidades) */
  value: number;
}

/**
 * Bandeja de fichas: um toque por ficha que você tem na mão, igual às fichas
 * físicas de conflito. O app multiplica e soma — o jogador só conta peças.
 */
@Component({
  selector: 'app-token-tray',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="tray" role="list">
      @for (t of tokens(); track t.id; let i = $index) {
        <li class="slot">
          <button
            #coin
            type="button"
            class="key coin"
            [class.neg]="t.value < 0"
            [class.has]="count(t.id) > 0"
            [disabled]="disabled()"
            [attr.aria-label]="addLabel() + ' ' + sign(t.value)"
            (click)="add(t.id, i)"
          >
            <span class="face tabular">{{ sign(t.value) }}</span>
            @if (count(t.id) > 0) {
              <span class="badge tabular">×{{ count(t.id) }}</span>
            }
          </button>
          <button
            type="button"
            class="minus"
            [disabled]="disabled() || count(t.id) === 0"
            [attr.aria-label]="removeLabel() + ' ' + sign(t.value)"
            (click)="remove(t.id)"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
          </button>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      .tray {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .coin {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        padding: 0;
        font-weight: 800;
        font-size: 1.05rem;
      }
      .coin.has {
        background: color-mix(in srgb, var(--good) 22%, var(--surface-3));
        border-color: color-mix(in srgb, var(--good) 55%, var(--line-strong));
      }
      .coin.neg.has {
        background: color-mix(in srgb, var(--bad) 22%, var(--surface-3));
        border-color: color-mix(in srgb, var(--bad) 55%, var(--line-strong));
      }
      .badge {
        position: absolute;
        top: -6px;
        right: -8px;
        min-width: 26px;
        height: 22px;
        padding: 0 6px;
        border-radius: var(--radius-sm);
        background: var(--text);
        color: var(--bg);
        font-size: 0.74rem;
        font-weight: 800;
        line-height: 22px;
      }
      .minus {
        width: 44px;
        height: 40px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-faint);
        cursor: pointer;
        transition: color var(--dur-fast) ease, background-color var(--dur-fast) ease;
      }
      .minus:disabled {
        opacity: 0.3;
        cursor: default;
      }
      @media (hover: hover) and (pointer: fine) {
        .minus:hover:not(:disabled) {
          background: var(--surface-2);
          color: var(--text);
        }
      }
    `,
  ],
})
export class TokenTray {
  readonly tokens = input.required<TokenSpec[]>();
  readonly counts = model<Record<string, number>>({});
  readonly addLabel = input('Adicionar ficha');
  readonly removeLabel = input('Remover ficha');
  readonly disabled = input(false);

  private readonly coins = viewChildren<ElementRef<HTMLElement>>('coin');

  count(id: string): number {
    return this.counts()[id] ?? 0;
  }

  sign(v: number): string {
    return v > 0 ? `+${v}` : `−${Math.abs(v)}`;
  }

  add(id: string, index: number): void {
    this.counts.set({ ...this.counts(), [id]: Math.min(99, this.count(id) + 1) });
    const el = this.coins()[index]?.nativeElement;
    if (el) pop(el, 0.9);
  }

  remove(id: string): void {
    this.counts.set({ ...this.counts(), [id]: Math.max(0, this.count(id) - 1) });
  }
}
