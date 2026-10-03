import type { Capabilities } from '../core/capabilities';
import type { QualityProfile } from '../core/quality';

/**
 * Punto de entrada de la capa gráfica.
 *
 * Este módulo se carga con `import()` dinámico desde main.ts, así Vite lo
 * separa en su propio chunk: si el dispositivo queda en 'static', el código
 * 3D (y Three.js, desde la Fase 1) nunca se descarga.
 *
 * Fase 0: no monta nada. El contrato ya queda fijo para la Fase 1.
 */
export interface GraphicsHandle {
  dispose(): void;
}

export async function bootGraphics(
  _stage: HTMLElement,
  _caps: Capabilities,
  _profile: QualityProfile,
): Promise<GraphicsHandle> {
  return { dispose: () => undefined };
}
