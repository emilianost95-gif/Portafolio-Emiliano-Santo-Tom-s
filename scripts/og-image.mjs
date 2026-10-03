// Genera public/og-image.png (1200x630) desde scripts/og-card.html.
// Uso: node scripts/og-image.mjs  (requiere playwright instalado)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const card = new URL('./og-card.html', import.meta.url);
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(card.href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log('OG image →', out);
