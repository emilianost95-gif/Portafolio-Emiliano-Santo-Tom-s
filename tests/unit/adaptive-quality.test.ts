// Tests de la política de calidad adaptativa. Corren con el test runner nativo de Node
// (type stripping de Node 22.18+): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveQuality } from '../../lib/adaptiveQuality.ts';

type Level = 'static' | 'low' | 'medium' | 'high';
const LEVELS: Level[] = ['static', 'low', 'medium', 'high'];

function run(aq: AdaptiveQuality, frames: number, deltaFor: (i: number) => number, start = 0): number {
  let now = start;
  for (let i = 0; i < frames; i++) {
    const d = deltaFor(i);
    now += d;
    aq.sample(d, now);
  }
  return now;
}

function make(initial: Level, max: Level = 'high') {
  const changes: Level[] = [];
  const aq = new AdaptiveQuality({ levels: LEVELS, initial, max, onChange: (l) => changes.push(l), windowSize: 60, warmupMs: 500, probeMs: 10_000 });
  return { aq, changes };
}

test('sube un nivel si no se pierden frames durante el sondeo', () => {
  const { aq, changes } = make('medium');
  run(aq, 200, () => 16.7);
  assert.equal(aq.current, 'high');
  assert.deepEqual(changes, ['high']);
});

test('respeta el techo (táctil = medium)', () => {
  const { aq } = make('low', 'medium');
  run(aq, 600, () => 16.7);
  assert.equal(aq.current, 'medium');
});

test('baja si se pierden muchos frames y no vuelve a subir', () => {
  const { aq, changes } = make('high');
  let now = run(aq, 85, (i) => (i % 2 ? 40 : 16.7)); // 50 % perdidos en la primera ventana
  assert.equal(aq.current, 'medium');
  now = run(aq, 400, () => 16.7, now); // ahora va perfecto
  assert.equal(aq.current, 'medium', 'histéresis: no oscila');
  assert.deepEqual(changes, ['medium']);
});

test('no sube después de la ventana de sondeo', () => {
  const { aq } = make('low');
  run(aq, 800, () => 16.7); // ~13 s
  assert.equal(aq.current, 'high'); // subió dos veces dentro de los 10 s
  const late = make('low');
  run(late.aq, 1, () => 16.7);
  run(late.aq, 100, () => 16.7, 20_000); // primer sondeo real ya pasados 10 s
  assert.equal(late.aq.current, 'low');
});

test('en low solo pasa a estático si la caída es grave', () => {
  const mild = make('low');
  run(mild.aq, 200, (i) => (i % 3 === 0 ? 40 : 16.7)); // 33 %
  assert.equal(mild.aq.current, 'low');
  const severe = make('low');
  run(severe.aq, 200, (i) => (i % 4 === 0 ? 16.7 : 50)); // 75 %
  assert.equal(severe.aq.current, 'static');
});

test('en 144 Hz baja si la mitad de los frames cae por debajo de 60 FPS', () => {
  const { aq } = make('high');
  const now = run(aq, 85, (i) => (i % 2 ? 25 : 6.94));
  run(aq, 300, () => 6.94, now);
  assert.equal(aq.current, 'medium');
});

test('en 144 Hz NO baja por rendir ~100 FPS (el objetivo es 90–120, no la frecuencia del monitor)', () => {
  const { aq } = make('high');
  run(aq, 300, (i) => (i % 2 ? 13.9 : 6.94));
  assert.equal(aq.current, 'high');
});

// Datos reales medidos en un Acer Nitro (pantalla 180 Hz, Intel UHD, Chrome 154, WebGL2):
// la calidad bajaba a 'low' andando a 177 FPS.
test('regresión: deltas cortos por frames amontonados no bajan la calidad', () => {
  const { aq, changes } = make('medium');
  // 180 Hz con jitter: la mayoría ~5,6 ms, algunos frames amontonados de 2 ms y tirones de 9 ms.
  run(aq, 900, (i) => (i % 10 === 0 ? 2 : i % 10 === 1 ? 9.2 : 5.6));
  assert.ok(!changes.includes('low'), `cambios: ${changes.join(',')}`);
  assert.equal(aq.current, 'high');
});

test('regresión: 180 Hz con 18 % de frames a ~9 ms y 2 % de tirones se queda en high', () => {
  const { aq, changes } = make('high');
  run(aq, 900, (i) => (i % 50 === 0 ? 38 : i % 6 === 0 ? 9.3 : 5.9));
  assert.deepEqual(changes, []);
});

test('si sigue sin dar abasto después de bajar, baja otra vez', () => {
  const { aq, changes } = make('high');
  run(aq, 300, (i) => (i % 2 ? 40 : 16.7));
  assert.deepEqual(changes.slice(0, 2), ['medium', 'low']);
});

test('en un equipo muy lento reacciona por tiempo, sin esperar 90 frames', () => {
  const changes: Level[] = [];
  const aq = new AdaptiveQuality({ levels: LEVELS, initial: 'medium', max: 'high', onChange: (l) => changes.push(l), windowSize: 90, windowMs: 1500, warmupMs: 1000 });
  run(aq, 25, () => 200); // 5 FPS durante 5 s
  assert.ok(changes.length >= 1, 'debería haber bajado en menos de 5 s');
  assert.equal(changes[0], 'low');
});

test('iOS en ahorro de batería (rAF a 30 Hz) no se confunde con frames perdidos', () => {
  const { aq, changes } = make('low', 'medium');
  run(aq, 300, () => 33.3);
  assert.ok(!changes.includes('static'));
  assert.equal(aq.current, 'medium');
});

test('60 Hz con algunos frames amontonados no confunde la pantalla con una de 250 Hz', () => {
  const { aq, changes } = make('medium');
  run(aq, 900, (i) => (i % 25 === 0 ? 2 : i % 25 === 1 ? 31 : 16.7));
  assert.ok(!changes.includes('low'), `cambios: ${changes.join(',')}`);
});

test('en 144 Hz no SUBE si un tercio de los frames anda a ~72 FPS (subir exige margen)', () => {
  const { aq, changes } = make('medium');
  run(aq, 600, (i) => (i % 3 === 0 ? 13.9 : 6.94));
  assert.deepEqual(changes, []);
});
