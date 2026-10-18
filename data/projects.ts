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
    description: 'Sistema para empresas de construcción y metalúrgica: de la cotización a la rentabilidad de cada obra.',
    category: 'Management',
    stack: ['NestJS', 'Prisma', 'PostgreSQL', 'React', 'TypeScript', 'TanStack Query', 'Tailwind', 'Zod', 'Astro', 'Capacitor', 'Render', 'Supabase'],
    status: 'online',
    url: 'https://construct-os.onrender.com/',
    visual: { formation: 'lattice' },
    details: {
      problem:
        'Una empresa de obras reparte cotizaciones, avances, materiales, horas y cobros entre planillas, mensajes y papel, y recién al cerrar la obra sabe si ganó o perdió plata.',
      solution:
        'Monolito modular multiempresa: clientes y cotizaciones con PDF y aceptación por enlace, obras con avance ponderado y fotos desde el teléfono, inventario por bodega con costo promedio, partes de horas con aprobación, cobros y flujo de caja. Todo escribe en un libro de costos inmutable que proyecta la rentabilidad y alerta cuando una obra gasta más rápido de lo que avanza.',
      result:
        'En producción en Render con base y archivos en Supabase, más APK de Android compilado en GitHub Actions. 197 pruebas automatizadas. Demo abierta: "Probar la demo" crea una empresa ficticia propia por 24 horas, para recorrerla como la dueña, el encargado o el maestro.',
    },
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
  {
    id: 'lab-trigonometria',
    title: 'LABORATORIO DE TRIGONOMETRÍA',
    description: 'Laboratorio interactivo para llegar a la trigonometría desde cero: primero se experimenta, después aparece la fórmula.',
    category: 'Education',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'KaTeX', 'SVG', 'Vitest', 'Playwright'],
    status: 'online',
    url: 'https://emilianost95-gif.github.io/laboratorio-trigonometria/',
    repo: 'https://github.com/emilianost95-gif/laboratorio-trigonometria',
    visual: { formation: 'rings' },
    details: {
      problem:
        'La trigonometría suele enseñarse como fórmulas para memorizar, y cuando un ejercicio sale mal el estudiante no sabe en qué se equivocó.',
      solution:
        '18 módulos, del plano cartesiano a la ley del coseno y las gráficas, donde se arrastran puntos y se mide antes de formalizar. Un generador crea ejercicios distintos cada vez en 5 niveles y un detector reconoce los errores típicos (seno por coseno, grados por radianes) y los explica. Suma modo examen, calculadora DEG/RAD y progreso guardado en el navegador.',
      result:
        'Publicado en GitHub Pages como un único archivo HTML. Toda la matemática está en funciones puras con pruebas unitarias, más pruebas end-to-end con Playwright.',
    },
  },
];

export const projectIndex = (id: string): number => PROJECTS.findIndex((project) => project.id === id);
export const findProject = (id: string | null): Project | undefined => PROJECTS.find((project) => project.id === id);
export const projectNumber = (index: number): string => String(index + 1).padStart(2, '0');
