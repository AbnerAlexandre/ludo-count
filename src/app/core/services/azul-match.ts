import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import {
  cloneWall,
  emptyWall,
  endGameScore,
  floorPenalty,
  scoreRound,
  wallColor,
  type AzulColor,
  type Placement,
  type RoundResult,
  type Wall,
} from '../../features/azul/scoring/azul-scoring';

interface AzulSnapshot {
  wall: Wall;
  rounds: RoundResult[];
  finished: boolean;
}

const KEY = 'azul';

/**
 * Azul match state. Components read signals; all scoring goes through the pure
 * functions in `azul-scoring.ts`. Persisted to localStorage so a refresh mid-game
 * does not lose progress. Modelled for a single player but shaped so more could
 * be added later.
 */
@Injectable({ providedIn: 'root' })
export class AzulMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  /** committed wall (all past rounds applied) */
  readonly wall = signal<Wall>(emptyWall());
  /** committed round history */
  readonly rounds = signal<RoundResult[]>([]);

  /** tiles selected for the round currently being entered (not yet committed) */
  readonly draftPlacements = signal<Placement[]>([]);
  /** floor-line tile count for the round being entered */
  readonly draftFloor = signal<number>(0);

  /** which round the history viewer is focused on (null = live/current) */
  readonly viewedRound = signal<number | null>(null);

  /** true once the player finishes the match — locks all inputs */
  readonly finished = signal(false);

  /** running total from the rounds (floor-at-zero already applied per round) */
  readonly total = computed(() => {
    const r = this.rounds();
    return r.length ? r[r.length - 1].totalAfter : 0;
  });

  /** end-of-game bonuses computed from the final wall */
  readonly endGame = computed(() => endGameScore(this.wall()));

  /** total shown to the player: adds the end-game bonuses once finished */
  readonly finalTotal = computed(() => this.total() + (this.finished() ? this.endGame().total : 0));

  readonly roundNumber = computed(() => this.rounds().length + 1);

  /** preview of what the in-progress round would score, live */
  readonly draftPreview = computed(() =>
    scoreRound(this.wall(), this.draftPlacements(), this.draftFloor(), this.total()).result,
  );

  /** which round each occupied wall cell belongs to (for the round-number badge) */
  readonly cellRound = computed(() => {
    const grid: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
    this.rounds().forEach((r, i) => {
      for (const p of r.placements) grid[p.row][p.col] = i + 1;
    });
    return grid;
  });

  /** cells placed during the round currently being viewed in history */
  readonly highlightedCells = computed(() => {
    const idx = this.viewedRound();
    if (idx == null) return new Set<string>();
    const r = this.rounds()[idx];
    return new Set(r ? r.placements.map((p) => `${p.row}-${p.col}`) : []);
  });

  readonly audit = computed<AuditEntry[]>(() => {
    const t = this.i18n;
    const out: AuditEntry[] = [];
    this.rounds().forEach((r, i) => {
      const group = t.tp('audit.round', { n: i + 1 });
      for (const p of r.placements) {
        const detail =
          p.h > 1 && p.v > 1
            ? t.tp('audit.detail.cross', { h: p.h, v: p.v })
            : p.h > 1
              ? t.tp('audit.detail.h', { h: p.h })
              : p.v > 1
                ? t.tp('audit.detail.v', { v: p.v })
                : t.t('audit.detail.isolated');
        out.push({
          id: `r${i}-p${p.row}${p.col}`,
          group,
          label: t.tp('audit.azulTile', { r: p.row + 1, c: p.col + 1 }),
          points: p.points,
          detail,
          kind: 'placement',
        });
      }
      if (r.floorCount > 0) {
        out.push({
          id: `r${i}-floor`,
          group,
          label:
            r.floorCount === 1
              ? t.tp('audit.floorOne', { n: r.floorCount })
              : t.tp('audit.floorMany', { n: r.floorCount }),
          points: r.floorPenalty,
          kind: 'penalty',
        });
      }
    });

    if (this.finished()) {
      const eg = this.endGame();
      const egGroup = t.t('audit.endgame');
      for (const row of eg.completedRows) {
        out.push({
          id: `eg-row-${row}`,
          group: egGroup,
          label: t.tp('audit.rowComplete', { n: row + 1 }),
          points: 2,
          detail: t.t('audit.rowDetail'),
          kind: 'bonus',
        });
      }
      for (const col of eg.completedCols) {
        out.push({
          id: `eg-col-${col}`,
          group: egGroup,
          label: t.tp('audit.colComplete', { n: col + 1 }),
          points: 7,
          detail: t.t('audit.colDetail'),
          kind: 'bonus',
        });
      }
      for (const color of eg.completedColors) {
        out.push({
          id: `eg-color-${color}`,
          group: egGroup,
          label: t.tp('audit.colorComplete', { color: t.t(`color.${color}`) }),
          points: 10,
          detail: t.t('audit.colorDetail'),
          kind: 'bonus',
        });
      }
    }
    return out;
  });

  readonly hasProgress = computed(
    () => this.rounds().length > 0 || this.draftPlacements().length > 0 || this.draftFloor() > 0,
  );

  constructor() {
    const snap = this.store.load<AzulSnapshot>(KEY);
    if (snap?.wall && snap?.rounds) {
      this.wall.set(snap.wall);
      this.rounds.set(snap.rounds);
      this.finished.set(!!snap.finished);
    }
    // persist committed state whenever it changes
    effect(() => {
      const snap: AzulSnapshot = { wall: this.wall(), rounds: this.rounds(), finished: this.finished() };
      this.store.save(KEY, snap);
    });
  }

  // ---- draft editing -------------------------------------------------------

  colorAt(row: number, col: number): AzulColor {
    return wallColor(row, col);
  }

  isCommitted(row: number, col: number): boolean {
    return this.wall()[row][col];
  }

  isDraft(row: number, col: number): boolean {
    return this.draftPlacements().some((p) => p.row === row && p.col === col);
  }

  /** Toggle a cell for the in-progress round. One tile per row (Azul rule). */
  toggleCell(row: number, col: number): void {
    if (this.finished() || this.isCommitted(row, col)) return;
    const current = this.draftPlacements();
    const existing = current.find((p) => p.row === row && p.col === col);
    if (existing) {
      this.draftPlacements.set(current.filter((p) => p !== existing));
    } else {
      // replace any other draft tile already chosen for this row
      const withoutRow = current.filter((p) => p.row !== row);
      this.draftPlacements.set([...withoutRow, { row, col }]);
    }
  }

  setFloor(n: number): void {
    if (this.finished()) return;
    this.draftFloor.set(Math.max(0, Math.min(7, n)));
  }

  floorPreview(): number {
    return floorPenalty(this.draftFloor());
  }

  canCommit(): boolean {
    return !this.finished() && (this.draftPlacements().length > 0 || this.draftFloor() > 0);
  }

  /** Commit the in-progress round to history. */
  commitRound(): void {
    if (!this.canCommit()) return;
    const { result, wallAfter } = scoreRound(
      this.wall(),
      this.draftPlacements(),
      this.draftFloor(),
      this.total(),
    );
    this.rounds.update((rs) => [...rs, result]);
    this.wall.set(wallAfter);
    this.draftPlacements.set([]);
    this.draftFloor.set(0);
    this.viewedRound.set(null);
  }

  // ---- history navigation --------------------------------------------------

  viewRound(idx: number | null): void {
    this.viewedRound.set(idx);
  }

  stepHistory(delta: number): void {
    const rounds = this.rounds();
    if (!rounds.length) return;
    const current = this.viewedRound() ?? rounds.length - 1;
    const next = Math.max(0, Math.min(rounds.length - 1, current + delta));
    this.viewedRound.set(next);
  }

  // ---- lifecycle -----------------------------------------------------------

  /** Finish the match: apply end-game bonuses and lock all inputs. */
  finish(): void {
    if (this.finished()) return;
    // fold any uncommitted draft in first so nothing is lost
    if (this.draftPlacements().length > 0 || this.draftFloor() > 0) this.commitRound();
    this.finished.set(true);
    this.viewedRound.set(null);
  }

  /** Clears history and starts a fresh match. */
  reset(): void {
    this.wall.set(emptyWall());
    this.rounds.set([]);
    this.draftPlacements.set([]);
    this.draftFloor.set(0);
    this.viewedRound.set(null);
    this.finished.set(false);
    this.store.clear(KEY);
  }

  /** snapshot copy for the wall (defensive, used by the wall component) */
  wallCopy(): Wall {
    return cloneWall(this.wall());
  }
}
