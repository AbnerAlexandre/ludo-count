import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AzulMatch } from '../../../core/services/azul-match';
import { AzulTile } from '../../../shared/svg/azul-tile';
import { wallColor, type AzulColor } from '../scoring/azul-scoring';

interface Cell {
  row: number;
  col: number;
  color: AzulColor;
}

/**
 * The 5×5 Azul wall. Fixed color positions follow
 * cor(linha, coluna) = CORES[(coluna - linha) mod 5].
 *
 * States per cell:
 *  - committed  → filled tile + round-number badge
 *  - draft      → selected for the round being entered (pulsing)
 *  - highlighted→ belongs to the round being viewed in history (ring)
 *  - empty      → faint color hint, tappable
 */
@Component({
  selector: 'app-azul-wall',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AzulTile],
  template: `
    <div class="wall" role="grid" aria-label="Parede do Azul">
      @for (row of rows; track row) {
        <div class="wall-row" role="row">
          @for (col of cols; track col) {
            @let committed = match.isCommitted(row, col);
            @let draft = match.isDraft(row, col);
            @let highlighted = highlightSet().has(row + '-' + col);
            <button
              type="button"
              role="gridcell"
              class="cell"
              [class.committed]="committed"
              [class.draft]="draft"
              [class.highlighted]="highlighted"
              [class.locked]="committed || readOnly()"
              [attr.data-color]="colorAt(row, col)"
              [attr.aria-label]="cellLabel(row, col, committed, draft)"
              [attr.aria-selected]="committed || draft"
              [disabled]="committed || readOnly()"
              (click)="onTap(row, col)"
            >
              <app-azul-tile
                class="tile"
                [class.faded]="!committed && !draft"
                [color]="colorAt(row, col)"
              />

              @if (committed && badge(row, col); as n) {
                <span class="badge tabular" aria-hidden="true">{{ n }}</span>
              }
              @if (draft) {
                <span class="badge draft-badge tabular" aria-hidden="true">{{ match.roundNumber() }}</span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './azul-wall.scss',
})
export class AzulWall {
  readonly match = inject(AzulMatch);

  readonly rows = [0, 1, 2, 3, 4];
  readonly cols = [0, 1, 2, 3, 4];

  /** when viewing history, the wall is read-only */
  readonly readOnly = computed(() => this.match.viewedRound() !== null);
  readonly highlightSet = this.match.highlightedCells;

  colorAt(row: number, col: number): AzulColor {
    return wallColor(row, col);
  }

  badge(row: number, col: number): number | null {
    return this.match.cellRound()[row][col];
  }

  onTap(row: number, col: number): void {
    if (this.readOnly()) return;
    this.match.toggleCell(row, col);
  }

  cellLabel(row: number, col: number, committed: boolean, draft: boolean): string {
    const state = committed ? 'preenchido' : draft ? 'selecionado' : 'vazio';
    return `Linha ${row + 1}, coluna ${col + 1}, ${this.colorAt(row, col)}, ${state}`;
  }
}
