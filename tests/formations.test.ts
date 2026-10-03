import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFormations, trussSegments, mulberry32, layoutParams } from '../src/graphics/scenes/forge/formations.ts';

test('determinístico: misma semilla → mismas posiciones', () => {
  const a = buildFormations(500, 'wide', 7);
  const b = buildFormations(500, 'wide', 7);
  assert.deepEqual(a.truss, b.truss);
  assert.deepEqual(a.code, b.code);
});

test('tamaños correctos y sin NaN para todos los niveles de calidad', () => {
  for (const n of [2000, 8000, 25000]) {
    const f = buildFormations(n, 'wide');
    for (const arr of [f.sparkVelocity, f.truss, f.code, f.merge, f.field]) {
      assert.equal(arr.length, n * 3);
      assert.ok(arr.every(Number.isFinite));
    }
    assert.equal(f.seeds.length, n);
  }
});

test('las chispas salen hacia arriba (gravedad las baja después)', () => {
  const f = buildFormations(4000, 'wide');
  let up = 0;
  for (let i = 0; i < f.count; i++) if ((f.sparkVelocity[i * 3 + 1] ?? 0) > 0) up++;
  assert.ok(up / f.count > 0.9);
});

test('cámara legible: ninguna formación pasa por delante de z = 3', () => {
  const f = buildFormations(8000, 'wide');
  for (const arr of [f.truss, f.code, f.merge, f.field]) {
    for (let i = 2; i < arr.length; i += 3) assert.ok((arr[i] ?? 0) < 3);
  }
});

test("en 'narrow' las formaciones quedan dentro del ancho visible de un celular", () => {
  const f = buildFormations(8000, 'narrow');
  for (const arr of [f.code, f.merge]) {
    for (let i = 0; i < arr.length; i += 3) assert.ok(Math.abs(arr[i] ?? 0) < 4.5);
  }
});

test('la cercha tiene cordones, montantes y diagonales', () => {
  const segs = trussSegments(10, 1, 1);
  // 4 cordones + 4 montantes × 11 nudos + 4 diagonales × 10 paneles
  assert.equal(segs.length, 4 + 44 + 40);
});

test('mulberry32 queda en [0, 1)', () => {
  const r = mulberry32(3);
  for (let i = 0; i < 10000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('la zona de la torcha no invade el título (mitad izquierda / arriba en escritorio)', () => {
  const { torchBox, sparkOrigin } = layoutParams('wide');
  assert.ok(torchBox.minX >= 2.5, 'no entra en la columna de texto');
  assert.ok(torchBox.maxY <= 0, 'no sube a la altura del título');
  assert.ok(sparkOrigin[0] >= torchBox.minX && sparkOrigin[0] <= torchBox.maxX);
  assert.ok(sparkOrigin[1] >= torchBox.minY && sparkOrigin[1] <= torchBox.maxY);
});

test('en celular la torcha por defecto también queda abajo (el texto va arriba)', () => {
  const { torchBox, sparkOrigin } = layoutParams('narrow');
  assert.ok(torchBox.maxY < 0);
  assert.ok(sparkOrigin[1] >= torchBox.minY && sparkOrigin[1] <= torchBox.maxY);
});
