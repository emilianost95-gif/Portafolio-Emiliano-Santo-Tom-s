/**
 * Carrusel horizontal guiado por el scroll vertical.
 *
 * En escritorio la sección se fija (position: sticky) y cada píxel de scroll vertical
 * desplaza la cinta un píxel a la izquierda. La posición es una función directa del
 * scroll: reversible por construcción, sin inercia propia ni librerías.
 *
 * "Transición de foco": la tarjeta que pasa por el centro queda a escala y brillo
 * completos; las de los costados se achican y se atenúan (--focus 0..1 por tarjeta).
 *
 * Se desactiva (lista vertical normal) en pantallas angostas y con reduced motion:
 * fijar la sección en un celular es incómodo y con reduced motion sería movimiento forzado.
 */

const ENABLE_QUERY = '(min-width: 900px) and (prefers-reduced-motion: no-preference)';

/** Pura: desplazamiento horizontal (px) para una posición de scroll dentro de la sección. */
export function shiftFor(scrolled: number, maxShift: number): number {
  return Math.min(maxShift, Math.max(0, scrolled));
}

/** Pura: foco de una tarjeta según la distancia de su centro al centro del viewport (0..1). */
export function focusFor(distance: number, width: number): number {
  const d = Math.abs(distance) / Math.max(1, width);
  return Math.max(0, 1 - d * 1.6);
}

export function initHScroll(): () => void {
  const root = document.querySelector<HTMLElement>('[data-hscroll]');
  const sticky = root?.querySelector<HTMLElement>('.hscroll__sticky');
  const track = root?.querySelector<HTMLElement>('.hscroll__track');
  if (!root || !sticky || !track) return () => undefined;

  const cards = [...track.querySelectorAll<HTMLElement>('.case')];
  const fill = root.querySelector<HTMLElement>('.hscroll__bar-fill');
  const current = root.querySelector<HTMLElement>('[data-hscroll-current]');
  const total = root.querySelector<HTMLElement>('[data-hscroll-total]');
  if (total) total.textContent = String(cards.length).padStart(2, '0');

  const query = matchMedia(ENABLE_QUERY);
  let enabled = false;
  let maxShift = 0;
  let frame = 0;
  // Posición de cada tarjeta dentro de la cinta (se mide al activar y en cada resize, nunca por frame).
  let centers: number[] = [];
  let padLeft = 0;

  const measure = (): void => {
    if (!enabled) return;
    root.style.height = '';
    const viewW = sticky.clientWidth;
    padLeft = parseFloat(getComputedStyle(sticky).paddingLeft) || 0;
    centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    // La cinta termina cuando la ÚLTIMA tarjeta queda centrada (no cuando su borde toca el
    // borde de la pantalla: así nunca tomaba foco y el contador se quedaba en 05 de 06).
    maxShift = Math.max(0, padLeft + (centers[centers.length - 1] ?? 0) - viewW / 2);
    // Alto total = alto fijo de la pantalla + 1 px de scroll por cada px de desplazamiento.
    root.style.height = `${sticky.offsetHeight + maxShift}px`;
    update();
  };

  const update = (): void => {
    frame = 0;
    if (!enabled) return;
    const scrolled = -root.getBoundingClientRect().top;
    const shift = shiftFor(scrolled, maxShift);
    track.style.transform = `translate3d(${-shift}px, 0, 0)`;

    const viewW = sticky.clientWidth;
    // Centro de la pantalla expresado en coordenadas de la cinta (descontando el padding del contenedor).
    const mid = shift + viewW / 2 - padLeft;
    let best = 0;
    let bestFocus = -1;
    cards.forEach((card, i) => {
      const f = focusFor((centers[i] ?? 0) - mid, viewW);
      card.style.setProperty('--focus', f.toFixed(3));
      if (f > bestFocus) {
        bestFocus = f;
        best = i;
      }
    });
    if (current) current.textContent = String(best + 1).padStart(2, '0');
    if (fill) fill.style.transform = `scaleX(${maxShift > 0 ? shift / maxShift : 0})`;
  };

  const onScroll = (): void => {
    if (enabled && !frame) frame = requestAnimationFrame(update);
  };

  /**
   * Teclado: si el foco cae en una tarjeta fuera de cuadro, se scrollea la PÁGINA hasta
   * dejarla centrada (la cinta nunca se scrollea sola: eso desincronizaría el desplazamiento).
   */
  const onFocusIn = (e: FocusEvent): void => {
    if (!enabled) return;
    sticky.scrollLeft = 0; // el navegador intenta "mostrar" el foco scrolleando el contenedor
    const card = (e.target as HTMLElement).closest<HTMLElement>('.case');
    const i = card ? cards.indexOf(card) : -1;
    if (i < 0) return;
    const shift = shiftFor(padLeft + (centers[i] ?? 0) - sticky.clientWidth / 2, maxShift);
    const top = root.getBoundingClientRect().top + window.scrollY + shift;
    if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top });
  };

  const enable = (on: boolean): void => {
    enabled = on;
    document.documentElement.classList.toggle('hs-on', on);
    if (on) {
      measure();
    } else {
      root.style.height = '';
      track.style.transform = '';
      cards.forEach((c) => c.style.removeProperty('--focus'));
    }
  };

  const ro = new ResizeObserver(() => measure());
  ro.observe(track);
  ro.observe(sticky);
  addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('focusin', onFocusIn);
  const onQuery = (): void => enable(query.matches);
  query.addEventListener('change', onQuery);
  void document.fonts?.ready.then(measure);
  enable(query.matches);

  return () => {
    ro.disconnect();
    removeEventListener('scroll', onScroll);
    track.removeEventListener('focusin', onFocusIn);
    query.removeEventListener('change', onQuery);
    enable(false);
  };
}
