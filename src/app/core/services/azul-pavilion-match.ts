import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import {
  PAVILION_COLORS,
  PAVILION_NUMBER_BONUS,
  PAVILION_ROUNDS,
  PAVILION_STAR_BONUS,
  PAVILION_START,
  PAVILION_WILD,
  emptyBoard,
  pavilionEndGame,
  scorePavilionRound,
  type PavilionBoard,
  type PavilionColor,
  type PavilionPlacement,
  type PavilionRound,
  type PavilionStar,
} from '../../features/azul/variants/pavilion-scoring';
import { BONUS_SPACES, type BonusSpace } from '../../features/azul/variants/pavilion-geometry';

/** 'new' = cercado com os azulejos desta rodada (pegue o bônus); 'done' = já cercado antes */
export type BonusState = 'open' | 'new' | 'done';

interface PavilionSnapshot {
  board: PavilionBoard;
  /** cor de cada casa da estrela do centro (o centro aceita uma de cada) */
  centerColors: (PavilionColor | null)[];
  rounds: PavilionRound[];
  corners: number;
  finished: boolean;
}

const KEY = 'azul-pavilion';

/**
 * Partida de Azul: Pavilhão de Verão. Igual ao Azul: o jogador marca no
 * tabuleiro os azulejos colocados na rodada (na ordem em que colocou), informa
 * as penalidades e confirma; a conta sai de `pavilion-scoring.ts`.
 */
@Injectable({ providedIn: 'root' })
export class AzulPavilionMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly board = signal<PavilionBoard>(emptyBoard());
  readonly centerColors = signal<(PavilionColor | null)[]>(Array(6).fill(null));
  readonly rounds = signal<PavilionRound[]>([]);
  /** azulejos que sobraram nos cantos no fim do jogo (−1 cada) */
  readonly corners = signal(0);
  readonly finished = signal(false);

  readonly draft = signal<PavilionPlacement[]>([]);
  readonly draftFirstPlayer = signal(0);
  readonly draftDiscards = signal(0);

  readonly roundNumber = computed(() => this.rounds().length + 1);
  readonly roundsDone = computed(() => this.rounds().length >= PAVILION_ROUNDS);
  readonly wild = computed<PavilionColor>(() => PAVILION_WILD[Math.min(PAVILION_ROUNDS, this.roundNumber()) - 1]);

  readonly total = computed(() => this.rounds().at(-1)?.totalAfter ?? PAVILION_START);
  readonly endGame = computed(() => pavilionEndGame(this.board()));
  readonly finalTotal = computed(
    () => this.total() + (this.finished() ? this.endGame().total - Math.max(0, this.corners()) : 0),
  );

  readonly preview = computed(
    () =>
      scorePavilionRound(this.board(), this.draft(), this.draftFirstPlayer(), this.draftDiscards(), this.total()).round,
  );

  /** número da rodada em que cada casa foi preenchida (selo no tabuleiro) */
  readonly cellRound = computed(() => {
    const map = new Map<string, number>();
    this.rounds().forEach((r, i) => r.placements.forEach((p) => map.set(`${p.star}-${p.index}`, i + 1)));
    return map;
  });

  /** pilares, estátuas e janelas: cercados agora, antes ou ainda abertos */
  readonly bonusState = computed(() => {
    const board = this.board();
    const draft = new Set(this.draft().map((p) => `${p.star}-${p.index}`));
    const map = new Map<string, BonusState>();
    for (const b of BONUS_SPACES) {
      const done = b.neighbors.every((n) => board[n.star][n.index]);
      const now = b.neighbors.every((n) => board[n.star][n.index] || draft.has(`${n.star}-${n.index}`));
      map.set(b.id, done ? 'done' : now ? 'new' : 'open');
    }
    return map;
  });
  readonly newBonuses = computed<BonusSpace[]>(() => BONUS_SPACES.filter((b) => this.bonusState().get(b.id) === 'new'));

  /** cores do centro já usadas (no tabuleiro e na rodada em andamento) */
  readonly usedCenterColors = computed(() => {
    const used = new Set(this.centerColors().filter(Boolean) as PavilionColor[]);
    for (const p of this.draft()) if (p.star === 'center' && p.color) used.add(p.color);
    return used;
  });

  readonly summary = computed(() => {
    let tiles = 0;
    let firstPlayer = 0;
    let discards = 0;
    for (const r of this.rounds()) {
      tiles += r.placementPoints;
      firstPlayer -= r.firstPlayerLoss;
      discards -= r.discards;
    }
    const end = this.finished() ? this.endGame().total : 0;
    const corners = this.finished() ? -Math.max(0, this.corners()) : 0;
    return { tiles, penalties: firstPlayer + discards, end, corners };
  });

  readonly hasProgress = computed(() => this.rounds().length > 0 || this.draft().length > 0);

  readonly audit = computed<AuditEntry[]>(() => {
    const t = this.i18n;
    const out: AuditEntry[] = [
      { id: 'start', group: t.t('pav.audit.start'), label: t.t('pav.audit.startLabel'), points: PAVILION_START, kind: 'bonus' },
    ];
    this.rounds().forEach((r, i) => {
      const group = t.tp('audit.round', { n: i + 1 });
      if (r.firstPlayerLoss) {
        out.push({
          id: `r${i}-fp`,
          group,
          label: t.tp('pav.audit.firstPlayer', { n: r.firstPlayerTiles }),
          points: -r.firstPlayerLoss,
          detail: r.firstPlayerLoss < r.firstPlayerTiles ? t.t('pav.audit.firstPlayerFloor') : undefined,
          kind: 'penalty',
        });
      }
      r.placements.forEach((p, k) => {
        out.push({
          id: `r${i}-p${k}`,
          group,
          label: t.tp('pav.audit.tile', { star: t.t(`pav.star.${p.star}`), v: p.index + 1 }),
          points: p.points,
          detail: p.points === 1 ? t.t('pav.audit.alone') : t.tp('pav.audit.linked', { n: p.points - 1 }),
          kind: 'placement',
        });
      });
      if (r.discards) {
        out.push({ id: `r${i}-d`, group, label: t.tp('pav.audit.discards', { n: r.discards }), points: -r.discards, kind: 'penalty' });
      }
    });
    if (this.finished()) {
      const eg = this.endGame();
      const g = t.t('audit.endgame');
      for (const s of eg.stars) {
        out.push({ id: `eg-${s}`, group: g, label: t.tp('pav.audit.star', { star: t.t(`pav.star.${s}`) }), points: PAVILION_STAR_BONUS[s], kind: 'bonus' });
      }
      for (const v of eg.numbers) {
        out.push({ id: `eg-n${v}`, group: g, label: t.tp('pav.audit.number', { v }), points: PAVILION_NUMBER_BONUS[v], kind: 'bonus' });
      }
      if (this.corners()) {
        out.push({ id: 'eg-corners', group: g, label: t.tp('pav.audit.corners', { n: this.corners() }), points: -this.corners(), kind: 'penalty' });
      }
    }
    return out;
  });

  constructor() {
    const snap = this.store.load<PavilionSnapshot>(KEY);
    if (snap?.board && snap.rounds) {
      this.board.set({ ...emptyBoard(), ...snap.board });
      this.centerColors.set(snap.centerColors ?? Array(6).fill(null));
      this.rounds.set(snap.rounds);
      this.corners.set(snap.corners || 0);
      this.finished.set(!!snap.finished);
    }
    effect(() => {
      const snap: PavilionSnapshot = {
        board: this.board(),
        centerColors: this.centerColors(),
        rounds: this.rounds(),
        corners: this.corners(),
        finished: this.finished(),
      };
      this.store.save(KEY, snap);
    });
  }

  isCommitted(star: PavilionStar, index: number): boolean {
    return this.board()[star][index];
  }

  draftOrder(star: PavilionStar, index: number): number {
    return this.draft().findIndex((p) => p.star === star && p.index === index);
  }

  /** cor exibida numa casa do centro (do tabuleiro ou da rodada em andamento) */
  centerColorAt(index: number): PavilionColor | null {
    return this.centerColors()[index] ?? this.draft().find((p) => p.star === 'center' && p.index === index)?.color ?? null;
  }

  canPlace(): boolean {
    return !this.finished() && !this.roundsDone();
  }

  /** Marca/desmarca uma casa na rodada atual. O centro precisa da cor escolhida. */
  toggle(star: PavilionStar, index: number, color?: PavilionColor): void {
    if (!this.canPlace() || this.isCommitted(star, index)) return;
    const i = this.draftOrder(star, index);
    if (i >= 0) {
      this.draft.update((d) => d.filter((_, k) => k !== i));
      return;
    }
    if (star === 'center' && (!color || this.usedCenterColors().has(color))) return;
    this.draft.update((d) => [...d, { star, index, color: star === 'center' ? color : undefined }]);
  }

  setFirstPlayer(n: number): void {
    if (this.canPlace()) this.draftFirstPlayer.set(Math.max(0, n));
  }
  setDiscards(n: number): void {
    if (this.canPlace()) this.draftDiscards.set(Math.max(0, n));
  }
  setCorners(n: number): void {
    if (!this.finished()) this.corners.set(Math.max(0, n));
  }

  commitRound(): void {
    if (!this.canPlace()) return;
    const { round, boardAfter } = scorePavilionRound(
      this.board(),
      this.draft(),
      this.draftFirstPlayer(),
      this.draftDiscards(),
      this.total(),
    );
    const colors = this.centerColors().slice();
    for (const p of this.draft()) if (p.star === 'center' && p.color) colors[p.index] = p.color;
    this.centerColors.set(colors);
    this.board.set(boardAfter);
    this.rounds.update((rs) => [...rs, round]);
    this.draft.set([]);
    this.draftFirstPlayer.set(0);
    this.draftDiscards.set(0);
  }

  finish(): void {
    if (this.finished()) return;
    if (this.draft().length || this.draftFirstPlayer() || this.draftDiscards()) this.commitRound();
    this.finished.set(true);
  }

  reset(): void {
    this.board.set(emptyBoard());
    this.centerColors.set(Array(6).fill(null));
    this.rounds.set([]);
    this.corners.set(0);
    this.draft.set([]);
    this.draftFirstPlayer.set(0);
    this.draftDiscards.set(0);
    this.finished.set(false);
    this.store.clear(KEY);
  }

  readonly colors = PAVILION_COLORS;
}
