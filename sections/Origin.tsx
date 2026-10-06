'use client';

import type { CSSProperties } from 'react';
import { EVOLUTION } from '@/data/evolution';
import { useSystem } from '@/lib/store';
import { ORIGIN_STEPS } from '@/lib/track';
import { scroller } from '@/lib/world';

/**
 * 02 — ORIGIN. Una sección alta con el contenido fijo: el scroll no mueve texto,
 * avanza de etapa. Cada etapa tiene su forma en el núcleo (lib/track.ts).
 */
export function Origin() {
  const step = useSystem((state) => state.originStep);

  const goToStep = (index: number) => {
    const marker = document.querySelector<HTMLElement>(`[data-origin-marker="${index}"]`);
    if (marker) scroller.to(marker);
  };

  return (
    <section className="origin" id="origin" data-section aria-labelledby="origin-title" style={{ '--steps': ORIGIN_STEPS } as CSSProperties}>
      {/* Anclas invisibles: una por etapa, a la altura donde esa etapa queda centrada. */}
      {EVOLUTION.map((item, index) => (
        <span key={item.id} className="origin__marker" data-origin-marker={index} style={{ '--step': index } as CSSProperties} />
      ))}

      <div className="origin__stage">
        <h2 className="mono origin__kicker" id="origin-title">
          WHO IS EMILIANO?
        </h2>

        <div className="origin__display" aria-hidden="true">
          {EVOLUTION.map((item, index) => (
            <div key={item.id} className="origin__frame" data-active={index === step ? '' : undefined} data-past={index < step ? '' : undefined}>
              <p className="origin__label display">{item.label}</p>
              <p className="origin__text">{item.text}</p>
            </div>
          ))}
        </div>

        <ol className="origin__rail mono">
          {EVOLUTION.map((item, index) => (
            <li key={item.id} aria-current={index === step ? 'step' : undefined} data-past={index < step ? '' : undefined}>
              <button type="button" onClick={() => goToStep(index)}>
                <span className="origin__rail-label">{item.label}</span>
              </button>
              <span className="sr-only">{item.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
