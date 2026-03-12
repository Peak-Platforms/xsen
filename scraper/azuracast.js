import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const AZURACAST_URL  = "http://157.245.208.49";
const AZURACAST_KEY  = "7b1a1ffdb9291bb1:912efae9b008fb4db4a20e26c9169d9a";
const STATION        = "xsen_the_fans_network";
const PLAYLIST_ID    = "1";

const CHECK_INTERVAL = 60 * 60 * 1000; // every hour

// ─── Main upload loop ──────────────────────────────────────────────────────────
export async function runAzuraCast() {
  console.log('[AzuraCast] Checking for voiced episodes to upload...');
  console.log(`[AzuraCast] URL: ${AZURACAST_URL} | Station: ${STATION} | Playlist: ${PLAYLIST_ID}`);

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
  console.log(`[AzuraCast] Audio URL: ${ep.audio_url}`);

  try {
    const mp3Buffer = await downloadMp3(ep.audio_url);
    if (!mp3Buffer) {
      console.error(`[AzuraCast] Failed to download MP3 for episode ${ep.id}`);
      return;
    }

    console.log(`[AzuraCast] Downloaded ${Math.round(mp3Buffer.length / 1024)}KB`);

    const safeTitle = ep.title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 60);
    const filename = `xsen_${ep.school}_${safeTitle}.mp3`;

    const mediaId = await uploadToAzuraCast(mp3Buffer, filename);
    if (!mediaId) {
      console.error(`[AzuraCast] Upload to AzuraCast failed for episode ${ep.id}`);
      return;
    }

    const added = await addToPlaylist(mediaId);
    if (!added) {
      console.error(`[AzuraCast] Failed to add episode ${ep.id} to playlist`);
      return;
    }

    const { error } = await supabase
      .from('xsen_episodes')
      .update({ status: 'aired', approved_at: new Date().toISOString() })
      .eq('id', ep.id);

    if (error) {
      console.error(`[AzuraCast] Failed to update status:`, error.message);
      return;
    }

    console.log(`[AzuraCast] ✓ Episode aired: "${ep.title}" (${ep.school})`);

  } catch (err) {
    console.error(`[AzuraCast] Unexpected error for episode ${ep.id}:`, err.message);
  }
}

// ─── Download MP3 ─────────────────────────────────────────────────────────────
async function downloadMp3(audioUrl) {
  try {
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      const res = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    }

    // Supabase storage path
    const storagePath = audioUrl.replace(/^\//, '').replace(/^xsen-audio\//, '');
    console.log(`[AzuraCast] Downloading from Supabase storage: ${storagePath}`);
    const { data, error } = await supabase.storage
      .from('xsen-audio')
      .download(storagePath);

    if (error) {
      console.error('[AzuraCast] Supabase storage error:', error.message);
      return null;
    }

    return Buffer.from(await data.arrayBuffer());
  } catch (err) {
    console.error('[AzuraCast] Download error:', err.message);
    return null;
  }
}

// ─── Upload to AzuraCast ───────────────────────────────────────────────────────
async function uploadToAzuraCast(buffer, filename) {
  try {
    const uploadUrl = `${AZURACAST_URL}/api/station/${STATION}/files`;
    console.log(`[AzuraCast] POST ${uploadUrl}`);

    // AzuraCast API requires base64 encoded file with path
    const base64 = buffer.toString('base64');
    const payload = {
      path: filename,
      file: `data:audio/mpeg;base64,${base64}`
    };

    const res = await axios.post(uploadUrl, payload, {
      headers: {
        'X-API-Key': AZURACAST_KEY,
        'Content-Type': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const mediaId = res.data?.id || res.data?.unique_id;
    console.log(`[AzuraCast] File uploaded, media ID: ${mediaId}`);
    return mediaId;

  } catch (err) {
    console.error('[AzuraCast] Upload error:', err.response?.data || err.message);
    return null;
  }
}

// ─── Add to playlist ──────────────────────────────────────────────────────────
async function addToPlaylist(mediaId) {
  try {
    const playlistUrl = `${AZURACAST_URL}/api/station/${STATION}/playlist/${PLAYLIST_ID}/apply-to`;
    console.log(`[AzuraCast] Adding to playlist: ${playlistUrl}`);

    await axios.put(playlistUrl, { media_ids: [mediaId] }, {
      headers: {
        'X-API-Key': AZURACAST_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[AzuraCast] Added to playlist ${PLAYLIST_ID}`);
    return true;

  } catch (err) {
    console.error('[AzuraCast] Playlist error:', err.response?.data || err.message);
    return false;
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
export function startAzuraCast() {
  console.log('[AzuraCast] Uploader started — checking every hour for voiced episodes.');
  runAzuraCast();
  setInterval(runAzuraCast, CHECK_INTERVAL);
}
