import type { QualityLevel } from '../../core/quality';

/**
 * Ajuste de calidad por medición real.
 *
 * Por qué no medir "FPS": el loop de requestAnimationFrame está atado a la
 * frecuencia del monitor, así que un equipo sobrado y uno justo marcan los dos
 * 16,7 ms en una pantalla de 60 Hz. Lo que sí distingue es si se PIERDEN
 * frames: un delta bastante mayor al presupuesto = frame perdido.
 *
 * Dos umbrales distintos (histéresis: subir exige más que mantenerse):
 *  - BAJAR: frames por debajo del mínimo del proyecto, 60 FPS
 *    (umbral = máx(1,5 × refresco, 16,7 ms) → 25 ms a 60 Hz, 16,7 ms en pantallas rápidas).
 *  - SUBIR: casi ningún frame por debajo de ~80 FPS en pantallas rápidas
 *    (umbral = 1,5 × máx(refresco, 8,33 ms) → 25 ms a 60 Hz, 12,5 ms a 120 Hz o más).
 * Nunca se exige la frecuencia del monitor: a 180 Hz no se piden 5,6 ms por frame.
 *
 * Política:
 *  - Fase de sondeo (primeros segundos): si casi no se pierden frames, sube un nivel.
 *  - En cualquier momento: si se pierden muchos, baja un nivel y no vuelve a subir
 *    (histéresis: evita oscilar entre niveles en pleno scroll).
 *  - Si en el nivel más bajo sigue sin dar abasto, pasa a 'static'.
 */
export interface AdaptiveOptions {
  /** Niveles ordenados de menor a mayor, empezando por 'static'. */
  readonly levels: readonly QualityLevel[];
  readonly initial: QualityLevel;
  /** Techo permitido (p. ej. 'medium' en dispositivos táctiles). */
  readonly max: QualityLevel;
  readonly onChange: (level: QualityLevel) => void;
  /** La ventana se evalúa al juntar `windowSize` frames o al pasar `windowMs`, lo que ocurra primero. */
  readonly windowSize?: number;
  readonly windowMs?: number;
  readonly warmupMs?: number;
  readonly probeMs?: number;
}

const MAX_REFRESH_MS = 34; // 30 Hz: iOS en ahorro de batería limita rAF a esto
const MIN_REFRESH_MS = 4; // 250 Hz
const MIN_BUDGET_MS = 1000 / 120; // para subir: no exigir más de 120 FPS
const FLOOR_FPS_MS = 1000 / 60; // para bajar: el mínimo del proyecto

export class AdaptiveQuality {
  private level: QualityLevel;
  private locked = false;
  private readonly samples: number[] = [];
  private refreshMs = Infinity;
  private startedAt = -1;
  private ignoreUntil = 0;
  private lastNow = 0;
  private readonly windowSize: number;
  private readonly windowMs: number;
  private windowStart = -1;
  private readonly warmupMs: number;
  private readonly probeMs: number;
  private readonly opts: AdaptiveOptions;

  // Sin "parameter properties": este archivo lo corren los tests directo en Node (type stripping).
  constructor(opts: AdaptiveOptions) {
    this.opts = opts;
    this.level = opts.initial;
    this.windowSize = opts.windowSize ?? 90;
    // Sin tope de tiempo, a 5 FPS juntar 90 frames tardaría 18 s: justo el equipo
    // que más necesita bajar de calidad sería el que más espera.
    this.windowMs = opts.windowMs ?? 1500;
    this.warmupMs = opts.warmupMs ?? 1000;
    this.probeMs = opts.probeMs ?? 10_000;
  }

  get current(): QualityLevel {
    return this.level;
  }

  /** Registrar un frame. `now` y `deltaMs` en milisegundos. */
  sample(deltaMs: number, now: number): void {
    if (this.level === 'static') return;
    this.lastNow = now;
    if (this.startedAt < 0) {
      this.startedAt = now;
      this.ignoreUntil = now + this.warmupMs;
    }
    // Warm-up (compilación de shaders) y deltas absurdos (pestaña oculta, breakpoint) no cuentan.
    if (now < this.ignoreUntil || deltaMs <= 0 || deltaMs > 1000) return;

    if (this.samples.length === 0) this.windowStart = now;
    this.samples.push(deltaMs);
    const full = this.samples.length >= this.windowSize;
    const timedOut = now - this.windowStart >= this.windowMs && this.samples.length >= 8;
    if (!full && !timedOut) return;

    // Intervalo de refresco = percentil 10 de la ventana (el más bajo visto), acotado a 4–34 ms.
    //  - Percentil 10 y no mínimo: después de un tirón el navegador entrega frames
    //    "amontonados" con deltas de 2–3 ms. Con el mínimo, una pantalla de 60 Hz
    //    pasaba a parecer de 250 Hz y todos sus frames normales contaban como perdidos.
    //  - Ni mediana: si la mitad de los frames son lentos, la mediana es el valor
    //    lento y las caídas se vuelven invisibles (lo encontraron los tests).
    //  - Techo de 34 ms: sin él, un equipo que nunca baja de 200 ms "parecería" un
    //    monitor de 5 Hz sin frames perdidos, y la calidad SUBIRÍA.
    // El error medido en hardware real (bajaba a 'low' a 177 FPS en 180 Hz) lo
    // resuelve sobre todo el piso de presupuesto MIN_BUDGET_MS de abajo.
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? MAX_REFRESH_MS;
    this.refreshMs = Math.min(this.refreshMs, Math.min(MAX_REFRESH_MS, Math.max(MIN_REFRESH_MS, p10)));

    const ratioOver = (limit: number): number => this.samples.filter((d) => d > limit).length / this.samples.length;
    const dropped = ratioOver(Math.max(this.refreshMs * 1.5, FLOOR_FPS_MS));
    const slowForUpgrade = ratioOver(Math.max(this.refreshMs, MIN_BUDGET_MS) * 1.5);
    this.samples.length = 0;

    const idx = this.opts.levels.indexOf(this.level);
    const maxIdx = this.opts.levels.indexOf(this.opts.max);

    if (dropped > 0.25) {
      this.locked = true;
      // Desde el nivel más bajo con GPU, solo se pasa a estático si es grave.
      const isLowest = idx <= 1;
      if (!isLowest || dropped > 0.5) this.set(this.opts.levels[idx - 1]);
    } else if (slowForUpgrade < 0.03 && !this.locked && now - this.startedAt < this.probeMs && idx < maxIdx) {
      this.set(this.opts.levels[idx + 1]);
    }
  }

  private set(level: QualityLevel | undefined): void {
    if (!level || level === this.level) return;
    this.level = level;
    // Tras un cambio, los primeros frames recompilan shaders: no cuentan.
    this.ignoreUntil = this.lastNow + this.warmupMs;
    this.opts.onChange(level);
  }
}
