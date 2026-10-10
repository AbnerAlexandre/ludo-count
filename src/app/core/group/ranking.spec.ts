import { describe, expect, it } from 'vitest';
import { nameKey, rankStandings, sessionBoard } from './ranking';
import type { SessionRecord } from './group-models';

describe('rankStandings', () => {
  it('ordena por pontos e numera 1, 2, 3', () => {
    const r = rankStandings([
      { id: 'a', total: 80 },
      { id: 'b', total: 120 },
      { id: 'c', total: 95 },
    ]);
    expect(r.map((x) => [x.id, x.rank])).toEqual([
      ['b', 1],
      ['c', 2],
      ['a', 3],
    ]);
    expect(r.every((x) => !x.shared && x.decidedBy === undefined)).toBe(true);
  });

  it('empate sem desempate divide a posição e pula a seguinte (1, 2, 2, 4)', () => {
    const r = rankStandings([
      { id: 'a', total: 100 },
      { id: 'b', total: 90 },
      { id: 'c', total: 90 },
      { id: 'd', total: 50 },
    ]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 4]);
    expect(r[1].shared && r[2].shared).toBe(true);
  });

  it('desempate oficial separa quem empatou em pontos e diz qual critério decidiu', () => {
    // Ticket to Ride: mais bilhetes completos, depois caminho mais longo
    const r = rankStandings([
      { id: 'ana', total: 110, tiebreak: [4, 0] },
      { id: 'bia', total: 110, tiebreak: [4, 1] },
      { id: 'caio', total: 110, tiebreak: [6, 0] },
    ]);
    expect(r.map((x) => x.id)).toEqual(['caio', 'bia', 'ana']);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3]);
    expect(r[0].decidedBy).toBe(0); // caio passou pelos bilhetes
    expect(r[2].decidedBy).toBe(1); // ana ficou atrás de bia pelo caminho mais longo
  });

  it('vitória imediata fica à frente mesmo com menos pontos (Duel)', () => {
    const r = rankStandings([
      { id: 'a', total: 70 },
      { id: 'b', total: 31, forced: true },
    ]);
    expect(r[0]).toMatchObject({ id: 'b', rank: 1 });
    expect(r[1]).toMatchObject({ id: 'a', rank: 2 });
  });

  it('ordem manual resolve o empate que a regra não decide pelos dados', () => {
    const items = [
      { id: 'a', total: 40 },
      { id: 'b', total: 40 },
    ];
    expect(rankStandings(items).map((x) => x.rank)).toEqual([1, 1]);
    const r = rankStandings(items, ['b']);
    expect(r.map((x) => [x.id, x.rank, x.decidedBy])).toEqual([
      ['b', 1, -1],
      ['a', 2, -1],
    ]);
  });

  it('pontuação negativa também ordena certo', () => {
    const r = rankStandings([
      { id: 'a', total: -12 },
      { id: 'b', total: 3 },
    ]);
    expect(r[0].id).toBe('b');
  });
});

describe('sessionBoard', () => {
  const rec = (id: string, results: Array<[string, string, number, number]>): SessionRecord => ({
    id,
    date: '2026-10-09T20:00:00Z',
    variantId: 'usa',
    results: results.map(([playerId, name, total, rank]) => ({ playerId, name, color: '#fff', total, rank })),
  });

  it('soma vitórias, pontos, partidas e média por jogador', () => {
    const board = sessionBoard([
      rec('m2', [
        ['a', 'Ana', 90, 2],
        ['b', 'Bia', 120, 1],
      ]),
      rec('m1', [
        ['a', 'Ana', 130, 1],
        ['b', 'Bia', 100, 2],
      ]),
    ]);
    expect(board).toEqual([
      { playerId: 'b', name: 'Bia', color: '#fff', wins: 1, points: 220, matches: 2, best: 120, avg: 110, pos: 1 },
      { playerId: 'a', name: 'Ana', color: '#fff', wins: 1, points: 220, matches: 2, best: 130, avg: 110, pos: 1 },
    ].sort((x, y) => x.name.localeCompare(y.name)));
  });

  it('quem venceu mais fica na frente, mesmo com menos pontos', () => {
    const board = sessionBoard([
      rec('m2', [
        ['a', 'Ana', 60, 1],
        ['b', 'Bia', 59, 2],
      ]),
      rec('m1', [
        ['a', 'Ana', 61, 1],
        ['b', 'Bia', 200, 2],
      ]),
    ]);
    expect(board.map((r) => [r.name, r.pos, r.wins])).toEqual([
      ['Ana', 1, 2],
      ['Bia', 2, 0],
    ]);
  });

  it('empate em 1º conta vitória para os dois', () => {
    const board = sessionBoard([
      rec('m1', [
        ['a', 'Ana', 50, 1],
        ['b', 'Bia', 50, 1],
      ]),
    ]);
    expect(board.every((r) => r.wins === 1)).toBe(true);
  });

  it('usa o nome mais recente de cada jogador', () => {
    const board = sessionBoard([rec('m2', [['a', 'Ana Paula', 10, 1]]), rec('m1', [['a', 'ana', 10, 1]])]);
    expect(board[0].name).toBe('Ana Paula');
  });
});

describe('nameKey', () => {
  it('ignora caixa, acentos e espaços extras', () => {
    expect(nameKey('  José  Antônio ')).toBe(nameKey('jose antonio'));
  });
});
