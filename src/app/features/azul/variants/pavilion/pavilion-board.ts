import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { I18n } from '../../../../core/i18n/i18n';
import { AzulPavilionMatch } from '../../../../core/services/azul-pavilion-match';
import {
  BOARD_EXTENT,
  BONUS_SPACES,
  BONUS_TILES,
  STAR_SPACES,
  toPath,
  type BonusSpace,
  type StarSpace,
} from '../pavilion-geometry';

/** lado do losango (unidades do viewBox) */
const S = 30;
const R = S * Math.sqrt(3);
const W = BOARD_EXTENT.x * S;
const H = BOARD_EXTENT.y * S;

interface Space extends StarSpace {
  d: string;
  lx: number;
  ly: number;
  /** imagem do azulejo: losango deitado com a ponta fina na origem */
  tf: string;
}
interface Bonus extends BonusSpace {
  d: string;
  cx: number;
  cy: number;
}

const SPACES: Space[] = STAR_SPACES.map((sp) => ({
  ...sp,
  d: toPath(sp.pts, S),
  lx: sp.label.x * S,
  ly: sp.label.y * S,
  tf: `translate(${(sp.pts[0].x * S).toFixed(2)} ${(sp.pts[0].y * S).toFixed(2)}) rotate(${sp.angle})`,
}));
const BONUS: Bonus[] = BONUS_SPACES.map((b) => ({ ...b, d: toPath(b.pts, S), cx: b.center.x * S, cy: b.center.y * S }));

/** cantos azuis do tabuleiro (onde ficam os azulejos guardados) */
const CORNERS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
].map(([sx, sy]) => `M${sx * W} ${sy * H}H${sx * (W - 1.8 * S)}L${sx * W} ${sy * (H - 1.6 * S)}Z`);

/**
 * Tabuleiro do Pavilhão de Verão como o da caixa: 7 estrelas que se tocam pelas
 * pontas, números perto da ponta de cada losango, e os pilares, estátuas e
 * janelas entre elas. Toque nas casas na ordem em que colocou os azulejos — a
 * ordem muda os pontos — e o tabuleiro avisa quando você cercou um bônus.
 */
@Component({
  selector: 'app-pavilion-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="board" [attr.viewBox]="viewBox" role="group" [attr.aria-label]="i18n.t('pav.boardAria')">
      <rect class="bg" [attr.x]="-w" [attr.y]="-h" [attr.width]="w * 2" [attr.height]="h * 2" rx="10" />
      @for (c of corners; track $index) {
        <path class="corner" [attr.d]="c" />
      }

      @for (b of bonus; track b.id) {
        @let state = m.bonusState().get(b.id);
        <g class="bonus" [class.new]="state === 'new'" [class.done]="state === 'done'" [attr.aria-label]="bonusLabel(b, state)" role="img">
          <path class="b-slot" [attr.d]="b.d" />
          @if (state === 'new') {
            <text class="b-plus" [attr.x]="b.cx" [attr.y]="b.cy">+{{ tilesFor(b) }}</text>
          } @else {
            <g class="b-icon" [attr.transform]="'translate(' + b.cx + ' ' + b.cy + ')'">
              @switch (b.kind) {
                @case ('pillar') {
                  <circle r="4.6" />
                }
                @case ('statue') {
                  <circle cy="-4.2" r="2" />
                  <path d="M-3 5 L-1.7 -1.4 H1.7 L3 5 Z" />
                }
                @case ('window') {
                  <path d="M-3.4 5 V-0.6 A3.4 3.4 0 0 1 3.4 -0.6 V5 Z M0 -4 V5 M-3.4 1.4 H3.4" />
                }
              }
            </g>
          }
        </g>
      }

      @for (sp of spaces; track sp.star + sp.index) {
        @let committed = m.isCommitted(sp.star, sp.index);
        @let order = m.draftOrder(sp.star, sp.index);
        @let color = tileColor(sp);
        <g
          class="sp st-{{ sp.star }}"
          [class.filled]="committed"
          [class.draft]="order >= 0"
          [class.locked]="committed || !m.canPlace()"
          role="button"
          [attr.tabindex]="committed || !m.canPlace() ? -1 : 0"
          [attr.aria-pressed]="order >= 0"
          [attr.aria-label]="label(sp, committed, order >= 0)"
          (click)="tap(sp)"
          (keydown.enter)="tap(sp)"
          (keydown.space)="$event.preventDefault(); tap(sp)"
        >
          <path class="slot" [attr.d]="sp.d" />
          @if (color) {
            <image
              class="tile"
              [attr.href]="'azul/summer-pavilion/tile-' + color + '.webp'"
              x="0"
              [attr.y]="-half"
              [attr.width]="long"
              [attr.height]="side"
              [attr.transform]="sp.tf"
              preserveAspectRatio="none"
            />
          }
          @if (order >= 0) {
            <path class="ring" [attr.d]="sp.d" />
            <circle class="badge" [attr.cx]="sp.lx" [attr.cy]="sp.ly" r="8" />
            <text class="badge-n" [attr.x]="sp.lx" [attr.y]="sp.ly">{{ order + 1 }}</text>
          } @else if (!color) {
            <text class="num" [attr.x]="sp.lx" [attr.y]="sp.ly">{{ sp.index + 1 }}</text>
          }
        </g>
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        --pv-board: #f1e8d4;
        --pv-line: #fbf6ea;
        --pv-blue: #2c5f93;
        --pv-navy: #1d3a6b;
      }
      .board {
        display: block;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }
      .bg {
        fill: var(--pv-board);
        stroke: var(--pv-blue);
        stroke-width: 3;
      }
      .corner {
        fill: var(--pv-blue);
      }
      .sp {
        cursor: pointer;
        outline: none;
      }
      .sp.locked {
        cursor: default;
      }
      .slot {
        stroke: var(--pv-line);
        stroke-width: 1.6;
        stroke-linejoin: round;
        transition: opacity var(--dur-fast) ease;
      }
      /* cores impressas no tabuleiro, um tom mais claro que as peças */
      .st-red .slot { fill: color-mix(in srgb, #d6463a 55%, var(--pv-board)); }
      .st-blue .slot { fill: color-mix(in srgb, #2a8cc6 55%, var(--pv-board)); }
      .st-yellow .slot { fill: color-mix(in srgb, #efc03a 60%, var(--pv-board)); }
      .st-orange .slot { fill: color-mix(in srgb, #ec8a2c 55%, var(--pv-board)); }
      .st-green .slot { fill: color-mix(in srgb, #6db43f 55%, var(--pv-board)); }
      .st-purple .slot { fill: color-mix(in srgb, #9a4fb2 55%, var(--pv-board)); }
      .st-center .slot { fill: var(--pv-navy); }
      .num {
        fill: #3b2f22;
        font: 800 12px var(--font-display);
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
      }
      .st-center .num {
        fill: #eadfc6;
      }
      .ring {
        fill: none;
        stroke: #10131a;
        stroke-width: 2.4;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .badge {
        fill: #10131a;
      }
      .badge-n {
        fill: #fff;
        font: 800 10px var(--font-body);
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
      }
      .tile {
        pointer-events: none;
      }
      .sp:focus-visible .slot {
        stroke: #10131a;
        stroke-width: 3;
      }

      .b-slot {
        fill: var(--pv-line);
        stroke: #d9ccb0;
        stroke-width: 1.2;
        stroke-linejoin: round;
        transition: fill var(--dur-fast) ease;
      }
      .b-icon {
        fill: none;
        stroke: var(--pv-blue);
        stroke-width: 1.6;
        stroke-linejoin: round;
      }
      .b-icon circle[cy] {
        fill: var(--pv-blue);
        stroke: none;
      }
      .bonus.done .b-slot {
        fill: #e5d9bf;
      }
      .bonus.done .b-icon {
        opacity: 0.35;
      }
      .bonus.new .b-slot {
        fill: var(--pv-blue);
        stroke: var(--pv-blue);
      }
      .b-plus {
        fill: #fff;
        font: 800 11px var(--font-display);
        text-anchor: middle;
        dominant-baseline: central;
      }
      @media (hover: hover) and (pointer: fine) {
        .sp:not(.locked):not(.filled):not(.draft):hover .slot {
          opacity: 0.72;
        }
      }
    `,
  ],
})
export class PavilionBoard {
  readonly m = inject(AzulPavilionMatch);
  readonly i18n = inject(I18n);

  /** casa do centro tocada: a página pergunta a cor */
  readonly pickCenter = output<number>();

  readonly spaces = SPACES;
  readonly bonus = BONUS;
  readonly corners = CORNERS;
  readonly w = W;
  readonly h = H;
  readonly viewBox = `${-W - 2} ${-H - 2} ${W * 2 + 4} ${H * 2 + 4}`;
  readonly side = S;
  readonly long = R;
  readonly half = S / 2;

  tileColor(sp: Space): string | null {
    const filled = this.m.isCommitted(sp.star, sp.index) || this.m.draftOrder(sp.star, sp.index) >= 0;
    if (!filled) return null;
    return sp.star === 'center' ? this.m.centerColorAt(sp.index) : sp.star;
  }

  tilesFor(b: BonusSpace): number {
    return BONUS_TILES[b.kind];
  }

  tap(sp: Space): void {
    if (!this.m.canPlace() || this.m.isCommitted(sp.star, sp.index)) return;
    if (sp.star === 'center' && this.m.draftOrder(sp.star, sp.index) < 0) {
      this.pickCenter.emit(sp.index);
      return;
    }
    this.m.toggle(sp.star, sp.index);
  }

  label(sp: Space, committed: boolean, draft: boolean): string {
    const state = committed ? this.i18n.t('azul.cell.filled') : draft ? this.i18n.t('azul.cell.selected') : this.i18n.t('azul.cell.empty');
    return this.i18n.tp('pav.spaceAria', { star: this.i18n.t(`pav.star.${sp.star}`), v: sp.index + 1, state });
  }

  bonusLabel(b: BonusSpace, state: string | undefined): string {
    const name = this.i18n.t(`pav.bonus.${b.kind}`);
    if (state === 'new') return this.i18n.tp('pav.bonus.take', { name, n: BONUS_TILES[b.kind] });
    return state === 'done' ? this.i18n.tp('pav.bonus.used', { name }) : name;
  }
}
