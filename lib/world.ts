/**
 * Estado por frame, mutable y fuera de React: lo escriben el scroll y el puntero,
 * lo lee el loop de render. Pasarlo por estado de React re-renderizaría la
 * interfaz 60+ veces por segundo sin necesidad.
 */
export const world = {
  /** Posición en el recorrido (ver lib/track.ts). */
  p: 0.5,
  /** Puntero en coordenadas normalizadas (-1..1, y hacia arriba) y su velocidad. */
  /** `seen` = el puntero se movió al menos una vez (antes de eso no hay hover). */
  pointer: { x: 0, y: 0, speed: 0, seen: false },
  /** Instante (performance.now) del último pulso: click o tecla. */
  pulseAt: -1e9,
  stats: { fps: 0, calls: 0, points: 0, dpr: 1 },
};

export function pulse(): void {
  world.pulseAt = performance.now();
}

/** Scroll programático. Lo registra SmoothScroll; sin él, cae al scroll nativo. */
export const scroller: { to: (target: HTMLElement) => void; stop: () => void; start: () => void } = {
  to: (target) => target.scrollIntoView(),
  stop: () => undefined,
  start: () => undefined,
};
