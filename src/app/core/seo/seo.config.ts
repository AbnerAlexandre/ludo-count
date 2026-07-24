/**
 * SEO configuration — single source of truth.
 *
 * ⚠️ TROQUE `SITE_URL` pela URL real de produção. Ela é usada em:
 *   - canonical / og:url de cada rota (seo.ts)
 *   - public/robots.txt e public/sitemap.xml (scripts/generate-seo.mjs)
 *   - o JSON-LD em src/index.html
 * Depois de alterar, rode `npm run seo` (ou qualquer `npm run build`) para
 * regerar robots.txt e sitemap.xml.
 */
export const SITE_URL = 'https://ludo-contador.vercel.app';

export const SITE_NAME = 'LudoCount';

export const DEFAULT_TITLE = 'LudoCount — Contador de pontos para jogos de tabuleiro';

export const DEFAULT_DESCRIPTION =
  'Contador de pontos online e gratuito para Azul e Ticket to Ride. ' +
  'Some sem erro de conta e veja de onde vem cada ponto do seu total. ' +
  'Funciona no celular, sem instalar e sem criar conta.';

/** Imagem usada em compartilhamentos (Open Graph / Twitter). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/ticket-to-ride/ticket-to-ride-logo.png`;

export const SITE_LOCALE = 'pt_BR';
