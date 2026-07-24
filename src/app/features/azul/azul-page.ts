import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Seo } from '../../core/seo/seo';
import { AzulMatch } from '../../core/services/azul-match';
import { AzulWall } from './wall/azul-wall';
import { RoundHistory } from './round-history/round-history';
import { AuditSheet } from '../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { floorPenalty } from './scoring/azul-scoring';

@Component({
  selector: 'app-azul-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AzulWall, RoundHistory, AuditSheet, ConfirmDialog],
  templateUrl: './azul-page.html',
  styleUrl: './azul-page.scss',
})
export class AzulPage {
  readonly match = inject(AzulMatch);
  private readonly seo = inject(Seo);

  readonly showAudit = signal(false);
  /** which confirmation dialog is open, if any */
  readonly confirm = signal<'finish' | 'new' | null>(null);

  readonly draftCount = computed(() => this.match.draftPlacements().length);
  readonly preview = this.match.draftPreview;
  readonly isViewingHistory = computed(() => this.match.viewedRound() !== null);
  readonly finished = this.match.finished;

  /** floor-line slots (1..7) rendered as a penalty "rating" row */
  readonly floorSlots = [1, 2, 3, 4, 5, 6, 7];

  constructor() {
    this.seo.update({
      title: 'Contador de pontos do Azul — parede, penalidades e bônus | LudoCount',
      description:
        'Conte os pontos do jogo Azul sem errar: parede 5x5 interativa, pontuação por ligação, ' +
        'penalidades da linha do chão e bônus de linhas, colunas e cores completas no fim da partida.',
      path: '/azul',
    });

    // No browser o título acompanha o placar ao vivo. No prerender ele é
    // preservado descritivo, senão o buscador indexaria "Azul - 0".
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => {
        this.seo.setTitle(`Azul - ${this.match.finalTotal()}`);
      });
    }
  }

  cumulativePenalty(slot: number): number {
    return floorPenalty(slot);
  }

  onFloorClick(slot: number): void {
    // rating behaviour: click selects 1..slot; re-clicking the highest clears it back one
    this.match.setFloor(this.match.draftFloor() === slot ? slot - 1 : slot);
  }

  commit(): void {
    this.match.commitRound();
  }

  confirmFinish(): void {
    this.match.finish();
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.match.reset();
    this.confirm.set(null);
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
