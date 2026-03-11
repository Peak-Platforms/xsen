// scriptgen.js - XSEN Phase 2: Script Generator
// Pulls queued stories from Supabase → Claude writes broadcast episodes

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import cron from "node-cron";
import * as dotenv from "dotenv";
import { SCHOOL_CONFIG } from "./sources.js";

dotenv.config();

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ─── Host Persona ─────────────────────────────────────────────────────────────

const XSEN_HOST_PERSONA = `
You are the host of XSEN FanCast — the only broadcast network built for college football fans.
Your name is Kevin. You are a lifelong college football fan since 1978. You've watched this sport transform from something pure into a battleground for money, power, and private equity firms who don't care about fans.

Your voice is:
- Direct and plainspoken — you talk to fans like a fellow fan, not a journalist
- Passionate but informed — you've done the research so fans don't have to
- Occasionally outraged — because what's happening to CFB deserves outrage
- Always ending with a call to action — fans need to know they have a voice

Your mission: Educate fans about what's happening to THEIR sport and give them a seat at the table.
`;

// ─── Script Templates ─────────────────────────────────────────────────────────

function buildMasterScriptPrompt(story) {
  return `${XSEN_HOST_PERSONA}

Write a broadcast-ready radio episode script based on this story.

STORY TITLE: ${story.title}
STORY SUMMARY: ${story.summary || "No summary available"}
STORY TOPICS: ${story.topics?.join(", ")}
RELEVANCE SCORE: ${story.relevance_score}/10

SCRIPT REQUIREMENTS:
- Opens with a strong hook that grabs fan attention in first 10 seconds
- Explains the story in plain language any CFB fan understands
- Connects it to the bigger picture (NIL, private equity, fan rights)
- Includes at least one specific fact or detail from the story
- Ends with a clear call to action ("This is why XSEN exists...")
- Runtime: ${story.episode_type === "full_episode" ? "4-6 minutes (approximately 600-900 words)" : "2-3 minutes (approximately 300-450 words)"}
- Written entirely as spoken word — no headers, no bullet points, just natural speech
- Include natural pause indicators like [PAUSE] where the host would breathe or let something land

IMPORTANT: Write ONLY the script. No stage directions except [PAUSE]. No preamble. Start speaking immediately.`;
}

function buildSchoolOutroPrompt(story, school) {
  const config = SCHOOL_CONFIG[school];
  if (!config) return null;

  return `${XSEN_HOST_PERSONA}

Write a 60-90 second school-specific closing segment for ${config.name} fans.
This closes out the main episode about: "${story.title}"

The segment should:
- Address ${config.fanbase} directly by name
- Connect the story specifically to ${config.name}'s situation in the ${config.conference}
- Reference any relevant rivalry context with ${config.rivalries?.join(" or ")} if applicable
- End with: "This is XSEN FanCast — your voice in college football."
- Be written as natural spoken word only

Write ONLY the closing segment script. Start speaking immediately.`;
}

// ─── Script Generation ────────────────────────────────────────────────────────

async function generateMasterScript(story) {
  const prompt = buildMasterScriptPrompt(story);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text.trim();
}

async function generateSchoolOutro(story, school) {
  const prompt = buildSchoolOutroPrompt(story, school);
  if (!prompt) return null;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text.trim();
}

function estimateDuration(script) {
  // Average speaking pace: ~150 words per minute
  const wordCount = script.split(/\s+/).length;
  return Math.round((wordCount / 150) * 60); // returns seconds
}

// ─── Supabase Operations ──────────────────────────────────────────────────────

async function getQueuedStories(limit = 5) {
  const { data, error } = await supabase
    .from("xsen_stories")
    .select("*")
    .eq("status", "queued")
    .order("relevance_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch error:", error.message);
    return [];
  }
  return data || [];
}

async function saveEpisode(storyId, school, title, script, episodeType) {
  const duration = estimateDuration(script);

  const { data, error } = await supabase
    .from("xsen_episodes")
    .insert({
      story_id: storyId,
      school,
      title,
      script,
      episode_type: episodeType,
      duration_estimate: duration,
      status: "script_ready"
    })
    .select()
    .single();

  if (error) {
    console.error("Episode save error:", error.message);
    return null;
  }
  return data;
}

async function markStoryProduced(storyId) {
  await supabase
    .from("xsen_stories")
    .update({ status: "produced" })
    .eq("id", storyId);
}

// ─── Main Generator ───────────────────────────────────────────────────────────

async function generateEpisodesForStory(story) {
  console.log(`\n📝 Generating scripts for:`);
  console.log(`   [${story.relevance_score}/10] ${story.title}`);
  console.log(`   Type: ${story.episode_type} | Schools: ${story.affected_schools?.join(", ") || "ALL_CFB"}`);

  const episodes = [];

  // 1. Generate master script
  console.log(`   ✍️  Writing master script...`);
  const masterScript = await generateMasterScript(story);
  const masterEpisode = await saveEpisode(
    story.id,
    "MASTER",
    story.title,
    masterScript,
    story.episode_type
  );

  if (masterEpisode) {
    episodes.push(masterEpisode);
    const duration = estimateDuration(masterScript);
    console.log(`   ✅ Master script: ~${Math.round(duration / 60)} min (${masterScript.split(/\s+/).length} words)`);
  }

  // 2. Generate school-specific outros
  const schools = story.affected_schools?.filter(s => SCHOOL_CONFIG[s]) || [];

  // If ALL_CFB, generate for all three main schools
  const targetSchools = story.affected_schools?.includes("ALL_CFB")
    ? Object.keys(SCHOOL_CONFIG)
    : schools;

  for (const school of targetSchools) {
    await new Promise(r => setTimeout(r, 800)); // rate limit

    console.log(`   ✍️  Writing ${school} outro...`);
    const outro = await generateSchoolOutro(story, school);

    if (outro) {
      // Full episode = master + school outro combined
      const fullScript = `${masterScript}\n\n[SCHOOL SEGMENT - ${school}]\n\n${outro}`;
      const schoolEpisode = await saveEpisode(
        story.id,
        school,
        `${story.title} — ${SCHOOL_CONFIG[school].name}`,
        fullScript,
        story.episode_type
      );

      if (schoolEpisode) {
        episodes.push(schoolEpisode);
        console.log(`   ✅ ${school} episode saved`);
      }
    }
  }

  // 3. Mark story as produced
  await markStoryProduced(story.id);
  console.log(`   🎙️  ${episodes.length} episodes ready for voicing`);

  return episodes;
}

async function runScriptGenerator() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✍️  XSEN Script Generator — ${new Date().toLocaleString()}`);
  console.log("=".repeat(60));

  const stories = await getQueuedStories(3); // Process 3 at a time

  if (!stories.length) {
    console.log("No queued stories to process.");
    return;
  }

  console.log(`\nFound ${stories.length} queued stories to script`);

  let totalEpisodes = 0;

  for (const story of stories) {
    try {
      const episodes = await generateEpisodesForStory(story);
      totalEpisodes += episodes.length;
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ✗ Failed for "${story.title}": ${err.message}`);
    }
  }

  // Print ready queue
  const { data: ready } = await supabase
    .from("xsen_episodes")
    .select("title, school, episode_type, duration_estimate")
    .eq("status", "script_ready")
    .order("created_at", { ascending: false })
    .limit(10);

  if (ready?.length) {
    console.log(`\n🎙️  EPISODES READY FOR VOICING (${ready.length} total):`);
    console.log("─".repeat(60));
    ready.forEach(e => {
      const mins = Math.round(e.duration_estimate / 60);
      console.log(`[${e.school}] ${e.episode_type} ~${mins}min → ${e.title.substring(0, 55)}...`);
    });
  }

  console.log(`\n✅ Script generation complete — ${totalEpisodes} new episodes written\n`);
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

// Run immediately
runScriptGenerator();

// Then every 2 hours (offset from scraper by 30 min)
cron.schedule("30 */2 * * *", () => {
  runScriptGenerator();
});

console.log("⏰ Script Generator scheduled — running every 2 hours");
