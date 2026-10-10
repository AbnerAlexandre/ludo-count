import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, linkedSignal, output, untracked } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import { PLAYER_COLORS, type DraftPlayer, type GroupPlayer, type PlayerLimits } from '../../../core/group/group-models';
import { nameKey } from '../../../core/group/ranking';

interface Row extends DraftPlayer {
  key: number;
  /** nome com que o jogador veio da partida anterior */
  orig?: string;
}

let rowSeq = 0;

/**
 * Cadastro da mesa: nome e cor de cada jogador, dentro do limite que a regra
 * da edição (e das expansões ligadas) permite. A ordem da lista é a ordem do
 * "próximo jogador" durante a partida.
 */
@Component({
  selector: 'app-group-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel setup" aria-labelledby="setup-title">
      <div class="head">
        <h2 id="setup-title" class="panel-title">{{ i18n.t('group.setup.title') }}</h2>
        <span class="count tabular" [class.over]="rows().length > limits().max">
          {{ i18n.tp('group.setup.count', { n: rows().length, max: limits().max }) }}
        </span>
      </div>
      <p class="hint">{{ note() }}</p>

      <ol class="rows" role="list">
        @for (r of rows(); track r.key; let i = $index) {
          <li class="row pop-in">
            <button
              type="button"
              class="seat"
              [style.--c]="r.color"
              (click)="cycleColor(i)"
              [attr.aria-label]="i18n.tp('group.setup.colorAria', { n: i + 1 })"
            >
              <span class="tabular">{{ i + 1 }}</span>
            </button>
            <input
              class="name"
              type="text"
              [value]="r.name"
              (input)="rename(i, $event)"
              (keydown.enter)="enter(i, $event)"
              [placeholder]="i18n.tp('group.setup.placeholder', { n: i + 1 })"
              [attr.aria-label]="i18n.tp('group.setup.nameAria', { n: i + 1 })"
              maxlength="24"
              autocomplete="off"
              autocapitalize="words"
              spellcheck="false"
              enterkeyhint="next"
            />
            <button
              type="button"
              class="rm"
              [disabled]="rows().length <= limits().min"
              (click)="remove(i)"
              [attr.aria-label]="i18n.tp('group.setup.removeAria', { name: r.name || i18n.tp('group.setup.placeholder', { n: i + 1 }) })"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
            </button>
          </li>
        }
      </ol>

      @if (freeSuggestions().length) {
        <div class="sugs">
          <span class="eyebrow">{{ i18n.t('group.setup.recent') }}</span>
          <div class="sug-list">
            @for (s of freeSuggestions(); track s) {
              <button type="button" class="sug" [disabled]="!canPlace()" (click)="useSuggestion(s)">{{ s }}</button>
            }
          </div>
        </div>
      }

      <div class="tools">
        <button type="button" class="btn btn-quiet" [disabled]="rows().length >= limits().max" (click)="add()">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
          {{ i18n.t('group.setup.add') }}
        </button>
        <button type="button" class="btn btn-quiet" [disabled]="rows().length < 2" (click)="shuffle()">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h3.5c2 0 3.2 1 4.5 3l1 1.6c1.3 2 2.5 3.4 4.5 3.4H20M4 17h3.5c1.5 0 2.5-.6 3.4-1.7M14.6 8.6C15.5 7.6 16.4 7 17.5 7H20M17 4l3 3-3 3M17 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          {{ i18n.t('group.setup.shuffle') }}
        </button>
      </div>

      @if (extra(); as e) {
        <p class="note">{{ e }}</p>
      }
      @if (error(); as err) {
        <p class="err" role="alert">{{ err }}</p>
      }

      <button type="button" class="btn btn-primary btn-block start" [disabled]="!!error()" (click)="submit()">
        {{ i18n.tp('group.setup.start', { n: rows().length }) }}
      </button>
    </section>
  `,
  styles: [
    `
      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }
      .count {
        font-size: 0.86rem;
        font-weight: 800;
        color: var(--text-faint);
      }
      .count.over {
        color: var(--bad);
      }
      .rows {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      .row {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        gap: 8px;
        align-items: center;
      }
      .seat {
        height: 48px;
        border-radius: var(--radius);
        border: none;
        background: var(--c);
        color: #fff;
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 800;
        box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.22);
        cursor: pointer;
        transition: transform var(--dur-press) var(--ease-out), background-color var(--dur-fast) ease;
      }
      .seat span {
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
      }
      .seat:active {
        transform: scale(0.94);
      }
      .name {
        min-width: 0;
        height: 48px;
        padding: 0 14px;
        border-radius: var(--radius);
        border: 1px solid var(--line-strong);
        background: var(--surface-2);
        color: var(--text);
        font-weight: 600;
        transition: border-color var(--dur-fast) ease, background-color var(--dur-fast) ease;
      }
      .name::placeholder {
        color: var(--text-faint);
        font-weight: 500;
      }
      .name:focus {
        outline: none;
        border-color: var(--game-text);
        background: var(--surface);
      }
      .rm {
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: var(--radius);
        border: 1px solid var(--line);
        background: transparent;
        color: var(--text-dim);
        cursor: pointer;
        transition: transform var(--dur-press) var(--ease-out), color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .rm:active:not(:disabled) {
        transform: scale(0.94);
      }
      .rm:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .sugs {
        margin-top: 16px;
      }
      .sug-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      .sug {
        min-height: 36px;
        padding: 0 12px;
        border-radius: var(--radius-sm);
        border: 1px dashed var(--line-strong);
        background: transparent;
        color: var(--text-dim);
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: transform var(--dur-press) var(--ease-out), color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .sug:active:not(:disabled) {
        transform: scale(0.96);
      }
      .sug:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .tools {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 16px;
      }
      .tools .btn {
        min-height: 44px;
        padding: 0 10px;
        font-size: 0.9rem;
      }
      .note,
      .err {
        margin: 14px 0 0;
        padding: 10px 12px;
        border-radius: var(--radius);
        font-size: 0.88rem;
        line-height: 1.45;
      }
      .note {
        background: var(--surface-2);
        color: var(--text-dim);
      }
      .err {
        background: color-mix(in srgb, var(--bad) 12%, var(--surface));
        border: 1px solid color-mix(in srgb, var(--bad) 40%, var(--line));
        color: var(--text);
      }
      .start {
        margin-top: 16px;
        min-height: 54px;
        font-size: 1.02rem;
      }
      @media (hover: hover) and (pointer: fine) {
        .rm:hover:not(:disabled) {
          color: var(--bad);
          border-color: color-mix(in srgb, var(--bad) 50%, var(--line));
        }
        .sug:hover:not(:disabled) {
          color: var(--text);
          border-color: var(--game-text);
        }
      }
    `,
  ],
})
export class GroupSetup {
  readonly i18n = inject(I18n);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly limits = input.required<PlayerLimits>();
  /** elenco da última partida (pré-preenche a lista) */
  readonly roster = input<GroupPlayer[]>([]);
  readonly suggestions = input<string[]>([]);
  /** limite de jogadores explicado pela regra */
  readonly note = input('');
  /** observação extra conforme o número de jogadores (ex.: variante de 2) */
  readonly hintFor = input<(n: number) => string | null>(() => null);

  readonly start = output<DraftPlayer[]>();

  readonly rows = linkedSignal<GroupPlayer[], Row[]>({
    source: this.roster,
    computation: (roster) => {
      const min = untracked(this.limits).min;
      const rows: Row[] = roster.map((p) => ({ key: rowSeq++, id: p.id, orig: p.name, name: p.name, color: p.color }));
      while (rows.length < Math.max(min, 2)) rows.push(this.blank(rows));
      return rows;
    },
  });

  readonly freeSuggestions = computed(() => {
    const used = new Set(this.rows().map((r) => nameKey(r.name)));
    return this.suggestions().filter((s) => !used.has(nameKey(s))).slice(0, 8);
  });

  /** há uma linha vazia ou espaço para mais um jogador */
  readonly canPlace = computed(() => this.rows().some((r) => !r.name.trim()) || this.rows().length < this.limits().max);

  readonly extra = computed(() => this.hintFor()(this.rows().length));

  readonly error = computed<string | null>(() => {
    const { min, max } = this.limits();
    const n = this.rows().length;
    if (n > max) return this.i18n.tp('group.setup.tooMany', { max, n: n - max });
    if (n < min) return this.i18n.tp('group.setup.tooFew', { min });
    const keys = this.rows()
      .map((r) => nameKey(r.name))
      .filter(Boolean);
    if (new Set(keys).size !== keys.length) return this.i18n.t('group.setup.dup');
    return null;
  });

  private blank(rows: readonly Row[]): Row {
    const used = new Set(rows.map((r) => r.color));
    const color = PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[rows.length % PLAYER_COLORS.length];
    return { key: rowSeq++, name: '', color };
  }

  add(focus = true): void {
    if (this.rows().length >= this.limits().max) return;
    this.rows.update((rs) => [...rs, this.blank(rs)]);
    if (focus) this.focusRow(this.rows().length - 1);
  }

  remove(i: number): void {
    if (this.rows().length <= this.limits().min) return;
    this.rows.update((rs) => rs.filter((_, j) => j !== i));
  }

  rename(i: number, ev: Event): void {
    const name = (ev.target as HTMLInputElement).value;
    this.rows.update((rs) => rs.map((r, j) => (j === i ? { ...r, name } : r)));
  }

  enter(i: number, ev: Event): void {
    ev.preventDefault();
    if (i < this.rows().length - 1) this.focusRow(i + 1);
    else if (this.rows().length < this.limits().max && this.rows()[i].name.trim()) this.add();
    else (ev.target as HTMLInputElement).blur();
  }

  cycleColor(i: number): void {
    this.rows.update((rs) => {
      const used = new Set(rs.filter((_, j) => j !== i).map((r) => r.color));
      const cur = PLAYER_COLORS.indexOf(rs[i].color);
      for (let step = 1; step <= PLAYER_COLORS.length; step++) {
        const c = PLAYER_COLORS[(cur + step) % PLAYER_COLORS.length];
        if (!used.has(c)) return rs.map((r, j) => (j === i ? { ...r, color: c } : r));
      }
      return rs;
    });
  }

  useSuggestion(name: string): void {
    const empty = this.rows().findIndex((r) => !r.name.trim());
    if (empty >= 0) {
      this.rows.update((rs) => rs.map((r, j) => (j === empty ? { ...r, name, id: undefined } : r)));
    } else if (this.rows().length < this.limits().max) {
      this.rows.update((rs) => [...rs, { ...this.blank(rs), name }]);
    }
  }

  /** sorteia a ordem dos assentos (quem começa) */
  shuffle(): void {
    this.rows.update((rs) => {
      const a = [...rs];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
  }

  submit(): void {
    if (this.error()) return;
    this.start.emit(
      this.rows().map((r, i) => ({
        // nome trocado = outra pessoa: o id antigo só fica se o nome ainda bate
        id: r.id && nameKey(r.name) === nameKey(r.orig ?? '') ? r.id : undefined,
        name: r.name.trim() || this.i18n.tp('group.setup.placeholder', { n: i + 1 }),
        color: r.color,
      })),
    );
  }

  private focusRow(i: number): void {
    setTimeout(() => {
      const inputs = (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input.name');
      inputs[i]?.focus();
    });
  }
}
