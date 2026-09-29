import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScoreTicker } from '../../../shared/motion/score-ticker';

/**
 * Uma categoria da planilha do 7 Wonders: faixa na cor da carta do jogo,
 * título, dica e o subtotal da categoria (que rola ao mudar). Os controles
 * de entrada vêm por projeção de conteúdo.
 */
@Component({
  selector: 'app-sw-cat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScoreTicker],
  host: { '[style.--c]': 'color()' },
  template: `
    <section class="cat">
      <header class="head">
        <div class="t">
          <h3 class="name">{{ label() }}</h3>
          @if (hint()) {
            <p class="hint-line">{{ hint() }}</p>
          }
        </div>
        <app-score-ticker class="pts" [class.neg]="points() < 0" [value]="points()" [showDelta]="false" />
      </header>
      <div class="body"><ng-content /></div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .cat {
        position: relative;
        padding: 16px 16px 16px 20px;
        border-radius: var(--radius-lg);
        background: var(--surface);
        border: 1px solid var(--line);
        overflow: hidden;
      }
      .cat::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 5px;
        background: var(--c);
      }
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .t {
        min-width: 0;
      }
      .name {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.08rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .hint-line {
        margin: 2px 0 0;
        font-size: 0.82rem;
        line-height: 1.4;
        color: var(--text-faint);
      }
      .pts {
        font-family: var(--font-display);
        font-size: 1.7rem;
        font-weight: 800;
        color: var(--text);
      }
      .pts.neg {
        color: var(--bad);
      }
      .body:not(:empty) {
        margin-top: 14px;
      }
    `,
  ],
})
export class SwCat {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly points = input(0);
  /** cor da carta (variável CSS, ex.: 'var(--sw-military)') */
  readonly color = input('var(--line-strong)');
}
