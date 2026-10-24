import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import {
  GARDEN_COLORS,
  GARDEN_EXPANSION_COST,
  GARDEN_ROUNDS,
  GARDEN_START,
  emptyGardenRound,
  scoreGardenFinal,
  scoreGardenRound,
  type GardenItem,
  type GardenRound,
  type GardenRoundResult,
} from '../../features/azul/variants/garden-scoring';
import {
  ELEMENTS,
  countMatching,
  gardenGroups,
  isTile,
  pavilionCount,
  type GardenCell,
  type GardenCells,
  type GardenGroupScore,
} from '../../features/azul/variants/garden-grid';

interface GardenSnapshot {
  cells: GardenCells;
  rounds: GardenRoundResult[];
  jokers: number;
  storageValue: number;
  finished: boolean;
}

/** item e pontos da roda escolhidos em cada rodada da última partida */
type WheelMemory = { item: GardenItem | null; value: number }[][];

const KEY = 'azul-garden';
const WHEEL_KEY = 'azul-garden-wheel';

/**
 * Partida de Azul: Jardim da Rainha. O jogador monta no app o mesmo jardim da
 * mesa (cor + padrão de cada hexágono e os pavilhões); a cada rodada escolhe os
 * 3 itens da roda e os pontos dela, e o app conta os hexágonos que combinam.
 * No fim, os grupos saem do próprio jardim.
 */
@Injectable({ providedIn: 'root' })
export class AzulGardenMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly cells = signal<GardenCells>({});
  readonly rounds = signal<GardenRoundResult[]>([]);
  readonly draft = signal<GardenRound>(emptyGardenRound());
  readonly jokers = signal(0);
  readonly storageValue = signal(0);
  readonly finished = signal(false);
  /** a roda gira sempre igual: lembra os itens da última partida para já vir preenchida */
  private readonly wheelMemory = signal<WheelMemory>([]);

  readonly roundNumber = computed(() => this.rounds().length + 1);
  readonly roundsDone = computed(() => this.rounds().length >= GARDEN_ROUNDS);
  readonly total = computed(() => this.rounds().at(-1)?.totalAfter ?? GARDEN_START);

  readonly tileCount = computed(() => Object.values(this.cells()).filter(isTile).length);
  readonly pavilions = computed(() => pavilionCount(this.cells()));
  /** a rodada em andamento com as contagens tiradas do jardim */
  readonly liveRound = computed<GardenRound>(() => {
    const d = this.draft();
    const cells = this.cells();
    return {
      ...d,
      wheel: d.wheel.map((w) => ({ ...w, count: w.item ? countMatching(cells, w.item) : 0 })),
      pavilions: pavilionCount(cells),
    };
  });
  readonly preview = computed(() => scoreGardenRound(this.liveRound(), this.total()));

  readonly groups = computed<GardenGroupScore[]>(() => gardenGroups(this.cells()));
  readonly groupTotal = computed(() => this.groups().reduce((s, g) => s + g.points, 0));
  readonly finalScore = computed(() =>
    scoreGardenFinal({ jokers: this.jokers(), storageValue: this.storageValue(), groupPoints: this.groupTotal() }, this.total()),
  );
  readonly finalTotal = computed(() => (this.finished() ? this.finalScore().total : this.total()));

  readonly summary = computed(() => {
    let wheel = 0;
    let costs = 0;
    let floor = 0;
    for (const r of this.rounds()) {
      wheel += r.wheelPoints;
      costs -= r.costs;
      floor += r.totalAfter - (r.totalBefore - r.costs + r.wheelPoints);
    }
    const f = this.finalScore();
    const end = this.finished() ? f.total - this.total() : 0;
    return { wheel, costs: costs + floor, end };
  });

  readonly hasProgress = computed(() => this.rounds().length > 0 || this.tileCount() > 0);

  readonly audit = computed<AuditEntry[]>(() => {
    const t = this.i18n;
    const out: AuditEntry[] = [
      { id: 'start', group: t.t('pav.audit.start'), label: t.t('garden.audit.start'), points: GARDEN_START, kind: 'bonus' },
    ];
    this.rounds().forEach((r, i) => {
      const group = t.tp('audit.round', { n: i + 1 });
      r.wheel.forEach((w, k) => {
        if (w.count && w.value) {
          out.push({
            id: `r${i}-w${k}`,
            group,
            label: w.item ? t.tp('garden.audit.wheelItem', { item: this.itemName(w.item) }) : t.tp('garden.audit.wheel', { k: k + 1 }),
            points: w.count * w.value,
            detail: `${w.count} × ${w.value}`,
            kind: 'bonus',
          });
        }
      });
      if (r.pavilions) out.push({ id: `r${i}-pav`, group, label: t.tp('garden.audit.pavilions', { n: r.pavilions }), points: r.pavilions, kind: 'bonus' });
      if (r.expansionsBought) {
        out.push({ id: `r${i}-exp`, group, label: t.tp('garden.audit.expansions', { n: r.expansionsBought }), points: -r.expansionsBought * GARDEN_EXPANSION_COST, kind: 'penalty' });
      }
      if (r.firstToPass) out.push({ id: `r${i}-pass`, group, label: t.t('garden.audit.firstPass'), points: -1, kind: 'penalty' });
      if (r.discardValue) out.push({ id: `r${i}-disc`, group, label: t.t('garden.audit.discards'), points: -r.discardValue, kind: 'penalty' });
      const floor = r.totalAfter - (r.totalBefore - r.costs + r.wheelPoints);
      if (floor > 0) out.push({ id: `r${i}-floor`, group, label: t.t('garden.audit.floor'), points: floor, kind: 'bonus' });
    });
    if (this.finished()) {
      const g = t.t('audit.endgame');
      if (this.jokers()) out.push({ id: 'jk', group: g, label: t.tp('garden.audit.jokers', { n: this.jokers() }), points: this.jokers(), kind: 'bonus' });
      if (this.storageValue()) out.push({ id: 'st', group: g, label: t.t('garden.audit.storage'), points: -this.storageValue(), kind: 'penalty' });
      this.groups().forEach((grp, k) => {
        out.push({
          id: `g${k}`,
          group: g,
          label: this.groupLabel(grp),
          points: grp.points,
          detail: grp.bonus ? t.tp('garden.audit.groupBonus', { base: grp.base, bonus: grp.bonus }) : undefined,
          kind: 'bonus',
        });
      });
    }
    return out;
  });

  constructor() {
    const snap = this.store.load<GardenSnapshot>(KEY);
    if (snap?.rounds) {
      this.cells.set(snap.cells ?? {});
      this.rounds.set(snap.rounds);
      this.jokers.set(snap.jokers || 0);
      this.storageValue.set(snap.storageValue || 0);
      this.finished.set(!!snap.finished);
    }
    this.wheelMemory.set(this.store.load<WheelMemory>(WHEEL_KEY) ?? []);
    this.draft.set(this.freshDraft());
    effect(() => {
      const snap: GardenSnapshot = {
        cells: this.cells(),
        rounds: this.rounds(),
        jokers: this.jokers(),
        storageValue: this.storageValue(),
        finished: this.finished(),
      };
      this.store.save(KEY, snap);
    });
  }

  itemName(item: GardenItem): string {
    const t = this.i18n;
    return (GARDEN_COLORS as readonly string[]).includes(item)
      ? t.tp('garden.item.color', { color: t.t(`garden.color.${item}`) })
      : t.t(`garden.pattern.${item}`);
  }

  groupLabel(g: GardenGroupScore): string {
    const t = this.i18n;
    return g.kind === 'color'
      ? t.tp('garden.group.colorLabel', { color: t.t(`garden.color.${g.item}`), n: g.keys.length })
      : t.tp('garden.group.patternLabel', { pattern: t.t(`garden.pattern.${g.item}`), n: g.keys.length });
  }

  /** rodada nova: a roda vem como na mesma rodada da partida anterior */
  private freshDraft(): GardenRound {
    const r = emptyGardenRound();
    const mem = this.wheelMemory()[this.rounds().length];
    if (mem) r.wheel = r.wheel.map((w, k) => ({ ...w, item: mem[k]?.item ?? null, value: mem[k]?.value ?? 0 }));
    return r;
  }

  /** O jardim pode ser corrigido a qualquer momento antes do fim. A fonte e os enfeites são fixos. */
  setCell(key: string, cell: GardenCell | null): void {
    if (this.finished() || ELEMENTS[key]) return;
    this.cells.update((cs) => {
      const next = { ...cs };
      if (cell) next[key] = cell;
      else delete next[key];
      return next;
    });
  }

  patchDraft(patch: Partial<GardenRound>): void {
    if (!this.finished() && !this.roundsDone()) this.draft.update((d) => ({ ...d, ...patch }));
  }

  setWheel(slot: number, patch: { item?: GardenItem | null; value?: number }): void {
    const wheel = this.draft().wheel.map((w, i) => (i === slot ? { ...w, ...patch, value: Math.max(0, patch.value ?? w.value) } : w));
    this.patchDraft({ wheel });
  }

  commitRound(): void {
    if (this.finished() || this.roundsDone()) return;
    const live = this.liveRound();
    const idx = this.rounds().length;
    const mem = this.wheelMemory().slice();
    mem[idx] = live.wheel.map((w) => ({ item: w.item ?? null, value: w.value }));
    this.wheelMemory.set(mem);
    this.store.save(WHEEL_KEY, mem);
    this.rounds.update((rs) => [...rs, scoreGardenRound(live, this.total())]);
    this.draft.set(this.freshDraft());
  }

  undoRound(): void {
    if (this.finished() || !this.rounds().length) return;
    const { wheel, pavilions, expansionsBought, firstToPass, discardValue } = this.rounds().at(-1)!;
    this.draft.set({ wheel: wheel.map((w) => ({ ...w })), pavilions, expansionsBought, firstToPass, discardValue });
    this.rounds.update((rs) => rs.slice(0, -1));
  }

  setJokers(n: number): void {
    if (!this.finished()) this.jokers.set(Math.max(0, n));
  }
  setStorage(n: number): void {
    if (!this.finished()) this.storageValue.set(Math.max(0, n));
  }

  finish(): void {
    if (this.finished()) return;
    this.finished.set(true);
  }

  reset(): void {
    this.cells.set({});
    this.rounds.set([]);
    this.jokers.set(0);
    this.storageValue.set(0);
    this.finished.set(false);
    this.draft.set(this.freshDraft());
    this.store.clear(KEY);
  }
}
