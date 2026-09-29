/**
 * Ciência do 7 Wonders — função pura.
 *
 * Cada tipo de símbolo (tábua, compasso, engrenagem) vale a contagem ao
 * quadrado, e cada conjunto completo dos três vale +7 (+10 com Aristóteles,
 * da expansão Leaders). Símbolos coringa (Guilda dos Cientistas, Babilônia,
 * etc.) viram, cada um, o símbolo que o jogador escolher no fim da partida:
 * aqui testamos todas as distribuições e ficamos com a de maior pontuação.
 */

export interface ScienceInput {
  tablet: number;
  compass: number;
  gear: number;
  /** símbolos coringa ("qualquer um") */
  wild: number;
}

export interface ScienceResult {
  points: number;
  /** contagens finais, já com os coringas distribuídos */
  tablet: number;
  compass: number;
  gear: number;
  sets: number;
  setValue: number;
  /** soma dos quadrados */
  squares: number;
  /** como os coringas foram distribuídos */
  wildTo: { tablet: number; compass: number; gear: number };
}

export const SET_VALUE = 7;
export const ARISTOTLE_SET_VALUE = 10;

function evaluate(t: number, c: number, g: number, setValue: number): number {
  return t * t + c * c + g * g + setValue * Math.min(t, c, g);
}

export function scienceScore(input: ScienceInput, setValue = SET_VALUE): ScienceResult {
  const t0 = Math.max(0, input.tablet);
  const c0 = Math.max(0, input.compass);
  const g0 = Math.max(0, input.gear);
  const w = Math.max(0, Math.min(input.wild, 20));

  let best = { points: -1, a: 0, b: 0, c: 0 };
  for (let a = 0; a <= w; a++) {
    for (let b = 0; b <= w - a; b++) {
      const c = w - a - b;
      const pts = evaluate(t0 + a, c0 + b, g0 + c, setValue);
      if (pts > best.points) best = { points: pts, a, b, c };
    }
  }

  const tablet = t0 + best.a;
  const compass = c0 + best.b;
  const gear = g0 + best.c;
  const sets = Math.min(tablet, compass, gear);
  return {
    points: best.points,
    tablet,
    compass,
    gear,
    sets,
    setValue,
    squares: tablet * tablet + compass * compass + gear * gear,
    wildTo: { tablet: best.a, compass: best.b, gear: best.c },
  };
}
