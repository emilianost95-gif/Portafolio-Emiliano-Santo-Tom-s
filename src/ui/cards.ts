/**
 * Tarjetas de proyecto interactivas.
 *
 *  - Luz que sigue al puntero (como la torcha sobre metal) + borde que se enciende cerca.
 *  - Inclinación 3D leve. Solo con mouse/trackpad y sin reduced motion.
 *  - Tarjeta activa (hover o foco con teclado) → la escena 3D suelda la cercha justo detrás de ella.
 *
 * Costo: un listener por tarjeta, agrupado en un requestAnimationFrame; solo se escriben
 * custom properties de CSS (el navegador repinta el pseudo-elemento de esa tarjeta, nada más).
 * Sin JS, las tarjetas funcionan igual: todo esto es mejora progresiva.
 */

let active: number | null = null;

let cards: HTMLElement[] = [];

/**
 * Centro de la tarjeta activa en NDC (-1..1, y hacia arriba), o null.
 * La capa 3D lo lee en cada frame para soldar la cercha justo detrás de esa tarjeta.
 * Es una lectura de layout sin escrituras de por medio: no fuerza reflows en cadena.
 */
export function activeCardTarget(): { x: number; y: number } | null {
  const card = active === null ? undefined : cards[active];
  if (!card) return null;
  const r = card.getBoundingClientRect();
  return {
    x: ((r.left + r.width / 2) / innerWidth) * 2 - 1,
    y: -(((r.top + r.height / 2) / innerHeight) * 2 - 1),
  };
}

const MAX_TILT_DEG = 4;

export function initCards(): () => void {
  cards = [...document.querySelectorAll<HTMLElement>('.case')];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups: (() => void)[] = [];

  cards.forEach((card, index) => {
    let frame = 0;
    let lastX = 0;
    let lastY = 0;

    const paint = (): void => {
      frame = 0;
      const rect = card.getBoundingClientRect();
      const x = lastX - rect.left;
      const y = lastY - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      if (!reducedMotion.matches) {
        // -1..1 respecto del centro → grados. Se inclina "hacia" el puntero.
        const nx = (x / rect.width) * 2 - 1;
        const ny = (y / rect.height) * 2 - 1;
        card.style.setProperty('--tilt-x', `${(-ny * MAX_TILT_DEG).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(nx * MAX_TILT_DEG).toFixed(2)}deg`);
      }
    };

    const onMove = (e: PointerEvent): void => {
      if (!finePointer.matches) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onEnter = (e: PointerEvent): void => {
      active = index;
      if (finePointer.matches) {
        card.classList.add('is-lit');
        onMove(e);
      }
    };
    const onLeave = (): void => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      card.classList.remove('is-lit');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      if (active === index && !card.contains(document.activeElement)) active = null;
    };
    // Teclado: el foco dentro de la tarjeta también la activa (y suelda su nudo).
    const onFocusIn = (): void => {
      active = index;
    };
    const onFocusOut = (e: FocusEvent): void => {
      if (!card.contains(e.relatedTarget as Node | null) && active === index) active = null;
    };

    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('focusin', onFocusIn);
    card.addEventListener('focusout', onFocusOut);
    cleanups.push(() => {
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      card.removeEventListener('focusin', onFocusIn);
      card.removeEventListener('focusout', onFocusOut);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
