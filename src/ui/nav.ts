/**
 * Marca en la navegación la sección visible (`aria-current="location"`).
 * Responde a "¿dónde estoy?" del punto 9 sin depender del 3D.
 *
 * Se usa IntersectionObserver con una franja central del viewport:
 * la sección "activa" es la que cruza el centro de la pantalla.
 */
export function initActiveNav(): () => void {
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.nav__list a[href^="#"]').forEach((a) => {
    links.set(a.hash.slice(1), a);
  });

  const setActive = (id: string | null): void => {
    links.forEach((link, key) => {
      if (key === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(links.has(entry.target.id) ? entry.target.id : null);
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  document.querySelectorAll<HTMLElement>('[data-section]').forEach((s) => observer.observe(s));
  return () => observer.disconnect();
}
