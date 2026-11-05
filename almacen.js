// Guardado en el teléfono (IndexedDB). Funciona sin internet.
// Uso:  await Almacen.guardar('clave', valor);   const v = await Almacen.obtener('clave');
window.Almacen = (function () {
  let abierta = null;
  function abrir() {
    if (abierta) return abierta;
    abierta = new Promise((ok, fallo) => {
      const r = indexedDB.open('cronicas', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('datos');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fallo(r.error);
    });
    return abierta;
  }
  async function tx(modo, fn) {
    const db = await abrir();
    return new Promise((ok, fallo) => {
      const t = db.transaction('datos', modo);
      const req = fn(t.objectStore('datos'));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => fallo(t.error);
    });
  }
  return {
    obtener: (k) => tx('readonly', (s) => s.get(k)),
    guardar: (k, v) => tx('readwrite', (s) => s.put(v, k)),
    borrar: (k) => tx('readwrite', (s) => s.delete(k))
  };
})();
