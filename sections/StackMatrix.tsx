'use client';

import { useState } from 'react';
import { STACK, STACK_PROJECTS } from '@/data/stack';

const columnNumber = (index: number): string => String(index + 1).padStart(2, '0');

/**
 * 04 — STACK. Una matriz de conexiones: filas = tecnologías, columnas = proyectos.
 * Un punto encendido significa "se usó acá". Elegir una fila muestra para qué la
 * uso y dónde; no hay barras de nivel porque no habría de dónde sacarlas.
 */
export function StackMatrix() {
  const [activeId, setActiveId] = useState(STACK[0]?.id ?? '');
  const active = STACK.find((tech) => tech.id === activeId) ?? STACK[0];
  if (!active) return null;

  return (
    <section className="stack" id="stack" data-section aria-labelledby="stack-title">
      <header className="section-head" data-reveal>
        <h2 className="mono" id="stack-title">
          STACK / SIGNAL MATRIX
        </h2>
        <p className="mono section-head__count">TECH × PROJECT</p>
      </header>

      <div className="stack__body" data-reveal>
        <table className="matrix mono">
          <caption className="sr-only">Tecnologías y los proyectos donde se usaron</caption>
          <thead>
            <tr>
              <td />
              {STACK_PROJECTS.map((project, index) => (
                <th key={project.id} scope="col" data-lit={active.projects.includes(project.id) ? '' : undefined}>
                  <span className="sr-only">{project.label}</span>
                  <span aria-hidden="true">{columnNumber(index)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STACK.map((tech) => (
              <tr key={tech.id} data-active={tech.id === active.id ? '' : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    aria-pressed={tech.id === active.id}
                    data-cursor="tech"
                    data-cursor-label={tech.group}
                    onPointerEnter={(event) => event.pointerType === 'mouse' && setActiveId(tech.id)}
                    onFocus={() => setActiveId(tech.id)}
                    onClick={() => setActiveId(tech.id)}
                  >
                    {tech.name}
                  </button>
                </th>
                {STACK_PROJECTS.map((project) => {
                  const used = tech.projects.includes(project.id);
                  return (
                    <td key={project.id} data-used={used ? '' : undefined}>
                      <span className="sr-only">{used ? 'Sí' : 'No'}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <aside className="readout" aria-live="polite" aria-label="Detalle de la tecnología elegida">
          <p className="mono readout__group">{active.group}</p>
          <h3 className="readout__name display">{active.name}</h3>
          <dl className="readout__data">
            <div>
              <dt className="mono">USO</dt>
              <dd>{active.use}</dd>
            </div>
            <div>
              <dt className="mono">EXPERIENCIA</dt>
              <dd>{active.experience}</dd>
            </div>
            <div>
              <dt className="mono">PROYECTOS</dt>
              <dd>
                <ul className="readout__projects mono">
                  {STACK_PROJECTS.map((project, index) => (
                    <li key={project.id} data-lit={active.projects.includes(project.id) ? '' : undefined}>
                      <span aria-hidden="true">{columnNumber(index)}</span> {project.label}
                      {active.projects.includes(project.id) && <span className="sr-only"> (usada)</span>}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
