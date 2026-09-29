import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface ChoiceOption<T extends string | number = string | number> {
  value: T;
  label: string;
  /** texto secundário, ex.: pontos que a opção vale */
  sub?: string;
}

/** Seletor segmentado (grupo de rádio) para escolhas curtas e fechadas. */
@Component({
  selector: 'app-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="radiogroup" [attr.aria-label]="label()">
      @for (o of options(); track o.value) {
        <button
          type="button"
          role="radio"
          class="opt"
          [class.on]="o.value === value()"
          [attr.aria-checked]="o.value === value()"
          [disabled]="disabled()"
          (click)="value.set(o.value)"
        >
          <span class="lbl">{{ o.label }}</span>
          @if (o.sub) {
            <span class="sub tabular">{{ o.sub }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      .seg {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        gap: 4px;
        padding: 4px;
        background: var(--surface-2);
        border: 1px solid var(--line);
        border-radius: calc(var(--radius) + 4px);
      }
      .opt {
        min-height: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        padding: 4px 6px;
        border: 1px solid transparent;
        border-radius: var(--radius);
        background: transparent;
        color: var(--text-dim);
        cursor: pointer;
        transition:
          background-color var(--dur-fast) ease,
          color var(--dur-fast) ease,
          transform var(--dur-press) var(--ease-out);
      }
      .opt:active:not(:disabled) {
        transform: scale(0.96);
      }
      .opt:disabled {
        cursor: not-allowed;
      }
      .opt:disabled:not(.on) {
        opacity: 0.45;
      }
      .opt.on {
        background: var(--game);
        color: var(--game-ink);
      }
      .lbl {
        font-weight: 800;
        font-size: 0.95rem;
      }
      .sub {
        font-size: 0.72rem;
        font-weight: 600;
        opacity: 0.85;
      }
      @media (hover: hover) and (pointer: fine) {
        .opt:not(.on):hover {
          background: var(--surface-3);
          color: var(--text);
        }
      }
    `,
  ],
})
export class Choice {
  readonly options = input.required<ChoiceOption[]>();
  readonly value = model<string | number>();
  readonly label = input('');
  readonly disabled = input(false);
}
