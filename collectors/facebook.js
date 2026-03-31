// Marktel -- collectors/facebook.js
// Facebook Ad Library collector via ScrapeCreators API.
// Fetches public ads/posts for a Facebook Page ID, upserts to Supabase.
//
// Usage:
//   node collectors/facebook.js --client axa --pageId 187891771259726 --week 14
//
// AXA Switzerland page IDs:
//   axach  → 187891771259726  (https://www.facebook.com/axach/)
//   axa    → check facebook.com/axa for the global page

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'https://api.scrapecreators.com';
const API_KEY  = process.env.SCRAPECREATORS_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function headers() {
  return { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };
}

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  console.log(`[Facebook] GET ${url}`);
  const res  = await fetch(url, { headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(`ScrapeCreators ${res.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

// ── Fetch posts from Ad Library ───────────────────────────────
export async function fetchFacebookPosts(pageId, limit = 20) {
  const data  = await apiGet(`/v1/facebook/adLibrary/company/ads?pageId=${pageId}`);
  const posts = data.data ?? data.ads ?? data.results ?? (Array.isArray(data) ? data : []);
  console.log(`[Facebook] ${posts.length} posts received`);
  return posts.slice(0, limit);
}

// ── Normalise ─────────────────────────────────────────────────
function normalisePost(raw, clientSlug, pageId, week, year) {
  const snapshot = raw.snapshot ?? {};
  const text =
    snapshot?.body?.markup?.text ??
    snapshot?.title ??
    raw.message ??
    raw.text ??
    null;

  const mediaType =
    snapshot?.videos?.length ? 'video' :
    snapshot?.images?.length ? 'image' : 'text';

  return {
    post_id:      String(raw.id ?? raw.adId ?? raw.ad_id ?? ''),
    client_slug:  clientSlug,
    week,
    year,
    page_id:      pageId,
    text,
    media_type:   mediaType,
    likes:        raw.likes       ?? raw.reactions   ?? null,
    comments:     raw.comments    ?? null,
    shares:       raw.shares      ?? null,
    impressions:  raw.impressions ?? null,
    started_at:   raw.startDate   ?? raw.start_date  ?? null,
    ended_at:     raw.endDate     ?? raw.end_date     ?? null,
    is_active:    raw.isActive    ?? raw.is_active    ?? null,
    post_url:     raw.url         ?? raw.permalink    ?? null,
    fetched_at:   new Date().toISOString(),
  };
}

// ── Upsert to Supabase ────────────────────────────────────────
export async function upsertFacebookPosts(posts) {
  if (!posts.length) { console.log('[Facebook] No posts to upsert.'); return; }
  const { error } = await supabase
    .from('facebook_posts')
    .upsert(posts, { onConflict: 'post_id,week,year' });
  if (error) throw new Error(`Supabase upsert: ${error.message}`);
  console.log(`[Facebook] Upserted ${posts.length} posts`);
}

// ── Load from Supabase (for generate-report.js) ───────────────
export async function loadFacebookFromSupabase({ clientSlug, week, year }) {
  const { data, error } = await supabase
    .from('facebook_posts')
    .select('*')
    .eq('client_slug', clientSlug)
    .eq('week', week)
    .eq('year', year);
  if (error) throw new Error(`Supabase load: ${error.message}`);
  return data || [];
}

// ── Format for AI prompt ──────────────────────────────────────
export function formatFacebookForPrompt(posts) {
  return posts.map(p => ({
    text:       p.text,
    mediaType:  p.media_type,
    likes:      p.likes,
    comments:   p.comments,
    shares:     p.shares,
    isActive:   p.is_active,
    startedAt:  p.started_at,
    postUrl:    p.post_url,
  }));
}

// ── Standalone runner ─────────────────────────────────────────
async function main() {
  const argv   = process.argv.slice(2);
  const get    = f => { const i = argv.indexOf(f); return i !== -1 ? argv[i+1] : null; };

  const slug   = get('--client')  || 'unknown';
  const pageId = get('--pageId')  || get('--page-id') || '187891771259726';
  const week   = parseInt(get('--week') || '0', 10);
  const year   = new Date().getFullYear();

  console.log(`[Facebook] client=${slug} pageId=${pageId} week=${week} year=${year}`);

  const rawPosts = await fetchFacebookPosts(pageId);
  const normed   = rawPosts.map(p => normalisePost(p, slug, pageId, week, year));
  await upsertFacebookPosts(normed);

  console.log('\n[Facebook] Formatted for prompt (first 3):');
  console.log(JSON.stringify(formatFacebookForPrompt(normed).slice(0, 3), null, 2));
}

// Windows-safe ESM entry guard
const isMain = process.argv[1]
  ?.replace(/\\/g, '/')
  .endsWith(new URL(import.meta.url).pathname.replace(/^\//, ''));

if (isMain) {
  main().catch(e => { console.error(e); process.exit(1); });
}
