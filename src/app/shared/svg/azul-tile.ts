import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { AzulColor } from '../../features/azul/scoring/azul-scoring';

/** Maps a wall color to its real tile artwork in public/azul/. */
const TILE_SRC: Record<AzulColor, string> = {
  blue: 'azul/tile-blue.svg',
  yellow: 'azul/tile-yellow.svg',
  red: 'azul/tile-red.svg',
  black: 'azul/tile-black.svg',
  white: 'azul/tile-turquoise.svg', // "branco" na regra = azulejo turquesa
};

/**
 * Azul tile — renders the actual tile artwork shipped in public/azul/ so the
 * decorative patterns match the physical game. The tile is a square; the parent
 * cell's rounded overflow gives it the tile shape.
 */
@Component({
  selector: 'app-azul-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="src()" [alt]="'azulejo ' + color()" draggable="false" />`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        aspect-ratio: 1;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class AzulTile {
  readonly color = input.required<AzulColor>();
  readonly src = computed(() => TILE_SRC[this.color()]);
}
