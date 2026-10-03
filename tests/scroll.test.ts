import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollToTrack, scrollToHeldTrack } from '../src/scroll/track.ts';
import { sampleKeys, smoothstep01, damp, type CameraPose } from '../src/graphics/camera/CameraRig.ts';

const anchors = [0, 1000, 2500, 3000, 4200];

test('el track vale el índice exacto en cada ancla', () => {
  anchors.forEach((a, i) => assert.equal(scrollToTrack(a, anchors), i));
});
test('interpola entre anclas y se limita en los extremos', () => {
  assert.equal(scrollToTrack(500, anchors), 0.5);
  assert.equal(scrollToTrack(1750, anchors), 1.5);
  assert.equal(scrollToTrack(-200, anchors), 0);
  assert.equal(scrollToTrack(99999, anchors), 4);
});
test('reversible: subir y bajar por la misma posición da el mismo valor', () => {
  const down = [0, 800, 1600, 2400, 3200, 4000].map((y) => scrollToTrack(y, anchors));
  const up = [4000, 3200, 2400, 1600, 800, 0].map((y) => scrollToTrack(y, anchors)).reverse();
  assert.deepEqual(down, up);
});
test('monótono: nunca retrocede al bajar (no hay saltos)', () => {
  let prev = -1;
  for (let y = -100; y < 4400; y += 7) {
    const t = scrollToTrack(y, anchors);
    assert.ok(t >= prev, `y=${y}`);
    prev = t;
  }
});
test('continuo: un pixel de scroll nunca mueve el track más de lo esperado', () => {
  let prev = scrollToTrack(0, anchors);
  for (let y = 1; y < 4300; y++) {
    const t = scrollToTrack(y, anchors);
    assert.ok(Math.abs(t - prev) <= 1 / 500 + 1e-9, `salto en y=${y}`); // tramo más corto: 500 px
    prev = t;
  }
});
test('anclas repetidas (secciones de alto 0) no dividen por cero', () => {
  assert.ok(Number.isFinite(scrollToTrack(100, [0, 100, 100, 300])));
});

const keys = [
  { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: 2, y: 0, z: 4 }, target: { x: 0, y: 0, z: -5 } },
  { position: { x: -2, y: 1, z: 6 }, target: { x: 0, y: 0, z: 0 } },
];
const pose = (): CameraPose => ({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } });

test('la cámara pasa exactamente por cada keyframe', () => {
  keys.forEach((k, i) => assert.deepEqual(sampleKeys(keys, i, pose()).position, k.position));
});
test('easing sin saltos en los bordes de cada tramo', () => {
  assert.equal(smoothstep01(0), 0);
  assert.equal(smoothstep01(1), 1);
  assert.equal(smoothstep01(0.5), 0.5);
  const near = sampleKeys(keys, 0.999999, pose()).position.z;
  assert.ok(Math.abs(near - 4) < 1e-3);
});
test('amortiguación independiente de los FPS', () => {
  // 1 frame de 1/30 s ≈ 2 frames de 1/60 s.
  const a = damp(6, 1 / 30);
  const b = 1 - (1 - damp(6, 1 / 60)) ** 2;
  assert.ok(Math.abs(a - b) < 1e-12);
});


const tall = [0, 800, 4800, 5600, 6400]; // proyectos con carrusel: 4000 px

test('meseta en píxeles: la cercha se mantiene durante todo el carrusel', () => {
  assert.equal(scrollToHeldTrack(800, tall, 700), 1);
  assert.equal(scrollToHeldTrack(3000, tall, 700), 1);
  assert.equal(scrollToHeldTrack(4100, tall, 700), 1); // recién a 700 px de la sección siguiente
  assert.ok(Math.abs(scrollToHeldTrack(4450, tall, 700) - 1.5) < 1e-9);
  assert.equal(scrollToHeldTrack(4800, tall, 700), 2);
});
test('meseta en píxeles: en secciones cortas usa como máximo el 40 %', () => {
  // sección de 800 px → ventana de 320 px aunque se pidan 700
  assert.equal(scrollToHeldTrack(400, tall, 700), 0);
  assert.ok(Math.abs(scrollToHeldTrack(640, tall, 700) - 0.5) < 1e-9);
});
test('meseta en píxeles: continua, monótona y reversible', () => {
  let prev = scrollToHeldTrack(0, tall, 700);
  for (let y = 1; y < 6500; y++) {
    const v = scrollToHeldTrack(y, tall, 700);
    assert.ok(v >= prev, `retrocede en ${y}`);
    assert.ok(v - prev <= 1 / 320 + 1e-9, `salto en ${y}`);
    prev = v;
  }
  assert.equal(scrollToHeldTrack(3000, tall, 700), scrollToHeldTrack(3000, tall, 700));
});
