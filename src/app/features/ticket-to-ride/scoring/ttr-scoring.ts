/**
 * Ticket to Ride scoring — pure, framework-free functions.
 *
 * pontuacaoFinal =
 *     Σ TABELA_ROTAS[edicao][comprimento]   // por rota reivindicada
 *   + Σ bilhetesCompletos.valor
 *   − Σ bilhetesIncompletos.valor
 *   + bonusEspecificosDaEdicao              // pode ser 0 ou negativo
 *
 * The final score CAN be negative — it is never clamped to zero.
 */

import type { AuditEntry } from '../../../core/models/audit.models';
import type { BonusSpec, RouteTable, TtrVariant } from './ttr-variants';

export interface ClaimedRoute {
  id: string;
  length: number;
  /** whether terrain cards were used to double the route (Heart of Africa) */
  terrain?: boolean;
}

export interface Ticket {
  id: string;
  value: number;
  completed: boolean;
}

/** Player-entered bonus state, keyed by BonusSpec.id. */
export type BonusState = Record<string, number | boolean>;

export interface TtrState {
  routes: ClaimedRoute[];
  tickets: Ticket[];
  bonuses: BonusState;
}

export function routePoints(variant: TtrVariant, route: ClaimedRoute): number {
  const table: RouteTable = route.terrain && variant.terrainTable ? variant.terrainTable : variant.routeTable;
  return table[route.length] ?? 0;
}

export function bonusPoints(spec: BonusSpec, state: BonusState): number {
  const raw = state[spec.id];
  switch (spec.kind) {
    case 'toggle':
      return raw ? (spec.value ?? 0) : 0;
    case 'counter':
      return (typeof raw === 'number' ? raw : 0) * (spec.unit ?? 0);
    case 'numeric':
      return typeof raw === 'number' ? raw : 0;
  }
}

export function routesTotal(variant: TtrVariant, routes: ClaimedRoute[]): number {
  return routes.reduce((sum, r) => sum + routePoints(variant, r), 0);
}

export function ticketsTotal(tickets: Ticket[]): number {
  return tickets.reduce((sum, t) => sum + (t.completed ? t.value : -t.value), 0);
}

export function bonusesTotal(variant: TtrVariant, bonuses: BonusState): number {
  return variant.bonuses.reduce((sum, spec) => sum + bonusPoints(spec, bonuses), 0);
}

/** Final total. May be negative; not clamped. */
export function scoreMatch(variant: TtrVariant, state: TtrState): number {
  return (
    routesTotal(variant, state.routes) +
    ticketsTotal(state.tickets) +
    bonusesTotal(variant, state.bonuses)
  );
}

/**
 * Rótulos localizados para a auditoria. Passados pelo serviço (que tem acesso ao
 * i18n) para que este módulo continue puro, sem dependência de Angular.
 */
export interface TtrAuditLabels {
  routesGroup: string;
  ticketsGroup: string;
  bonusesGroup: string;
  route: (len: number, terrain: boolean) => string;
  ticketComplete: string;
  ticketIncomplete: string;
  ticketValue: (v: number) => string;
  bonusLabel: (spec: BonusSpec) => string;
  bonusHint: (spec: BonusSpec) => string | undefined;
}

/** Build the audit trail directly from the same state used for the total. */
export function buildAudit(variant: TtrVariant, state: TtrState, labels: TtrAuditLabels): AuditEntry[] {
  const entries: AuditEntry[] = [];

  state.routes.forEach((r) => {
    entries.push({
      id: `route-${r.id}`,
      group: labels.routesGroup,
      label: labels.route(r.length, !!r.terrain),
      points: routePoints(variant, r),
      kind: 'route',
    });
  });

  state.tickets.forEach((t) => {
    entries.push({
      id: `ticket-${t.id}`,
      group: labels.ticketsGroup,
      label: t.completed ? labels.ticketComplete : labels.ticketIncomplete,
      points: t.completed ? t.value : -t.value,
      detail: labels.ticketValue(t.value),
      kind: 'ticket',
    });
  });

  variant.bonuses.forEach((spec) => {
    const pts = bonusPoints(spec, state.bonuses);
    if (pts !== 0) {
      entries.push({
        id: `bonus-${spec.id}`,
        group: labels.bonusesGroup,
        label: labels.bonusLabel(spec),
        points: pts,
        detail: labels.bonusHint(spec),
        kind: 'bonus',
      });
    }
  });

  return entries;
}
