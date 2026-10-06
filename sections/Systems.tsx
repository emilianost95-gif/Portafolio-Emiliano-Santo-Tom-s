'use client';

import { projectNumber, PROJECTS, STATUS_LABEL } from '@/data/projects';
import { useSystem } from '@/lib/store';

/**
 * 03 — SELECT SYSTEM. Los proyectos son entradas de un selector: apuntar a una
 * cambia la forma del núcleo; abrirla cambia el entorno (ProjectViewer).
 */
export function Systems() {
  const hoverProject = useSystem((state) => state.hoverProject);
  const set = useSystem((state) => state.set);

  return (
    <section className="systems" id="systems" data-section aria-labelledby="systems-title">
      <header className="section-head" data-reveal>
        <h2 className="mono" id="systems-title">
          SELECT SYSTEM
        </h2>
        <p className="mono section-head__count">{projectNumber(PROJECTS.length - 1)} AVAILABLE</p>
      </header>

      <ol className="systems__list" data-armed={hoverProject ? '' : undefined}>
        {PROJECTS.map((project, index) => (
          <li key={project.id} data-reveal>
            <button
              type="button"
              className="systems__row"
              data-cursor="project"
              data-hot={hoverProject === project.id ? '' : undefined}
              onPointerEnter={(event) => event.pointerType === 'mouse' && set({ hoverProject: project.id })}
              onPointerLeave={() => set({ hoverProject: null })}
              onFocus={() => set({ hoverProject: project.id })}
              onBlur={() => set({ hoverProject: null })}
              onClick={() => set({ activeProject: project.id, hoverProject: null })}
            >
              <span className="systems__n mono">{projectNumber(index)}</span>
              <span className="systems__title display">{project.title}</span>
              <span className="systems__meta mono">
                <span>{project.category}</span>
                <span data-status={project.status}>{STATUS_LABEL[project.status]}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
