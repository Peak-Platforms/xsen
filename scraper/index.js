// index.js - XSEN FanCast Pipeline Coordinator
// Runs all five phases on schedule

import { runScraper }      from './scraper.js';
import { runScriptGenerator } from './scriptgen.js';
import { runVoicer }       from './voicer.js';
import { runAzuraCast }    from './azuracast.js';
import { runSocialPoster } from './socialposter.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status: 'ok',
  service: 'XSEN FanCast Pipeline',
  phases: ['scraper', 'scriptgen', 'voicer', 'azuracast', 'socialposter'],
  time: new Date().toISOString()
}));

const server = app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
  startPipeline();
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.warn('⚠️  Received SIGTERM — waiting for current tasks to finish...');
  server.close(() => {
    console.log('✅ Health check server closed. Shutting down cleanly.');
    process.exit(0);
  });
});

// ─── Start all services ───────────────────────────────────────────────────────
async function startPipeline() {
  console.log('\n🚀 XSEN FanCast Pipeline Starting...\n');

  try {
    // Phase 1: Scraper — runs immediately, then every 2 hours
    const { startScraper } = await import('./scraper.js');
    startScraper?.() || runScraper();
    console.log('📡 Scraper started');
  } catch (err) { console.error('Scraper failed to start:', err.message); }

  try {
    // Phase 2: Script Generator — runs every 2 hours at :30
    const { startScriptGenerator } = await import('./scriptgen.js');
    startScriptGenerator?.() || runScriptGenerator?.();
    console.log('✍️  Script generator started');
  } catch (err) { console.error('Scriptgen failed to start:', err.message); }

  try {
    // Phase 3: Voicer — runs every hour
    const { startVoicer } = await import('./voicer.js');
    startVoicer?.() || runVoicer();
    console.log('🎙️  Voicer started');
  } catch (err) { console.error('Voicer failed to start:', err.message); }

  try {
    // Phase 4: AzuraCast uploader — runs every hour
    const { startAzuraCast } = await import('./azuracast.js');
    startAzuraCast?.();
    console.log('📻 AzuraCast uploader started');
  } catch (err) { console.error('AzuraCast failed to start:', err.message); }

  try {
    // Phase 5: Social poster — runs every hour at :30
    runSocialPoster();
    console.log('📱 Social poster started');
  } catch (err) { console.error('Social poster failed to start:', err.message); }
}
