/**
 * Shaders del Digital Core.
 *
 * Toda la animación ocurre en el vertex shader: la CPU solo actualiza uniforms.
 * Cada partícula tiene cuatro posiciones objetivo (dos del recorrido por scroll,
 * dos de "override" para proyectos) y una semilla que desfasa su viaje, para que
 * el cambio de forma avance como una ola y no como un fundido.
 */

export const coreVertex = /* glsl */ `
  attribute vec3 aTo;
  attribute vec3 aOverA;
  attribute vec3 aOverB;
  attribute vec4 aSeed;

  uniform float uTime;
  uniform float uMix;
  uniform float uOverA;
  uniform float uOverB;
  uniform float uTurbulence;
  uniform float uDeep;
  uniform float uLight;
  uniform float uHeat;
  uniform float uActive;
  uniform float uSize;
  uniform vec3 uPointer;
  uniform float uPointerForce;
  uniform vec3 uPulseOrigin;
  uniform float uPulseAge;

  varying float vHeat;
  varying float vAlpha;

  // Avance propio de cada partícula dentro de una transición 0..1.
  float stagger(float progress, float seed) {
    return smoothstep(seed * 0.45, 0.55 + seed * 0.45, progress);
  }

  void main() {
    float m = stagger(uMix, aSeed.w);
    float a = stagger(uOverA, aSeed.x);
    float b = stagger(uOverB, aSeed.y);

    vec3 p = mix(position, aTo, m);
    p = mix(p, aOverA, a);
    p = mix(p, aOverB, b);

    // En tránsito la partícula se abre hacia afuera: máximo a mitad de camino.
    float transit = sin(m * 3.14159) + sin(a * 3.14159) + sin(b * 3.14159);
    vec3 scatter = aSeed.xyz * 2.0 - 1.0;
    p += scatter * transit * 0.32;

    // Deriva de reposo: barata (tres senos) y distinta por partícula.
    vec3 phase = aSeed.xyz * 40.0 + p.yzx * 3.0;
    p += sin(uTime * vec3(0.6, 0.5, 0.7) + phase) * 0.014 * uTurbulence;

    // DEEP MODE: la forma se cuantiza a una grilla de vóxeles.
    float cell = 0.085;
    p = mix(p, floor(p / cell + 0.5) * cell, uDeep);

    vec4 world = modelMatrix * vec4(p, 1.0);

    // El puntero empuja: campo gaussiano alrededor del punto bajo el cursor.
    vec3 away = world.xyz - uPointer;
    away.z *= 0.4;
    float push = uPointerForce * exp(-dot(away, away) * 2.6);
    world.xyz += normalize(away + 1e-4) * push * 0.42;

    // Pulso: un frente de onda esférico que se expande y se apaga.
    vec3 fromPulse = world.xyz - uPulseOrigin;
    float front = length(fromPulse) - uPulseAge * 3.4;
    float wave = exp(-front * front * 9.0) * max(0.0, 1.0 - uPulseAge * 0.9);
    world.xyz += normalize(fromPulse + 1e-4) * wave * 0.3;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aSeed.z * 0.9) * (1.0 + uDeep * 0.9) / -mv.z;

    // El acento es una señal, no un adorno: marca lo empujado, el pulso y lo activo.
    float marked = step(0.93, aSeed.x) * uActive;
    vHeat = clamp(push * 2.4 + wave * 1.2 + marked + uHeat * (0.35 + aSeed.y * 0.65), 0.0, 1.0);
    float depth = smoothstep(-9.5, -3.5, mv.z);
    vAlpha = uLight * (0.25 + aSeed.w * 0.6) * (0.35 + depth * 0.65) * (1.0 + transit * 0.4 + vHeat) * (1.0 - uDeep * 0.35);
  }
`;

export const coreFragment = /* glsl */ `
  uniform float uDeep;

  varying float vHeat;
  varying float vAlpha;

  void main() {
    // Puntos cuadrados: una partícula es un píxel de instrumento, no una chispa.
    vec2 c = abs(gl_PointCoord - 0.5) * 2.0;
    float edge = max(c.x, c.y);
    // En DEEP MODE cada punto es un marco hueco.
    float shape = mix(1.0, step(0.58, edge), uDeep);
    vec3 chalk = vec3(0.925, 0.92, 0.9);
    vec3 arc = vec3(1.0, 0.55, 0.15);
    gl_FragColor = vec4(mix(chalk, arc, vHeat) * vAlpha * shape, 1.0);
  }
`;
