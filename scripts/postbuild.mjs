/**
 * Depois do build: publica a página "não encontrada" prerenderizada como
 * `404.html` na raiz da saída. A Vercel serve esse arquivo (com status 404)
 * para qualquer URL que não exista, em vez da página padrão dela.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist/ludocount/browser');
const src = resolve(out, '404/index.html');

if (!existsSync(src)) {
  console.warn('[postbuild] 404/index.html não encontrado — 404.html não foi gerado');
} else {
  copyFileSync(src, resolve(out, '404.html'));
  console.log('[postbuild] 404.html publicado na raiz da saída');
}
