# EST.lab · Portafolio de Emiliano Samir Santo Tomás

Portafolio tecnológico personal: estudiante y desarrollador autodidacta en Chile que construye
aplicaciones, sistemas de gestión, asistentes con IA y proyectos IoT para problemas reales.

**Sitio:** https://emilianost95-gif.github.io/Portafolio-Emiliano-Santo-Tom-s/

## Principio de contenido

Todo lo que dice el sitio está verificado contra el código de cada repositorio. Cada proyecto
declara su estado real — **En producción · MVP · En desarrollo · Concepto** — y separa lo
implementado de lo planificado. Los ejercicios de diseño (VÉRTICE, VULCANO, AUSTRAL) se muestran
como conceptos, no como clientes.

## Estructura

```
index.html        Página única
404.html          Error 404 (rutas absolutas, sirve desde cualquier URL)
css/styles.css    Todos los estilos, comentados y mobile-first
js/app.js         Tema, menú, sección activa, revelados, formulario, copiar correo
img/shots/        Capturas reales de cada proyecto (WebP, 640 y 1280 px)
img/projects/     Imagen de Roble Negro
fonts/            Archivo, Instrument Sans y Geist Mono (self-hosted, variables)
og-image.png      Vista previa al compartir (1200×630)
INFORME.md        Informe del rediseño v3
```

Sin frameworks, sin build, sin dependencias: se sube tal cual a GitHub Pages.

## Actualizar

- **Estado de un proyecto:** cambiar la clase `status--prod | status--mvp | status--dev | status--concept`
  y el texto, tanto en la tarjeta como en el índice del hero (`.console__list`).
- **Cache:** al cambiar CSS o JS, subir el número `?v=3` en `index.html` y `404.html`.
- **Formulario:** usa Web3Forms; la clave está en `data-access-key` del `<form>`.

## Autor

Emiliano Samir Santo Tomás · [GitHub](https://github.com/emilianost95-gif) ·
[LinkedIn](https://www.linkedin.com/in/emiliano-santo-tom%C3%A1s-718489291) · emilianost95@gmail.com
