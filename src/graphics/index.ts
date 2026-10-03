import type { Capabilities } from '../core/capabilities';
import type { QualityLevel } from '../core/quality';
import { AdaptiveQuality } from './engine/AdaptiveQuality';
import { Engine } from './engine/Engine';
import { ParticleFieldScene } from './scenes/particle-field/ParticleFieldScene';

/**
 * Punto de entrada de la capa gráfica. Se carga con `import()` dinámico desde
 * main.ts: si el dispositivo queda en 'static', nada de esto (ni Three.js)
 * se descarga.
 *
 * Cadena de fallback EN TIEMPO DE EJECUCIÓN (no solo en la detección):
 *   WebGPU falla al iniciar o al dibujar → se reinicia con WebGL2
 *   WebGL2 falla                          → estático
 * La detección inicial puede decir "hay WebGPU" y aun así la versión del
 * navegador no soportar algo que usa Three.js. Eso pasó en las pruebas.
 */
export interface BootOptions {
  readonly stage: HTMLElement;
  readonly caps: Capabilities;
  readonly level: Exclude<QualityLevel, 'static'>;
  /** true si el nivel vino forzado por ?gfx= → no se ajusta solo. */
  readonly fixed: boolean;
  readonly debug: boolean;
  readonly onLevel: (level: QualityLevel) => void;
  readonly onBackend: (backend: 'WebGPU' | 'WebGL2') => void;
}

const LEVELS: readonly QualityLevel[] = ['static', 'low', 'medium', 'high'];

export async function bootGraphics(opts: BootOptions): Promise<void> {
  let level: QualityLevel = opts.level;
  let engine: Engine | null = null;
  let overlay: { dispose(): void } | null = null;

  const teardown = (): void => {
    overlay?.dispose();
    overlay = null;
    engine?.dispose();
    engine = null;
  };

  const goStatic = (reason?: unknown): void => {
    teardown();
    level = 'static';
    opts.onLevel('static');
    if (import.meta.env.DEV && reason) console.warn('[gfx] modo estático:', reason);
  };

  const start = async (caps: Capabilities): Promise<void> => {
    let failed = false;
    const onFatal = (reason: unknown): void => {
      if (failed) return;
      failed = true;
      if (caps.backend === 'webgpu') {
        if (import.meta.env.DEV) console.warn('[gfx] WebGPU falló, reintentando con WebGL2:', reason);
        teardown();
        start({ ...caps, backend: 'webgl2' }).catch(goStatic);
      } else {
        goStatic(reason);
      }
    };

    const adaptive =
      opts.fixed || caps.reducedMotion
        ? null
        : new AdaptiveQuality({
            levels: LEVELS,
            initial: level,
            // En táctiles el techo es 'medium': batería y temperatura también cuentan.
            max: caps.coarsePointer ? 'medium' : 'high',
            onChange: (next) => {
              if (next === 'static') return goStatic();
              level = next;
              engine?.setQuality(next);
              opts.onLevel(next);
            },
          });

    try {
      engine = await Engine.create({
        host: opts.stage,
        caps,
        level: level === 'static' ? 'low' : level,
        onFrame: (deltaMs, now) => adaptive?.sample(deltaMs, now),
        onFatal,
      });
    } catch (error) {
      onFatal(error); // init() puede fallar: mismo camino que un fallo al dibujar.
      return;
    }

    engine.mount(new ParticleFieldScene());
    if (failed) return; // pudo fallar ya en el primer render (reduced motion)
    opts.onBackend(engine.backendName);

    if (opts.debug) {
      // Solo en ?debug: acceso al motor desde la consola para pruebas manuales/automatizadas.
      (window as Window & { __engine?: Engine }).__engine = engine;
      const { StatsOverlay } = await import('./debug/StatsOverlay');
      const current = engine;
      if (current && !failed) overlay = new StatsOverlay(() => current.stats());
    }
  };

  await start(opts.caps);
}
