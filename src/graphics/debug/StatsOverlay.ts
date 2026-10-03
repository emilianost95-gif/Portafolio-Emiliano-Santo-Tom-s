import type { EngineStats } from '../engine/Engine';

/**
 * Monitor de rendimiento. Solo se carga con `?debug` (chunk aparte), así que
 * no pesa nada para el visitante normal pero se puede usar en producción para
 * medir en el dispositivo real.
 */
export class StatsOverlay {
  private readonly el = document.createElement('pre');
  private timer = 0;

  constructor(private readonly read: () => EngineStats) {
    this.el.className = 'stats-overlay';
    this.el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.el);
    this.timer = window.setInterval(() => this.paint(), 500);
    this.paint();
  }

  private paint(): void {
    const s = this.read();
    const fps = s.frameMs > 0 ? Math.round(1000 / s.frameMs) : 0;
    const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    this.el.textContent = [
      `${s.backend} · ${s.level}`,
      `fps      ${fps}`,
      `frame    ${s.frameMs.toFixed(1)} ms`,
      `draws    ${s.drawCalls}`,
      `tris     ${s.triangles.toLocaleString('es-CL')}`,
      `inst     ${s.instances.toLocaleString('es-CL')}`,
      `geo/tex  ${s.geometries}/${s.textures}`,
      `dpr      ${s.pixelRatio.toFixed(2)}`,
      heap ? `heap     ${(heap.usedJSHeapSize / 1048576).toFixed(1)} MB` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  dispose(): void {
    clearInterval(this.timer);
    this.el.remove();
  }
}
