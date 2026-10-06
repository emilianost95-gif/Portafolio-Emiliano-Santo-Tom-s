/**
 * Detección de capacidades del dispositivo.
 *
 * Regla: no se asume nada. Se pide un contexto WebGL2 real y se mira qué lo
 * dibuja. Todo corre DESPUÉS de mostrar el contenido: nunca bloquea el primer render.
 */

export type GpuBackend = 'webgl2' | 'none';

export interface Capabilities {
  readonly backend: GpuBackend;
  /**
   * La "GPU" es en realidad un rasterizador por CPU (SwiftShader, llvmpipe,
   * Microsoft Basic Render Driver). Cada frame bloquea el hilo principal:
   * para el visitante es mejor el modo estático.
   */
  readonly softwareRenderer: boolean;
  readonly reducedMotion: boolean;
  readonly coarsePointer: boolean;
  readonly saveData: boolean;
  /** GB aproximados (solo Chromium lo expone). `null` = desconocido. */
  readonly deviceMemory: number | null;
  readonly cores: number | null;
}

interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i;

export function isSoftwareRendererName(name: string): boolean {
  return SOFTWARE_RENDERER.test(name);
}

function detectBackend(): { backend: GpuBackend; software: boolean } {
  // Testing: ?backend=none simula un dispositivo sin GPU.
  if (new URLSearchParams(location.search).get('backend') === 'none') return { backend: 'none', software: false };
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
      // Liberamos el contexto de prueba: los navegadores limitan cuántos hay vivos.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return { backend: 'webgl2', software: isSoftwareRendererName(renderer) };
    }
  } catch {
    /* sin WebGL2 */
  }
  return { backend: 'none', software: false };
}

export function detectCapabilities(): Capabilities {
  const nav = navigator as Navigator & NavigatorExtras;
  const { backend, software } = detectBackend();
  return {
    backend,
    softwareRenderer: software,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: matchMedia('(pointer: coarse)').matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
  };
}
