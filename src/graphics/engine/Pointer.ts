/**
 * Puntero normalizado (-1..1, y hacia arriba) para mouse y touch.
 * Un solo listener pasivo en window: el canvas tiene pointer-events: none
 * para no bloquear clics ni selección de texto del contenido.
 */
export class Pointer {
  x = 0;
  y = 0;
  private lastMove = -Infinity;
  private readonly onMove = (e: PointerEvent): void => {
    this.x = (e.clientX / innerWidth) * 2 - 1;
    this.y = -((e.clientY / innerHeight) * 2 - 1);
    this.lastMove = performance.now();
  };
  private readonly onLeave = (): void => {
    this.lastMove = -Infinity;
  };

  constructor(private readonly idleMs = 2500) {
    addEventListener('pointermove', this.onMove, { passive: true });
    addEventListener('pointerdown', this.onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
  }

  /** Se movió hace poco (en touch, el dedo deja de "empujar" al rato de soltar). */
  isActive(now: number): boolean {
    return now - this.lastMove < this.idleMs;
  }

  dispose(): void {
    removeEventListener('pointermove', this.onMove);
    removeEventListener('pointerdown', this.onMove);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
  }
}
