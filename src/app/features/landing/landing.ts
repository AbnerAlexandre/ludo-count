import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Seo } from '../../core/seo/seo';
import { SITE_URL } from '../../core/seo/seo.config';
import { I18n } from '../../core/i18n/i18n';
import { PageHeader } from '../../shared/ui/page-header';
import { SiteFooter } from '../../shared/ui/site-footer';
import { Reveal } from '../../shared/motion/reveal.directive';
import { BrandMark, SwMark } from '../../shared/svg/marks';
import { LiveDemo } from './live-demo';
import { TTR_VARIANTS } from '../ticket-to-ride/scoring/ttr-variants';

interface Faq {
  q: string;
  a: string;
}

interface Novidade {
  data?: string;
  status?: 'planejado';
  tag: string;
  titulo: string;
  descricao: string;
  tagEn?: string;
  tituloEn?: string;
  descricaoEn?: string;
}

/** novidades visíveis antes de "ver todas" */
const NEWS_PREVIEW = 5;

/** número de perguntas no FAQ (chaves faq.1 … faq.N no dicionário) */
const FAQ_COUNT = 10;

/**
 * Landing: identidade, demonstração ao vivo, escolha do jogo e o conteúdo
 * textual indexável (como funciona + FAQ + novidades).
 */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, SiteFooter, Reveal, BrandMark, SwMark, LiveDemo],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private readonly doc = inject(DOCUMENT);
  private readonly seo = inject(Seo);
  readonly i18n = inject(I18n);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));
  readonly ttrCount = TTR_VARIANTS.length;

  readonly faqs = computed<Faq[]>(() =>
    Array.from({ length: FAQ_COUNT }, (_, i) => ({
      q: this.i18n.t(`faq.${i + 1}.q`),
      a: this.i18n.t(`faq.${i + 1}.a`),
    })),
  );

  private readonly rawNovidades = signal<Novidade[]>([]);
  /** a linha do tempo abre com as mais recentes; o resto fica a um toque */
  readonly showAllNews = signal(false);
  readonly newsTotal = computed(() => this.rawNovidades().length);
  readonly novidades = computed(() => {
    const en = this.i18n.locale() === 'en';
    // planejadas primeiro, depois da mais nova para a mais antiga (a ordem do arquivo desempata)
    const sorted = this.rawNovidades()
      .map((n, i) => ({ n, i }))
      .sort((a, b) => {
        const pa = a.n.status === 'planejado' ? 0 : 1;
        const pb = b.n.status === 'planejado' ? 0 : 1;
        return pa - pb || (b.n.data ?? '').localeCompare(a.n.data ?? '') || a.i - b.i;
      })
      .map(({ n }) => n);
    const list = this.showAllNews() ? sorted : sorted.slice(0, NEWS_PREVIEW);
    return list.map((n) => ({
      data: n.data,
      status: n.status,
      tag: (en && n.tagEn) || n.tag,
      titulo: (en && n.tituloEn) || n.titulo,
      descricao: (en && n.descricaoEn) || n.descricao,
    }));
  });

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.home.title'),
        description: this.i18n.t('seo.home.desc'),
        basePath: '',
        locale: this.i18n.locale(),
        breadcrumbs: [],
      });
    });

    // FAQPage JSON-LD casado com o FAQ visível (só na landing)
    effect(() => this.injectFaqStructuredData(this.faqs()));
    inject(DestroyRef).onDestroy(() => this.doc.head.querySelector('script[data-faq]')?.remove());

    if (this.isBrowser) this.loadNovidades();
  }

  fmtDate(iso?: string): string {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(this.i18n.locale() === 'en' ? 'en-US' : 'pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso + 'T12:00:00'));
    } catch {
      return iso;
    }
  }

  private async loadNovidades(): Promise<void> {
    try {
      const res = await fetch('novidades.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = (await res.json()) as { itens?: Novidade[] };
      this.rawNovidades.set(data.itens ?? []);
    } catch {
      /* novidades são complementares — falha não quebra a página */
    }
  }

  private injectFaqStructuredData(faqs: Faq[]): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      inLanguage: this.i18n.locale() === 'en' ? 'en' : 'pt-BR',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const existing = this.doc.head.querySelector('script[data-faq]');
    const script = existing ?? this.doc.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-faq', '');
    script.textContent = JSON.stringify(jsonLd);
    if (!existing) this.doc.head.appendChild(script);
  }
}
