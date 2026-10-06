'use client';

import { useEffect, useState } from 'react';
import { useSystem } from '@/lib/store';
import { world } from '@/lib/world';

/** Secreto: un click sostenido sobre el vacío muestra lo que el motor está haciendo. */
export function Telemetry() {
  const holding = useSystem((state) => state.holding);
  const quality = useSystem((state) => state.quality);
  const [, refresh] = useState(0);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!holding) return;
    setOrigin({ x: ((world.pointer.x + 1) / 2) * window.innerWidth, y: ((1 - world.pointer.y) / 2) * window.innerHeight });
    const interval = window.setInterval(() => refresh((n) => n + 1), 250);
    return () => window.clearInterval(interval);
  }, [holding]);

  if (!holding) return null;
  const { fps, calls, points, dpr } = world.stats;
  const webgl = quality !== 'static' && quality !== null;
  const flip = origin.x > window.innerWidth - 260;
  return (
    <dl
      className="telemetry"
      aria-hidden="true"
      data-flip={flip ? '' : undefined}
      style={{ left: origin.x, top: Math.min(origin.y, window.innerHeight - 170) }}
    >
      <div><dt>RENDERER</dt><dd>{webgl ? 'WEBGL2' : 'STATIC'}</dd></div>
      <div><dt>QUALITY</dt><dd>{(quality ?? '—').toUpperCase()}</dd></div>
      <div><dt>FPS</dt><dd>{webgl ? fps : '—'}</dd></div>
      <div><dt>PARTICLES</dt><dd>{webgl ? points.toLocaleString('en-US') : 0}</dd></div>
      <div><dt>DRAW CALLS</dt><dd>{webgl ? calls : 0}</dd></div>
      <div><dt>DPR</dt><dd>{dpr.toFixed(2)}</dd></div>
    </dl>
  );
}
