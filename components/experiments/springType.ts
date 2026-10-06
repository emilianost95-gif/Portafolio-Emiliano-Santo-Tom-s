import { INK, mountSketch, type Stage } from '@/lib/canvas';

const WORD = 'BUILD';
const RADIUS = 80;

interface Dot {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Rasteriza la palabra fuera de pantalla y devuelve un punto por celda ocupada. */
function sampleWord(stage: Stage): Dot[] {
  const { width, height } = stage;
  const buffer = document.createElement('canvas');
  buffer.width = Math.max(1, Math.round(width));
  buffer.height = Math.max(1, Math.round(height));
  const ctx = buffer.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const size = Math.min(height * 0.6, width / (WORD.length * 0.74));
  ctx.font = `800 ${size}px "Archivo Variable", "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(WORD, buffer.width / 2, buffer.height / 2);
  const { data } = ctx.getImageData(0, 0, buffer.width, buffer.height);
  const step = Math.max(4, Math.round(Math.sqrt((width * height) / 5200)));
  const dots: Dot[] = [];
  for (let y = 0; y < buffer.height; y += step) {
    for (let x = 0; x < buffer.width; x += step) {
      if ((data[(y * buffer.width + x) * 4 + 3] ?? 0) > 128) {
        dots.push({ homeX: x, homeY: y, x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0 });
      }
    }
  }
  return dots;
}

/** Tipografía de puntos: cada punto es un resorte amortiguado atado a su lugar en la letra. */
export function mount(canvas: HTMLCanvasElement): () => void {
  let dots: Dot[] = [];
  return mountSketch(canvas, {
    resize: (stage) => {
      dots = sampleWord(stage);
    },
    frame: ({ ctx, width, height, pointer }, dt) => {
      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);
      for (const dot of dots) {
        let ax = (dot.homeX - dot.x) * 60;
        let ay = (dot.homeY - dot.y) * 60;
        let hot = false;
        if (pointer.inside) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < RADIUS) {
            const force = (1 - distance / RADIUS) * 9000;
            ax += (dx / (distance + 0.001)) * force;
            ay += (dy / (distance + 0.001)) * force;
            hot = true;
          }
        }
        dot.vx = (dot.vx + ax * dt) * 0.88;
        dot.vy = (dot.vy + ay * dt) * 0.88;
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;
        ctx.fillStyle = hot ? INK.arc : INK.chalk;
        ctx.fillRect(dot.x - 1, dot.y - 1, 2, 2);
      }
    },
  });
}
