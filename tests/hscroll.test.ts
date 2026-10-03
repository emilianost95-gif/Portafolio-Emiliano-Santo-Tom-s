import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftFor, focusFor } from '../src/ui/hscroll.ts';

test('el desplazamiento es 1 px por px de scroll, limitado a [0, máx]', () => {
  assert.equal(shiftFor(-50, 2000), 0);
  assert.equal(shiftFor(0, 2000), 0);
  assert.equal(shiftFor(730, 2000), 730);
  assert.equal(shiftFor(9999, 2000), 2000);
});
test('reversible: misma posición de scroll → mismo desplazamiento, bajando o subiendo', () => {
  const down = [0, 300, 900, 1500].map((y) => shiftFor(y, 1200));
  const up = [1500, 900, 300, 0].map((y) => shiftFor(y, 1200)).reverse();
  assert.deepEqual(down, up);
});
test('foco: 1 en el centro, baja con la distancia y nunca es negativo', () => {
  assert.equal(focusFor(0, 1400), 1);
  assert.ok(focusFor(300, 1400) < 1 && focusFor(300, 1400) > 0.5);
  assert.equal(focusFor(-300, 1400), focusFor(300, 1400));
  assert.equal(focusFor(5000, 1400), 0);
});
