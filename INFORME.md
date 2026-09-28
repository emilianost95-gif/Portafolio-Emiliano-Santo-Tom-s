# Informe del rediseño · Portafolio v3 ("EST.lab")

Fecha: 27 de septiembre de 2026 · Objetivo: presentación ante representantes universitarios.

## 1. Qué encontré en el portafolio anterior (v2)

- **Enfoque:** "Desarrollador Web Front-End" orientado a vender sitios (sección *Servicios*, CTA "Empezar mi proyecto").
- **Proyectos:** VÉRTICE y VULCANO como destacados; AUSTRAL, SmartGrow, VIKINGO'S y Roble Negro en grilla. Todos presentados como "sitios en producción".
- **Afirmaciones que no se sostenían:** "6 proyectos reales en producción" (VÉRTICE, VULCANO y AUSTRAL eran conceptos) y promedios Lighthouse (98/96/93) calculados sobre esos seis, sin forma de verificarlos.
- **Faltaban** los proyectos más fuertes: Gestor de Precios y Stock, OA Manager, Marketing Lab, Registro Geriátrico, y los clientes Santa Cecilia y LUCA PIZZA BMX.
- **Código:** solo existían `styles.min.css` y `app.min.js` (las fuentes modulares y `build.mjs` que menciona el HTML no estaban en el repo), así que no se podía mantener sin reescribir.
- **404.html roto:** enlazaba cinco CSS que no existen (`css/00-reset.css`, etc.). Se veía sin estilos.
- **Lo que funcionaba y se conservó:** tema claro/oscuro con preferencia guardada, menú móvil accesible (foco atrapado, Escape), sección activa en el menú, revelados al scroll con respeto a `prefers-reduced-motion`, formulario con validación y envío real por Web3Forms, copiar correo, toasts, SEO (canonical, OG, JSON-LD, sitemap, robots), fuentes self-hosted.

## 2. Proyectos: qué hice con cada uno

| Proyecto | Decisión | Estado mostrado | Verificado en |
|---|---|---|---|
| Gestor de Precios y Stock | **Destacado 01** | MVP | repo + build local + captura en modo demo |
| SmartGrow | **Destacado 02** | En desarrollo | repo (`README`, `docs/index.html`) |
| OA Manager | **Destacado 03** | En producción | repo (backend + frontend) + build + demo |
| Marketing Lab | **Destacado 04** | MVP | repo + build + captura |
| Registro Geriátrico | Secundario | V1 | repo + build + **133 pruebas ejecutadas (todas pasan)** |
| Sistema gastronómico | Secundario | En desarrollo | partes construidas: web LUCA PIZZA BMX y Marketing Lab; el resto marcado "Propuesta" |
| Sistema construcción | Secundario | En desarrollo | sin repo público; se muestra el flujo y el stack definido, con la nota "repositorio todavía no es público" |
| VIKINGO'S BarberShop | Clientes | — | repo + sitio en vivo |
| Roble Negro (ex Simetría Conce) | Clientes | — | el repo `SimetriaConce` contiene el mismo sitio de Roble Negro |
| Santa Cecilia Construcciones | Clientes | — | repo `staceciliaconst/sta-cecilia` + sitio en vivo |
| LUCA PIZZA BMX | Clientes (agregado) | — | repo + sitio en vivo |
| VÉRTICE, VULCANO, AUSTRAL | **Degradados a "Concepto"** | Concepto | una línea con links, rotulada "Ejercicios de diseño web, no son clientes reales" |
| R-TECH | **Eliminado** (a pedido) | — | no se encontró repo ni link |

## 3. Tecnologías verificadas (y las que no puse)

**Verificadas en `package.json` / código:** HTML, CSS, JavaScript, TypeScript, React, Vite, Tailwind CSS, React Router, TanStack Query, Node.js + Express, API REST, JWT + bcrypt, Zod, PostgreSQL + Prisma, IndexedDB (Dexie), localStorage, ExcelJS, PapaParse, jsPDF / PDFKit, PWA (vite-plugin-pwa), Capacitor (Android), GitHub Actions, Vitest, despliegue en GitHub Pages, Netlify y Render. En IoT: Arduino, DHT22, módulo relé (roadmap de SmartGrow).

**IA, con precisión:**
- Stock Copilot: motor de análisis **local** + función serverless opcional (la API key vive solo en el servidor).
- Marketing Coach: coach socrático **local**; la interfaz para IA remota existe, falta el servicio → "En desarrollo".
- El asistente del Geriátrico **no usa IA** (reglas locales); por eso no lo presento como IA.
- Se agregó una línea honesta: "Trabajo con IA como copiloto de desarrollo…".

**No puse como tecnología dominada:**
- **MQTT / Mosquitto:** no aparece en ningún repo. Quedó en "Planificado (evaluando MQTT)" y en "Qué me interesa investigar".
- **ESP32:** el propio roadmap de SmartGrow dice "Migración a ESP32 · PENDIENTE"; aparece como "en migración".
- **Bluetooth / Wi-Fi:** no hay conexión implementada; el panel web de SmartGrow usa **datos simulados** y así se indica.
- **Visualización 3D** (sistema construcción): no está planteada en nada verificable → no se muestra.
- **NestJS** (construcción): es el stack definido para un proyecto sin repo público; aparece solo dentro de esa tarjeta, marcada "En desarrollo", no en la sección de Tecnologías.

## 4. Información que faltaba (completar vos)

1. **Geriátrico V1 → V2 → V3:** el repo tiene un solo commit, no hay registro de "problemas detectados". Dejé el ciclo como *V1 (hecha) → Uso real (en curso) → V2 (planificada) → V3 (por definir)*. Cuando tengas los problemas reales que reportó el hogar, reemplazá el texto de los pasos en `index.html` (buscá `class="iter"`).
2. **Sistema de construcción:** si querés link, hacé público el repo o subí capturas.
3. **Luca Pizza Club:** figura "En desarrollo"; si ya hay demo, agregá el link.
4. **Firmware de SmartGrow:** el repo no tiene el código del Arduino. Subirlo (aunque sea el sketch de lectura del DHT22) refuerza muchísimo el proyecto IoT.

## 5. Mejoras UX/UI

- **Storytelling nuevo** pensado para 30 s / 2 min / 5 min, con una guía "¿Cuánto tiempo tenés?" en el hero.
- **Hero:** "Uso la programación para resolver problemas reales." + quién soy, que soy estudiante y hacia dónde voy. A la derecha, un **índice del laboratorio** con los 7 proyectos y su estado: en 30 segundos se ve que hay trabajo real.
- **"¿Qué estoy construyendo?":** cuatro problemas reales → cuatro soluciones.
- **Jerarquía visual:** 4 casos grandes con captura real; 3 secundarios medianos; clientes en tarjetas chicas; conceptos en una sola línea.
- **Tarjetas con la estructura pedida:** Problema · Solución · Tecnología · Estado visibles; Mi aporte · Aprendizaje · Implementado / En desarrollo / Planificado dentro de "Ver detalle técnico" (sin llenar la vista de texto).
- **Sistema de estados** con color + texto (nunca solo color): En producción, MVP, En desarrollo, Concepto.
- **SmartGrow:** diagrama del flujo Sensores → Microcontrolador → Datos → Procesamiento → Automatización → Dashboard, con el estado real de cada etapa.
- **Nuevas secciones:** Mi evolución (Web → Apps → Sistemas → IA → Automatización → IoT → Ingeniería), Tecnologías con "dónde lo usé", Qué me interesa investigar.
- **Quitado (con motivo):** *Servicios* (orientado a vender sitios, no al objetivo académico), métricas Lighthouse (no verificables), cursor personalizado, tilt 3D, parallax y botones magnéticos (distraían y no aportan en una proyección o en un celular). El formulario se conservó y su selector ahora ofrece "Universidad o programa académico".
- **Capturas reales:** generé 8 capturas nuevas levantando cada app localmente (en modo demo, con datos ficticios, y así lo dice el pie de foto).
- **Imagen para compartir (OG) nueva** acorde al mensaje.
- Estilo de impresión por si imprimen la página.

## 6. Rendimiento

- CSS y JS **legibles** en un archivo cada uno (≈32 KB y ≈12 KB sin minificar), sin librerías.
- Capturas en WebP con `srcset` 640/1280 px (12–56 KB c/u) y `loading="lazy"` + `width/height` (sin saltos de layout).
- Se eliminaron del repo 16 imágenes y los bundles minificados que ya no se usan.
- Sin scripts de animación por frame (se quitó el cursor y el parallax que corrían en cada movimiento).

## 7. Responsive

- Mobile-first. Probado a 390 px (celular), 820 px (tablet), 1280 y 1440 px (escritorio): **sin scroll horizontal** en ningún ancho.
- Menú móvil con panel a pantalla completa, foco atrapado, Escape, y navegación corregida (antes el scroll quedaba corto al elegir una sección desde el menú).
- Botones y enlaces con área táctil ≥ 42 px.

## 8. Verificación realizada

- Todas las anclas internas existen. Los 9 repos enlazados existen (`git ls-remote`).
- Demos en vivo revisadas: Gestor, Marketing Lab, SmartGrow, OA Manager (Netlify), VIKINGO'S, Roble Negro, Santa Cecilia, LUCA PIZZA BMX, VÉRTICE, VULCANO, AUSTRAL → cargan.
- Menú, tema claro/oscuro, desplegables, validación del formulario, sección activa y 404: probados en navegador sin errores de consola ni imágenes rotas.

## 9. Riesgos y pendientes

1. **Los sitios conceptuales tienen testimonios y cifras ficticias** (p. ej. VÉRTICE: "450 proyectos", VULCANO: testimonios con nombres). En el portafolio están rotulados como concepto, pero si alguien entra al sitio los ve sin aviso. Recomendado: agregar un banner "Proyecto conceptual de diseño" en esos tres repos o quitar los links.
2. **El demo del Geriátrico en GitHub Pages** no se pudo verificar desde acá (es una app que se arma con JavaScript). No lo enlacé como demo: solo el código. Probalo en tu navegador y, si anda, agregá el botón.
3. **OA Manager:** el backend está en el plan gratuito de Render y "se duerme"; la primera carga puede tardar ~1 minuto. Abrilo unos minutos antes de la presentación. La recuperación de contraseña quedó marcada "en pruebas" (el remitente de Resend solo entrega a tu propio correo).
4. **Estados:** si algo cambia antes del martes (p. ej. sale el APK del Gestor), actualizá la clase del estado en la tarjeta y en el índice del hero.
5. **Subida:** si subís con "Upload files" de GitHub, los archivos viejos (`css/styles.min.css`, `js/app.min.js`, imágenes de `img/projects/`) quedan en el repo pero **no se usan**; no rompen nada.
