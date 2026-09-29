import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import { SevenWondersMatch } from '../../../core/services/sw-match';
import { NumField } from '../../../shared/ui/num-field';
import { Switch } from '../../../shared/ui/switch';
import { Choice, type ChoiceOption } from '../../../shared/ui/choice';
import { DUEL_MILITARY_ZONES, DUEL_TEMPLE_VP, type SwDuelState } from '../scoring/sw-scoring';
import { SwCat } from './sw-cat';

/** Planilha do 7 Wonders Duel (+ Pantheon, Agora). */
@Component({
  selector: 'app-sw-duel-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwCat, NumField, Switch, Choice],
  template: `
    <app-sw-cat [label]="t('sw.cat.civilian')" [hint]="t('sw.hint.duelCards')" color="var(--sw-civil)" [points]="pts('sw.cat.civilian')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().civilian" (valueChange)="patch({ civilian: $event })" [max]="99" [label]="t('sw.cat.civilian')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.scienceCards')" [hint]="t('sw.hint.duelScience')" color="var(--sw-science)" [points]="pts('sw.cat.scienceCards')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().science" (valueChange)="patch({ science: $event })" [max]="99" [label]="t('sw.cat.scienceCards')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.commercial')" color="var(--sw-commerce)" [points]="pts('sw.cat.commercial')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().commercial" (valueChange)="patch({ commercial: $event })" [max]="99" [label]="t('sw.cat.commercial')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.guilds')" [hint]="t('sw.hint.duelGuilds')" color="var(--sw-guild)" [points]="pts('sw.cat.guilds')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().guilds" (valueChange)="patch({ guilds: $event })" [max]="99" [label]="t('sw.cat.guilds')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.wonder')" color="var(--sw-wonder)" [points]="pts('sw.cat.wonder')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().wonders" (valueChange)="patch({ wonders: $event })" [max]="99" [label]="t('sw.cat.wonder')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.progress')" [hint]="t('sw.hint.duelProgress')" color="var(--sw-science)" [points]="pts('sw.cat.progress')">
      <div class="fld">
        <span class="fl">{{ t('sw.duel.agriculture') }}<small>+4</small></span>
        <app-switch [checked]="s().agriculture" (checkedChange)="patch({ agriculture: $event })" [label]="t('sw.duel.agriculture')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.duel.philosophy') }}<small>+7</small></span>
        <app-switch [checked]="s().philosophy" (checkedChange)="patch({ philosophy: $event })" [label]="t('sw.duel.philosophy')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.duel.mathematics') }}<small>{{ t('sw.duel.mathematicsHint') }}</small></span>
        <app-switch [checked]="s().mathematics" (checkedChange)="patch({ mathematics: $event })" [label]="t('sw.duel.mathematics')" [disabled]="locked()" />
      </div>
      @if (s().mathematics) {
        <div class="fld pop-in">
          <span class="fl">{{ t('sw.field.progressCount') }}</span>
          <app-num-field [value]="s().progressCount" (valueChange)="patch({ progressCount: $event })" [min]="1" [max]="10" [label]="t('sw.field.progressCount')" [disabled]="locked()" />
        </div>
      }
      <div class="fld">
        <span class="fl">{{ t('sw.field.otherProgress') }}<small>{{ t('sw.field.otherProgressHint') }}</small></span>
        <app-num-field [value]="s().progressOther" (valueChange)="patch({ progressOther: $event })" [max]="99" [label]="t('sw.field.otherProgress')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.treasury')" [hint]="t('sw.hint.treasury')" color="var(--sw-coin)" [points]="pts('sw.cat.treasury')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.coins') }}</span>
        <app-num-field [value]="s().coins" (valueChange)="patch({ coins: $event })" [max]="199" [label]="t('sw.field.coins')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.military')" [hint]="t('sw.hint.duelMilitary')" color="var(--sw-military)" [points]="pts('sw.cat.military')">
      <app-choice [options]="zones()" [value]="s().militaryZone" (valueChange)="patch({ militaryZone: +($event ?? 0) })" [label]="t('sw.cat.military')" [disabled]="locked()" />
    </app-sw-cat>

    @if (s().expansions.pantheon) {
      <app-sw-cat class="pop-in" [label]="t('sw.cat.temples')" [hint]="t('sw.hint.temples')" color="var(--sw-babel)" [points]="pts('sw.cat.temples')">
        <app-choice [options]="temples()" [value]="s().temples" (valueChange)="patch({ temples: +($event ?? 0) })" [label]="t('sw.cat.temples')" [disabled]="locked()" />
      </app-sw-cat>
      <app-sw-cat class="pop-in" [label]="t('sw.cat.divinities')" [hint]="t('sw.hint.divinities')" color="var(--sw-babel)" [points]="pts('sw.cat.divinities')">
        <div class="fld">
          <span class="fl">{{ t('sw.field.vp') }}</span>
          <app-num-field [value]="s().divinities" (valueChange)="patch({ divinities: $event })" [max]="99" [label]="t('sw.cat.divinities')" [disabled]="locked()" />
        </div>
      </app-sw-cat>
    }

    @if (s().expansions.agora) {
      <app-sw-cat class="pop-in" [label]="t('sw.cat.senate')" [hint]="t('sw.hint.senate')" color="var(--sw-edifice)" [points]="pts('sw.cat.senate')">
        <div class="fld">
          <span class="fl">{{ t('sw.field.vp') }}</span>
          <app-num-field [value]="s().senate" (valueChange)="patch({ senate: $event })" [max]="99" [label]="t('sw.cat.senate')" [disabled]="locked()" />
        </div>
      </app-sw-cat>
      <app-sw-cat class="pop-in" [label]="t('sw.cat.conspiracies')" color="var(--sw-edifice)" [points]="pts('sw.cat.conspiracies')">
        <div class="fld">
          <span class="fl">{{ t('sw.field.vp') }}</span>
          <app-num-field [value]="s().conspiracies" (valueChange)="patch({ conspiracies: $event })" [max]="99" [label]="t('sw.cat.conspiracies')" [disabled]="locked()" />
        </div>
      </app-sw-cat>
    }
  `,
  styleUrl: './sw-form.scss',
})
export class SwDuelForm {
  readonly m = inject(SevenWondersMatch);
  readonly i18n = inject(I18n);
  readonly s = this.m.duel;
  readonly locked = this.m.finished;

  readonly zones = computed<ChoiceOption[]>(() =>
    DUEL_MILITARY_ZONES.map((vp) => ({ value: vp, label: String(vp), sub: this.i18n.t('common.pts') })),
  );
  readonly temples = computed<ChoiceOption[]>(() =>
    DUEL_TEMPLE_VP.map((vp, n) => ({ value: n, label: String(n), sub: `${vp} ${this.i18n.t('common.pts')}` })),
  );

  t(key: string): string {
    return this.i18n.t(key);
  }
  pts(key: string): number {
    return this.m.points(key);
  }
  patch(p: Partial<SwDuelState>): void {
    this.m.patchDuel(p);
  }
}
