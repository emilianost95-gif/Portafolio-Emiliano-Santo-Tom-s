import { create } from 'zustand';
import type { QualityLevel } from './quality';
import type { SectionId } from './track';

/**
 * Estado de la experiencia. Todo lo que cambia pocas veces por segundo vive acá;
 * lo que cambia en cada frame (scroll, puntero) vive en lib/world.ts, fuera de React.
 */

export type SceneState = 'CORE' | 'ACTIVE' | 'SYSTEM' | 'DEEP MODE';

interface SystemState {
  /** null = todavía no se midió el dispositivo. */
  quality: QualityLevel | null;
  reducedMotion: boolean;
  coarsePointer: boolean;
  introDone: boolean;
  section: SectionId;
  originStep: number;
  /** El puntero está sobre el núcleo. */
  coreHover: boolean;
  /** Click sostenido: muestra la telemetría. */
  holding: boolean;
  deep: boolean;
  /** Modo secreto (Konami): el arco. */
  forge: boolean;
  hoverProject: string | null;
  activeProject: string | null;
  terminalOpen: boolean;
  indexOpen: boolean;
  set: (patch: Partial<Omit<SystemState, 'set'>>) => void;
}

export const useSystem = create<SystemState>((set) => ({
  quality: null,
  reducedMotion: false,
  coarsePointer: false,
  introDone: false,
  section: 'core',
  originStep: 0,
  coreHover: false,
  holding: false,
  deep: false,
  forge: false,
  hoverProject: null,
  activeProject: null,
  terminalOpen: false,
  indexOpen: false,
  set,
}));

export function selectSceneState(state: SystemState): SceneState {
  if (state.deep) return 'DEEP MODE';
  if (state.activeProject || state.holding) return 'SYSTEM';
  if (state.coreHover || state.hoverProject) return 'ACTIVE';
  return 'CORE';
}

/** Hay una capa modal abierta: el scroll se detiene. La terminal no cuenta: no es modal. */
export const selectOverlayOpen = (state: SystemState): boolean =>
  state.activeProject !== null || state.indexOpen;
