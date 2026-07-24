import { RenderMode, ServerRoute } from '@angular/ssr';
import { TTR_VARIANTS } from './features/ticket-to-ride/scoring/ttr-variants';

/**
 * Todas as rotas são geradas estaticamente no build. A rota dinâmica das
 * edições enumera os ids a partir da própria configuração, então cada edição
 * nova entra no prerender (e no sitemap) sem trabalho manual.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'ticket-to-ride/:variantId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => TTR_VARIANTS.map((v) => ({ variantId: v.id })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
