import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Confirmation dialog used before any destructive lifecycle action (starting a
 * new match). Requires an explicit confirm; cancelling leaves state untouched.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('backdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('180ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('140ms ease', style({ opacity: 0 }))]),
    ]),
    trigger('sheet', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.96)' }),
        animate('240ms cubic-bezier(0.22,1,0.36,1)', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('160ms ease', style({ opacity: 0, transform: 'translateY(12px) scale(0.98)' })),
      ]),
    ]),
  ],
  template: `
    <div class="backdrop" @backdrop role="presentation" (click)="cancel.emit()">
      <div
        class="card"
        @sheet
        role="alertdialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
      >
        <div class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h2 class="display">{{ title() }}</h2>
        <p>{{ message() }}</p>
        <div class="actions">
          <button type="button" class="ghost" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" class="danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(5, 9, 18, 0.62);
        backdrop-filter: blur(6px);
      }
      .card {
        width: min(420px, 100%);
        background: var(--bg-elev);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        padding: 28px 24px 22px;
        box-shadow: var(--shadow);
        text-align: center;
      }
      .icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 14px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--warn);
        background: color-mix(in srgb, var(--warn) 16%, transparent);
      }
      h2 {
        margin: 0 0 8px;
        font-size: 1.4rem;
        font-weight: 700;
      }
      p {
        margin: 0 0 22px;
        color: var(--text-dim);
        line-height: 1.5;
      }
      .actions {
        display: flex;
        gap: 12px;
      }
      button {
        flex: 1;
        min-height: var(--tap);
        border-radius: 999px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 0.12s ease, filter 0.15s ease;
      }
      button:active {
        transform: scale(0.97);
      }
      .ghost {
        background: var(--bg-elev-2);
        border-color: var(--line);
        color: var(--text);
      }
      .danger {
        background: var(--bad);
        color: #fff;
      }
      .danger:hover {
        filter: brightness(1.08);
      }
    `,
  ],
})
export class ConfirmDialog {
  readonly title = input('Tem certeza?');
  readonly message = input('Esta ação não pode ser desfeita.');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
