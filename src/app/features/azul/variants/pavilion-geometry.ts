/**
 * Azul: Pavilhão de Verão — desenho do tabuleiro real (sem Angular).
 *
 * Medidas em "lados de losango" (S = 1). Conferido na foto do tabuleiro da caixa:
 *  - as 7 estrelas se tocam pelas pontas: as de fora ficam a 3 lados do centro
 *  - estrela de fora no ângulo φ: a casa v fica no ângulo φ + 90 + 60·(v − 1),
 *    em sentido horário; na do centro, a casa 1 fica no alto
 *  - 6 pilares nos recortes da estrela do centro, 6 estátuas nas pontas dela e
 *    6 janelas no recorte de fora de cada estrela; cercar um deles dá 1, 2 ou 3
 *    azulejos de bônus
 */
import { PAVILION_SPACES, type PavilionColor, type PavilionStar } from './pavilion-scoring';

export interface Pt {
  x: number;
  y: number;
}

export interface StarSpace {
  star: PavilionStar;
  /** 0..5 (valor da casa = index + 1) */
  index: number;
  /** ângulo da ponta do losango, em graus */
  angle: number;
  pts: Pt[];
  /** onde o número vem impresso, perto da ponta */
  label: Pt;
}

export type BonusKind = 'pillar' | 'statue' | 'window';

export interface BonusSpace {
  id: string;
  kind: BonusKind;
  pts: Pt[];
  center: Pt;
  /** casas das estrelas que encostam neste espaço */
  neighbors: { star: PavilionStar; index: number }[];
}

/** azulejos de bônus ao cercar cada espaço */
export const BONUS_TILES: Record<BonusKind, number> = { pillar: 1, statue: 2, window: 3 };

/** posição de cada estrela de fora em volta do centro */
export const OUTER_ANGLE: Record<PavilionColor, number> = { orange: -120, red: -60, blue: 0, yellow: 60, green: 120, purple: 180 };

const R = Math.sqrt(3);
/** as estrelas se tocam pelas pontas */
const STAR_DISTANCE = 3;

const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (p: Pt, deg: number, r: number): Pt => ({ x: p.x + r * Math.cos(rad(deg)), y: p.y + r * Math.sin(rad(deg)) });

export function starCenter(star: PavilionStar): Pt {
  return star === 'center' ? { x: 0, y: 0 } : at({ x: 0, y: 0 }, OUTER_ANGLE[star], STAR_DISTANCE);
}

/** ângulo da casa `index` na estrela */
export function spaceAngle(star: PavilionStar, index: number): number {
  return (star === 'center' ? -90 : OUTER_ANGLE[star] + 90) + 60 * index;
}

/** losango de 60° com a ponta fina em `p`, apontando para `deg` */
const narrow = (p: Pt, deg: number): Pt[] => [p, at(p, deg - 30, 1), at(p, deg, R), at(p, deg + 30, 1)];
/** losango de 60° com o canto largo em `p`, apontando para `deg` */
const wide = (p: Pt, deg: number): Pt[] => {
  const a = at(p, deg - 60, 1);
  return [p, a, at(a, deg + 60, 1), at(p, deg + 60, 1)];
};
const mid = (pts: Pt[]): Pt => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});

export const STARS: readonly PavilionStar[] = ['center', 'orange', 'red', 'blue', 'yellow', 'green', 'purple'];

export const STAR_SPACES: readonly StarSpace[] = STARS.flatMap((star) => {
  const c = starCenter(star);
  return Array.from({ length: PAVILION_SPACES }, (_, index) => {
    const angle = spaceAngle(star, index);
    return { star, index, angle, pts: narrow(c, angle), label: at(c, angle, R * 0.7) };
  });
});

/** lado como chave (pontas arredondadas, em qualquer ordem) para achar vizinhos */
const edgeKeys = (pts: Pt[]) =>
  pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    // inteiro em milésimos: toFixed daria "-0.000" e "0.000" para o mesmo ponto
    return [p, q]
      .map((v) => `${Math.round(v.x * 1000)},${Math.round(v.y * 1000)}`)
      .sort()
      .join('|');
  });

function neighborsOf(pts: Pt[]): { star: PavilionStar; index: number }[] {
  const mine = new Set(edgeKeys(pts));
  return STAR_SPACES.filter((s) => edgeKeys(s.pts).some((k) => mine.has(k))).map(({ star, index }) => ({ star, index }));
}

function bonus(id: string, kind: BonusKind, pts: Pt[]): BonusSpace {
  return { id, kind, pts, center: mid(pts), neighbors: neighborsOf(pts) };
}

export const BONUS_SPACES: readonly BonusSpace[] = [
  // pilares: no recorte da estrela do centro, virados para cada estrela de fora
  ...Object.values(OUTER_ANGLE).map((phi, k) => bonus(`pillar-${k}`, 'pillar', wide(at({ x: 0, y: 0 }, phi, 1), phi))),
  // estátuas: saem das pontas da estrela do centro, entre duas estrelas de fora
  ...Array.from({ length: 6 }, (_, k) => {
    const psi = -90 + 60 * k;
    return bonus(`statue-${k}`, 'statue', narrow(at({ x: 0, y: 0 }, psi, R), psi));
  }),
  // janelas: no recorte de fora de cada estrela de fora
  ...(Object.entries(OUTER_ANGLE) as [PavilionColor, number][]).map(([star, phi]) =>
    bonus(`window-${star}`, 'window', wide(at(starCenter(star), phi, 1), phi)),
  ),
];

/** limites do desenho (para o viewBox) */
export const BOARD_EXTENT = { x: 5.4, y: 4.75 };

export const toPath = (pts: Pt[], scale: number) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * scale).toFixed(2)} ${(p.y * scale).toFixed(2)}`).join('') + 'Z';
