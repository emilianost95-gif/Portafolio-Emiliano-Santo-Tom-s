'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/data/site';
import { useSystem } from '@/lib/store';

const BOOT_MS = 1100;
const OPEN_MS = 900;
const SEEN_KEY = 'est:intro';

type Phase = 'boot' | 'open' | 'gone';

/**
 * Entrada: un contador corto y dos persianas que se abren sobre el hero.
 * Dura ~2 s la primera vez; cualquier tecla o click la salta, y en la misma
 * sesión (o con reduced motion) no vuelve a mostrarse.
 */
export function Intro() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const { set } = useSystem.getState();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) !== null;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* almacenamiento bloqueado: se muestra la intro */
    }
    if (reduced || seen) {
      setPhase('gone');
      set({ introDone: true });
      return;
    }

    const start = performance.now();
    let frame = 0;
    let timer = 0;
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      cancelAnimationFrame(frame);
      setCount(100);
      setPhase('open');
      set({ introDone: true });
      timer = window.setTimeout(() => setPhase('gone'), OPEN_MS);
    };
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / BOOT_MS);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else open();
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('pointerdown', open);
    window.addEventListener('keydown', open);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', open);
      window.removeEventListener('keydown', open);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div className="intro" data-phase={phase} aria-hidden="true">
      <div className="intro__shutter intro__shutter--top" />
      <div className="intro__shutter intro__shutter--bottom" />
      <div className="intro__readout">
        <span>EST / SYSTEM</span>
        <span className="intro__bar" style={{ '--progress': count / 100 } as React.CSSProperties} />
        <span className="intro__count">{String(count).padStart(3, '0')}</span>
      </div>
      <p className="intro__place">{SITE.coordinates}</p>
    </div>
  );
}
