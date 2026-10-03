import { scrollToHeldTrack } from './track';

/** La transición entre formaciones ocupa como máximo ~0,9 pantallas antes de la sección siguiente. */
const TRANSITION_VIEWPORTS = 0.9;

export interface ScrollSnapshot {
  /** Posición en el track de secciones (0 = primera, n-1 = última). */
  readonly track: number;
  /** Progreso total de la página, 0..1. */
  readonly progress: number;
}

/**
 * Lee el scroll NATIVO. No lo reemplaza ni lo suaviza (ver README: por qué no Lenis).
 *
 * Costo por frame: leer `scrollY` (barato, no fuerza layout). Las posiciones de
 * las secciones (que sí fuerzan layout) se miden solo cuando algo cambia de
 * tamaño, nunca dentro del loop.
 */
export class ScrollTracker {
  private anchors: number[] = [];
  private maxScroll = 1;
  private readonly sections: HTMLElement[];
  private readonly observer: ResizeObserver;

  constructor(selector = '[data-section]') {
    this.sections = [...document.querySelectorAll<HTMLElement>(selector)];
    this.observer = new ResizeObserver(() => this.measure());
    this.observer.observe(document.body);
    // Las fuentes cambian la altura del texto: se vuelve a medir cuando terminan de cargar.
    void document.fonts?.ready.then(() => this.measure());
    this.measure();
  }

  get sectionCount(): number {
    return this.sections.length;
  }

  read(): ScrollSnapshot {
    const y = window.scrollY;
    return {
      track: scrollToHeldTrack(y, this.anchors, innerHeight * TRANSITION_VIEWPORTS),
      progress: Math.min(1, Math.max(0, y / this.maxScroll)),
    };
  }

  dispose(): void {
    this.observer.disconnect();
  }

  private measure(): void {
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    this.maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    this.anchors = this.sections.map((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY - header;
      return Math.min(this.maxScroll, Math.max(0, top));
    });
  }
}
