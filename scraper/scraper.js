// scraper.js - XSEN News Aggregator Phase 1
// Scrapes RSS + Google News → Supabase → Claude scoring

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import cron from "node-cron";
import * as dotenv from "dotenv";
import { RSS_FEEDS, GOOGLE_NEWS_QUERIES, HIGH_VALUE_KEYWORDS } from "./sources.js";

dotenv.config();

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "XSEN-FanCast-Aggregator/1.0" }
});

// ─── Active sources only ──────────────────────────────────────────────────────

const activeFeeds   = RSS_FEEDS.filter(s => s.active !== false);
const activeQueries = GOOGLE_NEWS_QUERIES.filter(s => s.active !== false);

// ─── Scraper Functions ────────────────────────────────────────────────────────

async function scrapeRSSFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    const stories = parsed.items.slice(0, 10).map(item => ({
      title: item.title?.trim() || "",
      summary: item.contentSnippet?.trim() || item.summary?.trim() || "",
      url: item.link || item.guid || "",
      source: feed.name,
      source_type: "rss",
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      topics: feed.topics || [],
      affected_schools: feed.school ? [feed.school] : [],
      status: "pending"
    }));

    console.log(`  ✓ ${feed.name}: ${stories.length} stories`);
    return stories.filter(s => s.title && s.url);
  } catch (err) {
    console.error(`  ✗ ${feed.name}: ${err.message}`);
    return [];
  }
}

async function scrapeGoogleNews(search) {
  const encodedQuery = encodeURIComponent(search.query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const parsed = await parser.parseURL(url);
    const stories = parsed.items.slice(0, 8).map(item => ({
      title: item.title?.trim() || "",
      summary: item.contentSnippet?.trim() || "",
      url: item.link || "",
      source: `Google News: ${search.query}`,
      source_type: "google_news",
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      topics: search.topics || [],
      affected_schools: search.school ? [search.school] : [],
      status: "pending"
    }));

    console.log(`  ✓ Google News "${search.query}": ${stories.length} stories`);
    return stories.filter(s => s.title && s.url);
  } catch (err) {
    console.error(`  ✗ Google News "${search.query}": ${err.message}`);
    return [];
  }
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

async function saveStories(stories) {
  if (!stories.length) return 0;

  const { data, error } = await supabase
    .from("xsen_stories")
    .upsert(stories, {
      onConflict: "url",
      ignoreDuplicates: true
    });

  if (error) {
    console.error("Supabase save error:", error.message);
    return 0;
  }

  return stories.length;
}

async function getPendingStories(limit = 20) {
  const { data, error } = await supabase
    .from("xsen_stories")
    .select("*")
    .eq("status", "pending")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return [];
  }

  return data || [];
}

async function updateStoryScore(id, scoring) {
  const { error } = await supabase
    .from("xsen_stories")
    .update({
      relevance_score: scoring.score,
      relevance_reason: scoring.reason,
      affected_schools: scoring.schools,
      topics: scoring.topics,
      episode_type: scoring.episode_type,
      status: scoring.score >= 5 ? "queued" : "discarded"
    })
    .eq("id", id);

  if (error) console.error("Score update error:", error.message);
}

// ─── Claude Scoring ───────────────────────────────────────────────────────────

async function scoreStoryWithClaude(story) {
  const prompt = `You are the content editor for XSEN FanCast, a fan-focused college football broadcast network.
Your mission: give fans a voice in the CFB landscape being transformed by NIL, the transfer portal, conference realignment, and private equity firms like Smash Capital.

Score this story for broadcast relevance to XSEN's fan audience.

STORY TITLE: ${story.title}
SUMMARY: ${story.summary || "No summary available"}
SOURCE: ${story.source}

HIGH VALUE KEYWORDS TO WATCH FOR: ${HIGH_VALUE_KEYWORDS ? HIGH_VALUE_KEYWORDS.join(", ") : "NIL, transfer portal, private equity, Smash Capital, realignment"}

Respond ONLY with a JSON object, no other text:
{
  "score": <1-10 integer>,
  "reason": "<one sentence explaining the score>",
  "schools": <array of affected schools using codes like "OU", "OSU", "TEXAS", "ALABAMA", "GEORGIA", "OHIO_STATE" etc, or ["ALL_CFB"] if national>,
  "topics": <array from ["NIL", "SMASH_CAPITAL", "PE_INVESTMENT", "TRANSFER_PORTAL", "REALIGNMENT", "FAN_RIGHTS", "LEGAL", "GENERAL_CFB"]>,
  "episode_type": <"full_episode" if score >= 8, "news_drop" if score 5-7, null if score < 5>
}

Scoring guide:
9-10: Smash Capital, PE investment in CFB, fan rights, major NIL policy changes — broadcast immediately
7-8: Transfer portal moves affecting XSEN schools, NIL collective news, conference realignment updates
5-6: General CFB news relevant to XSEN school fans
1-4: Off-topic, celebrity fluff, non-CFB content`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`Scoring error for "${story.title}": ${err.message}`);
    return { score: 0, reason: "Scoring failed", schools: [], topics: [], episode_type: null };
  }
}

async function scoreAllPendingStories() {
  const stories = await getPendingStories(20);

  if (!stories.length) {
    console.log("No pending stories to score.");
    return;
  }

  console.log(`\n📊 Scoring ${stories.length} pending stories...`);

  for (const story of stories) {
    const scoring = await scoreStoryWithClaude(story);
    await updateStoryScore(story.id, scoring);

    const emoji = scoring.score >= 8 ? "🔴" : scoring.score >= 5 ? "🟡" : "⚪";
    console.log(`  ${emoji} [${scoring.score}/10] ${story.title.substring(0, 70)}...`);

    await new Promise(r => setTimeout(r, 500));
  }
}

// ─── Reporting ────────────────────────────────────────────────────────────────

async function printQueuedStories() {
  const { data } = await supabase
    .from("xsen_stories")
    .select("title, relevance_score, episode_type, affected_schools, topics")
    .eq("status", "queued")
    .order("relevance_score", { ascending: false })
    .limit(10);

  if (!data?.length) return;

  console.log("\n🎙️ QUEUED FOR EPISODE PRODUCTION:");
  console.log("─".repeat(60));
  data.forEach(s => {
    console.log(`[${s.relevance_score}/10] ${s.episode_type?.toUpperCase()} | ${s.affected_schools?.join(", ")}`);
    console.log(`  → ${s.title}`);
  });
}

// ─── Main Run ─────────────────────────────────────────────────────────────────

async function runScraper() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🏈 XSEN News Scraper — ${new Date().toLocaleString()}`);
  console.log("=".repeat(60));

  let allStories = [];

  // 1. Scrape active RSS feeds
  console.log(`\n📡 Scraping ${activeFeeds.length} RSS feeds...`);
  for (const feed of activeFeeds) {
    const stories = await scrapeRSSFeed(feed);
    allStories = allStories.concat(stories);
  }

  // 2. Scrape active Google News queries
  console.log(`\n🔍 Scraping ${activeQueries.length} Google News queries...`);
  for (const search of activeQueries) {
    const stories = await scrapeGoogleNews(search);
    allStories = allStories.concat(stories);
  }

  // 3. Deduplicate by URL
  const seen = new Set();
  const unique = allStories.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  console.log(`\n📥 Found ${unique.length} unique stories (${allStories.length - unique.length} duplicates removed)`);

  // 4. Save to Supabase
  const saved = await saveStories(unique);
  console.log(`💾 Saved ${saved} stories to Supabase`);

  // 5. Score with Claude
  await scoreAllPendingStories();

  // 6. Show queue
  await printQueuedStories();

  console.log("\n✅ Scraper run complete\n");
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

runScraper();

cron.schedule("0 */2 * * *", () => {
  runScraper();
});

console.log("⏰ XSEN Scraper scheduled — running every 2 hours");
console.log("   Next automatic run in 2 hours...");
