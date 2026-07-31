# Push relay Perp WLD — despliegue en Render (una vez, ~5 min)

Qué hace: cualquier dispositivo tuyo con la app abierta (la PC vigilando la
watchlist) genera las alertas; este relay las reparte por Web Push a todos tus
dispositivos suscritos — **el iPhone las recibe con la app cerrada**.
No toca Binance: solo reparte avisos (TU IP PRIMERO intacta).

## Pasos

1. **Sube el codigo** (ya lo hace `deploy-wld-trade.ps1` r8: la carpeta
   `push-server/` viaja al repo WLD-Trade junto con la app).
2. **Render** → https://dashboard.render.com → **New → Web Service** →
   conecta el repo `EmmanuelDelva/WLD-Trade`.
   - **Root Directory**: `push-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Plan **Free**.
3. **Environment → Add Environment Variable** — copia los 4 valores de
   `D:\Claude\WLD-Trade-v2\push-server\RENDER-KEYS.txt` (ese archivo NUNCA se sube al repo — el deploy solo copia server.js, package.json, README y .gitignore):
   `VAPID_PUBLIC`, `VAPID_PRIVATE`, `ALERT_TOKEN`, `CONTACT`.
4. Deploy. Cuando diga *Live*, abre `https://TU-SERVICIO.onrender.com/` —
   debe responder `{"ok":true,...}`.
5. **En la app** (cada dispositivo donde quieras RECIBIR): toca **📲** →
   pega la URL del servicio y el `ALERT_TOKEN` → acepta el permiso.
   En iPhone: primero instalada a pantalla de inicio (igual que el 🔔).
6. Prueba: en la PC activa **🔔 Vigilar** en el radar o espera una alerta —
   debe sonar el iPhone aunque la app este cerrada.

## Notas honestas
- Render Free **duerme tras 15 min sin trafico**: la primera alerta tras
  dormir tarda ~30 s (la app lo despierta sola). Si algun dia molesta,
  el plan Starter lo mantiene despierto.
- El disco free es efimero: si el servicio se reinicia pierde la lista de
  suscritos, pero la app **re-manda su suscripcion al abrirse** (self-heal).
  Si un dispositivo deja de recibir, abre la app ahi una vez.
- Sigue haciendo falta UN dispositivo con la app abierta que VIGILE
  (normalmente la PC). Fase 3 natural: un watcher `node` en la MSI que
  vigile sin navegador — pidemelo cuando lo quieras.
