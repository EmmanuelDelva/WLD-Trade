// ════════════════════════════════════════════════════════════════════════
// Perp WLD · push relay (fase 2) — v1.0 (2026-07-31)
// La app (en CUALQUIER dispositivo abierto: la PC vigilando la watchlist,
// el celular en la mesa) manda las alertas a POST /alert y este relay las
// empuja por Web Push a TODOS los dispositivos suscritos — el iPhone las
// recibe con la app CERRADA. El relay NO toca Binance ni analiza nada:
// la doctrina TU IP PRIMERO queda intacta (los datos salen del navegador
// de Emmanuel; esto solo reparte avisos).
// Env requeridas: VAPID_PUBLIC · VAPID_PRIVATE · ALERT_TOKEN · CONTACT
// Nota Render free: el disco es efimero y el servicio duerme tras 15 min
// de inactividad — la app re-manda su suscripcion al abrirse (self-heal)
// y el primer alert tras dormir tarda ~30s (cold start).
// ════════════════════════════════════════════════════════════════════════
const express = require("express");
const webpush = require("web-push");
const fs = require("fs");

const PATH  = process.env.SUBS_PATH || "./subs.json";
const PUB   = process.env.VAPID_PUBLIC;
const PRIV  = process.env.VAPID_PRIVATE;
const TOKEN = process.env.ALERT_TOKEN;
if (!PUB || !PRIV || !TOKEN) { console.error("Faltan VAPID_PUBLIC / VAPID_PRIVATE / ALERT_TOKEN"); process.exit(1); }
webpush.setVapidDetails(process.env.CONTACT || "mailto:emmanueldelva@gmail.com", PUB, PRIV);

let SUBS = [];
try { SUBS = JSON.parse(fs.readFileSync(PATH, "utf8")); if (!Array.isArray(SUBS)) SUBS = []; } catch (e) {}
const save = () => { try { fs.writeFileSync(PATH, JSON.stringify(SUBS)); } catch (e) {} };

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {                       // CORS: la app vive en github.io
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
const auth = (req, res, next) => req.get("x-token") === TOKEN ? next() : res.status(401).json({ error: "token" });

app.get("/", (_q, r) => r.json({ ok: true, servicio: "wld-push-relay", subs: SUBS.length }));
app.get("/vapid", (_q, r) => r.json({ key: PUB }));

app.post("/subscribe", auth, (req, res) => {
  const { sub } = req.body || {};
  if (!sub || !sub.endpoint) return res.status(400).json({ error: "sub" });
  if (!SUBS.some(s => s.sub.endpoint === sub.endpoint))
    SUBS.push({ sub, ua: String(req.body.ua || "").slice(0, 80), ts: Date.now() });
  save();
  res.json({ ok: true, subs: SUBS.length });
});

app.post("/unsubscribe", auth, (req, res) => {
  const ep = req.body && req.body.endpoint;
  SUBS = SUBS.filter(s => s.sub.endpoint !== ep);
  save();
  res.json({ ok: true, subs: SUBS.length });
});

app.post("/alert", auth, async (req, res) => {
  const { t, b, tag } = req.body || {};
  const payload = JSON.stringify({
    t:  String(t  || "Perp WLD").slice(0, 120),
    b:  String(b  || "").slice(0, 400),
    tag:String(tag|| "perp").slice(0, 60)
  });
  let sent = 0; const muertos = [];
  await Promise.all(SUBS.map(async s => {
    try { await webpush.sendNotification(s.sub, payload, { TTL: 600 }); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) muertos.push(s.sub.endpoint); }
  }));
  if (muertos.length) { SUBS = SUBS.filter(s => !muertos.includes(s.sub.endpoint)); save(); }
  res.json({ ok: true, sent, limpiados: muertos.length });
});

app.listen(process.env.PORT || 3000, () => console.log("wld-push-relay listo · subs:", SUBS.length));
