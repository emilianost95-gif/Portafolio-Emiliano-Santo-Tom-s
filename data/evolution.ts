/** WHO IS EMILIANO? — siete etapas. El orden coincide con las paradas de ORIGIN en lib/track.ts. */
export interface EvolutionStep {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

export const EVOLUTION: readonly EvolutionStep[] = [
  { id: 'hardware', label: 'HARDWARE', text: 'Soldadura y estructuras metálicas: electrodo, MIG y TIG. Aprendí a leer el plano antes de tocar el material.' },
  { id: 'web', label: 'WEB', text: 'Empecé a aprender desarrollo web por mi cuenta. HTML, CSS y JavaScript, sin atajos.' },
  { id: 'frontend', label: 'FRONTEND', text: 'React y TypeScript. Interfaces pensadas para quien las usa, no para quien las programa.' },
  { id: 'fullstack', label: 'FULL STACK', text: 'APIs, bases de datos y deploy. De la idea a producción, de punta a punta.' },
  { id: 'systems', label: 'SYSTEMS', text: 'Inventario, sensores, registros: software que ordena una operación real.' },
  { id: 'ai', label: 'AI', text: 'IA aplicada a datos reales, con vista previa y confirmación antes de actuar.' },
  { id: 'interactive', label: 'INTERACTIVE EXPERIENCES', text: 'WebGL, shaders y motion. Este sitio es el experimento en curso.' },
];
