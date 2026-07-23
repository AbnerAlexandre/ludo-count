import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AzulMatch } from '../../../core/services/azul-match';

/**
 * Navigable round history. Stepping selects a round, which highlights that
 * round's tiles on the wall (via the shared service). Shows the points scored,
 * the floor penalty, the running total, and the tiles placed for the round.
 */
@Component({
  selector: 'app-round-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './round-history.html',
  styleUrl: './round-history.scss',
})
export class RoundHistory {
  readonly match = inject(AzulMatch);

  readonly rounds = this.match.rounds;
  readonly viewed = this.match.viewedRound;

  readonly selectedIndex = computed(() => {
    const v = this.viewed();
    const n = this.rounds().length;
    if (n === 0) return -1;
    return v ?? n - 1;
  });

  readonly selected = computed(() => {
    const i = this.selectedIndex();
    return i >= 0 ? this.rounds()[i] : null;
  });

  readonly isLive = computed(() => this.viewed() === null);

  colorName(c: string): string {
    return (
      { blue: 'azul', yellow: 'amarelo', red: 'vermelho', black: 'preto', white: 'branco' } as Record<string, string>
    )[c] ?? c;
  }

  step(delta: number): void {
    this.match.stepHistory(delta);
  }

  select(i: number): void {
    this.match.viewRound(i);
  }

  backToLive(): void {
    this.match.viewRound(null);
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
