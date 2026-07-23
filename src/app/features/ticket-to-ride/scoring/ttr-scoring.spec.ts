import { describe, it, expect } from 'vitest';
import { findVariant, type TtrVariant } from './ttr-variants';
import { routePoints, routesTotal, ticketsTotal, bonusesTotal, scoreMatch, type TtrState } from './ttr-scoring';

const usa = findVariant('usa')!;
const europa = findVariant('europa')!;
const nordic = findVariant('nordic')!;
const africa = findVariant('africa')!;
const japan = findVariant('japan')!;

function empty(): TtrState {
  return { routes: [], tickets: [], bonuses: {} };
}

describe('variant route tables are data', () => {
  it('USA uses the classic 1/2/4/7/10/15 table', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => usa.routeTable[n])).toEqual([1, 2, 4, 7, 10, 15]);
  });

  it('Europa has 6→15 and 8→21 and no route of 5', () => {
    expect(europa.routeTable[6]).toBe(15);
    expect(europa.routeTable[8]).toBe(21);
    expect(europa.routeTable[5]).toBeUndefined();
  });

  it('Nordic has a route of 9 → 27', () => {
    expect(nordic.routeTable[9]).toBe(27);
  });
});

describe('route scoring', () => {
  it('sums the variant table per claimed route', () => {
    const state: TtrState = { ...empty(), routes: [
      { id: 'a', length: 6 }, // +15
      { id: 'b', length: 4 }, // +7
    ] };
    expect(routesTotal(usa, state.routes)).toBe(22);
  });

  it('Heart of Africa terrain doubling swaps in the doubled table', () => {
    expect(routePoints(africa, { id: 'x', length: 6 })).toBe(15);
    expect(routePoints(africa, { id: 'x', length: 6, terrain: true })).toBe(30);
  });
});

describe('destination tickets', () => {
  it('completed add value, uncompleted subtract value', () => {
    expect(ticketsTotal([
      { id: 't1', value: 11, completed: true },
      { id: 't2', value: 8, completed: false },
    ])).toBe(3);
  });
});

describe('bonuses', () => {
  it('toggle bonus awards fixed value only when on', () => {
    expect(bonusesTotal(usa, { longest: true })).toBe(10);
    expect(bonusesTotal(usa, { longest: false })).toBe(0);
  });

  it('counter bonus multiplies by unit (Europe stations ×4, Nederland loans ×-5)', () => {
    expect(bonusesTotal(europa, { stations: 3 })).toBe(12);
    const nederland = findVariant('nederland')! as TtrVariant;
    expect(bonusesTotal(nederland, { loans: 2, money: 0 })).toBe(-10);
  });

  it('numeric bonus can be negative (Japan bullet-train ranking)', () => {
    expect(bonusesTotal(japan, { bullet: -7 })).toBe(-7);
  });
});

describe('final score', () => {
  it('can be negative and is not clamped', () => {
    const state: TtrState = {
      routes: [{ id: 'a', length: 1 }], // +1
      tickets: [{ id: 't', value: 11, completed: false }], // -11
      bonuses: {},
    };
    expect(scoreMatch(usa, state)).toBe(-10);
  });

  it('combines routes + tickets + bonuses', () => {
    const state: TtrState = {
      routes: [{ id: 'a', length: 6 }, { id: 'b', length: 3 }], // 15 + 4
      tickets: [{ id: 't1', value: 10, completed: true }, { id: 't2', value: 5, completed: false }], // +10 -5
      bonuses: { longest: true }, // +10
    };
    expect(scoreMatch(usa, state)).toBe(15 + 4 + 10 - 5 + 10);
  });
});
