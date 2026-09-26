// server.js — tiny relay: browser POSTs latest command, ESP32 GETs it.
// No database, no MQTT, no persistent connections to manage.

const express = require("express");
const app = express();
app.use(express.json());

// Allow the browser cockpit (opened as a local file, a different origin)
// to call this API — without this, browsers block the request entirely.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// In-memory store — fine for a single-cart test setup.
let latest = { t: 0, b: 0, s: 0, ts: Date.now() };

// Browser calls this whenever a slider moves (and on a keep-alive tick).
app.post("/cmd", (req, res) => {
  const { t, b, s } = req.body;
  latest = {
    t: Math.max(0, Math.min(100, Number(t) || 0)),
    b: Math.max(0, Math.min(100, Number(b) || 0)),
    s: Math.max(-100, Math.min(100, Number(s) || 0)),
    ts: Date.now()
  };
  res.json({ ok: true });
});

// ESP32 polls this every ~120ms.
app.get("/cmd", (req, res) => {
  res.json(latest);
});

// Simple health check — visit this URL in any browser to confirm it's alive.
app.get("/", (req, res) => {
  res.send("MGM EV relay is running. Latest command: " + JSON.stringify(latest));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay listening on " + PORT));
