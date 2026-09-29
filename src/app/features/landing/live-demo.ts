import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { inView } from 'motion';
import { I18n } from '../../core/i18n/i18n';
import { AzulTile } from '../../shared/svg/azul-tile';
import { ScoreTicker } from '../../shared/motion/score-ticker';
import { pop, prefersReducedMotion } from '../../shared/motion/motion-utils';
import { emptyWall, scorePlacement, wallColor, type AzulColor } from '../azul/scoring/azul-scoring';

/** Sequência da demonstração: produz isolados, linhas e cruzamentos. */
const SEQUENCE: Array<[number, number]> = [
  [1, 1],
  [1, 2],
  [0, 2],
  [1, 3],
  [2, 2],
  [1, 0],
  [2, 3],
  [0, 3],
];

/**
 * Demonstração no hero: uma parede do Azul se preenche e cada azulejo é
 * pontuado com a mesma função que o contador usa. Roda uma vez ao entrar na
 * tela; com movimento reduzido, mostra o estado final direto.
 */
@Component({
  selector: 'app-live-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AzulTile, ScoreTicker],
  template: `
    <figure class="demo">
      <div class="head">
        <div>
          <span class="eyebrow">{{ i18n.t('landing.demo.label') }}</span>
          <span class="round">{{ i18n.tp('landing.demo.round', { n: step() }) }}</span>
        </div>
        <app-score-ticker class="score display" [value]="total()" [showDelta]="running()" />
      </div>

      <div class="wall" role="img" [attr.aria-label]="i18n.t('landing.demo.aria')">
        @for (cell of cells; track cell.key) {
          <span class="cell" #cellEl [attr.data-key]="cell.key" [class.on]="placed().has(cell.key)">
            <app-azul-tile [color]="cell.color" />
          </span>
        }
      </div>

      <figcaption class="note" aria-live="polite">
        @if (note()) {
          <span class="note-line enter">{{ note() }}</span>
        } @else {
          <span class="note-idle">{{ i18n.t('landing.demo.idle') }}</span>
        }
      </figcaption>

      <button type="button" class="replay" (click)="replay()" [disabled]="running()">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ i18n.t('landing.demo.replay') }}
      </button>
    </figure>
  `,
  styleUrl: './live-demo.scss',
})
export class LiveDemo {
  readonly i18n = inject(I18n);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cellEls = viewChildren<ElementRef<HTMLElement>>('cellEl');

  readonly cells: Array<{ key: string; color: AzulColor }> = [];
  readonly placed = signal<Set<string>>(new Set());
  readonly total = signal(0);
  readonly note = signal('');
  readonly step = signal(0);
  readonly running = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) this.cells.push({ key: `${r}-${c}`, color: wallColor(r, c) });
    }

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.clearTimers());

    afterNextRender(() => {
      if (prefersReducedMotion()) {
        this.runInstant();
        return;
      }
      const stop = inView(
        this.host.nativeElement as HTMLElement,
        () => {
          this.run();
          stop();
        },
        { amount: 0.4 },
      );
      destroyRef.onDestroy(stop);
    });
  }

  replay(): void {
    this.reset();
    if (prefersReducedMotion()) this.runInstant();
    // um tique depois, para o placar zerar sem soltar um chip de "−24"
    else this.timers.push(setTimeout(() => this.run(), 60));
  }

  private run(): void {
    this.running.set(true);
    const wall = emptyWall();
    let total = 0;
    SEQUENCE.forEach(([r, c], i) => {
      this.timers.push(
        setTimeout(
          () => {
            wall[r][c] = true;
            const s = scorePlacement(wall, r, c);
            total += s.points;
            this.placeCell(`${r}-${c}`);
            this.total.set(total);
            this.step.set(i + 1);
            this.note.set(this.describe(r, c, s.h, s.v, s.points));
            if (i === SEQUENCE.length - 1) this.running.set(false);
          },
          450 + i * 720,
        ),
      );
    });
  }

  private runInstant(): void {
    const wall = emptyWall();
    let total = 0;
    const set = new Set<string>();
    let last = '';
    for (const [r, c] of SEQUENCE) {
      wall[r][c] = true;
      const s = scorePlacement(wall, r, c);
      total += s.points;
      set.add(`${r}-${c}`);
      last = this.describe(r, c, s.h, s.v, s.points);
    }
    this.placed.set(set);
    this.total.set(total);
    this.step.set(SEQUENCE.length);
    this.note.set(last);
  }

  private placeCell(key: string): void {
    const next = new Set(this.placed());
    next.add(key);
    this.placed.set(next);
    const el = this.cellEls().find((e) => e.nativeElement.dataset['key'] === key)?.nativeElement;
    if (el) pop(el, 0.7);
  }

  private describe(r: number, c: number, h: number, v: number, pts: number): string {
    const t = this.i18n;
    const detail =
      h > 1 && v > 1
        ? t.tp('audit.detail.cross', { h, v })
        : h > 1
          ? t.tp('audit.detail.h', { h })
          : v > 1
            ? t.tp('audit.detail.v', { v })
            : t.t('audit.detail.isolated');
    return t.tp('landing.demo.step', { r: r + 1, c: c + 1, detail, pts });
  }

  private reset(): void {
    this.clearTimers();
    this.placed.set(new Set());
    this.total.set(0);
    this.note.set('');
    this.step.set(0);
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
