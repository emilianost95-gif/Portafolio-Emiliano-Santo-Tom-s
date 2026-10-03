# Portfolio — Emiliano Santo Tomás

Portfolio interactivo construido por fases. **Fase 0 (actual):** base semántica completa, sin 3D.
El contenido funciona y se entiende sin JavaScript gráfico; el 3D se suma encima en las fases siguientes.

## Comandos

```bash
npm install
npm run dev         # servidor local
npm run build       # typecheck + build de producción en dist/
npm run preview     # sirve dist/ para probarlo como en producción
```

Probar niveles gráficos sin cambiar de hardware: `?gfx=static`, `?gfx=low`, `?gfx=medium`, `?gfx=high`.

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
  graphics/
    index.ts            Contrato de la capa gráfica. Chunk separado vía import(): si el modo es 'static' no se descarga
  styles/
    tokens.css          Colores, tipografía, espaciado, movimiento (una sola fuente)
    base.css · layout.css · components.css
vite.config.ts          Plugin que genera robots.txt y sitemap.xml desde VITE_SITE_URL
```

Cadena de fallback (punto 4):

```text
WebGPU ──► WebGL2 ──► calidad baja ──► estático (fondo CSS: es lo que se ve hoy)
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
