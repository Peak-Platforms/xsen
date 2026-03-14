// index.js - XSEN FanCast Pipeline Coordinator
// Uses dynamic imports to handle any export naming across file versions
 
import express from 'express';
import cron from 'node-cron';
 
const app  = express();
const PORT = process.env.PORT || 8080;
 
app.get('/', (req, res) => res.json({
  status: 'ok',
  service: 'XSEN FanCast Pipeline',
  time: new Date().toISOString()
}));
 
const server = app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
  startPipeline();
});
 
process.on('SIGTERM', () => {
  console.warn('⚠️  Received SIGTERM — waiting for current tasks to finish...');
  server.close(() => {
    console.log('✅ Health check server closed. Shutting down cleanly.');
    process.exit(0);
  });
});
 
// ─── Dynamic import helper ────────────────────────────────────────────────────
async function loadFn(file, ...names) {
  try {
    const mod = await import(file);
    for (const name of names) {
      if (typeof mod[name] === 'function') return mod[name];
    }
    // fallback: module runs itself on import, return no-op
    console.log(`[${file}] loaded (self-executing)`);
    return null;
  } catch (err) {
    console.error(`[${file}] load error: ${err.message}`);
    return null;
  }
}
 
// ─── Start pipeline ───────────────────────────────────────────────────────────
async function startPipeline() {
  console.log('\n🚀 XSEN FanCast Pipeline Starting...\n');
 
  // Phase 1: Scraper
  const scrape = await loadFn('./scraper.js', 'runScraper', 'scrape', 'default');
  if (scrape) {
    scrape();
    cron.schedule('0 */2 * * *', scrape);
    console.log('📡 Scraper started');
  }
 
  // Phase 2: Script Generator
  const scriptgen = await loadFn('./scriptgen.js', 'runScriptGenerator', 'runScripts', 'generate', 'default');
  if (scriptgen) {
    scriptgen();
    cron.schedule('30 */2 * * *', scriptgen);
    console.log('✍️  Script generator started');
  }
 
  // Phase 3: Voicer
  const voice = await loadFn('./voicer.js', 'runVoicer', 'voice', 'default');
  if (voice) {
    voice();
    cron.schedule('0 * * * *', voice);
    console.log('🎙️  Voicer started');
  }
 
  // Phase 4: AzuraCast
  const azura = await loadFn('./azuracast.js', 'startAzuraCast', 'runAzuraCast', 'default');
  if (azura) {
    azura();
    console.log('📻 AzuraCast uploader started');
  }
 
  // Phase 5: Social Poster
  const social = await loadFn('./socialposter.js', 'runSocialPoster', 'default');
  if (social) {
    social();
    cron.schedule('30 * * * *', social);
    console.log('📱 Social poster started');
  }
 
  console.log('\n✅ All phases started\n');
}
