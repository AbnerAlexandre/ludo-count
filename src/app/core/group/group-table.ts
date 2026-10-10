import { computed, effect, signal } from '@angular/core';
import type { Persistence } from '../services/persistence';
import type { HistoryGame, MatchHistory } from '../services/match-history';
import {
  PLAYER_COLORS,
  type DraftPlayer,
  type GroupMatch,
  type GroupMode,
  type GroupPlayer,
  type SessionRecord,
  type Standing,
} from './group-models';
import { nameKey, sessionBoard } from './ranking';

interface GroupSnapshot<S> {
  v: 1;
  mode: GroupMode;
  roster: GroupPlayer[];
  match: GroupMatch<S> | null;
  session: SessionRecord[];
  meta: Record<string, unknown>;
}

export interface GroupTableConfig<S> {
  store: Persistence;
  history: MatchHistory;
  game: HistoryGame;
  /** planilha vazia de um jogador */
  empty: () => S;
  /** completa uma planilha salva com campos novos (versões futuras do app) */
  normalize?: (raw: S) => S;
}

/** o ranking da sessão guarda no máximo isto de partidas */
export const SESSION_LIMIT = 60;
const NAMES_KEY = 'group:names';
const NAMES_LIMIT = 16;

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Mesa de jogo em grupo para um jogo (Ticket to Ride ou 7 Wonders): elenco,
 * planilha de cada jogador, quem está pontuando agora e o ranking temporário
 * da sessão. Tudo fica neste navegador. O cálculo dos pontos continua nas
 * funções puras de cada jogo — aqui só se guarda e se organiza.
 *
 * Precisa ser criada num contexto de injeção (campo de um serviço), por causa
 * do `effect` que persiste o estado.
 */
export class GroupTable<S> {
  readonly mode = signal<GroupMode>('solo');
  readonly roster = signal<GroupPlayer[]>([]);
  readonly match = signal<GroupMatch<S> | null>(null);
  readonly session = signal<SessionRecord[]>([]);
  /** ajustes da mesa que valem para todos (ex.: expansões do 7 Wonders) */
  readonly meta = signal<Record<string, unknown>>({});
  /** nomes usados recentemente (sugestões no cadastro, entre jogos) */
  readonly recentNames = signal<string[]>([]);

  readonly isGroup = computed(() => this.mode() === 'group');
  readonly finished = computed(() => !!this.match()?.finished);
  readonly activeId = computed(() => this.match()?.activeId ?? null);
  readonly activeSheet = computed<S | null>(() => {
    const m = this.match();
    return m ? (m.sheets[m.activeId] ?? null) : null;
  });

  /** jogadores da partida atual, na ordem dos assentos */
  readonly players = computed<GroupPlayer[]>(() => {
    const m = this.match();
    if (!m) return [];
    const byId = new Map(this.roster().map((p) => [p.id, p]));
    return m.order.map((id, i) => byId.get(id) ?? { id, name: `#${i + 1}`, color: PLAYER_COLORS[i % PLAYER_COLORS.length] });
  });
  readonly activePlayer = computed(() => this.players().find((p) => p.id === this.activeId()) ?? null);
  readonly nextPlayer = computed<GroupPlayer | null>(() => {
    const ps = this.players();
    if (ps.length < 2) return null;
    const i = ps.findIndex((p) => p.id === this.activeId());
    return ps[(i + 1) % ps.length];
  });

  readonly board = computed(() => sessionBoard(this.session()));

  constructor(private readonly cfg: GroupTableConfig<S>) {
    const key = `group:${cfg.game}`;
    const snap = cfg.store.load<GroupSnapshot<S>>(key);
    if (snap?.v === 1) {
      this.mode.set(snap.mode === 'group' ? 'group' : 'solo');
      this.roster.set(Array.isArray(snap.roster) ? snap.roster : []);
      this.session.set(Array.isArray(snap.session) ? snap.session.slice(0, SESSION_LIMIT) : []);
      this.meta.set(snap.meta ?? {});
      const m = snap.match;
      if (m && Array.isArray(m.order) && m.order.length && m.sheets) {
        const norm = cfg.normalize ?? ((s: S) => s);
        const sheets: Record<string, S> = {};
        for (const id of m.order) sheets[id] = norm({ ...cfg.empty(), ...m.sheets[id] });
        this.match.set({ ...m, sheets, activeId: m.order.includes(m.activeId) ? m.activeId : m.order[0] });
      }
    }
    const names = cfg.store.load<string[]>(NAMES_KEY);
    if (Array.isArray(names)) this.recentNames.set(names.slice(0, NAMES_LIMIT));

    effect(() => {
      const snap: GroupSnapshot<S> = {
        v: 1,
        mode: this.mode(),
        roster: this.roster(),
        match: this.match(),
        session: this.session(),
        meta: this.meta(),
      };
      cfg.store.save(key, snap);
    });
  }

  setMode(mode: GroupMode): void {
    this.mode.set(mode);
  }

  setMeta(patch: Record<string, unknown>): void {
    this.meta.update((m) => ({ ...m, ...patch }));
  }

  /**
   * Começa uma partida com estes jogadores. Quem já jogou na sessão (mesmo
   * nome) mantém o id, para o ranking somar as partidas dele.
   */
  start(variantId: string, drafts: readonly DraftPlayer[], init: (s: S) => S = (s) => s): void {
    const known = new Map<string, GroupPlayer>();
    for (const rec of [...this.session()].reverse()) {
      for (const r of rec.results) known.set(nameKey(r.name), { id: r.playerId, name: r.name, color: r.color });
    }
    for (const p of this.roster()) known.set(nameKey(p.name), p);

    const used = new Set<string>();
    const players: GroupPlayer[] = drafts.map((d, i) => {
      const name = d.name.trim() || `#${i + 1}`;
      let id = d.id && !used.has(d.id) ? d.id : known.get(nameKey(name))?.id;
      if (!id || used.has(id)) id = uid('p');
      used.add(id);
      return { id, name, color: d.color };
    });

    this.roster.set(players);
    this.rememberNames(players.map((p) => p.name));
    const sheets: Record<string, S> = {};
    for (const p of players) sheets[p.id] = init(this.cfg.empty());
    this.match.set({
      id: uid('m'),
      variantId,
      startedAt: new Date().toISOString(),
      order: players.map((p) => p.id),
      sheets,
      activeId: players[0].id,
      finished: false,
    });
  }

  /** Nova partida com os mesmos jogadores e a mesma edição. */
  rematch(init: (s: S) => S = (s) => s): void {
    const m = this.match();
    if (!m) return;
    this.start(m.variantId, this.players(), init);
  }

  /** Volta ao cadastro (o elenco continua preenchido). */
  clearMatch(): void {
    this.match.set(null);
  }

  select(id: string): void {
    const m = this.match();
    if (m && m.order.includes(id) && m.activeId !== id) this.match.set({ ...m, activeId: id });
  }

  next(): void {
    const n = this.nextPlayer();
    if (n) this.select(n.id);
  }

  updateActive(fn: (s: S) => S): void {
    const m = this.match();
    if (m) this.updateSheet(m.activeId, fn);
  }

  updateSheet(id: string, fn: (s: S) => S): void {
    const m = this.match();
    if (!m || m.finished || !m.sheets[id]) return;
    this.match.set({ ...m, sheets: { ...m.sheets, [id]: fn(m.sheets[id]) } });
  }

  /** Mesma mudança em todas as planilhas (ajustes da mesa). */
  updateAll(fn: (s: S, id: string) => S): void {
    const m = this.match();
    if (!m || m.finished) return;
    const sheets: Record<string, S> = {};
    for (const id of m.order) sheets[id] = fn(m.sheets[id], id);
    this.match.set({ ...m, sheets });
  }

  /** Trava a partida, soma ao ranking da sessão e grava no histórico. */
  finish(standings: readonly Standing[], outcome?: string): void {
    const m = this.match();
    if (!m || m.finished || !standings.length) return;
    const record = this.toRecord(m, standings);
    this.session.update((list) => [record, ...list.filter((r) => r.id !== m.id)].slice(0, SESSION_LIMIT));
    const entry = this.cfg.history.record(this.cfg.game, {
      variantId: m.variantId,
      total: standings[0].total,
      parts: [],
      outcome,
      players: standings.map((s) => ({ name: s.name, color: s.color, total: s.total, rank: s.rank, outcome: s.outcome })),
    });
    this.match.set({ ...m, finished: true, historyId: entry?.id });
  }

  /** Desempate decidido pela mesa: refaz o ranking já registrado. */
  setManualOrder(ids: string[]): void {
    const m = this.match();
    if (m) this.match.set({ ...m, manualOrder: ids });
  }

  /** Depois de um desempate manual, alinha sessão e histórico ao novo ranking. */
  syncResults(standings: readonly Standing[], outcome?: string): void {
    const m = this.match();
    if (!m?.finished) return;
    const record = this.toRecord(m, standings);
    this.session.update((list) => list.map((r) => (r.id === m.id ? { ...record, date: r.date } : r)));
    if (m.historyId) {
      this.cfg.history.update(this.cfg.game, m.historyId, {
        total: standings[0]?.total ?? 0,
        outcome,
        players: standings.map((s) => ({ name: s.name, color: s.color, total: s.total, rank: s.rank, outcome: s.outcome })),
      });
    }
  }

  /** Zera o ranking temporário (as partidas continuam no histórico). */
  resetSession(): void {
    this.session.set([]);
  }

  private toRecord(m: GroupMatch<S>, standings: readonly Standing[]): SessionRecord {
    return {
      id: m.id,
      date: new Date().toISOString(),
      variantId: m.variantId,
      results: standings.map((s) => ({ playerId: s.id, name: s.name, color: s.color, total: s.total, rank: s.rank })),
    };
  }

  private rememberNames(names: string[]): void {
    const saved = this.cfg.store.load<string[]>(NAMES_KEY) ?? [];
    const merged: string[] = [];
    const seen = new Set<string>();
    for (const n of [...names, ...saved]) {
      const k = nameKey(n);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      merged.push(n.trim());
    }
    const list = merged.slice(0, NAMES_LIMIT);
    this.recentNames.set(list);
    this.cfg.store.save(NAMES_KEY, list);
  }
}
