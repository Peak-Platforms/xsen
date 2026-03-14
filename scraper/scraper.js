// scraper.js - XSEN Phase 1: Story Scraper + Scorer
// RSS feeds + Google News → Claude scoring → Supabase
 
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import * as dotenv from 'dotenv';
import { RSS_FEEDS, NATIONAL_QUERIES } from './sources.js';
 
dotenv.config();
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const parser = new Parser({ timeout: 10000 });
 
// ─── Load school queries dynamically from Supabase ────────────────────────────
async function loadSchoolQueries() {
  const { data, error } = await supabase
    .from('xsen_stations')
    .select('school, queries, active, min_score')
    .neq('school', 'MASTER');
 
  if (error) {
    console.log('[Scraper] Could not load station queries — using sources.js fallback');
    return null;
  }
 
  return data || [];
}
 
// ─── RSS Feed Scraping ────────────────────────────────────────────────────────
async function scrapeRSS(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    const stories = parsed.items.slice(0, 10).map(item => ({
      title: item.title?.trim(),
      url: item.link,
      summary: item.contentSnippet?.substring(0, 500) || item.content?.substring(0, 500),
      source: feed.name,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      school: 'MASTER',
      topics: []
    })).filter(s => s.title && s.url);
 
    console.log(`  ✓ ${feed.name}: ${stories.length} stories`);
    return stories;
  } catch (err) {
    console.log(`  ✗ ${feed.name}: ${err.message}`);
    return [];
  }
}
 
// ─── Google News Scraping ─────────────────────────────────────────────────────
async function scrapeGoogleNews(query, school = 'MASTER') {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
    const parsed = await parser.parseURL(url);
 
    const stories = parsed.items.slice(0, 8).map(item => ({
      title: item.title?.replace(/\s*-\s*[^-]+$/, '').trim(),
      url: item.link,
      summary: item.contentSnippet?.substring(0, 500),
      source: item.title?.match(/- ([^-]+)$/)?.[1]?.trim() || 'Google News',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      school,
      topics: []
    })).filter(s => s.title && s.url);
 
    console.log(`  ✓ Google News "${query}": ${stories.length} stories`);
    return stories;
  } catch (err) {
    console.log(`  ✗ Google News "${query}": ${err.message}`);
    return [];
  }
}
 
// ─── Deduplication ────────────────────────────────────────────────────────────
function deduplicateStories(stories) {
  const seen = new Set();
  return stories.filter(story => {
    const key = story.url || story.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
 
// ─── Claude Scoring ───────────────────────────────────────────────────────────
async function scoreStories(stories) {
  const prompt = `You are scoring college football news stories for XSEN FanCast — a broadcast network focused on NIL, private equity, conference realignment, athlete rights, and fan impact.
 
Score each story 1-10:
- 9-10: Breaking/major impact on CFB's future (PE deals, landmark lawsuits, massive NIL moves)
- 7-8: Significant developments fans need to know about
- 5-6: Relevant but not urgent
- 3-4: Tangentially related
- 1-2: Not relevant (scores, game recaps, basketball, etc.)
 
Also identify:
- episode_type: "full_episode" (7+) or "brief" (4-6) or "skip" (1-3)
- affected_schools: array like ["OU", "TEXAS"] or ["ALL_CFB"] or ["SKIP"]
- topics: array of relevant tags
 
Stories to score:
${stories.map((s, i) => `${i + 1}. "${s.title}" (${s.source})`).join('\n')}
 
Respond with ONLY a JSON array, one object per story:
[{"index":1,"score":8,"episode_type":"full_episode","affected_schools":["ALL_CFB"],"topics":["NIL","PE"]}, ...]`;
 
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
 
    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[Scraper] Scoring error:', err.message);
    return [];
  }
}
 
// ─── Save to Supabase ─────────────────────────────────────────────────────────
async function saveStories(stories, scores) {
  const toInsert = stories.map((story, i) => {
    const score = scores.find(s => s.index === i + 1) || {};
    return {
      title: story.title,
      url: story.url,
      summary: story.summary,
      source: story.source,
      school: story.school,
      published_at: story.published_at,
      relevance_score: score.score || 0,
      episode_type: score.episode_type || 'skip',
      affected_schools: score.affected_schools || [],
      topics: score.topics || [],
      status: score.score >= 7 ? 'queued' : 'low_score'
    };
  });
 
  const queued = toInsert.filter(s => s.status === 'queued');
  const low    = toInsert.filter(s => s.status === 'low_score');
 
  if (queued.length) {
    const { error } = await supabase.from('xsen_stories').upsert(queued, { onConflict: 'url', ignoreDuplicates: true });
    if (error) console.error('[Scraper] Save error:', error.message);
  }
  if (low.length) {
    await supabase.from('xsen_stories').upsert(low, { onConflict: 'url', ignoreDuplicates: true });
  }
 
  return { queued: queued.length, low: low.length };
}
 
// ─── Print Queue ──────────────────────────────────────────────────────────────
async function printQueue() {
  const { data } = await supabase
    .from('xsen_stories')
    .select('relevance_score, episode_type, affected_schools, title')
    .eq('status', 'queued')
    .order('relevance_score', { ascending: false })
    .limit(10);
 
  if (!data?.length) return;
 
  console.log('\n🎙️ QUEUED FOR EPISODE PRODUCTION:');
  console.log('─'.repeat(60));
  data.forEach(s => {
    const color = s.relevance_score >= 9 ? '🔴' : s.relevance_score >= 7 ? '🟡' : '⚪';
    console.log(`${color} [${s.relevance_score}/10] ${s.episode_type?.toUpperCase()} | ${s.affected_schools?.join(', ')}`);
    console.log(`  → ${s.title.substring(0, 80)}`);
  });
}
 
// ─── Main Scraper Run ─────────────────────────────────────────────────────────
export async function runScraper() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📡 XSEN Scraper — ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
 
  const allStories = [];
 
  // 1. RSS feeds (always national/MASTER)
  console.log(`\n📡 Scraping ${RSS_FEEDS.filter(f => f.active !== false).length} RSS feeds...`);
  for (const feed of RSS_FEEDS.filter(f => f.active !== false)) {
    const stories = await scrapeRSS(feed);
    allStories.push(...stories);
  }
 
  // 2. National queries (always run)
  console.log(`\n🔍 Scraping ${NATIONAL_QUERIES.length} national queries...`);
  for (const query of NATIONAL_QUERIES) {
    const stories = await scrapeGoogleNews(query, 'MASTER');
    allStories.push(...stories);
  }
 
  // 3. School queries — load from Supabase dynamically
  const stations = await loadSchoolQueries();
 
  if (stations) {
    const activeStations = stations.filter(s => s.queries?.length > 0);
    const totalQueries = activeStations.reduce((sum, s) => sum + s.queries.length, 0);
 
    if (totalQueries > 0) {
      console.log(`\n🏫 Scraping ${totalQueries} school queries from ${activeStations.length} stations...`);
      for (const station of activeStations) {
        for (const query of station.queries) {
          const stories = await scrapeGoogleNews(query, station.school);
          allStories.push(...stories);
        }
      }
    }
  } else {
    // Fallback to sources.js if Supabase unavailable
    const { SCHOOL_QUERIES } = await import('./sources.js');
    if (SCHOOL_QUERIES) {
      console.log(`\n🏫 Scraping school queries from sources.js fallback...`);
      for (const { query, school } of SCHOOL_QUERIES.filter(q => q.active !== false)) {
        const stories = await scrapeGoogleNews(query, school);
        allStories.push(...stories);
      }
    }
  }
 
  // 4. Deduplicate
  const unique = deduplicateStories(allStories);
  const dupes = allStories.length - unique.length;
  console.log(`\n📥 Found ${unique.length} unique stories (${dupes} duplicates removed)`);
 
  // 5. Score in batches of 20
  const BATCH = 20;
  let totalQueued = 0;
 
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
 
    // Check which already exist
    const urls = batch.map(s => s.url).filter(Boolean);
    const { data: existing } = await supabase
      .from('xsen_stories')
      .select('url')
      .in('url', urls);
 
    const existingUrls = new Set(existing?.map(e => e.url) || []);
    const newStories = batch.filter(s => !existingUrls.has(s.url));
 
    if (!newStories.length) continue;
 
    console.log(`\n📊 Scoring ${newStories.length} new stories...`);
    const scores = await scoreStories(newStories);
 
    scores.forEach(s => {
      const story = newStories[s.index - 1];
      if (!story) return;
      const icon = s.score >= 9 ? '🔴' : s.score >= 7 ? '🟡' : s.score >= 5 ? '🟠' : '⚪';
      console.log(`  ${icon} [${s.score}/10] ${story.title?.substring(0, 70)}...`);
    });
 
    const { queued } = await saveStories(newStories, scores);
    totalQueued += queued;
  }
 
  console.log(`\n💾 ${totalQueued} stories queued for episode production`);
  await printQueue();
  console.log(`\n✅ Scraper run complete\n`);
}