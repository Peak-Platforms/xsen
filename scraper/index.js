// index.js - XSEN Scraper + Script Generator + Voicer Coordinator

import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

// ─── Health Check Server (keeps Railway alive) ────────────────────────────────
const server = http.createServer((req, res) => res.end("XSEN FanCast Pipeline running"));
server.listen(
  process.env.PORT || 3001,
  () => console.log(`✅ Health check server running on port ${process.env.PORT || 3001}`)
);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n⚠️  Received ${signal} — waiting for current tasks to finish...`);
  server.close(() => {
    console.log("✅ Health check server closed. Shutting down cleanly.");
    process.exit(0);
  });
  // Force exit after 30 seconds if tasks don't finish
  setTimeout(() => {
    console.log("⏱️  Forced shutdown after 30s timeout.");
    process.exit(0);
  }, 30000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ─── Start All Services ───────────────────────────────────────────────────────
console.log("🚀 Starting XSEN FanCast Pipeline...");

import("./scraper.js")
  .then(() => console.log("📡 Scraper started"))
  .catch(err => console.error("Scraper failed to start:", err));

import("./scriptgen.js")
  .then(() => console.log("✍️  Script generator started"))
  .catch(err => console.error("Script generator failed to start:", err));

import("./voicer.js")
  .then(() => console.log("🎙️  Voicer started"))
  .catch(err => console.error("Voicer failed to start:", err));
