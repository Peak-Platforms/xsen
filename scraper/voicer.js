// voicer.js - XSEN Phase 3: ElevenLabs Voicing Pipeline
// Pulls approved episodes → ElevenLabs API → MP3 → Supabase Storage

import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

// ─── Voice Settings ───────────────────────────────────────────────────────────

const VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.85,
  style: 0.35,
  use_speaker_boost: true
};

const MODEL_ID = "eleven_turbo_v2_5"; // Half cost, high quality — saves 50% credits

// ─── Clean Script for TTS ─────────────────────────────────────────────────────

function cleanScriptForTTS(script) {
  return script
    .replace(/\[PAUSE\]/g, '... ')
    .replace(/\[SCHOOL SEGMENT - \w+\]\n\n/g, '... ')
    .replace(/\n\n+/g, '\n')
    .replace(/\*\*/g, '')
    .trim();
}

// ─── ElevenLabs API Call ──────────────────────────────────────────────────────

async function generateAudio(script) {
  const cleanedScript = cleanScriptForTTS(script);
  const chunks = chunkScript(cleanedScript, 4500);

  if (chunks.length === 1) {
    return await callElevenLabs(chunks[0]);
  }

  console.log(`   📄 Script chunked into ${chunks.length} parts`);
  const audioBuffers = [];
  for (const chunk of chunks) {
    const buffer = await callElevenLabs(chunk);
    audioBuffers.push(buffer);
    await new Promise(r => setTimeout(r, 500));
  }

  const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
  return Buffer.concat(audioBuffers, totalLength);
}

function chunkScript(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function callElevenLabs(text) {
  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

async function uploadAudioToSupabase(episodeId, school, audioBuffer) {
  const filename = `episodes/${school}/${episodeId}.mp3`;

  const { data, error } = await supabase.storage
    .from('xsen-audio')
    .upload(filename, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('xsen-audio')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

async function updateEpisodeVoiced(id, audioUrl) {
  const { error } = await supabase
    .from('xsen_episodes')
    .update({ status: 'voiced', audio_url: audioUrl })
    .eq('id', id);

  if (error) throw new Error(`Update error: ${error.message}`);
}

async function markEpisodeFailed(id, reason) {
  await supabase
    .from('xsen_episodes')
    .update({ status: 'voice_failed' })
    .eq('id', id);
  console.error(`   ✗ Episode ${id} failed: ${reason}`);
}

// ─── Get Approved Episodes — MASTER only until school clients onboarded ───────

async function getApprovedEpisodes(limit = 5) {
  const { data, error } = await supabase
    .from('xsen_episodes')
    .select('*')
    .eq('status', 'approved')
    .eq('school', 'MASTER')  // Voice MASTER only — school episodes wait for paying clients
    .order('approved_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Fetch error:', error.message);
    return [];
  }
  return data || [];
}

// ─── Main Voicing Run ─────────────────────────────────────────────────────────

async function runVoicer() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎙️  XSEN Voicer — ${new Date().toLocaleString()}`);
  console.log("=".repeat(60));

  if (!ELEVENLABS_VOICE_ID) {
    console.error('✗ ELEVENLABS_VOICE_ID not set — skipping voicing run');
    return;
  }

  const episodes = await getApprovedEpisodes(5);

  if (!episodes.length) {
    console.log('No approved MASTER episodes to voice.');
    return;
  }

  console.log(`\n🎤 Voicing ${episodes.length} approved MASTER episodes...`);

  for (const episode of episodes) {
    console.log(`\n📼 [${episode.school}] ${episode.title.substring(0, 60)}...`);
    console.log(`   Duration estimate: ~${Math.round(episode.duration_estimate / 60)} min`);

    try {
      console.log(`   🔊 Calling ElevenLabs (${MODEL_ID})...`);
      const audioBuffer = await generateAudio(episode.script);
      const actualSizeKB = Math.round(audioBuffer.length / 1024);
      console.log(`   ✓ Audio generated: ${actualSizeKB}KB`);

      console.log(`   ☁️  Uploading to storage...`);
      const audioUrl = await uploadAudioToSupabase(episode.id, episode.school, audioBuffer);
      console.log(`   ✓ Stored: ${audioUrl}`);

      await updateEpisodeVoiced(episode.id, audioUrl);
      console.log(`   ✅ Episode voiced and ready for AzuraCast`);

      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      await markEpisodeFailed(episode.id, err.message);
    }
  }

  const { data: voiced } = await supabase
    .from('xsen_episodes')
    .select('title, school, audio_url, duration_estimate')
    .eq('status', 'voiced')
    .order('created_at', { ascending: false })
    .limit(10);

  if (voiced?.length) {
    console.log(`\n📻 VOICED — READY FOR AZURACAST (${voiced.length} total):`);
    console.log("─".repeat(60));
    voiced.forEach(e => {
      const mins = Math.round(e.duration_estimate / 60);
      console.log(`[${e.school}] ~${mins}min → ${e.title.substring(0, 50)}...`);
      console.log(`  ${e.audio_url}`);
    });
  }

  console.log(`\n✅ Voicing run complete\n`);
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

runVoicer();

cron.schedule("0 * * * *", () => {
  runVoicer();
});

console.log("⏰ Voicer scheduled — checking for approved episodes every hour");
