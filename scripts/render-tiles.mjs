/**
 * Exporta a arte das peças das variantes do Azul (design/azul-tiles.html)
 * para WebP com fundo transparente em public/.
 *
 * Abre um Chrome sem janela, fala com ele pelo protocolo de depuração (CDP)
 * e fotografa cada elemento com [data-out]. Rodar só quando a arte mudar:
 *   node scripts/render-tiles.mjs
 * Chrome em outro lugar? CHROME_PATH=/caminho/do/chrome node scripts/render-tiles.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = pathToFileURL(resolve(root, 'design/azul-tiles.html')).href;
const SCALE = 2; // imagens nítidas em telas de alta densidade
const PORT = 9333;

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chromePath = candidates.find((p) => existsSync(p));
if (!chromePath) throw new Error('Chrome não encontrado — defina CHROME_PATH');

const profile = mkdtempSync(join(tmpdir(), 'ludocount-tiles-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageSocketUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const target = list.find((t) => t.type === 'page');
      if (target) return target.webSocketDebuggerUrl;
    } catch {
      /* Chrome ainda subindo */
    }
    await sleep(200);
  }
  throw new Error('Chrome não respondeu na porta de depuração');
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: ok, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      listeners.get(msg.method)(msg.params);
      listeners.delete(msg.method);
    }
  });
  const ready = new Promise((ok) => ws.addEventListener('open', ok, { once: true }));
  return {
    ready,
    send: (method, params = {}) =>
      new Promise((ok, reject) => {
        const msgId = ++id;
        pending.set(msgId, { resolve: ok, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      }),
    once: (method) => new Promise((ok) => listeners.set(method, ok)),
    close: () => ws.close(),
  };
}

try {
  const cdp = connect(await pageSocketUrl());
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 2400, deviceScaleFactor: 1, mobile: false });
  // fundo transparente: as quinas fora do losango/hexágono saem vazias
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: page });
  await loaded;
  await sleep(300);

  const { result } = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `[...document.querySelectorAll('[data-out]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { out: el.dataset.out, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    })`,
  });

  for (const t of result.value) {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'webp',
      quality: 92,
      captureBeyondViewport: true,
      clip: { x: t.x, y: t.y, width: t.w, height: t.h, scale: SCALE },
    });
    const file = resolve(root, 'public', t.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
  }
  console.log(`[tiles] ${result.value.length} peças exportadas para public/azul/`);
  cdp.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
