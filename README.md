# EST / SYSTEM — portfolio de Emiliano Santo Tomás

Portfolio como sistema interactivo. Un núcleo de partículas en WebGL cambia de forma con el
scroll y cuenta el recorrido **HARDWARE → CODE → SYSTEMS → AI → INTERACTIVE EXPERIENCES**.

Se publica en GitHub Pages en cada push a `main` (`.github/workflows/deploy.yml`): corren los
tests y el build, y si algo falla no se publica. La versión anterior (Vite, sin React) queda en el
historial de git, antes del commit que la reemplaza.

## Comandos

```bash
npm install
npm run dev         # http://localhost:3210
npm run build       # export estático en out/
npm run typecheck
npm test            # lógica pura (runner nativo de Node)
npm run test:e2e    # Playwright; reutiliza el servidor de dev si está corriendo
node scripts/shots.mjs [desktop|mobile]   # capturas con GPU real en test-results/shots
node scripts/og-image.mjs                 # regenera public/og-image.jpg desde el hero
```

La primera vez, Playwright necesita su navegador: `npx playwright install chromium`.

### Parámetros de prueba

| Parámetro | Qué hace |
|---|---|
| `?gfx=static\|low\|medium\|high` | Fija la calidad y desactiva el ajuste automático |
| `?backend=none` | Simula un dispositivo sin GPU |

## Arquitectura

```text
app/            layout (fuentes, estilos, metadata) y la única página
sections/       Hero · Origin · Systems · StackMatrix · Playground · Contact
components/     System (arranque y capas globales) · Hud · Cursor · Intro · ProjectViewer
                Terminal · Telemetry · IndexOverlay · Overlay · Split
  experiments/  un módulo por experimento del playground (se descargan al encenderlos)
3d/             Scene (Canvas, calidad adaptativa, postproceso) · Core (el núcleo)
shaders/        GLSL del núcleo
hooks/          useGlobalInput (puntero + atajos) · useScrollWorld (scroll → recorrido) · useReveal
lib/            lógica pura y estado
  track.ts        paradas del recorrido: scroll → forma, encuadre, luz
  formations.ts   generadores de las 10 formaciones (con semilla)
  quality.ts · adaptiveQuality.ts · capabilities.ts   niveles y detección
  store.ts        estado de la experiencia (zustand)
  world.ts        estado por frame, fuera de React
  terminal.ts     intérprete de comandos
data/           projects · stack · experiments · evolution · site
styles/         tokens · base · hud · sections · overlays
tests/unit      calidad, recorrido, formaciones, terminal
tests/e2e       navegación, proyectos, terminal, teclado, secretos, responsive
```

### Dos clases de estado

- **`lib/store.ts`** — lo que cambia pocas veces por segundo: sección, proyecto activo, modo,
  terminal, calidad. La interfaz se suscribe a esto.
- **`lib/world.ts`** — lo que cambia en cada frame: posición de scroll, puntero, pulso. Es un
  objeto mutable que lee el loop de render; no pasa por React.

### Cómo se mueve el mundo

`useScrollWorld` convierte el scroll en una posición `p` (sección bajo el centro del viewport +
fracción recorrida). `sampleTrack(p)` devuelve entre qué dos formaciones está el núcleo, cuánto
mezclarlas, dónde encuadrarlo y con cuánta luz. Es una función pura: misma posición, mismo mundo.
El vertex shader hace la mezcla; la CPU solo actualiza uniforms.

## Agregar contenido

- **Proyecto:** un objeto más en `data/projects.ts`. `visual.formation` elige la forma del núcleo.
  `draft: true` lo muestra como "DATA PENDING".
- **Experimento:** un módulo en `components/experiments/` que exporte `mount(canvas)` y devuelva su
  función de limpieza; registrarlo en `data/experiments.ts`.
- **Tecnología:** una fila en `data/stack.ts`.
- **Formación nueva:** un generador en `lib/formations.ts` y su id en `FORMATION_IDS`.

## Pendiente de completar (contenido)

- `data/projects.ts`: **CONSTRUCT-OS** y **LUCA PIZZA** tienen texto provisional (`draft: true`),
  sin stack ni links.
- `data/stack.ts`: **NestJS**, **MongoDB** y **GSAP** no tienen un proyecto publicado que los
  respalde (`draft: true`). Completar o quitar.

## Atajos

| Tecla | Acción |
|---|---|
| `SHIFT` | DEEP MODE (el núcleo se cuantiza a vóxeles) |
| `E` | Terminal |
| `1`–`6` | Ir a una sección |
| `ESC` | Cerrar lo que esté abierto |
| Click sostenido | Telemetría del motor |
| Código Konami | Modo arco |

## Calidad gráfica

| Nivel | Partículas | DPR máx. | Postproceso |
|---|---|---|---|
| `static` | sin canvas | — | — |
| `low` | 6.000 | 1 | no |
| `medium` | 14.000 | 1,5 | bloom + grano + viñeta |
| `high` | 28.000 | 2 | bloom + grano + viñeta |

Se arranca en un nivel conservador y `AdaptiveQuality` sube o baja midiendo frames perdidos.
Sin GPU, con render por software o con ahorro de datos, el sitio no descarga Three.js.

## Decisiones

- **Sin GSAP ni Drei.** Las transiciones de interfaz son CSS; el movimiento del núcleo es GLSL.
  Ninguna de las dos librerías habría resuelto algo que no esté ya resuelto.
- **Sin Tailwind.** El sistema visual son ~50 tokens en `styles/tokens.css`.
- **`three` fijado en 0.182.** React Three Fiber 9 todavía usa `THREE.Clock`, que desde r183
  emite una advertencia de deprecación en cada carga.
