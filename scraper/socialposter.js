// socialposter.js - XSEN Phase 5: Audiogram + Social Distribution
// Picks up aired episodes → FFmpeg audiogram → Supabase Storage → Twitter/X

import { createClient } from '@supabase/supabase-js';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import axios from 'axios';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Twitter/X client ─────────────────────────────────────────────────────────
const twitterClient = new TwitterApi({
  appKey:            process.env.X_API_KEY,
  appSecret:         process.env.X_API_SECRET,
  accessToken:       process.env.X_ACCESS_TOKEN,
  accessSecret:      process.env.X_ACCESS_TOKEN_SECRET,
});

const WORK_DIR = '/tmp/xsen_social';

// ─── School branding ──────────────────────────────────────────────────────────
const SCHOOL_BRAND = {
  MASTER: { bg: '#CC0000', text: '#FFFFFF', accent: '#FFD700', label: 'XSEN FanCast',   hashtags: '#XSEN #CFB #CollegeFootball #NIL' },
  OU:     { bg: '#841617', text: '#FDF9D8', accent: '#C9A84C', label: 'XSEN Sooners',   hashtags: '#BoomerSooner #Sooners #XSEN #CFB' },
  OSU:    { bg: '#FF6600', text: '#000000', accent: '#FFFFFF', label: 'XSEN Cowboys',   hashtags: '#GoPokes #OKState #XSEN #CFB' },
  TEXAS:  { bg: '#BF5700', text: '#FFFFFF', accent: '#F0E68C', label: 'XSEN Longhorns', hashtags: '#HookEm #Longhorns #XSEN #CFB' },
};

const DEFAULT_BRAND = SCHOOL_BRAND.MASTER;

// ─── Check/install FFmpeg ─────────────────────────────────────────────────────
function checkFFmpeg() {
  try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch { return false; }
}

async function ensureFFmpeg() {
  if (checkFFmpeg()) { console.log('[Social] FFmpeg ready'); return true; }
  console.log('[Social] Installing FFmpeg...');
  try {
    execSync('apt-get update && apt-get install -y ffmpeg', { stdio: 'inherit' });
    console.log('[Social] FFmpeg installed');
    return true;
  } catch (err) {
    console.error('[Social] FFmpeg install failed:', err.message);
    return false;
  }
}

// ─── Download MP3 ─────────────────────────────────────────────────────────────
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

// ─── Generate background image ────────────────────────────────────────────────
async function generateBackground(brand, title, school, outputPath) {
  const safeTitle = title.replace(/['"\\:]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80);
  const schoolLabel = (SCHOOL_BRAND[school] || DEFAULT_BRAND).label;

  const cmd = [
    'ffmpeg -y',
    '-f lavfi',
    `-i color=c=${brand.bg.replace('#','')}:size=1080x1080:rate=1`,
    '-vframes 1',
    `-vf "`,
    `drawrect=x=0:y=0:w=1080:h=120:color=${brand.accent.replace('#','')}@1.0:t=fill,`,
    `drawtext=text='${schoolLabel.toUpperCase()}':fontsize=52:fontcolor=${brand.bg.replace('#','')}:x=40:y=35:font=DejaVuSans-Bold,`,
    `drawtext=text='ON AIR':fontsize=28:fontcolor=${brand.bg.replace('#','')}:x=900:y=46:font=DejaVuSans-Bold,`,
    `drawtext=text='${safeTitle.substring(0,40)}':fontsize=44:fontcolor=${brand.text.replace('#','')}:x=40:y=200:font=DejaVuSans-Bold,`,
    `drawtext=text='${safeTitle.substring(40,80)}':fontsize=44:fontcolor=${brand.text.replace('#','')}:x=40:y=260:font=DejaVuSans-Bold,`,
    `drawrect=x=0:y=960:w=1080:h=120:color=${brand.accent.replace('#','')}@0.9:t=fill,`,
    `drawtext=text='xsen.fun':fontsize=40:fontcolor=${brand.bg.replace('#','')}:x=40:y=983:font=DejaVuSans-Bold`,
    `"`,
    outputPath
  ].join(' ');

  try { await execAsync(cmd); return true; }
  catch (err) { console.error('[Social] Background error:', err.message); return false; }
}

// ─── Generate audiogram ───────────────────────────────────────────────────────
async function generateAudiogram(mp3Path, bgPath, outputPath, durationSecs = 90) {
  const cmd = [
    'ffmpeg -y',
    `-t ${durationSecs}`,
    `-i "${mp3Path}"`,
    `-loop 1 -i "${bgPath}"`,
    '-filter_complex',
    '"',
    `[0:a]showwaves=s=1080x200:mode=cline:rate=30:colors=white@0.9[wave];`,
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

  try { await execAsync(cmd, { timeout: 300000 }); return true; }
  catch (err) {
    console.error('[Social] Audiogram error:', err.message);
    return await generateSimpleAudiogram(mp3Path, bgPath, outputPath, durationSecs);
  }
}

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

  try { await execAsync(cmd, { timeout: 300000 }); console.log('[Social] Used simple fallback'); return true; }
  catch (err) { console.error('[Social] Simple audiogram failed:', err.message); return false; }
}

// ─── Upload to Supabase ───────────────────────────────────────────────────────
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

// ─── Generate caption with Claude ────────────────────────────────────────────
async function generateCaption(episode) {
  const brand = SCHOOL_BRAND[episode.school] || DEFAULT_BRAND;
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
          content: `Write a punchy Twitter/X post for this XSEN FanCast episode. Max 240 characters including hashtags. Be direct and fan-focused. End with xsen.fun

Episode: ${episode.title}
Hashtags to use: ${brand.hashtags}`
        }]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || `${episode.title.substring(0, 180)} ${brand.hashtags} xsen.fun`;
  } catch {
    return `${episode.title.substring(0, 180)} ${brand.hashtags} xsen.fun`;
  }
}

// ─── Post to Twitter/X ────────────────────────────────────────────────────────
async function postToTwitter(videoPath, caption) {
  if (!process.env.X_API_KEY) {
    console.log('[Social] Twitter keys not set — skipping');
    return null;
  }

  try {
    console.log('[Social] Uploading video to Twitter...');

    // Upload media (chunked for video)
    const mediaId = await twitterClient.v1.uploadMedia(videoPath, {
      mimeType: 'video/mp4',
      longVideo: true
    });

    console.log(`[Social] Media uploaded: ${mediaId}`);

    // Post tweet with media
    const tweet = await twitterClient.v2.tweet({
      text: caption,
      media: { media_ids: [mediaId] }
    });

    console.log(`[Social] ✅ Tweeted: ${tweet.data.id}`);
    return `https://twitter.com/i/web/status/${tweet.data.id}`;

  } catch (err) {
    console.error('[Social] Twitter post failed:', err.message);
    return null;
  }
}

// ─── Save social post record ──────────────────────────────────────────────────
async function saveSocialPost(episodeId, videoUrl, caption, tweetUrl) {
  await supabase.from('xsen_social_posts').insert({
    episode_id: episodeId,
    video_url: videoUrl,
    caption,
    twitter_url: tweetUrl,
    status: tweetUrl ? 'posted' : 'ready',
    posted_at: tweetUrl ? new Date().toISOString() : null,
    created_at: new Date().toISOString()
  });
}

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

  const mp3Path = `${workDir}/audio.mp3`;
  const bgPath  = `${workDir}/bg.png`;
  const vidPath = `${workDir}/audiogram.mp4`;

  console.log(`\n[Social] Processing: "${episode.title.substring(0,60)}..."`);
  console.log(`[Social] School: ${episode.school}`);

  try {
    // 1. Download audio
    console.log('[Social] Downloading audio...');
    const downloaded = await downloadMp3(episode.audio_url, mp3Path);
    if (!downloaded) throw new Error('Audio download failed');

    // 2. Generate background
    console.log('[Social] Generating background...');
    const bgOk = await generateBackground(brand, episode.title, episode.school, bgPath);
    if (!bgOk) throw new Error('Background generation failed');

    // 3. Generate audiogram
    console.log('[Social] Rendering audiogram...');
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

    // 6. Post to Twitter/X
    const tweetUrl = await postToTwitter(vidPath, caption);

    // 7. Save record
    await saveSocialPost(episode.id, videoUrl, caption, tweetUrl);
    await markSocialReady(episode.id, videoUrl);

    console.log(`[Social] ✅ Done: "${episode.title.substring(0,50)}"`);
    return { videoUrl, caption, tweetUrl };

  } catch (err) {
    console.error(`[Social] ✗ Failed: ${err.message}`);
    await supabase.from('xsen_episodes')
      .update({ social_status: 'failed' })
      .eq('id', episode.id);
    return null;
  } finally {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Main run ─────────────────────────────────────────────────────────────────
export async function runSocialPoster() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 XSEN Social Poster — ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  const ffmpegReady = await ensureFFmpeg();
  if (!ffmpegReady) { console.error('[Social] FFmpeg not available — skipping'); return; }

  fs.mkdirSync(WORK_DIR, { recursive: true });

  const { data: episodes, error } = await supabase
    .from('xsen_episodes')
    .select('*')
    .eq('status', 'aired')
    .is('social_video_url', null)
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: true })
    .limit(3);

  if (error) { console.error('[Social] Fetch error:', error.message); return; }
  if (!episodes?.length) { console.log('[Social] No new aired episodes to process.'); return; }

  console.log(`[Social] Found ${episodes.length} episode(s) to process`);

  for (const episode of episodes) {
    await processEpisode(episode);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Social poster run complete\n');
}
