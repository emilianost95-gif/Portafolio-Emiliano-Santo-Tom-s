/**
 * Experimentos del PLAYGROUND. Para agregar uno: escribir el módulo en
 * components/experiments/ y registrarlo acá. Cada módulo se descarga recién
 * cuando el visitante lo enciende.
 */

export const EXPERIMENT_CATEGORIES = [
  'WEBGL', 'SHADERS', '3D', 'AI', 'PHYSICS', 'GENERATIVE', 'INTERACTION', 'IOT', 'AUTOMATION',
] as const;

export type ExperimentCategory = (typeof EXPERIMENT_CATEGORIES)[number];

/** Un experimento monta su dibujo en el canvas y devuelve cómo apagarse. */
export type ExperimentMount = (canvas: HTMLCanvasElement) => () => void;

export interface Experiment {
  readonly id: string;
  readonly title: string;
  readonly categories: readonly ExperimentCategory[];
  readonly note: string;
  readonly hint: string;
  readonly load: () => Promise<{ readonly mount: ExperimentMount }>;
}

export const EXPERIMENTS: readonly Experiment[] = [
  {
    id: 'domain-warp',
    title: 'DOMAIN WARP',
    categories: ['SHADERS', 'WEBGL'],
    note: 'Ruido deformado por ruido, en un único fragment shader.',
    hint: 'Mové el puntero',
    load: () => import('@/components/experiments/domainWarp'),
  },
  {
    id: 'spring-type',
    title: 'SPRING TYPE',
    categories: ['INTERACTION', 'PHYSICS'],
    note: 'Tipografía hecha de puntos con resortes: se rompe y vuelve.',
    hint: 'Atravesá las letras',
    load: () => import('@/components/experiments/springType'),
  },
  {
    id: 'flow-field',
    title: 'FLOW FIELD',
    categories: ['GENERATIVE'],
    note: 'Dos mil partículas siguiendo un campo vectorial que cambia en el tiempo.',
    hint: 'Click: campo nuevo',
    load: () => import('@/components/experiments/flowField'),
  },
  {
    id: 'verlet-cloth',
    title: 'VERLET CLOTH',
    categories: ['PHYSICS'],
    note: 'Tela simulada con integración de Verlet y restricciones de distancia.',
    hint: 'Arrastrá la tela',
    load: () => import('@/components/experiments/verletCloth'),
  },
  {
    id: 'relay-loop',
    title: 'RELAY LOOP',
    categories: ['IOT', 'AUTOMATION'],
    note: 'Lazo de control con histéresis sobre un sensor simulado: la lógica de SmartGrow.',
    hint: 'Movete en vertical: consigna',
    load: () => import('@/components/experiments/relayLoop'),
  },
];
