import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

/**
 * Thumb-friendly numeric stepper. Big −/+ tap targets (≥48px) so numbers can be
 * entered one-handed at the table without a keyboard.
 */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" [class.compact]="compact()">
      <button
        type="button"
        class="btn"
        [attr.aria-label]="'Diminuir ' + label()"
        [disabled]="value() <= min()"
        (click)="bump(-1)"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>

      <div class="readout">
        <span class="num tabular">{{ prefix() }}{{ value() }}</span>
        @if (unit()) {
          <span class="unit">{{ unit() }}</span>
        }
      </div>

      <button
        type="button"
        class="btn"
        [attr.aria-label]="'Aumentar ' + label()"
        [disabled]="value() >= max()"
        (click)="bump(1)"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  `,
  styles: [
    `
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-elev-2);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 5px;
      }
      .btn {
        width: var(--tap);
        height: var(--tap);
        min-width: var(--tap);
        border-radius: 999px;
        border: none;
        background: var(--surface);
        color: var(--text);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: transform 0.12s ease, background 0.15s ease, opacity 0.15s ease;
      }
      .btn:hover:not(:disabled) {
        background: color-mix(in srgb, var(--game) 30%, var(--surface));
      }
      .btn:active:not(:disabled) {
        transform: scale(0.9);
      }
      .btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .readout {
        min-width: 62px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
      }
      .num {
        font-size: 1.5rem;
        font-weight: 800;
      }
      .unit {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
        margin-top: 2px;
      }
      .compact .btn {
        width: 44px;
        height: 44px;
        min-width: 44px;
      }
      .compact .num {
        font-size: 1.2rem;
      }
    `,
  ],
})
export class Stepper {
  readonly value = model.required<number>();
  readonly min = input(0);
  readonly max = input(999);
  readonly step = input(1);
  readonly label = input('valor');
  readonly unit = input('');
  readonly prefix = input('');
  readonly compact = input(false);
  readonly changed = output<number>();

  bump(dir: number): void {
    const next = Math.max(this.min(), Math.min(this.max(), this.value() + dir * this.step()));
    this.value.set(next);
    this.changed.emit(next);
  }
}
