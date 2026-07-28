import { RenderMode, ServerRoute } from '@angular/ssr';
import { TTR_VARIANTS } from './features/ticket-to-ride/scoring/ttr-variants';

const variantParams = async () => TTR_VARIANTS.map((v) => ({ variantId: v.id }));

/**
 * Prerender de todas as rotas nos dois idiomas. As rotas dinâmicas das edições
 * enumeram os ids a partir da configuração, então cada edição gera páginas pt e
 * en (13 × 2) automaticamente. Total: 32 páginas estáticas.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'ticket-to-ride/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: variantParams },
  { path: 'en/ticket-to-ride/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: variantParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
