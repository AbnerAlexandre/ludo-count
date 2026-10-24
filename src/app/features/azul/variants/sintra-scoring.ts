/**
 * Azul: Vitrais de Sintra — pontuação pura (sem Angular).
 *
 * Regras do manual oficial (Next Move / Plan B, 2018):
 *  - o palácio tem 8 janelas; cada uma recebe 2 peças (moldura de cima e de baixo)
 *  - completar uma faixa de padrão dá, nesta ordem:
 *      a) bônus de cor: +1 por peça da faixa igual à peça do topo do indicador de rodada
 *      b) uma peça vai para a janela logo abaixo
 *      c) pontua a janela: o valor impresso embaixo dela + os valores das janelas
 *         à direita que já têm 1 ou 2 peças
 *  - vidro quebrado: chegar ao fim da trilha (−18) tira 18 pontos na hora e o
 *    marcador volta ao topo; no fim, perde-se o valor ao lado do marcador
 *  - fim de jogo: +1 a cada 3 peças nas faixas; bônus do lado A (ornamentos) ou B
 */

export type SintraColor = 'pink' | 'orange' | 'yellow' | 'white' | 'blue';
export type SintraSide = 'A' | 'B';

export const SINTRA_COLORS: readonly SintraColor[] = ['pink', 'orange', 'yellow', 'white', 'blue'];

/** valores impressos embaixo das 8 janelas, da esquerda para a direita (iguais nos lados A e B) */
export const SINTRA_WINDOW_VALUES: readonly number[] = [4, 3, 3, 2, 2, 1, 1, 2];
export const SINTRA_WINDOWS = SINTRA_WINDOW_VALUES.length;

/** cair no fim da trilha de vidro quebrado custa isto, na hora */
export const SINTRA_BROKEN_WRAP = 18;
export const SINTRA_ROUNDS = 6;

/** lado A: pontos de um ornamento pelo número de molduras preenchidas ao redor (0..4) */
export const SINTRA_ORNAMENT_POINTS: readonly number[] = [0, 0, 3, 6, 10];

/** 8 janelas × [moldura de cima, moldura de baixo]; null = vazia */
export type SintraWindows = (SintraColor | null)[][];

export function emptyWindows(): SintraWindows {
  return Array.from({ length: SINTRA_WINDOWS }, () => [null, null]);
}

export const windowCount = (w: SintraWindows, i: number) => w[i].filter(Boolean).length;

/**
 * Pontos ao colocar uma peça na janela `index` (a peça já está no tabuleiro):
 * o valor dela + o valor de cada janela à direita que tem 1 ou 2 peças.
 */
export function scoreWindow(windows: SintraWindows, index: number): { points: number; right: number[] } {
  const right: number[] = [];
  for (let j = index + 1; j < SINTRA_WINDOWS; j++) if (windowCount(windows, j) > 0) right.push(j);
  const points = SINTRA_WINDOW_VALUES[index] + right.reduce((s, j) => s + SINTRA_WINDOW_VALUES[j], 0);
  return { points, right };
}

/** Lado A: 4 ornamentos, cada um entre um par de janelas (1-2, 3-4, 5-6, 7-8). */
export function ornamentBonus(windows: SintraWindows): { filled: number[]; points: number[]; total: number } {
  const filled: number[] = [];
  for (let o = 0; o < SINTRA_WINDOWS / 2; o++) filled.push(windowCount(windows, o * 2) + windowCount(windows, o * 2 + 1));
  const points = filled.map((n) => SINTRA_ORNAMENT_POINTS[n]);
  return { filled, points, total: points.reduce((s, p) => s + p, 0) };
}

/**
 * Lado B: janelas completas × peças de UMA cor escolhida nas janelas.
 * O app escolhe a cor que rende mais (é o que o jogador faria).
 */
export function sideBBonus(windows: SintraWindows): { completed: number; color: SintraColor | null; count: number; total: number } {
  const completed = windows.filter((w) => w[0] && w[1]).length;
  let best: SintraColor | null = null;
  let count = 0;
  for (const c of SINTRA_COLORS) {
    const n = windows.reduce((s, w) => s + w.filter((p) => p === c).length, 0);
    if (n > count) {
      best = c;
      count = n;
    }
  }
  return { completed, color: best, count, total: completed * count };
}

/** +1 ponto a cada 3 peças que sobraram nas faixas de padrão */
export const leftoverPoints = (pieces: number) => Math.floor(Math.max(0, pieces) / 3);
