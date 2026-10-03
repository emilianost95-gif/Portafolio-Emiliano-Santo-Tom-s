/**
 * Recorrido de cámara definido por keyframes, uno por sección.
 *
 * - `sample(track)` es PURO: misma posición de scroll → misma cámara.
 * - La suavidad no viene de interpolar en el tiempo el scroll, sino de que la
 *   cámara SIGA al objetivo con amortiguación exponencial (independiente de los FPS).
 *   Así el scroll sigue siendo nativo e instantáneo y la cámara nunca salta.
 */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface CameraKey {
  readonly position: Readonly<Vec3Like>;
  readonly target: Readonly<Vec3Like>;
}

export interface CameraPose {
  readonly position: Vec3Like;
  readonly target: Vec3Like;
}

/** Easing simétrico: arranca y termina cada tramo sin velocidad brusca. */
export function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function sampleKeys(keys: readonly CameraKey[], track: number, out: CameraPose): CameraPose {
  const last = keys.length - 1;
  if (last < 0) return out;
  const clamped = Math.min(last, Math.max(0, track));
  const i = Math.min(last - 1, Math.floor(clamped));
  const a = keys[Math.max(0, i)];
  const b = keys[Math.max(0, i + 1)] ?? a;
  if (!a || !b) return out;
  const t = last === 0 ? 0 : smoothstep01(clamped - i);
  out.position.x = mix(a.position.x, b.position.x, t);
  out.position.y = mix(a.position.y, b.position.y, t);
  out.position.z = mix(a.position.z, b.position.z, t);
  out.target.x = mix(a.target.x, b.target.x, t);
  out.target.y = mix(a.target.y, b.target.y, t);
  out.target.z = mix(a.target.z, b.target.z, t);
  return out;
}

/** Factor de amortiguación para `lambda` (1/s) y `dt` (s): 1 - e^(-λ·dt). */
export function damp(lambda: number, dt: number): number {
  return 1 - Math.exp(-lambda * dt);
}
