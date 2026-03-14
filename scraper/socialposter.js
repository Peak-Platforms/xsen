// socialposter.js - XSEN Phase 5: Audiogram + Social Distribution
// Picks up aired episodes → FFmpeg audiogram → Supabase Storage → Social post

import { createClient } from '@supabase/supabase-js';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const WORK_DIR = '/tmp/xsen_social';

// ─── School branding ──────────────────────────────────────────────────────────
const SCHOOL_BRAND = {
  MASTER: { bg: '#CC0000', text: '#FFFFFF', accent: '#FFD700', label: 'XSEN FanCast' },
  OU:     { bg: '#841617', text: '#FDF9D8', accent: '#C9A84C', label: 'XSEN Sooners'  },
  OSU:    { bg: '#FF6600', text: '#000000', accent: '#FFFFFF', label: 'XSEN Cowboys'  },
  TEXAS:  { bg: '#BF5700', text: '#FFFFFF', accent: '#F0E68C', label: 'XSEN Longhorns'},
};

const DEFAULT_BRAND = SCHOOL_BRAND.MASTER;

// ─── Check FFmpeg installed ───────────────────────────────────────────────────
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ─── Install FFmpeg if missing (Railway/Ubuntu) ───────────────────────────────
async function ensureFFmpeg() {
  if (checkFFmpeg()) {
    console.log('[Social] FFmpeg ready');
    return true;
  }
  console.log('[Social] Installing FFmpeg...');
  try {
    execSync('apt-get install -y ffmpeg', { stdio: 'inherit' });
    console.log('[Social] FFmpeg installed');
    return true;
  } catch (err) {
    console.error('[Social] FFmpeg install failed:', err.message);
    return false;
  }
}

// ─── Download MP3 from Supabase/URL ──────────────────────────────────────────
async function downloadMp3(audioUrl, destPath) {
  try {
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      const res = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(destPath, Buffer.from(res.data));
      return true;
    }

    const storagePath = audioUrl.replace(/^\//, '').replace(/^xsen-audio\//, '');
    const { data, error } = await supabase.storage.from('xsen-audio').download(storagePath);
    if (error) throw new Error(error.message);
    fs.writeFileSync(destPath, Buffer.from(await data.arrayBuffer()));
    return true;
  } catch (err) {
    console.error('[Social] Download error:', err.message);
    return false;
  }
}

// ─── Generate background image with ImageMagick/FFmpeg ───────────────────────
async function generateBackground(brand, title, school, outputPath) {
  // Sanitize title for FFmpeg drawtext
  const safeTitle = title
    .replace(/['"\\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);

  const schoolLabel = (SCHOOL_BRAND[school] || DEFAULT_BRAND).label;

  // FFmpeg lavfi generates colored background with text overlay
  const cmd = [
    'ffmpeg -y',
    '-f lavfi',
    `-i color=c=${brand.bg.replace('#','')}:size=1080x1080:rate=1`,
    '-vframes 1',
    // Top bar
    `-vf "`,
    `drawrect=x=0:y=0:w=1080:h=120:color=${brand.accent.replace('#','')}@1.0:t=fill,`,
    // XSEN label
    `drawtext=text='${schoolLabel.toUpperCase()}':fontsize=52:fontcolor=${brand.bg.replace('#','')}:x=40:y=35:font=DejaVuSans-Bold,`,
    // ON AIR badge
    `drawtext=text='ON AIR':fontsize=28:fontcolor=${brand.bg.replace('#','')}:x=900:y=46:font=DejaVuSans-Bold,`,
    // Episode title — word wrapped manually at 36 chars
    `drawtext=text='${safeTitle.substring(0,40)}':fontsize=44:fontcolor=${brand.text.replace('#','')}:x=40:y=200:font=DejaVuSans-Bold,`,
    `drawtext=text='${safeTitle.substring(40,80)}':fontsize=44:fontcolor=${brand.text.replace('#','')}:x=40:y=260:font=DejaVuSans-Bold,`,
    // Bottom bar
    `drawrect=x=0:y=960:w=1080:h=120:color=${brand.accent.replace('#','')}@0.9:t=fill,`,
    // CTA
    `drawtext=text='xsen.fun':fontsize=40:fontcolor=${brand.bg.replace('#','')}:x=40:y=983:font=DejaVuSans-Bold`,
    `"`,
    outputPath
  ].join(' ');

  try {
    await execAsync(cmd);
    return true;
  } catch (err) {
    console.error('[Social] Background gen error:', err.message);
    return false;
  }
}

// ─── Generate audiogram MP4 ───────────────────────────────────────────────────
async function generateAudiogram(mp3Path, bgPath, outputPath, durationSecs = 90) {
  // Trim audio to durationSecs, add waveform visualization overlay
  const cmd = [
    'ffmpeg -y',
    `-t ${durationSecs}`,          // trim to 90 seconds
    `-i "${mp3Path}"`,             // audio input
    `-loop 1 -i "${bgPath}"`,      // background image (looped)
    '-filter_complex',
    '"',
    // Show waveform in center band
    `[0:a]showwaves=s=1080x200:mode=cline:rate=30:colors=white@0.9[wave];`,
    // Stack: top of bg (760px) + wave (200px) + bottom of bg (120px)
    `[1:v]crop=1080:760:0:0[top];`,
    `[1:v]crop=1080:120:0:960[bot];`,
    `[top][wave][bot]vstack=inputs=3[vid]`,
    '"',
    '-map "[vid]"',
    '-map 0:a',
    '-c:v libx264 -preset fast -crf 23',
    '-c:a aac -b:a 128k',
    `-t ${durationSecs}`,
    '-pix_fmt yuv420p',
    '-movflags +faststart',
    outputPath
  ].join(' ');

  try {
    await execAsync(cmd, { timeout: 300000 }); // 5 min timeout
    return true;
  } catch (err) {
    console.error('[Social] Audiogram gen error:', err.message);
    // Try simpler fallback
    return await generateSimpleAudiogram(mp3Path, bgPath, outputPath, durationSecs);
  }
}

// ─── Simpler fallback audiogram (bg image + audio only) ──────────────────────
async function generateSimpleAudiogram(mp3Path, bgPath, outputPath, durationSecs = 90) {
  const cmd = [
    'ffmpeg -y',
    `-t ${durationSecs}`,
    `-loop 1 -i "${bgPath}"`,
    `-i "${mp3Path}"`,
    '-c:v libx264 -preset fast -crf 23 -tune stillimage',
    '-c:a aac -b:a 128k',
    `-t ${durationSecs}`,
    '-pix_fmt yuv420p',
    '-shortest',
    '-movflags +faststart',
    outputPath
  ].join(' ');

  try {
    await execAsync(cmd, { timeout: 300000 });
    console.log('[Social] Used simple audiogram fallback');
    return true;
  } catch (err) {
    console.error('[Social] Simple audiogram failed:', err.message);
    return false;
  }
}

// ─── Upload audiogram to Supabase Storage ────────────────────────────────────
async function uploadAudiogram(episodeId, school, videoPath) {
  const filename = `audiograms/${school}/${episodeId}.mp4`;
  const buffer = fs.readFileSync(videoPath);

  const { error } = await supabase.storage
    .from('xsen-audio')
    .upload(filename, buffer, { contentType: 'video/mp4', upsert: true });

  if (error) throw new Error(`Upload error: ${error.message}`);

  const { data } = supabase.storage.from('xsen-audio').getPublicUrl(filename);
  return data.publicUrl;
}

// ─── Generate social caption with Claude ─────────────────────────────────────
async function generateCaption(episode) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a punchy social media caption for this XSEN FanCast episode. 2-3 sentences max. Include 3-4 relevant hashtags. End with "Listen at xsen.fun"

Episode title: ${episode.title}
School: ${episode.school}
Score: ${episode.score}/10`
        }]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || episode.title;
  } catch {
    return `${episode.title} — Listen at xsen.fun #XSEN #CollegeFootball #NIL #CFB`;
  }
}

// ─── Save social post record to Supabase ─────────────────────────────────────
async function saveSocialPost(episodeId, videoUrl, caption) {
  await supabase.from('xsen_social_posts').insert({
    episode_id: episodeId,
    video_url: videoUrl,
    caption,
    status: 'ready',
    created_at: new Date().toISOString()
  });
}

// ─── Mark episode as social_ready ────────────────────────────────────────────
async function markSocialReady(episodeId, videoUrl) {
  await supabase
    .from('xsen_episodes')
    .update({ social_video_url: videoUrl, social_status: 'ready' })
    .eq('id', episodeId);
}

// ─── Process one episode ──────────────────────────────────────────────────────
async function processEpisode(episode) {
  const brand = SCHOOL_BRAND[episode.school] || DEFAULT_BRAND;
  const workDir = `${WORK_DIR}/${episode.id}`;
  fs.mkdirSync(workDir, { recursive: true });

  const mp3Path  = `${workDir}/audio.mp3`;
  const bgPath   = `${workDir}/bg.png`;
  const vidPath  = `${workDir}/audiogram.mp4`;

  console.log(`\n[Social] Processing: "${episode.title.substring(0,60)}..."`);
  console.log(`[Social] School: ${episode.school}`);

  try {
    // 1. Download audio
    console.log('[Social] Downloading audio...');
    const downloaded = await downloadMp3(episode.audio_url, mp3Path);
    if (!downloaded) throw new Error('Audio download failed');
    console.log(`[Social] Audio: ${Math.round(fs.statSync(mp3Path).size / 1024)}KB`);

    // 2. Generate background
    console.log('[Social] Generating background...');
    const bgOk = await generateBackground(brand, episode.title, episode.school, bgPath);
    if (!bgOk) throw new Error('Background generation failed');

    // 3. Generate audiogram
    console.log('[Social] Rendering audiogram (90 seconds)...');
    const vidOk = await generateAudiogram(mp3Path, bgPath, vidPath, 90);
    if (!vidOk) throw new Error('Audiogram generation failed');
    console.log(`[Social] Video: ${Math.round(fs.statSync(vidPath).size / 1024 / 1024 * 10) / 10}MB`);

    // 4. Upload to Supabase
    console.log('[Social] Uploading to storage...');
    const videoUrl = await uploadAudiogram(episode.id, episode.school, vidPath);
    console.log(`[Social] Stored: ${videoUrl}`);

    // 5. Generate caption
    console.log('[Social] Writing caption...');
    const caption = await generateCaption(episode);
    console.log(`[Social] Caption: ${caption.substring(0,80)}...`);

    // 6. Save social post record
    await saveSocialPost(episode.id, videoUrl, caption);
    await markSocialReady(episode.id, videoUrl);

    console.log(`[Social] ✅ Audiogram ready: ${episode.title.substring(0,50)}`);
    return { videoUrl, caption };

  } catch (err) {
    console.error(`[Social] ✗ Failed: ${err.message}`);
    await supabase.from('xsen_episodes')
      .update({ social_status: 'failed' })
      .eq('id', episode.id);
    return null;
  } finally {
    // Cleanup temp files
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Main run ─────────────────────────────────────────────────────────────────
export async function runSocialPoster() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 XSEN Social Poster — ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  const ffmpegReady = await ensureFFmpeg();
  if (!ffmpegReady) {
    console.error('[Social] FFmpeg not available — skipping');
    return;
  }

  fs.mkdirSync(WORK_DIR, { recursive: true });

  // Get aired episodes that don't have a social video yet
  const { data: episodes, error } = await supabase
    .from('xsen_episodes')
    .select('*')
    .eq('status', 'aired')
    .is('social_video_url', null)
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: true })
    .limit(3); // Process 3 at a time to manage CPU

  if (error) { console.error('[Social] Fetch error:', error.message); return; }

  if (!episodes?.length) {
    console.log('[Social] No new aired episodes to process.');
    return;
  }

  console.log(`[Social] Found ${episodes.length} episode(s) to process`);

  for (const episode of episodes) {
    await processEpisode(episode);
    await new Promise(r => setTimeout(r, 2000)); // Breathe between renders
  }

  // Print ready posts
  const { data: ready } = await supabase
    .from('xsen_social_posts')
    .select('episode_id, caption, video_url, status, created_at')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(5);

  if (ready?.length) {
    console.log(`\n📱 SOCIAL POSTS READY (${ready.length}):`);
    console.log('─'.repeat(60));
    ready.forEach(p => {
      console.log(`✓ ${p.caption?.substring(0, 60)}...`);
      console.log(`  ${p.video_url}`);
    });
  }

  console.log('\n✅ Social poster run complete\n');
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
runSocialPoster();

// Run 30 mins after azuracast (which runs hourly) — gives episodes time to air first
cron.schedule('30 * * * *', () => { runSocialPoster(); });

console.log('⏰ Social Poster scheduled — running every hour at :30');
