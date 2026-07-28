import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Seo } from '../../core/seo/seo';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_URL } from '../../core/seo/seo.config';

interface Faq {
  q: string;
  a: string;
}

interface Novidade {
  /** ausente em itens planejados (ainda não lançados) */
  data?: string;
  /** 'planejado' aparece como "Em breve"; padrão é lançado */
  status?: 'planejado';
  tag: string;
  titulo: string;
  descricao: string;
}

/**
 * Landing / hero. Estabelece a identidade do app e concentra o conteúdo textual
 * indexável (seção "como funciona" + FAQ) — as telas de jogo são calculadoras
 * com pouco texto, então é aqui que mora o conteúdo de busca.
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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly stage = viewChild<ElementRef<HTMLElement>>('stage');

  /** Perguntas frequentes — renderizadas na página E publicadas como FAQPage (JSON-LD). */
  readonly faqs: Faq[] = [
    {
      q: 'O LudoCount é gratuito?',
      a: 'Sim. O contador de pontos é 100% gratuito, sem cadastro e sem anúncios. Basta abrir no navegador.',
    },
    {
      q: 'Preciso instalar alguma coisa?',
      a: 'Não. Funciona direto no navegador do celular, tablet ou computador. Você também pode instalá-lo como aplicativo (PWA) se quiser um atalho na tela inicial.',
    },
    {
      q: 'Como o contador do Azul calcula os pontos?',
      a: 'Você marca na parede 5x5 quais azulejos entraram na rodada e o app pontua por ligação (horizontal e vertical, contando o cruzamento duas vezes), aplica as penalidades da linha do chão e, ao terminar a partida, soma os bônus de linhas, colunas e cores completas.',
    },
    {
      q: 'A pontuação pode ficar negativa?',
      a: 'No Azul não — a pontuação nunca fica abaixo de zero. No Ticket to Ride a pontuação final pode ser negativa quando os bilhetes não completados descontam mais do que as rotas somam.',
    },
    {
      q: 'Quais edições do Ticket to Ride são suportadas?',
      a: 'Treze edições, cada uma com sua tabela de pontos por rota e seus bônus: EUA, Europa, Nordic Countries, Märklin, Switzerland, Índia, Heart of Africa, Nederland, Pennsylvania, Legendary Asia, Japão, Itália e França.',
    },
    {
      q: 'Meus dados ficam salvos?',
      a: 'A partida em andamento é salva no próprio navegador (localStorage) e nada é enviado para nenhum servidor. Se você atualizar a página, o placar continua de onde parou.',
    },
    {
      q: 'Funciona sem internet?',
      a: 'Depois de carregar a primeira vez, o contador funciona offline — ideal para usar na mesa durante a partida.',
    },
  ];

  readonly novidades = signal<Novidade[]>([]);

  readonly discord = '@graaay.sh';
  readonly copied = signal(false);

  constructor() {
    inject(Seo).update({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
    });

    this.injectFaqStructuredData();

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
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          delay: 0.05,
        });
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
      () => {
        /* navegador sem permissão de clipboard — o usuário ainda vê o @ na tela */
      },
    );
  }

  private async loadNovidades(): Promise<void> {
    try {
      const res = await fetch('novidades.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = (await res.json()) as { itens?: Novidade[] };
      this.novidades.set((data.itens ?? []).slice(0, 5));
    } catch {
      /* novidades são complementares — falha não quebra a página */
    }
  }

  /**
   * Publica o FAQ como dados estruturados FAQPage. Roda também no prerender,
   * então o bloco fica no HTML estático e pode render rich results no Google.
   * Fica só na landing (onde o FAQ é visível), como o Google recomenda.
   */
  private injectFaqStructuredData(): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: this.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    script.setAttribute('data-faq', '');
    // evita duplicar se o componente remontar
    this.doc.head.querySelector('script[data-faq]')?.remove();
    this.doc.head.appendChild(script);
  }
}
