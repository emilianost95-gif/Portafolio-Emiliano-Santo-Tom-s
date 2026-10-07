'use client';

import { useEffect, useRef, useState } from 'react';
import { type Experiment, EXPERIMENT_CATEGORIES, type ExperimentCategory, EXPERIMENTS } from '@/data/experiments';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

interface TileProps {
  readonly experiment: Experiment;
  readonly index: number;
  readonly running: boolean;
  readonly onToggle: (run: boolean) => void;
}

function Tile({ experiment, index, running, onToggle }: TileProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLLIElement>(null);

  // El módulo del experimento se descarga recién al encenderlo.
  useEffect(() => {
    const element = canvas.current;
    if (!running || !element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void experiment.load().then((module) => {
      if (!cancelled) dispose = module.mount(element);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [running, experiment]);

  // Fuera de pantalla no se dibuja nada.
  useEffect(() => {
    const element = root.current;
    if (!running || !element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) onToggle(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [running, onToggle]);

  return (
    <li ref={root} className="tile" data-running={running ? '' : undefined}>
      <div className="tile__screen">
        <canvas ref={canvas} aria-hidden="true" />
        {!running && (
          <>
            {/* Captura real del experimento (scripts/playground-posters.mjs). Decorativa: el título está al lado. */}
            <img className="tile__poster" src={`${BASE_PATH}/playground/${experiment.id}.jpg`} alt="" width={866} height={540} loading="lazy" decoding="async" />
            <span className="tile__idle mono" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
          </>
        )}
        {running && <span className="tile__hint mono">{experiment.hint}</span>}
      </div>
      <div className="tile__meta">
        <div>
          <h3 className="tile__title mono">{experiment.title}</h3>
          <p className="tile__tags mono">{experiment.categories.join(' / ')}</p>
        </div>
        <button className="tile__run mono" type="button" aria-pressed={running} data-experiment={experiment.id} onClick={() => onToggle(!running)} data-cursor="secret">
          {running ? 'STOP' : 'RUN'}
          <span className="sr-only"> {experiment.title}</span>
        </button>
      </div>
      <p className="tile__note">{experiment.note}</p>
    </li>
  );
}

/**
 * 07 — PLAYGROUND. Experimentos chicos y vivos. Corre uno solo a la vez y solo
 * mientras está en pantalla: el resto son canvas vacíos que no cuestan nada.
 */
export function Playground() {
  const [filter, setFilter] = useState<ExperimentCategory | 'ALL'>('ALL');
  const [running, setRunning] = useState<string | null>(null);
  const categories = EXPERIMENT_CATEGORIES.filter((category) => EXPERIMENTS.some((experiment) => experiment.categories.includes(category)));
  const visible = EXPERIMENTS.filter((experiment) => filter === 'ALL' || experiment.categories.includes(filter));

  return (
    <section className="playground" id="playground" data-section aria-labelledby="playground-title">
      <header className="section-head" data-reveal>
        <h2 className="mono" id="playground-title">
          PLAYGROUND
        </h2>
        <p className="mono section-head__count">{String(EXPERIMENTS.length).padStart(2, '0')} EXPERIMENTS</p>
      </header>

      <div className="playground__filters mono" role="group" aria-label="Filtrar por categoría" data-reveal>
        {(['ALL', ...categories] as const).map((category) => (
          <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>
            {category}
          </button>
        ))}
      </div>

      <ul className="playground__grid" data-all={filter === 'ALL' ? '' : undefined} data-reveal>
        {visible.map((experiment) => (
          <Tile
            key={experiment.id}
            experiment={experiment}
            index={EXPERIMENTS.indexOf(experiment)}
            running={running === experiment.id}
            onToggle={(run) => setRunning((current) => (run ? experiment.id : current === experiment.id ? null : current))}
          />
        ))}
      </ul>
    </section>
  );
}
