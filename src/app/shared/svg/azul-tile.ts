import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { AzulColor } from '../../features/azul/scoring/azul-scoring';

const FILL: Record<AzulColor, string> = {
  blue: 'var(--azul-blue)',
  yellow: 'var(--azul-yellow)',
  red: 'var(--azul-red)',
  black: 'var(--azul-black)',
  white: 'var(--azul-white)',
};

/**
 * Inline SVG Azul tile. Rendered as SVG (not <img>) so its fill is driven by the
 * app's color tokens. Draws a rounded square with a subtle beveled highlight to
 * echo the ceramic tiles.
 */
@Component({
  selector: 'app-azul-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 100" [attr.aria-label]="'azulejo ' + color()" role="img">
      <defs>
        <linearGradient [attr.id]="gradId()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="0.5" stop-color="rgba(255,255,255,0)" />
          <stop offset="1" stop-color="rgba(0,0,0,0.18)" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="16" [attr.fill]="fill()" />
      <rect x="4" y="4" width="92" height="92" rx="16" [attr.fill]="'url(#' + gradId() + ')'" />
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="16"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        stroke-width="1.5"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        aspect-ratio: 1;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class AzulTile {
  readonly color = input.required<AzulColor>();
  private static counter = 0;
  private readonly uid = `atg${AzulTile.counter++}`;
  readonly gradId = computed(() => this.uid);
  readonly fill = computed(() => FILL[this.color()]);
}
