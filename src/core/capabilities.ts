/**
 * Detección de capacidades del dispositivo.
 *
 * Regla: no se asume nada. WebGPU puede existir en `navigator` y aun así no
 * entregar adaptador (drivers en lista negra, Linux sin flag, etc.), así que
 * se pide el adaptador de verdad. Todo esto corre DESPUÉS de mostrar el
 * contenido, nunca bloquea el primer render.
 */

export type GpuBackend = 'webgpu' | 'webgl2' | 'none';

export interface Capabilities {
  readonly backend: GpuBackend;
  /**
   * La "GPU" es en realidad un rasterizador por CPU (SwiftShader, llvmpipe,
   * Microsoft Basic Render Driver). Chrome lo usa cuando la GPU real está en
   * lista negra o el driver falla. Cada frame bloquea el hilo principal
   * (~200 ms medidos en pruebas): para el visitante es mejor el modo estático.
   */
  readonly softwareRenderer: boolean;
  readonly reducedMotion: boolean;
  readonly coarsePointer: boolean;
  readonly saveData: boolean;
  /** GB aproximados (solo Chromium lo expone). `null` = desconocido. */
  readonly deviceMemory: number | null;
  readonly cores: number | null;
}

interface AdapterInfoLike {
  vendor?: string;
  architecture?: string;
  description?: string;
  isFallbackAdapter?: boolean;
}

interface NavigatorExtras {
  gpu?: { requestAdapter(): Promise<{ info?: AdapterInfoLike; isFallbackAdapter?: boolean } | null> };
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i;

export function isSoftwareRendererName(name: string): boolean {
  return SOFTWARE_RENDERER.test(name);
}

interface BackendResult {
  readonly backend: GpuBackend;
  readonly software: boolean;
}

async function detectBackend(): Promise<BackendResult> {
  const nav = navigator as Navigator & NavigatorExtras;
  // Testing (punto 16): ?backend=webgl2 simula un navegador sin WebGPU, ?backend=none uno sin GPU.
  const forced = new URLSearchParams(location.search).get('backend');
  if (forced === 'none') return { backend: 'none', software: false };

  if (nav.gpu && forced !== 'webgl2') {
    try {
      const adapter = await nav.gpu.requestAdapter();
      if (adapter) {
        const info = adapter.info ?? {};
        const software =
          adapter.isFallbackAdapter === true ||
          info.isFallbackAdapter === true ||
          isSoftwareRendererName(`${info.vendor ?? ''} ${info.architecture ?? ''} ${info.description ?? ''}`);
        return { backend: 'webgpu', software };
      }
    } catch {
      /* sin adaptador: probamos WebGL2 */
    }
  }

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

export async function detectCapabilities(): Promise<Capabilities> {
  const nav = navigator as Navigator & NavigatorExtras;
  const { backend, software } = await detectBackend();
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
