import { trackPointer } from '@/lib/canvas';

const VERTEX = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
  precision highp float;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.02 + 17.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec2 pull = uv - uPointer;
    // Ruido deformado por ruido, dos veces: q deforma a r, r deforma el resultado.
    vec2 q = vec2(fbm(uv * 2.4 + uTime * 0.07), fbm(uv * 2.4 + 5.2 - uTime * 0.05));
    vec2 r = vec2(fbm(uv * 2.0 + q * 3.2 + pull * 1.4), fbm(uv * 2.0 + q * 3.2 + 8.3));
    float f = fbm(uv * 2.2 + r * 2.6);
    // Curvas de nivel: el campo se lee como un plano topográfico.
    float lines = smoothstep(0.36, 0.47, abs(fract(f * 7.0) - 0.5));
    vec3 chalk = vec3(0.925, 0.92, 0.9);
    vec3 arc = vec3(1.0, 0.55, 0.15);
    vec3 color = mix(vec3(0.055, 0.059, 0.067), chalk, lines * (0.25 + f * 0.75));
    color = mix(color, arc, lines * smoothstep(0.38, 0.0, length(pull)));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Un fragment shader a pantalla completa en WebGL puro: sin Three.js, un triángulo y un programa. */
export function mount(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return () => undefined;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!vertex || !fragment || !program || !buffer) return () => undefined;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uPointer = gl.getUniformLocation(program, 'uPointer');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const tracked = trackPointer(canvas);

  const fit = () => {
    // Media resolución: el ruido no tiene detalle fino y el costo por píxel es alto.
    const scale = Math.min(1.5, window.devicePixelRatio || 1) * 0.6;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);
  fit();

  let frame = 0;
  const pointer = { x: 0, y: 0 };
  const loop = (now: number) => {
    const { clientWidth: width, clientHeight: height } = canvas;
    const targetX = tracked.pointer.inside ? (tracked.pointer.x - width / 2) / height : 0;
    const targetY = tracked.pointer.inside ? (height / 2 - tracked.pointer.y) / height : 0;
    pointer.x += (targetX - pointer.x) * 0.08;
    pointer.y += (targetY - pointer.y) * 0.08;
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform1f(uTime, now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    tracked.dispose();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.clearColor(0.055, 0.059, 0.067, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };
}
