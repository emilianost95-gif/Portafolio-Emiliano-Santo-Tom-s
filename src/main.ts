// index.css trae los subsets con unicode-range: el navegador baja solo el latino.
import '@fontsource-variable/space-grotesk/index.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { detectCapabilities, type GpuBackend } from './core/capabilities';
import { QUALITY_PROFILES, initialQuality, readOverride, type QualityLevel } from './core/quality';
import { initActiveNav } from './ui/nav';

/**
 * Orden de carga (punto 14):
 *   1. El HTML ya trae todo el contenido → visible y usable desde el primer paint.
 *   2. Comportamiento mínimo de UI (navegación activa).
 *   3. Cuando el navegador está libre: detectar capacidades.
 *   4. Solo si corresponde: descargar la capa gráfica (chunk aparte).
 */

const BACKEND_LABEL: Record<GpuBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', none: 'sin GPU' };
const LEVEL_LABEL: Record<QualityLevel, string> = {
  static: 'modo estático',
  low: 'calidad baja',
  medium: 'calidad media',
  high: 'calidad alta',
};

function whenIdle(task: () => void): void {
  if ('requestIdleCallback' in window) requestIdleCallback(task, { timeout: 2000 });
  else setTimeout(task, 200);
}

async function bootEnhancements(): Promise<void> {
  const root = document.documentElement;
  const caps = await detectCapabilities();
  const level = initialQuality(caps, readOverride());

  root.dataset.gfx = level;
  root.dataset.backend = caps.backend;
  const label = document.querySelector<HTMLElement>('[data-gfx-label]');
  if (label) label.textContent = `Gráficos: ${BACKEND_LABEL[caps.backend]}, ${LEVEL_LABEL[level]}.`;

  if (level === 'static') return;

  const stage = document.getElementById('stage');
  if (!stage) return;
  const { bootGraphics } = await import('./graphics');
  await bootGraphics(stage, caps, QUALITY_PROFILES[level]);
}

function main(): void {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
  initActiveNav();

  whenIdle(() => {
    bootEnhancements().catch((error: unknown) => {
      // Si la capa gráfica falla, el sitio sigue completo en modo estático.
      document.documentElement.dataset.gfx = 'static';
      if (import.meta.env.DEV) console.warn('[gfx] fallback a estático:', error);
    });
  });
}

main();
