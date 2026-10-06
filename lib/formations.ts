/**
 * Formaciones del Digital Core: generadores puros y con semilla.
 *
 * Cada formación devuelve `count` puntos (xyz) muestreados de forma independiente
 * sobre una figura. Como cada punto es una muestra al azar, cualquier prefijo del
 * arreglo sigue dibujando la figura completa: bajar la calidad es solo dibujar
 * menos puntos (setDrawRange), sin regenerar nada.
 */

export const FORMATION_IDS = [
  'core',
  'lattice',
  'code',
  'grid',
  'graph',
  'pcb',
  'neural',
  'field',
  'signal',
  'rings',
] as const;

export type FormationId = (typeof FORMATION_IDS)[number];

type Rng = () => number;
type Vec3 = readonly [number, number, number];
type Segment = readonly [Vec3, Vec3];
type Sampler = (rng: Rng) => Vec3;

const TAU = Math.PI * 2;

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

function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick: lista vacía');
  return item;
}

function onSegment([a, b]: Segment, rng: Rng): Vec3 {
  const t = rng();
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function onSphere(radius: number, rng: Rng): Vec3 {
  const z = rng() * 2 - 1;
  const angle = rng() * TAU;
  const r = Math.sqrt(1 - z * z) * radius;
  return [Math.cos(angle) * r, Math.sin(angle) * r, z * radius];
}

/** Segmentos elegidos con probabilidad proporcional a su largo: densidad pareja. */
function segmentSampler(segments: readonly Segment[]): Sampler {
  const cumulative: number[] = [];
  let total = 0;
  for (const [a, b] of segments) {
    total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    cumulative.push(total);
  }
  return (rng) => {
    const target = rng() * total;
    const index = cumulative.findIndex((value) => value >= target);
    const segment = segments[Math.max(0, index)];
    if (!segment) throw new Error('segmentSampler: sin segmentos');
    return onSegment(segment, rng);
  };
}

/** Giroscopio: tres anillos inclinados, un núcleo y un eje. El estado de reposo. */
function core(): Sampler {
  const rings = [
    { radius: 1.3, tiltX: 0.35, tiltZ: 0.1 },
    { radius: 1.02, tiltX: -1.05, tiltZ: 0.5 },
    { radius: 0.76, tiltX: 1.25, tiltZ: -0.7 },
  ];
  return (rng) => {
    const roll = rng();
    if (roll < 0.58) {
      const ring = pick(rings, rng);
      const angle = rng() * TAU;
      const radius = ring.radius + (rng() - 0.5) * 0.02;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const y1 = y * Math.cos(ring.tiltX);
      const z1 = y * Math.sin(ring.tiltX);
      return [x * Math.cos(ring.tiltZ) - y1 * Math.sin(ring.tiltZ), x * Math.sin(ring.tiltZ) + y1 * Math.cos(ring.tiltZ), z1];
    }
    if (roll < 0.9) return onSphere(0.36 * Math.cbrt(0.4 + rng() * 0.6), rng);
    return [(rng() - 0.5) * 0.015, (rng() - 0.5) * 3.3, 0];
  };
}

/** Cercha espacial: el taller. Cordones, montantes y diagonales de una estructura metálica. */
function lattice(): Sampler {
  const segments: Segment[] = [];
  const nx = 4;
  const sx = 0.72;
  const hy = 0.55;
  const hz = 0.42;
  for (let i = 0; i <= nx; i++) {
    const x = (i - nx / 2) * sx;
    for (const y of [-hy, hy]) segments.push([[x, y, -hz], [x, y, hz]]);
    for (const z of [-hz, hz]) segments.push([[x, -hy, z], [x, hy, z]]);
    if (i === nx) continue;
    const next = x + sx;
    for (const y of [-hy, hy]) for (const z of [-hz, hz]) segments.push([[x, y, z], [next, y, z]]);
    const up = i % 2 === 0;
    for (const z of [-hz, hz]) segments.push([[x, up ? -hy : hy, z], [next, up ? hy : -hy, z]]);
    segments.push([[x, hy, up ? -hz : hz], [next, hy, up ? hz : -hz]]);
  }
  return segmentSampler(segments);
}

/** Líneas de código: renglones con sangría y cortes entre tokens, en dos capas. */
function code(seed: number): Sampler {
  const layout = mulberry32(seed);
  const rows = 26;
  const lines: Segment[] = [];
  let indent = 0;
  for (let row = 0; row < rows; row++) {
    indent = Math.max(0, Math.min(4, indent + Math.floor(layout() * 3) - 1));
    if (layout() < 0.12) continue; // renglón en blanco
    const y = 1.25 - (row / (rows - 1)) * 2.5;
    let x = -1.7 + indent * 0.22;
    const end = Math.min(1.7, x + 0.5 + layout() * 2.4);
    while (x < end) {
      const token = 0.08 + layout() * 0.42;
      lines.push([[x, y, 0], [Math.min(end, x + token), y, 0]]);
      x += token + 0.06;
    }
  }
  const sample = segmentSampler(lines);
  return (rng) => {
    const [x, y] = sample(rng);
    return [x, y, rng() < 0.82 ? 0 : -0.7];
  };
}

/** Retícula de módulos: estantes de inventario, o la grilla de una interfaz. */
function grid(seed: number): Sampler {
  const layout = mulberry32(seed);
  const segments: Segment[] = [];
  const cols = 6;
  const rows = 4;
  const w = 0.5;
  const h = 0.46;
  const gap = 0.07;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x0 = (c - cols / 2) * (w + gap) + gap / 2;
      const y0 = (r - rows / 2) * (h + gap) + gap / 2;
      const z = layout() < 0.3 ? 0.35 : 0;
      const x1 = x0 + w;
      const y1 = y0 + h;
      segments.push([[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]);
      // Nivel de stock: algunas celdas llevan barras de relleno.
      const fill = Math.floor(layout() * 4);
      for (let k = 1; k <= fill; k++) segments.push([[x0 + 0.06, y0 + k * 0.09, z], [x1 - 0.06, y0 + k * 0.09, z]]);
    }
  }
  return segmentSampler(segments);
}

/** Grafo: servicios (nodos) y las conexiones entre ellos. */
function graph(seed: number): Sampler {
  const layout = mulberry32(seed);
  const nodes: Vec3[] = [];
  for (let i = 0; i < 11; i++) {
    const [x, y, z] = onSphere(0.55 + layout() * 0.85, layout);
    nodes.push([x * 1.25, y * 0.9, z * 0.8]);
  }
  const edges: Segment[] = [];
  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({ j, d: Math.hypot(other[0] - node[0], other[1] - node[1], other[2] - node[2]) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of nearest) {
      const other = nodes[j];
      if (other) edges.push([node, other]);
    }
  });
  const onEdge = segmentSampler(edges);
  return (rng) => {
    if (rng() < 0.5) return onEdge(rng);
    const node = pick(nodes, rng);
    const [x, y, z] = onSphere(0.1, rng);
    return [node[0] + x, node[1] + y, node[2] + z];
  };
}

/** Placa: pistas ortogonales, pads y un integrado al centro. */
function pcb(seed: number): Sampler {
  const layout = mulberry32(seed);
  const traces: Segment[] = [];
  const pads: Vec3[] = [];
  const step = 0.16;
  const snap = (value: number): number => Math.round(value / step) * step;
  for (let i = 0; i < 46; i++) {
    let x = snap((layout() - 0.5) * 3.4);
    let y = snap((layout() - 0.5) * 2.4);
    pads.push([x, y, 0]);
    let horizontal = layout() < 0.5;
    const turns = 2 + Math.floor(layout() * 3);
    for (let k = 0; k < turns; k++) {
      const length = snap((0.3 + layout() * 0.9) * (layout() < 0.5 ? -1 : 1));
      const nx = Math.max(-1.75, Math.min(1.75, horizontal ? x + length : x));
      const ny = Math.max(-1.25, Math.min(1.25, horizontal ? y : y + length));
      traces.push([[x, y, 0], [nx, ny, 0]]);
      x = nx;
      y = ny;
      horizontal = !horizontal;
    }
    pads.push([x, y, 0]);
  }
  const chip: Segment[] = [
    [[-0.4, -0.3, 0.06], [0.4, -0.3, 0.06]],
    [[0.4, -0.3, 0.06], [0.4, 0.3, 0.06]],
    [[0.4, 0.3, 0.06], [-0.4, 0.3, 0.06]],
    [[-0.4, 0.3, 0.06], [-0.4, -0.3, 0.06]],
  ];
  const onTrace = segmentSampler(traces);
  const onChip = segmentSampler(chip);
  return (rng) => {
    const roll = rng();
    if (roll < 0.68) return onTrace(rng);
    if (roll < 0.8) return onChip(rng);
    const pad = pick(pads, rng);
    const angle = rng() * TAU;
    return [pad[0] + Math.cos(angle) * 0.035, pad[1] + Math.sin(angle) * 0.035, 0];
  };
}

/** Capas concéntricas: un modelo como cáscaras de activación. */
function neural(): Sampler {
  const shells = [0.42, 0.8, 1.18];
  return (rng) => {
    const roll = rng();
    const radius = roll < 0.15 ? shells[0] : roll < 0.5 ? shells[1] : shells[2];
    return onSphere(radius ?? 1, rng);
  };
}

/** Terreno de líneas: el campo abierto donde termina el recorrido. */
function field(): Sampler {
  const rows = 34;
  return (rng) => {
    const x = (rng() - 0.5) * 7.4;
    const z = (Math.floor(rng() * rows) / (rows - 1) - 0.5) * 4.2;
    const y = Math.sin(x * 1.1 + z * 0.9) * 0.22 + Math.sin(x * 0.45 - z * 1.7) * 0.3 - 0.75;
    return [x, y, z];
  };
}

/** Canales de sensores: series de tiempo apiladas y un umbral de control. */
function signal(seed: number): Sampler {
  const layout = mulberry32(seed);
  const channels = Array.from({ length: 5 }, (_, index) => ({
    y: 1.0 - index * 0.5,
    frequency: 1.5 + layout() * 4,
    phase: layout() * TAU,
    amplitude: 0.07 + layout() * 0.12,
  }));
  return (rng) => {
    const channel = pick(channels, rng);
    const x = (rng() - 0.5) * 3.6;
    const roll = rng();
    if (roll < 0.1) return [x, channel.y - 0.2, 0]; // línea base
    if (roll < 0.16) return [Math.round(x / 0.6) * 0.6, channel.y - 0.2 + rng() * 0.4, 0]; // marcas de tiempo
    const wave = Math.sin(x * channel.frequency + channel.phase) + Math.sin(x * channel.frequency * 2.7) * 0.3;
    return [x, channel.y + wave * channel.amplitude, 0];
  };
}

/** Disco de anillos cortado en ocho porciones. */
function rings(): Sampler {
  const levels = 9;
  return (rng) => {
    const slice = Math.floor(rng() * 8);
    if (rng() < 0.16) {
      const angle = (slice / 8) * TAU;
      const r = 0.12 + rng() * 1.2;
      return [Math.cos(angle) * r, Math.sin(angle) * r, 0];
    }
    const level = 1 + Math.floor(Math.sqrt(rng()) * levels);
    const r = (level / levels) * 1.32;
    const angle = ((slice + 0.06 + rng() * 0.88) / 8) * TAU;
    return [Math.cos(angle) * r, Math.sin(angle) * r, (level % 2) * 0.05];
  };
}

function samplerFor(id: FormationId, seed: number): Sampler {
  switch (id) {
    case 'core': return core();
    case 'lattice': return lattice();
    case 'code': return code(seed);
    case 'grid': return grid(seed);
    case 'graph': return graph(seed);
    case 'pcb': return pcb(seed);
    case 'neural': return neural();
    case 'field': return field();
    case 'signal': return signal(seed);
    case 'rings': return rings();
  }
}

export function buildFormation(id: FormationId, count: number, seed = 7): Float32Array {
  const sample = samplerFor(id, seed);
  const rng = mulberry32(seed * 1013 + FORMATION_IDS.indexOf(id));
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = sample(rng);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}
