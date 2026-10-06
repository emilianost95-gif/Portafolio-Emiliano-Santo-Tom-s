'use client';

import { useEffect } from 'react';

/** Marca con data-inview los elementos [data-reveal] la primera vez que entran en pantalla. */
export function useReveal(): void {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-inview', '');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}
