// Revisión visual: recorre el sitio con GPU real y guarda capturas en test-results/shots.
// Uso: node scripts/shots.mjs [desktop|mobile]   (con `npm run dev` corriendo)
import { mkdirSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const BASE = 'http://localhost:3210';
const OUT = 'test-results/shots';
const target = process.argv[2] ?? 'desktop';
const context =
  target === 'mobile' ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext(context)).newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`);
});

const shot = async (name, settle = 1800) => {
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${OUT}/${target}-${name}.png` });
};
const scrollTo = (expression) => page.evaluate(`window.scrollTo(0, ${expression})`);
const originStep = (step) =>
  scrollTo(`(() => { const o = document.getElementById('origin'); return o.offsetTop + o.offsetHeight * ${step + 0.5} / 7 - innerHeight / 2; })()`);
const section = (id) => scrollTo(`document.getElementById('${id}').offsetTop`);

await page.goto(`${BASE}/?gfx=high`);
await shot('00-intro', 500);
await page.waitForSelector('html[data-ready]');
if (target === 'desktop') await page.mouse.move(1000, 420);
await shot('01-hero', 2600);
for (const step of [0, 1, 2, 3, 4, 5, 6]) {
  await originStep(step);
  await shot(`02-origin-${step}`);
}
await section('systems');
await shot('03-systems');
if (target === 'desktop') {
  await page.getByRole('button', { name: /SMARTGROW/ }).hover();
  await shot('03-systems-hover', 2200);
}
await page.getByRole('button', { name: /GESTOR DE PRECIOS/ }).click();
await shot('04-viewer', 2600);
await page.keyboard.press('Escape');
await section('stack');
await shot('05-stack');
await section('playground');
await page.getByRole('button', { name: /RUN DOMAIN WARP/ }).click();
await shot('06-playground', 1500);
await page.getByRole('button', { name: /RUN SPRING TYPE/ }).click();
await shot('06-playground-b', 1500);
await page.getByRole('button', { name: /STOP SPRING TYPE/ }).click();
await scrollTo('document.documentElement.scrollHeight');
await shot('07-contact', 2400);
if (target === 'desktop') {
  await page.keyboard.press('Shift');
  await shot('08-deep', 1600);
  await page.keyboard.press('Shift');
  await page.keyboard.press('e');
  await page.keyboard.type('system');
  await page.keyboard.press('Enter');
  await shot('09-terminal', 600);
}

const stats = await page.evaluate(() => ({ gfx: document.documentElement.dataset.gfx }));
console.log(JSON.stringify({ target, stats, problems }, null, 2));
await browser.close();
