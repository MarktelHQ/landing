// Marktel -- collectors/linkedin.js
// LinkedIn Posts collector via ScrapeCreators API.
// Uses native fetch (Node 18+). No node-fetch needed.
//
// Usage:
//   node collectors/linkedin.js --client axa --handle axa --week 14

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const API_BASE = "https://api.scrapecreators.com/v1/linkedin";
const API_KEY  = process.env.SCRAPECREATORS_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function headers() {
  return { "x-api-key": API_KEY, "Content-Type": "application/json" };
}

async function apiGet(path) {
  const res  = await fetch(`${API_BASE}${path}`, { headers: headers() });
  const json = await res.json();
  if (!res.ok || json.errorStatus) throw new Error(`ScrapeCreators: ${json.message || res.status}`);
  return json;
}

// handle = LinkedIn slug e.g. "axa"
export async function fetchLinkedInPosts(handle, limit = 10) {
  const linkedInUrl = `https://www.linkedin.com/company/${handle}`;
  console.log(`[LinkedIn] Fetching posts for: ${linkedInUrl}`);
  const data  = await apiGet(`/company/posts?url=${encodeURIComponent(linkedInUrl)}&limit=${limit}`);
  const posts = data.posts || data.data || [];
  console.log(`[LinkedIn] ${posts.length} posts received`);
  return posts;
}

function normalisePost(raw, clientSlug, week, year) {
  return {
    client_slug: clientSlug,
    week,
    year,
    post_id:     raw.id          || raw.post_id   || null,
    entity:      raw.author      || raw.company    || "AXA",
    entity_type: "company",
    body:        raw.text        || raw.content    || null,
    likes:       raw.likes       || raw.likeCount  || 0,
    comments:    raw.comments    || raw.commentCount || 0,
    shares:      raw.shares      || raw.shareCount || 0,
    post_url:    raw.url         || raw.postUrl    || null,
    posted_at:   raw.datePublished || raw.postedAt || null,
    fetched_at:  new Date().toISOString(),
  };
}

export async function upsertLinkedInPosts(posts) {
  if (!posts.length) { console.log("[LinkedIn] No posts to upsert."); return; }
  const { error } = await supabase
    .from("linkedin_posts")
    .upsert(posts, { onConflict: "post_id,week,year" });
  if (error) throw new Error(`Supabase upsert: ${error.message}`);
  console.log(`[LinkedIn] Upserted ${posts.length} posts`);
}

export async function loadLinkedInFromSupabase({ clientSlug, week, year }) {
  const { data, error } = await supabase
    .from("linkedin_posts")
    .select("*")
    .eq("client_slug", clientSlug)
    .eq("week", week)
    .eq("year", year)
    .order("likes", { ascending: false });
  if (error) throw new Error(`Supabase load: ${error.message}`);
  return data || [];
}

export function formatLinkedInForPrompt(posts) {
  return posts.map(p => ({
    entity:   p.entity   || "AXA",
    body:     p.body     || "",
    likes:    p.likes    || 0,
    comments: p.comments || 0,
    shares:   p.shares   || 0,
    postUrl:  p.post_url || null,
    postedAt: p.posted_at || null,
  }));
}

async function main() {
  const argv = process.argv.slice(2);
  const get  = f => { const i = argv.indexOf(f); return i !== -1 ? argv[i+1] : null; };

  const slug   = get("--client") || "unknown";
  const handle = get("--handle") || get("--company");
  const week   = parseInt(get("--week") || "0", 10);
  const year   = new Date().getFullYear();

  if (!handle) {
    console.error("Usage: node collectors/linkedin.js --client axa --handle axa --week 14");
    process.exit(1);
  }

  const rawPosts = await fetchLinkedInPosts(handle);
  const normed   = rawPosts.map(p => normalisePost(p, slug, week, year));
  await upsertLinkedInPosts(normed);

  console.log("\n[LinkedIn] Sample (first 3):");
  console.log(JSON.stringify(formatLinkedInForPrompt(normed).slice(0,3), null, 2));
}

// Windows-safe ESM entry guard
const isMain = process.argv[1]
  ?.replace(/\\/g, '/')
  .endsWith(new URL(import.meta.url).pathname.replace(/^\//, ''));

if (isMain) {
  main().catch(e => { console.error(e); process.exit(1); });
}

