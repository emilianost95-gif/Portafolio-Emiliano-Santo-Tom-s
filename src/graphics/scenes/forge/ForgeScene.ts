import * as THREE from 'three/webgpu';
import {
  abs,
  clamp,
  color,
  float,
  fract,
  instancedBufferAttribute,
  length,
  mix,
  normalize,
  sin,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { QualityProfile } from '../../../core/quality';
import { damp, sampleKeys, type CameraKey, type CameraPose } from '../../camera/CameraRig';
import type { FrameState, PostSettings, SceneModule } from '../../engine/types';
import type { NdcBox } from '../../../ui/safeArea';
import { buildFormations, layoutParams, type Layout } from './formations';

export interface ForgeOptions {
  /** Zona de pantalla (NDC) donde puede estar la torcha sin tapar texto. La calcula quien conoce el DOM. */
  readonly torchZone?: () => NdcBox | null;
  /** Centro (NDC) de la tarjeta de proyecto activa, o null. Ahí detrás se suelda la cercha. */
  readonly weldTarget?: () => { x: number; y: number } | null;
}

/**
 * Escena "Forja": del metal al código.
 *
 *   track 0 · inicio     → chispas de soldadura (el puntero es la torcha)
 *   track 1 · proyectos  → cercha 3D (estructura)
 *   track 2 · stack      → líneas de código con colores de sintaxis
 *   track 3 · sobre mí   → mitad cercha, mitad código
 *   track 4 · contacto   → campo tranquilo
 *
 * Cada partícula guarda una posición por formación (atributos instanciados) y el
 * vertex shader las mezcla según el scroll, con un desfase por partícula: las
 * chispas vuelan a armar la cercha, la cercha se desarma en código.
 * La CPU solo actualiza uniforms por frame: 1 draw call para todas las partículas.
 */

// Colores en espacio de pantalla (el motor no convierte la salida).
const c = (hex: number): THREE.Color => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
const STEEL = c(0x8fa0b3);
const EMBER = c(0xff6a1a);
const CODE_WHITE = c(0xe4e3dd);
const CHALK = c(0xf4f2ea);
const STEEL_WARM = c(0xff8a3d);
const HOT_WHITE = c(0xfff3d6);
const HOT_ORANGE = c(0xff8c26);
const HOT_RED = c(0x9a1c0c);

const GRAVITY = 9.8;
const POINTER_RADIUS = 2.2;
const CAMERA_FOLLOW = 3.5;
const SPARK_SHARE = 0.35;

const CAMERA_KEYS: Record<Layout, readonly CameraKey[]> = {
  wide: [
    { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } },
    { position: { x: -1.5, y: 1.2, z: 9 }, target: { x: 1.5, y: -0.6, z: -4 } },
    { position: { x: 1.2, y: -0.4, z: 8.6 }, target: { x: 2.6, y: 0, z: -1.5 } },
    { position: { x: -0.8, y: 0.2, z: 9.4 }, target: { x: 3, y: 0, z: -2 } },
    { position: { x: 0, y: 0, z: 12 }, target: { x: 0, y: 0, z: 0 } },
  ],
  narrow: [
    { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } },
    { position: { x: -0.6, y: 1, z: 9.5 }, target: { x: 0.6, y: -0.6, z: -4 } },
    { position: { x: 0.5, y: -0.4, z: 9.5 }, target: { x: 1, y: 0, z: -2 } },
    { position: { x: -0.3, y: 0.2, z: 9.8 }, target: { x: 1.2, y: -0.2, z: -2 } },
    { position: { x: 0, y: 0, z: 12 }, target: { x: 0, y: 0, z: 0 } },
  ],
};

export class ForgeScene implements SceneModule {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  /** Bloom solo con calidad media/alta (lo decide el motor según QualityProfile.postProcessing). */
  readonly post: PostSettings = { bloom: { strength: 0.6, radius: 0.3, threshold: 0.7 } };

  private readonly uTime = uniform(0);
  private readonly uTrack = uniform(0);
  private readonly uPointer = uniform(new THREE.Vector3(99, 99, 0));
  private readonly uStrength = uniform(0);
  private readonly uOrigin = uniform(new THREE.Vector3());
  private readonly uDim = uniform(0.85);
  /** Soldadura en un nudo de la cercha cuando se elige una tarjeta. */
  private readonly uWeldPos = uniform(new THREE.Vector3(0, 0, -100));
  private readonly uWeldAmt = uniform(0);
  /** Muestra reducida de puntos de la cercha para buscar el más cercano en pantalla (≤ 600). */
  private trussSample: Float32Array = new Float32Array(0);
  private readonly weldGoal = new THREE.Vector3();
  private readonly probe = new THREE.Vector3();

  private particles: THREE.Sprite | null = null;
  private material: THREE.SpriteNodeMaterial | null = null;
  private readonly glow: THREE.Sprite;
  private readonly glowMaterial: THREE.SpriteNodeMaterial;
  private readonly uGlow = uniform(1);

  private count = 0;
  private layout: Layout = 'wide';
  private profile: QualityProfile | null = null;

  // Temporales reutilizados: cero allocations por frame.
  private readonly ray = new THREE.Vector3();
  private readonly pointerWorld = new THREE.Vector3();
  private readonly baseOrigin = new THREE.Vector3();
  private readonly originGoal = new THREE.Vector3();
  private readonly lookAt = new THREE.Vector3();
  private readonly pose: CameraPose = { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } };
  private readonly goalPosition = new THREE.Vector3();
  private readonly goalTarget = new THREE.Vector3();

  private readonly opts: ForgeOptions;
  private readonly ndc = new THREE.Vector3();

  constructor(opts: ForgeOptions = {}) {
    this.opts = opts;
    this.camera.position.set(0, 0, 10);

    // "Arco" de soldadura: un halo que es la fuente de luz visible de la escena.
    this.glowMaterial = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const r = length(uv().sub(0.5)).mul(2);
    const halo = smoothstep(float(1), float(0), r).pow(2.5);
    this.glowMaterial.colorNode = mix(color(HOT_ORANGE), color(HOT_WHITE), smoothstep(float(0.6), float(0.05), r));
    this.glowMaterial.opacityNode = halo.mul(this.uGlow);
    this.glow = new THREE.Sprite(this.glowMaterial);
    this.glow.geometry = new THREE.PlaneGeometry(1, 1);
    this.glow.scale.setScalar(0.9);
    this.scene.add(this.glow);
    this.setLayout('wide');
  }

  get instanceCount(): number {
    return this.count;
  }

  applyQuality(profile: QualityProfile): void {
    this.profile = profile;
    if (profile.particleCount !== this.count) this.build(profile.particleCount);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // Celular en vertical: formaciones centradas y más atrás (el texto ocupa todo el ancho).
    const next: Layout = width / height < 0.9 ? 'narrow' : 'wide';
    if (next !== this.layout) {
      this.setLayout(next);
      if (this.profile) this.build(this.profile.particleCount);
    }
  }

  update({ time, delta, pointer, scroll }: FrameState): void {
    this.uTime.value = time;
    this.uTrack.value = scroll.track;
    this.updateCamera(scroll.track, pointer, delta);
    this.updatePointer(pointer, delta);

    const weldPresence = this.updateWeld(scroll.track, delta);

    // El arco existe en el inicio (torcha) y en la cercha cuando se elige una tarjeta.
    // Parpadeo irregular: dos senos desfasados.
    const heroPresence = Math.max(0, 1 - scroll.track * 1.5);
    const presence = Math.max(heroPresence, weldPresence);
    const flicker = 0.82 + 0.12 * Math.sin(time * 37) + 0.06 * Math.sin(time * 91 + 1.3);
    const welding = weldPresence > heroPresence;
    // Soldando detrás de una tarjeta el halo es más grande y fuerte: la tarjeta (78 % opaca)
    // deja pasar solo una parte de la luz.
    this.uGlow.value = presence * flicker * (welding ? 1 : 0.55);
    this.glow.scale.setScalar(welding ? 2.3 : 0.9);
    this.glow.visible = presence > 0.001;
    this.glow.position.copy(welding ? this.uWeldPos.value : this.uOrigin.value);
  }

  dispose(): void {
    this.disposeParticles();
    this.scene.remove(this.glow);
    this.glow.geometry.dispose();
    this.glowMaterial.dispose();
  }

  private setLayout(layout: Layout): void {
    this.layout = layout;
    const [x, y, z] = layoutParams(layout).sparkOrigin;
    this.baseOrigin.set(x, y, z);
    this.uOrigin.value.copy(this.baseOrigin);
    this.uDim.value = layout === 'narrow' ? 0.55 : 0.85;
  }

  private build(count: number): void {
    this.disposeParticles();
    this.count = count;
    if (count === 0) return;

    const f = buildFormations(count, this.layout);
    const stride = Math.max(1, Math.floor(count / 600));
    this.trussSample = new Float32Array(Math.floor(count / stride) * 3);
    for (let i = 0, j = 0; j < this.trussSample.length; i += stride, j += 3) {
      this.trussSample[j] = f.truss[i * 3] ?? 0;
      this.trussSample[j + 1] = f.truss[i * 3 + 1] ?? 0;
      this.trussSample[j + 2] = f.truss[i * 3 + 2] ?? 0;
    }
    const attr3 = (a: Float32Array) => instancedBufferAttribute<'vec3'>(new THREE.InstancedBufferAttribute(a, 3), 'vec3');
    const aSeed = instancedBufferAttribute<'float'>(new THREE.InstancedBufferAttribute(f.seeds, 1), 'float');
    const aVel = attr3(f.sparkVelocity);
    const aTruss = attr3(f.truss);
    const aCode = attr3(f.code);
    const aMerge = attr3(f.merge);
    const aField = attr3(f.field);

    // --- Peso de cada formación según el scroll, desfasado por partícula ---
    // smoothstep(x) + smoothstep(1-x) = 1: los pesos siempre suman 1 entre dos formaciones.
    // El desfase se apaga en los extremos (inicio y contacto): ahí cada sección muestra
    // solo su formación, sin restos de la vecina (visto en pruebas).
    const edge = clamp(this.uTrack.min(float(4).sub(this.uTrack)), float(0), float(1));
    const t = clamp(this.uTrack.add(aSeed.sub(0.5).mul(0.4).mul(edge)), float(0), float(4));
    const w = (k: number) => smoothstep(float(0), float(1), clamp(float(1).sub(abs(t.sub(k))), float(0), float(1)));
    const w0 = w(0);
    const w1 = w(1);
    const w2 = w(2);
    const w3 = w(3);
    const w4 = w(4);

    // --- Chispas: tiro parabólico real, en loop. Cada chispa vive entre 0,7 y 1,6 s ---
    const life = mix(float(0.7), float(1.6), fract(aSeed.mul(7.13)));
    const phase = fract(this.uTime.div(life).add(aSeed.mul(13.7)));
    const age = phase.mul(life);
    const heat = float(1).sub(phase);
    const spark = this.uOrigin.add(aVel.mul(age)).add(vec3(0, age.mul(age).mul(-GRAVITY / 2), 0));

    // --- Posición: mezcla de formaciones + deriva leve en las formaciones quietas ---
    const drift = vec3(
      sin(this.uTime.mul(0.6).add(aSeed.mul(40))).mul(0.04),
      sin(this.uTime.mul(0.5).add(aSeed.mul(25))).mul(0.04),
      float(0),
    );
    const blended = spark
      .mul(w0)
      .add(aTruss.mul(w1))
      .add(aCode.mul(w2))
      .add(aMerge.mul(w3))
      .add(aField.mul(w4))
      .add(drift.mul(float(1).sub(w0)));

    // --- Interacción: el puntero aparta partículas ---
    const away = blended.xy.sub(this.uPointer.xy);
    // En las chispas el puntero es la torcha (mueve el origen), no las aparta.
    const push = smoothstep(float(POINTER_RADIUS), float(0), length(away)).mul(this.uStrength).mul(float(1).sub(w0));
    const position = blended.add(vec3(normalize(away.add(vec2(1e-4, 0))).mul(push).mul(0.9), float(0)));

    // --- Color por formación ---
    const sparkColor = mix(
      mix(color(HOT_RED), color(HOT_ORANGE), smoothstep(float(0), float(0.5), heat)),
      color(HOT_WHITE),
      smoothstep(float(0.65), float(1), heat),
    ).mul(heat.add(0.5)); // hasta 1,5 al nacer: lo justo para que el bloom tome solo las chispas jóvenes
    const trussColor = mix(color(STEEL), color(CODE_WHITE), step(float(0.9), aSeed)).mul(0.9);
    const codeColor = mix(
      mix(mix(color(STEEL), color(EMBER), step(float(0.45), aSeed)), color(CODE_WHITE), step(float(0.65), aSeed)),
      color(CHALK),
      step(float(0.9), aSeed),
    );
    const mergeColor = mix(color(STEEL_WARM).mul(0.85), codeColor, step(float(0.5), aSeed));
    const fieldColor = mix(color(STEEL), color(EMBER), step(float(0.85), aSeed));
    const finalColor = sparkColor
      .mul(w0)
      .add(trussColor.mul(w1))
      .add(codeColor.mul(w2))
      .add(mergeColor.mul(w3))
      .add(fieldColor.mul(w4));

    // --- Opacidad y tamaño ---
    const disc = smoothstep(float(0.5), float(0), length(uv().sub(0.5)));
    // Solo el 35 % de las partículas son chispas; el resto aparece en la transición a la cercha.
    // Con todas encendidas (25.000 en 'high') el arco era una mancha blanca que tapaba el título.
    const isSpark = step(aSeed, float(SPARK_SHARE));
    const sparkAlpha = smoothstep(float(0), float(0.18), heat).mul(isSpark).mul(0.8);
    // "Sobre mí" es la sección con más texto a lo ancho: su formación va más tenue.
    const alpha = sparkAlpha
      .mul(w0)
      .add(w1.mul(0.7))
      .add(w2.mul(0.85))
      .add(w3.mul(0.55))
      .add(w4.mul(0.4));
    const size = mix(float(0.03), float(0.08), aSeed)
      .mul(heat.mul(0.8).add(0.4))
      .mul(isSpark)
      .mul(w0)
      .add(w1.mul(0.034))
      .add(w2.mul(0.046))
      .add(w3.mul(0.04))
      .add(mix(float(0.025), float(0.06), aSeed).mul(w4));

    // --- Soldadura en el nudo de la tarjeta activa (solo existe en la formación de la cercha) ---
    const weld = smoothstep(float(1.5), float(0), length(aTruss.sub(this.uWeldPos))).mul(this.uWeldAmt).mul(w1);
    const weldColor = mix(color(HOT_ORANGE), color(HOT_WHITE), smoothstep(float(0.55), float(1), weld)).mul(1.4);
    // Vibración mínima: el metal "hierve" bajo el arco.
    const shimmer = vec3(sin(this.uTime.mul(53).add(aSeed.mul(97))), sin(this.uTime.mul(47).add(aSeed.mul(71))), float(0)).mul(weld.mul(0.025));

    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    material.positionNode = position.add(shimmer);
    material.scaleNode = size.add(push.mul(0.03)).add(weld.mul(0.035));
    material.colorNode = mix(finalColor, weldColor, weld);
    material.opacityNode = disc.mul(alpha.add(weld.mul(0.7))).mul(this.uDim).add(push.mul(disc).mul(0.3));

    const sprite = new THREE.Sprite(material);
    // Geometría propia: el renderer libera los buffers instanciados recién al hacer dispose de la geometría.
    sprite.geometry = new THREE.PlaneGeometry(1, 1);
    sprite.count = count;
    sprite.frustumCulled = false; // las posiciones viven en el shader
    this.scene.add(sprite);
    this.particles = sprite;
    this.material = material;
  }

  private updateCamera(track: number, pointer: FrameState['pointer'], delta: number): void {
    sampleKeys(CAMERA_KEYS[this.layout], track, this.pose);
    const { position: p, target: t } = this.pose;
    this.goalPosition.set(p.x + pointer.x * 0.5, p.y + pointer.y * 0.35, p.z);
    this.goalTarget.set(t.x, t.y, t.z);
    const k = delta > 0 ? damp(CAMERA_FOLLOW, delta) : 1;
    this.camera.position.lerp(this.goalPosition, k);
    this.lookAt.lerp(this.goalTarget, k);
    this.camera.lookAt(this.lookAt);
    this.camera.updateMatrixWorld();
  }

  /**
   * Proyecta el puntero sobre el plano z = 0. En el inicio, el origen de las
   * chispas lo sigue: el visitante "suelda" donde apunta.
   */
  private updatePointer(pointer: FrameState['pointer'], delta: number): void {
    this.ray.set(pointer.x, pointer.y, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    if (this.ray.z < -0.05) {
      const k = -this.camera.position.z / this.ray.z;
      this.pointerWorld.copy(this.camera.position).addScaledVector(this.ray, k);
    }
    const strengthGoal = pointer.active ? 1 : 0;
    const k = delta > 0 ? damp(4, delta) : 1;
    this.uStrength.value += (strengthGoal - this.uStrength.value) * k;
    this.uPointer.value.lerp(this.pointerWorld, delta > 0 ? damp(10, delta) : 1);

    this.originGoal.copy(this.baseOrigin).lerp(this.pointerWorld, this.uStrength.value * 0.85);
    const box = layoutParams(this.layout).torchBox;
    this.originGoal.x = Math.min(box.maxX, Math.max(box.minX, this.originGoal.x));
    this.originGoal.y = Math.min(box.maxY, Math.max(box.minY, this.originGoal.y));
    this.clampToScreenZone(this.originGoal);
    this.uOrigin.value.lerp(this.originGoal, delta > 0 ? damp(8, delta) : 1);
    // El origen arranca en baseOrigin sin pasar por la zona: si el viewport es raro, se corrige acá.
    if (delta === 0) this.uOrigin.value.copy(this.originGoal);
  }

  /**
   * La soldadura se desliza por la cercha hacia el nudo de la tarjeta activa
   * (no salta) y se apaga suave al soltarla. Devuelve su presencia visible (0..1).
   */
  private updateWeld(track: number, delta: number): number {
    const target = this.opts.weldTarget?.() ?? null;
    const has = target !== null && this.findNearestOnScreen(target.x, target.y, this.weldGoal);
    if (has) {
      // Primera vez: aparece en el nudo; después, viaja.
      if (this.uWeldAmt.value < 0.01) this.uWeldPos.value.copy(this.weldGoal);
      else this.uWeldPos.value.lerp(this.weldGoal, delta > 0 ? damp(9, delta) : 1);
    }
    const goal = has ? 1 : 0;
    this.uWeldAmt.value += (goal - this.uWeldAmt.value) * (delta > 0 ? damp(has ? 10 : 4, delta) : 1);
    // Solo se ve cerca de la sección de proyectos (track ≈ 1).
    const nearTruss = Math.max(0, 1 - Math.abs(track - 1) * 2);
    return this.uWeldAmt.value * nearTruss;
  }

  /**
   * Punto de la cercha cuya proyección en pantalla queda más cerca de (x, y) en NDC.
   * Recorre una muestra de ≤ 600 puntos: ~0,05 ms por frame, y solo con una tarjeta activa.
   */
  private findNearestOnScreen(x: number, y: number, out: THREE.Vector3): boolean {
    const pts = this.trussSample;
    let best = Infinity;
    let bi = -1;
    const aspect = this.camera.aspect;
    for (let j = 0; j < pts.length; j += 3) {
      this.probe.set(pts[j] ?? 0, pts[j + 1] ?? 0, pts[j + 2] ?? 0).project(this.camera);
      if (this.probe.z > 1) continue; // detrás de la cámara
      const dx = (this.probe.x - x) * aspect; // distancia en proporción real de pantalla
      const dy = this.probe.y - y;
      const d = dx * dx + dy * dy;
      if (d < best) {
        best = d;
        bi = j;
      }
    }
    if (bi < 0) return false;
    out.set(pts[bi] ?? 0, pts[bi + 1] ?? 0, pts[bi + 2] ?? 0);
    return true;
  }

  /**
   * Segundo límite, en pantalla: proyecta el origen a NDC, lo encierra en la zona
   * libre de texto medida en el DOM y lo vuelve a llevar al plano z = 0.
   */
  private clampToScreenZone(point: THREE.Vector3): void {
    const zone = this.opts.torchZone?.();
    if (!zone || zone.minX >= zone.maxX || zone.minY >= zone.maxY) return;
    this.ndc.copy(point).project(this.camera);
    const x = Math.min(zone.maxX, Math.max(zone.minX, this.ndc.x));
    const y = Math.min(zone.maxY, Math.max(zone.minY, this.ndc.y));
    if (x === this.ndc.x && y === this.ndc.y) return;
    this.ray.set(x, y, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    if (this.ray.z >= -0.05) return;
    const k = (point.z - this.camera.position.z) / this.ray.z;
    point.copy(this.camera.position).addScaledVector(this.ray, k);
  }

  private disposeParticles(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
    }
    this.material?.dispose();
    this.particles = null;
    this.material = null;
    this.count = 0;
  }
}
