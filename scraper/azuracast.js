import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import FormData from 'form-data';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const AZURACAST_URL   = process.env.AZURACAST_URL   || 'http://157.245.208.49';
const AZURACAST_KEY   = process.env.AZURACAST_KEY;
const STATION         = process.env.AZURACAST_STATION || 'xsen_the_fans_network';
const PLAYLIST_ID     = process.env.AZURACAST_PLAYLIST_ID || '1';

const CHECK_INTERVAL  = 60 * 60 * 1000; // every hour

// ─── Main upload loop ──────────────────────────────────────────────────────────
export async function runAzuraCast() {
  console.log('[AzuraCast] Checking for voiced episodes to upload...');

  // Pull all voiced episodes that have an audio_url
  const { data: episodes, error } = await supabase
    .from('xsen_episodes')
    .select('id, title, school, audio_url')
    .eq('status', 'voiced')
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[AzuraCast] Supabase error:', error.message);
    return;
  }

  if (!episodes || episodes.length === 0) {
    console.log('[AzuraCast] No voiced episodes waiting. Done.');
    return;
  }

  console.log(`[AzuraCast] Found ${episodes.length} episode(s) to upload.`);

  for (const ep of episodes) {
    await uploadEpisode(ep);
  }
}

// ─── Upload single episode ─────────────────────────────────────────────────────
async function uploadEpisode(ep) {
  console.log(`[AzuraCast] Uploading: "${ep.title}" (${ep.school})`);

  try {
    // 1. Download the MP3 from Supabase Storage
    const mp3Buffer = await downloadMp3(ep.audio_url);
    if (!mp3Buffer) {
      console.error(`[AzuraCast] Failed to download MP3 for episode ${ep.id}`);
      return;
    }

    // 2. Build a clean filename
    const safeTitle = ep.title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 60);
    const filename = `xsen_${ep.school}_${safeTitle}.mp3`;

    // 3. Upload to AzuraCast media library
    const mediaId = await uploadToAzuraCast(mp3Buffer, filename);
    if (!mediaId) {
      console.error(`[AzuraCast] Upload failed for episode ${ep.id}`);
      return;
    }

    // 4. Add to playlist
    const added = await addToPlaylist(mediaId);
    if (!added) {
      console.error(`[AzuraCast] Failed to add episode ${ep.id} to playlist`);
      return;
    }

    // 5. Mark as aired in Supabase
    const { error } = await supabase
      .from('xsen_episodes')
      .update({
        status: 'aired',
        approved_at: new Date().toISOString()
      })
      .eq('id', ep.id);

    if (error) {
      console.error(`[AzuraCast] Failed to update status for episode ${ep.id}:`, error.message);
      return;
    }

    console.log(`[AzuraCast] ✓ Episode aired: "${ep.title}" (${ep.school})`);

  } catch (err) {
    console.error(`[AzuraCast] Unexpected error for episode ${ep.id}:`, err.message);
  }
}

// ─── Download MP3 from Supabase Storage URL ────────────────────────────────────
async function downloadMp3(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[AzuraCast] MP3 download failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error('[AzuraCast] MP3 download error:', err.message);
    return null;
  }
}

// ─── Upload MP3 buffer to AzuraCast media library ──────────────────────────────
async function uploadToAzuraCast(buffer, filename) {
  try {
    const form = new FormData();
    form.append('file', buffer, {
      filename,
      contentType: 'audio/mpeg'
    });

    const res = await fetch(
      `${AZURACAST_URL}/api/station/${STATION}/files`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': AZURACAST_KEY,
          ...form.getHeaders()
        },
        body: form
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[AzuraCast] File upload failed (${res.status}):`, text);
      return null;
    }

    const data = await res.json();
    const mediaId = data.id || data.unique_id;
    console.log(`[AzuraCast] File uploaded, media ID: ${mediaId}`);
    return mediaId;

  } catch (err) {
    console.error('[AzuraCast] Upload error:', err.message);
    return null;
  }
}

// ─── Add media file to playlist ────────────────────────────────────────────────
async function addToPlaylist(mediaId) {
  try {
    const res = await fetch(
      `${AZURACAST_URL}/api/station/${STATION}/playlist/${PLAYLIST_ID}/apply-to`,
      {
        method: 'PUT',
        headers: {
          'X-API-Key': AZURACAST_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ media_ids: [mediaId] })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[AzuraCast] Add to playlist failed (${res.status}):`, text);
      return false;
    }

    console.log(`[AzuraCast] Added to playlist ${PLAYLIST_ID}`);
    return true;

  } catch (err) {
    console.error('[AzuraCast] Playlist error:', err.message);
    return false;
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
export function startAzuraCast() {
  console.log('[AzuraCast] Uploader started — checking every hour for voiced episodes.');
  runAzuraCast(); // run immediately on start
  setInterval(runAzuraCast, CHECK_INTERVAL);
}
