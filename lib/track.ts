import type { FormationId } from './formations.ts';

/**
 * Recorrido del mundo: una lista de paradas sobre la posición de scroll `p`.
 *
 * `p` = índice de la sección que contiene el centro del viewport + la fracción
 * recorrida de esa sección. Función pura de `p`: el scroll es reversible por
 * construcción (misma posición, mismo mundo), sin estado acumulado.
 */

export const SECTION_IDS = ['core', 'origin', 'systems', 'stack', 'playground', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface Stop {
  readonly p: number;
  readonly formation: FormationId;
  /** Desplazamiento horizontal del núcleo, en fracción del ancho visible (-0.5..0.5). */
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** Distancia de la cámara. */
  readonly distance: number;
  /** Brillo 0..1: el núcleo se apaga cuando la interfaz necesita el protagonismo. */
  readonly light: number;
  /** Giro continuo (rad/s). Las formaciones planas no giran: se mecen. */
  readonly spin: number;
  readonly tilt: number;
}

export const ORIGIN_STEPS = 7;

const originStop = (step: number, formation: FormationId, spin: number, tilt: number): Stop => ({
  p: 1 + (step + 0.5) / ORIGIN_STEPS,
  formation,
  x: 0.2,
  y: 0,
  scale: 1,
  distance: 6.4,
  light: 1,
  spin,
  tilt,
});

export const TRACK: readonly Stop[] = [
  { p: 0.5, formation: 'core', x: 0.14, y: 0.06, scale: 1, distance: 6, light: 1, spin: 0.12, tilt: 0.25 },
  originStop(0, 'lattice', 0.1, 0.3),
  originStop(1, 'code', 0, 0.05),
  originStop(2, 'grid', 0, 0.1),
  originStop(3, 'graph', 0.14, 0.2),
  originStop(4, 'pcb', 0, 0.55),
  originStop(5, 'neural', 0.2, 0.2),
  originStop(6, 'field', 0, 0.3),
  { p: 2.5, formation: 'core', x: 0.24, y: 0, scale: 0.9, distance: 6.6, light: 0.7, spin: 0.1, tilt: 0.3 },
  { p: 3.5, formation: 'pcb', x: 0, y: 0, scale: 1.5, distance: 6.2, light: 0.07, spin: 0, tilt: 0.9 },
  { p: 4.5, formation: 'neural', x: 0, y: 0, scale: 1.7, distance: 7.5, light: 0.08, spin: 0.05, tilt: 0.2 },
  { p: 5.5, formation: 'field', x: 0, y: 0.2, scale: 1.25, distance: 5.6, light: 0.6, spin: 0, tilt: 0.35 },
];

export interface WorldSample {
  from: FormationId;
  to: FormationId;
  /** 0 = `from`, 1 = `to`. Con mesetas: cerca de cada parada la forma está quieta. */
  mix: number;
  x: number;
  y: number;
  scale: number;
  distance: number;
  light: number;
  spin: number;
  tilt: number;
}

const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function sampleTrack(p: number, track: readonly Stop[] = TRACK): WorldSample {
  const first = track[0];
  const last = track[track.length - 1];
  if (!first || !last) throw new Error('sampleTrack: recorrido vacío');
  let a = first;
  let b = first;
  if (p >= last.p) {
    a = last;
    b = last;
  } else if (p > first.p) {
    for (let i = 0; i < track.length - 1; i++) {
      const current = track[i];
      const next = track[i + 1];
      if (current && next && p >= current.p && p < next.p) {
        a = current;
        b = next;
        break;
      }
    }
  }
  const span = b.p - a.p;
  const t = span > 0 ? (p - a.p) / span : 0;
  const eased = smoothstep(0, 1, t);
  return {
    from: a.formation,
    to: b.formation,
    mix: smoothstep(0.22, 0.78, t),
    x: lerp(a.x, b.x, eased),
    y: lerp(a.y, b.y, eased),
    scale: lerp(a.scale, b.scale, eased),
    distance: lerp(a.distance, b.distance, eased),
    light: lerp(a.light, b.light, eased),
    spin: lerp(a.spin, b.spin, eased),
    tilt: lerp(a.tilt, b.tilt, eased),
  };
}

export interface SectionBox {
  readonly top: number;
  readonly height: number;
}

/** Posición `p` a partir del scroll: la sección bajo el centro del viewport + fracción recorrida. */
export function scrollToP(scrollY: number, viewport: number, sections: readonly SectionBox[]): number {
  if (sections.length === 0) return 0;
  const center = scrollY + viewport / 2;
  for (let i = sections.length - 1; i >= 0; i--) {
    const box = sections[i];
    if (box && center >= box.top) return i + Math.min(0.9999, (center - box.top) / Math.max(1, box.height));
  }
  return 0;
}

/** Paso activo de la sección ORIGIN (0..ORIGIN_STEPS-1) para una posición `p`. */
export function originStepAt(p: number): number {
  return Math.min(ORIGIN_STEPS - 1, Math.max(0, Math.floor((p - 1) * ORIGIN_STEPS)));
}
