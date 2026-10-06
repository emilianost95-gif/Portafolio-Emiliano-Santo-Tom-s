'use client';

import { SECTION_LABEL, SITE } from '@/data/site';
import { goToSection } from '@/lib/navigate';
import { selectSceneState, useSystem } from '@/lib/store';
import { SECTION_IDS } from '@/lib/track';

const QUALITY_LABEL = { pending: '—', static: 'STATIC', low: 'LOW', medium: 'MEDIUM', high: 'HIGH' } as const;

/**
 * Marco fijo de la interfaz. Siempre responde tres preguntas: dónde estoy (riel),
 * en qué estado está el sistema (abajo a la izquierda) y qué puedo hacer (controles).
 * La navegación completa aparece recién después del primer scroll.
 */
export function Hud() {
  const section = useSystem((state) => state.section);
  const sceneState = useSystem(selectSceneState);
  const deep = useSystem((state) => state.deep);
  const forge = useSystem((state) => state.forge);
  const quality = useSystem((state) => state.quality);
  const introDone = useSystem((state) => state.introDone);
  const set = useSystem((state) => state.set);
  const index = SECTION_IDS.indexOf(section);

  return (
    <div className="hud" data-hud data-ready={introDone ? '' : undefined} data-explored={index > 0 ? '' : undefined}>
      <header className="hud__top">
        <a className="hud__brand" href="#core" aria-label={`${SITE.name} — inicio`}>
          <span aria-hidden="true">EST</span>
        </a>
        <nav className="hud__nav" aria-label="Secciones">
          {SECTION_IDS.slice(1).map((id) => (
            <a key={id} href={`#${id}`} aria-current={id === section ? 'true' : undefined}>
              {SECTION_LABEL[id]}
            </a>
          ))}
        </nav>
        <p className="hud__where">
          0{index + 1} / {SECTION_LABEL[section]}
        </p>
        <button className="hud__index" type="button" onClick={() => set({ indexOpen: true })}>
          INDEX
        </button>
      </header>

      <ol className="hud__rail" aria-label="Posición en el recorrido">
        {SECTION_IDS.map((id, i) => (
          <li key={id} aria-current={id === section ? 'step' : undefined}>
            <button type="button" onClick={() => goToSection(id)} data-cursor="tech" data-cursor-label={SECTION_LABEL[id]}>
              <span className="sr-only">{SECTION_LABEL[id]}</span>
              <span className="hud__tick" aria-hidden="true" />
              <span className="hud__tick-label" aria-hidden="true">
                0{i + 1}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <footer className="hud__bottom">
        <div className="hud__status">
          <p role="status">
            <span className="hud__key">STATE</span> <span className="hud__state">{sceneState}</span>
          </p>
          <button className="hud__toggle" type="button" aria-pressed={deep} onClick={() => set({ deep: !deep })} data-cursor="secret">
            <span className="hud__switch" aria-hidden="true" />
            <kbd>SHIFT</kbd> <span className="sr-only">Alternar </span>DEEP MODE
          </button>
        </div>
        <div className="hud__status hud__status--end">
          <p>
            <span className="hud__key">GFX</span> {QUALITY_LABEL[quality ?? 'pending']}
          </p>
          <button className="hud__toggle" type="button" onClick={() => set({ terminalOpen: true })} data-cursor="secret">
            <kbd>E</kbd> TERMINAL
          </button>
        </div>
      </footer>

      {forge && (
        <p className="hud__forge" role="status">
          ARC STRUCK — 2022 SOLDADURA → 2026 SOFTWARE
        </p>
      )}
    </div>
  );
}
