/**
 * Azul: Jardim da Rainha — pontuação pura (sem Angular).
 *
 * Regras do manual oficial (Plan B, 2021):
 *  - o placar começa no 15 e nunca fica negativo
 *  - 6 padrões valem 1 a 6 (árvore, pássaro, borboletas, flor, ramo, sinos)
 *  - 4 rodadas; em cada uma a roda indica 3 padrões/cores que pontuam por
 *    hexágono do jardim (o mesmo hexágono pode pontuar pela cor e pelo padrão),
 *    e cada pavilhão visível vale +1
 *  - custos em pontos: expansão do monte por 6; o primeiro a passar perde 1;
 *    ao passar, os hexágonos descartados tiram o valor do padrão
 *  - fim de jogo: +1 por coringa; −valor de cada peça que sobrou no estoque;
 *    cada grupo de 3+ hexágonos soma o valor dos padrões, e grupo de 6 dá +6
 */

export type GardenColor = 'blue' | 'purple' | 'lilac' | 'yellow' | 'lightgreen' | 'darkgreen';
export type GardenPattern = 'tree' | 'bird' | 'butterfly' | 'flower' | 'sprig' | 'bells';
/** o que a roda pontua: uma cor ou um padrão (os nomes não se repetem) */
export type GardenItem = GardenColor | GardenPattern;

export const GARDEN_COLORS: readonly GardenColor[] = ['blue', 'purple', 'lilac', 'yellow', 'lightgreen', 'darkgreen'];
export const GARDEN_PATTERNS: readonly GardenPattern[] = ['tree', 'bird', 'butterfly', 'flower', 'sprig', 'bells'];
/** o desenho lembra o valor: 1 árvore, 2 asas, 3 borboletas, 4 pétalas, 5 folhas, 6 sinos */
export const PATTERN_VALUE: Record<GardenPattern, number> = { tree: 1, bird: 2, butterfly: 3, flower: 4, sprig: 5, bells: 6 };

export const GARDEN_START = 15;
export const GARDEN_ROUNDS = 4;
export const GARDEN_EXPANSION_COST = 6;
export const GARDEN_GROUP_MIN = 3;
export const GARDEN_GROUP_MAX = 6;
export const GARDEN_GROUP6_BONUS = 6;
/** a roda mostra 3 itens pontuados por rodada */
export const GARDEN_WHEEL_SLOTS = 3;

export interface WheelSlot {
  /** cor ou padrão que a roda aponta (rodadas antigas não guardavam) */
  item?: GardenItem | null;
  /** hexágonos do jardim que combinam com o item da roda */
  count: number;
  /** pontos por hexágono impressos na roda */
  value: number;
}

export interface GardenRound {
  wheel: WheelSlot[];
  pavilions: number;
  /** expansões compradas do monte por 6 pontos */
  expansionsBought: number;
  firstToPass: boolean;
  /** soma dos valores dos hexágonos descartados ao passar */
  discardValue: number;
}

export interface GardenRoundResult extends GardenRound {
  wheelPoints: number;
  costs: number;
  totalBefore: number;
  totalAfter: number;
}

export function emptyGardenRound(): GardenRound {
  return {
    wheel: Array.from({ length: GARDEN_WHEEL_SLOTS }, () => ({ item: null, count: 0, value: 0 })),
    pavilions: 0,
    expansionsBought: 0,
    firstToPass: false,
    discardValue: 0,
  };
}

const n = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

export function scoreGardenRound(r: GardenRound, totalBefore: number): GardenRoundResult {
  const wheelPoints = r.wheel.reduce((s, w) => s + n(w.count) * n(w.value), 0) + n(r.pavilions);
  const costs = n(r.expansionsBought) * GARDEN_EXPANSION_COST + (r.firstToPass ? 1 : 0) + n(r.discardValue);
  // custos acontecem na fase de ações e a pontuação vem depois; o placar não fica negativo
  const afterCosts = Math.max(0, totalBefore - costs);
  return { ...r, wheelPoints, costs, totalBefore, totalAfter: afterCosts + wheelPoints };
}

export interface GardenFinal {
  jokers: number;
  /** soma dos valores das peças que sobraram no estoque */
  storageValue: number;
  /** soma dos grupos do jardim (ver `gardenGroups`) */
  groupPoints: number;
}

export function scoreGardenFinal(f: GardenFinal, totalBefore: number): { groupPoints: number; total: number } {
  const gp = n(f.groupPoints);
  return { groupPoints: gp, total: Math.max(0, totalBefore + n(f.jokers) - n(f.storageValue) + gp) };
}
