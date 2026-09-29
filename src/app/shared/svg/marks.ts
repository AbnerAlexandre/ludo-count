import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Marca do LudoCount: riscos de contagem (quatro traços e o corte do cinco),
 * o jeito mais antigo de marcar placar numa mesa.
 */
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="6" y="6" width="3.2" height="20" rx="1.6" fill="currentColor" />
      <rect x="11.6" y="6" width="3.2" height="20" rx="1.6" fill="currentColor" />
      <rect x="17.2" y="6" width="3.2" height="20" rx="1.6" fill="currentColor" />
      <rect x="22.8" y="6" width="3.2" height="20" rx="1.6" fill="currentColor" />
      <rect x="3" y="14.4" width="26" height="3.4" rx="1.7" transform="rotate(-28 16 16)" fill="var(--ttr-fill)" />
    </svg>
  `,
  styles: [`:host{display:inline-block;width:28px;height:28px;line-height:0}svg{width:100%;height:100%}`],
})
export class BrandMark {}

/** Ícone genérico para o 7 Wonders: um zigurate em degraus (não é o logo oficial). */
@Component({
  selector: 'app-sw-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="46" width="48" height="10" rx="2" fill="currentColor" />
      <rect x="15" y="34" width="34" height="10" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="22" y="22" width="20" height="10" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="28" y="10" width="8" height="10" rx="2" fill="currentColor" opacity="0.55" />
    </svg>
  `,
  styles: [`:host{display:inline-block;line-height:0}svg{width:100%;height:100%}`],
})
export class SwMark {}
