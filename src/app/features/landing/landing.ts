import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Seo } from '../../core/seo/seo';
import { SITE_URL } from '../../core/seo/seo.config';
import { I18n } from '../../core/i18n/i18n';

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

/**
 * Landing / hero. Concentra o conteúdo textual indexável (seção "como funciona"
 * + FAQ) em pt e en — as telas de jogo são calculadoras com pouco texto.
 */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly seo = inject(Seo);
  readonly i18n = inject(I18n);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly stage = viewChild<ElementRef<HTMLElement>>('stage');

  /** Prefixo de rota do idioma atual, para os links dos cards. */
  readonly base = computed(() => (this.i18n.locale() === 'en' ? '/en' : ''));

  /** FAQ traduzido, reativo ao idioma. */
  readonly faqs = computed<Faq[]>(() =>
    [1, 2, 3, 4, 5, 6, 7].map((i) => ({
      q: this.i18n.t(`faq.${i}.q`),
      a: this.i18n.t(`faq.${i}.a`),
    })),
  );

  private readonly rawNovidades = signal<Novidade[]>([]);
  /** Novidades resolvidas para o idioma atual. */
  readonly novidades = computed(() => {
    const en = this.i18n.locale() === 'en';
    return this.rawNovidades().map((n) => ({
      data: n.data,
      status: n.status,
      tag: (en && n.tagEn) || n.tag,
      titulo: (en && n.tituloEn) || n.titulo,
      descricao: (en && n.descricaoEn) || n.descricao,
    }));
  });

  readonly discord = '@graaay.sh';
  readonly copied = signal(false);

  constructor() {
    effect(() => {
      this.seo.update({
        title: this.i18n.t('seo.home.title'),
        description: this.i18n.t('seo.home.desc'),
        basePath: '',
        locale: this.i18n.locale(),
      });
    });

    // FAQPage JSON-LD reflete o idioma atual (fica só na landing).
    effect(() => this.injectFaqStructuredData(this.faqs()));

    if (this.isBrowser) {
      this.loadNovidades();
    }

    afterNextRender(async () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = this.host.nativeElement as HTMLElement;
      const items = Array.from(root.querySelectorAll<HTMLElement>('[data-anim]'));
      if (reduce) {
        items.forEach((el) => (el.style.opacity = '1'));
        return;
      }
      try {
        const { gsap } = await import('gsap');
        gsap.set(items, { opacity: 0, y: 24 });
        gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.09, delay: 0.05 });
      } catch {
        items.forEach((el) => (el.style.opacity = '1'));
      }
    });
  }

  copyDiscord(): void {
    if (!this.isBrowser) return;
    navigator.clipboard?.writeText(this.discord).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      },
      () => {},
    );
  }

  private async loadNovidades(): Promise<void> {
    try {
      const res = await fetch('novidades.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = (await res.json()) as { itens?: Novidade[] };
      this.rawNovidades.set((data.itens ?? []).slice(0, 5));
    } catch {
      /* novidades são complementares — falha não quebra a página */
    }
  }

  private injectFaqStructuredData(faqs: Faq[]): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
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
