import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Interruptor liga/desliga com rótulo acessível. */
@Component({
  selector: 'app-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="switch"
      class="sw"
      [class.on]="checked()"
      [disabled]="disabled()"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      (click)="checked.set(!checked())"
    >
      <span class="knob"></span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .sw {
        position: relative;
        width: 56px;
        height: 32px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--line-strong);
        background: var(--surface-3);
        cursor: pointer;
        transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .sw::before {
        /* amplia a área de toque para 48px sem mudar o desenho */
        content: '';
        position: absolute;
        inset: -8px -4px;
      }
      .knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--text-dim);
        transition:
          transform var(--dur-base) var(--ease-out),
          background-color var(--dur-fast) ease;
      }
      .sw.on {
        background: var(--game);
        border-color: var(--game);
      }
      .sw.on .knob {
        transform: translateX(24px);
        background: var(--game-ink);
      }
      .sw:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class Switch {
  readonly checked = model(false);
  readonly label = input('');
  readonly disabled = input(false);
}
