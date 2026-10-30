/* VIBRAS · service worker
   Guarda la "cáscara" de la app (esta página, íconos y logo) para que abra
   al instante y muestre la pantalla "Sin conexión" si no hay internet.
   La app en sí (Apps Script) siempre se pide en línea: así los pagos y las
   clases nunca se ven desactualizados.
   👉 Si cambias index.html, sube la versión (v2, v3…) para que se actualice. */
const CACHE = "vibras-app-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./logo.webp",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Google y Apps Script: siempre directo

  // La página: primero internet (para tener siempre la última versión), si no, la guardada
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia));
          return r;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Íconos, logo y manifiesto: lo guardado al instante y se actualiza por detrás
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((guardado) => {
      const red = fetch(req)
        .then((r) => {
          if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
          return r;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
