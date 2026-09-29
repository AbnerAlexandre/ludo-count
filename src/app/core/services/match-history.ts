import { Injectable, inject, signal } from '@angular/core';
import { Persistence } from './persistence';

export type HistoryGame = 'azul' | 'ttr' | 'sw';

export interface HistoryPart {
  /** chave de tradução do rótulo (ex.: 'history.part.routes') */
  key: string;
  points: number;
}

export interface HistoryEntry {
  id: string;
  /** ISO 8601 */
  date: string;
  variantId?: string;
  total: number;
  parts: HistoryPart[];
  /** chave de tradução do desfecho, ex.: vitória por supremacia militar */
  outcome?: string;
}

export const HISTORY_LIMIT = 10;
export const HISTORY_GAMES: HistoryGame[] = ['azul', 'ttr', 'sw'];

/** Insere no topo e corta no limite: as mais antigas saem primeiro. Pura. */
export function pushCapped<T>(list: readonly T[], item: T, limit = HISTORY_LIMIT): T[] {
  return [item, ...list].slice(0, limit);
}

const listKey = (g: HistoryGame) => `history:${g}`;
const ENABLED_KEY = 'history:enabled';

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * Histórico temporário das últimas partidas terminadas, por jogo, guardado só
 * neste navegador. Nada sai do aparelho; o jogador pode desligar e limpar.
 */
@Injectable({ providedIn: 'root' })
export class MatchHistory {
  private readonly store = inject(Persistence);

  readonly enabled = signal(true);
  private readonly lists = signal<Record<HistoryGame, HistoryEntry[]>>({ azul: [], ttr: [], sw: [] });

  constructor() {
    const enabled = this.store.load<boolean>(ENABLED_KEY);
    if (enabled === false) this.enabled.set(false);
    const loaded = { azul: [], ttr: [], sw: [] } as Record<HistoryGame, HistoryEntry[]>;
    for (const g of HISTORY_GAMES) {
      const raw = this.store.load<HistoryEntry[]>(listKey(g));
      loaded[g] = Array.isArray(raw) ? raw.slice(0, HISTORY_LIMIT) : [];
    }
    this.lists.set(loaded);
  }

  entries(game: HistoryGame): HistoryEntry[] {
    return this.lists()[game];
  }

  /** Registra uma partida terminada (ignorado se o histórico estiver desligado). */
  record(game: HistoryGame, entry: Omit<HistoryEntry, 'id' | 'date'>): void {
    if (!this.enabled()) return;
    const full: HistoryEntry = { ...entry, id: uid(), date: new Date().toISOString() };
    this.write(game, pushCapped(this.entries(game), full));
  }

  remove(game: HistoryGame, id: string): void {
    this.write(
      game,
      this.entries(game).filter((e) => e.id !== id),
    );
  }

  clear(game: HistoryGame): void {
    this.write(game, []);
  }

  setEnabled(on: boolean): void {
    this.enabled.set(on);
    this.store.save(ENABLED_KEY, on);
  }

  private write(game: HistoryGame, list: HistoryEntry[]): void {
    this.lists.update((all) => ({ ...all, [game]: list }));
    if (list.length) this.store.save(listKey(game), list);
    else this.store.clear(listKey(game));
  }
}
