/**
 * 7 Wonders — pontuação pura das três versões (sem dependência de Angular).
 * Cada função devolve o total e as partes, na ordem da planilha oficial.
 */

import { ARISTOTLE_SET_VALUE, SET_VALUE, scienceScore, type ScienceInput, type ScienceResult } from './sw-science';

/** chave de tradução da categoria + pontos */
export interface SwPart {
  key: string;
  points: number;
}

export interface SwResult {
  total: number;
  parts: SwPart[];
  science?: ScienceResult;
}

const sum = (parts: SwPart[]) => parts.reduce((s, p) => s + p.points, 0);
const n = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);

/* ------------------------------------------------------------------ */
/* 7 Wonders (base, 1ª e 2ª edição) + expansões                       */
/* ------------------------------------------------------------------ */

export type MilitaryToken = 'v1' | 'v3' | 'v5' | 'd1';
export type NavalToken = 'v1' | 'v3' | 'v5' | 'v7' | 'd1' | 'd2' | 'd3';

export const MILITARY_VALUES: Record<MilitaryToken, number> = { v1: 1, v3: 3, v5: 5, d1: -1 };
export const NAVAL_VALUES: Record<NavalToken, number> = { v1: 1, v3: 3, v5: 5, v7: 7, d1: -1, d2: -2, d3: -3 };
/** Torre de Babel: 1, 2 ou 3 peças construídas */
export const BABEL_TOWER_VP = [0, 2, 5, 10];

export interface SwBaseState {
  expansions: { leaders: boolean; cities: boolean; armada: boolean; babel: boolean; edifice: boolean };
  military: Record<MilitaryToken, number>;
  coins: number;
  wonder: number;
  civilian: number;
  commercial: number;
  guilds: number;
  science: ScienceInput;
  /* Leaders */
  leaders: number;
  aristotle: boolean;
  alexander: boolean;
  midas: boolean;
  /* Cities */
  cities: number;
  debt: number;
  /* Armada */
  naval: Record<NavalToken, number>;
  islands: number;
  fleet: number;
  /* Babel */
  babelTiles: number;
  babelProjects: number;
  /* Edifice */
  edifice: number;
}

export function emptyBase(): SwBaseState {
  return {
    expansions: { leaders: false, cities: false, armada: false, babel: false, edifice: false },
    military: { v1: 0, v3: 0, v5: 0, d1: 0 },
    coins: 0,
    wonder: 0,
    civilian: 0,
    commercial: 0,
    guilds: 0,
    science: { tablet: 0, compass: 0, gear: 0, wild: 0 },
    leaders: 0,
    aristotle: false,
    alexander: false,
    midas: false,
    cities: 0,
    debt: 0,
    naval: { v1: 0, v3: 0, v5: 0, v7: 0, d1: 0, d2: 0, d3: 0 },
    islands: 0,
    fleet: 0,
    babelTiles: 0,
    babelProjects: 0,
    edifice: 0,
  };
}

export function tokenSum<K extends string>(counts: Record<K, number>, values: Record<K, number>): number {
  return (Object.keys(values) as K[]).reduce((s, k) => s + n(counts[k]) * values[k], 0);
}

export function militaryVictories(m: Record<MilitaryToken, number>): number {
  return n(m.v1) + n(m.v3) + n(m.v5);
}

export function scoreBase(s: SwBaseState): SwResult {
  const ex = s.expansions;
  const coinVp = Math.floor(Math.max(0, n(s.coins)) / 3);
  const science = scienceScore(s.science, ex.leaders && s.aristotle ? ARISTOTLE_SET_VALUE : SET_VALUE);

  const parts: SwPart[] = [
    { key: 'sw.cat.military', points: tokenSum(s.military, MILITARY_VALUES) },
    // Cities: dívidas (−1 cada) entram na linha do tesouro
    { key: 'sw.cat.treasury', points: coinVp - (ex.cities ? Math.max(0, n(s.debt)) : 0) },
    { key: 'sw.cat.wonder', points: n(s.wonder) },
    { key: 'sw.cat.civilian', points: n(s.civilian) },
    { key: 'sw.cat.commercial', points: n(s.commercial) },
    { key: 'sw.cat.guilds', points: n(s.guilds) },
    { key: 'sw.cat.science', points: science.points },
  ];

  if (ex.leaders) {
    const alexander = s.alexander ? militaryVictories(s.military) : 0;
    const midas = s.midas ? coinVp : 0;
    parts.push({ key: 'sw.cat.leaders', points: n(s.leaders) + alexander + midas });
  }
  if (ex.cities) parts.push({ key: 'sw.cat.cities', points: n(s.cities) });
  if (ex.armada) {
    parts.push({ key: 'sw.cat.naval', points: tokenSum(s.naval, NAVAL_VALUES) });
    parts.push({ key: 'sw.cat.islands', points: n(s.islands) });
    parts.push({ key: 'sw.cat.fleet', points: n(s.fleet) });
  }
  if (ex.babel) {
    parts.push({ key: 'sw.cat.babelTower', points: BABEL_TOWER_VP[Math.max(0, Math.min(3, n(s.babelTiles)))] });
    parts.push({ key: 'sw.cat.babelProjects', points: n(s.babelProjects) });
  }
  if (ex.edifice) parts.push({ key: 'sw.cat.edifice', points: n(s.edifice) });

  return { total: sum(parts), parts, science };
}

/* ------------------------------------------------------------------ */
/* 7 Wonders Duel (+ Pantheon, Agora)                                 */
/* ------------------------------------------------------------------ */

export type DuelVictory = 'civilian' | 'military' | 'science' | 'political';
/** pontos pela posição do peão de conflito */
export const DUEL_MILITARY_ZONES = [0, 2, 5, 10];
/** Pantheon: Grandes Templos construídos (1, 2 ou 3) */
export const DUEL_TEMPLE_VP = [0, 5, 12, 21];

export interface SwDuelState {
  expansions: { pantheon: boolean; agora: boolean };
  civilian: number;
  science: number;
  commercial: number;
  guilds: number;
  wonders: number;
  coins: number;
  militaryZone: number;
  agriculture: boolean;
  philosophy: boolean;
  mathematics: boolean;
  progressCount: number;
  progressOther: number;
  temples: number;
  divinities: number;
  senate: number;
  conspiracies: number;
  victory: DuelVictory;
}

export function emptyDuel(): SwDuelState {
  return {
    expansions: { pantheon: false, agora: false },
    civilian: 0,
    science: 0,
    commercial: 0,
    guilds: 0,
    wonders: 0,
    coins: 0,
    militaryZone: 0,
    agriculture: false,
    philosophy: false,
    mathematics: false,
    progressCount: 1,
    progressOther: 0,
    temples: 0,
    divinities: 0,
    senate: 0,
    conspiracies: 0,
    victory: 'civilian',
  };
}

/** Agricultura +4, Filosofia +7, Matemática +3 por ficha de progresso (incluindo ela). */
export function duelProgress(s: SwDuelState): number {
  return (
    n(s.progressOther) +
    (s.agriculture ? 4 : 0) +
    (s.philosophy ? 7 : 0) +
    (s.mathematics ? 3 * Math.max(1, n(s.progressCount)) : 0)
  );
}

export function scoreDuel(s: SwDuelState): SwResult {
  const zone = DUEL_MILITARY_ZONES.includes(n(s.militaryZone)) ? n(s.militaryZone) : 0;
  const parts: SwPart[] = [
    { key: 'sw.cat.civilian', points: n(s.civilian) },
    { key: 'sw.cat.scienceCards', points: n(s.science) },
    { key: 'sw.cat.commercial', points: n(s.commercial) },
    { key: 'sw.cat.guilds', points: n(s.guilds) },
    { key: 'sw.cat.wonder', points: n(s.wonders) },
    { key: 'sw.cat.progress', points: duelProgress(s) },
    { key: 'sw.cat.treasury', points: Math.floor(Math.max(0, n(s.coins)) / 3) },
    { key: 'sw.cat.military', points: zone },
  ];
  if (s.expansions.pantheon) {
    parts.push({ key: 'sw.cat.temples', points: DUEL_TEMPLE_VP[Math.max(0, Math.min(3, n(s.temples)))] });
    parts.push({ key: 'sw.cat.divinities', points: n(s.divinities) });
  }
  if (s.expansions.agora) {
    parts.push({ key: 'sw.cat.senate', points: n(s.senate) });
    parts.push({ key: 'sw.cat.conspiracies', points: n(s.conspiracies) });
  }
  return { total: sum(parts), parts };
}

/* ------------------------------------------------------------------ */
/* 7 Wonders Architects                                               */
/* ------------------------------------------------------------------ */

/** cada ficha de vitória militar vale 3 pontos */
export const ARCH_MILITARY_VP = 3;
export const ARCH_CAT_VP = 2;

export interface SwArchitectsState {
  wonder: number;
  wonderComplete: boolean;
  blue: number;
  catIcons: number;
  cat: boolean;
  militaryTokens: number;
  progressCount: number;
  strategy: boolean;
  education: boolean;
  decor: boolean;
  politics: boolean;
  progressOther: number;
}

export function emptyArchitects(): SwArchitectsState {
  return {
    wonder: 0,
    wonderComplete: false,
    blue: 0,
    catIcons: 0,
    cat: false,
    militaryTokens: 0,
    progressCount: 0,
    strategy: false,
    education: false,
    decor: false,
    politics: false,
    progressOther: 0,
  };
}

/**
 * Fichas de progresso que pontuam no fim: Estratégia (+1 por ficha de vitória
 * militar), Educação (+2 por ficha de progresso, incluindo ela), Decoração (+4
 * com a maravilha em construção, +6 se completa) e Política (+1 por ícone de
 * gato nas cartas azuis). Outras (ex.: Cultura) entram como valor manual.
 */
export function architectsProgress(s: SwArchitectsState): number {
  return (
    n(s.progressOther) +
    (s.strategy ? n(s.militaryTokens) : 0) +
    (s.education ? 2 * Math.max(1, n(s.progressCount)) : 0) +
    (s.decor ? (s.wonderComplete ? 6 : 4) : 0) +
    (s.politics ? n(s.catIcons) : 0)
  );
}

export function scoreArchitects(s: SwArchitectsState): SwResult {
  const parts: SwPart[] = [
    { key: 'sw.cat.wonder', points: n(s.wonder) },
    { key: 'sw.cat.civilian', points: n(s.blue) },
    { key: 'sw.cat.military', points: ARCH_MILITARY_VP * Math.max(0, n(s.militaryTokens)) },
    { key: 'sw.cat.cat', points: s.cat ? ARCH_CAT_VP : 0 },
    { key: 'sw.cat.progress', points: architectsProgress(s) },
  ];
  return { total: sum(parts), parts };
}
