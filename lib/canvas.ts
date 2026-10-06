/** Base compartida de los experimentos 2D: tamaño, puntero, loop y limpieza. */

export const INK = { bg: '#0e0f11', chalk: '#ecebe6', dim: '#5d646d', arc: '#ff8c26' } as const;

export interface Stage {
  readonly ctx: CanvasRenderingContext2D;
  /** Tamaño en píxeles CSS (el contexto ya está escalado por DPR). */
  width: number;
  height: number;
  readonly pointer: { x: number; y: number; inside: boolean; down: boolean };
}

export interface Sketch {
  /** Se llama al montar y cada vez que cambia el tamaño. */
  readonly resize?: (stage: Stage) => void;
  readonly frame: (stage: Stage, dt: number, time: number) => void;
  readonly click?: (stage: Stage) => void;
}

export interface Tracked {
  readonly pointer: Stage['pointer'];
  readonly dispose: () => void;
}

/** Puntero relativo al canvas. `onClick` se dispara al soltar sin haber arrastrado. */
export function trackPointer(canvas: HTMLCanvasElement, onClick?: () => void): Tracked {
  const pointer = { x: 0, y: 0, inside: false, down: false };
  const place = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside = true;
  };
  const down = (event: PointerEvent) => {
    place(event);
    pointer.down = true;
    canvas.setPointerCapture(event.pointerId);
  };
  const up = () => {
    if (pointer.down) onClick?.();
    pointer.down = false;
  };
  const leave = () => {
    pointer.inside = false;
    pointer.down = false;
  };
  canvas.addEventListener('pointermove', place);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointercancel', leave);
  return {
    pointer,
    dispose: () => {
      canvas.removeEventListener('pointermove', place);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
    },
  };
}

export function mountSketch(canvas: HTMLCanvasElement, sketch: Sketch): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const tracked = trackPointer(canvas, () => sketch.click?.(stage));
  const stage: Stage = { ctx, width: 0, height: 0, pointer: tracked.pointer };

  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.width = canvas.clientWidth;
    stage.height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(stage.width * dpr));
    canvas.height = Math.max(1, Math.round(stage.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sketch.resize?.(stage);
  };
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);
  fit();

  let frame = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    sketch.frame(stage, dt, now / 1000);
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    tracked.dispose();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
