import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n } from '../../../../core/i18n/i18n';
import { AzulGardenMatch } from '../../../../core/services/azul-garden-match';
import { ALL_CELLS, ELEMENTS, GARDEN_COLS, GARDEN_ROWS, isTile, neighbors, type GardenCell, type GardenElement } from '../garden-grid';
import type { GardenColor, GardenPattern } from '../garden-scoring';

export type GardenBrush = { mode: 'tile'; color: GardenColor; pattern: GardenPattern } | { mode: 'pavilion' } | { mode: 'erase' };

/** raio do hexágono (unidades do viewBox) */
const R = 22;
const HH = R * Math.sqrt(3);
const PAD = 6;

/** os 6 espaços do tabuleiro da fonte, em volta dela */
const RING = new Set(neighbors(Object.keys(ELEMENTS).find((k) => ELEMENTS[k] === 'fountain')!));

const CELLS = ALL_CELLS.map((c) => {
  const cx = PAD + R + c.col * 1.5 * R;
  const cy = PAD + HH / 2 + c.row * HH + (c.col & 1 ? HH / 2 : 0);
  const pts = Array.from({ length: 6 }, (_, k) => {
    const a = (k * Math.PI) / 3;
    return `${(cx + (R - 1.4) * Math.cos(a)).toFixed(1)},${(cy + (R - 1.4) * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return { ...c, cx, cy, pts, ring: RING.has(c.key), element: ELEMENTS[c.key] as GardenElement | undefined };
});

/**
 * O jardim como no tabuleiro da caixa: hexágonos deitados e o tabuleiro da fonte
 * no meio. Escolha a peça embaixo e toque no espaço onde a colocou na mesa.
 */
@Component({
  selector: 'app-garden-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="board" [attr.viewBox]="viewBox" role="group" [attr.aria-label]="i18n.t('garden.board.aria')">
      <rect class="bg" x="0" y="0" [attr.width]="w" [attr.height]="h" rx="10" />
      @for (c of cells; track c.key) {
        @let cell = m.cells()[c.key];
        @if (c.element) {
          <g class="el el-{{ c.element }}" role="img" [attr.aria-label]="i18n.t('garden.element.' + c.element)">
            <polygon [attr.points]="c.pts" />
            <g class="icon" [attr.transform]="'translate(' + c.cx + ' ' + c.cy + ')'">
              @switch (c.element) {
                @case ('fountain') {
                  <path d="M-8 0H8L5 5H-5ZM-2 5V8H2V5M0-1V-8M-4-2Q-5-5-3-7M4-2Q5-5 3-7" />
                }
                @case ('statue') {
                  <circle cy="-6" r="2.6" class="solid" />
                  <path d="M-3.5 7L-2-2H2L3.5 7ZM-6 9H6" />
                }
                @case ('bench') {
                  <path d="M-8-4H8M-8 0H8M-6 0V6M6 0V6" />
                }
              }
            </g>
          </g>
        } @else {
          <g
            class="sp"
            [class.ring]="c.ring"
            [class.hit]="hits().has(c.key)"
            [class.has]="!!cell"
            [class.locked]="m.finished()"
            role="button"
            [attr.tabindex]="m.finished() ? -1 : 0"
            [attr.aria-label]="label(c.col, c.row, cell)"
            (click)="tap(c.key, cell)"
            (keydown.enter)="tap(c.key, cell)"
            (keydown.space)="$event.preventDefault(); tap(c.key, cell)"
          >
            <polygon class="slot" [attr.points]="c.pts" />
            @if (cell) {
              @if (isTile(cell)) {
                <image
                  [attr.href]="'azul/queens-garden/' + cell.color + '-' + cell.pattern + '.webp'"
                  [attr.x]="c.cx - r"
                  [attr.y]="c.cy - hh / 2"
                  [attr.width]="r * 2"
                  [attr.height]="hh"
                />
                <polygon class="mark" [attr.points]="c.pts" />
              } @else {
                <polygon class="pav" [attr.points]="c.pts" />
                <path class="icon pav-icon" [attr.transform]="'translate(' + c.cx + ' ' + c.cy + ')'" d="M-8-1Q0-11 8-1ZM-6-1V7M6-1V7M-2-1V7M2-1V7M-9 7H9" />
              }
            }
          </g>
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .board {
        display: block;
        width: 100%;
        max-width: 620px;
        margin: 0 auto;
      }
      .bg {
        fill: #9fc56b;
        stroke: #6f9a3f;
        stroke-width: 3;
      }
      .slot {
        fill: #c4dd98;
        stroke: #b2d184;
        stroke-width: 1;
        transition: fill var(--dur-fast) ease;
      }
      .sp {
        cursor: pointer;
        outline: none;
      }
      .sp.locked {
        cursor: default;
      }
      .sp:focus-visible .slot {
        stroke: #10131a;
        stroke-width: 2.5;
      }
      .sp image {
        pointer-events: none;
      }
      /* contorno claro do tabuleiro da fonte, como a peça da caixa */
      .ring .slot {
        stroke: #f4ecd8;
        stroke-width: 2;
      }
      /* hexágono que a roda pontua nesta rodada */
      .mark {
        fill: none;
        stroke: transparent;
        stroke-width: 2.6;
        pointer-events: none;
      }
      .hit .mark {
        stroke: #fff;
      }
      .el polygon,
      .pav {
        fill: #f4ecd8;
        stroke: #e2d6b8;
        stroke-width: 1;
      }
      .el-fountain polygon {
        fill: #2f6b3f;
        stroke: #2f6b3f;
      }
      .icon {
        fill: none;
        stroke: #3c6b33;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .el-fountain .icon {
        stroke: #f4ecd8;
      }
      .icon .solid {
        fill: #3c6b33;
        stroke: none;
      }
      @media (hover: hover) and (pointer: fine) {
        .sp:not(.locked):not(.has):hover .slot {
          fill: #e3eecb;
        }
      }
    `,
  ],
})
export class GardenBoard {
  readonly m = inject(AzulGardenMatch);
  readonly i18n = inject(I18n);
  readonly brush = input.required<GardenBrush>();

  readonly cells = CELLS;
  readonly r = R;
  readonly hh = HH;
  readonly w = PAD * 2 + 2 * R + (GARDEN_COLS - 1) * 1.5 * R;
  readonly h = PAD * 2 + HH * GARDEN_ROWS + HH / 2;
  readonly viewBox = `0 0 ${this.w} ${this.h}`;
  readonly isTile = isTile;

  /** espaços cujo hexágono combina com algum item da roda desta rodada */
  readonly hits = computed(() => {
    const items = new Set(this.m.draft().wheel.map((w) => w.item).filter(Boolean));
    const out = new Set<string>();
    if (!items.size || this.m.finished()) return out;
    for (const [k, c] of Object.entries(this.m.cells())) if (isTile(c) && (items.has(c.color) || items.has(c.pattern))) out.add(k);
    return out;
  });

  /** tocar de novo com a mesma peça tira; com outra, troca */
  tap(key: string, cell: GardenCell | undefined): void {
    if (this.m.finished()) return;
    const b = this.brush();
    if (b.mode === 'erase') return this.m.setCell(key, null);
    if (b.mode === 'pavilion') return this.m.setCell(key, cell && !isTile(cell) ? null : { pavilion: true });
    const same = isTile(cell) && cell.color === b.color && cell.pattern === b.pattern;
    this.m.setCell(key, same ? null : { color: b.color, pattern: b.pattern });
  }

  label(col: number, row: number, cell: GardenCell | undefined): string {
    const t = this.i18n;
    const what = !cell
      ? t.t('azul.cell.empty')
      : isTile(cell)
        ? `${t.t('garden.pattern.' + cell.pattern)} ${t.t('garden.color.' + cell.color)}`
        : t.t('garden.element.pavilion');
    return t.tp('garden.board.cellAria', { c: col + 1, r: row + 1, what });
  }
}
