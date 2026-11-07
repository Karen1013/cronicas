(function () {
  'use strict';
  const D = window.DATOS, PJ = window.PJ;
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  const velo = document.getElementById('velo');
  const aviso = document.getElementById('estado-red');
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let detener = null;
  let introEstaSesion = false;

  /* La aventura siempre empieza en la portada al abrir la app. */
  if (location.hash && location.hash !== '#/inicio') history.replaceState(null, '', location.pathname + location.search + '#/inicio');

  /* ======================= Progreso guardado ======================= */
  const nuevoEstado = () => ({ regiones: {}, fechas: {}, introVista: false, finalAnunciado: false, santuarioVisible: false, finalCompleto: false });
  let estado = nuevoEstado();
  const MH = 2400; // alto del mapa (el territorio final está debajo del Nevado)
  function guardar() { try { return Almacen.guardar('progreso', estado); } catch (e) {} }
  async function cargar() { try { const e = await Almacen.obtener('progreso'); if (e) estado = Object.assign(estado, e); } catch (e) {} }
  const reg = (id) => D.regiones.find((r) => r.id === id);
  function pendientes() {
    const o = D.orden.find((id) => !estado.regiones[id]); if (o) return [o];
    const l = D.libres.filter((id) => !estado.regiones[id]); if (l.length) return l;
    return (estado.santuarioVisible && !estado.regiones.santuario) ? ['santuario'] : [];
  }
  function estadoDe(id) { if (estado.regiones[id]) return estado.regiones[id]; return pendientes().indexOf(id) >= 0 ? 'disponible' : 'oculta'; }
  const TODAS = D.orden.concat(D.libres);
  const todosDescubiertos = () => TODAS.every((id) => estado.regiones[id]);
  function ultimoDescubierto() {
    let mejor = null, t = '';
    Object.keys(estado.fechas).forEach((id) => { if (estado.regiones[id] && estado.fechas[id] > t) { t = estado.fechas[id]; mejor = id; } });
    return mejor;
  }
  function crear(html) { const t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstElementChild; }

  /* ======================= Personajes: poses de la lámina original ======================= */
  // pj('senala', 200) dibuja la pose con ese ancho (número en px o una expresión CSS como 'min(60vw,240px)').
  function pj(id, W, clase) {
    const p = PJ.p[id], x = p[0], y = p[1], w = p[2], h = p[3];
    const ancho = typeof W === 'number' ? W + 'px' : W;
    return `<span class="pj ${clase || ''}" aria-hidden="true" style="--W:${ancho};--r:${h / w};--sx:${PJ.aw / w};--ox:${x / w};--oy:${y / w}"></span>`;
  }
  const pjAlto = (id, W) => W * PJ.p[id][3] / PJ.p[id][2];
  (function precarga() { const i = new Image(); i.decoding = 'async'; i.src = 'personajes.webp'; })();

  /* ======================= Portada ======================= */
  function particulas(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, activo = true;
    const p = [], chispas = [];
    function medir() { const d = Math.min(window.devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    medir();
    for (let i = 0; i < 34; i++) p.push({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.6, v: .08 + Math.random() * .2, f: Math.random() * 6.28 });
    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#bfe6ff';
      for (const s of p) {
        if (!reducir) { s.y -= s.v; if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; } }
        ctx.globalAlpha = .3 + .4 * Math.sin(t / 1300 + s.f); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#e9d29a';
      for (let i = chispas.length - 1; i >= 0; i--) {
        const c = chispas[i]; c.x += c.vx; c.y += c.vy; c.vida -= 1;
        if (c.vida <= 0) { chispas.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, c.vida / 30); ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.283); ctx.fill();
      }
      if (activo && (!reducir || chispas.length)) raf = requestAnimationFrame(dibujar);
    }
    function chispear(x, y) {
      for (let i = 0; i < 9; i++) chispas.push({ x: x, y: y, vx: (Math.random() - .5) * 1.6, vy: -.4 - Math.random() * 1.2, r: 1 + Math.random() * 1.8, vida: 50 + Math.random() * 30 });
      if (reducir) { cancelAnimationFrame(raf); raf = requestAnimationFrame(dibujar); }
    }
    window.addEventListener('resize', medir);
    raf = requestAnimationFrame(dibujar);
    return { parar: function () { activo = false; cancelAnimationFrame(raf); window.removeEventListener('resize', medir); }, chispear: chispear };
  }

  // Poses que se van alternando al tocar a los personajes (f = tamaño relativo según la forma de la pose)
  const POSES = [
    { id: 'corazones-pie', f: 1 }, { id: 'saltan', f: 1.02 }, { id: 'felices', f: 1.2 }, { id: 'abrazo-pie', f: .95 },
    { id: 'celebran', f: 1.2 }, { id: 'caminan-senala', f: 1.12 }, { id: 'abrazo-corazones', f: 1.2 }, { id: 'beso', f: 1.2 }, { id: 'contemplan', f: 1.3 }
  ];

  function pantallaInicio() {
    const P = D.portada;
    const el = crear(`<main class="portada">
      <canvas></canvas>
      <div class="burbuja" hidden></div>
      <div class="escena" style="--B:min(62vw,29dvh)" role="img" aria-label="Hornet y el Caballero"></div>
      <h1>${P.titulo}</h1>
      <p class="subtitulo">${P.subtitulo}</p>
      <div class="filete"></div>
      <p class="intro">«${P.intro}»</p>
      <button class="boton" type="button">${P.boton}</button>
    </main>`);
    const fx = particulas(el.querySelector('canvas'));
    detener = fx.parar;
    const escena = el.querySelector('.escena'), burbuja = el.querySelector('.burbuja');
    let n = 0, t1 = 0, t2 = 0;
    function poner(i) {
      const po = POSES[i % POSES.length];
      const viejos = Array.from(escena.querySelectorAll('.pose'));
      const nuevo = crear(pj(po.id, `calc(var(--B) * ${po.f})`, 'pose'));
      escena.appendChild(nuevo);
      requestAnimationFrame(function () { requestAnimationFrame(function () { nuevo.classList.add('ya'); viejos.forEach(function (v) { v.classList.remove('ya'); }); }); });
      setTimeout(function () { viejos.forEach(function (v) { v.remove(); }); }, 520);
    }
    poner(0);
    escena.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); n++; poner(n);
      escena.classList.remove('rebota'); void escena.offsetWidth; escena.classList.add('rebota');
      burbuja.textContent = '«' + P.hornetDice[(n - 1) % P.hornetDice.length] + '»'; burbuja.hidden = false; burbuja.classList.remove('sale');
      clearTimeout(t1); clearTimeout(t2);
      t1 = setTimeout(function () { burbuja.classList.add('sale'); }, 4600); t2 = setTimeout(function () { burbuja.hidden = true; }, 5000);
      const r = escena.getBoundingClientRect(), b = el.getBoundingClientRect(); fx.chispear(r.left + r.width / 2 - b.left, r.top - b.top + 30);
    });
    el.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; const b = el.getBoundingClientRect(); fx.chispear(e.clientX - b.left, e.clientY - b.top); });
    el.querySelector('button').addEventListener('click', comenzar);
    return el;
  }

  function comenzar() {
    if (reducir) { location.hash = '#/reino'; return; }
    velo.classList.add('activo');
    setTimeout(function () { location.hash = '#/reino'; setTimeout(function () { velo.classList.remove('activo'); }, 60); }, 520);
  }

  /* ======================= Ventanas ======================= */
  function cerrarModal(el, despues) {
    el.classList.add('saliendo');
    setTimeout(function () { el.remove(); if (despues) despues(); }, reducir ? 0 : 380);
  }
  function modal(contenedor, html, clase) {
    const q = contenedor.querySelector('.modal'); if (q) q.remove();
    const m = crear(`<div class="modal ${clase || ''}" role="dialog" aria-modal="true">${html}</div>`);
    contenedor.appendChild(m); return m;
  }
  const placa = (txt, id, extra) => `<button class="boton placa ${extra || ''}" type="button" data-acc="${id}">${txt}</button>`;
  // Panel con un personaje asomado arriba a la derecha
  function panelPj(id, W, contenido, clase) {
    const alto = pjAlto(id, W);
    return `<div class="panel con-pj ${clase || ''}" style="margin-top:${Math.round(alto - 26)}px"><div class="m-pj">${pj(id, W)}</div>${contenido}</div>`;
  }

  /* ======================= Reino (mapa) ======================= */
  function lineas(txt) {
    const p = txt.split(' '); if (txt.length < 17) return [txt];
    let mejor = 1, dif = 999;
    for (let i = 1; i < p.length; i++) { const a = p.slice(0, i).join(' ').length, b = p.slice(i).join(' ').length; if (Math.abs(a - b) < dif) { dif = Math.abs(a - b); mejor = i; } }
    return [p.slice(0, mejor).join(' '), p.slice(mejor).join(' ')];
  }
  const IMGS = { gris: null, color: null };
  function cargarMapa() {
    if (IMGS.gris && IMGS.color) return Promise.resolve();
    const carga = (src) => new Promise(function (ok, fallo) { const i = new Image(); i.decoding = 'async'; i.onload = function () { ok(i); }; i.onerror = fallo; i.src = src; });
    return Promise.all([carga('mapa-gris.webp'), carga('mapa-color.webp')]).then(function (r) { IMGS.gris = r[0]; IMGS.color = r[1]; });
  }

  function pantallaReino() {
    const el = crear(`<main class="reino">
      <div class="mapa-vista" id="vista">
        <div class="mapa-lienzo" id="lienzo">
          <canvas id="mapaCanvas" width="1600" height="4800"></canvas>
          <div class="nodos" id="nodos"></div>
        </div>
      </div>
      <button class="hud-hornet" id="hudHornet" type="button" aria-label="Preguntar a Hornet">${pj('hornet-senala', 74)}</button>
      <div class="zoom"><button type="button" id="zmas" aria-label="Acercar">+</button><button type="button" id="zmenos" aria-label="Alejar">−</button></div>
      <button class="btn-inicio" id="btnInicio" type="button" aria-label="Volver a la portada"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7 M6 10v9h12v-9"/></svg></button>
      <div class="admin-zona" id="adminZona"></div>
    </main>`);
    el._despues = function () { iniciarReino(el); };
    return el;
  }

  // Mariposas: se mueven solo con transform (suave y ligero)
  function rnd(sem) { let s = sem; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function mariposasMapa() {
    const R = rnd(31); let s = '';
    for (let i = 0; i < 16; i++) {
      const x = 190 + R() * 420, y = 2020 + R() * 250, dx = (R() - .5) * 90, dy = -20 - R() * 80, d = 6 + R() * 6, r = -R() * 6;
      s += `<div class="mar-pos" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px"><div class="mar" style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--d:${d.toFixed(1)}s;--r:${r.toFixed(1)}s"><b style="animation-delay:${(-R()).toFixed(2)}s"></b></div></div>`;
    }
    return s;
  }
  function mariposasSuben(cont, n) {
    const R = rnd(77); let s = '';
    for (let i = 0; i < n; i++) {
      s += `<div class="ms" style="left:${(4 + R() * 92).toFixed(0)}%;bottom:${(8 + R() * 40).toFixed(0)}%;--d:${(8 + R() * 7).toFixed(1)}s;--r:${(-R() * 12).toFixed(1)}s"><div class="mar" style="--dx:${((R() - .5) * 60).toFixed(0)}px;--dy:0px;--d:${(2.4 + R() * 2).toFixed(1)}s"><b style="animation-delay:${(-R()).toFixed(2)}s"></b></div></div>`;
    }
    cont.innerHTML = s;
  }

  function iniciarReino(el) {
    const vista = el.querySelector('#vista'), lienzo = el.querySelector('#lienzo'), cv = el.querySelector('#mapaCanvas'), nodos = el.querySelector('#nodos');
    const ctx = cv.getContext('2d'), S = 2, yLim = 1700 * S;
    const cam = { s: 1, x: 0, y: 0 };
    let minS = .3, maxS = 3, fitW = .5, nuevoId = null, progreso = 1, animando = false, tween = 0, listo = false, pend = false;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
    el.querySelector('#btnInicio').addEventListener('click', function () { location.hash = '#/inicio'; });
    const vistaGeneral = () => Math.min(fitW, vista.clientHeight / 1950);

    /* ---- dibujo del mapa: gris de base y color donde ya se descubrió ---- */
    function revelar(r, f) {
      const R = r.reveal * 1.25 * S * f; if (R < 2) return;
      const cx = r.x * S, cy = r.y * S, bx = Math.max(0, Math.floor(cx - R)), by = Math.max(0, Math.floor(cy - R));
      const w = Math.min(cv.width, Math.ceil(cx + R)) - bx, h = Math.min(cv.height, Math.ceil(cy + R)) - by;
      if (w < 1 || h < 1) return;
      tmp.width = w; tmp.height = h;
      tctx.drawImage(IMGS.color, bx, by, w, h, 0, 0, w, h);
      const g = tctx.createRadialGradient(cx - bx, cy - by, 0, cx - bx, cy - by, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.62, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tctx.globalCompositeOperation = 'destination-in'; tctx.fillStyle = g; tctx.fillRect(0, 0, w, h); tctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, bx, by);
    }
    function caminos(x0, y0, x1, y1) {
      const pendi = pendientes();
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.scale(S, S); ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.setLineDash([3, 11]);
      Object.keys(D.caminos).forEach(function (id) {
        const d = D.caminos[id]; if (!d) return;
        if (estado.regiones[id] && id !== nuevoId) { ctx.strokeStyle = 'rgba(201,170,112,.92)'; ctx.stroke(new Path2D(d)); }
        else if (pendi.indexOf(id) >= 0) { ctx.strokeStyle = 'rgba(155,201,216,.5)'; ctx.stroke(new Path2D(d)); }
      });
      ctx.restore();
    }
    function pintarCaja(x0, y0, x1, y1) {
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(cv.width, Math.ceil(x1)); y1 = Math.min(cv.height, Math.ceil(y1));
      if (!estado.santuarioVisible) y1 = Math.min(y1, yLim);   // el último territorio no existe hasta que la niebla lo revela
      if (x1 <= x0 || y1 <= y0) return;
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      ctx.drawImage(estado.finalCompleto ? IMGS.color : IMGS.gris, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      if (!estado.finalCompleto) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
        D.regiones.forEach(function (r) { if (estado.regiones[r.id]) revelar(r, r.id === nuevoId ? progreso : 1); });
        ctx.restore();
      }
      caminos(x0, y0, x1, y1);
    }
    const pintarTodo = () => { ctx.clearRect(0, 0, cv.width, cv.height); pintarCaja(0, 0, cv.width, cv.height); };

    /* ---- nodos, nombres, fichas y mariposas (HTML: suave al mover el mapa) ---- */
    function pintarNodos() {
      const ult = ultimoDescubierto(), pend = pendientes(), nr = ult ? reg(ult) : null;
      let s = '';
      D.regiones.forEach(function (r) {
        if (r.id === 'santuario' && !estado.santuarioVisible) return;
        const st = estadoDe(r.id);
        const etq = (st === 'descubierta' || st === 'completada') ? `<span class="etq" style="margin-left:${r.etq[0]}px;top:calc(50% + ${r.etq[1]}px)">${lineas(r.fantasia).join('<br>')}</span>` : '';
        s += `<button type="button" class="nodo ${st}${r.id === nuevoId ? ' descubriendo' : ''}" data-region="${r.id}" style="left:${r.x}px;top:${r.y}px" aria-label="${st === 'oculta' ? 'Región por descubrir' : r.fantasia}"><i class="halo"></i><i class="halo h2"></i><i class="rombo"></i>${st === 'completada' ? '<i class="emb"></i>' : ''}${etq}</button>`;
      });
      if (estado.regiones.santuario) s += mariposasMapa();
      s += `<div class="ficha" style="left:${nr ? nr.x - 52 : 362}px;top:${nr ? nr.y - 16 : 566}px">${pj('nani-pregunta', 86)}</div>`;
      if (pend.length) { const hr = reg(pend[0]); s += `<div class="ficha" style="left:${hr.x + 58}px;top:${hr.y - 16}px"><div class="bob">${pj('hornet-senala', 98)}</div></div>`; }
      nodos.innerHTML = s;
    }

    /* ---- cámara: se mueve con transform (acelerado por la tarjeta gráfica) ---- */
    function aplicar() {
      if (pend) return; pend = true;
      requestAnimationFrame(function () { pend = false; lienzo.style.transform = `translate3d(${cam.x}px,${cam.y}px,0) scale(${cam.s})`; });
    }
    function limitar() {
      const vw = vista.clientWidth, vh = vista.clientHeight, w = 800 * cam.s, h = MH * cam.s;
      cam.x = w <= vw ? (vw - w) / 2 : clamp(cam.x, vw - w, 0);
      cam.y = h <= vh ? (vh - h) / 2 : clamp(cam.y, vh - h, 0);
    }
    function zoomEn(px, py, f) { const ns = clamp(cam.s * f, minS, maxS), k = ns / cam.s; cam.x = px - (px - cam.x) * k; cam.y = py - (py - cam.y) * k; cam.s = ns; limitar(); aplicar(); }
    function irA(mx, my, s, ms) {
      cancelAnimationFrame(tween);
      const vw = vista.clientWidth, vh = vista.clientHeight, ns = clamp(s, minS, maxS);
      let tx = vw / 2 - mx * ns, ty = vh * .42 - my * ns;
      const w = 800 * ns, h = MH * ns;
      tx = w <= vw ? (vw - w) / 2 : clamp(tx, vw - w, 0); ty = h <= vh ? (vh - h) / 2 : clamp(ty, vh - h, 0);
      if (!ms || reducir) { cam.s = ns; cam.x = tx; cam.y = ty; aplicar(); return; }
      const a = { s: cam.s, x: cam.x, y: cam.y }, t0 = performance.now();
      (function paso(t) {
        const k = clamp((t - t0) / ms, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        cam.s = a.s + (ns - a.s) * e; cam.x = a.x + (tx - a.x) * e; cam.y = a.y + (ty - a.y) * e;
        lienzo.style.transform = `translate3d(${cam.x}px,${cam.y}px,0) scale(${cam.s})`;
        if (k < 1) tween = requestAnimationFrame(paso);
      })(t0);
    }
    function medir() { fitW = vista.clientWidth / 800; minS = Math.min(fitW, vista.clientHeight / 1950); maxS = fitW * 3.2; cam.s = clamp(cam.s, minS, maxS); limitar(); aplicar(); }
    cam.s = vista.clientWidth / 800; medir();
    let rt = 0; const alCambiar = function () { clearTimeout(rt); rt = setTimeout(medir, 120); };
    window.addEventListener('resize', alCambiar);
    const prev = detener; detener = function () { cancelAnimationFrame(tween); window.removeEventListener('resize', alCambiar); if (prev) prev(); };

    /* ---- gestos ---- */
    const ptrs = new Map(); let movido = 0, previo = null, t0 = null;
    vista.addEventListener('pointerdown', function (e) {
      if (animando) return;
      cancelAnimationFrame(tween); try { vista.setPointerCapture(e.pointerId); } catch (x) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = 0; previo = null;
      if (ptrs.size === 1) t0 = { t: Date.now() };
    });
    vista.addEventListener('pointermove', function (e) {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) { movido += Math.abs(dx) + Math.abs(dy); cam.x += dx; cam.y += dy; limitar(); aplicar(); }
      else if (ptrs.size === 2) {
        movido += 99; const v = Array.from(ptrs.values()), r = vista.getBoundingClientRect();
        const dist = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), mx = (v[0].x + v[1].x) / 2 - r.left, my = (v[0].y + v[1].y) / 2 - r.top;
        if (previo) { cam.x += mx - previo.mx; cam.y += my - previo.my; zoomEn(mx, my, dist / previo.dist); }
        previo = { dist: dist, mx: mx, my: my };
      }
    });
    function fin(e) {
      if (!ptrs.has(e.pointerId)) return;
      const era1 = ptrs.size === 1; ptrs.delete(e.pointerId); previo = null;
      if (era1 && movido < 12 && t0 && Date.now() - t0.t < 700 && e.type === 'pointerup') {
        const t = document.elementFromPoint(e.clientX, e.clientY), n = t && t.closest && t.closest('[data-region]');
        if (n) tocar(n.dataset.region);
      }
    }
    vista.addEventListener('pointerup', fin); vista.addEventListener('pointercancel', fin);
    vista.addEventListener('wheel', function (e) { e.preventDefault(); if (animando) return; cancelAnimationFrame(tween); const r = vista.getBoundingClientRect(); zoomEn(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : .89); }, { passive: false });
    el.querySelector('#zmas').addEventListener('click', function () { zoomEn(vista.clientWidth / 2, vista.clientHeight / 2, 1.4); });
    el.querySelector('#zmenos').addEventListener('click', function () { zoomEn(vista.clientWidth / 2, vista.clientHeight / 2, .72); });

    /* ---- acciones ---- */
    function enfocarGuia(ms) {
      const p = pendientes();
      if (p.length === 1) { const r = reg(p[0]); irA(r.x, r.y, fitW * (p[0] === 'santuario' ? 1.5 : 1.9), ms); } else irA(400, 480, fitW * 1.5, ms);
    }
    function tocar(id) {
      if (animando || !listo) return;
      const st = estadoDe(id);
      if (st === 'oculta') return ventanaBloqueada();
      if (st === 'disponible') return descubrir(id);
      ventanaInfo(id);
    }
    function pop(id, W, ms, texto) {
      const p = crear(`<div class="pop">${pj(id, W)}${texto ? `<p class="pop-txt">${texto}</p>` : ''}</div>`); el.appendChild(p);
      setTimeout(function () { p.classList.add('sale'); setTimeout(function () { p.remove(); }, 420); }, ms);
      return p;
    }
    function animarReveal(id, ms, cb) {
      const r = reg(id);
      if (reducir) { progreso = 1; pintarTodo(); return cb(); }
      let ini = null;
      (function paso(t) {
        if (ini === null) ini = t;
        const k = clamp((t - ini) / ms, 0, 1); progreso = 1 - Math.pow(1 - k, 3);
        const R = r.reveal * 1.25 * S * progreso + 4;
        pintarCaja(r.x * S - R, r.y * S - R, r.x * S + R, r.y * S + R);
        k < 1 ? requestAnimationFrame(paso) : cb();
      })(performance.now());
    }
    function descubrir(id) {
      const r = reg(id); animando = true; nuevoId = id; progreso = 0;
      estado.regiones[id] = 'descubierta'; estado.fechas[id] = new Date().toISOString(); guardar();
      pintarNodos();
      irA(r.x, r.y, Math.max(cam.s, fitW * 1.8), 900);
      pop('celebran', 'min(74vw,270px)', 1900, D.dialogos.descubrimiento);
      animarReveal(id, id === 'santuario' ? 2400 : 1300, function () { nuevoId = null; progreso = 1; animando = false; pintarTodo(); pintarNodos(); setTimeout(function () { ventanaPista(id); }, 260); });
    }

    /* ---- ventanas ---- */
    function ventanaIntro(fraseId) {
      const m = modal(el, `<div class="intro-pj">${pj('caminan-senala', 'min(74vw,300px)')}</div><div class="panel"><p class="dialogo">«${D.dialogos[fraseId]}»</p>${placa('¡Sigue a Hornet!', 'seguir')}</div>`, 'm-intro');
      m.querySelector('[data-acc="seguir"]').addEventListener('click', function () {
        if (fraseId === 'intro1') { estado.introVista = true; guardar(); }
        cerrarModal(m, function () { enfocarGuia(1100); });
      });
    }
    function ventanaBloqueada() {
      const m = modal(el, panelPj('cruzados', 170, `<p class="dialogo">«${D.dialogos.bloqueada}»</p>${placa('ENTENDIDO', 'ok')}`));
      m.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m); });
    }
    function infoRegion(r) {
      const ps = r.pista.split('\n\n').map(function (t, i, v) { return `<p class="pista">${i === 0 ? '«' : ''}${t}${i === v.length - 1 ? '»' : ''}</p>`; }).join('');
      return `<p class="eco">${r.titulo}</p><h2>${r.fantasia}</h2>${ps}<p class="nombre-real">(${r.real})</p>`;
    }
    function ventanaPista(id) {
      const r = reg(id);
      if (id === 'santuario') {
        const m = modal(el, `<div class="panel largo alto"><div class="dialogo-largo"><div class="ilustracion"><div class="foto" style="background-image:url(santuario-escena.webp)"></div></div><p class="sello">TERRITORIO DESCUBIERTO</p>${infoRegion(r)}</div>${placa('CONTINUAR', 'sigue')}</div>`);
        m.querySelector('[data-acc="sigue"]').addEventListener('click', function () { cerrarModal(m, function () { escenaFinal(false); }); });
        return;
      }
      const m = modal(el, panelPj('hornet-senala', 118, `<p class="sello">REGIÓN DESCUBIERTA</p>${infoRegion(r)}${placa('CONTINUAR CAMINO', 'sigue')}`));
      m.querySelector('[data-acc="sigue"]').addEventListener('click', function () {
        cerrarModal(m, function () { if (todosDescubiertos() && !estado.finalAnunciado) ventanaFinalAnuncio(); else enfocarGuia(1100); });
      });
    }
    function ventanaInfo(id) {
      const r = reg(id), st = estadoDe(id), k = .9, esS = id === 'santuario';
      const ilus = esS ? '<div class="ilustracion"><div class="foto" style="background-image:url(santuario-escena.webp)"></div></div>' : `<div class="ilustracion"><div class="crop" style="--x:${r.x * k}px;--y:${r.y * k}px"></div></div>`;
      const botones = esS
        ? placa(estado.finalCompleto ? 'VOLVER A LEER LA CARTA' : 'CONTINUAR', 'carta') + placa('CERRAR', 'cerrar', 'suave')
        : placa(st === 'completada' ? 'DESMARCAR' : 'MARCAR COMO EXPLORADA', 'toggle') + placa('CERRAR', 'cerrar', 'suave');
      const m = modal(el, `<div class="panel largo alto"><div class="dialogo-largo">${ilus}${infoRegion(r)}<p class="estado ${st}">${st === 'completada' ? '◆ Explorada' : '◇ Descubierta'}</p></div><div class="fila">${botones}</div></div>`);
      m.querySelector('[data-acc="cerrar"]').addEventListener('click', function () { cerrarModal(m); });
      if (esS) { m.querySelector('[data-acc="carta"]').addEventListener('click', function () { cerrarModal(m, function () { escenaFinal(!!estado.finalCompleto); }); }); return; }
      m.querySelector('[data-acc="toggle"]').addEventListener('click', function () {
        estado.regiones[id] = st === 'completada' ? 'descubierta' : 'completada'; guardar(); pintarNodos();
        if (estado.regiones[id] === 'completada') cerrarModal(m, function () { pop('saltan', 'min(60vw,220px)', 1900, D.dialogos.completada); });
        else cerrarModal(m);
      });
    }
    /* Escena: Hornet y el Caballero anuncian el último territorio */
    function ventanaFinalAnuncio() {
      const ps = D.finalAnuncio.map(function (t, i, v) {
        const txt = (i === 0 ? '«' : '') + t + (i === v.length - 1 ? '»' : '');
        return `<p style="animation-delay:${(0.5 + i * 0.7).toFixed(1)}s">${txt}</p>`;
      }).join('');
      const m = modal(el, `<div class="dos-pj"><div class="flota">${pj('hornet-senala', 'min(36vw,150px)')}</div><div class="flota f2">${pj('nani-pregunta', 'min(31vw,130px)')}</div></div>
        <div class="panel largo"><p class="sello">ÚLTIMO CAMINO</p><div class="dialogo-largo">${ps}</div>${placa('Sigue a Hornet', 'seguir')}</div>`, 'm-final');
      m.querySelector('[data-acc="seguir"]').addEventListener('click', function () { cerrarModal(m, secuenciaSantuario); });
    }

    /* Desplazamiento hacia abajo, niebla y nubes, y aparición del último territorio */
    function secuenciaSantuario() {
      animando = true;
      const nb = crear('<div class="niebla"><div class="nb-base"></div><div class="capa c1"></div><div class="capa c2"></div><div class="capa c3"></div></div>');
      el.appendChild(nb);
      irA(400, 2060, fitW * 1.5, reducir ? 0 : 3800);
      setTimeout(function () { nb.classList.add('cubre'); }, reducir ? 0 : 700);
      setTimeout(function () {
        estado.finalAnunciado = true; estado.santuarioVisible = true; guardar();
        pintarTodo(); pintarNodos(); nb.classList.remove('cubre'); nb.classList.add('despeja');
      }, reducir ? 100 : 4800);
      setTimeout(function () { nb.remove(); animando = false; pop('caminan-senala', 'min(70vw,260px)', 2400); }, reducir ? 400 : 8800);
    }

    /* Escena de descanso + carta de despedida */
    function escenaFinal(soloLeer) {
      const parrafos = D.carta.slice(0, -2).map(function (t, i) { return `<p style="animation-delay:${(0.5 + i * 0.6).toFixed(1)}s">${t}</p>`; }).join('');
      const n = D.carta.length;
      const firma = `<p class="firma" style="animation-delay:${(0.5 + (n - 2) * 0.6).toFixed(1)}s">${D.carta[n - 2]}<br><span>${D.carta[n - 1]}</span></p>`;
      const e = crear(`<div class="escena-final">
        <div class="ef-fondo"></div><div class="ef-calida"></div><div class="ef-mar"></div>
        <div class="ef-pj"><div class="flota">${pj('contemplan', 'min(86vw,350px)')}</div></div>
        <button class="boton placa ef-abrir" type="button" data-acc="abrir">ABRIR LA CARTA</button>
        <div class="ef-carta"><div class="ef-texto">${parrafos}${firma}</div><button class="boton placa" type="button" data-acc="cierra">${soloLeer ? 'CERRAR LA CARTA' : 'CONTINUAR'}</button></div>
      </div>`);
      el.appendChild(e);
      mariposasSuben(e.querySelector('.ef-mar'), 22);
      requestAnimationFrame(function () { requestAnimationFrame(function () { e.classList.add('visible'); }); });
      const abrir = function () { e.classList.add('con-carta'); e.querySelector('.ef-abrir').classList.add('oculto'); };
      e.querySelector('[data-acc="abrir"]').addEventListener('click', abrir);
      setTimeout(function () { e.classList.add('listo'); if (soloLeer) abrir(); }, reducir ? 0 : (soloLeer ? 900 : 3400));
      e.querySelector('[data-acc="cierra"]').addEventListener('click', function () {
        if (soloLeer) { e.classList.remove('visible'); setTimeout(function () { e.remove(); }, 900); } else ultimoEco(e);
      });
    }

    /* El último eco: la mariposa luminosa y el mapa completamente iluminado */
    function ultimoEco(e) {
      e.classList.remove('con-carta'); e.classList.add('eco');
      const luz = crear('<div class="luz-mar"><i class="halo-luz"></i><div class="esc"><div class="mar"><b></b></div></div></div>'); e.appendChild(luz);
      for (let i = 0; i < 7; i++) e.appendChild(crear(`<div class="luz-comp" style="--ox:${((i % 2 ? 1 : -1) * (14 + i * 9))}px;animation-delay:${(0.9 + i * 0.35).toFixed(2)}s"><div class="mar"><b style="animation-delay:${(-i * .13).toFixed(2)}s"></b></div></div>`));
      const t0 = reducir ? 300 : 4200;
      setTimeout(function () {
        e.classList.add('sale'); animando = true;
        irA(400, 1325, vistaGeneral(), reducir ? 0 : 3800);
        iluminarMapa();
      }, t0);
      setTimeout(function () { e.remove(); animando = false; mostrarSello(); }, t0 + (reducir ? 200 : 3400));
    }
    function iluminarMapa() {
      const ov = document.createElement('img'); ov.src = 'mapa-color.webp'; ov.className = 'ov-color'; ov.alt = ''; lienzo.insertBefore(ov, nodos);
      requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add('on'); }); });
      setTimeout(function () { estado.finalCompleto = true; guardar(); pintarTodo(); ov.remove(); }, reducir ? 100 : 4000);
    }
    function mostrarSello() {
      if (el.querySelector('.sello-final')) return;
      const s = crear(`<div class="sello-final"><p class="frase">«${D.fraseFinal}»</p><p class="titulo-app">${D.tituloFinal}</p><button type="button" class="x" aria-label="Ocultar mensaje">×</button></div>`);
      el.appendChild(s);
      s.querySelector('.x').addEventListener('click', function () { s.classList.add('oculto'); setTimeout(function () { s.remove(); }, 600); });
    }

    function ventanaGuia() {
      if (todosDescubiertos() && !estado.finalAnunciado) return ventanaFinalAnuncio();
      const p = pendientes();
      if (estado.finalCompleto) {
        const m = modal(el, panelPj('hornet-senala', 118, `<p class="dialogo">«${D.dialogos.fin}»</p>${placa('VOLVER A LEER LA CARTA', 'carta')}${placa('ENTENDIDO', 'ok', 'suave')}`));
        m.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m); });
        m.querySelector('[data-acc="carta"]').addEventListener('click', function () { cerrarModal(m, function () { escenaFinal(true); }); });
        return;
      }
      const m = modal(el, panelPj('hornet-senala', 118, `<p class="dialogo">«${p.length ? D.dialogos.guia : D.dialogos.fin}»</p>${placa('ENTENDIDO', 'ok')}`));
      m.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m, function () { if (p.length) enfocarGuia(1100); }); });
    }
    el.querySelector('#hudHornet').addEventListener('click', ventanaGuia);

    /* ---- administración discreta: mantén pulsada la esquina superior izquierda ---- */
    (function () {
      const z = el.querySelector('#adminZona'); let t = 0;
      const ini = function () { t = setTimeout(abrir, 1400); }, parar = function () { clearTimeout(t); };
      z.addEventListener('pointerdown', ini); z.addEventListener('pointerup', parar); z.addEventListener('pointerleave', parar); z.addEventListener('pointercancel', parar);
      function abrir() {
        const NOM = { oculta: 'Oculta', disponible: 'Oculta', descubierta: 'Descubierta', completada: 'Completada' };
        function filas() { return D.regiones.filter((r) => r.id !== 'santuario').map((r) => `<div class="adm-fila"><span>${r.real}</span><button type="button" class="boton placa suave mini" data-id="${r.id}">${NOM[estadoDe(r.id)]}</button></div>`).join(''); }
        const m = modal(el, `<div class="panel admin"><h2>Administración</h2><p class="pista">Toca una región para cambiar su estado: oculta → descubierta → completada.</p>
          <div id="admLista">${filas()}</div><div class="fila">${placa('DESCUBRIR TODAS (PRUEBA)', 'todas', 'suave')}${placa('REPETIR LA SECUENCIA FINAL', 'final', 'suave')}${placa('REPETIR MENSAJE INICIAL', 'intro', 'suave')}${placa('REINICIAR TODO', 'reset', 'suave')}${placa('CERRAR', 'cerrar')}</div></div>`);
        m.addEventListener('click', function (e) {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.id) {
            const id = b.dataset.id, st = estado.regiones[id];
            if (!st) { estado.regiones[id] = 'descubierta'; estado.fechas[id] = new Date().toISOString(); } else if (st === 'descubierta') estado.regiones[id] = 'completada'; else { delete estado.regiones[id]; delete estado.fechas[id]; }
            guardar(); pintarTodo(); pintarNodos(); m.querySelector('#admLista').innerHTML = filas();
          } else if (b.dataset.acc === 'todas') { TODAS.forEach(function (id) { if (!estado.regiones[id]) { estado.regiones[id] = 'descubierta'; estado.fechas[id] = new Date().toISOString(); } }); guardar(); pintarTodo(); pintarNodos(); m.querySelector('#admLista').innerHTML = filas(); b.textContent = 'LISTO'; }
          else if (b.dataset.acc === 'final') {
            estado.finalAnunciado = false; estado.santuarioVisible = false; estado.finalCompleto = false; delete estado.regiones.santuario; delete estado.fechas.santuario; guardar();
            pintarTodo(); pintarNodos(); const s = el.querySelector('.sello-final'); if (s) s.remove();
            cerrarModal(m, function () { if (todosDescubiertos()) ventanaFinalAnuncio(); });
          }
          else if (b.dataset.acc === 'intro') { estado.introVista = false; guardar(); b.textContent = 'LISTO'; }
          else if (b.dataset.acc === 'reset') {
            if (b.dataset.seguro) { estado = nuevoEstado(); guardar(); pintarTodo(); pintarNodos(); const s = el.querySelector('.sello-final'); if (s) s.remove(); m.querySelector('#admLista').innerHTML = filas(); b.textContent = 'REINICIADO'; delete b.dataset.seguro; }
            else { b.dataset.seguro = '1'; b.textContent = 'TOCA OTRA VEZ PARA CONFIRMAR'; }
          } else if (b.dataset.acc === 'cerrar') cerrarModal(m);
        });
      }
    })();

    /* ---- arranque ---- */
    pintarNodos();
    cargarMapa().then(function () {
      if (!el.isConnected) return;
      pintarTodo(); listo = true; cv.classList.add('lista');
      if (estado.finalCompleto) { irA(400, 1325, vistaGeneral(), 0); setTimeout(mostrarSello, 900); }
      else if (estado.regiones.santuario) { setTimeout(function () { escenaFinal(false); }, 650); }
      else if (todosDescubiertos() && !estado.finalAnunciado) { setTimeout(ventanaFinalAnuncio, reducir ? 0 : 650); }
      else if (!introEstaSesion && pendientes().length) { introEstaSesion = true; setTimeout(function () { ventanaIntro(estado.introVista ? 'intro2' : 'intro1'); }, reducir ? 0 : 650); }
      else if (pendientes().length) enfocarGuia(0);
    });
  }

  /* ======================= Pantallas en construcción ======================= */
  function enConstruccion(titulo, lema) {
    return crear(`<main class="interior"><h2>${titulo}</h2><p class="lema">${lema}</p>
      <div class="panel solo"><p class="pista">Esta sección todavía no está construida. Va después del mapa, en el orden que acordamos.</p></div></main>`);
  }
  const rutas = {
    inicio: pantallaInicio, reino: pantallaReino,
    recuerdos: function () { return enConstruccion('Ecos de un viaje', 'Cada lugar deja algo que merece ser recordado.'); },
    actividades: function () { return enConstruccion('Pequeñas cosas por descubrir', 'Porque los mejores recuerdos no siempre están escritos en el mapa.'); },
    cronicas: function () { return enConstruccion('El camino recorrido', 'Lo que hemos descubierto juntos.'); }
  };

  /* ======================= Navegación ======================= */
  function rutaActual() { return (location.hash.replace(/^#\/?/, '') || 'inicio').split('/')[0]; }
  function mostrar() {
    let r = rutaActual(); if (r === 'mapa') r = 'reino'; if (!rutas[r]) r = 'inicio';
    if (detener) { detener(); detener = null; }
    app.innerHTML = '';
    const el = rutas[r]();
    el.classList.add('pantalla', 'p-' + r);
    app.appendChild(el);
    nav.hidden = (r === 'inicio');
    document.body.classList.toggle('en-reino', r === 'reino');
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('activo', a.dataset.ruta === r); });
    window.scrollTo(0, 0);
    if (el._despues) el._despues();
  }
  function actualizarRed() { aviso.hidden = navigator.onLine; }
  window.addEventListener('online', actualizarRed); window.addEventListener('offline', actualizarRed);
  window.addEventListener('hashchange', mostrar);
  actualizarRed(); cargar().then(mostrar);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
