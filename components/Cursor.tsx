'use client';

import { useEffect, useRef } from 'react';

/**
 * Cursor: un punto que sigue al puntero sin retraso y un marco que lo alcanza.
 *
 * El contexto se declara en el HTML, no acá:
 *   data-cursor="link"     → el marco se abre
 *   data-cursor="tech"     → muestra data-cursor-label
 *   data-cursor="project"  → marco + "OPEN"
 *   data-cursor="secret"   → retícula con acento
 * Los enlaces y botones sin atributo se tratan como "link".
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const target = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const k = 1 - Math.exp(-(now - last) / 70);
      last = now;
      ring.x += (target.x - ring.x) * k;
      ring.y += (target.y - ring.y) * k;
      element.style.setProperty('--x', `${target.x}px`);
      element.style.setProperty('--y', `${target.y}px`);
      element.style.setProperty('--rx', `${ring.x}px`);
      element.style.setProperty('--ry', `${ring.y}px`);
      frame = requestAnimationFrame(tick);
    };

    const read = (under: Element | null) => {
      const context = under?.closest<HTMLElement>('[data-cursor], a, button') ?? null;
      const mode = context ? (context.dataset.cursor ?? 'link') : 'idle';
      if (element.dataset.mode !== mode) element.dataset.mode = mode;
      const text = mode === 'project' ? 'OPEN' : (context?.dataset.cursorLabel ?? '');
      if (label.current && label.current.textContent !== text) label.current.textContent = text;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      element.dataset.visible = '';
      read(event.target instanceof Element ? event.target : null);
    };
    // Tras un click o un scroll puede haber otra cosa bajo un puntero que no se movió.
    let pending = false;
    const reread = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        read(document.elementFromPoint(target.x, target.y));
      });
    };
    const onDown = () => (element.dataset.down = '');
    const onUp = () => {
      delete element.dataset.down;
      reread();
    };
    const onLeave = () => delete element.dataset.visible;

    frame = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', reread, { passive: true });
    window.addEventListener('keyup', reread);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.documentElement.dataset.cursor = 'custom';
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', reread);
      window.removeEventListener('keyup', reread);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  return (
    <div ref={root} className="cursor" data-mode="idle" aria-hidden="true">
      <span className="cursor__dot" />
      <span className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </span>
    </div>
  );
}
