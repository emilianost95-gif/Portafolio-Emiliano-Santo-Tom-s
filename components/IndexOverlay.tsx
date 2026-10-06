'use client';

import { SECTION_LABEL } from '@/data/site';
import { goToSection } from '@/lib/navigate';
import { useSystem } from '@/lib/store';
import { SECTION_IDS } from '@/lib/track';
import { Overlay } from './Overlay';

/** Índice a pantalla completa: la navegación en pantallas angostas. */
export function IndexOverlay() {
  const open = useSystem((state) => state.indexOpen);
  const section = useSystem((state) => state.section);
  const set = useSystem((state) => state.set);

  return (
    <Overlay open={open} label="Índice" className="index">
      <button className="close" type="button" onClick={() => set({ indexOpen: false })}>
        CLOSE <kbd>ESC</kbd>
      </button>
      <ol className="index__list">
        {SECTION_IDS.map((id, i) => (
          <li key={id} style={{ '--i': i } as React.CSSProperties}>
            <button
              type="button"
              aria-current={id === section ? 'true' : undefined}
              onClick={() => {
                set({ indexOpen: false });
                // El scroll arranca cuando el overlay ya liberó la página.
                requestAnimationFrame(() => goToSection(id));
              }}
            >
              <span className="index__n">0{i + 1}</span>
              {SECTION_LABEL[id]}
            </button>
          </li>
        ))}
      </ol>
    </Overlay>
  );
}
