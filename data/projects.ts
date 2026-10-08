import type { FormationId } from '../lib/formations.ts';

/**
 * Proyectos de SELECT SYSTEM. Para agregar uno: sumar un objeto a PROJECTS.
 * Ningún componente conoce proyectos concretos.
 *
 * `draft: true` = texto provisional escrito a partir de una descripción breve,
 * pendiente de revisión por Emiliano. La interfaz lo señala como "DATA PENDING"
 * en lugar de presentarlo como un caso cerrado.
 */

export type ProjectStatus = 'online' | 'mvp' | 'pending';

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly stack: readonly string[];
  readonly status: ProjectStatus;
  readonly url?: string;
  readonly repo?: string;
  readonly visual: { readonly formation: FormationId };
  readonly details: {
    readonly problem: string;
    readonly solution: string;
    readonly result: string;
  };
  readonly draft?: boolean;
}

export const STATUS_LABEL: Readonly<Record<ProjectStatus, string>> = {
  online: 'SYSTEM ONLINE',
  mvp: 'MVP RUNNING',
  pending: 'DATA PENDING',
};

export const PROJECTS: readonly Project[] = [
  {
    id: 'gestor-stock',
    title: 'GESTOR DE PRECIOS & STOCK',
    description: 'Inventario para almacenes y minimarkets, con un asistente que analiza los datos reales.',
    category: 'Inventory',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'IndexedDB', 'CSV', 'PWA', 'Capacitor'],
    status: 'online',
    url: 'https://emilianost95-gif.github.io/gestor-precios-stock/',
    repo: 'https://github.com/emilianost95-gif/gestor-precios-stock',
    visual: { formation: 'grid' },
    details: {
      problem:
        'Los almacenes de barrio llevan precios y stock en cuaderno o planilla, y se enteran de que algo se agotó cuando el cliente lo pide.',
      solution:
        'Dashboard, alertas de stock, historial, proveedores e importación/exportación CSV. Funciona sin backend ni conexión. "Stock Copilot" analiza el inventario en local y las acciones masivas siempre piden confirmación.',
      result: 'Publicado como PWA y empaquetado para Android con Capacitor, con build automatizado en GitHub Actions.',
    },
  },
  {
    id: 'construct-os',
    title: 'CONSTRUCT-OS',
    description: 'Sistema de gestión para construcción.',
    category: 'Management',
    stack: [],
    status: 'pending',
    visual: { formation: 'lattice' },
    details: {
      problem: 'Una obra reparte su información entre planillas, mensajes y papel, y nadie ve el estado completo.',
      solution: 'Un único sistema para ordenar la gestión de la obra.',
      result: 'Pendiente de documentar.',
    },
    draft: true,
  },
  {
    id: 'smartgrow',
    title: 'SMARTGROW',
    description: 'IoT de punta a punta: hardware, API y dashboard para un cultivo indoor.',
    category: 'IoT',
    stack: ['ESP32', 'Arduino', 'DHT22', 'Fastify', 'TimescaleDB', 'React'],
    status: 'mvp',
    url: 'https://emilianost95-gif.github.io/smart-grow/',
    repo: 'https://github.com/emilianost95-gif/smart-grow',
    visual: { formation: 'signal' },
    details: {
      problem: 'Controlar temperatura y humedad de un cultivo indoor sin tener que estar presente.',
      solution:
        'ESP32/Arduino con sensores DHT22 y módulos de relé, API en Fastify, TimescaleDB para series de tiempo y un dashboard en React con controles y analítica.',
      result: 'Landing publicada y dashboard MVP funcional.',
    },
  },
  {
    id: 'luca-pizza',
    title: 'LUCA PIZZA',
    description: 'Stock, recetas, costos y automatización para una pizzería.',
    category: 'Operations',
    stack: [],
    status: 'pending',
    visual: { formation: 'rings' },
    details: {
      problem: 'El costo real de cada producto depende de recetas e insumos que cambian de precio todo el tiempo.',
      solution: 'Stock, recetas y costos conectados, para que un cambio de precio se refleje solo en todo lo demás.',
      result: 'Pendiente de documentar.',
    },
    draft: true,
  },
  {
    id: 'registro-geriatrico',
    title: 'REGISTRO GERIÁTRICO',
    description: 'Registro diario de los pacientes de un hogar de adultos mayores, pensado para personas no técnicas.',
    category: 'Health',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Dexie', 'IndexedDB', 'ExcelJS', 'jsPDF', 'PWA', 'Capacitor'],
    status: 'online',
    url: 'https://emilianost95-gif.github.io/geriatrico-app/',
    repo: 'https://github.com/emilianost95-gif/geriatrico-app',
    visual: { formation: 'graph' },
    details: {
      problem:
        'El registro diario de un hogar se lleva en planillas armadas a mano, y quien las completa no es técnico ni tiene siempre conexión.',
      solution:
        'Letra y botones grandes, opciones que se completan con un toque. Pantalla "Hoy" con avance del día y alertas, ronda de signos, gráficos de evolución e informes PDF. Importa planillas de Excel existentes, incluida la migración de todo el hogar de una vez. Los datos quedan en el dispositivo, con copias de seguridad.',
      result: 'Publicado como PWA y como APK de Android compilado en GitHub Actions, con 133 pruebas automatizadas.',
    },
  },
  {
    id: 'oa-manager',
    title: 'OA MANAGER',
    description: 'Gestor de Objetivos de Aprendizaje para que una profesora organice y siga su planificación.',
    category: 'Education',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'TanStack Query', 'Express', 'Prisma', 'PostgreSQL', 'Zod', 'Docker'],
    status: 'mvp',
    repo: 'https://github.com/emilianost95-gif/oa-manager-app',
    visual: { formation: 'code' },
    details: {
      problem:
        'Los objetivos de cada asignatura, curso y unidad se reparten entre planillas, y no hay una vista de qué está pendiente, en curso o logrado.',
      solution:
        'Asignaturas, cursos, unidades y objetivos con estado y prioridad. Reordenamiento con arrastrar y soltar, filtros combinables y dashboard con indicadores. Importa desde Excel/CSV y exporta a CSV, Excel y PDF. API REST con sesión por cookie y datos aislados por cuenta.',
      result: 'Funciona de punta a punta contra PostgreSQL en local. Sin demo pública todavía.',
    },
  },
];

export const projectIndex = (id: string): number => PROJECTS.findIndex((project) => project.id === id);
export const findProject = (id: string | null): Project | undefined => PROJECTS.find((project) => project.id === id);
export const projectNumber = (index: number): string => String(index + 1).padStart(2, '0');
