import { Injectable, DOCUMENT, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from './seo.config';

export interface SeoData {
  /** Título da aba e do resultado de busca. */
  title: string;
  /** Meta description (~150-160 caracteres). */
  description?: string;
  /** Caminho da rota, ex.: '/azul'. */
  path?: string;
  /** Imagem de compartilhamento absoluta. */
  image?: string;
}

/**
 * Centraliza title/description/canonical/Open Graph por rota.
 *
 * Numa SPA o <head> não muda sozinho ao navegar: sem isso todas as rotas
 * compartilhariam a mesma descrição e o mesmo canonical, o que enfraquece a
 * indexação de cada página.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  update(data: SeoData): void {
    const description = data.description ?? DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${data.path ?? ''}`;
    const image = data.image ?? DEFAULT_OG_IMAGE;

    this.title.setTitle(data.title);

    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });

    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
  }

  /** Só o título muda (ex.: placar ao vivo), sem mexer no resto do <head>. */
  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
