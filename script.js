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