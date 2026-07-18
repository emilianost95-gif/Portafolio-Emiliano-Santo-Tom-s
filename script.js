/* =============================================================
   PORTFOLIO · Emiliano Samir Santo Tomás
   script.js
   -------------------------------------------------------------
   Índice de funciones:
   1.  Loader inicial
   2.  Cursor personalizado
   3.  Navbar (scroll + menú hamburguesa)
   4.  Modo claro / oscuro (con memoria)
   5.  Efecto de escritura (typing)
   6.  Reveal on scroll (aparición de elementos)
   7.  Barras de habilidades animadas
   8.  Contadores de estadísticas
   9.  Copiar correo
   10. Validación del formulario
   11. Notificaciones (toasts)
   12. Botón volver arriba
   13. Año automático en el footer
   ============================================================= */

"use strict";

/* Detecta si el usuario prefiere menos movimiento (accesibilidad) */
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Espera a que el DOM esté listo antes de ejecutar todo */
document.addEventListener("DOMContentLoaded", () => {

/* ===========================================================
     1. PRELOADER CYBERPUNK (boot + glitch)
     =========================================================== */
  const preloader = document.getElementById("preloader");
  const bootEl = document.getElementById("preloaderBoot");
  const logoWrap = document.getElementById("preloaderLogo");
  const est = document.getElementById("preloaderEst");
  const tag = document.getElementById("preloaderTag");

  if (preloader) {
    const lines = [
      "> booting portfolio.exe ...",
      "> loading modules [JS] [CSS] [React] .... ok",
      "> mounting components ............... ok",
      "> establishing connection: Chile ... ok",
      "> status: DISPONIBLE ✓"
    ];

    const typeLine = (text, cb) => {
      let i = 0;
      const span = document.createElement("div");
      bootEl.appendChild(span);
      (function step() {
        span.textContent = text.slice(0, i) + (i < text.length ? "█" : "");
        i++;
        if (i <= text.length) setTimeout(step, 18);
        else { span.textContent = text; cb && cb(); }
      })();
    };

    const runBoot = (idx) => {
      if (idx >= lines.length) { setTimeout(showLogo, 350); return; }
      typeLine(lines[idx], () => setTimeout(() => runBoot(idx + 1), 90));
    };

    function showLogo() {
      bootEl.style.transition = "opacity 0.4s";
      bootEl.style.opacity = "0";
      setTimeout(() => {
        logoWrap.style.transition = "opacity 0.3s";
        logoWrap.style.opacity = "1";
        est.classList.add("is-glitching");
        setTimeout(() => {
          est.classList.remove("is-glitching");
          tag.style.transition = "opacity 0.6s";
          tag.style.opacity = "1";
          setTimeout(() => {
            preloader.classList.add("is-hidden");
            document.body.classList.remove("no-scroll");
          }, 700);
        }, 1350);
      }, 400);
    }

    document.body.classList.add("no-scroll");
    setTimeout(() => runBoot(0), 300);
  }
  /* ===========================================================
     2. CURSOR PERSONALIZADO
     Un punto que sigue el mouse al instante y un anillo que lo
     persigue con un pequeño retraso (efecto suave).
     =========================================================== */
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");

  // Solo activamos el cursor custom en dispositivos con mouse
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hasFinePointer && cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;   // posición real del mouse
    let ringX = 0, ringY = 0;     // posición suavizada del anillo

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // El punto sigue al instante
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // El anillo se mueve con un suavizado (interpolación lineal)
    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Al pasar sobre elementos clicables, el anillo crece
    const interactive = document.querySelectorAll("a, button, input, textarea, .project-card, .tech-item");
    interactive.forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("is-active"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("is-active"));
    });
  }


  /* ===========================================================
     3. NAVBAR: estado al hacer scroll + menú hamburguesa
     =========================================================== */
  const nav = document.getElementById("nav");
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  // Agrega cristal a la navbar después de bajar un poco
  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 30);
  });

  // Abre / cierra el menú móvil
  navBurger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navBurger.classList.toggle("is-open", isOpen);
    navBurger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("no-scroll", isOpen);
  });

  // Cierra el menú al tocar un enlace (en móvil)
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navBurger.classList.remove("is-open");
      navBurger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    });
  });


  /* ===========================================================
     4. MODO CLARO / OSCURO
     Guarda la preferencia en el navegador (localStorage).
     =========================================================== */
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;

  // Recupera el tema guardado (si existe)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
  }

  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", current);
    localStorage.setItem("theme", current);
    // Actualiza el color de la barra del navegador
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", current === "light" ? "#f7f7fb" : "#08090d");
  });


  /* ===========================================================
     5. EFECTO DE ESCRITURA (typing)
     Escribe y borra frases en bucle.
     =========================================================== */
  const typedEl = document.getElementById("typed");
  if (typedEl) {
    const phrases = [
      "Transformo ideas en experiencias web.",
      "Sitios modernos, rápidos y memorables.",
      "Diseño y código, de punta a punta.",
    ];

    if (REDUCE_MOTION) {
      // Sin animación: mostramos la primera frase fija
      typedEl.textContent = phrases[0];
    } else {
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;

      function typeLoop() {
        const current = phrases[phraseIndex];

        if (!deleting) {
          // Escribiendo
          typedEl.textContent = current.slice(0, charIndex + 1);
          charIndex++;
          if (charIndex === current.length) {
            deleting = true;
            return setTimeout(typeLoop, 1800); // pausa al terminar la frase
          }
        } else {
          // Borrando
          typedEl.textContent = current.slice(0, charIndex - 1);
          charIndex--;
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
          }
        }
        // Velocidad: más rápido borrando que escribiendo
        setTimeout(typeLoop, deleting ? 40 : 75);
      }
      typeLoop();
    }
  }


  /* ===========================================================
     6. REVEAL ON SCROLL
     Usa IntersectionObserver para mostrar elementos al entrar
     en pantalla. Es eficiente (no escucha el scroll constante).
     =========================================================== */
  const revealEls = document.querySelectorAll("[data-reveal]");

  if (REDUCE_MOTION) {
    // Si el usuario prefiere menos movimiento, mostramos todo de una
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // solo se anima una vez
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    revealEls.forEach((el) => revealObserver.observe(el));
  }


  /* ===========================================================
     7. BARRAS DE HABILIDADES
     Animan su ancho hasta el valor de data-skill al verse.
     =========================================================== */
  const skillFills = document.querySelectorAll(".skill__fill");
  const skillObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        fill.style.width = fill.dataset.skill + "%";
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.5 });
  skillFills.forEach((fill) => skillObserver.observe(fill));


  /* ===========================================================
     8. CONTADORES DE ESTADÍSTICAS
     Cuentan desde 0 hasta el valor de data-count al verse.
     =========================================================== */
  const counters = document.querySelectorAll("[data-count]");
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => counterObserver.observe(c));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600; // milisegundos
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Easing suave (easeOutQuad) para que frene al final
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  }


  /* ===========================================================
     9. COPIAR CORREO
     =========================================================== */
  const copyBtn = document.getElementById("copyEmail");
  const emailText = document.getElementById("emailText");
  if (copyBtn && emailText) {
    copyBtn.addEventListener("click", async () => {
      const email = emailText.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        toast("success", "Correo copiado al portapapeles");
      } catch {
        toast("error", "No se pudo copiar. Copialo manualmente.");
      }
    });
  }


  /* ===========================================================
     10. VALIDACIÓN DEL FORMULARIO
     Valida nombre, correo y mensaje antes de "enviar".
     =========================================================== */
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      // Limpia errores previos
      clearError("name"); clearError("email"); clearError("message");

      if (name.length < 2) {
        showError("name", "Ingresá tu nombre.");
        valid = false;
      }
      // Expresión regular simple para validar el correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("email", "Ingresá un correo válido.");
        valid = false;
      }
      if (message.length < 10) {
        showError("message", "Contame un poco más (mín. 10 caracteres).");
        valid = false;
      }

      if (valid) {
        // Acá conectarías un servicio real (Formspree, EmailJS, etc.)
        toast("success", "¡Mensaje listo! Te responderé pronto.");
        form.reset();
      } else {
        toast("error", "Revisá los campos marcados.");
      }
    });
  }

  function showError(field, msg) {
    const span = document.querySelector(`[data-error="${field}"]`);
    if (span) {
      span.textContent = msg;
      span.closest(".form-field").classList.add("has-error");
    }
  }
  function clearError(field) {
    const span = document.querySelector(`[data-error="${field}"]`);
    if (span) {
      span.textContent = "";
      span.closest(".form-field").classList.remove("has-error");
    }
  }


  /* ===========================================================
     12. BOTÓN VOLVER ARRIBA
     =========================================================== */
  const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 600);
  });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? "auto" : "smooth" });
  });


  /* ===========================================================
     13. AÑO AUTOMÁTICO EN EL FOOTER
     =========================================================== */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

}); // fin DOMContentLoaded


/* =============================================================
   11. NOTIFICACIONES (toasts)
   Función global para mostrar mensajes flotantes.
   tipo: "success" | "error" | "info"
   ============================================================= */
function toast(type, message) {
  const container = document.getElementById("toasts");
  if (!container) return;

  // Iconos según el tipo
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(el);

  // Animación de entrada
  requestAnimationFrame(() => el.classList.add("is-shown"));

  // Se va solo después de 3.5 segundos
  setTimeout(() => {
    el.classList.remove("is-shown");
    setTimeout(() => el.remove(), 400);
  }, 3500);
}
/* === Typewriter para el terminal de la profile-card === */
(function () {
  const el = document.getElementById("terminalText");
  if (!el) return; // si no existe el elemento, no hace nada

  const lines = [
    'const dev = "Emiliano";',
    'stack = ["JS", "React", "CSS"];',
    'status = "disponible ✓";'
  ];

  let lineIndex = 0;   // qué línea estamos escribiendo
  let charIndex = 0;   // qué caracter dentro de la línea
  let deleting = false; // ¿estamos borrando o escribiendo?

  function tick() {
    const current = lines[lineIndex];

    if (!deleting) {
      // escribiendo: agrego un caracter
      el.textContent = current.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === current.length) {
        // terminó de escribir la línea → espera y empieza a borrar
        deleting = true;
        setTimeout(tick, 1400); // pausa con la línea completa
        return;
      }
    } else {
      // borrando: saco un caracter
      el.textContent = current.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        // terminó de borrar → paso a la siguiente línea
        deleting = false;
        lineIndex = (lineIndex + 1) % lines.length; // vuelve a 0 al final
      }
    }

    // velocidad: más rápido borrando que escribiendo
    setTimeout(tick, deleting ? 40 : 90);
  }

  tick();
})();
/* ===== Cards de proyecto: encender color por scroll en móvil ===== */
(function () {
  const cards = document.querySelectorAll(".project-card");
  if (!cards.length) return;

  // Solo en móvil; en desktop manda el :hover
  if (!window.matchMedia("(max-width: 640px)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-live", entry.isIntersecting);
      });
    },
    { threshold: 0.5 }
  );

  cards.forEach((card) => observer.observe(card));
})();
/* =============================================================
   14. SINAPSIS NEURONAL (fondo del hero)
   -------------------------------------------------------------
   Red de neuronas conectadas por axones curvos. Cada tanto una
   dispara: se ilumina y manda un impulso que viaja hasta sus
   vecinas; al llegar, la vecina puede disparar en cadena. El
   período refractario y la probabilidad de propagación hacen
   que las ondas se expandan y se apaguen solas.

   Integración con el sitio:
   - El canvas es TRANSPARENTE (clearRect): la aurora de .bg-fx
     se ve a través de la red.
   - Respeta el toggle de tema: un MutationObserver detecta el
     cambio de data-theme y cambia la paleta al instante.
   - Reusa la constante global REDUCE_MOTION (línea ~24).
   - Pausa fuera de pantalla (IntersectionObserver) y con la
     pestaña oculta (visibilitychange).
   ============================================================= */
(function () {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || !canvas.getContext) return; // sin canvas → fondo aurora
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* --- Paletas por tema (r, g, b como string para armar rgba) --- */
  const PALETAS = {
    dark: {
      cyan:    "0, 240, 255",
      magenta: "255, 0, 160",
      cabeza:  "240, 240, 245",  // cabeza del pulso y soma al disparar
      alphaAxon: 0.06,           // opacidad base de los axones
      alphaHalo: 0.05            // halo mínimo de neuronas en reposo
    },
    light: {
      cyan:    "0, 130, 150",    // tonos más profundos: contrastan en claro
      magenta: "180, 0, 115",
      cabeza:  "20, 22, 40",
      alphaAxon: 0.12,
      alphaHalo: 0.08
    }
  };

  function paletaActual() {
    const tema = document.documentElement.getAttribute("data-theme");
    return tema === "light" ? PALETAS.light : PALETAS.dark;
  }
  let paleta = paletaActual();

  /* Cambio de tema en vivo: la red se recolorea al instante
     porque cada neurona guarda su TIPO ("cyan"/"magenta") y el
     color real se resuelve recién al dibujar */
  new MutationObserver(() => {
    paleta = paletaActual();
    if (REDUCE_MOTION) dibujarFrame(0); // refresca el frame estático
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let esMovil = window.matchMedia("(max-width: 768px)").matches;

  /* --- CONFIGURACIÓN CENTRAL ---
     El "carácter" de la red vive acá. Valores clave para lo
     hipnótico: velocidades bajas, refractario largo (evita el
     caos) y propagación moderada (las ondas mueren solas). */
  const CONFIG = {
    numNeuronas:     esMovil ? 16 : 34,
    maxConexiones:   3,       // axones máximos por neurona
    radioConexion:   esMovil ? 180 : 240, // distancia máx. para conectar (px)
    velPulso:        0.006,   // avance del pulso por frame (0→1)
    probPropagacion: 0.75,    // chance de seguir la cadena
    refractarioMs:   1600,    // pausa mínima entre disparos de una neurona
    disparoCadaMs:   900,     // marcapasos: disparo espontáneo aleatorio
    maxPulsos:       esMovil ? 25 : 60,
    curvatura:       0.22     // 0 = axones rectos, 0.4 = serpenteantes
  };

  let neuronas = [];
  let conexiones = [];
  let pulsos = [];
  let ancho = 0, alto = 0;
  let animando = false;
  let visible = true;
  let rafId = null;
  let ultimoDisparoGlobal = 0;

  /* ============ NEURONA ============
     Posición base fija + vaivén orgánico (suma de dos senos con
     frecuencias distintas → nunca se repite a la vista).
     `activacion` va de 0 (reposo) a 1 (disparo) y decae sola. */
  class Neurona {
    constructor(x, y) {
      this.baseX = x;
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.radio = 2.2 + Math.random() * 1.8;
      this.tipo = Math.random() < 0.7 ? "cyan" : "magenta"; // 70% cian
      this.activacion = 0;
      this.ultimoDisparo = -99999;
      this.fase1 = Math.random() * Math.PI * 2;
      this.fase2 = Math.random() * Math.PI * 2;
      this.vel1 = 0.004 + Math.random() * 0.004;
      this.vel2 = 0.006 + Math.random() * 0.005;
      this.amp = esMovil ? 6 : 10;
      this.vecinas = []; // { conexion, invertido }
    }

    actualizar() {
      this.fase1 += this.vel1;
      this.fase2 += this.vel2;
      this.x = this.baseX + Math.sin(this.fase1) * this.amp + Math.cos(this.fase2) * this.amp * 0.6;
      this.y = this.baseY + Math.cos(this.fase1) * this.amp * 0.7 + Math.sin(this.fase2) * this.amp * 0.5;
      this.activacion *= 0.96; // decaimiento exponencial hacia el reposo
    }

    disparar(ahora, esEco) {
      if (ahora - this.ultimoDisparo < CONFIG.refractarioMs) return;
      this.ultimoDisparo = ahora;
      this.activacion = 1;
      for (const v of this.vecinas) {
        if (pulsos.length >= CONFIG.maxPulsos) break;
        // Los "ecos" (disparos en cadena) propagan con menos
        // probabilidad → las ondas se apagan solas
        const prob = esEco ? CONFIG.probPropagacion * 0.6 : CONFIG.probPropagacion;
        if (Math.random() < prob) pulsos.push(new Pulso(v.conexion, v.invertido, this.tipo));
      }
    }

    dibujar() {
      const act = this.activacion;
      const rgb = paleta[this.tipo];

      // Halo: crece y brilla con la activación (mínimo siempre visible)
      const radioHalo = this.radio * (4 + act * 7);
      const alphaHalo = paleta.alphaHalo + act * 0.35;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radioHalo);
      grad.addColorStop(0, `rgba(${rgb}, ${alphaHalo.toFixed(3)})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radioHalo, 0, Math.PI * 2);
      ctx.fill();

      // Soma: casi blanco al disparar (efecto sobreexposición)
      const alphaSoma = 0.5 + act * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio + act * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = act > 0.5
        ? `rgba(${paleta.cabeza}, ${alphaSoma.toFixed(3)})`
        : `rgba(${rgb}, ${alphaSoma.toFixed(3)})`;
      ctx.fill();
    }
  }

  /* ============ CONEXIÓN (AXÓN) ============
     Curva Bézier cuadrática. El punto de control se desplaza
     perpendicular a la recta con un offset fijo por conexión →
     cada axón tiene su curvatura característica. Como las
     neuronas flotan, la curva se deforma orgánicamente. */
  class Conexion {
    constructor(a, b) {
      this.a = a;
      this.b = b;
      this.offset = (Math.random() - 0.5) * 2 * CONFIG.curvatura;
    }

    control() {
      const mx = (this.a.x + this.b.x) / 2;
      const my = (this.a.y + this.b.y) / 2;
      const dx = this.b.x - this.a.x;
      const dy = this.b.y - this.a.y;
      return { x: mx - dy * this.offset, y: my + dx * this.offset };
    }

    /* Punto sobre la curva: P(t) = (1-t)²·A + 2(1-t)t·C + t²·B */
    punto(t) {
      const c = this.control();
      const it = 1 - t;
      return {
        x: it * it * this.a.x + 2 * it * t * c.x + t * t * this.b.x,
        y: it * it * this.a.y + 2 * it * t * c.y + t * t * this.b.y
      };
    }

    dibujar() {
      // El axón se enciende un poco cuando alguna punta está activa
      const act = Math.max(this.a.activacion, this.b.activacion);
      const alpha = paleta.alphaAxon + act * 0.18;
      const c = this.control();
      ctx.strokeStyle = `rgba(${paleta[this.a.tipo]}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(this.a.x, this.a.y);
      ctx.quadraticCurveTo(c.x, c.y, this.b.x, this.b.y);
      ctx.stroke();
    }
  }

  /* ============ PULSO (IMPULSO ELÉCTRICO) ============
     Viaja por una conexión de t=0 a t=1. `invertido` = va de B
     hacia A (los axones son de ida y vuelta). Se dibuja como
     cometa: cabeza brillante + cola de puntos que se apagan. */
  class Pulso {
    constructor(conexion, invertido, tipo) {
      this.conexion = conexion;
      this.invertido = invertido;
      this.tipo = tipo;
      this.t = 0;
      this.vel = CONFIG.velPulso * (0.8 + Math.random() * 0.5);
      this.muerto = false;
    }

    actualizar(ahora) {
      this.t += this.vel;
      if (this.t >= 1) {
        this.muerto = true;
        const destino = this.invertido ? this.conexion.a : this.conexion.b;
        destino.disparar(ahora, true); // dispara en cadena como "eco"
      }
    }

    dibujar() {
      for (let i = 0; i < 5; i++) {
        const tCola = this.t - i * 0.025;
        if (tCola < 0) break;
        const tReal = this.invertido ? 1 - tCola : tCola;
        const p = this.conexion.punto(tReal);
        const alpha = (1 - i / 5) * 0.9;
        const radio = 2.2 - i * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radio, 0, Math.PI * 2);
        ctx.fillStyle = i === 0
          ? `rgba(${paleta.cabeza}, ${alpha.toFixed(3)})`
          : `rgba(${paleta[this.tipo]}, ${alpha.toFixed(3)})`;
        if (i === 0) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgb(${paleta[this.tipo]})`;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  /* ============ GENERACIÓN DE LA RED ============ */

  /* Grilla con jitter: cobertura pareja sin verse cuadriculado */
  function generarNeuronas() {
    neuronas = [];
    const n = CONFIG.numNeuronas;
    const cols = Math.ceil(Math.sqrt(n * (ancho / alto)));
    const filas = Math.ceil(n / cols);
    const cellW = ancho / cols;
    const cellH = alto / filas;

    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < cols; c++) {
        if (neuronas.length >= n) return;
        const x = c * cellW + cellW * (0.15 + Math.random() * 0.7);
        const y = f * cellH + cellH * (0.15 + Math.random() * 0.7);
        neuronas.push(new Neurona(x, y));
      }
    }
  }

  /* Conecta cada neurona con sus vecinas más cercanas, sin duplicar */
  function generarConexiones() {
    conexiones = [];
    const maxDistSq = CONFIG.radioConexion * CONFIG.radioConexion;

    for (let i = 0; i < neuronas.length; i++) {
      const candidatas = [];
      for (let j = 0; j < neuronas.length; j++) {
        if (i === j) continue;
        const dx = neuronas[i].baseX - neuronas[j].baseX;
        const dy = neuronas[i].baseY - neuronas[j].baseY;
        const dSq = dx * dx + dy * dy;
        if (dSq < maxDistSq) candidatas.push({ idx: j, dSq });
      }
      candidatas.sort((a, b) => a.dSq - b.dSq);

      let creadas = neuronas[i].vecinas.length;
      for (let k = 0; k < candidatas.length && creadas < CONFIG.maxConexiones; k++) {
        const j2 = candidatas[k].idx;
        if (j2 < i) continue; // ese par ya se evaluó → sin duplicados
        const con = new Conexion(neuronas[i], neuronas[j2]);
        conexiones.push(con);
        neuronas[i].vecinas.push({ conexion: con, invertido: false });
        neuronas[j2].vecinas.push({ conexion: con, invertido: true });
        creadas++;
      }
    }
  }

  /* ============ LOOP PRINCIPAL ============
     Orden de dibujo: axones → pulsos → neuronas.
     El canvas se limpia transparente: la aurora se ve detrás. */
  function dibujarFrame(ahora) {
    ctx.clearRect(0, 0, ancho, alto);

    for (const n of neuronas) n.actualizar();
    for (const c of conexiones) c.dibujar();

    for (let i = pulsos.length - 1; i >= 0; i--) {
      pulsos[i].actualizar(ahora);
      if (pulsos[i].muerto) pulsos.splice(i, 1);
      else pulsos[i].dibujar();
    }

    for (const n of neuronas) n.dibujar();

    // Marcapasos: cada disparoCadaMs una neurona al azar intenta encenderse
    if (ahora - ultimoDisparoGlobal > CONFIG.disparoCadaMs) {
      ultimoDisparoGlobal = ahora;
      const azar = neuronas[Math.floor(Math.random() * neuronas.length)];
      if (azar) azar.disparar(ahora, false);
    }
  }

  function loop(timestamp) {
    if (!animando) return;
    dibujarFrame(timestamp);
    rafId = window.requestAnimationFrame(loop);
  }

  function iniciar() {
    if (animando || REDUCE_MOTION) return;
    animando = true;
    rafId = window.requestAnimationFrame(loop);
  }

  function pausar() {
    animando = false;
    if (rafId) window.cancelAnimationFrame(rafId);
  }

  /* ============ REDIMENSIONADO ============
     DPR limitado a 2x: nítido en retina sin matar la GPU en
     móviles con DPR 3+. Dibujamos en coordenadas CSS. */
  function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.clientWidth;
    alto = canvas.clientHeight;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    esMovil = window.matchMedia("(max-width: 768px)").matches;
    CONFIG.numNeuronas = esMovil ? 16 : 34;
    CONFIG.radioConexion = esMovil ? 180 : 240;
    CONFIG.maxPulsos = esMovil ? 25 : 60;

    pulsos = [];
    generarNeuronas();
    generarConexiones();

    // Con movimiento reducido: un frame estático de la red en reposo
    if (REDUCE_MOTION) dibujarFrame(0);
  }

  /* Debounce: no regenerar la red 60 veces por segundo al arrastrar
     la ventana */
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redimensionar, 150);
  });

  /* Pausa cuando el hero sale de pantalla → ahorra batería/CPU */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entradas) => {
      visible = entradas[0].isIntersecting;
      if (visible) iniciar(); else pausar();
    }, { threshold: 0.05 }).observe(canvas);
  }

  /* Pausa con la pestaña en segundo plano */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausar();
    else if (visible) iniciar();
  });

  /* --- ARRANQUE ---
     Encendemos 2 neuronas de entrada así la red no nace "muerta"
     esperando el primer disparo del marcapasos */
  redimensionar();
  iniciar();
  setTimeout(() => {
    const ahora = performance.now();
    if (neuronas[0]) neuronas[0].disparar(ahora, false);
    const mitad = Math.floor(neuronas.length / 2);
    if (neuronas[mitad]) neuronas[mitad].disparar(ahora, false);
  }, 400);
})();
