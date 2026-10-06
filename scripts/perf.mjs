// Medición rápida de frames con GPU real mientras se recorre toda la página.
// Uso: node scripts/perf.mjs [low|medium|high]   (con `npm run dev` corriendo)
// Chromium headless sincroniza a 60 Hz: sirve para detectar frames perdidos, no para medir el techo.
import { chromium } from '@playwright/test';

const level = process.argv[2] ?? 'high';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await page.goto(`http://localhost:3210/?gfx=${level}`);
await page.waitForSelector('html[data-ready]');
await page.waitForTimeout(2500);

const result = await page.evaluate(async () => {
  const deltas = [];
  const heapBefore = performance.memory?.usedJSHeapSize ?? 0;
  const total = document.documentElement.scrollHeight - innerHeight;
  const duration = 12_000;
  const start = performance.now();
  let last = start;
  await new Promise((resolve) => {
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      const t = (now - start) / duration;
      // Ida y vuelta: baja hasta el final y vuelve al inicio.
      window.scrollTo(0, total * (t < 0.5 ? t * 2 : 2 - t * 2));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  deltas.sort((a, b) => a - b);
  const at = (q) => deltas[Math.floor(deltas.length * q)];
  return {
    frames: deltas.length,
    avgFps: Math.round((deltas.length / duration) * 1000),
    p50ms: +at(0.5).toFixed(1),
    p95ms: +at(0.95).toFixed(1),
    p99ms: +at(0.99).toFixed(1),
    over25ms: deltas.filter((d) => d > 25).length,
    heapGrowthMB: +(((performance.memory?.usedJSHeapSize ?? 0) - heapBefore) / 1048576).toFixed(1),
    gfx: document.documentElement.dataset.gfx,
  };
});
const renderer = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  return gl && info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'desconocido';
});
console.log(JSON.stringify({ level, renderer, ...result }, null, 2));
await browser.close();
