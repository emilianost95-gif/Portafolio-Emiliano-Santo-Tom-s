import { SECTION_IDS, type SectionId } from './track.ts';

/**
 * Intérprete de la terminal: función pura (línea + contexto → salida + acción).
 * La interfaz ejecuta la acción; acá no se toca el DOM ni se importan datos:
 * todo lo que la terminal sabe llega por el contexto.
 */

export type TerminalAction =
  | { readonly type: 'goto'; readonly section: SectionId }
  | { readonly type: 'open'; readonly project: string }
  | { readonly type: 'deep' }
  | { readonly type: 'clear' }
  | { readonly type: 'exit' };

export interface TerminalContext {
  readonly quality: string;
  readonly webgl: boolean;
  readonly deep: boolean;
  readonly points: number;
  readonly dpr: number;
  readonly projects: readonly { readonly id: string; readonly title: string; readonly status: string }[];
  readonly stack: readonly string[];
  readonly experiments: readonly { readonly title: string; readonly categories: readonly string[] }[];
  readonly evolution: readonly string[];
}

export interface TerminalResult {
  readonly lines: readonly string[];
  readonly action?: TerminalAction;
}

export const COMMANDS: readonly (readonly [string, string])[] = [
  ['help', 'lista de comandos'],
  ['about', 'quién es Emiliano'],
  ['projects', 'sistemas disponibles'],
  ['open <n>', 'abre el sistema n'],
  ['stack', 'tecnologías'],
  ['playground', 'experimentos'],
  ['system', 'estado del sistema'],
  ['goto <sección>', SECTION_IDS.join(' | ')],
  ['deep', 'alterna DEEP MODE'],
  ['clear', 'limpia la pantalla'],
  ['exit', 'cierra la terminal'],
];

const isSection = (value: string): value is SectionId => (SECTION_IDS as readonly string[]).includes(value);
const number = (index: number): string => String(index + 1).padStart(2, '0');

export function runCommand(input: string, context: TerminalContext): TerminalResult {
  const [command = '', ...args] = input.trim().toLowerCase().split(/\s+/);
  switch (command) {
    case '':
      return { lines: [] };
    case 'help':
      return { lines: COMMANDS.map(([name, text]) => `${name.padEnd(16)}${text}`) };
    case 'about':
      return {
        lines: ['EMILIANO SANTO TOMÁS — CREATIVE DEVELOPER', '', ...context.evolution.map((label, i) => `${i === 0 ? ' ' : '↓'} ${label}`)],
        action: { type: 'goto', section: 'origin' },
      };
    case 'projects':
      return {
        lines: [...context.projects.map((project, i) => `${number(i)}  ${project.title.padEnd(28)}${project.status}`), '', 'open <n> para abrir uno'],
      };
    case 'open': {
      const index = Number(args[0]) - 1;
      const project = context.projects[index];
      if (!project) return { lines: [`open: sistema inexistente. Disponibles: 1–${context.projects.length}`] };
      return { lines: [`PROJECT ${number(index)} — ${project.status}`], action: { type: 'open', project: project.id } };
    }
    case 'stack':
      return { lines: [context.stack.join(' · ')], action: { type: 'goto', section: 'stack' } };
    case 'playground':
      return {
        lines: context.experiments.map((experiment) => `${experiment.title.padEnd(16)}${experiment.categories.join(' / ')}`),
        action: { type: 'goto', section: 'playground' },
      };
    case 'system':
      return {
        lines: [
          'EMILIANO SYSTEM',
          'STATUS: ONLINE',
          `WEBGL: ${context.webgl ? 'ENABLED' : 'DISABLED (STATIC MODE)'}`,
          `QUALITY: ${context.quality.toUpperCase()}`,
          `PARTICLES: ${context.points}`,
          `DPR: ${context.dpr.toFixed(2)}`,
          'INTERACTION: ACTIVE',
          `MODE: ${context.deep ? 'DEEP' : 'CREATIVE'}`,
        ],
      };
    case 'goto': {
      const target = args[0] ?? '';
      if (!isSection(target)) return { lines: [`goto: ${SECTION_IDS.join(' | ')}`] };
      return { lines: [`→ ${target.toUpperCase()}`], action: { type: 'goto', section: target } };
    }
    case 'deep':
      return { lines: [`DEEP MODE: ${context.deep ? 'OFF' : 'ON'}`], action: { type: 'deep' } };
    case 'clear':
      return { lines: [], action: { type: 'clear' } };
    case 'exit':
      return { lines: [], action: { type: 'exit' } };
    default:
      return { lines: [`${command}: comando desconocido. Probá "help".`] };
  }
}
