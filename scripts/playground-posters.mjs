// Genera las miniaturas del playground: una captura real de cada experimento corriendo.
// Uso: node scripts/playground-posters.mjs   (con `npm run dev` corriendo)
// Al agregar un experimento en data/experiments.ts, sumar acá cómo posar para la foto.
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = 'public/playground';
// Fracción del lienzo (x, y) por donde pasa el puntero antes de la captura, y cuánto esperar.
const POSES = {
  'domain-warp': { path: [[0.5, 0.5], [0.42, 0.46]], settle: 1800 },
  'spring-type': { path: [[0.02, 0.1], [0.1, 0.3]], settle: 1400 },
  'flow-field': { path: [[0.62, 0.42]], settle: 5200 },
  'verlet-cloth': { path: [[0.5, 0.95], [0.58, 0.5]], settle: 2600 },
  'relay-loop': { path: [[0.5, 0.42]], settle: 6500 },
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
// Dos columnas a 2x: todas las miniaturas salen del mismo tamaño (~900 px de ancho).
const page = await (await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })).newPage();
await page.goto('http://localhost:3210/?gfx=static');
await page.waitForSelector('html[data-ready]');
// Fuera el cursor propio y las pistas de texto: la foto es solo del experimento.
await page.addStyleTag({ content: '.cursor, .tile__hint { display: none !important; }' });

const tiles = page.locator('.tile');
const count = await tiles.count();
for (let i = 0; i < count; i++) {
  const tile = tiles.nth(i);
  const run = tile.locator('.tile__run');
  const id = (await run.getAttribute('data-experiment')) ?? '';
  const pose = POSES[id];
  if (!pose) {
    console.warn(`sin pose para "${id}": se omite`);
    continue;
  }
  await run.scrollIntoViewIfNeeded();
  await run.click();
  const screen = tile.locator('.tile__screen');
  await page.waitForTimeout(900);
  const box = await screen.boundingBox();
  for (const [x, y] of pose.path) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 12 });
  }
  await page.waitForTimeout(pose.settle);
  await tile.locator('canvas').screenshot({ path: `${OUT}/${id}.jpg`, type: 'jpeg', quality: 78 });
  await page.mouse.move(5, 5);
  await run.click();
  console.log(`✓ ${id}`);
}
await browser.close();
