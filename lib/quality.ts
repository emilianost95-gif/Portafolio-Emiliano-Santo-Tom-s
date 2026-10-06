import type { Capabilities } from './capabilities';

/**
 * Niveles de calidad gráfica: 3 niveles + 'static' (sin canvas).
 *
 * El nivel inicial es CONSERVADOR a propósito: se parte bajo y la calidad
 * adaptativa sube midiendo frames reales. Subir es invisible para el usuario;
 * bajar en medio del scroll se nota.
 */
export type QualityLevel = 'static' | 'low' | 'medium' | 'high';

export interface QualityProfile {
  readonly level: QualityLevel;
  /** Tope de devicePixelRatio para el canvas. */
  readonly maxPixelRatio: number;
  readonly particleCount: number;
  readonly postProcessing: boolean;
}

export const QUALITY_PROFILES: Readonly<Record<QualityLevel, QualityProfile>> = {
  static: { level: 'static', maxPixelRatio: 0, particleCount: 0, postProcessing: false },
  low: { level: 'low', maxPixelRatio: 1, particleCount: 6_000, postProcessing: false },
  medium: { level: 'medium', maxPixelRatio: 1.5, particleCount: 14_000, postProcessing: true },
  high: { level: 'high', maxPixelRatio: 2, particleCount: 28_000, postProcessing: true },
};

export const QUALITY_LEVELS: readonly QualityLevel[] = ['static', 'low', 'medium', 'high'];

function isLevel(value: string | null): value is QualityLevel {
  return value !== null && (QUALITY_LEVELS as readonly string[]).includes(value);
}

/** Override manual para testing: `?gfx=static|low|medium|high`. */
export function readOverride(search: string): QualityLevel | null {
  const value = new URLSearchParams(search).get('gfx');
  return isLevel(value) ? value : null;
}

export function initialQuality(caps: Capabilities, override: QualityLevel | null): QualityLevel {
  if (override) return override;
  if (caps.backend === 'none' || caps.softwareRenderer || caps.saveData) return 'static';
  const lowEnd = caps.coarsePointer || (caps.deviceMemory !== null && caps.deviceMemory <= 4);
  if (caps.reducedMotion || lowEnd) return 'low';
  return 'medium'; // 'high' solo se alcanza midiendo.
}

/** Techo de calidad: en táctil o con poco movimiento no se sube de 'medium'/'low'. */
export function maxQuality(caps: Capabilities): QualityLevel {
  if (caps.reducedMotion) return 'low';
  return caps.coarsePointer ? 'medium' : 'high';
}
