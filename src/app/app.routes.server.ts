import { RenderMode, ServerRoute } from '@angular/ssr';
import { TTR_VARIANTS } from './features/ticket-to-ride/scoring/ttr-variants';
import { SW_VARIANTS } from './features/seven-wonders/scoring/sw-variants';

const ttrParams = async () => TTR_VARIANTS.map((v) => ({ variantId: v.id }));
const swParams = async () => SW_VARIANTS.map((v) => ({ variantId: v.id }));

/**
 * Prerender de todas as rotas nos dois idiomas. As rotas dinâmicas enumeram os
 * ids a partir da própria configuração, então cada edição ou versão nova entra
 * no prerender (e no sitemap) sem trabalho manual.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'ticket-to-ride/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: ttrParams },
  { path: 'en/ticket-to-ride/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: ttrParams },
  { path: '7-wonders/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: swParams },
  { path: 'en/7-wonders/:variantId', renderMode: RenderMode.Prerender, getPrerenderParams: swParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
