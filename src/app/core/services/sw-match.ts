import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import { findSwVariant, type SwVariant, type SwVariantId } from '../../features/seven-wonders/scoring/sw-variants';
import {
  ARCH_CAT_VP,
  ARCH_MILITARY_VP,
  BABEL_TOWER_VP,
  DUEL_TEMPLE_VP,
  MILITARY_VALUES,
  NAVAL_VALUES,
  emptyArchitects,
  emptyBase,
  emptyDuel,
  militaryVictories,
  scoreArchitects,
  scoreBase,
  scoreDuel,
  type SwArchitectsState,
  type SwBaseState,
  type SwDuelState,
  type SwResult,
} from '../../features/seven-wonders/scoring/sw-scoring';

interface SwSnapshot {
  variantId: SwVariantId;
  base: SwBaseState;
  duel: SwDuelState;
  architects: SwArchitectsState;
  finished: boolean;
}

const KEY = 'sw';

/**
 * Estado da partida de 7 Wonders. A edição é escolhida primeiro; o formulário
 * mostra só as categorias dela e das expansões ligadas. Toda a conta passa
 * pelas funções puras de `sw-scoring.ts`.
 */
@Injectable({ providedIn: 'root' })
export class SevenWondersMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly variant = signal<SwVariant | null>(null);
  readonly base = signal<SwBaseState>(emptyBase());
  readonly duel = signal<SwDuelState>(emptyDuel());
  readonly architects = signal<SwArchitectsState>(emptyArchitects());
  readonly finished = signal(false);

  readonly result = computed<SwResult>(() => {
    switch (this.variant()?.id) {
      case 'duel':
        return scoreDuel(this.duel());
      case 'architects':
        return scoreArchitects(this.architects());
      default:
        return scoreBase(this.base());
    }
  });

  readonly total = computed(() => this.result().total);

  /** pontos de uma categoria (0 se ela não estiver ativa) */
  points(key: string): number {
    return this.result().parts.find((p) => p.key === key)?.points ?? 0;
  }

  readonly hasProgress = computed(() => this.result().parts.some((p) => p.points !== 0));

  /** Desfecho do Duel (vitórias imediatas por supremacia). */
  readonly outcomeKey = computed(() => {
    if (this.variant()?.id !== 'duel') return undefined;
    const v = this.duel().victory;
    return v === 'civilian' ? undefined : `sw.victory.${v}`;
  });

  readonly audit = computed<AuditEntry[]>(() => {
    switch (this.variant()?.id) {
      case 'duel':
        return this.auditDuel();
      case 'architects':
        return this.auditArchitects();
      default:
        return this.auditBase();
    }
  });

  constructor() {
    const snap = this.store.load<SwSnapshot>(KEY);
    if (snap) {
      const v = findSwVariant(snap.variantId);
      if (v) {
        this.variant.set(v);
        // mescla com o vazio para tolerar campos novos em versões futuras
        this.base.set({ ...emptyBase(), ...snap.base, expansions: { ...emptyBase().expansions, ...snap.base?.expansions } });
        this.duel.set({ ...emptyDuel(), ...snap.duel, expansions: { ...emptyDuel().expansions, ...snap.duel?.expansions } });
        this.architects.set({ ...emptyArchitects(), ...snap.architects });
        this.finished.set(!!snap.finished);
      }
    }
    effect(() => {
      const v = this.variant();
      if (!v) return;
      const snap: SwSnapshot = {
        variantId: v.id,
        base: this.base(),
        duel: this.duel(),
        architects: this.architects(),
        finished: this.finished(),
      };
      this.store.save(KEY, snap);
    });
  }

  /** Seleciona a versão; trocar de versão começa do zero. */
  selectVariant(id: string): boolean {
    const v = findSwVariant(id);
    if (!v) return false;
    if (this.variant()?.id !== v.id) this.clearState();
    this.variant.set(v);
    return true;
  }

  patchBase(patch: Partial<SwBaseState>): void {
    if (!this.finished()) this.base.update((s) => ({ ...s, ...patch }));
  }
  patchDuel(patch: Partial<SwDuelState>): void {
    if (!this.finished()) this.duel.update((s) => ({ ...s, ...patch }));
  }
  patchArchitects(patch: Partial<SwArchitectsState>): void {
    if (!this.finished()) this.architects.update((s) => ({ ...s, ...patch }));
  }

  toggleExpansion(id: string): void {
    if (this.finished()) return;
    if (this.variant()?.id === 'duel') {
      const ex = this.duel().expansions as Record<string, boolean>;
      this.duel.update((s) => ({ ...s, expansions: { ...s.expansions, [id]: !ex[id] } }));
    } else {
      const ex = this.base().expansions as Record<string, boolean>;
      this.base.update((s) => ({ ...s, expansions: { ...s.expansions, [id]: !ex[id] } }));
    }
  }

  expansionOn(id: string): boolean {
    const ex = (this.variant()?.id === 'duel' ? this.duel().expansions : this.base().expansions) as Record<string, boolean>;
    return !!ex[id];
  }

  finish(): void {
    this.finished.set(true);
  }

  reset(): void {
    this.finished.set(false);
    this.clearState();
  }

  private clearState(): void {
    this.base.set(emptyBase());
    this.duel.set(emptyDuel());
    this.architects.set(emptyArchitects());
    this.finished.set(false);
    this.store.clear(KEY);
  }

  /* ---------------- auditoria ---------------- */

  private entry(group: string, id: string, label: string, points: number, detail?: string): AuditEntry {
    return { id, group, label, points, detail, kind: points < 0 ? 'penalty' : 'bonus' };
  }

  private tokens<K extends string>(
    group: string,
    prefix: string,
    counts: Record<K, number>,
    values: Record<K, number>,
  ): AuditEntry[] {
    const t = this.i18n;
    return (Object.keys(values) as K[])
      .filter((k) => (counts[k] ?? 0) > 0)
      .map((k) => {
        const v = values[k];
        const sign = v > 0 ? `+${v}` : `−${Math.abs(v)}`;
        return this.entry(group, `${prefix}-${k}`, t.tp('sw.audit.tokens', { n: counts[k], v: sign }), counts[k] * v);
      });
  }

  private simple(key: string, value: number): AuditEntry[] {
    if (!value) return [];
    const label = this.i18n.t(key);
    return [this.entry(label, key, label, value)];
  }

  private auditBase(): AuditEntry[] {
    const t = this.i18n;
    const s = this.base();
    const ex = s.expansions;
    const r = this.result();
    const out: AuditEntry[] = [];

    const mil = t.t('sw.cat.military');
    out.push(...this.tokens(mil, 'mil', s.military, MILITARY_VALUES));

    const tre = t.t('sw.cat.treasury');
    const coinVp = Math.floor(Math.max(0, s.coins) / 3);
    if (s.coins > 0) out.push(this.entry(tre, 'coins', t.tp('sw.audit.coins', { n: s.coins }), coinVp));
    if (ex.cities && s.debt > 0) out.push(this.entry(tre, 'debt', t.tp('sw.audit.debt', { n: s.debt }), -s.debt));

    out.push(...this.simple('sw.cat.wonder', s.wonder));
    out.push(...this.simple('sw.cat.civilian', s.civilian));
    out.push(...this.simple('sw.cat.commercial', s.commercial));
    out.push(...this.simple('sw.cat.guilds', s.guilds));

    const sci = r.science;
    if (sci && sci.points > 0) {
      const g = t.t('sw.cat.science');
      const sym: Array<['tablet' | 'compass' | 'gear', number]> = [
        ['tablet', sci.tablet],
        ['compass', sci.compass],
        ['gear', sci.gear],
      ];
      for (const [k, count] of sym) {
        if (count > 0) {
          out.push(this.entry(g, `sci-${k}`, t.tp('sw.audit.symbol', { sym: t.t(`sw.sym.${k}`), n: count }), count * count, `${count}²`));
        }
      }
      if (sci.sets > 0) {
        out.push(this.entry(g, 'sci-sets', t.tp('sw.audit.sets', { n: sci.sets, v: sci.setValue }), sci.sets * sci.setValue));
      }
      if (s.science.wild > 0) {
        const parts = (['tablet', 'compass', 'gear'] as const)
          .filter((k) => sci.wildTo[k] > 0)
          .map((k) => `${sci.wildTo[k]}× ${t.t(`sw.sym.${k}`)}`)
          .join(', ');
        out.push(this.entry(g, 'sci-wild', t.tp('sw.audit.wild', { n: s.science.wild }), 0, parts));
      }
    }

    if (ex.leaders) {
      const g = t.t('sw.cat.leaders');
      if (s.leaders) out.push(this.entry(g, 'leaders', t.t('sw.audit.leaderCards'), s.leaders));
      if (s.alexander) {
        const v = militaryVictories(s.military);
        out.push(this.entry(g, 'alexander', t.tp('sw.audit.alexander', { n: v }), v));
      }
      if (s.midas) out.push(this.entry(g, 'midas', t.tp('sw.audit.midas', { n: s.coins }), coinVp));
    }
    if (ex.cities) out.push(...this.simple('sw.cat.cities', s.cities));
    if (ex.armada) {
      out.push(...this.tokens(t.t('sw.cat.naval'), 'nav', s.naval, NAVAL_VALUES));
      out.push(...this.simple('sw.cat.islands', s.islands));
      out.push(...this.simple('sw.cat.fleet', s.fleet));
    }
    if (ex.babel) {
      const tiles = Math.max(0, Math.min(3, s.babelTiles));
      if (tiles) {
        const g = t.t('sw.cat.babelTower');
        out.push(this.entry(g, 'babel-tower', t.tp('sw.audit.babelTiles', { n: tiles }), BABEL_TOWER_VP[tiles]));
      }
      out.push(...this.simple('sw.cat.babelProjects', s.babelProjects));
    }
    if (ex.edifice) out.push(...this.simple('sw.cat.edifice', s.edifice));
    return out;
  }

  private auditDuel(): AuditEntry[] {
    const t = this.i18n;
    const s = this.duel();
    const out: AuditEntry[] = [];
    out.push(...this.simple('sw.cat.civilian', s.civilian));
    out.push(...this.simple('sw.cat.scienceCards', s.science));
    out.push(...this.simple('sw.cat.commercial', s.commercial));
    out.push(...this.simple('sw.cat.guilds', s.guilds));
    out.push(...this.simple('sw.cat.wonder', s.wonders));

    const g = t.t('sw.cat.progress');
    if (s.agriculture) out.push(this.entry(g, 'agri', t.t('sw.duel.agriculture'), 4));
    if (s.philosophy) out.push(this.entry(g, 'philo', t.t('sw.duel.philosophy'), 7));
    if (s.mathematics) {
      const c = Math.max(1, s.progressCount);
      out.push(this.entry(g, 'math', t.tp('sw.audit.mathematics', { n: c }), 3 * c));
    }
    if (s.progressOther) out.push(this.entry(g, 'progress-other', t.t('sw.audit.otherProgress'), s.progressOther));

    if (s.coins > 0) {
      out.push(this.entry(t.t('sw.cat.treasury'), 'coins', t.tp('sw.audit.coins', { n: s.coins }), Math.floor(s.coins / 3)));
    }
    if (s.militaryZone) {
      out.push(this.entry(t.t('sw.cat.military'), 'zone', t.tp('sw.audit.zone', { n: s.militaryZone }), s.militaryZone));
    }
    if (s.expansions.pantheon) {
      const temples = Math.max(0, Math.min(3, s.temples));
      if (temples) {
        out.push(this.entry(t.t('sw.cat.temples'), 'temples', t.tp('sw.audit.temples', { n: temples }), DUEL_TEMPLE_VP[temples]));
      }
      out.push(...this.simple('sw.cat.divinities', s.divinities));
    }
    if (s.expansions.agora) {
      out.push(...this.simple('sw.cat.senate', s.senate));
      out.push(...this.simple('sw.cat.conspiracies', s.conspiracies));
    }
    return out;
  }

  private auditArchitects(): AuditEntry[] {
    const t = this.i18n;
    const s = this.architects();
    const out: AuditEntry[] = [];
    out.push(...this.simple('sw.cat.wonder', s.wonder));
    out.push(...this.simple('sw.cat.civilian', s.blue));
    if (s.militaryTokens > 0) {
      out.push(
        this.entry(t.t('sw.cat.military'), 'arch-mil', t.tp('sw.audit.archMilitary', { n: s.militaryTokens }), ARCH_MILITARY_VP * s.militaryTokens),
      );
    }
    if (s.cat) out.push(this.entry(t.t('sw.cat.cat'), 'cat', t.t('sw.arch.catPawn'), ARCH_CAT_VP));

    const g = t.t('sw.cat.progress');
    if (s.strategy) out.push(this.entry(g, 'strategy', t.tp('sw.audit.strategy', { n: s.militaryTokens }), s.militaryTokens));
    if (s.education) {
      const c = Math.max(1, s.progressCount);
      out.push(this.entry(g, 'education', t.tp('sw.audit.education', { n: c }), 2 * c));
    }
    if (s.decor) out.push(this.entry(g, 'decor', t.t('sw.arch.decor'), s.wonderComplete ? 6 : 4));
    if (s.politics) out.push(this.entry(g, 'politics', t.tp('sw.audit.politics', { n: s.catIcons }), s.catIcons));
    if (s.progressOther) out.push(this.entry(g, 'arch-other', t.t('sw.audit.otherProgress'), s.progressOther));
    return out;
  }
}
