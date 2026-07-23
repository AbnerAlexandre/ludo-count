/**
 * Azul scoring — pure, framework-free functions.
 *
 * Implements exactly the rules in `regras/azul/contagem-azul.md`:
 *  - fixed wall layout  cor(linha, coluna) = CORES[(coluna - linha) mod 5]
 *  - per-placement adjacency scoring with the horizontal+vertical double count
 *  - rows processed in order 1..5, each tile scoring against the wall state that
 *    already includes tiles placed earlier in the same round
 *  - floor-line penalties applied after migration, with a floor of 0 on the total
 */

export type AzulColor = 'blue' | 'yellow' | 'red' | 'black' | 'white';

/** CORES = [azul, amarelo, vermelho, preto, branco] */
export const AZUL_COLORS: readonly AzulColor[] = ['blue', 'yellow', 'red', 'black', 'white'] as const;

/** Floor-line penalty ladder: PENALIDADES = [-1,-1,-2,-2,-2,-3,-3] */
export const FLOOR_PENALTIES: readonly number[] = [-1, -1, -2, -2, -2, -3, -3];

export const WALL_SIZE = 5;

/** A 5×5 grid of booleans: occupied or not. */
export type Wall = boolean[][];

export interface Placement {
  /** 0-indexed row (0 = linha 1) */
  row: number;
  /** 0-indexed column */
  col: number;
}

export interface PlacementScore extends Placement {
  color: AzulColor;
  /** horizontal run length through the tile */
  h: number;
  /** vertical run length through the tile */
  v: number;
  points: number;
}

export interface RoundResult {
  placements: PlacementScore[];
  placementPoints: number;
  floorCount: number;
  floorPenalty: number;
  totalBefore: number;
  totalAfter: number;
}

/** cor(linha, coluna) = CORES[(coluna - linha) mod 5] */
export function wallColor(row: number, col: number): AzulColor {
  const idx = (((col - row) % WALL_SIZE) + WALL_SIZE) % WALL_SIZE;
  return AZUL_COLORS[idx];
}

/** Column where a given color lives on a given row. Inverse of wallColor. */
export function colOfColor(row: number, color: AzulColor): number {
  const colorIdx = AZUL_COLORS.indexOf(color);
  return ((colorIdx + row) % WALL_SIZE + WALL_SIZE) % WALL_SIZE;
}

export function emptyWall(): Wall {
  return Array.from({ length: WALL_SIZE }, () => Array<boolean>(WALL_SIZE).fill(false));
}

export function cloneWall(wall: Wall): Wall {
  return wall.map((r) => r.slice());
}

/** Count contiguous occupied cells stepping (dr, dc) from a start, exclusive. */
function countContiguous(wall: Wall, row: number, col: number, dr: number, dc: number): number {
  let n = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < WALL_SIZE && c >= 0 && c < WALL_SIZE && wall[r][c]) {
    n++;
    r += dr;
    c += dc;
  }
  return n;
}

/**
 * Score a single placement, assuming the tile at (row,col) is already set on the wall.
 * Contiguous tiles only — a gap breaks the run.
 */
export function scorePlacement(wall: Wall, row: number, col: number): { points: number; h: number; v: number } {
  const h = 1 + countContiguous(wall, row, col, 0, -1) + countContiguous(wall, row, col, 0, 1);
  const v = 1 + countContiguous(wall, row, col, -1, 0) + countContiguous(wall, row, col, 1, 0);

  let points: number;
  if (h === 1 && v === 1) points = 1; // isolado
  else if (h === 1) points = v; // só vertical
  else if (v === 1) points = h; // só horizontal
  else points = h + v; // cruzamento: o azulejo conta nas duas somas
  return { points, h, v };
}

/** total = soma(PENALIDADES[0 .. min(count,7) - 1]); tiles past the 7th are discarded free. */
export function floorPenalty(count: number): number {
  const n = Math.min(Math.max(count, 0), FLOOR_PENALTIES.length);
  let total = 0;
  for (let i = 0; i < n; i++) total += FLOOR_PENALTIES[i];
  return total;
}

/**
 * Score a whole round: migrate the selected placements in row order (1→5), each
 * scoring at the instant it is placed, then apply the floor penalty with a floor of 0.
 * Returns the round breakdown plus the wall after migration (does not mutate input).
 */
export function scoreRound(
  wall: Wall,
  placements: Placement[],
  floorCount: number,
  totalBefore: number,
): { result: RoundResult; wallAfter: Wall } {
  const w = cloneWall(wall);
  const ordered = [...placements].sort((a, b) => a.row - b.row || a.col - b.col);
  const scored: PlacementScore[] = [];
  let placementPoints = 0;

  for (const p of ordered) {
    w[p.row][p.col] = true;
    const { points, h, v } = scorePlacement(w, p.row, p.col);
    placementPoints += points;
    scored.push({ ...p, color: wallColor(p.row, p.col), h, v, points });
  }

  const penalty = floorPenalty(floorCount);
  const totalAfter = Math.max(0, totalBefore + placementPoints + penalty);

  return {
    result: {
      placements: scored,
      placementPoints,
      floorCount,
      floorPenalty: penalty,
      totalBefore,
      totalAfter,
    },
    wallAfter: w,
  };
}
