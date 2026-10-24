/**
 * Azul: Jardim da Rainha — o jardim do jogador como grade de hexágonos (sem Angular).
 *
 * O tabuleiro da caixa é quadrado, com hexágonos deitados (lado reto em cima) e o
 * tabuleiro da fonte no meio: a fonte, os 6 espaços em volta dela e 6 enfeites
 * (estátuas e bancos) nas pontas. As expansões encaixam em volta; aqui o jogador
 * só marca onde pôs cada hexágono e o app conta a roda, os pavilhões e os grupos.
 */
import {
  GARDEN_GROUP6_BONUS,
  GARDEN_GROUP_MAX,
  GARDEN_GROUP_MIN,
  PATTERN_VALUE,
  type GardenColor,
  type GardenItem,
  type GardenPattern,
} from './garden-scoring';

export interface GardenTile {
  color: GardenColor;
  pattern: GardenPattern;
}
export type GardenCell = GardenTile | { pavilion: true };
/** chave "coluna,linha" → o que está no espaço */
export type GardenCells = Record<string, GardenCell>;
export type GardenElement = 'fountain' | 'statue' | 'bench';

export const GARDEN_COLS = 11;
export const GARDEN_ROWS = 9;

export const cellKey = (col: number, row: number) => `${col},${row}`;
export const isTile = (c: GardenCell | undefined): c is GardenTile => !!c && 'color' in c;

/* colunas ímpares ficam meio hexágono abaixo ("odd-q"); vizinhos em coordenadas axiais */
const toAxial = (col: number, row: number) => ({ q: col, r: row - (col - (col & 1)) / 2 });
const fromAxial = (q: number, r: number) => ({ col: q, row: r + (q - (q & 1)) / 2 });
const DIRS = [
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 0],
];

const inside = (col: number, row: number) => col >= 0 && col < GARDEN_COLS && row >= 0 && row < GARDEN_ROWS;

export function neighbors(key: string): string[] {
  const [col, row] = key.split(',').map(Number);
  const { q, r } = toAxial(col, row);
  return DIRS.map(([dq, dr]) => fromAxial(q + dq, r + dr))
    .filter((p) => inside(p.col, p.row))
    .map((p) => cellKey(p.col, p.row));
}

export const ALL_CELLS: readonly { key: string; col: number; row: number }[] = Array.from(
  { length: GARDEN_COLS * GARDEN_ROWS },
  (_, i) => {
    const col = i % GARDEN_COLS;
    const row = Math.floor(i / GARDEN_COLS);
    return { key: cellKey(col, row), col, row };
  },
);

/** tabuleiro da fonte: a fonte no meio e os enfeites nas 6 pontas (estátua e banco alternados) */
export const ELEMENTS: Readonly<Record<string, GardenElement>> = (() => {
  const { q, r } = toAxial(5, 4);
  const out: Record<string, GardenElement> = { [cellKey(5, 4)]: 'fountain' };
  DIRS.forEach(([dq, dr], k) => {
    const p = fromAxial(q + 2 * dq, r + 2 * dr);
    out[cellKey(p.col, p.row)] = k % 2 ? 'bench' : 'statue';
  });
  return out;
})();

/** hexágonos do jardim que combinam com o item da roda (cor ou padrão) */
export function countMatching(cells: GardenCells, item: GardenItem): number {
  return Object.values(cells).filter((c) => isTile(c) && (c.color === item || c.pattern === item)).length;
}

export const pavilionCount = (cells: GardenCells) => Object.values(cells).filter((c) => !isTile(c)).length;

export interface GardenGroupScore {
  kind: 'color' | 'pattern';
  item: GardenItem;
  keys: string[];
  base: number;
  bonus: number;
  points: number;
}

/**
 * Grupos do fim de jogo: hexágonos vizinhos da mesma cor ou do mesmo padrão.
 * Só grupos de 3+ pontuam; cada hexágono vale o seu padrão; grupo de 6 ganha +6.
 */
export function gardenGroups(cells: GardenCells): GardenGroupScore[] {
  const tiles = Object.entries(cells).filter((e): e is [string, GardenTile] => isTile(e[1]));
  const out: GardenGroupScore[] = [];
  for (const kind of ['color', 'pattern'] as const) {
    const seen = new Set<string>();
    for (const [start, tile] of tiles) {
      if (seen.has(start)) continue;
      const item = tile[kind];
      const keys: string[] = [];
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const k = stack.pop()!;
        keys.push(k);
        for (const n of neighbors(k)) {
          const c = cells[n];
          if (!seen.has(n) && isTile(c) && c[kind] === item) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      if (keys.length < GARDEN_GROUP_MIN) continue;
      const base = keys.reduce((s, k) => s + PATTERN_VALUE[(cells[k] as GardenTile).pattern], 0);
      const bonus = keys.length >= GARDEN_GROUP_MAX ? GARDEN_GROUP6_BONUS : 0;
      out.push({ kind, item, keys: keys.sort(), base, bonus, points: base + bonus });
    }
  }
  return out;
}
