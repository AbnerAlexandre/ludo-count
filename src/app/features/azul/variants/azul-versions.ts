import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18n } from '../../../core/i18n/i18n';

export type AzulVersionId = 'classic' | 'sintra' | 'summer-pavilion' | 'queens-garden';

export interface AzulVersion {
  id: AzulVersionId;
  /** caminho-base em pt (o /en é acrescentado na navegação) */
  path: string;
  name: string;
  nameEn: string;
}

export const AZUL_VERSIONS: readonly AzulVersion[] = [
  { id: 'classic', path: '/azul', name: 'Azul', nameEn: 'Azul' },
  { id: 'sintra', path: '/azul/sintra', name: 'Vitrais de Sintra', nameEn: 'Stained Glass of Sintra' },
  { id: 'summer-pavilion', path: '/azul/summer-pavilion', name: 'Pavilhão de Verão', nameEn: 'Summer Pavilion' },
  { id: 'queens-garden', path: '/azul/queens-garden', name: 'Jardim da Rainha', nameEn: "Queen's Garden" },
];

export function azulVersionName(id: string | undefined, locale: 'pt' | 'en'): string {
  const v = AZUL_VERSIONS.find((x) => x.id === (id ?? 'classic')) ?? AZUL_VERSIONS[0];
  return locale === 'en' ? v.nameEn : v.name;
}

/** Atalhos entre o Azul e as variantes, no topo de cada contador. */
@Component({
  selector: 'app-azul-versions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="versions" [attr.aria-label]="i18n.t('azulv.versions')">
      @for (v of links(); track v.id) {
        <a
          class="v"
          [routerLink]="v.href"
          routerLinkActive="on"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          >{{ v.label }}</a
        >
      }
    </nav>
  `,
  styles: [
    `
      .versions {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        scrollbar-width: none;
        margin: 0 -16px;
        padding: 0 16px;
      }
      .versions::-webkit-scrollbar {
        display: none;
      }
      @media (min-width: 960px) {
        .versions {
          margin: 0;
          padding: 0;
          flex-wrap: wrap;
        }
      }
      .v {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        padding: 0 14px;
        border-radius: var(--radius);
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--text-dim);
        font-weight: 700;
        font-size: 0.9rem;
        text-decoration: none;
        white-space: nowrap;
        transition: background-color var(--dur-fast) ease, color var(--dur-fast) ease, border-color var(--dur-fast) ease;
      }
      .v.on {
        background: var(--game);
        border-color: var(--game);
        color: var(--game-ink);
      }
      @media (hover: hover) and (pointer: fine) {
        .v:not(.on):hover {
          border-color: var(--game-text);
          color: var(--text);
        }
      }
    `,
  ],
})
export class AzulVersions {
  readonly i18n = inject(I18n);
  readonly links = computed(() => {
    const en = this.i18n.locale() === 'en';
    return AZUL_VERSIONS.map((v) => ({
      id: v.id,
      href: (en ? '/en' : '') + v.path,
      label: v.id === 'classic' ? this.i18n.t('azulv.classic') : en ? v.nameEn : v.name,
    }));
  });
}
