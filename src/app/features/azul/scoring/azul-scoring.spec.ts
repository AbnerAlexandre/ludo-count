import { describe, it, expect } from 'vitest';
import {
  AZUL_COLORS,
  colOfColor,
  emptyWall,
  endGameScore,
  floorPenalty,
  scorePlacement,
  scoreRound,
  wallColor,
  type Wall,
} from './azul-scoring';

/** helper: build a wall with the given [row,col] cells occupied */
function wallWith(cells: Array<[number, number]>): Wall {
  const w = emptyWall();
  for (const [r, c] of cells) w[r][c] = true;
  return w;
}

describe('wall layout', () => {
  it('matches cor(linha,coluna) = CORES[(coluna - linha) mod 5]', () => {
    expect(wallColor(0, 0)).toBe('blue');
    expect(wallColor(0, 4)).toBe('white');
    expect(wallColor(1, 0)).toBe('white');
    expect(wallColor(4, 4)).toBe('blue');
    expect(wallColor(2, 2)).toBe('blue'); // diagonal is always blue
  });

  it('colOfColor is the inverse of wallColor', () => {
    for (let row = 0; row < 5; row++) {
      for (const color of AZUL_COLORS) {
        const col = colOfColor(row, color);
        expect(wallColor(row, col)).toBe(color);
      }
    }
  });
});

describe('scorePlacement (adjacency)', () => {
  it('#1 first tile on an empty wall → +1', () => {
    const w = wallWith([[0, 0]]);
    expect(scorePlacement(w, 0, 0)).toEqual({ points: 1, h: 1, v: 1 });
  });

  it('#2 tile glued to 2 horizontal neighbours → +3', () => {
    const w = wallWith([[0, 0], [0, 1], [0, 2]]);
    expect(scorePlacement(w, 0, 2)).toEqual({ points: 3, h: 3, v: 1 });
  });

  it('#3 tile forming h=3 and v=2 → +5 (cross counts the tile in both sums)', () => {
    // horizontal run of 3 through (1,1); vertical run of 2 through (1,1)
    const w = wallWith([[1, 0], [1, 1], [1, 2], [0, 1]]);
    expect(scorePlacement(w, 1, 1)).toEqual({ points: 5, h: 3, v: 2 });
  });

  it('#4 neighbour separated by one empty gap → +1 (gap breaks the run)', () => {
    const w = wallWith([[0, 0], [0, 2]]); // (0,1) is empty
    expect(scorePlacement(w, 0, 2)).toEqual({ points: 1, h: 1, v: 1 });
  });

  it('full cross h=4 v=3 → 7', () => {
    const w = wallWith([
      [2, 0], [2, 1], [2, 2], [2, 3], // horizontal 4
      [0, 2], [1, 2], // + vertical above -> v=3 through (2,2)
    ]);
    expect(scorePlacement(w, 2, 2)).toEqual({ points: 7, h: 4, v: 3 });
  });
});

describe('floorPenalty', () => {
  it('sums the ladder left-to-right', () => {
    expect(floorPenalty(0)).toBe(0);
    expect(floorPenalty(1)).toBe(-1);
    expect(floorPenalty(2)).toBe(-2);
    expect(floorPenalty(3)).toBe(-4);
    expect(floorPenalty(7)).toBe(-14); // max
  });

  it('#7 tiles beyond the 7th are discarded without extra penalty', () => {
    expect(floorPenalty(9)).toBe(-14);
  });
});

describe('scoreRound', () => {
  it('#5 two full rows same round: row 1 scores first and counts as a neighbour for row 2', () => {
    const { result } = scoreRound(emptyWall(), [
      { row: 1, col: 0 },
      { row: 0, col: 0 },
    ], 0, 0);
    // processed in row order: (0,0) isolated +1, then (1,0) sees (0,0) above → v=2 → +2
    expect(result.placements[0]).toMatchObject({ row: 0, col: 0, points: 1 });
    expect(result.placements[1]).toMatchObject({ row: 1, col: 0, points: 2, v: 2 });
    expect(result.placementPoints).toBe(3);
    expect(result.totalAfter).toBe(3);
  });

  it('#6 +3 on wall, 3 tiles on floor (−4) → 0, not −1 (floor at zero)', () => {
    const { result } = scoreRound(emptyWall(), [{ row: 0, col: 0 }], 3, 2);
    // placement +1 (isolated), prevTotal 2 → 3, floor 3 tiles = -4 → -1 → clamped 0
    expect(result.placementPoints).toBe(1);
    expect(result.floorPenalty).toBe(-4);
    expect(result.totalAfter).toBe(0);
  });

  it('#8 a pattern line filled 3/4 causes no change (caller simply passes no placement)', () => {
    const { result, wallAfter } = scoreRound(emptyWall(), [], 0, 10);
    expect(result.placementPoints).toBe(0);
    expect(result.totalAfter).toBe(10);
    expect(wallAfter.flat().some(Boolean)).toBe(false);
  });

  it('does not mutate the input wall', () => {
    const w = emptyWall();
    scoreRound(w, [{ row: 2, col: 2 }], 0, 0);
    expect(w.flat().some(Boolean)).toBe(false);
  });
});

describe('endGameScore (fim de partida)', () => {
  it('an empty wall scores no bonus', () => {
    expect(endGameScore(emptyWall()).total).toBe(0);
  });

  it('a full first row scores +2', () => {
    const w = emptyWall();
    for (let c = 0; c < 5; c++) w[0][c] = true;
    const r = endGameScore(w);
    expect(r.completedRows).toEqual([0]);
    expect(r.rowPoints).toBe(2);
    expect(r.total).toBe(2);
  });

  it('a full first column scores +7', () => {
    const w = emptyWall();
    for (let row = 0; row < 5; row++) w[row][0] = true;
    const r = endGameScore(w);
    expect(r.completedCols).toEqual([0]);
    expect(r.colPoints).toBe(7);
  });

  it('all 5 tiles of a color score +10', () => {
    const w = emptyWall();
    for (let row = 0; row < 5; row++) w[row][colOfColor(row, 'blue')] = true;
    const r = endGameScore(w);
    expect(r.completedColors).toEqual(['blue']);
    expect(r.colorPoints).toBe(10);
  });

  it('a completely full wall scores 5×2 + 5×7 + 5×10 = 95', () => {
    const w = emptyWall().map((row) => row.map(() => true));
    const r = endGameScore(w);
    expect(r.completedRows.length).toBe(5);
    expect(r.completedCols.length).toBe(5);
    expect(r.completedColors.length).toBe(5);
    expect(r.total).toBe(10 + 35 + 50);
  });
});
