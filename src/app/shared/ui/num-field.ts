import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/**
 * Campo numérico para uso na mesa: teclas −/+ grandes e um input que aceita só
 * números (e o sinal de menos quando o mínimo é negativo).
 */
@Component({
  selector: 'app-num-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" [class.compact]="compact()">
      <button
        type="button"
        class="key step"
        [disabled]="disabled() || value() <= min()"
        [attr.aria-label]="decLabel() + ' ' + label()"
        (click)="bump(-1)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
      </button>
      <input
        class="val tabular"
        type="text"
        [attr.inputmode]="allowNegative() ? 'text' : 'numeric'"
        [attr.pattern]="allowNegative() ? '-?[0-9]*' : '[0-9]*'"
        autocomplete="off"
        [attr.aria-label]="label()"
        [readOnly]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        (keydown)="onKey($event)"
        (blur)="normalize($event)"
        (focus)="select($event)"
      />
      <button
        type="button"
        class="key step"
        [disabled]="disabled() || value() >= max()"
        [attr.aria-label]="incLabel() + ' ' + label()"
        (click)="bump(1)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .field {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .step {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .val {
        width: 64px;
        height: 44px;
        text-align: center;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text);
        background: var(--surface-2);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 0 4px;
        transition: border-color var(--dur-fast) ease;
      }
      .val:focus {
        outline: none;
        border-color: var(--game-text);
      }
      .compact .val {
        width: 54px;
      }
    `,
  ],
})
export class NumField {
  readonly value = model(0);
  readonly label = input('');
  readonly min = input(0);
  readonly max = input(999);
  readonly step = input(1);
  readonly compact = input(false);
  readonly disabled = input(false);
  readonly decLabel = input('Diminuir');
  readonly incLabel = input('Aumentar');

  readonly allowNegative = computed(() => this.min() < 0);

  bump(dir: number): void {
    this.set(this.value() + dir * this.step());
  }

  onInput(event: Event): void {
    if (this.disabled()) return;
    const el = event.target as HTMLInputElement;
    const neg = this.allowNegative() && el.value.trim().startsWith('-');
    const digits = el.value.replace(/[^0-9]/g, '').slice(0, 4);
    el.value = (neg ? '-' : '') + digits;
    if (digits === '') return; // aguarda o usuário terminar de digitar
    const n = parseInt(digits, 10) * (neg ? -1 : 1);
    this.value.set(Math.max(this.min(), Math.min(this.max(), n)));
  }

  onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (['e', 'E', '+', '.', ','].includes(event.key)) event.preventDefault();
    if (event.key === '-' && !this.allowNegative()) event.preventDefault();
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.bump(1);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.bump(-1);
    }
  }

  normalize(event: Event): void {
    const el = event.target as HTMLInputElement;
    el.value = String(this.value());
  }

  select(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  private set(n: number): void {
    this.value.set(Math.max(this.min(), Math.min(this.max(), n)));
  }
}
