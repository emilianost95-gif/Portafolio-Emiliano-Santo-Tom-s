# Portfolio — Emiliano Santo Tomás

Portfolio interactivo construido por fases.

- **Fase 0:** base semántica completa, SEO y accesibilidad, sin 3D.
- **Fase 1:** motor gráfico — Three.js (WebGPU con fallback a WebGL2), calidad adaptativa medida,
  fallback en tiempo de ejecución, monitor de rendimiento y una escena de prueba.
- **Fase 2:** scroll → cámara. Scroll nativo, recorrido de cámara por secciones, reversible por construcción.
- **Fase 3 (actual):** escena "Forja" — del metal al código. Formaciones por sección, el puntero es la torcha, bloom.

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
  scroll/
    track.ts            Función pura: scroll → posición entre secciones (0..n-1)
    ScrollTracker.ts    Lee el scroll nativo; mide las secciones solo cuando cambia el layout
  ui/safeArea.ts        Mide el texto del hero en el DOM → zona de pantalla donde el 3D puede brillar sin taparlo
  graphics/scenes/forge/
    formations.ts       Generadores puros (con semilla): chispas, cercha 3D, código, mezcla, campo
    ForgeScene.ts       Mezcla de formaciones en el vertex shader (TSL), torcha, halo del arco, cámara
  graphics/camera/
    CameraRig.ts        Keyframes de cámara por sección + easing + amortiguación (funciones puras)
tests/                  Tests de calidad adaptativa, detección, track de scroll y cámara
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
- [x] 21 tests (Fase 1)

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


---

## Checklist — Fase 2 (scroll)

Flujo, igual al del punto 2 del documento:

```text
SCROLL NATIVO ─► track (0..4, función pura) ─► keyframes de cámara ─► cámara amortiguada ─► render
     │                                             (mismo loop, mismo frame)
     └─► barra de progreso (CSS scroll-driven animation, 0 JS)
```

### IMPLEMENTADO
- [x] `scrollToTrack`: posición de scroll → posición entre secciones; vale exactamente `i` en el ancla de cada sección
- [x] `ScrollTracker`: lee `scrollY` una vez por frame; mide las secciones solo con `ResizeObserver` y al cargar las fuentes
- [x] `CameraRig`: un keyframe por sección (inicio, proyectos, stack, sobre mí, contacto), easing por tramo
- [x] La cámara sigue la pose objetivo con amortiguación exponencial independiente de los FPS
- [x] Scroll y render en **un solo loop**: el scroll se lee en el mismo frame que se dibuja
- [x] Barra de progreso de lectura con `animation-timeline: scroll()` (sin JS; donde no hay soporte, no se muestra)
- [x] Reduced motion: la cámara no acompaña el scroll (cuadro fijo)
- [x] Header más opaco: el texto se transparentaba por debajo
- [x] 9 tests nuevos (30 en total)

### PERFORMANCE (medido en el notebook, Chrome 154, WebGPU · high)
- 179–181 FPS durante el scroll; 1 draw call; costo extra por frame: leer `scrollY` y 6 interpolaciones
- Recorrido completo de la página a ritmo constante (268 frames): **0 inversiones de velocidad de cámara**
  (indicador de jitter); paso máximo por frame = 2,8 × la mediana (picos suaves en los cambios de sección)
- Bundle: +0 dependencias

### REVERSIBILIDAD (medido en el notebook)
| Llegar a "Stack"… | Cámara |
|---|---|
| desde arriba | (−3,060 · 1,516 · 6,0006) |
| desde abajo | (−3,060 · 1,516 · 6,0009) |

Keyframe: (−3 · 1,5 · 6). La diferencia es el parallax del puntero, que es intencional.

### ACCESSIBILITY
- [x] Keyboard: Inicio/Fin/anclas/Tab usan el scroll nativo; la cámara llega amortiguada, sin saltos
- [x] Reduced motion: cámara fija
- [x] Screen reader: sin cambios en el contenido; la barra de progreso es `aria-hidden`
- [x] Touch: scroll nativo del navegador (inercia del sistema)

### COMPATIBILITY
- [x] WebGPU / WebGL2 — la cámara no depende del backend
- [x] Barra de progreso: Chrome/Edge y Safari 26+; en navegadores sin soporte simplemente no aparece
- [ ] Celular real — pendiente

### CÓDIGO
- [x] TypeScript · [x] sin errores de consola · [x] lógica de scroll y cámara en funciones puras testeadas
- [x] Sin dependencias nuevas

### PENDIENTES
- Con 25.000 partículas, el campo queda denso detrás del texto. Se resuelve en la Fase 3 con las escenas definitivas
  (atenuar la escena detrás de bloques de texto)
- Probar en celular

### DECISIONES TÉCNICAS
- **Sin Lenis.** Reemplazar el scroll nativo rompe Ctrl+F y los saltos a anclas, puede molestar a lectores de pantalla y hay que
  desactivarlo en reduced motion. La suavidad que importa (la de la cámara) se logra con amortiguación sin tocar el scroll.
- **Sin GSAP por ahora.** Ninguna escena necesita `pin` ni timelines encadenadas. Si la Fase 3 lo justifica, se suma solo ScrollTrigger.
- **Cámara = función pura del scroll + amortiguación.** No hay triggers de una sola vez: es reversible por construcción y testeable sin navegador.
- **Barra de progreso en CSS.** La anima el compositor del navegador: no puede desincronizarse del scroll ni ocupar el hilo principal.


---

## Checklist — Fase 3 (escena "Forja")

| Sección | Formación | Relato |
|---|---|---|
| Inicio | Chispas de soldadura con tiro parabólico real; **el puntero es la torcha** | El taller |
| Proyectos | Cercha 3D (cordones, montantes y diagonales tipo Warren) | Estructura: lo construido |
| Stack | Líneas de código con indentación y colores de sintaxis | Las herramientas |
| Sobre mí | Mitad cercha (metal tibio), mitad código | Del metal al código |
| Contacto | Campo tenue | Cierre |

Cada partícula guarda su posición en cada formación (atributos instanciados) y el vertex shader las mezcla
según el scroll, con un desfase por partícula: las chispas vuelan a armar la cercha y la cercha se desarma en código.
El color también cuenta la historia: metal al rojo (blanco → naranja → rojo) que se enfría a cian.

### IMPLEMENTADO
- [x] 5 formaciones generadas por funciones puras con semilla (determinísticas, testeadas)
- [x] Mezcla en GPU: 1 draw call para todas las partículas; la CPU solo actualiza 6 uniforms por frame
- [x] Chispas: física real (v·t + ½·g·t²), vida de 0,7 a 1,6 s, color por temperatura
- [x] Torcha interactiva acotada a una **zona libre de texto medida en el DOM** (no en coordenadas 3D)
- [x] Halo del arco con parpadeo irregular: la fuente de luz de la escena
- [x] Bloom (post-procesado) solo en `medium`/`high`; en `low` se dibuja directo al canvas
- [x] Layout `wide`/`narrow`: en celular las formaciones van centradas, más atrás y más tenues
- [x] Reduced motion: cuadro fijo (chispas congeladas), sin torcha
- [x] 9 tests nuevos (39 en total)

### PERFORMANCE (medido en el notebook: Chrome 154, WebGPU, Intel UHD, 180 Hz, nivel `high`)
| Sección | p50 | p90 | p99 | Frames < 60 FPS |
|---|---|---|---|---|
| Inicio (chispas + halo + bloom) | 6,0 ms | 9,5 ms | 13,7 ms | 0 % |
| Proyectos (cercha) | 6,8 ms | 10,8 ms | 14,5 ms | 0 % |
| Stack (código) | 5,7 ms | 7,7 ms | 11,8 ms | 0 % |
| Sobre mí | 5,7 ms | 7,2 ms | 9,9 ms | 0 % |
| Contacto | 5,8 ms | 8,2 ms | 12,9 ms | 0,4 % |

- 25.000 partículas · **15 draw calls** con bloom (1 sin bloom) · 13 render targets del bloom
- La calidad adaptativa no bajó de `high` en ningún momento
- Bundle: +6 KB gzip por el bloom; 0 dependencias nuevas

### ACCESSIBILITY
- [x] Keyboard · [x] Reduced motion (tiempo congelado, verificado) · [x] Screen reader (axe: 0) · [x] Touch (la torcha sigue al dedo)
- [x] El texto nunca queda tapado: verificado con el puntero sobre el título (la torcha se queda debajo del párrafo)

### COMPATIBILITY
- [x] WebGPU (notebook real) · [x] WebGL2 (con y sin bloom) · [x] Layout de celular (emulado; falta celular real)

### PROBLEMAS ENCONTRADOS Y RESUELTOS
1. **Con bloom, el canvas quedaba opaco y tapaba el fondo CSS.** El pipeline sumaba también el canal alfa → se conserva el alfa de la escena.
2. **El arco era una mancha blanca** (halo + chispas jóvenes + bloom). → Intensidad máx. 1,5, threshold del bloom 0,7, escoria del 15 % al 6 %.
3. **La cercha se leía como una banda de puntos.** → Sección de 2 m y paneles de 1,7: ahora se distinguen las diagonales.
4. **En "Sobre mí" las partículas pasaban por encima del texto.** → Formación movida a la única franja libre (junto al título) y más tenue.
5. **En los extremos (inicio/contacto) quedaban restos de la formación vecina.** → El desfase por partícula se apaga en los extremos.
6. **En `high`, la torcha llevada sobre el título lo tapaba de chispas** (visto en el notebook). → Solo el 35 % de las partículas son
   chispas, y la torcha se limita a una zona medida en el DOM (en 3D no alcanzaba: depende de la proporción de la ventana).

### PENDIENTES
- Celular real (rendimiento y touch)
- Probar Chrome con la RTX 4050 asignada (hoy usa la Intel UHD)
- Lighthouse con el 3D activo en el notebook

### DECISIONES TÉCNICAS
- **Partículas y no modelos GLB.** Una cercha o un bloque de código como malla serían assets de cientos de KB; como
  partículas son unas líneas de código y se pueden *transformar* entre sí, que es justamente el relato.
- **Sin iluminación PBR.** Todo es emisivo (chispas, metal caliente, código en pantalla): la luz es el halo del arco y el bloom.
  Una luz física no aportaría nada visible y costaría por píxel.
- **La zona segura se mide en el DOM.** El contenido manda; el 3D se adapta a él y no al revés.
- **Bloom ligado al nivel de calidad.** Son ~14 pasadas extra: en `low` no existe.
