'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { EVOLUTION } from '@/data/evolution';
import { EXPERIMENTS } from '@/data/experiments';
import { PROJECTS, STATUS_LABEL } from '@/data/projects';
import { STACK } from '@/data/stack';
import { goToSection } from '@/lib/navigate';
import { useSystem } from '@/lib/store';
import { runCommand, type TerminalContext } from '@/lib/terminal';
import { world } from '@/lib/world';

interface Line {
  readonly id: number;
  readonly text: string;
  readonly kind: 'in' | 'out';
}

const GREETING = ['EMILIANO SYSTEM — terminal experimental', 'Escribí "help" para ver los comandos. ESC para salir.'];
let nextId = 0;
const toLines = (texts: readonly string[], kind: Line['kind']): Line[] => texts.map((text) => ({ id: nextId++, text, kind }));

/** Terminal opcional (tecla E). No es modal: la página sigue ahí detrás. */
export function Terminal() {
  const open = useSystem((state) => state.terminalOpen);
  const set = useSystem((state) => state.set);
  const [lines, setLines] = useState<Line[]>(() => toLines(GREETING, 'out'));
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    input.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const state = useSystem.getState();
    const context: TerminalContext = {
      quality: state.quality ?? 'static',
      webgl: state.quality !== 'static' && state.quality !== null,
      deep: state.deep,
      points: world.stats.points,
      dpr: world.stats.dpr,
      projects: PROJECTS.map((project) => ({ id: project.id, title: project.title, status: STATUS_LABEL[project.status] })),
      stack: STACK.map((tech) => tech.name),
      experiments: EXPERIMENTS,
      evolution: EVOLUTION.map((step) => step.label),
    };
    const result = runCommand(value, context);
    const echoed = [...toLines([`> ${value}`], 'in'), ...toLines(result.lines, 'out')];
    setLines((current) => (result.action?.type === 'clear' ? [] : [...current, ...echoed].slice(-200)));
    if (value.trim()) setHistory((current) => [value, ...current].slice(0, 30));
    setCursor(-1);
    setValue('');

    const action = result.action;
    if (!action) return;
    if (action.type === 'exit') set({ terminalOpen: false });
    if (action.type === 'deep') set({ deep: !state.deep });
    if (action.type === 'goto') goToSection(action.section);
    if (action.type === 'open') set({ terminalOpen: false, activeProject: action.project });
  };

  const recall = (direction: 1 | -1) => {
    const index = Math.max(-1, Math.min(history.length - 1, cursor + direction));
    setCursor(index);
    setValue(index === -1 ? '' : (history[index] ?? ''));
  };

  return (
    <section className="terminal" role="dialog" aria-label="Terminal" data-lenis-prevent>
      <header className="terminal__bar">
        <span>EST://TERMINAL</span>
        <button className="close" type="button" onClick={() => set({ terminalOpen: false })}>
          CLOSE <kbd>ESC</kbd>
        </button>
      </header>
      <div ref={log} className="terminal__log" role="log" aria-live="polite" tabIndex={0} aria-label="Salida de la terminal">
        {lines.map((line) => (
          <p key={line.id} data-kind={line.kind}>
            {line.text || ' '}
          </p>
        ))}
      </div>
      <form className="terminal__prompt" onSubmit={submit}>
        <label htmlFor="terminal-input" aria-hidden="true">
          &gt;
        </label>
        <input
          id="terminal-input"
          ref={input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              recall(1);
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              recall(-1);
            }
          }}
          aria-label="Comando"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={80}
        />
      </form>
    </section>
  );
}
