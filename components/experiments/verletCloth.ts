import { INK, mountSketch, type Stage } from '@/lib/canvas';

const COLS = 26;
const ROWS = 15;
const ITERATIONS = 4;

interface Node {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
}

interface Link {
  readonly a: Node;
  readonly b: Node;
  readonly length: number;
}

function build(stage: Stage): { nodes: Node[]; links: Link[] } {
  const spacing = Math.min((stage.width * 0.8) / (COLS - 1), (stage.height * 0.62) / (ROWS - 1));
  const left = (stage.width - spacing * (COLS - 1)) / 2;
  const nodes: Node[] = [];
  const links: Link[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = left + col * spacing;
      const y = 18 + row * spacing;
      const node: Node = { x, y, px: x, py: y, pinned: row === 0 && col % 5 === 0 };
      const leftNode = col > 0 ? nodes[nodes.length - 1] : undefined;
      const upNode = row > 0 ? nodes[(row - 1) * COLS + col] : undefined;
      if (leftNode) links.push({ a: leftNode, b: node, length: spacing });
      if (upNode) links.push({ a: upNode, b: node, length: spacing });
      nodes.push(node);
    }
  }
  return { nodes, links };
}

/** Tela: integración de Verlet + restricciones de distancia resueltas por relajación. */
export function mount(canvas: HTMLCanvasElement): () => void {
  let nodes: Node[] = [];
  let links: Link[] = [];
  let grabbed: Node | null = null;

  return mountSketch(canvas, {
    resize: (stage) => {
      ({ nodes, links } = build(stage));
      grabbed = null;
    },
    frame: ({ ctx, width, height, pointer }, dt, time) => {
      if (pointer.down && !grabbed) {
        let best = 40;
        for (const node of nodes) {
          const distance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
          if (distance < best) {
            best = distance;
            grabbed = node;
          }
        }
      }
      if (!pointer.down) grabbed = null;

      const wind = Math.sin(time * 0.9) * 90;
      for (const node of nodes) {
        if (node.pinned) continue;
        const vx = (node.x - node.px) * 0.985;
        const vy = (node.y - node.py) * 0.985;
        node.px = node.x;
        node.py = node.y;
        node.x += vx + wind * dt * dt;
        node.y += vy + 900 * dt * dt;
        if (!pointer.down && pointer.inside) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 46) {
            node.x += (dx / (distance + 0.001)) * (46 - distance) * 0.35;
            node.y += (dy / (distance + 0.001)) * (46 - distance) * 0.35;
          }
        }
      }
      if (grabbed) {
        grabbed.x = pointer.x;
        grabbed.y = pointer.y;
      }
      for (let i = 0; i < ITERATIONS; i++) {
        for (const { a, b, length } of links) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const offset = ((distance - length) / distance) * 0.5;
          const held = (node: Node) => node.pinned || node === grabbed;
          if (!held(a)) {
            a.x += dx * offset;
            a.y += dy * offset;
          }
          if (!held(b)) {
            b.x -= dx * offset;
            b.y -= dy * offset;
          }
        }
      }

      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(236, 235, 230, 0.5)';
      ctx.beginPath();
      for (const { a, b } of links) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.fillStyle = INK.arc;
      for (const node of nodes) {
        if (node.pinned || node === grabbed) ctx.fillRect(node.x - 2.5, node.y - 2.5, 5, 5);
      }
    },
  });
}
