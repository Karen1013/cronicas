(function () {
  'use strict';
  const D = window.DATOS;
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  const velo = document.getElementById('velo');
  const aviso = document.getElementById('estado-red');
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let detenerParticulas = null;

  function crear(html) {
    const t = document.createElement('div');
    t.innerHTML = html.trim();
    return t.firstElementChild;
  }

  /* ---------- Personajes temporales (se reemplazan por tus PNG/WebP) ---------- */
  const CABALLERO = `<svg class="caballero" viewBox="0 0 120 170" role="img" aria-label="El Caballero">
    <path d="M60 78 L16 164 L104 164 Z" fill="#05070d" stroke="#2b3b5e" stroke-width="2"/>
    <path d="M34 36 Q22 6 44 12 M86 36 Q98 6 76 12" fill="none" stroke="#ece6d6" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="60" cy="58" rx="33" ry="30" fill="#ece6d6"/>
    <ellipse cx="48" cy="58" rx="8" ry="11" fill="#0a0f1f"/><ellipse cx="72" cy="58" rx="8" ry="11" fill="#0a0f1f"/>
  </svg>`;
  const HORNET = `<svg class="hornet" viewBox="0 0 120 170" role="img" aria-label="Hornet">
    <path d="M60 78 L22 164 L98 164 Z" fill="#b3262e" stroke="#6e1218" stroke-width="2"/>
    <path d="M44 34 Q50 4 52 -2 M76 34 Q70 4 68 -2" fill="none" stroke="#ece6d6" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="60" cy="58" rx="26" ry="28" fill="#ece6d6"/>
    <ellipse cx="50" cy="62" rx="7" ry="9" fill="#0a0f1f"/><ellipse cx="70" cy="62" rx="7" ry="9" fill="#0a0f1f"/>
    <line x1="108" y1="40" x2="92" y2="164" stroke="#b9b4a6" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

  /* ---------- Partículas suaves ---------- */
  function particulas(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0;
    const p = [];
    function medir() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * d; canvas.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    medir();
    for (let i = 0; i < 38; i++) p.push({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.7, v: .08 + Math.random() * .22, f: Math.random() * 6.28 });
    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of p) {
        if (!reducir) { s.y -= s.v; if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; } }
        ctx.globalAlpha = .3 + .4 * Math.sin(t / 1300 + s.f);
        ctx.fillStyle = '#bfe6ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (!reducir) raf = requestAnimationFrame(dibujar);
    }
    window.addEventListener('resize', medir);
    dibujar(0);
    return function () { cancelAnimationFrame(raf); window.removeEventListener('resize', medir); };
  }

  /* ---------- Pantallas ---------- */
  function pantallaInicio() {
    const P = D.portada;
    const el = crear(`<main class="portada">
      <canvas></canvas>
      <div class="personajes">${CABALLERO}${HORNET}</div>
      <h1>${P.titulo}</h1>
      <p class="subtitulo">${P.subtitulo}</p>
      <div class="filete"></div>
      <p class="intro">«${P.intro}»</p>
      <button class="boton" type="button">${P.boton}</button>
    </main>`);
    detenerParticulas = particulas(el.querySelector('canvas'));
    el.querySelector('button').addEventListener('click', comenzar);
    return el;
  }

  function comenzar() {
    if (reducir) { location.hash = '#/mapa'; return; }
    velo.classList.add('activo');
    setTimeout(function () {
      location.hash = '#/mapa';
      requestAnimationFrame(function () { velo.classList.remove('activo'); });
    }, 650);
  }

  function interior(titulo, lema, cuerpo) {
    return crear(`<main class="interior"><h2>${titulo}</h2><p class="lema">${lema}</p>${cuerpo}</main>`);
  }

  function pantallaMapa() {
    const items = D.regiones.map(function (r) {
      return `<li><span class="sombra">Región por descubrir</span><small>${r.zona}</small></li>`;
    }).join('');
    return interior('Mapa de Hallownest', 'Cada lugar deja un eco.',
      `<ul class="lista">${items}</ul>
       <p class="aviso">El mapa ilustrado y Hornet llegan en la Etapa 3. Por ahora esta es la estructura.</p>`);
  }
  function pantallaMisiones() {
    return interior('Misiones', 'Opcionales, para hacer el viaje más entretenido.',
      '<p class="aviso">Las misiones llegan en la Etapa 5.</p>');
  }
  function pantallaRecuerdos() {
    return interior('Recuerdos', 'Notas y fotografías de la bitácora.',
      '<p class="aviso">La bitácora llega en la Etapa 5.</p>');
  }
  function pantallaProgreso() {
    return interior('El camino recorrido', 'Lo que hemos descubierto juntos.',
      '<p class="aviso">La pantalla de progreso llega en la Etapa 5.</p>');
  }

  const rutas = { inicio: pantallaInicio, mapa: pantallaMapa, misiones: pantallaMisiones, recuerdos: pantallaRecuerdos, progreso: pantallaProgreso };

  /* ---------- Navegación ---------- */
  function rutaActual() { return (location.hash.replace(/^#\/?/, '') || 'inicio').split('/')[0]; }

  function mostrar() {
    let r = rutaActual();
    if (!rutas[r]) r = 'inicio';
    if (detenerParticulas) { detenerParticulas(); detenerParticulas = null; }
    app.innerHTML = '';
    const el = rutas[r]();
    el.classList.add('pantalla');
    app.appendChild(el);
    nav.hidden = (r === 'inicio');
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('activo', a.dataset.ruta === r); });
    window.scrollTo(0, 0);
  }

  /* ---------- Indicador sin conexión ---------- */
  function actualizarRed() { aviso.hidden = navigator.onLine; }
  window.addEventListener('online', actualizarRed);
  window.addEventListener('offline', actualizarRed);

  window.addEventListener('hashchange', mostrar);
  actualizarRed();
  mostrar();

  /* ---------- Service Worker (funciona al estar publicada en https) ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
