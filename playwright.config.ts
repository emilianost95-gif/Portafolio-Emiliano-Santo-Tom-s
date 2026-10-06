import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;

/**
 * Regresión de la experiencia. Usa el servidor de desarrollo: si ya hay uno en el
 * puerto lo reutiliza (Next no permite dos `next dev` en la misma carpeta).
 *
 * Chromium headless dibuja WebGL por software, así que el sitio arranca en modo
 * estático: es justo el fallback que hay que mantener sano. Los tests que
 * necesitan el canvas lo fuerzan con ?gfx=low.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
