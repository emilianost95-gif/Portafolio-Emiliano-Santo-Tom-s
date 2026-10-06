/**
 * Stack como matriz tecnología × proyecto: dónde se usó cada cosa, no un porcentaje.
 *
 * `experience` describe hechos verificables (en producción, en un proyecto propio,
 * aprendiendo). `draft: true` = todavía no hay un proyecto publicado que lo respalde:
 * Emiliano debe completar o quitar la entrada.
 */

export const STACK_PROJECTS = [
  { id: 'stock', label: 'Gestor de Stock' },
  { id: 'oa', label: 'OA Manager' },
  { id: 'geri', label: 'Registro Geriátrico' },
  { id: 'grow', label: 'SmartGrow' },
  { id: 'vik', label: "VIKINGO'S" },
  { id: 'roble', label: 'ROBLE NEGRO' },
  { id: 'site', label: 'Este sitio' },
] as const;

export type StackProjectId = (typeof STACK_PROJECTS)[number]['id'];

export interface Tech {
  readonly id: string;
  readonly name: string;
  readonly group: 'LANG' | 'FRONT' | 'BACK' | 'DATA' | 'GFX' | 'OPS' | 'AI' | 'HW';
  readonly use: string;
  readonly experience: string;
  readonly projects: readonly StackProjectId[];
  readonly draft?: boolean;
}

const UNPUBLISHED = 'Sin proyecto publicado todavía';

export const STACK: readonly Tech[] = [
  { id: 'js', name: 'JavaScript', group: 'LANG', use: 'Sitios sin framework y la base de todo lo demás.', experience: 'En producción, en sitios de clientes', projects: ['vik', 'roble', 'grow'] },
  { id: 'ts', name: 'TypeScript', group: 'LANG', use: 'Modo estricto por defecto: los errores aparecen antes que el usuario.', experience: 'En aplicaciones publicadas', projects: ['stock', 'geri', 'site'] },
  { id: 'react', name: 'React', group: 'FRONT', use: 'Interfaces de aplicación: dashboards, formularios, estado.', experience: 'En aplicaciones publicadas', projects: ['stock', 'oa', 'geri', 'grow', 'site'] },
  { id: 'next', name: 'Next.js', group: 'FRONT', use: 'Estructura y build de este sitio, exportado como estático.', experience: 'Primer proyecto: este sitio', projects: ['site'] },
  { id: 'node', name: 'Node.js', group: 'BACK', use: 'APIs REST con Express y Fastify.', experience: 'En producción, en OA Manager', projects: ['oa', 'grow'] },
  { id: 'nest', name: 'NestJS', group: 'BACK', use: 'Backend estructurado por módulos.', experience: UNPUBLISHED, projects: [], draft: true },
  { id: 'pg', name: 'PostgreSQL', group: 'DATA', use: 'Datos relacionales con Prisma; series de tiempo con TimescaleDB.', experience: 'En producción, en OA Manager', projects: ['oa', 'grow'] },
  { id: 'mongo', name: 'MongoDB', group: 'DATA', use: 'Datos en documentos.', experience: UNPUBLISHED, projects: [], draft: true },
  { id: 'three', name: 'Three.js', group: 'GFX', use: 'El núcleo de este sitio: partículas, cámara y postproceso.', experience: 'Aprendiendo: este sitio y su versión anterior', projects: ['site'] },
  { id: 'webgl', name: 'WebGL', group: 'GFX', use: 'Shaders GLSL: la forma del núcleo se calcula en la GPU.', experience: 'Aprendiendo: este sitio', projects: ['site'] },
  { id: 'gsap', name: 'GSAP', group: 'FRONT', use: 'Secuencias de animación en sitios de contenido.', experience: UNPUBLISHED, projects: [], draft: true },
  { id: 'git', name: 'Git', group: 'OPS', use: 'Historial por fases, una rama por cambio.', experience: 'En todos los proyectos', projects: ['stock', 'oa', 'geri', 'grow', 'vik', 'roble', 'site'] },
  { id: 'github', name: 'GitHub', group: 'OPS', use: 'Repositorios, Pages y Actions para build y deploy automáticos.', experience: 'En todos los proyectos', projects: ['stock', 'oa', 'geri', 'grow', 'vik', 'roble', 'site'] },
  { id: 'ai', name: 'AI', group: 'AI', use: 'Asistente que analiza inventario real; la clave vive solo en una función serverless.', experience: 'En una aplicación publicada', projects: ['stock'] },
  { id: 'arduino', name: 'Arduino', group: 'HW', use: 'Lectura de sensores y control de relés.', experience: 'En un proyecto propio', projects: ['grow'] },
  { id: 'esp32', name: 'ESP32', group: 'HW', use: 'Microcontrolador con Wi-Fi: el puente entre los sensores y la API.', experience: 'En un proyecto propio', projects: ['grow'] },
];
