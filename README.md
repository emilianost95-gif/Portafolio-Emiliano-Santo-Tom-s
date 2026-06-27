# Portafolio · Emiliano Samir Santo Tomás

Sitio web personal y portafolio profesional de **Emiliano Samir Santo Tomás**, Desarrollador Web Front-End (Chile).

Diseño dark premium, totalmente responsive, con animaciones modernas, cursor personalizado, modo claro/oscuro y enfoque en rendimiento, SEO y accesibilidad.

---

## ✨ Características

- Diseño **dark premium** con glassmorphism y degradado firma (cian → índigo → violeta)
- **Modo claro / oscuro** con preferencia guardada en el navegador
- **Efecto de escritura** (typing) en el hero
- **Cursor personalizado** con anillo de seguimiento suave
- **Reveal on scroll**, contadores animados y barras de habilidades
- **Cursor, navbar fija, menú hamburguesa** y scroll suave
- **Formulario con validación** y notificaciones (toasts)
- **Botón flotante de WhatsApp** y botón "volver arriba"
- **Botón para copiar correo**
- SEO completo: meta tags, Open Graph, datos estructurados, `robots.txt`, `sitemap.xml`
- Página **404 personalizada**
- Respeta `prefers-reduced-motion` (accesibilidad)
- 100% **vanilla** (HTML, CSS, JS) — sin frameworks ni dependencias

---

## 📁 Estructura

```
portfolio/
├── index.html      # Página principal
├── style.css       # Todos los estilos (con variables editables)
├── script.js       # Toda la interactividad
├── 404.html        # Página de error personalizada
├── robots.txt      # Indexación para buscadores
├── sitemap.xml     # Mapa del sitio
└── README.md        # Este archivo
```

---

## 🚀 Despliegue en GitHub Pages

1. Creá un repositorio en GitHub (por ejemplo `portfolio` o `emilianost95-gif.github.io`).
2. Subí todos los archivos al repositorio:
   ```bash
   git init
   git add .
   git commit -m "Portafolio inicial"
   git branch -M main
   git remote add origin https://github.com/emilianost95-gif/portfolio.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages**.
4. En **Source**, elegí la rama `main` y la carpeta `/ (root)`. Guardá.
5. Esperá 1–2 minutos. Tu sitio quedará en:
   `https://emilianost95-gif.github.io/portfolio/`

> 💡 Si nombrás el repositorio `emilianost95-gif.github.io`, el sitio queda en la raíz: `https://emilianost95-gif.github.io/`

---

## ✏️ Qué editar antes de publicar

Buscá estos puntos en el código y reemplazá los datos de ejemplo:

| Qué | Dónde | Detalle |
|-----|-------|---------|
| Foto de perfil | `index.html` (`.profile-card__inner`) | Reemplazá el placeholder `EST` por `<img src="...">` |
| Número de WhatsApp | `index.html` (buscá `56900000000`) | Formato internacional sin `+` ni espacios |
| Correo | `index.html` (`#emailText`) | Tu correo real |
| LinkedIn | `index.html` (enlaces `href="#"`) | Tu URL de LinkedIn |
| URL de VIKINGO'S | `index.html` (tarjeta del proyecto) | La URL real del proyecto |
| Colores | `style.css` (sección `:root`) | Las variables `--accent-1/2/3` |
| Stats | `index.html` (atributos `data-count`) | Valores de los contadores |
| Habilidades | `index.html` (atributos `data-skill`) | Porcentajes de las barras |
| URLs de SEO | `sitemap.xml`, `robots.txt`, meta tags | Cambialas a tu dominio final |

---

## 📬 Hacer funcionar el formulario

El formulario valida en el navegador pero todavía no envía mensajes a ningún lado.
Para recibirlos sin backend, usá un servicio gratuito como **[Formspree](https://formspree.io/)**:

1. Creá una cuenta y un formulario en Formspree.
2. En `index.html`, agregá el `action` y `method` al `<form>`:
   ```html
   <form class="contact-form" id="contactForm" action="https://formspree.io/f/TU_ID" method="POST">
   ```

---

## 📊 Rendimiento

El sitio está optimizado para puntuar alto en **Lighthouse** (Performance, SEO, Accesibilidad y Buenas Prácticas): sin frameworks, JS diferido, fuentes con `preconnect`, imágenes en SVG y soporte de movimiento reducido.

---

## 📝 Licencia

Proyecto personal de Emiliano Samir Santo Tomás. Libre de usar como base para tu propio aprendizaje.
