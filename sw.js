// Perp WLD - service worker minimo (v2.6)
// Existe para UNA cosa: que las notificaciones salgan por el sistema tambien
// en iOS (PWA instalada, iOS 16.4+), donde `new Notification()` no existe y
// solo funciona registration.showNotification(). SIN fetch handler a proposito:
// la app es de datos vivos de Binance y no debe servirse nada cacheado.
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(ws => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    return clients.openWindow("./");
  }));
});
