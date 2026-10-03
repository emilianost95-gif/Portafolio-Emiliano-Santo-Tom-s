// index.css trae los subsets con unicode-range: el navegador baja solo el latino.
import '@fontsource-variable/space-grotesk/index.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { detectCapabilities, type GpuBackend } from './core/capabilities';
import { initialQuality, readOverride, type QualityLevel } from './core/quality';
import { initCards } from './ui/cards';
import { initActiveNav } from './ui/nav';

/**
 * Orden de carga (punto 14):
 *   1. El HTML ya trae todo el contenido → visible y usable desde el primer paint.
 *   2. Comportamiento mínimo de UI (navegación activa).
 *   3. Cuando el navegador está libre: detectar capacidades.
 *   4. Solo si corresponde: descargar la capa gráfica (chunk aparte).
 */

const BACKEND_LABEL: Record<GpuBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', none: 'sin GPU' };
let currentBackend: GpuBackend = 'none';
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

function setGfxState(level: QualityLevel, backend: GpuBackend = currentBackend): void {
  currentBackend = backend;
  const root = document.documentElement;
  root.dataset.gfx = level;
  root.dataset.backend = backend;
  const label = document.querySelector<HTMLElement>('[data-gfx-label]');
  if (label) label.textContent = `Gráficos: ${BACKEND_LABEL[backend]}, ${LEVEL_LABEL[level]}.`;
}

async function bootEnhancements(): Promise<void> {
  const caps = await detectCapabilities();
  const override = readOverride();
  const level = initialQuality(caps, override);
  setGfxState(level, caps.backend);

  const stage = document.getElementById('stage');
  if (level === 'static' || !stage) return;

  const { bootGraphics } = await import('./graphics');
  await bootGraphics({
    stage,
    caps,
    level,
    fixed: override !== null,
    debug: new URLSearchParams(location.search).has('debug'),
    onLevel: (next) => setGfxState(next),
    // El backend real puede diferir del detectado si WebGPU falló y se cayó a WebGL2.
    onBackend: (name) => setGfxState(document.documentElement.dataset.gfx as QualityLevel, name === 'WebGPU' ? 'webgpu' : 'webgl2'),
  });
}

function main(): void {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
  initActiveNav();
  initCards();

  whenIdle(() => {
    bootEnhancements().catch((error: unknown) => {
      // Si la capa gráfica falla, el sitio sigue completo en modo estático.
      setGfxState('static');
      if (import.meta.env.DEV) console.warn('[gfx] fallback a estático:', error);
    });
  });
}

main();
