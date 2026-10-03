/**
 * Mapeo puro: posición de scroll → posición en el "track" de secciones.
 *
 * Cada sección tiene un ancla (el scroll en el que su borde superior llega
 * arriba). El track vale exactamente `i` en el ancla de la sección i, e
 * interpola linealmente entre anclas: 1,5 = mitad de camino entre la 1 y la 2.
 *
 * Es una función pura de `y`: subir o bajar da siempre el mismo resultado.
 * Por eso todo lo que dependa del track es reversible por construcción.
 */
export function scrollToTrack(y: number, anchors: readonly number[]): number {
  const n = anchors.length;
  if (n === 0) return 0;
  const first = anchors[0] ?? 0;
  if (n === 1 || y <= first) return 0;
  const last = anchors[n - 1] ?? first;
  if (y >= last) return n - 1;
  // Búsqueda lineal: son 5 secciones; una binaria no aporta nada acá.
  for (let i = 0; i < n - 1; i++) {
    const a = anchors[i] ?? 0;
    const b = anchors[i + 1] ?? a;
    if (y < b) return b > a ? i + (y - a) / (b - a) : i;
  }
  return n - 1;
}

/**
 * Igual que scrollToTrack, pero cada formación se queda armada durante su sección y la
 * transición a la siguiente ocurre solo en el último tramo: como máximo `windowPx` píxeles
 * (y nunca más del 40 % de la sección).
 *
 * Se mide en píxeles y no en porcentaje porque las secciones tienen alturas muy distintas:
 * con el carrusel de proyectos (~3500 px), un 40 % hacía que la cercha se convirtiera en
 * código mientras todavía se estaban mirando las tarjetas.
 *
 * Pura, continua y monótona: reversible igual que scrollToTrack.
 */
export function scrollToHeldTrack(y: number, anchors: readonly number[], windowPx: number): number {
  const n = anchors.length;
  if (n < 2) return 0;
  const first = anchors[0] ?? 0;
  const last = anchors[n - 1] ?? first;
  if (y <= first) return 0;
  if (y >= last) return n - 1;
  for (let i = 0; i < n - 1; i++) {
    const a = anchors[i] ?? 0;
    const b = anchors[i + 1] ?? a;
    if (y < b) {
      const w = Math.min(windowPx, (b - a) * 0.4);
      if (w <= 0) return i;
      return i + Math.min(1, Math.max(0, (y - (b - w)) / w));
    }
  }
  return n - 1;
}
