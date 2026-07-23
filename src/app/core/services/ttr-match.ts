import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Persistence } from './persistence';
import type { AuditEntry } from '../models/audit.models';
import { findVariant, type BonusSpec, type TtrVariant } from '../../features/ticket-to-ride/scoring/ttr-variants';
import {
  bonusesTotal,
  buildAudit,
  routePoints,
  routesTotal,
  scoreMatch,
  ticketsTotal,
  type BonusState,
  type ClaimedRoute,
  type Ticket,
} from '../../features/ticket-to-ride/scoring/ttr-scoring';

interface TtrSnapshot {
  variantId: string;
  routes: ClaimedRoute[];
  tickets: Ticket[];
  bonuses: BonusState;
}

const KEY = 'ttr';
let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * Ticket to Ride match state. The active variant is chosen first; the counter
 * then reads `variant()` to render only the relevant inputs. All arithmetic goes
 * through the pure functions in `ttr-scoring.ts`.
 */
@Injectable({ providedIn: 'root' })
export class TtrMatch {
  private readonly store = inject(Persistence);

  readonly variant = signal<TtrVariant | null>(null);
  readonly routes = signal<ClaimedRoute[]>([]);
  readonly tickets = signal<Ticket[]>([]);
  readonly bonuses = signal<BonusState>({});

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
    return v ? scoreMatch(v, { routes: this.routes(), tickets: this.tickets(), bonuses: this.bonuses() }) : 0;
  });

  readonly audit = computed<AuditEntry[]>(() => {
    const v = this.variant();
    return v ? buildAudit(v, { routes: this.routes(), tickets: this.tickets(), bonuses: this.bonuses() }) : [];
  });

  readonly hasProgress = computed(
    () => this.routes().length > 0 || this.tickets().length > 0 || Object.keys(this.bonuses()).length > 0,
  );

  constructor() {
    const snap = this.store.load<TtrSnapshot>(KEY);
    if (snap) {
      const v = findVariant(snap.variantId);
      if (v) {
        this.variant.set(v);
        this.routes.set(snap.routes ?? []);
        this.tickets.set(snap.tickets ?? []);
        this.bonuses.set(snap.bonuses ?? {});
      }
    }
    effect(() => {
      const v = this.variant();
      if (!v) return;
      const snap: TtrSnapshot = {
        variantId: v.id,
        routes: this.routes(),
        tickets: this.tickets(),
        bonuses: this.bonuses(),
      };
      this.store.save(KEY, snap);
    });
  }

  /** Select the variant. If a different variant is chosen, start clean. */
  selectVariant(id: string): boolean {
    const v = findVariant(id);
    if (!v) return false;
    if (this.variant()?.id !== v.id) {
      this.routes.set([]);
      this.tickets.set([]);
      this.bonuses.set({});
    }
    this.variant.set(v);
    return true;
  }

  routePointsFor(route: ClaimedRoute): number {
    const v = this.variant();
    return v ? routePoints(v, route) : 0;
  }

  // ---- routes --------------------------------------------------------------

  addRoute(length: number, terrain = false): void {
    this.routes.update((rs) => [...rs, { id: uid(), length, terrain: terrain || undefined }]);
  }

  removeRoute(id: string): void {
    this.routes.update((rs) => rs.filter((r) => r.id !== id));
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
    this.tickets.update((ts) => [...ts, { id: uid(), value, completed }]);
  }

  toggleTicket(id: string): void {
    this.tickets.update((ts) => ts.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  removeTicket(id: string): void {
    this.tickets.update((ts) => ts.filter((t) => t.id !== id));
  }

  // ---- bonuses -------------------------------------------------------------

  bonusValue(spec: BonusSpec): number | boolean {
    const raw = this.bonuses()[spec.id];
    if (spec.kind === 'toggle') return raw === true;
    return typeof raw === 'number' ? raw : 0;
  }

  setBonus(spec: BonusSpec, value: number | boolean): void {
    this.bonuses.update((b) => ({ ...b, [spec.id]: value }));
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

  reset(): void {
    this.routes.set([]);
    this.tickets.set([]);
    this.bonuses.set({});
    this.store.clear(KEY);
  }
}
