'use client';

import type { CSSProperties } from 'react';
import { findProject, projectIndex, projectNumber, PROJECTS, STATUS_LABEL } from '@/data/projects';
import { useSystem } from '@/lib/store';
import { Overlay } from './Overlay';

const step = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties;

/**
 * Vista expandida de un proyecto. El núcleo toma la forma del proyecto y se corre
 * a la izquierda; el contenido entra por etapas a la derecha. Salidas: el botón
 * CLOSE (siempre visible), ESC, y anterior/siguiente para no tener que volver.
 */
export function ProjectViewer() {
  const activeProject = useSystem((state) => state.activeProject);
  const set = useSystem((state) => state.set);
  const project = findProject(activeProject);
  const index = project ? projectIndex(project.id) : 0;
  const neighbour = (offset: number) => PROJECTS[(index + offset + PROJECTS.length) % PROJECTS.length];
  const previous = neighbour(-1);
  const next = neighbour(1);

  return (
    <Overlay open={project !== undefined} label={project ? `Proyecto: ${project.title}` : 'Proyecto'} className="viewer">
      {project && (
        // La key reinicia la entrada escalonada al pasar de un proyecto a otro.
        <article className="viewer__panel" key={project.id}>
          <header className="viewer__head">
            <p className="viewer__status" style={step(0)}>
              <span>PROJECT {projectNumber(index)}</span>
              <span data-status={project.status}>{STATUS_LABEL[project.status]}</span>
            </p>
            <button className="close" type="button" onClick={() => set({ activeProject: null })}>
              CLOSE <kbd>ESC</kbd>
            </button>
          </header>

          <h2 className="viewer__title" style={step(1)}>
            {project.title}
          </h2>
          <p className="viewer__lead" style={step(2)}>
            {project.description}
          </p>

          <section className="viewer__block" style={step(3)} aria-label="Tecnologías">
            <h3>TECH</h3>
            {project.stack.length > 0 ? (
              <ul className="viewer__tech">
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            ) : (
              <p className="viewer__pending">Stack por confirmar.</p>
            )}
          </section>

          <dl className="viewer__case">
            <div style={step(4)}>
              <dt>PROBLEM</dt>
              <dd>{project.details.problem}</dd>
            </div>
            <div style={step(5)}>
              <dt>SOLUTION</dt>
              <dd>{project.details.solution}</dd>
            </div>
            <div style={step(6)}>
              <dt>RESULT</dt>
              <dd>{project.details.result}</dd>
            </div>
          </dl>

          {project.draft && (
            <p className="viewer__pending" style={step(7)}>
              Ficha provisional: los datos de este sistema todavía no están documentados.
            </p>
          )}

          <footer className="viewer__foot" style={step(8)}>
            <p className="viewer__links">
              {project.url && (
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  OPEN LIVE ↗
                </a>
              )}
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noopener noreferrer">
                  SOURCE ↗
                </a>
              )}
            </p>
            <p className="viewer__pager">
              {previous && (
                <button type="button" onClick={() => set({ activeProject: previous.id })}>
                  ← PREV
                </button>
              )}
              {next && (
                <button type="button" onClick={() => set({ activeProject: next.id })}>
                  NEXT →
                </button>
              )}
            </p>
          </footer>
        </article>
      )}
    </Overlay>
  );
}
