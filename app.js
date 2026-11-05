(function () {
  'use strict';
  const D = window.DATOS;
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  const velo = document.getElementById('velo');
  const aviso = document.getElementById('estado-red');
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let detener = null;          // limpia lo que la pantalla actual haya dejado corriendo
  let introEstaSesion = false; // el mensaje de Hornet se muestra una vez por apertura

  /* ======================= Progreso guardado ======================= */
  let estado = { regiones: {}, fechas: {}, introVista: false };
  function guardar() { try { return Almacen.guardar('progreso', estado); } catch (e) {} }
  async function cargar() {
    try { const e = await Almacen.obtener('progreso'); if (e) estado = Object.assign(estado, e); } catch (e) {}
  }
  const reg = (id) => D.regiones.find((r) => r.id === id);
  function pendientes() {
    const o = D.orden.find((id) => !estado.regiones[id]);
    return o ? [o] : D.libres.filter((id) => !estado.regiones[id]);
  }
  function estadoDe(id) {
    if (estado.regiones[id]) return estado.regiones[id];
    return pendientes().indexOf(id) >= 0 ? 'disponible' : 'oculta';
  }
  function ultimoDescubierto() {
    let mejor = null, t = '';
    Object.keys(estado.fechas).forEach((id) => { if (estado.regiones[id] && estado.fechas[id] > t) { t = estado.fechas[id]; mejor = id; } });
    return mejor;
  }

  function crear(html) { const t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstElementChild; }
  const IMG = {
    nani: '<img class="caballero" src="nani.png" alt="Nani, el Caballero" width="516" height="586">',
    hornet: '<img class="hornet" src="hornet.png" alt="Hornet" width="539" height="647">'
  };

  /* ======================= Portada ======================= */
  function particulas(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0;
    const p = [], chispas = [];
    function medir() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    medir();
    for (let i = 0; i < 38; i++) p.push({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.7, v: .08 + Math.random() * .22, f: Math.random() * 6.28 });
    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of p) {
        if (!reducir) { s.y -= s.v; if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; } }
        ctx.globalAlpha = .3 + .4 * Math.sin(t / 1300 + s.f);
        ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      for (let i = chispas.length - 1; i >= 0; i--) {
        const c = chispas[i]; c.x += c.vx; c.y += c.vy; c.vida -= 1;
        if (c.vida <= 0) { chispas.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, c.vida / 30); ctx.fillStyle = '#e9d29a';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.283); ctx.fill();
      }
      if (!reducir || chispas.length) raf = requestAnimationFrame(dibujar);
    }
    function chispear(x, y) {
      for (let i = 0; i < 9; i++) chispas.push({ x: x, y: y, vx: (Math.random() - .5) * 1.6, vy: -.4 - Math.random() * 1.2, r: 1 + Math.random() * 1.8, vida: 50 + Math.random() * 30 });
      if (reducir) { cancelAnimationFrame(raf); raf = requestAnimationFrame(dibujar); }
    }
    window.addEventListener('resize', medir);
    dibujar(0);
    return { parar: function () { cancelAnimationFrame(raf); window.removeEventListener('resize', medir); }, chispear: chispear };
  }

  function pantallaInicio() {
    const P = D.portada;
    const el = crear(`<main class="portada">
      <canvas></canvas>
      <div class="burbuja" hidden></div>
      <div class="personajes">${IMG.nani}${IMG.hornet}</div>
      <h1>${P.titulo}</h1>
      <p class="subtitulo">${P.subtitulo}</p>
      <div class="filete"></div>
      <p class="intro">«${P.intro}»</p>
      <button class="boton" type="button">${P.boton}</button>
    </main>`);
    const fx = particulas(el.querySelector('canvas'));
    detener = fx.parar;
    const burbuja = el.querySelector('.burbuja');
    const nani = el.querySelector('.caballero'), hornet = el.querySelector('.hornet');
    let n = 0, tNani = 0, tHornet = 0, tBurbuja = 0;
    function reaccion(img, alterna, base, clase) {
      img.classList.remove('salto'); void img.offsetWidth; img.classList.add('salto');
      img.src = alterna; return setTimeout(function () { img.src = base; img.classList.remove('salto'); }, 1600);
    }
    nani.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); clearTimeout(tNani); tNani = reaccion(nani, 'nani-celebra.png', 'nani.png');
      const r = nani.getBoundingClientRect(), b = el.getBoundingClientRect(); fx.chispear(r.left + r.width / 2 - b.left, r.top - b.top + 20);
    });
    hornet.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); clearTimeout(tHornet); tHornet = reaccion(hornet, 'hornet-sorpresa.png', 'hornet.png');
      burbuja.textContent = '«' + P.hornetDice[n++ % P.hornetDice.length] + '»'; burbuja.hidden = false;
      clearTimeout(tBurbuja); tBurbuja = setTimeout(function () { burbuja.hidden = true; }, 5200);
      const r = hornet.getBoundingClientRect(), b = el.getBoundingClientRect(); fx.chispear(r.left + r.width / 2 - b.left, r.top - b.top + 20);
    });
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      const b = el.getBoundingClientRect(); fx.chispear(e.clientX - b.left, e.clientY - b.top);
    });
    el.querySelector('button').addEventListener('click', comenzar);
    return el;
  }

  function comenzar() {
    if (reducir) { location.hash = '#/reino'; return; }
    velo.classList.add('activo');
    setTimeout(function () { location.hash = '#/reino'; requestAnimationFrame(function () { velo.classList.remove('activo'); }); }, 650);
  }

  /* ======================= Ventanas (modales) ======================= */
  function cerrarModal(el, despues) {
    el.classList.add('saliendo');
    setTimeout(function () { el.remove(); if (despues) despues(); }, reducir ? 0 : 650);
  }
  function modal(contenedor, html, clase) {
    const quitar = contenedor.querySelector('.modal'); if (quitar) quitar.remove();
    const m = crear(`<div class="modal ${clase || ''}" role="dialog" aria-modal="true">${html}</div>`);
    contenedor.appendChild(m); return m;
  }
  const placa = (txt, id, extra) => `<button class="boton placa ${extra || ''}" type="button" data-acc="${id}">${txt}</button>`;

  /* ======================= Pantalla del Reino (mapa) ======================= */
  function lineas(txt) {
    const p = txt.split(' '); if (txt.length < 17) return [txt];
    let mejor = 1, dif = 999;
    for (let i = 1; i < p.length; i++) { const a = p.slice(0, i).join(' ').length, b = p.slice(i).join(' ').length; if (Math.abs(a - b) < dif) { dif = Math.abs(a - b); mejor = i; } }
    return [p.slice(0, mejor).join(' '), p.slice(mejor).join(' ')];
  }

  function pantallaReino() {
    const el = crear(`<main class="reino">
      <div class="mapa-vista" id="vista">
        <div class="mapa-lienzo" id="lienzo">
          <img src="mapa.webp" width="800" height="1700" alt="Mapa ilustrado del reino" draggable="false">
          <svg id="capa" viewBox="0 0 800 1700" width="800" height="1700" aria-label="Regiones del reino"></svg>
        </div>
      </div>
      <button class="hud-hornet" id="hudHornet" type="button" aria-label="Preguntar a Hornet"><img src="hornet.png" alt="" width="539" height="647"></button>
      <div class="zoom"><button type="button" id="zmas" aria-label="Acercar">+</button><button type="button" id="zmenos" aria-label="Alejar">−</button></div>
      <div class="admin-zona" id="adminZona"></div>
    </main>`);
    el._despues = function () { iniciarReino(el); };
    return el;
  }

  function iniciarReino(el) {
    const vista = el.querySelector('#vista'), lienzo = el.querySelector('#lienzo'), capa = el.querySelector('#capa');
    const cam = { s: 1, x: 0, y: 0 };
    let minS = .4, maxS = 3, nuevoId = null, animando = false;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ---- dibujo de la capa interactiva ---- */
    function pintar() {
      const ids = D.regiones.map((r) => r.id);
      const desc = ids.filter((id) => estado.regiones[id]);
      const pend = pendientes();
      const ult = ultimoDescubierto();
      let s = `<defs><radialGradient id="rev"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset=".62" stop-color="#000" stop-opacity="1"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <mask id="mv" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="1700"><rect width="800" height="1700" fill="#fff"/>`;
      desc.forEach(function (id) { const r = reg(id); s += `<circle id="rev-${id}" cx="${r.x}" cy="${r.y}" r="${id === nuevoId ? 0 : r.reveal * 1.25}" fill="url(#rev)"/>`; });
      s += `</mask></defs><rect class="velo" width="800" height="1700" mask="url(#mv)"/>`;
      ids.forEach(function (id) { const d = D.caminos[id]; if (!d) return;
        const abierto = !!estado.regiones[id] && id !== nuevoId, guia = pend.indexOf(id) >= 0;
        s += `<path class="camino ${abierto ? 'abierto' : guia ? 'guia' : ''}" d="${d}"/>`; });
      D.regiones.forEach(function (r) {
        const st = estadoDe(r.id);
        let etq = '';
        if (st === 'descubierta' || st === 'completada') {
          const ls = lineas(r.fantasia);
          etq = `<text class="etiqueta" x="${r.etq[0]}" y="${r.etq[1]}">${ls.map((l, i) => `<tspan x="${r.etq[0]}" dy="${i ? 25 : 0}">${l}</tspan>`).join('')}</text>`;
        }
        const emblema = st === 'completada' ? '<path class="emblema" d="M26 -26 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z"/>' : '';
        s += `<g class="nodo ${st}" data-region="${r.id}" transform="translate(${r.x} ${r.y})">
          <circle class="halo" r="46"/><circle class="halo h2" r="46"/><circle class="area" r="60"/>
          <path class="rombo" d="M0 -15 L15 0 L0 15 L-15 0z"/>${emblema}${etq}</g>`;
      });
      // Caballero (Nani) donde está ahora y Hornet señalando el siguiente destino
      const nr = ult ? reg(ult) : null, nx = nr ? nr.x - 46 : 362, ny = nr ? nr.y - 14 : 566;
      s += `<g class="ficha" pointer-events="none"><image href="nani.png" x="${nx - 42}" y="${ny - 94}" width="84" height="95"/></g>`;
      if (pend.length) {
        const hr = reg(pend[0]);
        s += `<g class="ficha bob" pointer-events="none"><image href="hornet.png" x="${hr.x + 4}" y="${hr.y - 112}" width="82" height="98"/></g>`;
      }
      capa.innerHTML = s;
    }

    /* ---- cámara ---- */
    function aplicar() { lienzo.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.s})`; }
    function limitar() {
      const vw = vista.clientWidth, vh = vista.clientHeight, w = 800 * cam.s, h = 1700 * cam.s;
      cam.x = w <= vw ? (vw - w) / 2 : clamp(cam.x, vw - w, 0);
      cam.y = h <= vh ? (vh - h) / 2 : clamp(cam.y, vh - h, 0);
    }
    function zoomEn(px, py, f) {
      const ns = clamp(cam.s * f, minS, maxS), k = ns / cam.s;
      cam.x = px - (px - cam.x) * k; cam.y = py - (py - cam.y) * k; cam.s = ns; limitar(); aplicar();
    }
    function irA(mx, my, s, suave) {
      const vw = vista.clientWidth, vh = vista.clientHeight;
      cam.s = clamp(s, minS, maxS); cam.x = vw / 2 - mx * cam.s; cam.y = vh * .42 - my * cam.s; limitar();
      lienzo.style.transition = (suave && !reducir) ? 'transform 1s cubic-bezier(.4,0,.2,1)' : 'none';
      aplicar();
    }
    function medir() { minS = vista.clientWidth / 800; maxS = minS * 4; if (cam.s < minS) cam.s = minS; limitar(); aplicar(); }
    medir();
    cam.s = minS; limitar(); aplicar();
    window.addEventListener('resize', medir);
    const prevDetener = detener;
    detener = function () { window.removeEventListener('resize', medir); if (prevDetener) prevDetener(); };

    /* ---- gestos: arrastrar, pellizcar, tocar ---- */
    const ptrs = new Map(); let movido = 0, previo = null;
    vista.addEventListener('pointerdown', function (e) {
      vista.setPointerCapture(e.pointerId); lienzo.style.transition = 'none';
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = 0; previo = null;
      if (ptrs.size === 1) vista._t0 = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    vista.addEventListener('pointermove', function (e) {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) { movido += Math.abs(dx) + Math.abs(dy); cam.x += dx; cam.y += dy; limitar(); aplicar(); }
      else if (ptrs.size === 2) {
        movido += 99; const [a, b] = Array.from(ptrs.values()), r = vista.getBoundingClientRect();
        const dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
        if (previo) { cam.x += mx - previo.mx; cam.y += my - previo.my; zoomEn(mx, my, dist / previo.dist); }
        previo = { dist: dist, mx: mx, my: my };
      }
    });
    function fin(e) {
      if (!ptrs.has(e.pointerId)) return;
      const era1 = ptrs.size === 1; ptrs.delete(e.pointerId); previo = null;
      if (era1 && movido < 12 && vista._t0 && Date.now() - vista._t0.t < 700 && e.type === 'pointerup') {
        const t = document.elementFromPoint(e.clientX, e.clientY), n = t && t.closest && t.closest('[data-region]');
        if (n) tocar(n.dataset.region);
      }
    }
    vista.addEventListener('pointerup', fin); vista.addEventListener('pointercancel', fin);
    vista.addEventListener('wheel', function (e) { e.preventDefault(); const r = vista.getBoundingClientRect(); lienzo.style.transition = 'none'; zoomEn(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : .87); }, { passive: false });
    el.querySelector('#zmas').addEventListener('click', function () { lienzo.style.transition = 'none'; zoomEn(vista.clientWidth / 2, vista.clientHeight / 2, 1.4); });
    el.querySelector('#zmenos').addEventListener('click', function () { lienzo.style.transition = 'none'; zoomEn(vista.clientWidth / 2, vista.clientHeight / 2, .72); });

    /* ---- acciones ---- */
    function enfocarGuia(suave) {
      const p = pendientes();
      if (p.length === 1) { const r = reg(p[0]); irA(r.x, r.y, minS * 1.9, suave); }
      else irA(400, 480, minS * 1.5, suave);
    }
    function tocar(id) {
      if (animando) return;
      const st = estadoDe(id);
      if (st === 'oculta') return ventanaBloqueada();
      if (st === 'disponible') return descubrir(id);
      ventanaInfo(id);
    }
    function animar(c, hasta, ms, cb) {
      if (!c || reducir || !ms) { if (c) c.setAttribute('r', hasta); return cb(); }
      const t0 = performance.now();
      (function paso(t) { const k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3); c.setAttribute('r', hasta * e); k < 1 ? requestAnimationFrame(paso) : cb(); })(t0);
    }
    function descubrir(id) {
      const r = reg(id); animando = true; nuevoId = id;
      estado.regiones[id] = 'descubierta'; estado.fechas[id] = new Date().toISOString(); guardar();
      irA(r.x, r.y, Math.max(cam.s, minS * 1.8), true);
      pintar();
      capa.querySelector(`[data-region="${id}"]`).classList.add('descubriendo');
      animar(capa.querySelector('#rev-' + id), r.reveal * 1.25, 1400, function () {
        nuevoId = null; animando = false; pintar(); ventanaPista(id);
      });
    }
    function hornetCara(clase) { return `<img class="m-hornet ${clase || ''}" src="hornet.png" alt="Hornet" width="539" height="647">`; }

    function ventanaIntro(fraseId) {
      const m = modal(el, `<div class="intro-hornet"><img src="hornet.png" alt="Hornet" width="539" height="647"></div>
        <div class="panel"><p class="dialogo">«${D.dialogos[fraseId]}»</p>${placa('¡Sigue a Hornet!', 'seguir')}</div>`, 'm-intro');
      m.querySelector('[data-acc="seguir"]').addEventListener('click', function () {
        if (fraseId === 'intro1') { estado.introVista = true; guardar(); }
        cerrarModal(m, function () { enfocarGuia(true); });
      });
    }
    function ventanaBloqueada() {
      const m = modal(el, `<div class="panel con-hornet">${hornetCara()}<p class="dialogo">«${D.dialogos.bloqueada}»</p>${placa('ENTENDIDO', 'ok')}</div>`);
      m.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m); });
    }
    function ventanaPista(id) {
      const r = reg(id);
      const m = modal(el, `<div class="panel con-hornet">${hornetCara('celebra')}
        <p class="sello">REGIÓN DESCUBIERTA</p><h2>${r.fantasia}</h2><p class="eco">${r.titulo}</p>
        <p class="pista">«${r.pista}»</p><p class="celebra">${D.dialogos.descubrimiento}</p>${placa('CONTINUAR CAMINO', 'sigue')}</div>`);
      m.querySelector('[data-acc="sigue"]').addEventListener('click', function () { cerrarModal(m, function () { enfocarGuia(true); }); });
    }
    function ventanaInfo(id) {
      const r = reg(id), st = estadoDe(id), k = .9;
      const m = modal(el, `<div class="panel">
        <div class="ilustracion"><div class="crop" style="--x:${r.x * k}px;--y:${r.y * k}px"></div></div>
        <h2>${r.fantasia}</h2><p class="real">${r.real}</p>
        <p class="pista">${r.intro}</p>
        <p class="estado ${st}">${st === 'completada' ? '◆ Explorada' : '◇ Descubierta'}</p>
        <p class="celebra" hidden></p>
        <div class="fila">${placa(st === 'completada' ? 'DESMARCAR' : 'MARCAR COMO EXPLORADA', 'toggle')}${placa('CERRAR', 'cerrar', 'suave')}</div></div>`);
      m.querySelector('[data-acc="cerrar"]').addEventListener('click', function () { cerrarModal(m); });
      m.querySelector('[data-acc="toggle"]').addEventListener('click', function () {
        estado.regiones[id] = st === 'completada' ? 'descubierta' : 'completada'; guardar(); pintar();
        if (estado.regiones[id] === 'completada') {
          cerrarModal(m, function () {
            const m2 = modal(el, `<div class="panel con-hornet">${hornetCara('celebra')}<p class="dialogo">«${D.dialogos.completada}»</p>${placa('SEGUIR EXPLORANDO', 'ok')}</div>`);
            m2.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m2); });
          });
        } else cerrarModal(m);
      });
    }
    function ventanaGuia() {
      const p = pendientes();
      const m = modal(el, `<div class="panel con-hornet">${hornetCara()}<p class="dialogo">«${p.length ? D.dialogos.guia : D.dialogos.fin}»</p>${placa('ENTENDIDO', 'ok')}</div>`);
      m.querySelector('[data-acc="ok"]').addEventListener('click', function () { cerrarModal(m, function () { if (p.length) enfocarGuia(true); }); });
    }
    el.querySelector('#hudHornet').addEventListener('click', ventanaGuia);

    /* ---- administración discreta: mantén pulsada la esquina superior izquierda ---- */
    (function () {
      const z = el.querySelector('#adminZona'); let t = 0;
      const ini = function () { t = setTimeout(abrirAdmin, 1400); }, fin2 = function () { clearTimeout(t); };
      z.addEventListener('pointerdown', ini); z.addEventListener('pointerup', fin2); z.addEventListener('pointerleave', fin2); z.addEventListener('pointercancel', fin2);
      function abrirAdmin() {
        function filas() { return D.regiones.map((r) => `<div class="adm-fila"><span>${r.real}</span><button type="button" class="boton placa suave mini" data-id="${r.id}">${({ oculta: 'Oculta', disponible: 'Oculta', descubierta: 'Descubierta', completada: 'Completada' })[estadoDe(r.id)]}</button></div>`).join(''); }
        const m = modal(el, `<div class="panel admin"><h2>Administración</h2><p class="pista">Toca una región para cambiar su estado: oculta → descubierta → completada.</p>
          <div id="admLista">${filas()}</div>
          <div class="fila">${placa('REPETIR MENSAJE INICIAL', 'intro', 'suave')}${placa('REINICIAR TODO', 'reset', 'suave')}${placa('CERRAR', 'cerrar')}</div></div>`);
        m.addEventListener('click', function (e) {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.id) {
            const id = b.dataset.id, st = estado.regiones[id];
            if (!st) { estado.regiones[id] = 'descubierta'; estado.fechas[id] = new Date().toISOString(); }
            else if (st === 'descubierta') estado.regiones[id] = 'completada';
            else { delete estado.regiones[id]; delete estado.fechas[id]; }
            guardar(); pintar(); m.querySelector('#admLista').innerHTML = filas();
          } else if (b.dataset.acc === 'intro') { estado.introVista = false; guardar(); b.textContent = 'LISTO'; }
          else if (b.dataset.acc === 'reset') {
            if (b.dataset.seguro) { estado = { regiones: {}, fechas: {}, introVista: false }; guardar(); pintar(); m.querySelector('#admLista').innerHTML = filas(); b.textContent = 'REINICIADO'; delete b.dataset.seguro; }
            else { b.dataset.seguro = '1'; b.textContent = 'TOCA OTRA VEZ PARA CONFIRMAR'; }
          } else if (b.dataset.acc === 'cerrar') cerrarModal(m);
        });
      }
    })();

    /* ---- arranque ---- */
    pintar();
    if (!introEstaSesion && pendientes().length) {
      introEstaSesion = true;
      setTimeout(function () { ventanaIntro(estado.introVista ? 'intro2' : 'intro1'); }, reducir ? 0 : 700);
    } else if (pendientes().length) { enfocarGuia(false); }
  }

  /* ======================= Pantallas en construcción ======================= */
  function enConstruccion(titulo, lema) {
    return crear(`<main class="interior"><h2>${titulo}</h2><p class="lema">${lema}</p>
      <div class="panel solo"><p class="pista">Esta sección todavía no está construida. Va después del mapa, en el orden que acordamos.</p></div></main>`);
  }
  const rutas = {
    inicio: pantallaInicio,
    reino: pantallaReino,
    recuerdos: function () { return enConstruccion('Ecos de un viaje', 'Cada lugar deja algo que merece ser recordado.'); },
    actividades: function () { return enConstruccion('Pequeñas cosas por descubrir', 'Porque los mejores recuerdos no siempre están escritos en el mapa.'); },
    cronicas: function () { return enConstruccion('El camino recorrido', 'Lo que hemos descubierto juntos.'); }
  };

  /* ======================= Navegación ======================= */
  function rutaActual() { return (location.hash.replace(/^#\/?/, '') || 'inicio').split('/')[0]; }
  function mostrar() {
    let r = rutaActual();
    if (r === 'mapa') r = 'reino';
    if (!rutas[r]) r = 'inicio';
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
  window.addEventListener('online', actualizarRed);
  window.addEventListener('offline', actualizarRed);
  window.addEventListener('hashchange', mostrar);
  actualizarRed();
  cargar().then(mostrar);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
