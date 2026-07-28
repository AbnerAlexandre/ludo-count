import { Injectable, DOCUMENT, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from './seo.config';
import { localizedPath, type Locale } from '../i18n/i18n';

export interface SeoData {
  /** Título da aba e do resultado de busca. */
  title: string;
  /** Meta description (~150-160 caracteres). */
  description?: string;
  /** Caminho-base em pt, ex.: '/azul' ('' = home). O idioma é aplicado por cima. */
  basePath?: string;
  /** Idioma da página atual. */
  locale: Locale;
  /** Imagem de compartilhamento absoluta. */
  image?: string;
}

/**
 * Centraliza title/description/canonical/Open Graph e os `hreflang` por rota e
 * por idioma. Numa SPA o <head> não muda sozinho ao navegar, então isso é o que
 * faz cada página (pt e en) ser indexada corretamente e apontar para a sua
 * versão no outro idioma.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  update(data: SeoData): void {
    const base = data.basePath ?? '';
    const url = `${SITE_URL}${localizedPath(base, data.locale)}`;
    const description = data.description ?? '';
    const image = data.image ?? DEFAULT_OG_IMAGE;
    const ogLocale = data.locale === 'en' ? 'en_US' : 'pt_BR';

    this.title.setTitle(data.title);
    this.doc.documentElement.lang = data.locale === 'en' ? 'en' : 'pt-BR';

    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: ogLocale });

    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
    this.setAlternates(base);
  }

  /** Só o título muda (ex.: placar ao vivo), sem mexer no resto do <head>. */
  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  private setCanonical(url: string): void {
    this.upsertLink('canonical', null, url);
  }

  /** hreflang para pt-BR, en e x-default (padrão pt). */
  private setAlternates(basePath: string): void {
    this.upsertLink('alternate', 'pt-BR', `${SITE_URL}${localizedPath(basePath, 'pt')}`);
    this.upsertLink('alternate', 'en', `${SITE_URL}${localizedPath(basePath, 'en')}`);
    this.upsertLink('alternate', 'x-default', `${SITE_URL}${localizedPath(basePath, 'pt')}`);
  }

  private upsertLink(rel: string, hreflang: string | null, href: string): void {
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let link = this.doc.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', rel);
      if (hreflang) link.setAttribute('hreflang', hreflang);
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
