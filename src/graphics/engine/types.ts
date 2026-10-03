import type { Camera, Scene } from 'three/webgpu';
import type { QualityProfile } from '../../core/quality';

/** Estado que el motor entrega a la escena en cada frame. */
export interface FrameState {
  /** Segundos desde el arranque, ya escalados (0 de avance con reduced motion). */
  readonly time: number;
  /** Segundos desde el frame anterior, con tope para no saltar al volver de otra pestaña. */
  readonly delta: number;
  /** Puntero en coordenadas normalizadas (-1..1). `active` = hubo movimiento reciente. */
  readonly pointer: { readonly x: number; readonly y: number; readonly active: boolean };
  /** Scroll nativo: `track` = posición entre secciones (0..n-1), `progress` = 0..1 de la página. */
  readonly scroll: { readonly track: number; readonly progress: number };
}

/**
 * Contrato de una escena. El motor no sabe qué hay adentro: solo llama a estos
 * métodos. Así se puede reemplazar una escena sin tocar las demás (punto 12).
 */
export interface SceneModule {
  readonly scene: Scene;
  readonly camera: Camera;
  /** Se llama al montar y cada vez que cambia el nivel de calidad. */
  applyQuality(profile: QualityProfile): void;
  resize(width: number, height: number): void;
  update(frame: FrameState): void;
  /** Libera geometrías, materiales y texturas. Obligatorio: es donde nacen los memory leaks. */
  dispose(): void;
  /** Cantidad de partículas/instancias vivas, para el monitor. */
  readonly instanceCount: number;
}
