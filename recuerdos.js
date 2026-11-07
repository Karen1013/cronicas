/* Sección RECUERDOS: el diario del viaje (fotos, emociones y palabras de cada territorio).
   Todo se guarda en el dispositivo mediante almacen.js. */
(function () {
  'use strict';
  const EMO = [
    { id: 'enojado', e: '😠', t: 'Enojado' }, { id: 'triste', e: '😢', t: 'Triste' }, { id: 'asombrado', e: '😮', t: 'Asombrado' },
    { id: 'divertido', e: '😆', t: 'Divertido' }, { id: 'feliz', e: '😍', t: 'Feliz' }
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = (t) => new Date(t).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const nuevoId = (p) => p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  /* ---------- Fotos: se reducen y comprimen antes de guardarse ---------- */
  async function procesarFoto(file) {
    const u = URL.createObjectURL(file);
    try {
      const img = new Image(); img.decoding = 'async'; img.src = u; await img.decode();
      const mayor = Math.max(img.naturalWidth, img.naturalHeight);
      function reducir(max, q) {
        const k = Math.min(1, max / mayor), w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
        return new Promise((ok, no) => c.toBlob((b) => b ? ok({ blob: b, w: w, h: h }) : no(new Error('toBlob')), 'image/jpeg', q));
      }
      const grande = await reducir(1600, .82), mini = await reducir(520, .76);
      return { blob: grande.blob, thumb: mini.blob, w: grande.w, h: grande.h };
    } finally { URL.revokeObjectURL(u); }
  }
  const aDataURL = (b) => new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });

  window.Recuerdos = {
    crear: function (ctx) {
      const D = ctx.D, pj = ctx.pj;
      const el = ctx.crear('<main class="interior recuerdos"><div class="rc-vista"></div></main>');
      const vista = el.querySelector('.rc-vista');
      const urls = [];
      const url = (b) => { const u = URL.createObjectURL(b); urls.push(u); return u; };
      const liberar = () => { while (urls.length) URL.revokeObjectURL(urls.pop()); };
      ctx.alSalir(liberar);
      const reg = (id) => D.regiones.find((r) => r.id === id);
      const descubiertas = () => D.regiones.filter((r) => ctx.getEstado().regiones[r.id]);
      const terr = (id, clase) => { const i = D.regiones.findIndex((r) => r.id === id); return `<span class="terr ${clase || ''}" style="background-position:${(i % 4) * 100 / 3}% ${Math.floor(i / 4) * 100 / 2}%"></span>`; };
      const placa = (txt, acc, extra) => `<button class="boton placa ${extra || ''}" type="button" data-a="${acc}">${txt}</button>`;

      function aviso(txt) {
        const t = ctx.crear(`<div class="rc-toast">${esc(txt)}</div>`); el.appendChild(t);
        setTimeout(() => { t.classList.add('sale'); setTimeout(() => t.remove(), 400); }, 2800);
      }
      function ir(fn, a) {
        liberar(); vista.classList.remove('entra'); vista.innerHTML = '<div class="rc-raiz"></div>'; void vista.offsetWidth; vista.classList.add('entra');
        window.scrollTo(0, 0); fn(vista.firstChild, a);
      }
      function emocionesHTML(ids, grandes) {
        return `<div class="rc-emo-mini ${grandes ? 'grandes' : ''}">${EMO.filter((x) => ids.indexOf(x.id) >= 0).map((x) => `<span title="${x.t}"><i>${x.e}</i>${grandes ? '<b>' + x.t + '</b>' : ''}</span>`).join('')}</div>`;
      }
      function pedirPersistencia() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} }

      /* =============== LISTA =============== */
      async function vistaLista(raiz) {
        raiz.innerHTML = `<header class="rc-cab"><h2>Ecos de un viaje</h2><p class="lema">Cada lugar deja algo que merece ser recordado.</p></header><div class="rc-cuerpo"></div>`;
        const cuerpo = raiz.querySelector('.rc-cuerpo');
        let mems = [];
        try { mems = await Almacen.listar('recuerdos'); } catch (e) { cuerpo.innerHTML = '<p class="rc-error">No pude abrir el diario en este dispositivo. Cierra y vuelve a abrir la aplicación.</p>'; return; }
        const hay = descubiertas().length > 0;
        if (!mems.length) {
          cuerpo.innerHTML = `<div class="rc-vacio"><div class="flota">${pj('mapa', 'min(64vw,250px)')}</div>
            <p class="rc-frase">«Todo gran viaje comienza con una primera memoria. Aún quedan muchos momentos esperando ser descubiertos».</p>
            ${hay ? placa('ESCRIBIR EL PRIMER RECUERDO', 'nuevo') : '<p class="rc-nota">Cuando descubras un territorio en el mapa, aquí podrás guardar sus recuerdos.</p>'}</div>`;
        } else {
          let h = hay ? placa('NUEVO RECUERDO', 'nuevo', 'rc-nuevo') : '';
          for (const r of D.regiones) {
            const lista = mems.filter((m) => m.regionId === r.id).sort((a, b) => b.creado - a.creado); if (!lista.length) continue;
            h += `<section class="rc-terr"><div class="rc-terr-cab">${terr(r.id)}<div class="rc-terr-nombre"><h3>${esc(r.fantasia)}</h3><span>(${esc(r.real)})</span></div></div><div class="rc-lista">` +
              lista.map((m) => `<button class="rc-card" type="button" data-id="${m.id}"><div class="rc-tiras" data-mem="${m.id}"></div>${m.emociones.length ? emocionesHTML(m.emociones) : ''}<p class="rc-fecha">${fecha(m.creado)}</p>${m.texto ? `<p class="rc-extracto">${esc(m.texto.length > 130 ? m.texto.slice(0, 130) + '…' : m.texto)}</p>` : ''}</button>`).join('') + '</div></section>';
          }
          h += `<div class="rc-copia"><span>Copia de seguridad</span><button type="button" data-a="exportar">Guardar copia</button><button type="button" data-a="importar">Restaurar copia</button><input type="file" accept=".json,application/json" hidden id="rcImp"></div>`;
          cuerpo.innerHTML = h;
          // miniaturas de cada recuerdo
          mems.forEach(async (m) => {
            const caja = cuerpo.querySelector(`.rc-tiras[data-mem="${m.id}"]`); if (!caja || !m.fotos.length) { if (caja) caja.remove(); return; }
            try {
              const fs = await Almacen.fotosDe(m.id); const orden = m.fotos.map((id) => fs.find((f) => f.id === id)).filter(Boolean).slice(0, 3);
              caja.innerHTML = orden.map((f) => `<img alt="" src="${url(f.thumb)}">`).join('') + (m.fotos.length > 3 ? `<span class="mas">+${m.fotos.length - 3}</span>` : '');
              if (!orden.length) caja.remove();
            } catch (e) {}
          });
        }
        cuerpo.addEventListener('click', function (e) {
          const c = e.target.closest('.rc-card'); if (c) return ir(vistaVer, c.dataset.id);
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'nuevo') ir(vistaEditor, { regionId: null });
          else if (b.dataset.a === 'exportar') exportar(b);
          else if (b.dataset.a === 'importar') cuerpo.querySelector('#rcImp').click();
        });
        const imp = cuerpo.querySelector('#rcImp'); if (imp) imp.addEventListener('change', () => importar(imp.files[0]));
      }

      /* =============== VER UN RECUERDO =============== */
      async function vistaVer(raiz, id) {
        let m, fotos = [];
        try { m = await Almacen.obtenerDe('recuerdos', id); const fs = await Almacen.fotosDe(id); fotos = (m ? m.fotos : []).map((x) => fs.find((f) => f.id === x)).filter(Boolean); } catch (e) {}
        if (!m) return ir(vistaLista);
        const r = reg(m.regionId) || { fantasia: 'Un rincón del reino', real: '' };
        const galeria = fotos.length ? `<div class="rc-galeria n${Math.min(fotos.length, 3)}">${fotos.map((f, i) => `<button type="button" class="rc-foto" data-i="${i}"><img alt="Fotografía ${i + 1}" src="${url(f.thumb)}"></button>`).join('')}</div>` : '';
        raiz.innerHTML = `<header class="rc-cab"><button class="rc-volver" type="button" data-a="volver">‹ Volver</button></header>
          <article class="rc-pagina">${terr(m.regionId, 'banner')}<div class="rc-titulo"><h2>${esc(r.fantasia)}</h2><span>(${esc(r.real)})</span></div><p class="rc-fecha centro">${fecha(m.creado)}</p>
          ${galeria}${m.emociones.length ? `<h4 class="rc-sub">¿Qué tan bien te la pasaste aquí?</h4>${emocionesHTML(m.emociones, true)}` : ''}
          ${m.texto ? `<div class="rc-texto"></div>` : ''}
          <div class="rc-acciones">${placa('EDITAR O AÑADIR FOTOS', 'editar')}${placa('ELIMINAR ESTE RECUERDO', 'borrar', 'suave')}</div></article>`;
        const t = raiz.querySelector('.rc-texto'); if (t) t.textContent = m.texto;
        raiz.addEventListener('click', async function (e) {
          const f = e.target.closest('.rc-foto'); if (f) return lightbox(fotos, +f.dataset.i);
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'volver') ir(vistaLista);
          else if (b.dataset.a === 'editar') ir(vistaEditor, { mem: m });
          else if (b.dataset.a === 'borrar') {
            if (!confirm('¿Eliminar este recuerdo y sus fotos? No se puede deshacer.')) return;
            try { await Almacen.borrarRecuerdo(m.id); aviso('El recuerdo se eliminó.'); ir(vistaLista); } catch (x) { aviso('No se pudo eliminar. Inténtalo de nuevo.'); }
          }
        });
      }
      function lightbox(fotos, i0) {
        let i = i0;
        const L = ctx.crear(`<div class="rc-luz"><img alt=""><button class="x" type="button" aria-label="Cerrar">×</button>${fotos.length > 1 ? '<button class="ant" type="button" aria-label="Anterior">‹</button><button class="sig" type="button" aria-label="Siguiente">›</button>' : ''}<span class="cont"></span></div>`);
        document.body.appendChild(L);
        const img = L.querySelector('img'), cont = L.querySelector('.cont');
        const urlsL = [];
        function mostrar() { const u = url(fotos[i].blob); urlsL.push(u); img.src = u; cont.textContent = fotos.length > 1 ? (i + 1) + ' / ' + fotos.length : ''; }
        function cerrar() { L.classList.add('sale'); setTimeout(() => L.remove(), 300); }
        L.addEventListener('click', function (e) {
          if (e.target.closest('.x') || e.target === L || e.target === img) cerrar();
          else if (e.target.closest('.ant')) { i = (i - 1 + fotos.length) % fotos.length; mostrar(); }
          else if (e.target.closest('.sig')) { i = (i + 1) % fotos.length; mostrar(); }
        });
        let x0 = null; L.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
        L.addEventListener('pointerup', (e) => { if (x0 === null || fotos.length < 2) return; const d = e.clientX - x0; x0 = null; if (Math.abs(d) > 50) { i = (i + (d < 0 ? 1 : -1) + fotos.length) % fotos.length; mostrar(); } });
        mostrar();
      }

      /* =============== CREAR / EDITAR =============== */
      async function vistaEditor(raiz, op) {
        const est = ctx.getEstado(), disp = descubiertas();
        const existente = op && op.mem;
        const b = existente
          ? { id: existente.id, creado: existente.creado, regionId: existente.regionId, texto: existente.texto || '', emo: existente.emociones.slice(), fotos: [] }
          : { id: nuevoId('m'), creado: 0, regionId: (op && op.regionId) || (disp.length ? disp[disp.length - 1].id : null), texto: '', emo: [], fotos: [] };
        let orig = [];
        if (existente) {
          try { const fs = await Almacen.fotosDe(existente.id); b.fotos = existente.fotos.map((id) => fs.find((f) => f.id === id)).filter(Boolean).map((f) => ({ id: f.id, blob: f.blob, thumb: f.thumb, w: f.w, h: f.h, nuevo: false })); } catch (e) {}
          orig = b.fotos.map((f) => f.id);
        }
        let sucio = false;
        raiz.innerHTML = `<header class="rc-cab"><button class="rc-volver" type="button" data-a="volver">‹ Volver</button><h2>${existente ? 'Editar recuerdo' : 'Nuevo recuerdo'}</h2></header>
          <div class="rc-form">
            <section class="rc-paso"><h4>¿En qué territorio fue?</h4><div class="rc-chips">${disp.map((r) => `<button type="button" class="rc-chip" data-reg="${r.id}">${esc(r.fantasia)}</button>`).join('')}</div></section>
            <section class="rc-paso"><h4>Guarda aquí los momentos de esta aventura</h4><div class="rc-fotos" id="rcFotos"></div>
              <div class="rc-add">${placa('AÑADIR FOTOS', 'galeria', 'suave')}${placa('TOMAR UNA FOTO', 'camara', 'suave')}</div>
              <input type="file" accept="image/*" multiple hidden id="inGal"><input type="file" accept="image/*" capture="environment" hidden id="inCam"><p class="rc-estado" id="rcEstado" hidden></p></section>
            <section class="rc-paso"><h4>¿Qué tan bien te la pasaste aquí?</h4><div class="rc-emos" id="rcEmos">${EMO.map((x) => `<button type="button" class="rc-emo" data-e="${x.id}" aria-pressed="false"><span class="rc-cara"><i>${x.e}</i></span><b>${x.t}</b></button>`).join('')}</div><p class="rc-ayuda" id="rcAyuda">Puedes elegir hasta dos emociones.</p></section>
            <section class="rc-paso"><h4>Deja unas palabras de esta aventura…</h4><textarea id="rcTxt" rows="6" placeholder="¿Qué recuerdas de este lugar? ¿Qué fue lo que más te gustó? ¿Hay algo que quieras conservar de este momento?"></textarea></section>
            ${placa('GUARDAR RECUERDO', 'guardar', 'rc-guardar')}
          </div>`;
        const $ = (s) => raiz.querySelector(s), fotosEl = $('#rcFotos'), txt = $('#rcTxt');
        txt.value = b.texto;

        function pintarChips() { raiz.querySelectorAll('.rc-chip').forEach((c) => c.classList.toggle('on', c.dataset.reg === b.regionId)); }
        function pintarEmos() {
          raiz.querySelectorAll('.rc-emo').forEach((c) => { const on = b.emo.indexOf(c.dataset.e) >= 0; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
        }
        function pintarFotos() {
          const h = b.fotos.map((f, i) => `<figure class="rc-foto-prev"><button type="button" class="ver" data-v="${i}" aria-label="Ver foto"><img alt="" src="${f.u || (f.u = url(f.thumb))}"></button><button type="button" class="quitar" data-q="${i}" aria-label="Quitar foto">×</button></figure>`).join('');
          fotosEl.innerHTML = h + `<button type="button" class="rc-mas" data-a="galeria"><span>＋</span>${b.fotos.length ? 'Añadir más' : 'Toca para añadir fotos'}</button>`;
          fotosEl.classList.toggle('vacio', !b.fotos.length);
        }
        pintarChips(); pintarEmos(); pintarFotos();

        async function agregar(files) {
          files = Array.from(files || []); if (!files.length) return;
          const est = $('#rcEstado'); est.hidden = false; est.textContent = 'Preparando fotos…'; let fallos = 0;
          for (const f of files) {
            if (b.fotos.length >= 30) { aviso('Cada recuerdo admite hasta 30 fotos.'); break; }
            try { const p = await procesarFoto(f); b.fotos.push({ id: nuevoId('f'), blob: p.blob, thumb: p.thumb, w: p.w, h: p.h, nuevo: true }); sucio = true; pintarFotos(); } catch (e) { fallos++; }
          }
          est.hidden = !fallos; est.textContent = fallos ? 'No pude leer ' + (fallos === 1 ? 'una foto' : fallos + ' fotos') + '. Prueba con otra imagen.' : '';
        }
        $('#inGal').addEventListener('change', (e) => { agregar(e.target.files); e.target.value = ''; });
        $('#inCam').addEventListener('change', (e) => { agregar(e.target.files); e.target.value = ''; });
        txt.addEventListener('input', () => { b.texto = txt.value; sucio = true; });

        async function guardar(btn) {
          if (!b.regionId) return aviso('Elige el territorio al que pertenece este recuerdo.');
          if (!b.texto.trim() && !b.fotos.length && !b.emo.length) return aviso('Agrega una foto, una emoción o unas palabras.');
          btn.disabled = true; btn.textContent = 'GUARDANDO…';
          const ahora = Date.now();
          const mem = { id: b.id, regionId: b.regionId, texto: b.texto, emociones: b.emo.slice(), fotos: b.fotos.map((f) => f.id), creado: b.creado || ahora, actualizado: ahora };
          const nuevas = b.fotos.filter((f) => f.nuevo).map((f) => ({ id: f.id, memId: b.id, blob: f.blob, thumb: f.thumb, w: f.w, h: f.h, creado: ahora }));
          const quitar = orig.filter((id) => !b.fotos.some((f) => f.id === id));
          try {
            await Almacen.guardarRecuerdo(mem, nuevas, quitar); pedirPersistencia();
            const ok = ctx.crear(`<div class="rc-ok"><div class="rc-ok-in">${pj('celebran', 'min(60vw,230px)')}<h3>Recuerdo guardado</h3><p>Ya forma parte de tu diario.</p></div></div>`);
            el.appendChild(ok); sucio = false;
            setTimeout(() => { ok.classList.add('sale'); setTimeout(() => { ok.remove(); ir(vistaVer, mem.id); }, 420); }, ctx.reducir ? 600 : 1900);
          } catch (e) { btn.disabled = false; btn.textContent = 'GUARDAR RECUERDO'; aviso('No se pudo guardar. Puede que el almacenamiento esté lleno; prueba con menos fotos.'); }
        }
        raiz.addEventListener('click', function (e) {
          const chip = e.target.closest('.rc-chip'); if (chip) { b.regionId = chip.dataset.reg; sucio = true; return pintarChips(); }
          const emo = e.target.closest('.rc-emo');
          if (emo) {
            const id = emo.dataset.e, i = b.emo.indexOf(id);
            if (i >= 0) b.emo.splice(i, 1);
            else if (b.emo.length >= 2) { const a = $('#rcAyuda'); a.classList.remove('sacude'); void a.offsetWidth; a.classList.add('sacude'); return; }
            else b.emo.push(id);
            sucio = true; return pintarEmos();
          }
          const q = e.target.closest('[data-q]'); if (q) { b.fotos.splice(+q.dataset.q, 1); sucio = true; return pintarFotos(); }
          const v = e.target.closest('[data-v]'); if (v) return lightbox(b.fotos, +v.dataset.v);
          const a = e.target.closest('[data-a]'); if (!a) return;
          if (a.dataset.a === 'galeria') $('#inGal').click();
          else if (a.dataset.a === 'camara') $('#inCam').click();
          else if (a.dataset.a === 'guardar') guardar(a);
          else if (a.dataset.a === 'volver') { if (sucio && !confirm('¿Salir sin guardar este recuerdo?')) return; ir(existente ? vistaVer : vistaLista, existente ? existente.id : undefined); }
        });
      }

      /* =============== COPIA DE SEGURIDAD =============== */
      async function exportar(btn) {
        const txt = btn.textContent; btn.textContent = 'Preparando…';
        try {
          const mems = await Almacen.listar('recuerdos'), fotos = await Almacen.listar('fotos'), fs = [];
          for (const f of fotos) fs.push({ id: f.id, memId: f.memId, w: f.w, h: f.h, creado: f.creado, blob: await aDataURL(f.blob), thumb: await aDataURL(f.thumb) });
          const dia = new Date().toISOString().slice(0, 10);
          const file = new File([JSON.stringify({ app: 'cronicas', version: 1, fecha: new Date().toISOString(), recuerdos: mems, fotos: fs })], `cronicas-recuerdos-${dia}.json`, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Copia de mis recuerdos' }); btn.textContent = txt; return; } catch (e) { if (e.name === 'AbortError') { btn.textContent = txt; return; } } }
          const a = document.createElement('a'); a.href = url(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); aviso('Copia guardada en tus descargas.');
        } catch (e) { aviso('No se pudo crear la copia.'); }
        btn.textContent = txt;
      }
      async function importar(file) {
        if (!file) return;
        try {
          const dat = JSON.parse(await file.text()); if (dat.app !== 'cronicas') throw new Error('formato');
          const aBlob = async (d) => (await fetch(d)).blob();
          const ya = new Set((await Almacen.listar('recuerdos')).map((m) => m.id));
          const nuevos = dat.recuerdos.filter((m) => !ya.has(m.id));
          const fotos = []; for (const f of dat.fotos) if (nuevos.some((m) => m.id === f.memId)) fotos.push({ id: f.id, memId: f.memId, w: f.w, h: f.h, creado: f.creado, blob: await aBlob(f.blob), thumb: await aBlob(f.thumb) });
          await Almacen.ponerVarios(nuevos, fotos);
          aviso(nuevos.length ? 'Se restauraron ' + nuevos.length + (nuevos.length === 1 ? ' recuerdo.' : ' recuerdos.') : 'Esos recuerdos ya estaban en el diario.'); ir(vistaLista);
        } catch (e) { aviso('Ese archivo no parece una copia de tus recuerdos.'); }
      }

      ir(vistaLista);
      return el;
    }
  };
})();
