import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../../core/i18n/i18n';
import { SevenWondersMatch } from '../../../core/services/sw-match';
import { NumField } from '../../../shared/ui/num-field';
import { Switch } from '../../../shared/ui/switch';
import { type SwArchitectsState } from '../scoring/sw-scoring';
import { SwCat } from './sw-cat';

/** Planilha do 7 Wonders Architects. */
@Component({
  selector: 'app-sw-architects-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwCat, NumField, Switch],
  template: `
    <app-sw-cat [label]="t('sw.cat.wonder')" [hint]="t('sw.hint.archWonder')" color="var(--sw-wonder)" [points]="pts('sw.cat.wonder')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().wonder" (valueChange)="patch({ wonder: $event })" [max]="99" [label]="t('sw.cat.wonder')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.arch.wonderComplete') }}</span>
        <app-switch [checked]="s().wonderComplete" (checkedChange)="patch({ wonderComplete: $event })" [label]="t('sw.arch.wonderComplete')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.civilian')" [hint]="t('sw.hint.archBlue')" color="var(--sw-civil)" [points]="pts('sw.cat.civilian')">
      <div class="fld">
        <span class="fl">{{ t('sw.field.vp') }}</span>
        <app-num-field [value]="s().blue" (valueChange)="patch({ blue: $event })" [max]="99" [label]="t('sw.cat.civilian')" [disabled]="locked()" />
      </div>
      @if (s().politics) {
        <div class="fld pop-in">
          <span class="fl">{{ t('sw.arch.catIcons') }}<small>{{ t('sw.arch.catIconsHint') }}</small></span>
          <app-num-field [value]="s().catIcons" (valueChange)="patch({ catIcons: $event })" [max]="30" [label]="t('sw.arch.catIcons')" [disabled]="locked()" />
        </div>
      }
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.military')" [hint]="t('sw.hint.archMilitary')" color="var(--sw-military)" [points]="pts('sw.cat.military')">
      <div class="fld">
        <span class="fl">{{ t('sw.arch.militaryTokens') }}</span>
        <app-num-field [value]="s().militaryTokens" (valueChange)="patch({ militaryTokens: $event })" [max]="30" [label]="t('sw.arch.militaryTokens')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.cat')" [hint]="t('sw.hint.archCat')" color="var(--sw-leader)" [points]="pts('sw.cat.cat')">
      <div class="fld">
        <span class="fl">{{ t('sw.arch.catPawn') }}</span>
        <app-switch [checked]="s().cat" (checkedChange)="patch({ cat: $event })" [label]="t('sw.arch.catPawn')" [disabled]="locked()" />
      </div>
    </app-sw-cat>

    <app-sw-cat [label]="t('sw.cat.progress')" [hint]="t('sw.hint.archProgress')" color="var(--sw-science)" [points]="pts('sw.cat.progress')">
      <div class="fld">
        <span class="fl">{{ t('sw.arch.strategy') }}<small>{{ t('sw.arch.strategyHint') }}</small></span>
        <app-switch [checked]="s().strategy" (checkedChange)="patch({ strategy: $event })" [label]="t('sw.arch.strategy')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.arch.education') }}<small>{{ t('sw.arch.educationHint') }}</small></span>
        <app-switch
          [checked]="s().education"
          (checkedChange)="patch({ education: $event, progressCount: Math.max(1, s().progressCount) })"
          [label]="t('sw.arch.education')"
          [disabled]="locked()"
        />
      </div>
      @if (s().education) {
        <div class="fld pop-in">
          <span class="fl">{{ t('sw.field.progressCount') }}</span>
          <app-num-field [value]="s().progressCount" (valueChange)="patch({ progressCount: $event })" [min]="1" [max]="15" [label]="t('sw.field.progressCount')" [disabled]="locked()" />
        </div>
      }
      <div class="fld">
        <span class="fl">{{ t('sw.arch.decor') }}<small>{{ t('sw.arch.decorHint') }}</small></span>
        <app-switch [checked]="s().decor" (checkedChange)="patch({ decor: $event })" [label]="t('sw.arch.decor')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.arch.politics') }}<small>{{ t('sw.arch.politicsHint') }}</small></span>
        <app-switch [checked]="s().politics" (checkedChange)="patch({ politics: $event })" [label]="t('sw.arch.politics')" [disabled]="locked()" />
      </div>
      <div class="fld">
        <span class="fl">{{ t('sw.field.otherProgress') }}<small>{{ t('sw.arch.otherHint') }}</small></span>
        <app-num-field [value]="s().progressOther" (valueChange)="patch({ progressOther: $event })" [max]="99" [label]="t('sw.field.otherProgress')" [disabled]="locked()" />
      </div>
    </app-sw-cat>
  `,
  styleUrl: './sw-form.scss',
})
export class SwArchitectsForm {
  readonly m = inject(SevenWondersMatch);
  readonly i18n = inject(I18n);
  readonly s = this.m.architects;
  readonly locked = this.m.finished;
  protected readonly Math = Math;

  t(key: string): string {
    return this.i18n.t(key);
  }
  pts(key: string): number {
    return this.m.points(key);
  }
  patch(p: Partial<SwArchitectsState>): void {
    this.m.patchArchitects(p);
  }
}
