/* ==========================================================================
   EST.lab · Portafolio v3 · app.js
   Conserva todo lo que hacía la v2 (tema, menú accesible, sección activa,
   revelados, formulario Web3Forms, copiar correo, toasts, año) y quita lo
   decorativo que competía con la lectura (cursor custom, tilt, parallax,
   botones magnéticos). Sin dependencias.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEME_KEY = 'est-theme';

  /* ---------- Tema claro / oscuro ---------- */
  function applyTheme(theme, persist = true) {
    root.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* modo privado */ } }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F3F1EC' : '#0B0C0F');
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'light'));
      btn.setAttribute('aria-label', theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro');
    }
  }
  function initTheme() {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current, false);
    document.getElementById('themeBtn')?.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  }

  /* ---------- Navegación: fondo al hacer scroll + sección activa ---------- */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle('is-stuck', window.scrollY > 16);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = [...document.querySelectorAll('[data-nav-link]')];
    const ids = [...new Set(links.map((a) => a.getAttribute('href').slice(1)))];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) return;

    const setActive = (id) => links.forEach((a) =>
      a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));

    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, .25, .5] });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Menú móvil (con trampa de foco y Escape) ---------- */
  function initMenu() {
    const burger = document.querySelector('.nav__burger');
    const panel = document.getElementById('navPanel');
    if (!burger || !panel) return;
    const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')];
    const isOpen = () => panel.classList.contains('is-open');

    function open() {
      panel.classList.add('is-open');
      panel.removeAttribute('inert');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Cerrar menú');
      document.body.classList.add('is-locked');
      // Esperar un frame: el panel recién pasa a visible y todavía no es enfocable.
      requestAnimationFrame(() => focusables()[0]?.focus({ preventScroll: true }));
    }
    function close(restore = true) {
      panel.classList.remove('is-open');
      panel.setAttribute('inert', '');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('is-locked');
      if (restore) burger.focus({ preventScroll: true });
    }

    burger.addEventListener('click', () => (isOpen() ? close() : open()));
    // Al elegir una sección: primero se libera el scroll del body y recién
    // después se navega; si no, el desplazamiento queda corto.
    panel.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      e.preventDefault();
      close(false);
      const target = document.getElementById(link.getAttribute('href').slice(1));
      requestAnimationFrame(() => {
        target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        history.pushState(null, '', link.getAttribute('href'));
      });
    });
    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches && isOpen()) close(false); });
  }

  /* ---------- Revelados al hacer scroll ---------- */
  function initReveal() {
    root.dataset.revealReady = '1';
    if (reduceMotion || !('IntersectionObserver' in window)) { root.classList.remove('js-reveal'); return; }

    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      [...group.querySelectorAll('[data-reveal]')].forEach((el, i) => el.style.setProperty('--i', String(Math.min(i, 6))));
    });

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

    // Si se llega por un ancla (ej. #caso-gestor), mostrar ese bloque de inmediato.
    const revealTarget = () => {
      const t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!t) return;
      t.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      if (t.matches('[data-reveal]')) t.classList.add('is-in');
    };
    window.addEventListener('hashchange', revealTarget);
    revealTarget();
  }

  /* ---------- Toasts ---------- */
  function toast(type, text, ms = 3600) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = text;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, ms);
  }

  /* ---------- Formulario de contacto (Web3Forms) ---------- */
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Escribí tu nombre (mínimo 2 letras).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Revisá el correo: falta el @ o el dominio.',
    project: (v) => v !== '' || 'Elegí un motivo.',
    message: (v) => v.trim().length >= 10 || 'Contame un poco más: al menos 10 caracteres.',
  };

  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const key = form.dataset.accessKey;
    const done = document.getElementById('formDone');
    const submit = form.querySelector('.form__submit');
    const label = submit?.querySelector('.btn__label');
    const idle = label?.textContent ?? 'Enviar';

    const setError = (input, msg) => {
      const field = input.closest('.field');
      field?.classList.toggle('has-error', !!msg);
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      const out = field?.querySelector('.field__error');
      if (out) out.textContent = msg || '';
    };
    const validate = (input) => {
      const rule = rules[input.name];
      if (!rule) return true;
      const res = rule(input.value);
      setError(input, res === true ? '' : res);
      return res === true;
    };

    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('blur', () => { if (input.value.trim()) validate(input); });
      input.addEventListener('input', () => { if (input.closest('.field')?.classList.contains('has-error')) validate(input); });
    });

    const loading = (on) => {
      if (!submit) return;
      submit.classList.toggle('is-loading', on);
      submit.disabled = on;
      submit.setAttribute('aria-busy', String(on));
      if (label) label.textContent = on ? 'Enviando…' : idle;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.elements.botcheck?.checked) return;
      let firstBad = null;
      Object.keys(rules).forEach((name) => {
        const input = form.elements[name];
        if (input && !validate(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { toast('error', 'Revisá los campos marcados.'); firstBad.focus(); return; }
      if (!key) { toast('error', 'Falta configurar la clave del formulario.'); return; }

      loading(true);
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: key,
            subject: 'Nuevo mensaje desde tu portafolio',
            from_name: 'Portafolio · Emiliano',
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            project_type: form.elements.project.value,
            message: form.elements.message.value.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          form.hidden = true;
          form.reset();
          if (done) { done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); }
        } else {
          loading(false);
          toast('error', data.message || 'No se pudo enviar. Probá de nuevo en un momento.');
        }
      } catch {
        loading(false);
        toast('error', 'No hay conexión con el servidor. Intentá otra vez.');
      }
    });
  }

  /* ---------- Copiar correo ---------- */
  function initCopy() {
    const btn = document.getElementById('copyEmail');
    const text = document.getElementById('emailText');
    if (!btn || !text) return;
    btn.addEventListener('click', async () => {
      const value = text.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
        toast('ok', 'Correo copiado');
        btn.textContent = 'Copiado';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1800);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(text);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        toast('info', 'Copialo con Ctrl+C · ya está seleccionado');
      }
    });
  }

  function init() {
    initTheme();
    initNav();
    initMenu();
    initReveal();
    initForm();
    initCopy();
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
