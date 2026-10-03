import * as THREE from 'three/webgpu';
import {
  color,
  float,
  instancedBufferAttribute,
  length,
  mix,
  normalize,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
  sin,
  cos,
} from 'three/tsl';
import type { QualityProfile } from '../../../core/quality';
import type { FrameState, SceneModule } from '../../engine/types';

/**
 * Escena de prueba de la Fase 1: campo de partículas que el puntero aparta.
 *
 * Todo el movimiento se calcula en el vertex shader (TSL) a partir de una
 * posición base y una semilla por instancia. La CPU solo actualiza 3 uniforms
 * por frame: tiempo, posición del puntero y fuerza. Por eso escala a decenas
 * de miles de partículas con 1 draw call.
 *
 * No usa compute shaders a propósito: el backend WebGL2 los emula y no todos
 * los dispositivos lo hacen bien. Para este efecto no hacen falta.
 */

const BOUNDS = { x: 13, y: 8, zNear: 2, zFar: -7 } as const;
const POINTER_RADIUS = 2.4;
// Colores en espacio de pantalla (el motor no convierte la salida): el hex que
// se escribe es el que se ve, igual que en tokens.css.
const screenColor = (hex: number): THREE.Color => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
const CYAN = screenColor(0x00f0ff);
const MAGENTA = screenColor(0xff3daa);

export class ParticleFieldScene implements SceneModule {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  private readonly uTime = uniform(0);
  private readonly uPointer = uniform(new THREE.Vector3(0, 0, 0));
  private readonly uStrength = uniform(0);

  private sprite: THREE.Sprite | null = null;
  private material: THREE.SpriteNodeMaterial | null = null;
  private count = 0;

  // Temporales reutilizados: cero allocations por frame.
  private readonly ray = new THREE.Vector3();
  private readonly pointerTarget = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();

  constructor() {
    this.camera.position.set(0, 0, 10);
  }

  get instanceCount(): number {
    return this.count;
  }

  applyQuality(profile: QualityProfile): void {
    if (profile.particleCount === this.count) return;
    this.disposeParticles();
    this.count = profile.particleCount;
    if (this.count === 0) return;

    // Posiciones base y semillas: se generan una vez por nivel, no por frame.
    const base = new Float32Array(this.count * 3);
    const seeds = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      base[i * 3] = (Math.random() * 2 - 1) * BOUNDS.x;
      base[i * 3 + 1] = (Math.random() * 2 - 1) * BOUNDS.y;
      base[i * 3 + 2] = BOUNDS.zFar + Math.random() * (BOUNDS.zNear - BOUNDS.zFar);
      seeds[i] = Math.random();
    }
    const aBase = instancedBufferAttribute<'vec3'>(new THREE.InstancedBufferAttribute(base, 3), 'vec3');
    const aSeed = instancedBufferAttribute<'float'>(new THREE.InstancedBufferAttribute(seeds, 1), 'float');

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Deriva lenta, desfasada por semilla.
    const t = this.uTime.mul(0.25);
    const drift = vec3(
      sin(t.add(aSeed.mul(6.2832))).mul(0.35),
      cos(t.mul(0.8).add(aSeed.mul(12.566))).mul(0.35),
      float(0),
    );
    const p = aBase.add(drift);

    // Empuje radial desde el puntero (en el plano XY).
    const away = p.xy.sub(this.uPointer.xy);
    const dist = length(away);
    const push = smoothstep(float(POINTER_RADIUS), float(0), dist).mul(this.uStrength);
    const offset = normalize(away.add(vec2(1e-4, 0))).mul(push).mul(1.4);

    material.positionNode = p.add(vec3(offset, float(0)));
    material.scaleNode = mix(float(0.025), float(0.075), aSeed).add(push.mul(0.04));

    // Disco suave, más tenue al fondo, 15 % de las partículas en magenta.
    const r = length(uv().sub(0.5));
    const disc = smoothstep(float(0.5), float(0), r);
    const depthFade = mix(float(0.25), float(1), smoothstep(float(BOUNDS.zFar), float(BOUNDS.zNear), aBase.z));
    material.colorNode = mix(color(CYAN), color(MAGENTA), step(float(0.85), aSeed));
    material.opacityNode = disc.mul(depthFade).mul(0.6).add(push.mul(disc).mul(0.4));

    const sprite = new THREE.Sprite(material);
    // Geometría propia en vez del quad compartido de Sprite: el renderer libera los
    // buffers instanciados de los nodos recién cuando se hace dispose() de la
    // geometría. Con el quad compartido no se podría liberar sin romper otros sprites.
    sprite.geometry = new THREE.PlaneGeometry(1, 1);
    sprite.count = this.count;
    sprite.frustumCulled = false; // las posiciones viven en el shader: el bounding box de CPU no sirve.
    this.scene.add(sprite);
    this.sprite = sprite;
    this.material = material;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update({ time, delta, pointer }: FrameState): void {
    this.uTime.value = time;

    // Proyectar el puntero sobre el plano z = 0.
    this.ray.set(pointer.x, pointer.y, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    const k = -this.camera.position.z / this.ray.z;
    this.pointerTarget.copy(this.camera.position).addScaledVector(this.ray, k);

    // Suavizado exponencial independiente de los FPS: 1 - e^(-λ·dt).
    const follow = 1 - Math.exp(-10 * delta);
    this.uPointer.value.lerp(this.pointerTarget, follow);
    const targetStrength = pointer.active ? 1 : 0;
    this.uStrength.value += (targetStrength - this.uStrength.value) * (1 - Math.exp(-4 * delta));

    // Parallax leve de cámara.
    this.cameraTarget.set(pointer.x * 0.6, pointer.y * 0.4, 10);
    this.camera.position.lerp(this.cameraTarget, 1 - Math.exp(-2 * delta));
    this.camera.lookAt(0, 0, 0);
  }

  dispose(): void {
    this.disposeParticles();
  }

  private disposeParticles(): void {
    if (this.sprite) {
      this.scene.remove(this.sprite);
      this.sprite.geometry.dispose();
    }
    this.material?.dispose();
    this.sprite = null;
    this.material = null;
    this.count = 0;
  }
}
