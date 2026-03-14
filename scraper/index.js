// index.js - XSEN FanCast Pipeline Coordinator

import { runScraper }      from './scraper.js';
import { runVoicer }       from './voicer.js';
import { startAzuraCast }  from './azuracast.js';
import { runSocialPoster } from './socialposter.js';
import express from 'express';
import cron from 'node-cron';

const app  = express();
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

// ─── Start pipeline ───────────────────────────────────────────────────────────
async function startPipeline() {
  console.log('\n🚀 XSEN FanCast Pipeline Starting...\n');

  // Phase 1: Scraper — runs immediately then every 2 hours
  try {
    runScraper();
    cron.schedule('0 */2 * * *', () => runScraper());
    console.log('📡 Scraper started');
  } catch (err) { console.error('Scraper failed:', err.message); }

  // Phase 2: Script Generator — dynamic import to handle export name
  try {
    const sg = await import('./scriptgen.js');
    const runSG = sg.runScriptGenerator || sg.runScripts || sg.default;
    if (runSG) {
      runSG();
      cron.schedule('30 */2 * * *', () => runSG());
      console.log('✍️  Script generator started');
    } else {
      console.error('Script generator: no export found');
    }
  } catch (err) { console.error('Scriptgen failed:', err.message); }

  // Phase 3: Voicer — every hour
  try {
    runVoicer();
    cron.schedule('0 * * * *', () => runVoicer());
    console.log('🎙️  Voicer started');
  } catch (err) { console.error('Voicer failed:', err.message); }

  // Phase 4: AzuraCast — every hour
  try {
    startAzuraCast();
    console.log('📻 AzuraCast uploader started');
  } catch (err) { console.error('AzuraCast failed:', err.message); }

  // Phase 5: Social Poster — every hour at :30
  try {
    runSocialPoster();
    cron.schedule('30 * * * *', () => runSocialPoster());
    console.log('📱 Social poster started');
  } catch (err) { console.error('Social poster failed:', err.message); }
}
