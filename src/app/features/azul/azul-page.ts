import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AzulMatch } from '../../core/services/azul-match';
import { AzulWall } from './wall/azul-wall';
import { RoundHistory } from './round-history/round-history';
import { AuditSheet } from '../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';

@Component({
  selector: 'app-azul-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AzulWall, RoundHistory, AuditSheet, ConfirmDialog],
  templateUrl: './azul-page.html',
  styleUrl: './azul-page.scss',
})
export class AzulPage {
  readonly match = inject(AzulMatch);

  readonly showAudit = signal(false);
  readonly showConfirm = signal(false);

  readonly draftCount = computed(() => this.match.draftPlacements().length);
  readonly preview = this.match.draftPreview;
  readonly isViewingHistory = computed(() => this.match.viewedRound() !== null);

  setFloor(n: number): void {
    this.match.setFloor(n);
  }

  commit(): void {
    this.match.commitRound();
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.showConfirm.set(false);
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
