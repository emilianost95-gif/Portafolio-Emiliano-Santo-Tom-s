import type { Capabilities } from './capabilities';

/**
 * Niveles de calidad gráfica.
 *
 * Decisión: 3 niveles + 'static', no 4. Cada nivel tiene que cambiar algo
 * medible; un cuarto nivel se agrega solo si una escena real lo justifica.
 *
 * El nivel inicial es CONSERVADOR a propósito: se parte bajo y la Fase 1
 * sube de nivel midiendo frame time real. Subir es invisible para el usuario;
 * bajar en medio del scroll se nota (y feo).
 */
export type QualityLevel = 'static' | 'low' | 'medium' | 'high';

export interface QualityProfile {
  readonly level: QualityLevel;
  /** Tope de devicePixelRatio para el canvas. */
  readonly maxPixelRatio: number;
  readonly particleCount: number;
  readonly postProcessing: boolean;
  /** Escala del render target respecto al canvas (1 = resolución completa). */
  readonly renderScale: number;
}

export const QUALITY_PROFILES: Readonly<Record<QualityLevel, QualityProfile>> = {
  static: { level: 'static', maxPixelRatio: 0, particleCount: 0, postProcessing: false, renderScale: 0 },
  low: { level: 'low', maxPixelRatio: 1, particleCount: 2_000, postProcessing: false, renderScale: 0.75 },
  medium: { level: 'medium', maxPixelRatio: 1.5, particleCount: 8_000, postProcessing: true, renderScale: 1 },
  high: { level: 'high', maxPixelRatio: 2, particleCount: 25_000, postProcessing: true, renderScale: 1 },
};

const LEVELS: readonly QualityLevel[] = ['static', 'low', 'medium', 'high'];

function isLevel(value: string | null): value is QualityLevel {
  return value !== null && (LEVELS as readonly string[]).includes(value);
}

/**
 * Override manual para testing: `?gfx=static|low|medium|high`.
 * Permite recorrer la matriz de pruebas del punto 16 sin cambiar de hardware.
 */
export function readOverride(search: string = location.search): QualityLevel | null {
  const value = new URLSearchParams(search).get('gfx');
  return isLevel(value) ? value : null;
}

export function initialQuality(caps: Capabilities, override: QualityLevel | null): QualityLevel {
  if (override) return override;
  if (caps.backend === 'none' || caps.saveData) return 'static';
  const lowEnd = caps.coarsePointer || (caps.deviceMemory !== null && caps.deviceMemory <= 4);
  if (caps.reducedMotion || lowEnd) return 'low';
  return 'medium'; // 'high' solo se alcanza midiendo (Fase 1).
}
