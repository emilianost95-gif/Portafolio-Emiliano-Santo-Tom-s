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
  readonly reducedMotion: boolean;
  readonly coarsePointer: boolean;
  readonly saveData: boolean;
  /** GB aproximados (solo Chromium lo expone). `null` = desconocido. */
  readonly deviceMemory: number | null;
  readonly cores: number | null;
}

interface NavigatorExtras {
  gpu?: { requestAdapter(): Promise<unknown | null> };
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

async function detectBackend(): Promise<GpuBackend> {
  const nav = navigator as Navigator & NavigatorExtras;
  if (nav.gpu) {
    try {
      if (await nav.gpu.requestAdapter()) return 'webgpu';
    } catch {
      /* sin adaptador: probamos WebGL2 */
    }
  }
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      // Liberamos el contexto de prueba: los navegadores limitan cuántos hay vivos.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return 'webgl2';
    }
  } catch {
    /* sin WebGL2 */
  }
  return 'none';
}

export async function detectCapabilities(): Promise<Capabilities> {
  const nav = navigator as Navigator & NavigatorExtras;
  return {
    backend: await detectBackend(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: matchMedia('(pointer: coarse)').matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
  };
}
