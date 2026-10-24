import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import {
  SINTRA_BROKEN_WRAP,
  SINTRA_ROUNDS,
  SINTRA_WINDOW_VALUES,
  emptyWindows,
  leftoverPoints,
  ornamentBonus,
  scoreWindow,
  sideBBonus,
  windowCount,
  type SintraColor,
  type SintraSide,
  type SintraWindows,
} from '../../features/azul/variants/sintra-scoring';

/** uma faixa completada: bônus de cor + a peça que foi para a janela */
export interface SintraEvent {
  round: number;
  window: number;
  /** 0 = moldura de cima, 1 = de baixo */
  frame: 0 | 1;
  color: SintraColor;
  colorBonus: number;
  points: number;
  right: number[];
}

interface SintraSnapshot {
  side: SintraSide;
  windows: SintraWindows;
  events: SintraEvent[];
  round: number;
  wraps: number;
  leftover: number;
  brokenValue: number;
  /** peça no topo do indicador em cada rodada (a cor que dá bônus) */
  roundColors?: (SintraColor | null)[];
  finished: boolean;
}

const KEY = 'azul-sintra';

/**
 * Partida de Azul: Vitrais de Sintra. O jogador registra cada faixa completada
 * (janela + bônus de cor); o app soma a janela e as janelas à direita. Conta
 * nas funções puras de `sintra-scoring.ts`.
 */
@Injectable({ providedIn: 'root' })
export class AzulSintraMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly side = signal<SintraSide>('A');
  readonly windows = signal<SintraWindows>(emptyWindows());
  readonly events = signal<SintraEvent[]>([]);
  readonly round = signal(1);
  /** vezes que o marcador chegou ao fim da trilha de vidro quebrado (−18 cada) */
  readonly wraps = signal(0);
  /** peças que sobraram nas faixas no fim do jogo */
  readonly leftover = signal(0);
  /** valor ao lado do marcador na trilha de vidro quebrado, no fim (positivo; é subtraído) */
  readonly brokenValue = signal(0);
  readonly roundColors = signal<(SintraColor | null)[]>(Array(SINTRA_ROUNDS).fill(null));
  readonly finished = signal(false);
  /** cor da peça no topo do indicador nesta rodada */
  readonly roundColor = computed(() => this.roundColors()[this.round() - 1] ?? null);

  /** janela escolhida para a faixa que está sendo completada */
  readonly draftWindow = signal<number | null>(null);
  readonly draftColor = signal<SintraColor>('pink');
  readonly draftBonus = signal(0);

  readonly windowPoints = computed(() => this.events().reduce((s, e) => s + e.points, 0));
  readonly colorPoints = computed(() => this.events().reduce((s, e) => s + e.colorBonus, 0));
  readonly wrapPenalty = computed(() => -SINTRA_BROKEN_WRAP * this.wraps());

  readonly ornaments = computed(() => ornamentBonus(this.windows()));
  readonly sideB = computed(() => sideBBonus(this.windows()));
  readonly sideBonus = computed(() => (this.side() === 'A' ? this.ornaments().total : this.sideB().total));

  /** fim de jogo: sobras + vidro quebrado + bônus do lado (já calculável antes de terminar) */
  readonly endGame = computed(() => {
    const left = leftoverPoints(this.leftover());
    const broken = -Math.max(0, this.brokenValue());
    return { left, broken, side: this.sideBonus(), total: left + broken + this.sideBonus() };
  });

  readonly total = computed(() => this.windowPoints() + this.colorPoints() + this.wrapPenalty());
  readonly finalTotal = computed(() => this.total() + (this.finished() ? this.endGame().total : 0));

  /** prévia da faixa em andamento */
  readonly draftPreview = computed(() => {
    const w = this.draftWindow();
    if (w == null) return null;
    const windows = this.windows().map((x) => x.slice());
    const frame = windowCount(windows, w) as 0 | 1;
    windows[w][frame] = this.draftColor();
    const { points, right } = scoreWindow(windows, w);
    return { window: w, frame, points, right, colorBonus: this.draftBonus(), total: points + this.draftBonus() };
  });

  readonly hasProgress = computed(() => this.events().length > 0 || this.wraps() > 0);

  readonly audit = computed<AuditEntry[]>(() => {
    const t = this.i18n;
    const out: AuditEntry[] = [];
    this.events().forEach((e, i) => {
      const group = t.tp('audit.round', { n: e.round });
      const rightVals = e.right.map((j) => SINTRA_WINDOW_VALUES[j]);
      out.push({
        id: `e${i}-win`,
        group,
        label: t.tp(e.frame === 0 ? 'sintra.audit.windowTop' : 'sintra.audit.windowBottom', { n: e.window + 1 }),
        points: e.points,
        detail: rightVals.length
          ? t.tp('sintra.audit.windowDetail', { v: SINTRA_WINDOW_VALUES[e.window], right: rightVals.join(' + ') })
          : t.tp('sintra.audit.windowAlone', { v: SINTRA_WINDOW_VALUES[e.window] }),
        kind: 'placement',
      });
      if (e.colorBonus) {
        out.push({
          id: `e${i}-color`,
          group,
          label: t.t('sintra.audit.colorBonus'),
          points: e.colorBonus,
          detail: t.tp('sintra.audit.colorBonusDetail', { n: e.colorBonus }),
          kind: 'bonus',
        });
      }
    });
    if (this.wraps()) {
      out.push({
        id: 'wraps',
        group: t.t('sintra.broken.title'),
        label: t.tp('sintra.audit.wraps', { n: this.wraps() }),
        points: this.wrapPenalty(),
        kind: 'penalty',
      });
    }
    if (this.finished()) {
      const eg = this.endGame();
      const g = t.t('audit.endgame');
      if (eg.left) out.push({ id: 'left', group: g, label: t.tp('sintra.audit.leftover', { n: this.leftover() }), points: eg.left, kind: 'bonus' });
      if (eg.broken) out.push({ id: 'broken', group: g, label: t.t('sintra.audit.broken'), points: eg.broken, kind: 'penalty' });
      if (this.side() === 'A') {
        this.ornaments().filled.forEach((f, o) => {
          const p = this.ornaments().points[o];
          if (p) out.push({ id: `orn${o}`, group: g, label: t.tp('sintra.audit.ornament', { n: o + 1, f }), points: p, kind: 'bonus' });
        });
      } else if (this.sideB().total) {
        const b = this.sideB();
        out.push({
          id: 'sideB',
          group: g,
          label: t.t('sintra.audit.sideB'),
          points: b.total,
          detail: t.tp('sintra.audit.sideBDetail', { w: b.completed, n: b.count, color: t.t(`sintra.color.${b.color}`) }),
          kind: 'bonus',
        });
      }
    }
    return out;
  });

  constructor() {
    const snap = this.store.load<SintraSnapshot>(KEY);
    if (snap?.windows?.length === SINTRA_WINDOW_VALUES.length) {
      this.side.set(snap.side === 'B' ? 'B' : 'A');
      this.windows.set(snap.windows);
      this.events.set(snap.events ?? []);
      this.round.set(snap.round || 1);
      this.wraps.set(snap.wraps || 0);
      this.leftover.set(snap.leftover || 0);
      this.brokenValue.set(snap.brokenValue || 0);
      if (snap.roundColors?.length === SINTRA_ROUNDS) this.roundColors.set(snap.roundColors);
      this.finished.set(!!snap.finished);
    }
    effect(() => {
      const snap: SintraSnapshot = {
        side: this.side(),
        windows: this.windows(),
        events: this.events(),
        round: this.round(),
        wraps: this.wraps(),
        leftover: this.leftover(),
        brokenValue: this.brokenValue(),
        roundColors: this.roundColors(),
        finished: this.finished(),
      };
      this.store.save(KEY, snap);
    });
  }

  /** o lado do palácio só muda antes da primeira janela */
  setSide(side: SintraSide): void {
    if (!this.finished() && this.events().length === 0) this.side.set(side);
  }

  selectWindow(i: number): void {
    if (this.finished() || windowCount(this.windows(), i) >= 2) return;
    this.draftWindow.set(this.draftWindow() === i ? null : i);
  }

  setDraftColor(c: SintraColor): void {
    this.draftColor.set(c);
  }

  setRoundColor(c: SintraColor): void {
    if (this.finished()) return;
    this.roundColors.update((rc) => rc.map((x, i) => (i === this.round() - 1 ? c : x)));
  }

  setDraftBonus(n: number): void {
    this.draftBonus.set(Math.max(0, Math.min(5, n)));
  }

  /** Confirma a faixa completada: bônus de cor + peça na janela. */
  commitWindow(): void {
    const p = this.draftPreview();
    if (!p || this.finished()) return;
    this.windows.update((ws) => ws.map((w, i) => (i === p.window ? w.map((x, f) => (f === p.frame ? this.draftColor() : x)) : w)));
    this.events.update((es) => [
      ...es,
      {
        round: this.round(),
        window: p.window,
        frame: p.frame,
        color: this.draftColor(),
        colorBonus: p.colorBonus,
        points: p.points,
        right: p.right,
      },
    ]);
    this.draftWindow.set(null);
    this.draftBonus.set(0);
  }

  /** Desfaz a última janela registrada. */
  undo(): void {
    const last = this.events().at(-1);
    if (!last || this.finished()) return;
    this.windows.update((ws) => ws.map((w, i) => (i === last.window ? w.map((x, f) => (f === last.frame ? null : x)) : w)));
    this.events.update((es) => es.slice(0, -1));
  }

  nextRound(): void {
    if (!this.finished()) this.round.update((r) => Math.min(SINTRA_ROUNDS, r + 1));
  }

  setWraps(n: number): void {
    if (!this.finished()) this.wraps.set(Math.max(0, n));
  }
  setLeftover(n: number): void {
    if (!this.finished()) this.leftover.set(Math.max(0, n));
  }
  setBrokenValue(n: number): void {
    if (!this.finished()) this.brokenValue.set(Math.max(0, Math.min(SINTRA_BROKEN_WRAP - 1, n)));
  }

  finish(): void {
    this.draftWindow.set(null);
    this.finished.set(true);
  }

  reset(): void {
    this.side.set('A');
    this.windows.set(emptyWindows());
    this.events.set([]);
    this.round.set(1);
    this.wraps.set(0);
    this.leftover.set(0);
    this.brokenValue.set(0);
    this.roundColors.set(Array(SINTRA_ROUNDS).fill(null));
    this.draftWindow.set(null);
    this.draftBonus.set(0);
    this.finished.set(false);
    this.store.clear(KEY);
  }
}
