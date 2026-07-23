import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TtrRail } from '../../shared/svg/ttr-icons';
import { AzulTile } from '../../shared/svg/azul-tile';
import { AZUL_COLORS, type AzulColor } from '../azul/scoring/azul-scoring';

/**
 * Landing / hero. Establishes the app identity with a staggered entrance. Uses
 * GSAP when motion is allowed; falls back to an instant reveal under
 * prefers-reduced-motion.
 */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TtrRail, AzulTile],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  readonly tileColors = AZUL_COLORS as readonly AzulColor[];

  constructor() {
    afterNextRender(async () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = this.host.nativeElement as HTMLElement;
      const items = Array.from(root.querySelectorAll<HTMLElement>('[data-anim]'));
      if (reduce) {
        items.forEach((el) => (el.style.opacity = '1'));
        return;
      }
      try {
        const { gsap } = await import('gsap');
        gsap.set(items, { opacity: 0, y: 24 });
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          delay: 0.05,
        });
      } catch {
        items.forEach((el) => (el.style.opacity = '1'));
      }
    });
  }
}
