import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { animate, type AnimationPlaybackControls } from 'motion';
import { EASE_OUT, prefersReducedMotion } from './motion-utils';

/**
 * Placar que "rola" do valor anterior ao novo e solta um chip de variação
 * (+7 / −2) que sobe e some. É feedback de estado: mostra ao jogador,
 * a cada toque, exatamente quanto entrou no total.
 */
@Component({
  selector: 'app-score-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="num tabular" #num [textContent]="settled()"></span>
    <span class="deltas" #deltas aria-hidden="true"></span>
  `,
  styles: [
    `
      :host {
        position: relative;
        display: inline-flex;
        align-items: baseline;
        line-height: 1;
      }
      .num {
        display: inline-block;
        font-variant-numeric: tabular-nums;
        will-change: transform;
      }
      .deltas {
        position: absolute;
        left: 100%;
        top: 0;
        pointer-events: none;
      }
      :host ::ng-deep .delta {
        position: absolute;
        left: 6px;
        top: -2px;
        font-family: var(--font-body);
        font-size: 0.34em;
        font-weight: 800;
        letter-spacing: 0;
        white-space: nowrap;
        padding: 3px 7px;
        border-radius: var(--radius-sm);
        background: var(--good);
        color: #06140c;
      }
      :host ::ng-deep .delta.minus {
        background: var(--bad);
        color: #fff;
      }
      /* sem espaço à direita (placar encostado na borda): o chip sobe por cima do número */
      :host ::ng-deep .delta.above {
        left: auto;
        right: 0;
        top: auto;
        bottom: 4px;
      }
    `,
  ],
})
export class ScoreTicker {
  readonly value = input.required<number>();
  /** desliga o chip de variação (ex.: placares muito pequenos) */
  readonly showDelta = input(true);

  readonly settled = signal(0);

  private readonly num = viewChild.required<ElementRef<HTMLElement>>('num');
  private readonly deltas = viewChild.required<ElementRef<HTMLElement>>('deltas');
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private shown = 0;
  private first = true;
  private roll?: AnimationPlaybackControls;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.roll?.stop());

    effect(() => {
      const target = this.value();
      untracked(() => this.update(target));
    });
  }

  private update(target: number): void {
    if (this.first || !this.isBrowser || prefersReducedMotion()) {
      this.first = false;
      this.shown = target;
      this.settled.set(target);
      return;
    }
    const from = this.shown;
    const delta = target - from;
    if (delta === 0) return;

    const el = this.num().nativeElement;
    this.roll?.stop();
    this.roll = animate(from, target, {
      duration: Math.min(0.55, 0.28 + Math.abs(delta) * 0.012),
      ease: EASE_OUT,
      onUpdate: (v) => {
        this.shown = Math.round(v);
        el.textContent = String(this.shown);
      },
      onComplete: () => {
        this.shown = target;
        this.settled.set(target);
      },
    });
    animate(el, { transform: ['scale(1.07)', 'scale(1)'] }, { type: 'spring', duration: 0.35, bounce: 0.25 });

    if (this.showDelta()) this.spawnDelta(delta);
  }

  private spawnDelta(delta: number): void {
    const layer = this.deltas().nativeElement;
    while (layer.childElementCount >= 3) layer.firstElementChild?.remove();

    const chip = document.createElement('span');
    chip.className = delta > 0 ? 'delta' : 'delta minus';
    const room = document.documentElement.clientWidth - this.host.getBoundingClientRect().right;
    if (room < 72) chip.classList.add('above');
    chip.textContent = delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
    layer.appendChild(chip);

    animate(
      chip,
      { opacity: [0, 1, 1, 0], transform: ['translateY(6px)', 'translateY(-4px)', 'translateY(-10px)', 'translateY(-22px)'] },
      { duration: 0.9, ease: EASE_OUT, times: [0, 0.18, 0.6, 1] },
    ).finished.then(() => chip.remove());
  }
}
