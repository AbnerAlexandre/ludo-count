import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { MatchHistory } from './match-history';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import { GroupTable } from '../group/group-table';
import { rankStandings } from '../group/ranking';
import type { DraftPlayer, PlayerLimits, Standing } from '../group/group-models';
import type { BreakdownRow } from './ttr-match';
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

/** planilha de um jogador (só a parte da versão escolhida importa) */
export interface SwSheet {
  base: SwBaseState;
  duel: SwDuelState;
  architects: SwArchitectsState;
}

interface SwSnapshot extends SwSheet {
  variantId: SwVariantId;
  finished: boolean;
}

type BaseExp = SwBaseState['expansions'];
type DuelExp = SwDuelState['expansions'];

const KEY = 'sw';

const emptySheet = (): SwSheet => ({ base: emptyBase(), duel: emptyDuel(), architects: emptyArchitects() });
const EMPTY = emptySheet();

/** mescla com o vazio para tolerar campos novos em versões futuras */
function normalizeSheet(raw: Partial<SwSheet> | undefined): SwSheet {
  return {
    base: { ...emptyBase(), ...raw?.base, expansions: { ...emptyBase().expansions, ...raw?.base?.expansions } },
    duel: { ...emptyDuel(), ...raw?.duel, expansions: { ...emptyDuel().expansions, ...raw?.duel?.expansions } },
    architects: { ...emptyArchitects(), ...raw?.architects },
  };
}

function scoreSheet(variant: SwVariantId | undefined, s: SwSheet): SwResult {
  switch (variant) {
    case 'duel':
      return scoreDuel(s.duel);
    case 'architects':
      return scoreArchitects(s.architects);
    default:
      return scoreBase(s.base);
  }
}

/**
 * Quantos jogadores a regra permite. Base: 3–7 (2 na variante oficial da
 * 1ª edição); Cities leva a 8, mas o Armada só tem 7 estaleiros.
 */
export function swPlayerLimits(variant: SwVariantId, ex?: Partial<BaseExp>): PlayerLimits {
  switch (variant) {
    case 'duel':
      return { min: 2, max: 2 };
    case 'architects':
      return { min: 2, max: 7 };
    default:
      return { min: 2, max: ex?.cities && !ex?.armada ? 8 : 7 };
  }
}

/** aplica as expansões da mesa a uma planilha nova */
const withExpansions = (baseExp: BaseExp, duelExp: DuelExp) => (s: SwSheet): SwSheet => ({
  ...s,
  base: { ...s.base, expansions: { ...baseExp } },
  duel: { ...s.duel, expansions: { ...duelExp } },
});

/**
 * Estado da partida de 7 Wonders. A edição é escolhida primeiro; o formulário
 * mostra só as categorias dela e das expansões ligadas. Toda a conta passa
 * pelas funções puras de `sw-scoring.ts`.
 *
 * Dois modos usam a mesma tela: individual (uma planilha) e em grupo (uma por
 * jogador). As leituras abaixo seguem a planilha em edição — no grupo, a do
 * jogador da vez. No grupo, as expansões valem para a mesa toda.
 */
@Injectable({ providedIn: 'root' })
export class SevenWondersMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly variant = signal<SwVariant | null>(null);
  private readonly solo = signal<SwSheet>(emptySheet());
  private readonly soloFinished = signal(false);

  readonly table = new GroupTable<SwSheet>({
    store: this.store,
    history: inject(MatchHistory),
    game: 'sw',
    empty: emptySheet,
    normalize: normalizeSheet,
  });

  readonly isGroup = this.table.isGroup;
  readonly groupPlaying = computed(() => this.isGroup() && !!this.table.match());

  private readonly groupBaseExp = computed<BaseExp>(() => ({
    ...EMPTY.base.expansions,
    ...(this.table.meta()['baseExp'] as Partial<BaseExp> | undefined),
  }));
  private readonly groupDuelExp = computed<DuelExp>(() => ({
    ...EMPTY.duel.expansions,
    ...(this.table.meta()['duelExp'] as Partial<DuelExp> | undefined),
  }));

  /** antes de a partida em grupo começar, a planilha vazia já mostra as expansões da mesa */
  private readonly setupSheet = computed<SwSheet>(() => withExpansions(this.groupBaseExp(), this.groupDuelExp())(EMPTY));

  private readonly sheet = computed<SwSheet>(() =>
    this.isGroup() ? (this.table.activeSheet() ?? this.setupSheet()) : this.solo(),
  );

  readonly base = computed(() => this.sheet().base);
  readonly duel = computed(() => this.sheet().duel);
  readonly architects = computed(() => this.sheet().architects);
  readonly finished = computed(() => (this.isGroup() ? this.table.finished() : this.soloFinished()));

  readonly result = computed<SwResult>(() => scoreSheet(this.variant()?.id, this.sheet()));

  readonly total = computed(() => this.result().total);

  /** pontos de uma categoria (0 se ela não estiver ativa) */
  points(key: string): number {
    return this.result().parts.find((p) => p.key === key)?.points ?? 0;
  }

  readonly hasProgress = computed(() => this.result().parts.some((p) => p.points !== 0));

  /** versão com partida em andamento (individual ou em grupo), para oferecer "continuar" */
  readonly resume = computed<{ variantId: SwVariantId; group: boolean } | null>(() => {
    const v = this.variant();
    if (!v) return null;
    if (this.isGroup()) {
      const m = this.table.match();
      return m && !m.finished ? { variantId: m.variantId as SwVariantId, group: true } : null;
    }
    const any = scoreSheet(v.id, this.solo()).parts.some((p) => p.points !== 0);
    return any && !this.soloFinished() ? { variantId: v.id, group: false } : null;
  });

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

  /* ---------------- mesa em grupo ---------------- */

  readonly limits = computed<PlayerLimits>(() =>
    swPlayerLimits(this.variant()?.id ?? 'base', this.isGroup() ? this.groupBaseExp() : this.solo().base.expansions),
  );

  /** critérios oficiais de desempate (o do Architects depende de algo que o app não registra) */
  private readonly tiebreaks = computed(() => {
    const out: Array<{ label: string; value: (s: SwSheet) => number }> = [];
    switch (this.variant()?.id) {
      case 'duel':
        out.push({ label: this.i18n.t('group.tb.civilian'), value: (s) => s.duel.civilian || 0 });
        break;
      case 'architects':
        break;
      default:
        out.push({ label: this.i18n.t('group.tb.coins'), value: (s) => s.base.coins || 0 });
    }
    return out;
  });
  readonly tieLabels = computed(() => this.tiebreaks().map((t) => t.label));
  /** desempate que a mesa decide (só no Architects: mais etapas da maravilha) */
  readonly manualTieRule = computed(() =>
    this.variant()?.id === 'architects' ? this.i18n.t('group.tieRule.architects') : null,
  );
  /** o que a regra diz quando nem o desempate separa */
  readonly sharedTieRule = computed(() => this.i18n.t('group.tieRule.shared'));

  readonly totals = computed<Record<string, number>>(() => {
    const m = this.table.match();
    const out: Record<string, number> = {};
    if (!m) return out;
    for (const id of m.order) out[id] = scoreSheet(this.variant()?.id, m.sheets[id]).total;
    return out;
  });

  readonly standings = computed<Standing[]>(() => {
    const m = this.table.match();
    if (!m) return [];
    const vid = this.variant()?.id;
    const totals = this.totals();
    const tbs = this.tiebreaks();
    const byId = new Map(this.table.players().map((p) => [p.id, p]));
    return rankStandings(
      m.order.map((id) => {
        const s = m.sheets[id];
        const forced = vid === 'duel' && s.duel.victory !== 'civilian';
        return { id, total: totals[id] ?? 0, forced, tiebreak: tbs.map((t) => t.value(s)) };
      }),
      this.manualTieRule() ? (m.manualOrder ?? []) : [],
    ).map((r) => {
      const p = byId.get(r.id)!;
      const outcome = r.forced ? `sw.victory.${m.sheets[r.id].duel.victory}` : undefined;
      return { ...r, name: p.name, color: p.color, outcome };
    });
  });

  /** pontos de cada categoria por jogador, na ordem do ranking */
  readonly breakdown = computed<BreakdownRow[]>(() => {
    const m = this.table.match();
    if (!m) return [];
    const vid = this.variant()?.id;
    const results = this.standings().map((s) => scoreSheet(vid, m.sheets[s.id]));
    const keys: string[] = [];
    for (const r of results) for (const p of r.parts) if (!keys.includes(p.key)) keys.push(p.key);
    return keys.map((key) => ({
      key,
      label: this.i18n.t(key),
      values: results.map((r) => r.parts.find((p) => p.key === key)?.points ?? 0),
    }));
  });

  startGroup(players: DraftPlayer[]): void {
    const v = this.variant();
    if (!v) return;
    const { min, max } = this.limits();
    if (players.length < min || players.length > max) return;
    this.table.start(v.id, players, withExpansions(this.groupBaseExp(), this.groupDuelExp()));
  }

  /** nova partida, mesmos jogadores e mesmas expansões */
  rematch(): void {
    this.table.rematch(withExpansions(this.groupBaseExp(), this.groupDuelExp()));
  }

  finishGroup(): void {
    const st = this.standings();
    this.table.finish(st, st[0]?.outcome);
  }

  /** a mesa decidiu um empate que a regra manda resolver por algo fora da planilha */
  pickTieWinner(id: string | null): void {
    this.table.setManualOrder(id ? [id] : []);
    const st = this.standings();
    this.table.syncResults(st, st[0]?.outcome);
  }

  /**
   * Motivo (chave de tradução) que impede ligar/desligar a expansão sem
   * quebrar o limite de jogadores da mesa atual; null = pode.
   */
  expansionBlock(id: string): string | null {
    if (!this.groupPlaying() || this.variant()?.id !== 'base') return null;
    const cur = this.groupBaseExp();
    const next = { ...cur, [id]: !cur[id as keyof BaseExp] };
    const n = this.table.players().length;
    if (n <= swPlayerLimits('base', next).max) return null;
    return id === 'armada' ? 'group.exp.armadaMax' : 'group.exp.citiesNeeded';
  }

  constructor() {
    const snap = this.store.load<SwSnapshot>(KEY);
    if (snap) {
      const v = findSwVariant(snap.variantId);
      if (v) {
        this.variant.set(v);
        this.solo.set(normalizeSheet(snap));
        this.soloFinished.set(!!snap.finished);
      }
    }
    if (!this.variant()) {
      const m = this.table.match();
      const gv = m ? findSwVariant(m.variantId) : undefined;
      if (gv) this.variant.set(gv);
    }
    effect(() => {
      const v = this.variant();
      if (!v) return;
      const snap: SwSnapshot = { variantId: v.id, ...this.solo(), finished: this.soloFinished() };
      this.store.save(KEY, snap);
    });
  }

  /** Seleciona a versão; trocar de versão começa do zero (a mesa mantém os jogadores). */
  selectVariant(id: string): boolean {
    const v = findSwVariant(id);
    if (!v) return false;
    if (this.variant()?.id !== v.id) {
      this.solo.set(emptySheet());
      this.soloFinished.set(false);
    }
    const m = this.table.match();
    if (m && m.variantId !== v.id) this.table.clearMatch();
    this.variant.set(v);
    return true;
  }

  /** Escreve na planilha em edição (a sua, ou a do jogador da vez). */
  private edit(fn: (s: SwSheet) => SwSheet): void {
    if (this.finished()) return;
    if (this.isGroup()) this.table.updateActive(fn);
    else this.solo.update(fn);
  }

  patchBase(patch: Partial<SwBaseState>): void {
    this.edit((s) => ({ ...s, base: { ...s.base, ...patch } }));
  }
  patchDuel(patch: Partial<SwDuelState>): void {
    // no grupo só um jogador vence por supremacia: os outros voltam para "pontos"
    if (this.isGroup() && !this.finished() && patch.victory && patch.victory !== 'civilian') {
      const active = this.table.activeId();
      this.table.updateAll((s, id) => (id === active ? s : { ...s, duel: { ...s.duel, victory: 'civilian' } }));
    }
    this.edit((s) => ({ ...s, duel: { ...s.duel, ...patch } }));
  }
  patchArchitects(patch: Partial<SwArchitectsState>): void {
    this.edit((s) => ({ ...s, architects: { ...s.architects, ...patch } }));
  }

  toggleExpansion(id: string): void {
    if (this.finished()) return;
    const duel = this.variant()?.id === 'duel';
    if (this.isGroup()) {
      if (this.expansionBlock(id)) return;
      if (duel) {
        const cur = this.groupDuelExp();
        const ex = { ...cur, [id]: !cur[id as keyof DuelExp] };
        this.table.setMeta({ duelExp: ex });
        this.table.updateAll((s) => ({ ...s, duel: { ...s.duel, expansions: ex } }));
      } else {
        const cur = this.groupBaseExp();
        const ex = { ...cur, [id]: !cur[id as keyof BaseExp] };
        this.table.setMeta({ baseExp: ex });
        this.table.updateAll((s) => ({ ...s, base: { ...s.base, expansions: ex } }));
      }
      return;
    }
    if (duel) {
      this.solo.update((s) => {
        const ex = s.duel.expansions as Record<string, boolean>;
        return { ...s, duel: { ...s.duel, expansions: { ...s.duel.expansions, [id]: !ex[id] } } };
      });
    } else {
      this.solo.update((s) => {
        const ex = s.base.expansions as Record<string, boolean>;
        return { ...s, base: { ...s.base, expansions: { ...s.base.expansions, [id]: !ex[id] } } };
      });
    }
  }

  expansionOn(id: string): boolean {
    const ex = (this.variant()?.id === 'duel' ? this.duel().expansions : this.base().expansions) as Record<string, boolean>;
    return !!ex[id];
  }

  /** Termina a partida individual e trava os campos. */
  finish(): void {
    this.soloFinished.set(true);
  }

  reset(): void {
    this.solo.set(emptySheet());
    this.soloFinished.set(false);
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
