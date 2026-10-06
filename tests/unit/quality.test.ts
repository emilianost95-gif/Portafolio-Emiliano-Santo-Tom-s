import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialQuality, readOverride } from '../../lib/quality.ts';
import type { Capabilities } from '../../lib/capabilities.ts';

const desktop: Capabilities = {
  backend: 'webgl2', softwareRenderer: false, reducedMotion: false, coarsePointer: false,
  saveData: false, deviceMemory: 8, cores: 8,
};

test('desktop con GPU arranca en medium (high solo se alcanza midiendo)', () => {
  assert.equal(initialQuality(desktop, null), 'medium');
});
test('render por software → estático', () => {
  assert.equal(initialQuality({ ...desktop, softwareRenderer: true }, null), 'static');
});
test('sin GPU o con ahorro de datos → estático', () => {
  assert.equal(initialQuality({ ...desktop, backend: 'none' }, null), 'static');
  assert.equal(initialQuality({ ...desktop, saveData: true }, null), 'static');
});
test('táctil, poca memoria o reduced motion → low', () => {
  assert.equal(initialQuality({ ...desktop, coarsePointer: true }, null), 'low');
  assert.equal(initialQuality({ ...desktop, deviceMemory: 4 }, null), 'low');
  assert.equal(initialQuality({ ...desktop, reducedMotion: true }, null), 'low');
});
test('el override ?gfx= manda siempre (para testing)', () => {
  assert.equal(initialQuality({ ...desktop, softwareRenderer: true }, 'high'), 'high');
  assert.equal(readOverride('?gfx=low'), 'low');
  assert.equal(readOverride('?gfx=ultra'), null);
});
