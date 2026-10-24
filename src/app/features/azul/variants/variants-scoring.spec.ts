import { describe, expect, it } from 'vitest';
import {
  emptyWindows,
  leftoverPoints,
  ornamentBonus,
  scoreWindow,
  sideBBonus,
  type SintraWindows,
} from './sintra-scoring';
import { chainSize, emptyBoard, pavilionEndGame, scorePavilionRound, PAVILION_STARS } from './pavilion-scoring';
import { scoreGardenFinal, scoreGardenRound, emptyGardenRound } from './garden-scoring';
import { ELEMENTS, cellKey, countMatching, gardenGroups, neighbors, pavilionCount, type GardenCells } from './garden-grid';

describe('Vitrais de Sintra', () => {
  it('exemplo do manual: janela de 2 + janelas à direita com peça (1 e 2) = 5', () => {
    const w: SintraWindows = emptyWindows();
    w[5][0] = 'pink';
    w[7][0] = 'blue';
    w[4][0] = 'yellow'; // a peça que acabou de entrar
    expect(scoreWindow(w, 4)).toEqual({ points: 5, right: [5, 7] });
  });

  it('janelas à direita vazias não somam; a própria janela conta mesmo na 2ª peça', () => {
    const w = emptyWindows();
    w[0] = ['orange', 'orange'];
    expect(scoreWindow(w, 0).points).toBe(4);
  });

  it('lado A, exemplo do manual: 2 ornamentos cercados (2 × 10) + um com 2 peças (3) = 23', () => {
    const w = emptyWindows();
    w[0] = ['pink', 'pink'];
    w[1] = ['blue', 'blue'];
    w[2] = ['white', 'white'];
    w[3] = ['yellow', 'orange'];
    w[6] = ['orange', null];
    w[7] = ['blue', null];
    const o = ornamentBonus(w);
    expect(o.filled).toEqual([4, 4, 0, 2]);
    expect(o.total).toBe(23);
  });

  it('ornamento com 3 molduras vale 6; com 1 vale 0', () => {
    const w = emptyWindows();
    w[0] = ['pink', 'pink'];
    w[1] = ['blue', null];
    w[2] = ['white', null];
    expect(ornamentBonus(w).points).toEqual([6, 0, 0, 0]);
  });

  it('lado B, exemplo do manual: 4 janelas completas × 5 peças laranja = 20', () => {
    const w = emptyWindows();
    w[0] = ['orange', 'orange'];
    w[1] = ['orange', 'white'];
    w[2] = ['yellow', 'pink'];
    w[3] = ['orange', 'yellow'];
    w[5] = ['pink', 'orange'];
    expect(sideBBonus(w)).toEqual({ completed: 5, color: 'orange', count: 5, total: 25 });
    w[5] = ['pink', null];
    w[6] = ['orange', null];
    expect(sideBBonus(w)).toEqual({ completed: 4, color: 'orange', count: 5, total: 20 });
  });

  it('peças que sobraram: 7 peças nas faixas = 2 pontos', () => {
    expect(leftoverPoints(7)).toBe(2);
    expect(leftoverPoints(2)).toBe(0);
  });
});

describe('Pavilhão de Verão', () => {
  it('azulejo vale 1 + os ligados a ele na mesma estrela, dando a volta no anel', () => {
    const s = [true, false, false, false, true, true];
    expect(chainSize(s, 0)).toBe(3); // 5-6-1 ligados pela volta
    expect(chainSize([true, true, true, true, true, true], 2)).toBe(6);
    expect(chainSize([false, false, true, false, false, false], 2)).toBe(1);
  });

  it('pontua na ordem em que os azulejos são colocados', () => {
    const { round } = scorePavilionRound(
      emptyBoard(),
      [
        { star: 'red', index: 0 },
        { star: 'red', index: 1 },
        { star: 'red', index: 2 },
      ],
      0,
      0,
      5,
    );
    expect(round.placements.map((p) => p.points)).toEqual([1, 2, 3]);
    expect(round.totalAfter).toBe(11);
  });

  it('primeiro jogador perde 1 por azulejo pego, sem passar do 1; descartes tiram 1 cada', () => {
    const { round } = scorePavilionRound(emptyBoard(), [], 7, 2, 5);
    expect(round.firstPlayerLoss).toBe(4);
    expect(round.totalAfter).toBe(1 - 2);
  });

  it('fim de jogo: estrela roxa (20), centro (12) e todos os 1 e 2 (+4 +8)', () => {
    const b = emptyBoard();
    b.purple = [true, true, true, true, true, true];
    b.center = [true, true, true, true, true, true];
    for (const s of PAVILION_STARS) {
      b[s][0] = true;
      b[s][1] = true;
    }
    const eg = pavilionEndGame(b);
    expect(eg.stars).toEqual(['center', 'purple']);
    expect(eg.numbers).toEqual([1, 2]);
    expect(eg.total).toBe(12 + 20 + 4 + 8);
  });
});

describe('Jardim da Rainha', () => {
  // fileira na linha 0, colunas 0..n (colunas vizinhas são sempre vizinhas na grade)
  const row = (tiles: [string, string][]): GardenCells =>
    Object.fromEntries(tiles.map(([color, pattern], i) => [cellKey(i, 0), { color, pattern }])) as GardenCells;

  it('vizinhos na grade de hexágonos deitados: 6 no meio, menos na borda', () => {
    expect(neighbors(cellKey(5, 4)).sort()).toEqual(['4,4', '4,5', '5,3', '5,5', '6,4', '6,5'].sort());
    expect(neighbors(cellKey(0, 0))).toHaveLength(2);
    expect(Object.values(ELEMENTS).filter((e) => e === 'fountain')).toHaveLength(1);
    expect(Object.keys(ELEMENTS)).toHaveLength(7);
  });

  it('grupos do exemplo do manual somam o valor de cada hexágono', () => {
    const blue = gardenGroups(row([['blue', 'tree'], ['blue', 'bird'], ['blue', 'butterfly'], ['blue', 'bells']]));
    expect(blue).toEqual([expect.objectContaining({ kind: 'color', item: 'blue', points: 12 })]);
    const trees = gardenGroups(row([['blue', 'tree'], ['purple', 'tree'], ['lilac', 'tree'], ['yellow', 'tree'], ['darkgreen', 'tree']]));
    expect(trees).toEqual([expect.objectContaining({ kind: 'pattern', item: 'tree', points: 5 })]);
    const butterflies = gardenGroups(row([['blue', 'butterfly'], ['purple', 'butterfly'], ['lilac', 'butterfly']]));
    expect(butterflies[0].points).toBe(9);
  });

  it('grupo de 6 ganha +6; grupo de 2 não pontua; um hexágono conta pela cor e pelo padrão', () => {
    const six = gardenGroups(
      row([['lilac', 'tree'], ['lilac', 'bird'], ['lilac', 'butterfly'], ['lilac', 'flower'], ['lilac', 'sprig'], ['lilac', 'bells']]),
    );
    expect(six).toEqual([expect.objectContaining({ base: 21, bonus: 6, points: 27 })]);
    expect(gardenGroups(row([['blue', 'tree'], ['purple', 'tree']]))).toEqual([]);
    // azul-pássaro está no grupo azul e no grupo dos pássaros
    const both = gardenGroups(row([['blue', 'tree'], ['blue', 'butterfly'], ['blue', 'bird'], ['yellow', 'bird'], ['purple', 'bird']]));
    expect(both.map((g) => `${g.item}:${g.points}`).sort()).toEqual(['bird:6', 'blue:6']);
  });

  it('a roda conta o hexágono pela cor e pelo padrão; pavilhões contam à parte', () => {
    const cells: GardenCells = { ...row([['blue', 'tree'], ['yellow', 'tree'], ['blue', 'bells']]), '9,8': { pavilion: true } };
    expect(countMatching(cells, 'blue')).toBe(2);
    expect(countMatching(cells, 'tree')).toBe(2);
    expect(pavilionCount(cells)).toBe(1);
  });

  it('rodada: roda + pavilhões, custos antes, placar nunca negativo', () => {
    const r = emptyGardenRound();
    r.wheel = [
      { item: 'blue', count: 3, value: 2 },
      { item: 'tree', count: 1, value: 4 },
      { item: 'bells', count: 0, value: 3 },
    ];
    r.pavilions = 2;
    r.expansionsBought = 1;
    r.firstToPass = true;
    expect(scoreGardenRound(r, 15)).toMatchObject({ wheelPoints: 12, costs: 7, totalAfter: 20 });
    r.discardValue = 30;
    expect(scoreGardenRound(r, 15).totalAfter).toBe(12);
  });

  it('final: coringas +1, estoque −valor, grupos', () => {
    const f = scoreGardenFinal({ jokers: 2, storageValue: 4, groupPoints: 9 }, 40);
    expect(f).toEqual({ groupPoints: 9, total: 47 });
  });
});
