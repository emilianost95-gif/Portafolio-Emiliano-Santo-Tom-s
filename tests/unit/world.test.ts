// Lógica pura del recorrido, las formaciones y la terminal. Corre con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFormation, FORMATION_IDS } from '../../lib/formations.ts';
import { ORIGIN_STEPS, originStepAt, sampleTrack, scrollToP, SECTION_IDS, TRACK } from '../../lib/track.ts';
import { runCommand, type TerminalContext } from '../../lib/terminal.ts';

test('cada formación devuelve puntos finitos, acotados y repetibles', () => {
  for (const id of FORMATION_IDS) {
    const a = buildFormation(id, 500);
    const b = buildFormation(id, 500);
    assert.equal(a.length, 1500, id);
    assert.deepEqual(a, b, `${id}: misma semilla, mismos puntos`);
    for (const value of a) assert.ok(Number.isFinite(value) && Math.abs(value) < 4, `${id}: ${value}`);
  }
});

test('un prefijo de la formación es la misma formación con menos puntos', () => {
  const full = buildFormation('graph', 400);
  const fewer = buildFormation('graph', 100);
  assert.deepEqual(full.slice(0, 300), fewer);
});

test('las paradas del recorrido están ordenadas y cubren todas las secciones', () => {
  for (let i = 1; i < TRACK.length; i++) assert.ok(TRACK[i]!.p > TRACK[i - 1]!.p);
  assert.ok(TRACK.at(-1)!.p < SECTION_IDS.length);
});

test('en una parada la forma está quieta; a mitad de camino, mezclada', () => {
  const [a, b] = [TRACK[1]!, TRACK[2]!];
  assert.equal(sampleTrack(a.p).mix, 0);
  assert.equal(sampleTrack(a.p).from, a.formation);
  const mid = sampleTrack((a.p + b.p) / 2);
  assert.equal(mid.from, a.formation);
  assert.equal(mid.to, b.formation);
  assert.ok(Math.abs(mid.mix - 0.5) < 1e-9);
});

test('el recorrido es función pura del scroll: ida y vuelta dan lo mismo', () => {
  assert.deepEqual(sampleTrack(2.37), sampleTrack(2.37));
  assert.equal(sampleTrack(-5).from, TRACK[0]!.formation);
  assert.equal(sampleTrack(99).to, TRACK.at(-1)!.formation);
});

test('scroll → p: la sección bajo el centro del viewport', () => {
  const sections = [
    { top: 0, height: 1000 },
    { top: 1000, height: 6000 },
    { top: 7000, height: 1000 },
  ];
  assert.equal(scrollToP(0, 1000, sections), 0.5);
  assert.equal(Math.floor(scrollToP(600, 1000, sections)), 1);
  assert.equal(scrollToP(7000, 1000, sections), 2.5);
  assert.equal(scrollToP(0, 1000, []), 0);
});

test('ORIGIN reparte sus etapas a lo largo de la sección', () => {
  assert.equal(originStepAt(0.4), 0);
  assert.equal(originStepAt(1.01), 0);
  assert.equal(originStepAt(1.5), 3);
  assert.equal(originStepAt(1.99), ORIGIN_STEPS - 1);
  assert.equal(originStepAt(4), ORIGIN_STEPS - 1);
});

const context: TerminalContext = {
  quality: 'high',
  webgl: true,
  deep: false,
  points: 28000,
  dpr: 2,
  projects: [
    { id: 'a', title: 'ALFA', status: 'SYSTEM ONLINE' },
    { id: 'b', title: 'BETA', status: 'DATA PENDING' },
  ],
  stack: ['TypeScript', 'React'],
  experiments: [{ title: 'FLOW FIELD', categories: ['GENERATIVE'] }],
  evolution: ['HARDWARE', 'WEB'],
};

test('terminal: system informa el estado real', () => {
  const { lines } = runCommand('system', context);
  assert.ok(lines.includes('STATUS: ONLINE'));
  assert.ok(lines.includes('WEBGL: ENABLED'));
  assert.ok(lines.includes('MODE: CREATIVE'));
  assert.ok(runCommand('system', { ...context, webgl: false }).lines.some((line) => line.includes('STATIC MODE')));
});

test('terminal: open y goto devuelven acciones; lo inválido, un mensaje', () => {
  assert.deepEqual(runCommand('open 2', context).action, { type: 'open', project: 'b' });
  assert.equal(runCommand('open 9', context).action, undefined);
  assert.deepEqual(runCommand('  GOTO Stack ', context).action, { type: 'goto', section: 'stack' });
  assert.equal(runCommand('goto luna', context).action, undefined);
  assert.match(runCommand('sudo', context).lines[0] ?? '', /desconocido/);
  assert.deepEqual(runCommand('', context).lines, []);
});

test('terminal: help lista todos los comandos del brief', () => {
  const help = runCommand('help', context).lines.join('\n');
  for (const name of ['help', 'about', 'projects', 'stack', 'playground', 'system', 'clear']) assert.ok(help.includes(name), name);
});
