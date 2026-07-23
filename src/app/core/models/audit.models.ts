/**
 * Shared, framework-free score & audit types.
 *
 * The audit trail is *derived* from the same data the totals are computed from —
 * it is never a separately maintained list. Each game builds its `AuditEntry[]`
 * from its committed state, so the two can never drift.
 */

export type GameId = 'azul' | 'ticket-to-ride';

/** A single traceable contribution to a match total. */
export interface AuditEntry {
  /** stable id for @for tracking */
  id: string;
  /** grouping label, e.g. "Rodada 3" or "Rotas" */
  group: string;
  /** human description of what produced the points */
  label: string;
  /** signed points contributed (may be negative) */
  points: number;
  /** optional secondary detail, e.g. "horizontal 3 + vertical 2" */
  detail?: string;
  /** optional tag used for iconography / color */
  kind?: 'route' | 'ticket' | 'bonus' | 'placement' | 'penalty' | 'total';
}

/** Model designed so multiple players could be added later without a rewrite. */
export interface PlayerRef {
  id: string;
  name: string;
}

export const SOLO_PLAYER: PlayerRef = { id: 'me', name: 'Você' };
