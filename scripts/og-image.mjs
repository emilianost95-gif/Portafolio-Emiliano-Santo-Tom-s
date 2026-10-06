// Regenera public/og-image.jpg (1200x630) a partir del hero, con GPU real.
// Uso: node scripts/og-image.mjs   (con `npm run dev` corriendo)
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
await page.goto('http://localhost:3210/?gfx=high');
await page.waitForSelector('html[data-ready]');
await page.mouse.move(840, 280);
await page.waitForTimeout(3000);
await page.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 84 });
await browser.close();
