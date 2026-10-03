/**
 * Tarjetas de proyecto interactivas.
 *
 *  - Entrada "soldada": un cordón recorre el borde y el contenido aparece por partes.
 *    Va atada al scroll con CSS (animation-timeline: view()); acá solo está el fallback
 *    para navegadores sin esa API.
 *  - Luz que sigue al puntero (como la torcha sobre metal) + borde que se enciende cerca.
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

export function initCards(): () => void {
  cards = [...document.querySelectorAll<HTMLElement>('.case')];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
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

  cleanups.push(initEntranceFallback(cards));
  return () => cleanups.forEach((fn) => fn());
}

/**
 * Fallback de la entrada para navegadores sin scroll-driven animations.
 * También es reversible: la clase se saca cuando la tarjeta vuelve a quedar por
 * DEBAJO del viewport (al subir). Si sale por arriba (ya leída), queda soldada.
 */
function initEntranceFallback(cards: HTMLElement[]): () => void {
  if (CSS.supports('animation-timeline: view()')) return () => undefined;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;
  document.documentElement.classList.add('cards-io');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) el.classList.add('is-in');
        else if (entry.boundingClientRect.top > 0) el.classList.remove('is-in');
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  cards.forEach((c) => io.observe(c));
  return () => io.disconnect();
}
