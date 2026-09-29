import { describe, it, expect } from 'vitest';
import { scienceScore } from './sw-science';
import {
  architectsProgress,
  emptyArchitects,
  emptyBase,
  emptyDuel,
  scoreArchitects,
  scoreBase,
  scoreDuel,
  type SwBaseState,
} from './sw-scoring';
import { pushCapped } from '../../../core/services/match-history';

describe('ciência (7 Wonders)', () => {
  it('um de cada símbolo = 1+1+1 + 7 do conjunto = 10', () => {
    expect(scienceScore({ tablet: 1, compass: 1, gear: 1, wild: 0 }).points).toBe(10);
  });

  it('três iguais = 3² = 9, sem conjunto', () => {
    const r = scienceScore({ tablet: 3, compass: 0, gear: 0, wild: 0 });
    expect(r.points).toBe(9);
    expect(r.sets).toBe(0);
  });

  it('coringa completa o conjunto quando isso vale mais (2,2,1 + 1 → 2,2,2 = 26)', () => {
    const r = scienceScore({ tablet: 2, compass: 2, gear: 1, wild: 1 });
    expect(r.points).toBe(26);
    expect(r.wildTo.gear).toBe(1);
  });

  it('coringa reforça o maior grupo quando isso vale mais (4,0,0 + 1 → 25)', () => {
    const r = scienceScore({ tablet: 4, compass: 0, gear: 0, wild: 1 });
    expect(r.points).toBe(25);
    expect(r.wildTo.tablet).toBe(1);
  });

  it('Aristóteles: conjunto passa a valer 10 (3 coringas → 1,1,1 = 13)', () => {
    expect(scienceScore({ tablet: 0, compass: 0, gear: 0, wild: 3 }, 10).points).toBe(13);
    // sem Aristóteles, 1,1,1 = 10 ainda ganha de 3,0,0 = 9
    expect(scienceScore({ tablet: 0, compass: 0, gear: 0, wild: 3 }).points).toBe(10);
  });

  it('dois conjuntos completos: 2,2,2 = 12 + 14 = 26', () => {
    expect(scienceScore({ tablet: 2, compass: 2, gear: 2, wild: 0 }).points).toBe(26);
  });
});

describe('7 Wonders base', () => {
  const base = (patch: Partial<SwBaseState>): SwBaseState => ({ ...emptyBase(), ...patch });

  it('militar soma fichas (+1/+3/+5) e desconta derrotas (−1)', () => {
    const r = scoreBase(base({ military: { v1: 1, v3: 1, v5: 2, d1: 2 } }));
    expect(r.parts.find((p) => p.key === 'sw.cat.military')!.points).toBe(1 + 3 + 10 - 2);
  });

  it('tesouro: 1 ponto a cada 3 moedas (arredondado para baixo)', () => {
    expect(scoreBase(base({ coins: 14 })).parts.find((p) => p.key === 'sw.cat.treasury')!.points).toBe(4);
  });

  it('Cities: dívidas −1 cada na linha do tesouro (5 moedas, 3 dívidas → −2)', () => {
    const r = scoreBase(base({ coins: 5, debt: 3, expansions: { ...emptyBase().expansions, cities: true } }));
    expect(r.parts.find((p) => p.key === 'sw.cat.treasury')!.points).toBe(-2);
  });

  it('dívidas não contam se Cities estiver desligada', () => {
    expect(scoreBase(base({ coins: 5, debt: 3 })).parts.find((p) => p.key === 'sw.cat.treasury')!.points).toBe(1);
  });

  it('Leaders: Alexandre +1 por ficha de vitória, Midas +1 a cada 3 moedas', () => {
    const r = scoreBase(
      base({
        expansions: { ...emptyBase().expansions, leaders: true },
        military: { v1: 2, v3: 1, v5: 0, d1: 1 },
        coins: 9,
        leaders: 5,
        alexander: true,
        midas: true,
      }),
    );
    expect(r.parts.find((p) => p.key === 'sw.cat.leaders')!.points).toBe(5 + 3 + 3);
  });

  it('Armada: fichas navais +1/+3/+5/+7 e −1/−2/−3', () => {
    const r = scoreBase(
      base({
        expansions: { ...emptyBase().expansions, armada: true },
        naval: { v1: 1, v3: 0, v5: 1, v7: 1, d1: 0, d2: 1, d3: 1 },
      }),
    );
    expect(r.parts.find((p) => p.key === 'sw.cat.naval')!.points).toBe(1 + 5 + 7 - 2 - 3);
  });

  it('Babel: torre com 1/2/3 peças vale 2/5/10', () => {
    const on = { ...emptyBase().expansions, babel: true };
    const tower = (tiles: number) =>
      scoreBase(base({ expansions: on, babelTiles: tiles })).parts.find((p) => p.key === 'sw.cat.babelTower')!.points;
    expect([tower(0), tower(1), tower(2), tower(3)]).toEqual([0, 2, 5, 10]);
  });

  it('linhas de expansão só aparecem quando a expansão está ligada', () => {
    const keys = scoreBase(emptyBase()).parts.map((p) => p.key);
    expect(keys).not.toContain('sw.cat.leaders');
    expect(keys).not.toContain('sw.cat.naval');
    expect(keys).toHaveLength(7);
  });

  it('total pode ficar negativo (militar e dívidas)', () => {
    const r = scoreBase(
      base({ military: { v1: 0, v3: 0, v5: 0, d1: 6 }, debt: 4, expansions: { ...emptyBase().expansions, cities: true } }),
    );
    expect(r.total).toBe(-10);
  });
});

describe('7 Wonders Duel', () => {
  it('soma categorias e converte a posição militar (0/2/5/10)', () => {
    const r = scoreDuel({ ...emptyDuel(), civilian: 12, science: 4, coins: 10, militaryZone: 5 });
    expect(r.total).toBe(12 + 4 + 3 + 5);
  });

  it('fichas de progresso: Agricultura +4, Filosofia +7, Matemática +3 por ficha', () => {
    const r = scoreDuel({ ...emptyDuel(), agriculture: true, philosophy: true, mathematics: true, progressCount: 4 });
    expect(r.parts.find((p) => p.key === 'sw.cat.progress')!.points).toBe(4 + 7 + 12);
  });

  it('Pantheon: Grandes Templos 1/2/3 = 5/12/21', () => {
    const r = scoreDuel({ ...emptyDuel(), expansions: { pantheon: true, agora: false }, temples: 3 });
    expect(r.parts.find((p) => p.key === 'sw.cat.temples')!.points).toBe(21);
  });
});

describe('7 Wonders Architects', () => {
  it('ficha de vitória militar vale 3 e o gato vale 2', () => {
    const r = scoreArchitects({ ...emptyArchitects(), militaryTokens: 3, cat: true, wonder: 9, blue: 6 });
    expect(r.total).toBe(9 + 6 + 9 + 2);
  });

  it('Decoração: +4 com a maravilha incompleta, +6 se completa', () => {
    expect(architectsProgress({ ...emptyArchitects(), decor: true })).toBe(4);
    expect(architectsProgress({ ...emptyArchitects(), decor: true, wonderComplete: true })).toBe(6);
  });

  it('Estratégia, Educação e Política usam as contagens informadas', () => {
    const s = { ...emptyArchitects(), strategy: true, education: true, politics: true, militaryTokens: 2, progressCount: 3, catIcons: 4 };
    expect(architectsProgress(s)).toBe(2 + 6 + 4);
  });
});

describe('histórico', () => {
  it('guarda no máximo 10, a mais recente primeiro', () => {
    let list: number[] = [];
    for (let i = 1; i <= 12; i++) list = pushCapped(list, i);
    expect(list).toHaveLength(10);
    expect(list[0]).toBe(12);
    expect(list[9]).toBe(3);
  });
});
