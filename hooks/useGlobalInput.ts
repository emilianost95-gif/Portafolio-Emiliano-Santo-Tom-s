'use client';

import { useEffect } from 'react';
import { goToSection } from '@/lib/navigate';
import { useSystem } from '@/lib/store';
import { SECTION_IDS } from '@/lib/track';
import { pulse, world } from '@/lib/world';

const HOLD_MS = 550;
const FORGE_MS = 12_000;
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const INTERACTIVE = 'a, button, input, textarea, select, canvas, [role="dialog"]';

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/**
 * Entrada global: puntero (posición, velocidad, pulso, click sostenido) y teclado
 * (SHIFT, E, ESC, 1–6, Konami). Un solo lugar para todos los atajos.
 */
export function useGlobalInput(): void {
  useEffect(() => {
    const { set } = useSystem.getState();
    let lastMove = performance.now();
    let holdTimer = 0;
    let forgeTimer = 0;
    let cleanShift = false;
    let konami = 0;

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      const now = performance.now();
      const dt = Math.max(1, now - lastMove) / 1000;
      const speed = Math.hypot(x - world.pointer.x, y - world.pointer.y) / dt;
      world.pointer.speed = Math.max(world.pointer.speed, Math.min(4, speed));
      world.pointer.x = x;
      world.pointer.y = y;
      world.pointer.seen = event.pointerType === 'mouse';
      lastMove = now;
    };

    const endHold = () => {
      window.clearTimeout(holdTimer);
      if (useSystem.getState().holding) set({ holding: false });
    };

    const onDown = (event: PointerEvent) => {
      onMove(event);
      if (event.button !== 0) return;
      const onControl = event.target instanceof Element && event.target.closest(INTERACTIVE) !== null;
      if (onControl) return;
      pulse();
      holdTimer = window.setTimeout(() => set({ holding: true }), HOLD_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // SHIFT solo cuenta si se pulsa y se suelta sin nada en el medio (Shift+Tab no lo dispara).
      cleanShift = event.key === 'Shift' && !event.repeat;
      const state = useSystem.getState();

      if (event.key === 'Escape') {
        if (state.terminalOpen) set({ terminalOpen: false });
        else if (state.indexOpen) set({ indexOpen: false });
        else if (state.activeProject) set({ activeProject: null });
        return;
      }
      if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

      const expected = KONAMI[konami];
      konami = event.key === expected ? konami + 1 : event.key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        set({ forge: true });
        pulse();
        window.clearTimeout(forgeTimer);
        forgeTimer = window.setTimeout(() => set({ forge: false }), FORGE_MS);
        return;
      }

      if (state.activeProject || state.indexOpen) return;
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        set({ terminalOpen: true });
        return;
      }
      const section = SECTION_IDS[Number(event.key) - 1];
      if (section && !state.terminalOpen) {
        goToSection(section);
        pulse();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && cleanShift && !isTyping(event.target)) {
        set({ deep: !useSystem.getState().deep });
        pulse();
      }
      cleanShift = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', endHold, { passive: true });
    window.addEventListener('pointercancel', endHold, { passive: true });
    window.addEventListener('blur', endHold);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(forgeTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', endHold);
      window.removeEventListener('pointercancel', endHold);
      window.removeEventListener('blur', endHold);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}
