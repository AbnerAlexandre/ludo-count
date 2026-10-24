import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Seo } from '../../../core/seo/seo';
import { I18n } from '../../../core/i18n/i18n';
import { SevenWondersMatch } from '../../../core/services/sw-match';
import { MatchHistory } from '../../../core/services/match-history';
import { AuditSheet } from '../../../shared/ui/audit-sheet';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { PageHeader } from '../../../shared/ui/page-header';
import { SiteFooter } from '../../../shared/ui/site-footer';
import { HistoryPanel } from '../../../shared/ui/history-panel';
import { Choice, type ChoiceOption } from '../../../shared/ui/choice';
import { ScoreTicker } from '../../../shared/motion/score-ticker';
import { findSwVariant, swExpName, swName, swNote, type SwExpansion } from '../scoring/sw-variants';
import { type DuelVictory } from '../scoring/sw-scoring';
import { SwBaseForm } from './sw-base-form';
import { SwDuelForm } from './sw-duel-form';
import { SwArchitectsForm } from './sw-architects-form';
import { GroupSetup } from '../../../shared/ui/group/group-setup';
import { PlayerStrip, type StripPlayer } from '../../../shared/ui/group/player-strip';
import { GroupResults } from '../../../shared/ui/group/group-results';
import { GroupStandings } from '../../../shared/ui/group/group-standings';
import { SessionBoard } from '../../../shared/ui/group/session-board';
import { prefersReducedMotion } from '../../../shared/motion/motion-utils';
import type { DraftPlayer } from '../../../core/group/group-models';

@Component({
  selector: 'app-sw-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuditSheet,
    ConfirmDialog,
    PageHeader,
    SiteFooter,
    HistoryPanel,
    Choice,
    ScoreTicker,
    SwBaseForm,
    SwDuelForm,
    SwArchitectsForm,
    GroupSetup,
    PlayerStrip,
    GroupResults,
    GroupStandings,
    SessionBoard,
  ],
  templateUrl: './sw-counter.html',
  styleUrl: './sw-counter.scss',
})
export class SwCounter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly history = inject(MatchHistory);
  readonly m = inject(SevenWondersMatch);
  readonly i18n = inject(I18n);

  readonly showAudit = signal(false);
  readonly confirm = signal<'finish' | 'new' | 'finishGroup' | 'changePlayers' | null>(null);
  /** aviso quando uma expansão não pode mudar por causa do número de jogadores */
  readonly expNote = signal<string | null>(null);

  readonly variant = this.m.variant;
  readonly finished = this.m.finished;
  readonly selectPath = computed(() => `${this.i18n.locale() === 'en' ? '/en' : ''}/7-wonders`);
  readonly name = computed(() => {
    const v = this.variant();
    return v ? swName(v, this.i18n.locale()) : '7 Wonders';
  });
  /** "Duel", "Architects"… — o cabeçalho mostra o logo do 7 Wonders e este nome ao lado */
  readonly subName = computed(() => this.name().replace(/^7 Wonders\s*/, ''));

  readonly victoryOptions = computed<ChoiceOption[]>(() => {
    const opts: DuelVictory[] = ['civilian', 'military', 'science'];
    if (this.m.duel().expansions.agora) opts.push('political');
    // no grupo a pergunta é "este jogador venceu por supremacia?"
    const group = this.m.groupPlaying();
    return opts.map((v) => ({
      value: v,
      label: group && v === 'civilian' ? this.i18n.t('group.duel.none') : this.i18n.t(`sw.victoryShort.${v}`),
    }));
  });

  /* ---- mesa em grupo ---- */
  readonly table = this.m.table;
  readonly activePlayer = computed(() => (this.m.groupPlaying() ? this.table.activePlayer() : null));
  /** muda a cada troca de jogador: recria a planilha (e zera os placares animados) */
  readonly sheetKey = computed(() => (this.m.isGroup() ? (this.table.activeId() ?? 'setup') : 'solo'));
  readonly manualWinner = computed(() => this.table.match()?.manualOrder?.[0] ?? null);

  readonly modeOptions = computed<ChoiceOption[]>(() => {
    const { min, max } = this.m.limits();
    const sub = min === max ? this.i18n.tp('group.mode.groupSubExact', { n: max }) : this.i18n.tp('group.mode.groupSub', { min, max });
    return [
      { value: 'solo', label: this.i18n.t('group.mode.solo'), sub: this.i18n.t('group.mode.soloSub') },
      { value: 'group', label: this.i18n.t('group.mode.group'), sub },
    ];
  });

  readonly limitsNote = computed(() => {
    switch (this.variant()?.id) {
      case 'duel':
        return this.i18n.t('group.limits.duel');
      case 'architects':
        return this.i18n.t('group.limits.architects');
      default:
        return this.i18n.tp('group.limits.swBase', { max: this.m.limits().max });
    }
  });

  /** 2 jogadores no 7 Wonders base: a variante oficial da 1ª edição */
  readonly setupHint = (n: number) =>
    this.variant()?.id === 'base' && n === 2 ? this.i18n.t('group.limits.swBase2') : null;

  readonly stripPlayers = computed<StripPlayer[]>(() => {
    const totals = this.m.totals();
    const ranks = this.finished() ? new Map(this.m.standings().map((s) => [s.id, s.rank])) : null;
    return this.table.players().map((p) => ({ ...p, total: totals[p.id] ?? 0, rank: ranks?.get(p.id) }));
  });

  private readonly groupHasProgress = computed(() => Object.values(this.m.totals()).some((t) => t !== 0));

  /** nome da versão salva no histórico */
  readonly historyName = (id?: string) => {
    const v = id ? findSwVariant(id) : undefined;
    return v ? swName(v, this.i18n.locale()) : '7 Wonders';
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('variantId')!;
    if (!this.m.selectVariant(id)) this.router.navigateByUrl(this.selectPath());

    effect(() => {
      const v = this.variant();
      if (!v) return;
      const loc = this.i18n.locale();
      const name = swName(v, loc);
      this.seo.update({
        title: this.i18n.t(`seo.sw.${v.id}.title`),
        description: this.i18n.t(`seo.sw.${v.id}.desc`),
        basePath: `/7-wonders/${v.id}`,
        locale: loc,
        breadcrumbs: [
          { name: '7 Wonders', basePath: '/7-wonders' },
          { name, basePath: `/7-wonders/${v.id}` },
        ],
      });
    });

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => this.seo.setTitle(`${this.name()} - ${this.m.total()}`));
    }
  }

  expName(e: SwExpansion): string {
    return swExpName(e, this.i18n.locale());
  }
  note(): string {
    const v = this.variant();
    return v ? swNote(v, this.i18n.locale()) : '';
  }
  setVictory(v: string | number | undefined): void {
    this.m.patchDuel({ victory: (v as DuelVictory) ?? 'civilian' });
  }

  signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  confirmFinish(): void {
    this.m.finish();
    this.history.record('sw', {
      variantId: this.variant()?.id,
      total: this.m.total(),
      parts: this.m.result().parts.filter((p) => p.points !== 0),
      outcome: this.m.outcomeKey(),
    });
    this.confirm.set(null);
  }

  confirmNewMatch(): void {
    this.m.reset();
    this.confirm.set(null);
  }

  /* ---- mesa em grupo ---- */

  setMode(v: string | number | undefined): void {
    this.table.setMode(v === 'group' ? 'group' : 'solo');
    this.expNote.set(null);
  }

  toggleExpansion(id: string): void {
    const block = this.m.expansionBlock(id);
    this.expNote.set(block);
    if (!block) this.m.toggleExpansion(id);
  }

  startGroup(players: DraftPlayer[]): void {
    this.m.startGroup(players);
    this.expNote.set(null);
    scrollToTop();
  }

  confirmFinishGroup(): void {
    this.m.finishGroup();
    this.confirm.set(null);
    scrollToTop();
  }

  rematch(): void {
    this.m.rematch();
    scrollToTop();
  }

  changePlayers(): void {
    if (this.finished() || !this.groupHasProgress()) this.table.clearMatch();
    else this.confirm.set('changePlayers');
  }

  confirmChangePlayers(): void {
    this.table.clearMatch();
    this.confirm.set(null);
  }

  /** do ranking final para a planilha do jogador */
  viewPlayer(id: string): void {
    this.table.select(id);
    setTimeout(() => {
      document.querySelector('.sheet-stack')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  }
}

function scrollToTop(): void {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
