# Portfolio — Emiliano Santo Tomás

Portfolio interactivo construido por fases.

- **Fase 0:** base semántica completa, SEO y accesibilidad, sin 3D.
- **Fase 1 (actual):** motor gráfico — Three.js (WebGPU con fallback a WebGL2), calidad adaptativa medida,
  fallback en tiempo de ejecución, monitor de rendimiento y una escena de prueba.

El contenido funciona y se entiende sin el 3D; el 3D se suma encima.

## Comandos

```bash
npm install
npm run dev         # servidor local
npm run build       # typecheck + build de producción en dist/
npm run preview     # sirve dist/ para probarlo como en producción
npm test            # tests de la lógica de calidad y detección (runner nativo de Node 22.18+)
```

### Parámetros de prueba (funcionan también en producción)

| Parámetro | Qué hace |
|---|---|
| `?debug` | Muestra el monitor: FPS, frame time, draw calls, triángulos, instancias, geometrías/texturas, DPR, heap. Expone `window.__engine` |
| `?gfx=static\|low\|medium\|high` | Fija el nivel de calidad (desactiva el ajuste automático) |
| `?backend=webgl2` | Simula un navegador sin WebGPU |
| `?backend=none` | Simula un dispositivo sin GPU |

Ejemplo: `?debug&gfx=high&backend=webgl2`.

## Configuración

- `.env` → `VITE_SITE_URL` (con `/` final). Es la única fuente de la URL pública: alimenta canonical,
  Open Graph, `sitemap.xml` y `robots.txt` (estos dos se generan en el build).
- `public/og-image.png` se regenera con `node scripts/og-image.mjs` (necesita `playwright`).

## Arquitectura

```text
index.html              Todo el contenido (SEO + lectores de pantalla). El 3D nunca es la fuente del contenido.
src/
  main.ts               Orden de carga: contenido → UI → (idle) capacidades → (si corresponde) capa gráfica
  core/
    capabilities.ts     Detecta WebGPU (pidiendo adaptador real) → WebGL2 → ninguno; reduced motion; save-data
    quality.ts          QualityProfile tipado: static | low | medium | high, y override ?gfx=
  ui/
    nav.ts              Sección activa en la navegación (aria-current)
  graphics/             Chunk separado vía import(): si el modo es 'static' no se descarga nada de esto
    index.ts            Arranque + cadena de fallback en tiempo de ejecución (WebGPU → WebGL2 → estático)
    engine/
      Engine.ts         Dueño único de renderer, canvas, loop por delta, resize y chequeo de salud
      AdaptiveQuality.ts Sube/baja de nivel según frames PERDIDOS (no FPS), con histéresis
      Pointer.ts        Mouse y touch normalizados, listener pasivo
      types.ts          Contrato SceneModule: applyQuality / resize / update / dispose
    scenes/
      particle-field/   Escena de prueba: partículas animadas 100 % en el vertex shader (TSL)
    debug/
      StatsOverlay.ts   Monitor de rendimiento (chunk aparte, solo con ?debug)
tests/                  Tests de AdaptiveQuality, initialQuality y detección de render por software
  styles/
    tokens.css          Colores, tipografía, espaciado, movimiento (una sola fuente)
    base.css · layout.css · components.css
vite.config.ts          Plugin que genera robots.txt y sitemap.xml desde VITE_SITE_URL
```

Cadena de fallback (punto 4), en dos momentos:

```text
Detección (antes de descargar Three):
  sin GPU / render por software / ahorro de datos ─► estático (no se descarga el 3D)
Ejecución (con el 3D ya corriendo):
  WebGPU falla al iniciar o al dibujar ─► reinicia en WebGL2
  WebGL2 falla, o pierde demasiados frames en 'low' ─► estático
```

## Checklist — Fase 0

### IMPLEMENTADO
- [x] Proyecto Vite + TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- [x] HTML semántico: header, nav, main, section, article, footer; jerarquía h1 → h2 → h3 → h4
- [x] Proyectos con estructura Problema → Enfoque → Implementación → Resultado + tecnologías
- [x] Separación honesta: productos propios vs. clientes reales
- [x] SEO: title, description, canonical, Open Graph + imagen 1200×630, JSON-LD `Person`, sitemap, robots
- [x] Detección de capacidades y nivel de calidad inicial (conservador)
- [x] Capa gráfica preparada como chunk lazy
- [x] Skip link, foco visible, aria-current en navegación, objetivos táctiles ≥ 44px

### PERFORMANCE (Lighthouse, build de producción)
- Performance / Accessibility / Best Practices / SEO: **100 / 100 / 100 / 100** (desktop y móvil)
- LCP: 0,3 s desktop · 1,4 s móvil (throttling simulado) · CLS 0 · TBT 0 ms
- Peso total transferido: **~56 KiB** (JS ~2 KiB gzip, CSS ~3 KiB gzip, fuentes woff2)
- Draw calls: 0 (sin 3D todavía)
- FPS: no aplica en esta fase

### ACCESSIBILITY
- [x] Keyboard (skip link → `main`, orden de tab lógico)
- [x] Reduced motion (sin scroll suave ni transiciones; calidad gráfica baja)
- [x] Screen reader (axe-core: 0 violaciones en desktop, móvil y reduced motion)
- [x] Touch (sin overflow horizontal a 390px, objetivos ≥ 44px)

### COMPATIBILITY
- [x] Detección WebGPU / WebGL2 (verificada en Chromium headless)
- [ ] Firefox, Safari iOS y Chrome Android reales — pendiente de probar en dispositivos
- [x] Mobile (390px) · [x] Desktop (1440px)

### CÓDIGO
- [x] TypeScript · [x] Sin errores de consola · [x] Módulos con una responsabilidad
- [x] Dependencias de runtime: solo 2 paquetes de fuentes autoalojadas

### PENDIENTES
- Confirmar `VITE_SITE_URL` definitiva (repo o dominio)
- Verificar URLs de repos/demos marcadas con `PENDIENTE` en `index.html`
- Completar: problema de OA Manager con palabras propias, estado real de Registro Geriátrico,
  tarjeta de Santa Cecilia Construcciones
- Capturas reales de cada proyecto (formato AVIF/WebP)

### DECISIONES TÉCNICAS
- **Sin React.** El contenido es estático y el 3D vive en un loop propio; React solo sumaría una capa de
  reconciliación entre el scroll y el render.
- **Contenido en HTML, no en JS.** Indexable, legible sin JS y es la "experiencia estática" del fallback.
- **Header sin `backdrop-filter`.** Con un canvas animado detrás, el blur se recalcula cada frame.
- **3 niveles de calidad, no 4.** Un cuarto nivel se agrega si una escena real lo justifica.
- **Calidad inicial conservadora.** Subir de nivel midiendo es invisible; bajar en mitad del scroll se nota.
- **WebGPU detectado pidiendo un adaptador**, no solo mirando `navigator.gpu`.


---

## Checklist — Fase 1 (motor)

### IMPLEMENTADO
- [x] `Engine`: un solo renderer y canvas, loop por delta (con tope de 100 ms), resize agrupado por frame
- [x] Contrato `SceneModule` → una escena se reemplaza sin tocar el motor
- [x] `WebGPURenderer` de Three.js con `forceWebGL` cuando la detección no encontró WebGPU
- [x] Fallback en tiempo de ejecución: excepción al dibujar, dispositivo perdido o "0 draw calls a los 30 frames" → siguiente backend
- [x] Detección de render por software (SwiftShader, llvmpipe, Basic Render Driver) → estático sin descargar Three
- [x] `AdaptiveQuality`: sondeo hacia arriba los primeros 10 s, baja en cualquier momento, no oscila
- [x] Niveles con cambios reales: partículas 2.000 / 8.000 / 25.000, tope de DPR 1 / 1,5 / 2, renderScale 0,75 / 1 / 1
- [x] Escena de prueba: partículas que el puntero aparta (mouse y touch) + parallax de cámara
- [x] Reduced motion: un único cuadro fijo, sin loop ni interacción
- [x] Monitor `?debug` en chunk aparte
- [x] 21 tests

### PERFORMANCE
- Draw calls: **1** por frame (era 2 antes de sacar la pasada de conversión sRGB)
- Triángulos: 2 por partícula (4.000 / 16.000 / 50.000 según nivel)
- Texturas: **0** (antes había 2 del framebuffer intermedio)
- JS: chunk de Three **891 KB (245 KB gzip)**, cargado de forma diferida; la carga inicial sigue en ~56 KiB
- Lighthouse en un equipo sin GPU (no descarga el 3D): 100 / 100 / 100 / 100, TBT 0 ms
- Evaluación del chunk de Three medida: ~265 ms en desktop y ~470 ms en móvil simulado
- FPS en GPU real: ~179 (tope de la pantalla de 180 Hz) en `high` con WebGPU — ver Mediciones
- Memory leaks: 240 cambios de nivel seguidos → geometrías estables en 1; heap oscila 4,7–9,1 MB sin crecer

### ACCESSIBILITY
- [x] Keyboard (el canvas no recibe foco ni bloquea clics: `pointer-events: none`, `aria-hidden`)
- [x] Reduced motion (cuadro fijo)
- [x] Screen reader (axe: 0 violaciones)
- [x] Touch (el puntero funciona con el dedo; techo de calidad 'medium' en táctiles)

### COMPATIBILITY
- [x] WebGL2 — verificado dibujando (1 draw call, sin errores)
- [x] WebGPU — verificado dibujando en Chrome 154 (Intel UHD). En Chromium 141 falla y cae a WebGL2: también verificado
- [ ] Firefox, Safari iOS y Chrome Android reales — pendiente

### CÓDIGO
- [x] TypeScript estricto · [x] sin errores de consola propios · [x] módulos con una responsabilidad
- [x] Una dependencia nueva: `three`

### PROBLEMAS ENCONTRADOS Y RESUELTOS
1. **El backend WebGPU de Three r186 falla en Chromium 141** (`createView` con `swizzle`): no dibujaba nada.
   → Fallback en caliente a WebGL2 y chequeo de "0 draw calls".
2. **Con frames de 200 ms la calidad adaptativa tardaba ~18 s en reaccionar** (la ventana se cerraba por cantidad de frames).
   → La ventana también se cierra por tiempo (1,5 s).
3. **Un equipo que nunca baja de 200 ms "parecía" un monitor de 5 Hz y la calidad SUBÍA.** Lo encontró un test.
   → El intervalo de refresco estimado tiene un techo de 34 ms (30 Hz, por iOS en ahorro de batería).
4. **Pasada extra de conversión sRGB:** +1 draw call y un framebuffer half-float por frame.
   → Salida lineal y colores definidos en espacio de pantalla. Resultado: 1 draw call y casi 3× FPS con render por software.
5. **Render por software → la página quedaba trabada 3–5 s** (TBT 1,8 s en desktop y 5,4 s en móvil) hasta que la calidad adaptativa bajaba a estático.
   → Detección previa y modo estático directo. TBT 0 ms.

6. **En hardware real (pantalla de 180 Hz), WebGL2 bajaba a `low` andando a 177 FPS.** Estimaba el refresco con el
   delta mínimo; los frames "amontonados" de 2–3 ms hacían creer que la pantalla era de 250 Hz. Además exigía
   la frecuencia del monitor (5,6 ms) en vez del objetivo del proyecto.
   → Refresco estimado con el percentil 10, y dos umbrales: bajar si se rompe el mínimo de 60 FPS; subir solo
   si casi ningún frame cae por debajo de ~80 FPS. 6 tests de regresión con los datos medidos. Verificado en el equipo: queda en `high`.

### MEDICIONES EN HARDWARE REAL
Acer Nitro Lite 16 · Chrome 154 · pantalla de 180 Hz · DPR 1,25 · **GPU usada por Chrome: Intel UHD integrada**
(Windows asigna al navegador la GPU de ahorro de energía; la RTX 4050 no participa).

| Backend · nivel | Partículas | p50 | p90 | p99 | Frames > 12,5 ms |
|---|---|---|---|---|---|
| WebGPU · high (auto) | 25.000 | 5,6 ms | 7,1 ms | 38 ms | 2 % |
| WebGL2 · high | 25.000 | 5,9 ms | 9,3 ms | 38 ms | 2 % |
| WebGL2 · medium | 8.000 | 5,5 ms | 6,4 ms | 7,7 ms | 0 % |

Draw calls: 1 · texturas: 0 · consola sin errores. El p99 de ~38 ms en `high` son tirones aislados (1 %); a vigilar
cuando haya escenas más pesadas.

### PENDIENTES
- Lighthouse en el notebook con el 3D activo
- Probar en un celular real (techo 'medium', touch)
- Probar con la RTX 4050 forzada para Chrome (Configuración de Windows → Pantalla → Gráficos)

### DECISIONES TÉCNICAS
- **Sin compute shaders.** El movimiento va en el vertex shader: funciona igual en WebGPU y WebGL2, que emula compute.
- **Medir frames perdidos, no FPS.** El loop va atado al monitor: un equipo sobrado y uno justo marcan los dos 16,7 ms a 60 Hz.
- **Arrancar conservador y subir midiendo.** Subir de calidad no se nota; bajarla en mitad del scroll sí.
- **Canvas transparente sobre el fondo CSS.** La capa estática sigue debajo: si el 3D se apaga, no hay salto visual.
- **`100lvh` en la capa gráfica.** En móvil, la barra del navegador no dispara resize del renderer en pleno scroll.
- **Geometría propia por Sprite.** El renderer libera los buffers instanciados recién al hacer dispose de la geometría; el quad compartido de Sprite no se puede liberar.
