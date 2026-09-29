import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { animate, inView } from 'motion';
import { EASE_OUT, prefersReducedMotion } from './motion-utils';

/**
 * Revela o elemento ao entrar na tela (uma vez só). Só esconde o que ainda
 * está fora da viewport no momento da hidratação — o que já está visível fica
 * como veio do prerender, sem piscar e sem atrasar o LCP.
 *
 * Uso: `<section appReveal>` ou `<li appReveal [appRevealDelay]="i * 0.06">`.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /** atraso em segundos (útil para escalonar itens de uma lista) */
  readonly appRevealDelay = input(0);

  constructor() {
    afterNextRender(() => {
      const el = this.el.nativeElement as HTMLElement;
      if (prefersReducedMotion()) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';

      const stop = inView(
        el,
        () => {
          animate(
            el,
            { opacity: 1, transform: 'translateY(0px)' },
            { duration: 0.55, ease: EASE_OUT, delay: this.appRevealDelay() },
          );
          stop();
        },
        // Margem gigante para cima: se o usuário pular direto para baixo (barra de
        // rolagem, âncora), o que ficou acima da tela também conta como visto —
        // sem isso o observador nunca dispara e o elemento fica invisível.
        { margin: '100000px 0px -8% 0px' },
      );
      this.destroyRef.onDestroy(stop);
    });
  }
}
