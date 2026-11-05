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

  /* ---------- Personajes (imágenes dentro de la carpeta) ---------- */
  const CABALLERO = '<img class="caballero" src="nani.png" alt="Nani, el Caballero" width="318" height="280">';
  const HORNET = '<img class="hornet" src="hornet.png" alt="Hornet" width="339" height="310">';

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
      return `<li class="sombra"><span>${r.fantasia}</span><small>Por descubrir</small></li>`;
    }).join('');
    return interior('Mapa de Hallownest', 'Cada lugar deja un eco.',
      `<ul class="lista">${items}</ul>`);
  }
  function pantallaMisiones() {
    return interior('Misiones', 'Opcionales, para hacer el viaje más entretenido.',
      '<p class="aviso">Todavía no hay misiones a la vista.</p>');
  }
  function pantallaRecuerdos() {
    return interior('Recuerdos', 'Notas y fotografías de cada lugar.',
      '<p class="aviso">Aquí se guardarán los recuerdos del viaje.</p>');
  }
  function pantallaProgreso() {
    return interior('El camino recorrido', 'Lo que hemos descubierto juntos.',
      '<p class="aviso">El camino aún está por recorrer.</p>');
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
