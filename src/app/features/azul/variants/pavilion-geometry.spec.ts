import { describe, expect, it } from 'vitest';
import { BONUS_SPACES, STAR_SPACES, spaceAngle, starCenter } from './pavilion-geometry';

const norm = (deg: number) => ((deg % 360) + 360) % 360;

describe('Pavilhão de Verão — tabuleiro', () => {
  it('numeração conferida na foto: onde fica a casa 1 de cada estrela', () => {
    expect(norm(spaceAngle('center', 0))).toBe(270); // no alto
    expect(norm(spaceAngle('orange', 0))).toBe(330); // alto à direita
    expect(norm(spaceAngle('red', 0))).toBe(30); // baixo à direita
    expect(norm(spaceAngle('blue', 0))).toBe(90); // embaixo
    expect(norm(spaceAngle('yellow', 0))).toBe(150); // baixo à esquerda
    expect(norm(spaceAngle('green', 0))).toBe(210); // alto à esquerda
    expect(norm(spaceAngle('purple', 0))).toBe(270); // no alto
    // sentido horário: a casa 2 vem 60° depois
    expect(norm(spaceAngle('red', 1))).toBe(90);
  });

  it('as estrelas se tocam pelas pontas', () => {
    const tip = (star: 'center' | 'red', index: number) => STAR_SPACES.find((s) => s.star === star && s.index === index)!.pts[2];
    const c = tip('center', 0); // ponta do alto do centro
    const r = tip('red', 2); // casa 3 da vermelha aponta para o alto à esquerda
    expect(c.x).toBeCloseTo(r.x, 6);
    expect(c.y).toBeCloseTo(r.y, 6);
    expect(Math.hypot(starCenter('red').x, starCenter('red').y)).toBeCloseTo(3, 6);
  });

  it('cada pilar encosta em 2 casas do centro e 2 de uma estrela de fora', () => {
    const pillars = BONUS_SPACES.filter((b) => b.kind === 'pillar');
    expect(pillars).toHaveLength(6);
    for (const p of pillars) {
      expect(p.neighbors).toHaveLength(4);
      expect(p.neighbors.filter((n) => n.star === 'center')).toHaveLength(2);
      expect(new Set(p.neighbors.filter((n) => n.star !== 'center').map((n) => n.star)).size).toBe(1);
    }
  });

  it('cada estátua encosta em 2 casas de cada uma das duas estrelas vizinhas', () => {
    const statues = BONUS_SPACES.filter((b) => b.kind === 'statue');
    expect(statues).toHaveLength(6);
    for (const s of statues) {
      expect(s.neighbors).toHaveLength(4);
      const stars = s.neighbors.map((n) => n.star);
      expect(stars).not.toContain('center');
      expect(new Set(stars).size).toBe(2);
    }
  });

  it('cada janela encosta em 2 casas vizinhas da sua estrela', () => {
    const windows = BONUS_SPACES.filter((b) => b.kind === 'window');
    expect(windows).toHaveLength(6);
    for (const w of windows) {
      expect(w.neighbors).toHaveLength(2);
      const [a, b] = w.neighbors;
      expect(a.star).toBe(b.star);
      expect(Math.abs(a.index - b.index) % 4).toBe(1); // casas seguidas (ou 6 e 1)
    }
  });

  it('pilar entre o centro e a vermelha: casas 1 e 2 do centro, 2 e 3 da vermelha', () => {
    const p = BONUS_SPACES.find((b) => b.kind === 'pillar' && b.neighbors.some((n) => n.star === 'red'))!;
    const key = (n: { star: string; index: number }) => `${n.star}${n.index + 1}`;
    expect(p.neighbors.map(key).sort()).toEqual(['center1', 'center2', 'red2', 'red3']);
  });
});
