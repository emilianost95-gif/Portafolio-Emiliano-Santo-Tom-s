'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  MathUtils,
  type PerspectiveCamera,
  ShaderMaterial,
  Vector3,
} from 'three';
import { findProject } from '@/data/projects';
import { buildFormation, FORMATION_IDS, type FormationId, mulberry32 } from '@/lib/formations';
import { QUALITY_PROFILES } from '@/lib/quality';
import { useSystem } from '@/lib/store';
import { sampleTrack } from '@/lib/track';
import { world } from '@/lib/world';
import { coreFragment, coreVertex } from '@/shaders/core';

const MAX_POINTS = QUALITY_PROFILES.high.particleCount;
const FOV = 35;

const BACKGROUND = {
  base: new Color('#0e0f11'),
  system: new Color('#12100d'),
  deep: new Color('#08090b'),
  forge: new Color('#150c05'),
};

interface OverrideSlot {
  readonly attribute: 'aOverA' | 'aOverB';
  readonly uniform: 'uOverA' | 'uOverB';
  formation: FormationId | null;
  weight: number;
}

/**
 * El Digital Core: una sola nube de puntos (un draw call) que cambia de forma.
 * El scroll elige entre qué dos formaciones está; un proyecto puede imponer la suya.
 */
export function Core() {
  const group = useRef<Group>(null);
  const { gl, scene } = useThree();

  const { geometry, material, attributeFor } = useMemo(() => {
    const cache = new Map<FormationId, BufferAttribute>();
    const attributeFor = (id: FormationId): BufferAttribute => {
      let attribute = cache.get(id);
      if (!attribute) {
        attribute = new BufferAttribute(buildFormation(id, MAX_POINTS), 3);
        cache.set(id, attribute);
      }
      return attribute;
    };

    const rng = mulberry32(1995);
    const seeds = new Float32Array(MAX_POINTS * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rng();

    const geometry = new BufferGeometry();
    const start = attributeFor('core');
    geometry.setAttribute('position', start);
    geometry.setAttribute('aTo', start);
    geometry.setAttribute('aOverA', start);
    geometry.setAttribute('aOverB', start);
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4));

    const material = new ShaderMaterial({
      vertexShader: coreVertex,
      fragmentShader: coreFragment,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uOverA: { value: 0 },
        uOverB: { value: 0 },
        uTurbulence: { value: 1 },
        uDeep: { value: 0 },
        uLight: { value: 0 },
        uHeat: { value: 0 },
        uActive: { value: 0 },
        uSize: { value: 1 },
        uPointer: { value: new Vector3(0, 0, 50) },
        uPointerForce: { value: 0 },
        uPulseOrigin: { value: new Vector3() },
        uPulseAge: { value: 100 },
      },
    });
    return { geometry, material, attributeFor };
  }, []);

  // Las formaciones que faltan se generan en tiempo libre: el primer scroll no las espera.
  useEffect(() => {
    let index = 0;
    let handle = 0;
    const next = () => {
      const id = FORMATION_IDS[index++];
      if (!id) return;
      attributeFor(id);
      handle = window.setTimeout(next, 60);
    };
    handle = window.setTimeout(next, 400);
    return () => window.clearTimeout(handle);
  }, [attributeFor]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const quality = useSystem((state) => state.quality);
  const points = QUALITY_PROFILES[quality ?? 'low'].particleCount;
  useEffect(() => {
    geometry.setDrawRange(0, points);
    world.stats.points = points;
  }, [geometry, points]);

  const live = useRef({
    from: 'core' as FormationId,
    to: 'core' as FormationId,
    slots: [
      { attribute: 'aOverA', uniform: 'uOverA', formation: null, weight: 0 },
      { attribute: 'aOverB', uniform: 'uOverB', formation: null, weight: 0 },
    ] as [OverrideSlot, OverrideSlot],
    activeSlot: 0,
    angle: 0,
    pointer: new Vector3(),
    seenPulse: world.pulseAt,
    background: BACKGROUND.base.clone(),
    lastHover: false,
  });

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const system = useSystem.getState();
    const uniforms = material.uniforms as Record<string, { value: number }>;
    const now = live.current;
    const camera = state.camera as PerspectiveCamera;
    const motion = system.reducedMotion ? 0.15 : 1;
    const sample = sampleTrack(world.p);

    // Recorrido por scroll: solo se reasignan atributos cuando cambia el tramo.
    if (sample.from !== now.from) {
      geometry.setAttribute('position', attributeFor(sample.from));
      now.from = sample.from;
    }
    if (sample.to !== now.to) {
      geometry.setAttribute('aTo', attributeFor(sample.to));
      now.to = sample.to;
    }
    uniforms.uMix!.value = sample.mix;

    // Override de proyecto: dos ranuras que se relevan, para pasar de A a B sin saltos.
    const project = findProject(system.activeProject ?? system.hoverProject);
    const wanted = project?.visual.formation ?? null;
    const active = now.slots[now.activeSlot]!;
    if (wanted && wanted !== active.formation) {
      now.activeSlot = now.activeSlot === 0 ? 1 : 0;
      const slot = now.slots[now.activeSlot]!;
      slot.formation = wanted;
      geometry.setAttribute(slot.attribute, attributeFor(wanted));
    }
    now.slots.forEach((slot, index) => {
      const target = wanted !== null && index === now.activeSlot ? 1 : 0;
      slot.weight = MathUtils.damp(slot.weight, target, target ? 3.2 : 4.5, delta);
      if (slot.weight < 0.001 && target === 0) slot.formation = null;
      uniforms[slot.uniform]!.value = slot.weight;
    });

    // Encuadre: el núcleo se corre para dejarle lugar al texto; en vertical se centra.
    const open = system.activeProject !== null;
    const distance = sample.distance - (system.deep ? 0.9 : 0) - (open ? 0.5 : 0);
    const portrait = camera.aspect < 0.9;
    const visibleHeight = 2 * Math.tan(MathUtils.degToRad(FOV / 2)) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    const targetX = portrait ? 0 : (open ? -0.23 : sample.x) * visibleWidth;
    const targetY = (portrait ? 0.14 : sample.y) * visibleHeight;
    const fit = Math.min(1, camera.aspect * 0.95);
    const targetScale = (open ? 1 : sample.scale) * fit;

    const body = group.current;
    if (body) {
      body.position.x = MathUtils.damp(body.position.x, targetX, 3, delta);
      body.position.y = MathUtils.damp(body.position.y, targetY, 3, delta);
      body.scale.setScalar(MathUtils.damp(body.scale.x, targetScale, 3, delta));

      // Las formaciones planas no giran: vuelven a mirar a cámara y se mecen.
      const spin = wanted ? 0 : sample.spin;
      now.angle += spin * motion * delta;
      const facing = Math.round(now.angle / (Math.PI * 2)) * Math.PI * 2;
      now.angle = MathUtils.damp(now.angle, facing, (1 - Math.min(1, spin / 0.1)) * 2.5, delta);
      const sway = Math.sin(state.clock.elapsedTime * 0.3) * 0.16 * motion;
      body.rotation.y = now.angle + sway + world.pointer.x * 0.22 * motion;
      body.rotation.x = MathUtils.damp(body.rotation.x, -(wanted ? 0.15 : sample.tilt) - world.pointer.y * 0.12 * motion, 3, delta);
    }

    camera.position.x = MathUtils.damp(camera.position.x, world.pointer.x * 0.3 * motion, 2.5, delta);
    camera.position.y = MathUtils.damp(camera.position.y, world.pointer.y * 0.2 * motion, 2.5, delta);
    camera.position.z = MathUtils.damp(camera.position.z, distance, 2.5, delta);
    camera.lookAt(0, 0, 0);

    // Punto del plano z=0 que está bajo el puntero.
    now.pointer.set(world.pointer.x, world.pointer.y, 0.5).unproject(camera).sub(camera.position);
    const reach = -camera.position.z / now.pointer.z;
    now.pointer.multiplyScalar(reach).add(camera.position);
    (material.uniforms.uPointer!.value as Vector3).copy(now.pointer);

    world.pointer.speed = MathUtils.damp(world.pointer.speed, 0, 4, delta);
    const usesPointer = world.pointer.seen && !system.coarsePointer && !system.reducedMotion;
    const force = usesPointer ? 0.45 + Math.min(1.4, world.pointer.speed * 0.9) : 0;
    uniforms.uPointerForce!.value = MathUtils.damp(uniforms.uPointerForce!.value, force, 5, delta);

    if (body && usesPointer) {
      const hovering = !open && sample.light > 0.5 && now.pointer.distanceTo(body.position) < 1.25 * body.scale.x;
      if (hovering !== now.lastHover) {
        now.lastHover = hovering;
        system.set({ coreHover: hovering });
      }
    }

    if (world.pulseAt !== now.seenPulse) {
      now.seenPulse = world.pulseAt;
      (material.uniforms.uPulseOrigin!.value as Vector3).copy(usesPointer ? now.pointer : (body?.position ?? now.pointer));
    }
    uniforms.uPulseAge!.value = system.reducedMotion ? 100 : (performance.now() - world.pulseAt) / 1000;

    const engaged = system.coreHover || system.hoverProject !== null || open;
    uniforms.uTime!.value = state.clock.elapsedTime;
    uniforms.uTurbulence!.value = MathUtils.damp(uniforms.uTurbulence!.value, (engaged ? 2.2 : 1) * motion, 3, delta);
    uniforms.uDeep!.value = MathUtils.damp(uniforms.uDeep!.value, system.deep ? 1 : 0, 4, delta);
    uniforms.uHeat!.value = MathUtils.damp(uniforms.uHeat!.value, system.forge ? 1 : 0, 2.5, delta);
    uniforms.uActive!.value = MathUtils.damp(uniforms.uActive!.value, engaged ? 1 : 0, 5, delta);
    // En vertical el núcleo queda detrás del texto: cuando no es el protagonista, se apaga más.
    const ambient = portrait && sample.light < 1 ? sample.light * 0.35 : sample.light;
    const light = !system.introDone ? 0 : open || system.hoverProject ? 1 : system.terminalOpen ? ambient * 0.5 : ambient;
    uniforms.uLight!.value = MathUtils.damp(uniforms.uLight!.value, light, 2.2, delta);
    // Menos puntos → puntos apenas más grandes, para conservar la densidad percibida.
    // El tamaño acompaña la escala en pantallas angostas: si no, los puntos se empastan.
    uniforms.uSize!.value = gl.domElement.height * 0.0135 * Math.pow(MAX_POINTS / points, 0.3) * Math.max(0.5, fit);

    const target = system.forge ? BACKGROUND.forge : system.deep ? BACKGROUND.deep : open ? BACKGROUND.system : BACKGROUND.base;
    now.background.lerp(target, 1 - Math.exp(-3 * delta));
    scene.background = now.background;
  });

  return (
    <group ref={group}>
      {/* La figura cambia en el shader: los límites calculados en CPU no sirven para descartarla. */}
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
