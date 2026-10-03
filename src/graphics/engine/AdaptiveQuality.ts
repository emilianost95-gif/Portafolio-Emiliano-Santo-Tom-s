import type { QualityLevel } from '../../core/quality';

/**
 * Ajuste de calidad por medición real.
 *
 * Por qué no medir "FPS": el loop de requestAnimationFrame está atado a la
 * frecuencia del monitor, así que un equipo sobrado y uno justo marcan los dos
 * 16,7 ms en una pantalla de 60 Hz. Lo que sí distingue es si se PIERDEN
 * frames: un delta bastante mayor al intervalo de refresco = frame perdido.
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

const MAX_REFRESH_MS = 34;

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

    // Intervalo de refresco estimado = el delta más corto visto, acotado entre
    // 4 ms (250 Hz) y 34 ms (30 Hz, p. ej. iOS en modo ahorro de batería).
    // Sin el techo, un equipo que nunca baja de 200 ms "parecería" un monitor de
    // 5 Hz sin frames perdidos, y la calidad SUBIRÍA. Lo encontró un test.
    this.refreshMs = Math.min(this.refreshMs, MAX_REFRESH_MS, Math.max(4, deltaMs));
    if (this.samples.length === 0) this.windowStart = now;
    this.samples.push(deltaMs);
    const full = this.samples.length >= this.windowSize;
    const timedOut = now - this.windowStart >= this.windowMs && this.samples.length >= 8;
    if (!full && !timedOut) return;

    const threshold = this.refreshMs * 1.5;
    const dropped = this.samples.filter((d) => d > threshold).length / this.samples.length;
    this.samples.length = 0;

    const idx = this.opts.levels.indexOf(this.level);
    const maxIdx = this.opts.levels.indexOf(this.opts.max);

    if (dropped > 0.25) {
      this.locked = true;
      // Desde el nivel más bajo con GPU, solo se pasa a estático si es grave.
      const isLowest = idx <= 1;
      if (!isLowest || dropped > 0.5) this.set(this.opts.levels[idx - 1]);
    } else if (dropped < 0.03 && !this.locked && now - this.startedAt < this.probeMs && idx < maxIdx) {
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
