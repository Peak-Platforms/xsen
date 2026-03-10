# XSEN FanCast News Aggregator — Phase 1

Automated news scraper that feeds the XSEN broadcast pipeline.
Pulls CFB/NIL/Smash Capital stories, scores them with Claude, stores in Supabase.

---

## Setup

### 1. Supabase Tables
Run `supabase_setup.sql` in your Supabase SQL editor.
Uses your existing XSEN Supabase project.

### 2. Environment Variables
```bash
cp .env.example .env
# Fill in your values
```

You need:
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — your existing XSEN project
- `ANTHROPIC_API_KEY` — for Claude story scoring

### 3. Install & Run
```bash
npm install
npm start
```

---

## What It Does

**Every 2 hours:**
1. Scrapes 9 RSS feeds (ESPN, CBS, On3, 247Sports, school athletics pages)
2. Scrapes 10 Google News searches (Smash Capital, NIL, realignment, portal)
3. Deduplicates by URL
4. Saves new stories to `xsen_stories` table in Supabase
5. Scores each pending story with Claude (1-10 relevance)
6. Stories scoring 8+ → `full_episode` queue
7. Stories scoring 5-7 → `news_drop` queue
8. Stories below 5 → discarded

---

## Supabase Tables

### `xsen_stories`
Raw scraped content + Claude scores.
Key fields: `title`, `url`, `relevance_score`, `affected_schools`, `episode_type`, `status`

### `xsen_episodes`
Generated scripts ready for ElevenLabs voicing (Phase 2).

---

## Status Flow

```
pending → scored → queued → produced → aired
                 ↘ discarded
```

---

## Phase 2 (Next)
Script generation — Claude writes full episode scripts and school-specific outros
for every queued story.

## Phase 3 (Next)
ElevenLabs voicing — queued scripts render to MP3 automatically.

## Phase 4 (Next)
AzuraCast upload — finished MP3s push to correct school channel playlist.

---

## Deployment
Deploy to Railway (same as your existing XSEN infrastructure).
Set environment variables in Railway dashboard.
The cron scheduler runs inside the process — no external cron needed.
