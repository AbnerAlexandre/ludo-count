/**
 * Gera public/robots.txt e public/sitemap.xml a partir das rotas reais do app.
 *
 * Fonte única de verdade:
 *   - SITE_URL  -> src/app/core/seo/seo.config.ts
 *   - edições   -> src/app/features/ticket-to-ride/scoring/ttr-variants.ts
 *
 * Assim o sitemap nunca fica desatualizado quando uma edição é adicionada.
 * Roda automaticamente no `npm run build` (prebuild) ou via `npm run seo`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// --- SITE_URL -------------------------------------------------------------
const configSrc = read('src/app/core/seo/seo.config.ts');
const urlMatch = configSrc.match(/export const SITE_URL\s*=\s*['"]([^'"]+)['"]/);
if (!urlMatch) throw new Error('SITE_URL não encontrado em seo.config.ts');
const SITE_URL = urlMatch[1].replace(/\/+$/, '');

// --- edições do Ticket to Ride -------------------------------------------
const variantsSrc = read('src/app/features/ticket-to-ride/scoring/ttr-variants.ts');
const variantIds = [...variantsSrc.matchAll(/^\s{4}id:\s*'([^']+)'/gm)].map((m) => m[1]);
if (variantIds.length === 0) throw new Error('Nenhuma edição encontrada em ttr-variants.ts');

// --- rotas ----------------------------------------------------------------
/** @type {{path: string, priority: string, changefreq: string}[]} */
const routes = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/azul', priority: '0.9', changefreq: 'monthly' },
  { path: '/ticket-to-ride', priority: '0.9', changefreq: 'monthly' },
  ...variantIds.map((id) => ({
    path: `/ticket-to-ride/${id}`,
    priority: '0.7',
    changefreq: 'yearly',
  })),
];

const today = new Date().toISOString().slice(0, 10);

// --- sitemap.xml ----------------------------------------------------------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

// --- robots.txt -----------------------------------------------------------
const robots = `# robots.txt — LudoCount
# Contador de pontos para jogos de tabuleiro (Azul e Ticket to Ride).

User-agent: *
Allow: /

# Sem área privada, sem login e sem conteúdo duplicado: tudo pode ser indexado.
# Arquivos de build não trazem valor de busca:
Disallow: /*.js$
Disallow: /*.css$
Disallow: /*.map$

Sitemap: ${SITE_URL}/sitemap.xml
`;

// --- llms.txt -------------------------------------------------------------
// Convenção emergente para buscadores/assistentes de IA descreverem o site.
const variantNames = [...variantsSrc.matchAll(/^\s{4}id:\s*'([^']+)',\n\s{4}name:\s*'([^']+)'/gm)].map(
  (m) => ({ id: m[1], name: m[2] }),
);
const llms = `# LudoCount

> Contador de pontos online e gratuito para os jogos de tabuleiro Azul e Ticket to Ride.
> Roda inteiramente no navegador, sem conta e sem instalação, e mostra a origem de cada
> ponto do total numa tela de auditoria.

## Contadores

- [Contador de pontos do Azul](${SITE_URL}/azul): parede 5x5 interativa, pontuação por ligação
  (horizontal + vertical), penalidades da linha do chão e bônus de fim de partida por linhas,
  colunas e cores completas.
- [Ticket to Ride — escolha a edição](${SITE_URL}/ticket-to-ride): cada edição tem sua própria
  tabela de pontos por rota e seus bônus de fim de jogo.

## Edições do Ticket to Ride

${variantNames.map((v) => `- [${v.name}](${SITE_URL}/ticket-to-ride/${v.id})`).join('\n')}

## Observações

- O app pontua o que o jogador informa; ele não simula o estado do jogo.
- A pontuação final do Ticket to Ride pode ser negativa; a do Azul nunca fica abaixo de zero.
`;

writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap, 'utf8');
writeFileSync(resolve(root, 'public/robots.txt'), robots, 'utf8');
writeFileSync(resolve(root, 'public/llms.txt'), llms, 'utf8');

console.log(
  `[seo] robots.txt + sitemap.xml + llms.txt gerados — ${routes.length} rotas (${variantIds.length} edições) em ${SITE_URL}`,
);
