// index.js - XSEN Scraper + Script Generator Coordinator

import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

// ─── Health Check Server (keeps Railway alive) ────────────────────────────────
http.createServer((req, res) => res.end("XSEN FanCast Pipeline running")).listen(
  process.env.PORT || 3001,
  () => console.log(`✅ Health check server running on port ${process.env.PORT || 3001}`)
);

// ─── Start Both Services ──────────────────────────────────────────────────────
console.log("🚀 Starting XSEN FanCast Pipeline...");

import("./scraper.js")
  .then(() => console.log("📡 Scraper started"))
  .catch(err => console.error("Scraper failed to start:", err));

import("./scriptgen.js")
  .then(() => console.log("✍️  Script generator started"))
  .catch(err => console.error("Script generator failed to start:", err));
