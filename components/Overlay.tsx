'use client';

import { type ReactNode, useEffect, useRef } from 'react';

interface OverlayProps {
  readonly open: boolean;
  readonly label: string;
  readonly className: string;
  readonly children: ReactNode;
}

/**
 * Capa modal: al abrirse toma el foco y al cerrarse lo devuelve a donde estaba.
 * Mientras está abierta el resto de la página queda inerte (ver System), así que
 * el foco no puede salir. ESC la cierra desde useGlobalInput.
 */
export function Overlay({ open, label, className, children }: OverlayProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    root.current?.focus({ preventScroll: true });
    return () => {
      // Un frame después: recién entonces la página dejó de estar inerte y acepta el foco.
      requestAnimationFrame(() => {
        if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
      });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div ref={root} className={className} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-lenis-prevent>
      {children}
    </div>
  );
}
