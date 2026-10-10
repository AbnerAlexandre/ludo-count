import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import { MatchHistory } from './match-history';
import { I18n } from '../i18n/i18n';
import type { AuditEntry } from '../models/audit.models';
import { GroupTable } from '../group/group-table';
import { rankStandings } from '../group/ranking';
import type { DraftPlayer, PlayerLimits, Standing } from '../group/group-models';
import {
  bonusHint,
  bonusLabel,
  findVariant,
  type BonusSpec,
  type TtrVariant,
} from '../../features/ticket-to-ride/scoring/ttr-variants';
import {
  bonusPoints,
  bonusesTotal,
  buildAudit,
  routePoints,
  routesTotal,
  scoreMatch,
  ticketsTotal,
  type BonusState,
  type ClaimedRoute,
  type Ticket,
  type TtrAuditLabels,
} from '../../features/ticket-to-ride/scoring/ttr-scoring';

/** planilha de um jogador */
export interface TtrSheet {
  routes: ClaimedRoute[];
  tickets: Ticket[];
  bonuses: BonusState;
}

const emptySheet = (): TtrSheet => ({ routes: [], tickets: [], bonuses: {} });
const EMPTY: TtrSheet = emptySheet();

interface TtrSnapshot extends TtrSheet {
  variantId: string;
  finished: boolean;
}

/** linha do detalhamento final (uma categoria, um valor por jogador na ordem do ranking) */
export interface BreakdownRow {
  key: string;
  label: string;
  values: number[];
}

const KEY = 'ttr';
let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * Ticket to Ride match state. The active variant is chosen first; the counter
 * then reads `variant()` to render only the relevant inputs. All arithmetic goes
 * through the pure functions in `ttr-scoring.ts`.
 *
 * Two modes share the same screen: "solo" (one sheet, the player's own) and
 * "group" (one sheet per player at the table). Every read below follows the
 * sheet being edited right now — in group mode, the active player's.
 */
@Injectable({ providedIn: 'root' })
export class TtrMatch {
  private readonly store = inject(Persistence);
  private readonly i18n = inject(I18n);

  readonly variant = signal<TtrVariant | null>(null);
  private readonly solo = signal<TtrSheet>(emptySheet());
  private readonly soloFinished = signal(false);

  /** mesa em grupo (jogadores, planilhas e ranking da sessão) */
  readonly table = new GroupTable<TtrSheet>({
    store: this.store,
    history: inject(MatchHistory),
    game: 'ttr',
    empty: emptySheet,
  });

  readonly isGroup = this.table.isGroup;
  /** modo grupo com a partida já começada (jogadores definidos) */
  readonly groupPlaying = computed(() => this.isGroup() && !!this.table.match());

  private readonly sheet = computed<TtrSheet>(() =>
    this.isGroup() ? (this.table.activeSheet() ?? EMPTY) : this.solo(),
  );

  readonly routes = computed(() => this.sheet().routes);
  readonly tickets = computed(() => this.sheet().tickets);
  readonly bonuses = computed(() => this.sheet().bonuses);

  /** true once the match is finished — locks all inputs */
  readonly finished = computed(() => (this.isGroup() ? this.table.finished() : this.soloFinished()));

  readonly routesTotal = computed(() => {
    const v = this.variant();
    return v ? routesTotal(v, this.routes()) : 0;
  });
  readonly ticketsTotal = computed(() => ticketsTotal(this.tickets()));
  readonly bonusesTotal = computed(() => {
    const v = this.variant();
    return v ? bonusesTotal(v, this.bonuses()) : 0;
  });

  /** Final total — may be negative, never clamped. */
  readonly total = computed(() => {
    const v = this.variant();
    return v ? scoreMatch(v, this.sheet()) : 0;
  });

  readonly audit = computed<AuditEntry[]>(() => {
    const v = this.variant();
    if (!v) return [];
    return buildAudit(v, this.sheet(), this.auditLabels());
  });

  private auditLabels(): TtrAuditLabels {
    const t = this.i18n;
    const l = t.locale();
    return {
      routesGroup: t.t('audit.routes'),
      ticketsGroup: t.t('audit.tickets'),
      bonusesGroup: t.t('audit.bonuses'),
      route: (len, terrain) => {
        const taxi = this.variant()?.pieces === 'taxis' ? 'Taxi' : '';
        const base = t.tp(`audit.route${len === 1 ? 'One' : 'Many'}${taxi}`, { n: len });
        return terrain ? base + t.t('audit.terrainSuffix') : base;
      },
      ticketComplete: t.t('audit.ticketComplete'),
      ticketIncomplete: t.t('audit.ticketIncomplete'),
      ticketValue: (v) => t.tp('audit.ticketValue', { n: v }),
      bonusLabel: (spec) => bonusLabel(spec, l),
      bonusHint: (spec) => bonusHint(spec, l),
    };
  }

  readonly hasProgress = computed(
    () => this.routes().length > 0 || this.tickets().length > 0 || Object.keys(this.bonuses()).length > 0,
  );

  /** edição com partida em andamento (individual ou em grupo), para oferecer "continuar" */
  readonly resume = computed<{ variantId: string; group: boolean } | null>(() => {
    const v = this.variant();
    if (!v) return null;
    if (this.isGroup()) {
      const m = this.table.match();
      return m && !m.finished ? { variantId: m.variantId, group: true } : null;
    }
    const s = this.solo();
    const any = s.routes.length > 0 || s.tickets.length > 0 || Object.keys(s.bonuses).length > 0;
    return any && !this.soloFinished() ? { variantId: v.id, group: false } : null;
  });

  /* ---------------- mesa em grupo ---------------- */

  /** quantos jogadores a edição permite */
  readonly limits = computed<PlayerLimits>(() => {
    const v = this.variant();
    return { min: v?.playersMin ?? 2, max: v?.playersMax ?? 5 };
  });

  /** critérios oficiais de desempate da edição, na ordem das regras */
  private readonly tiebreaks = computed(() => {
    const v = this.variant();
    const l = this.i18n.locale();
    const out: Array<{ label: string; value: (s: TtrSheet) => number }> = [
      { label: this.i18n.t('group.tb.tickets'), value: (s) => s.tickets.filter((t) => t.completed).length },
    ];
    if (!v) return out;
    // Europa: depois dos bilhetes, quem usou menos estações (= sobrou mais)
    const stations = v.bonuses.find((b) => b.id === 'stations');
    if (stations) {
      out.push({ label: this.i18n.t('group.tb.stations'), value: (s) => Number(s.bonuses[stations.id]) || 0 });
    }
    const longest = v.bonuses.find((b) => b.id === 'longest');
    if (longest) {
      out.push({ label: bonusLabel(longest, l), value: (s) => (s.bonuses[longest.id] === true ? 1 : 0) });
    }
    return out;
  });

  readonly tieLabels = computed(() => this.tiebreaks().map((t) => t.label));
  /** no Ticket to Ride todo desempate sai da planilha; nada a decidir na mesa */
  readonly manualTieRule = computed<string | null>(() => null);
  /** o que vale quando nem os critérios separam (a regra não diz mais nada) */
  readonly sharedTieRule = computed(() => this.i18n.t('group.tieRule.sharedTtr'));

  /** total de cada jogador da mesa, ao vivo */
  readonly totals = computed<Record<string, number>>(() => {
    const v = this.variant();
    const m = this.table.match();
    const out: Record<string, number> = {};
    if (!v || !m) return out;
    for (const id of m.order) out[id] = scoreMatch(v, m.sheets[id]);
    return out;
  });

  /** classificação ao vivo (e final, quando a partida termina) */
  readonly standings = computed<Standing[]>(() => {
    const m = this.table.match();
    if (!m) return [];
    const totals = this.totals();
    const tbs = this.tiebreaks();
    const byId = new Map(this.table.players().map((p) => [p.id, p]));
    return rankStandings(
      m.order.map((id) => ({ id, total: totals[id] ?? 0, tiebreak: tbs.map((t) => t.value(m.sheets[id])) })),
      m.manualOrder,
    ).map((r) => {
      const p = byId.get(r.id)!;
      return { ...r, name: p.name, color: p.color };
    });
  });

  /** pontos de cada categoria por jogador, na ordem do ranking */
  readonly breakdown = computed<BreakdownRow[]>(() => {
    const v = this.variant();
    const m = this.table.match();
    if (!v || !m) return [];
    const l = this.i18n.locale();
    const ids = this.standings().map((s) => s.id);
    const sheets = ids.map((id) => m.sheets[id]);
    const rows: BreakdownRow[] = [
      { key: 'routes', label: this.i18n.t('history.part.routes'), values: sheets.map((s) => routesTotal(v, s.routes)) },
      { key: 'tickets', label: this.i18n.t('history.part.tickets'), values: sheets.map((s) => ticketsTotal(s.tickets)) },
    ];
    for (const b of v.bonuses) {
      rows.push({ key: b.id, label: bonusLabel(b, l), values: sheets.map((s) => bonusPoints(b, s.bonuses)) });
    }
    return rows;
  });

  startGroup(players: DraftPlayer[]): void {
    const v = this.variant();
    if (!v) return;
    const { min, max } = this.limits();
    if (players.length < min || players.length > max) return;
    this.table.start(v.id, players);
  }

  /** nova partida, mesmos jogadores e mesma edição */
  rematch(): void {
    this.table.rematch();
  }

  finishGroup(): void {
    this.table.finish(this.standings());
  }

  /** a mesa escolheu quem vence um empate que os critérios não separaram */
  pickTieWinner(id: string | null): void {
    this.table.setManualOrder(id ? [id] : []);
    this.table.syncResults(this.standings());
  }

  constructor() {
    const snap = this.store.load<TtrSnapshot>(KEY);
    if (snap) {
      const v = findVariant(snap.variantId);
      if (v) {
        this.variant.set(v);
        this.solo.set({ routes: snap.routes ?? [], tickets: snap.tickets ?? [], bonuses: snap.bonuses ?? {} });
        this.soloFinished.set(!!snap.finished);
      }
    }
    if (!this.variant()) {
      const gv = this.table.match() && findVariant(this.table.match()!.variantId);
      if (gv) this.variant.set(gv);
    }
    effect(() => {
      const v = this.variant();
      if (!v) return;
      const snap: TtrSnapshot = { variantId: v.id, ...this.solo(), finished: this.soloFinished() };
      this.store.save(KEY, snap);
    });
  }

  /** Select the variant. If a different variant is chosen, start clean. */
  selectVariant(id: string): boolean {
    const v = findVariant(id);
    if (!v) return false;
    if (this.variant()?.id !== v.id) {
      this.solo.set(emptySheet());
      this.soloFinished.set(false);
    }
    // a mesa continua com os mesmos jogadores; só a partida de outra edição sai
    const m = this.table.match();
    if (m && m.variantId !== v.id) this.table.clearMatch();
    this.variant.set(v);
    return true;
  }

  routePointsFor(route: ClaimedRoute): number {
    const v = this.variant();
    return v ? routePoints(v, route) : 0;
  }

  /** Escreve na planilha que está sendo editada (a sua, ou a do jogador da vez). */
  private edit(fn: (s: TtrSheet) => TtrSheet): void {
    if (this.finished()) return;
    if (this.isGroup()) this.table.updateActive(fn);
    else this.solo.update(fn);
  }

  // ---- routes --------------------------------------------------------------

  addRoute(length: number, terrain = false): void {
    this.edit((s) => ({ ...s, routes: [...s.routes, { id: uid(), length, terrain: terrain || undefined }] }));
  }

  removeRoute(id: string): void {
    this.edit((s) => ({ ...s, routes: s.routes.filter((r) => r.id !== id) }));
  }

  routeCountByLength = computed(() => {
    const map = new Map<string, number>();
    for (const r of this.routes()) {
      const k = `${r.length}${r.terrain ? 't' : ''}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  });

  // ---- tickets -------------------------------------------------------------

  addTicket(value: number, completed: boolean): void {
    if (value <= 0) return;
    this.edit((s) => ({ ...s, tickets: [...s.tickets, { id: uid(), value, completed }] }));
  }

  toggleTicket(id: string): void {
    this.edit((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)) }));
  }

  removeTicket(id: string): void {
    this.edit((s) => ({ ...s, tickets: s.tickets.filter((t) => t.id !== id) }));
  }

  // ---- bonuses -------------------------------------------------------------

  bonusValue(spec: BonusSpec): number | boolean {
    const raw = this.bonuses()[spec.id];
    if (spec.kind === 'toggle') return raw === true;
    return typeof raw === 'number' ? raw : 0;
  }

  setBonus(spec: BonusSpec, value: number | boolean): void {
    this.edit((s) => ({ ...s, bonuses: { ...s.bonuses, [spec.id]: value } }));
  }

  adjustBonus(spec: BonusSpec, delta: number): void {
    const cur = typeof this.bonuses()[spec.id] === 'number' ? (this.bonuses()[spec.id] as number) : 0;
    const step = spec.step ?? 1;
    let next = cur + delta * step;
    if (spec.min != null) next = Math.max(spec.min, next);
    if (spec.max != null) next = Math.min(spec.max, next);
    this.setBonus(spec, next);
  }

  // ---- lifecycle -----------------------------------------------------------

  /** Finish the solo match and lock all inputs. */
  finish(): void {
    this.soloFinished.set(true);
  }

  reset(): void {
    this.soloFinished.set(false);
    this.solo.set(emptySheet());
    this.store.clear(KEY);
  }
}
