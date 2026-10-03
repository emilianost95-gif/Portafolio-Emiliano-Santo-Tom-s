/**
 * Zona de la pantalla donde el 3D puede poner su elemento más brillante sin tapar texto.
 *
 * Se mide el DOM real (no se adivina en coordenadas 3D): según la proporción de la
 * ventana, una misma posición 3D cae sobre el texto o no. Medido en un notebook de
 * 2,1:1, la torcha definida en 3D pisaba el párrafo del hero.
 *
 * Devuelve un rectángulo en NDC (-1..1, y hacia arriba), que es lo que entiende la cámara.
 */
export interface NdcBox {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** Margen bajo el último bloque de texto: lo que suben las chispas antes de caer. */
const SPARK_RISE_PX = 110;

export function createHeroSafeArea(): { read(): NdcBox | null; dispose(): void } {
  let box: NdcBox | null = null;
  const hero = document.getElementById('inicio');
  const textBlocks = hero ? [...hero.querySelectorAll<HTMLElement>('.hero__title, .hero__lead')] : [];

  const measure = (): void => {
    if (!hero || textBlocks.length === 0) {
      box = null;
      return;
    }
    const w = innerWidth;
    const h = innerHeight;
    // Debajo del último bloque de texto + lo que suben las chispas; a la derecha del 45 % del ancho.
    const textBottom = Math.max(...textBlocks.map((el) => el.getBoundingClientRect().bottom));
    const top = Math.min(h - 40, textBottom + SPARK_RISE_PX);
    const left = w * 0.45;
    const right = w * 0.95;
    const bottom = h - 24;
    const toNdcX = (px: number): number => (px / w) * 2 - 1;
    const toNdcY = (px: number): number => -((px / h) * 2 - 1);
    box = { minX: toNdcX(left), maxX: toNdcX(right), minY: toNdcY(bottom), maxY: toNdcY(top) };
  };

  const ro = new ResizeObserver(measure);
  if (hero) ro.observe(hero);
  void document.fonts?.ready.then(measure);
  measure();

  return {
    // Las medidas son relativas al viewport con scroll 0: solo valen mientras el hero está a la vista,
    // que es el único momento en que la torcha existe.
    read: () => box,
    dispose: () => ro.disconnect(),
  };
}
