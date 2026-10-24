/**
 * Azul: Pavilhão de Verão — pontuação pura (sem Angular).
 *
 * Regras do manual oficial (Next Move, 2019):
 *  - o placar começa no 5
 *  - 7 estrelas (6 de uma cor + a multicolorida do centro), 6 casas numeradas de 1 a 6
 *  - cada azulejo colocado vale 1 + 1 por azulejo ligado a ele na mesma estrela
 *  - o primeiro a pegar do centro perde 1 ponto por azulejo pego (sem passar do 1)
 *  - no fim da rodada guarda-se até 4 azulejos; cada descartado tira 1 ponto
 *  - fim de jogo: estrelas completas (centro 12, vermelha 14, azul 15, amarela 16,
 *    laranja 17, verde 18, roxa 20), todos os 1/2/3/4 cobertos (+4/+8/+12/+16) e
 *    −1 por azulejo que sobrou nos cantos
 */

export type PavilionColor = 'red' | 'blue' | 'yellow' | 'orange' | 'green' | 'purple';
export type PavilionStar = PavilionColor | 'center';

export const PAVILION_COLORS: readonly PavilionColor[] = ['red', 'blue', 'yellow', 'orange', 'green', 'purple'];
/** ordem de exibição: centro e as 6 estrelas em volta, no sentido horário a partir do alto à esquerda */
export const PAVILION_STARS: readonly PavilionStar[] = ['center', 'orange', 'red', 'blue', 'yellow', 'green', 'purple'];

export const PAVILION_START = 5;
export const PAVILION_ROUNDS = 6;
export const PAVILION_KEEP = 4;
export const PAVILION_SPACES = 6;

/** cor curinga de cada rodada (1ª a 6ª) */
export const PAVILION_WILD: readonly PavilionColor[] = ['purple', 'green', 'orange', 'yellow', 'blue', 'red'];

export const PAVILION_STAR_BONUS: Record<PavilionStar, number> = {
  center: 12,
  red: 14,
  blue: 15,
  yellow: 16,
  orange: 17,
  green: 18,
  purple: 20,
};
/** cobrir todas as casas de valor 1, 2, 3 ou 4 (nas 7 estrelas) */
export const PAVILION_NUMBER_BONUS: Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16 };

/** casa ocupada? índice i = casa de valor i + 1, em volta da estrela */
export type PavilionBoard = Record<PavilionStar, boolean[]>;

export interface PavilionPlacement {
  star: PavilionStar;
  /** 0..5 (valor da casa = index + 1) */
  index: number;
  /** cor escolhida para a estrela do centro (uma de cada) */
  color?: PavilionColor;
}

export interface PavilionPlacementScore extends PavilionPlacement {
  /** tamanho do grupo ligado, contando o próprio azulejo */
  points: number;
}

export interface PavilionRound {
  /** azulejos pegos ao tirar o marcador de primeiro jogador do centro (0 = não foi você) */
  firstPlayerTiles: number;
  /** pontos que saíram de fato (o placar não passa do 1) */
  firstPlayerLoss: number;
  placements: PavilionPlacementScore[];
  placementPoints: number;
  /** azulejos descartados no fim da rodada (além dos 4 guardados) */
  discards: number;
  totalBefore: number;
  totalAfter: number;
}

export function emptyBoard(): PavilionBoard {
  const b = {} as PavilionBoard;
  for (const s of PAVILION_STARS) b[s] = Array<boolean>(PAVILION_SPACES).fill(false);
  return b;
}

export function cloneBoard(b: PavilionBoard): PavilionBoard {
  const c = {} as PavilionBoard;
  for (const s of PAVILION_STARS) c[s] = b[s].slice();
  return c;
}

/**
 * Azulejos ligados ao da casa `index` (inclusive), andando em volta da estrela:
 * as 6 casas formam um anel, então a 6 encosta na 1.
 */
export function chainSize(spaces: readonly boolean[], index: number): number {
  const n = spaces.length;
  if (!spaces[index]) return 0;
  if (spaces.every(Boolean)) return n;
  let size = 1;
  for (let i = 1; i < n && spaces[(index + i) % n]; i++) size++;
  for (let i = 1; i < n && spaces[(index - i + n) % n]; i++) size++;
  return size;
}

/** Pontua as colocações da rodada na ordem em que foram feitas. Não altera a entrada. */
export function scorePavilionRound(
  board: PavilionBoard,
  placements: readonly PavilionPlacement[],
  firstPlayerTiles: number,
  discards: number,
  totalBefore: number,
): { round: PavilionRound; boardAfter: PavilionBoard } {
  const b = cloneBoard(board);
  // o marcador de primeiro jogador sai na fase de compra, antes de colocar azulejos
  const fp = Math.max(0, firstPlayerTiles);
  const afterFp = fp > 0 ? Math.max(1, totalBefore - fp) : totalBefore;
  const scored: PavilionPlacementScore[] = [];
  let placementPoints = 0;
  for (const p of placements) {
    b[p.star][p.index] = true;
    const points = chainSize(b[p.star], p.index);
    placementPoints += points;
    scored.push({ ...p, points });
  }
  const d = Math.max(0, discards);
  return {
    round: {
      firstPlayerTiles: fp,
      firstPlayerLoss: totalBefore - afterFp,
      placements: scored,
      placementPoints,
      discards: d,
      totalBefore,
      totalAfter: afterFp + placementPoints - d,
    },
    boardAfter: b,
  };
}

export interface PavilionEndGame {
  stars: PavilionStar[];
  starPoints: number;
  numbers: number[];
  numberPoints: number;
  total: number;
}

export function pavilionEndGame(board: PavilionBoard): PavilionEndGame {
  const stars = PAVILION_STARS.filter((s) => board[s].every(Boolean));
  const numbers = [1, 2, 3, 4].filter((v) => PAVILION_STARS.every((s) => board[s][v - 1]));
  const starPoints = stars.reduce((sum, s) => sum + PAVILION_STAR_BONUS[s], 0);
  const numberPoints = numbers.reduce((sum, v) => sum + PAVILION_NUMBER_BONUS[v], 0);
  return { stars, starPoints, numbers, numberPoints, total: starPoints + numberPoints };
}
