import { INK, mountSketch } from '@/lib/canvas';

const COUNT = 2000;

/** Partículas siguiendo un campo vectorial. No se borra el cuadro: se lo apaga de a poco. */
export function mount(canvas: HTMLCanvasElement): () => void {
  const points = new Float32Array(COUNT * 2);
  let seed = Math.random() * 100;
  let scale = 0.006;

  const scatter = (width: number, height: number) => {
    for (let i = 0; i < COUNT; i++) {
      points[i * 2] = Math.random() * width;
      points[i * 2 + 1] = Math.random() * height;
    }
  };

  return mountSketch(canvas, {
    resize: (stage) => {
      scatter(stage.width, stage.height);
      stage.ctx.fillStyle = INK.bg;
      stage.ctx.fillRect(0, 0, stage.width, stage.height);
    },
    click: () => {
      seed = Math.random() * 100;
      scale = 0.003 + Math.random() * 0.008;
    },
    frame: ({ ctx, width, height, pointer }, dt, time) => {
      ctx.fillStyle = 'rgba(14, 15, 17, 0.07)';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < COUNT; i++) {
        let x = points[i * 2] ?? 0;
        let y = points[i * 2 + 1] ?? 0;
        const angle = (Math.sin(x * scale + seed + time * 0.15) + Math.cos(y * scale * 1.3 - seed)) * Math.PI;
        x += Math.cos(angle) * 60 * dt;
        y += Math.sin(angle) * 60 * dt;
        const near = pointer.inside && Math.hypot(x - pointer.x, y - pointer.y) < 70;
        if (x < 0 || x > width || y < 0 || y > height || Math.random() < 0.004) {
          x = Math.random() * width;
          y = Math.random() * height;
        }
        points[i * 2] = x;
        points[i * 2 + 1] = y;
        ctx.fillStyle = near ? INK.arc : INK.chalk;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    },
  });
}
