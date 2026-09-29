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
import { SwMark } from '../../../shared/svg/marks';
import { findSwVariant, swExpName, swName, swNote, type SwExpansion } from '../scoring/sw-variants';
import { type DuelVictory } from '../scoring/sw-scoring';
import { SwBaseForm } from './sw-base-form';
import { SwDuelForm } from './sw-duel-form';
import { SwArchitectsForm } from './sw-architects-form';

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
    SwMark,
    SwBaseForm,
    SwDuelForm,
    SwArchitectsForm,
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
  readonly confirm = signal<'finish' | 'new' | null>(null);

  readonly variant = this.m.variant;
  readonly finished = this.m.finished;
  readonly selectPath = computed(() => `${this.i18n.locale() === 'en' ? '/en' : ''}/7-wonders`);
  readonly name = computed(() => {
    const v = this.variant();
    return v ? swName(v, this.i18n.locale()) : '7 Wonders';
  });
  /** "Duel", "Architects"… — o cabeçalho mostra "7 Wonders" pequeno em cima, para caber no celular */
  readonly subName = computed(() => this.name().replace(/^7 Wonders\s*/, ''));

  readonly victoryOptions = computed<ChoiceOption[]>(() => {
    const opts: DuelVictory[] = ['civilian', 'military', 'science'];
    if (this.m.duel().expansions.agora) opts.push('political');
    return opts.map((v) => ({ value: v, label: this.i18n.t(`sw.victoryShort.${v}`) }));
  });

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
}
