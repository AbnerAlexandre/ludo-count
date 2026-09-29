import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

/**
 * Confirmação antes de ações destrutivas ou definitivas. Exige clique explícito;
 * cancelar (botão, fundo ou Esc) não altera nada.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancel.emit()' },
  template: `
    <div class="backdrop" animate.enter="in" animate.leave="out" role="presentation" (click)="cancel.emit()">
      <div
        class="card"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        [attr.aria-describedby]="'cd-msg'"
        (click)="$event.stopPropagation()"
      >
        <h2 class="display">{{ title() }}</h2>
        <p id="cd-msg">{{ message() }}</p>
        <div class="actions">
          <button type="button" class="btn btn-quiet" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" class="btn" [class.btn-danger]="tone() === 'danger'" [class.btn-primary]="tone() === 'primary'" (click)="confirm.emit()">
            {{ confirmLabel() }}
          </button>
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
        place-items: end center;
        padding: 16px;
        padding-bottom: max(16px, env(safe-area-inset-bottom));
        background: rgba(6, 8, 12, 0.62);
      }
      @media (min-width: 640px) {
        .backdrop {
          place-items: center;
        }
      }
      .card {
        width: min(440px, 100%);
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-xl);
        padding: 24px 20px 18px;
        box-shadow: var(--shadow);
      }
      h2 {
        margin: 0 0 8px;
        font-size: 1.4rem;
        font-weight: 800;
      }
      p {
        margin: 0 0 22px;
        color: var(--text-dim);
        line-height: 1.55;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .backdrop.in {
        animation: fade-in 200ms var(--ease-out);
      }
      .backdrop.in .card {
        animation: dialog-in 240ms var(--ease-out);
      }
      .backdrop.out {
        animation: fade-out 180ms var(--ease-out) forwards;
      }
      .backdrop.out .card {
        animation: dialog-out 160ms var(--ease-out) forwards;
      }
    `,
  ],
})
export class ConfirmDialog {
  readonly title = input('Tem certeza?');
  readonly message = input('Esta ação não pode ser desfeita.');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  /** 'danger' para apagar dados, 'primary' para ações definitivas mas não destrutivas */
  readonly tone = input<'danger' | 'primary'>('danger');
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    // foco inicial no botão seguro (cancelar)
    afterNextRender(() => (host.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-quiet')?.focus());
  }
}
