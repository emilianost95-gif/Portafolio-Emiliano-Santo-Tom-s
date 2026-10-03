import * as THREE from 'three/webgpu';
import type { Capabilities } from '../../core/capabilities';
import { QUALITY_PROFILES, type QualityLevel, type QualityProfile } from '../../core/quality';
import { Pointer } from './Pointer';
import type { SceneModule } from './types';

export interface EngineStats {
  readonly backend: 'WebGPU' | 'WebGL2';
  readonly level: QualityLevel;
  readonly frameMs: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly geometries: number;
  readonly textures: number;
  readonly instances: number;
  readonly pixelRatio: number;
}

export interface EngineOptions {
  readonly host: HTMLElement;
  readonly caps: Capabilities;
  readonly level: QualityLevel;
  /** Llamado en cada frame con el delta en ms (lo usa la calidad adaptativa). */
  readonly onFrame?: (deltaMs: number, now: number) => void;
  /**
   * Fallo irrecuperable del backend: dispositivo perdido (driver reiniciado,
   * GPU sin memoria) o excepción al renderizar (API no soportada por esta
   * versión del navegador). Quien lo recibe decide el fallback.
   */
  readonly onFatal?: (reason: unknown) => void;
}

const MAX_DELTA_S = 0.1;

/**
 * Motor: dueño único del renderer, el canvas, el loop y el resize.
 * Las escenas no tocan nada de esto; solo implementan SceneModule.
 */
export class Engine {
  private readonly renderer: THREE.WebGPURenderer;
  private readonly pointer: Pointer | null;
  private active: SceneModule | null = null;
  private profile: QualityProfile;
  private readonly animate: boolean;
  private lastNow = -1;
  private elapsed = 0;
  private frameMs = 0;
  private resizeQueued = false;
  private frames = 0;
  private disposed = false;

  private constructor(
    private readonly opts: EngineOptions,
    renderer: THREE.WebGPURenderer,
  ) {
    this.renderer = renderer;
    this.profile = QUALITY_PROFILES[opts.level];
    // Reduced motion: se dibuja un cuadro fijo y no hay loop ni interacción.
    this.animate = !opts.caps.reducedMotion;
    this.pointer = this.animate ? new Pointer() : null;
  }

  static async create(opts: EngineOptions): Promise<Engine> {
    const renderer = new THREE.WebGPURenderer({
      // Si la detección dijo que no hay WebGPU, ni lo intentamos: directo a WebGL2.
      forceWebGL: opts.caps.backend !== 'webgpu',
      alpha: true, // fondo transparente: debajo sigue el fondo CSS (la capa estática)
      antialias: false, // partículas con borde suave en el shader: el MSAA no aporta y cuesta
      powerPreference: 'high-performance',
    });
    await renderer.init();
    renderer.setClearColor(0x000000, 0);
    // Salida lineal = sin pasada extra. Con salida sRGB, Three renderiza a un
    // framebuffer intermedio half-float y después hace una pasada a pantalla
    // completa solo para convertir el color (medido: +1 draw call, +1 triángulo
    // por frame). Las escenas definen sus colores ya en espacio de pantalla.
    // Cuando haya post-processing (Fase 3), esa pasada se hace igual y el
    // pipeline de post se encarga de la conversión.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.domElement.classList.add('stage__canvas');
    return new Engine(opts, renderer);
  }

  get backendName(): 'WebGPU' | 'WebGL2' {
    // `isWebGPUBackend` existe en el backend WebGPU; en el de WebGL es undefined.
    return (this.renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2';
  }

  mount(scene: SceneModule): void {
    this.active?.dispose();
    this.active = scene;
    scene.applyQuality(this.profile);

    const { host } = this.opts;
    host.appendChild(this.renderer.domElement);
    this.renderer.onDeviceLost = (info: unknown) => this.fail(info);
    addEventListener('resize', this.queueResize, { passive: true });
    this.resize();

    if (this.animate) {
      void this.renderer.setAnimationLoop(this.tick);
    } else {
      this.renderOnce();
    }
    // Aparece con fundido recién cuando ya hay un frame dibujado: sin parpadeo.
    requestAnimationFrame(() => host.classList.add('is-live'));
  }

  setQuality(level: QualityLevel): void {
    this.profile = QUALITY_PROFILES[level];
    this.active?.applyQuality(this.profile);
    this.resize();
    if (!this.animate) this.renderOnce();
  }

  stats(): EngineStats {
    const { render, memory } = this.renderer.info;
    return {
      backend: this.backendName,
      level: this.profile.level,
      frameMs: this.frameMs,
      drawCalls: render.drawCalls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
      instances: this.active?.instanceCount ?? 0,
      pixelRatio: this.renderer.getPixelRatio(),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    void this.renderer.setAnimationLoop(null);
    removeEventListener('resize', this.queueResize);
    this.pointer?.dispose();
    this.active?.dispose();
    this.active = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.opts.host.classList.remove('is-live');
  }

  private readonly tick = (): void => {
    const scene = this.active;
    if (!scene) return;
    const now = performance.now();
    const deltaMs = this.lastNow < 0 ? 16.7 : now - this.lastNow;
    this.lastNow = now;
    // Con tope: al volver de otra pestaña no se "teletransporta" la animación.
    const delta = Math.min(deltaMs / 1000, MAX_DELTA_S);
    this.elapsed += delta;
    // Media móvil exponencial: un número estable para el monitor.
    this.frameMs += (deltaMs - this.frameMs) * 0.1;

    const pointer = this.pointer;
    scene.update({
      time: this.elapsed,
      delta,
      pointer: pointer
        ? { x: pointer.x, y: pointer.y, active: pointer.isActive(now) }
        : { x: 0, y: 0, active: false },
    });
    if (!this.draw(scene)) return;
    // Chequeo de salud: hay fallos silenciosos (sin excepción) donde el backend
    // simplemente no dibuja. Si a los 30 frames hay instancias pero 0 draw calls,
    // se trata como fallo y se cae al siguiente backend.
    if (++this.frames === 30 && scene.instanceCount > 0 && this.renderer.info.render.drawCalls === 0) {
      this.fail(new Error('El backend no está dibujando (0 draw calls)'));
      return;
    }
    this.opts.onFrame?.(deltaMs, now);
  };

  /** Renderiza protegido: una excepción del backend no puede romper la página. */
  private draw(scene: SceneModule): boolean {
    try {
      this.renderer.render(scene.scene, scene.camera);
      return true;
    } catch (error) {
      this.fail(error);
      return false;
    }
  }

  private fail(reason: unknown): void {
    if (this.disposed) return;
    void this.renderer.setAnimationLoop(null);
    this.opts.onFatal?.(reason);
  }

  private renderOnce(): void {
    const scene = this.active;
    if (!scene) return;
    scene.update({ time: 0, delta: 0, pointer: { x: 0, y: 0, active: false } });
    this.draw(scene);
  }

  private readonly queueResize = (): void => {
    if (this.resizeQueued) return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      this.resize();
      if (!this.animate) this.renderOnce();
    });
  };

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.opts.host;
    if (w === 0 || h === 0) return;
    // Resolución efectiva = DPR del dispositivo, con tope por nivel, escalada por renderScale.
    const ratio = Math.min(devicePixelRatio, this.profile.maxPixelRatio) * this.profile.renderScale;
    this.renderer.setPixelRatio(Math.max(ratio, 0.5));
    this.renderer.setSize(w, h, false);
    this.active?.resize(w, h);
  }
}
