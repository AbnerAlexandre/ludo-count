import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, input, output, viewChild } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import { prefersReducedMotion } from '../../motion/motion-utils';

export interface StripPlayer {
  id: string;
  name: string;
  color: string;
  total: number;
  /** posição final (só quando a partida terminou) */
  rank?: number;
}

/**
 * Faixa fixa com os jogadores da mesa: toque para pontuar outro jogador.
 * Fica grudada embaixo do cabeçalho, então dá para preencher a mesma
 * categoria de todos sem rolar a página.
 */
@Component({
  selector: 'app-player-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="strip" [attr.aria-label]="i18n.t('group.strip.aria')">
      <div class="track" #track role="tablist">
        @for (p of players(); track p.id) {
          <button
            type="button"
            role="tab"
            class="seat"
            [class.on]="p.id === activeId()"
            [attr.aria-selected]="p.id === activeId()"
            [attr.data-id]="p.id"
            [style.--c]="p.color"
            (click)="select.emit(p.id)"
          >
            <span class="dot" aria-hidden="true"></span>
            <span class="nm">{{ p.name }}</span>
            @if (p.rank) {
              <span class="rk tabular">{{ p.rank }}º</span>
            }
            <b class="tot tabular" [class.neg]="p.total < 0">{{ p.total }}</b>
          </button>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
        position: sticky;
        top: var(--header-h);
        z-index: 20;
        margin: 0 -16px;
        padding: 8px 16px;
        background: color-mix(in srgb, var(--bg) 92%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--line);
      }
      @media (min-width: 960px) {
        :host {
          margin: 0;
          padding: 8px 0;
          border-bottom: none;
          background: var(--bg);
        }
      }
      .track {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        overscroll-behavior-x: contain;
      }
      .track::-webkit-scrollbar {
        display: none;
      }
      .seat {
        flex: 0 0 auto;
        scroll-snap-align: start;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 46px;
        max-width: 180px;
        padding: 0 12px 0 10px;
        border-radius: var(--radius);
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
        transition:
          transform var(--dur-press) var(--ease-out),
          background-color var(--dur-fast) ease,
          border-color var(--dur-fast) ease,
          color var(--dur-fast) ease;
      }
      .seat:active {
        transform: scale(0.96);
      }
      .dot {
        width: 10px;
        height: 10px;
        flex: 0 0 auto;
        border-radius: 3px;
        background: var(--c);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 30%, transparent);
      }
      .nm {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 700;
        font-size: 0.92rem;
      }
      .rk {
        font-size: 0.74rem;
        font-weight: 800;
        opacity: 0.75;
      }
      .tot {
        font-family: var(--font-display);
        font-size: 1.08rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .tot.neg {
        color: var(--bad);
      }
      .seat.on {
        background: var(--game);
        border-color: var(--game);
        color: var(--game-ink);
      }
      .seat.on .tot.neg {
        color: inherit;
      }
      .seat.on .dot {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--game-ink) 55%, transparent);
      }
      @media (hover: hover) and (pointer: fine) {
        .seat:not(.on):hover {
          border-color: var(--game-text);
        }
      }
    `,
  ],
})
export class PlayerStrip {
  readonly i18n = inject(I18n);
  readonly players = input.required<StripPlayer[]>();
  readonly activeId = input<string | null>(null);
  readonly select = output<string>();

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  constructor() {
    // mantém o jogador da vez visível quando a faixa rola na horizontal
    afterRenderEffect(() => {
      const id = this.activeId();
      const track = this.track().nativeElement;
      if (!id) return;
      const el = track.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
      if (!el) return;
      const left = el.offsetLeft - track.offsetLeft;
      if (left < track.scrollLeft || left + el.offsetWidth > track.scrollLeft + track.clientWidth) {
        track.scrollTo({ left: Math.max(0, left - 16), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    });
  }
}
