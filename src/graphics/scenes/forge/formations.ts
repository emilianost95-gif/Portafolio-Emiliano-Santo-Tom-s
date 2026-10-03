/**
 * Generadores de formaciones de la escena "Forja". Funciones puras: reciben un
 * generador aleatorio con semilla, así la misma partícula cae siempre en el
 * mismo lugar (al recargar o al cambiar de calidad) y se pueden testear en Node.
 *
 * Unidades: mundo 3D. La cámara mira al origen desde z≈10, con unos ±4,6 de
 * alto visible en z = 0. En 'wide' las formaciones se cargan a la derecha porque
 * el texto está a la izquierda; en 'narrow' (celular) van centradas y más atrás.
 */

export type Layout = 'wide' | 'narrow';

export type Rng = () => number;

/** Generador determinístico (mulberry32): rápido, sin dependencias, suficiente para posiciones. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V3 = readonly [number, number, number];
type Segment = readonly [V3, V3];

export interface FormationSet {
  readonly count: number;
  /** Semilla por partícula, 0..1: desfase de transición, tamaño, color. */
  readonly seeds: Float32Array;
  /** Velocidad inicial de cada chispa (la posición la calcula el shader con gravedad). */
  readonly sparkVelocity: Float32Array;
  readonly truss: Float32Array;
  readonly code: Float32Array;
  readonly merge: Float32Array;
  readonly field: Float32Array;
}

export interface LayoutParams {
  readonly sparkOrigin: V3;
  /**
   * Zona por la que se puede mover la torcha (min/max en X e Y del mundo).
   * Sin límite, llevar el puntero sobre el título lo tapaba de chispas (visto en hardware real).
   */
  readonly torchBox: { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number };
  readonly scaleX: number;
  readonly offsetX: number;
  readonly offsetZ: number;
}

export function layoutParams(layout: Layout): LayoutParams {
  return layout === 'wide'
    ? // Abajo a la derecha: la zona libre del hero (el título y el texto van arriba a la izquierda).
      { sparkOrigin: [5.2, -1.3, 0], torchBox: { minX: 3, maxX: 7.5, minY: -3.2, maxY: -0.6 }, scaleX: 1, offsetX: 0, offsetZ: 0 }
    : // Celular: el texto ocupa todo el ancho y la mitad de arriba; la torcha va abajo.
      { sparkOrigin: [0.8, -3, -1], torchBox: { minX: -1.5, maxX: 1.8, minY: -4, maxY: -2 }, scaleX: 0.42, offsetX: 0, offsetZ: -2 };
}

/** Segmentos de una cercha de sección cuadrada (4 cordones + montantes + diagonales). */
export function trussSegments(length: number, size: number, panel: number): Segment[] {
  const h = size / 2;
  const corners: readonly (readonly [number, number])[] = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  const segs: Segment[] = [];
  const panels = Math.max(1, Math.round(length / panel));
  const step = length / panels;
  const x0 = -length / 2;
  // Cordones longitudinales.
  for (const [y, z] of corners) segs.push([[x0, y, z], [x0 + length, y, z]]);
  for (let p = 0; p <= panels; p++) {
    const x = x0 + p * step;
    // Marco transversal (montantes) en cada nudo.
    for (let c = 0; c < 4; c++) {
      const [ya, za] = corners[c] ?? [0, 0];
      const [yb, zb] = corners[(c + 1) % 4] ?? [0, 0];
      segs.push([[x, ya, za], [x, yb, zb]]);
    }
    // Diagonales en las 4 caras, alternadas (tipo Warren).
    if (p < panels) {
      const flip = p % 2 === 0;
      for (let c = 0; c < 4; c++) {
        const [ya, za] = corners[c] ?? [0, 0];
        const [yb, zb] = corners[(c + 1) % 4] ?? [0, 0];
        segs.push(flip ? [[x, ya, za], [x + step, yb, zb]] : [[x, yb, zb], [x + step, ya, za]]);
      }
    }
  }
  return segs;
}

/** Reparte N puntos sobre segmentos, proporcional a su largo, con un leve espesor. */
function sampleSegments(segs: readonly Segment[], n: number, rng: Rng, thickness: number): Float32Array {
  const lengths = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  const total = lengths.reduce((s, l) => s + l, 0) || 1;
  const cumulative: number[] = [];
  let acc = 0;
  for (const l of lengths) cumulative.push((acc += l / total));
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = rng();
    let k = cumulative.findIndex((c) => r <= c);
    if (k < 0) k = segs.length - 1;
    const seg = segs[k];
    if (!seg) continue;
    const [a, b] = seg;
    const t = rng();
    out[i * 3] = a[0] + (b[0] - a[0]) * t + (rng() - 0.5) * thickness;
    out[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + (rng() - 0.5) * thickness;
    out[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (rng() - 0.5) * thickness;
  }
  return out;
}

/** Líneas de "código": filas con indentación y tokens de largo variable. */
export function codeSegments(rows: number, maxWidth: number, lineGap: number, rng: Rng): Segment[] {
  const segs: Segment[] = [];
  let indent = 0;
  for (let r = 0; r < rows; r++) {
    const y = ((rows - 1) / 2 - r) * lineGap;
    // La indentación sube y baja como en un bloque real; algunas filas quedan vacías.
    if (rng() < 0.12) continue;
    indent = Math.max(0, Math.min(4, indent + (rng() < 0.35 ? 1 : rng() < 0.5 ? -1 : 0)));
    let x = indent * 0.45;
    const lineWidth = maxWidth * (0.35 + rng() * 0.65);
    while (x < lineWidth) {
      const len = 0.25 + rng() * 1.1;
      segs.push([[x, y, 0], [Math.min(lineWidth, x + len), y, 0]]);
      x += len + 0.22;
    }
  }
  return segs;
}

function transform(points: Float32Array, rotY: number, rotZ: number, tx: number, ty: number, tz: number, p: LayoutParams): void {
  const cy = Math.cos(rotY);
  const sy = Math.sin(rotY);
  const cz = Math.cos(rotZ);
  const sz = Math.sin(rotZ);
  for (let i = 0; i < points.length; i += 3) {
    const x0 = points[i] ?? 0;
    const y0 = points[i + 1] ?? 0;
    const z0 = points[i + 2] ?? 0;
    // Rotación Z, luego Y.
    const x1 = x0 * cz - y0 * sz;
    const y1 = x0 * sz + y0 * cz;
    const x2 = x1 * cy + z0 * sy;
    const z2 = -x1 * sy + z0 * cy;
    points[i] = (x2 + tx) * p.scaleX + p.offsetX;
    points[i + 1] = y1 + ty;
    points[i + 2] = z2 + tz + p.offsetZ;
  }
}

function concatHalves(a: Float32Array, b: Float32Array, seeds: Float32Array): Float32Array {
  // Las partículas con semilla < 0,5 toman la mitad "metal"; el resto, la mitad "código".
  const out = new Float32Array(a.length);
  for (let i = 0; i < seeds.length; i++) {
    const src = (seeds[i] ?? 0) < 0.5 ? a : b;
    out[i * 3] = src[i * 3] ?? 0;
    out[i * 3 + 1] = src[i * 3 + 1] ?? 0;
    out[i * 3 + 2] = src[i * 3 + 2] ?? 0;
  }
  return out;
}

const TRUSS = { length: 18, size: 2, panel: 1.7 } as const;

/** Ubicación de la cercha de "Proyectos". Una sola fuente: la usan las partículas y los nudos. */
function placeTruss(points: Float32Array, p: LayoutParams): void {
  transform(points, -0.3, 0.1, 3, -0.6, -5, p); // corrida a la derecha: deja libre el título de la sección
}

export function buildFormations(count: number, layout: Layout, seed = 1): FormationSet {
  const rng = mulberry32(seed);
  const p = layoutParams(layout);

  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = rng();

  // Chispas: abanico hacia arriba y afuera; ~6 % son "escoria" lenta cerca del punto de soldadura
  // (con 15 % se amontonaban en el origen y el bloom lo convertía en una mancha blanca).
  const sparkVelocity = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const slag = rng() < 0.06;
    const speed = slag ? 0.2 + rng() * 0.6 : 1.8 + rng() * 3.7; // altura máx ≈ 1,6: no sube hasta el título
    const angle = (rng() - 0.5) * Math.PI * 1.1; // desde la vertical
    sparkVelocity[i * 3] = Math.sin(angle) * speed * p.scaleX;
    sparkVelocity[i * 3 + 1] = Math.cos(angle) * speed * 0.9;
    sparkVelocity[i * 3 + 2] = (rng() - 0.5) * speed * 0.5;
  }

  // Proyectos: cercha larga que cruza la escena en diagonal y en profundidad.
  // Sección de 2 m y paneles de 1,7: con menos que eso las diagonales no se distinguen a esta distancia.
  const truss = sampleSegments(trussSegments(TRUSS.length, TRUSS.size, TRUSS.panel), count, rng, 0.03);
  placeTruss(truss, p);

  // Stack: bloque de código levemente girado, a la derecha.
  const code = sampleSegments(codeSegments(16, 6.5, 0.42, rng), count, rng, 0.03);
  transform(code, -0.3, 0, 2.2, 0, -1.5, p);

  // Sobre mí: la sección tiene texto a todo el ancho; la única zona libre es la franja
  // de arriba a la derecha, junto al título. Ahí va: cercha (metal) abajo, código arriba.
  const mergeMetal = sampleSegments(trussSegments(6, 0.7, 0.8), count, rng, 0.03);
  transform(mergeMetal, -0.25, 0, 4.5, 1.5, -2.5, p);
  const mergeCode = sampleSegments(codeSegments(5, 5.5, 0.32, rng), count, rng, 0.025);
  transform(mergeCode, -0.25, 0, 1.6, 3, -2.5, p);
  const merge = concatHalves(mergeMetal, mergeCode, seeds);

  // Contacto: campo tranquilo que llena el cuadro.
  const field = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    field[i * 3] = ((rng() * 2 - 1) * 13) * p.scaleX + p.offsetX;
    field[i * 3 + 1] = (rng() * 2 - 1) * 8;
    field[i * 3 + 2] = -7 + rng() * 8 + p.offsetZ;
  }

  return { count, seeds, sparkVelocity, truss, code, merge, field };
}
