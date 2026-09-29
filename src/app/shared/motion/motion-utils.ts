import { animate } from 'motion';

/** Curva de saída forte usada em toda a UI (mesma de --ease-out). */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * "Pop" com mola para feedback de toque (ex.: azulejo colocado). Interrompível:
 * a mola parte do valor atual se for disparada de novo no meio do caminho.
 */
export function pop(el: Element, from = 0.86): void {
  if (prefersReducedMotion()) return;
  animate(el, { transform: [`scale(${from})`, 'scale(1)'] }, { type: 'spring', duration: 0.38, bounce: 0.32 });
}
