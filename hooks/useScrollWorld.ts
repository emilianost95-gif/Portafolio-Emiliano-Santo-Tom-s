'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { selectOverlayOpen, useSystem } from '@/lib/store';
import { originStepAt, scrollToP, type SectionBox, SECTION_IDS } from '@/lib/track';
import { scroller, world } from '@/lib/world';

/**
 * Convierte el scroll en la posición `p` del recorrido.
 *
 * Las secciones se miden solo cuando cambia el layout (ResizeObserver); en cada
 * evento de scroll se hace una cuenta, sin leer el DOM. Con reduced motion no
 * hay Lenis: scroll nativo, misma lógica.
 */
export function useScrollWorld(): void {
  const reducedMotion = useSystem((state) => state.reducedMotion);
  const overlayOpen = useSystem(selectOverlayOpen);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
    let boxes: SectionBox[] = [];

    const update = () => {
      world.p = scrollToP(window.scrollY, window.innerHeight, boxes);
      const section = SECTION_IDS[Math.floor(world.p)] ?? 'core';
      const originStep = originStepAt(world.p);
      const state = useSystem.getState();
      if (state.section !== section || state.originStep !== originStep) state.set({ section, originStep });
    };
    const measure = () => {
      boxes = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      });
      update();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', update, { passive: true });
    measure();

    const lenis = reducedMotion ? null : new Lenis({ autoRaf: true, lerp: 0.11, anchors: true });
    if (lenis) {
      scroller.to = (target) => lenis.scrollTo(target, { duration: 1.4 });
      scroller.stop = () => lenis.stop();
      scroller.start = () => lenis.start();
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', update);
      lenis?.destroy();
      scroller.to = (target) => target.scrollIntoView();
      scroller.stop = () => undefined;
      scroller.start = () => undefined;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (overlayOpen) scroller.stop();
    else scroller.start();
  }, [overlayOpen, reducedMotion]);
}
