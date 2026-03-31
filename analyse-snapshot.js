import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const SC_KEY = process.env.SCRAPECREATORS_API_KEY
const SC_BASE = 'https://api.scrapecreators.com'

// ── Helper: fetch from ScrapeCreators ────────────────────────────────────────
async function scFetch(path) {
  const res = await fetch(`${SC_BASE}${path}`, {
    headers: { 'x-api-key': SC_KEY }
  })
  if (!res.ok) {
    console.warn(`⚠️  ScrapeCreators ${path} returned ${res.status}`)
    return null
  }
  return res.json()
}

// ── 1. Pull latest website snapshot from Supabase ───────────────────────────
console.log('⏳ Fetching website snapshot...')
const { data: snapshot, error: snapError } = await supabase
  .from('snapshots')
  .select('*')
  .eq('competitor_id', '6a9b66b9-c62c-43d6-b20f-dd3f25dd3595')
  .order('captured_at', { ascending: false })
  .limit(1)
  .single()

if (snapError) { console.error('❌ Snapshot fetch failed:', snapError); process.exit(1) }
console.log('✅ Website snapshot loaded:', snapshot.url)

// ── 2. Pull LinkedIn ads ─────────────────────────────────────────────────────
console.log('⏳ Fetching LinkedIn ads...')
const linkedInData = await scFetch('/v1/linkedin/ads/search?company=AXA')
console.log(linkedInData ? '✅ LinkedIn ads loaded' : '⚠️  LinkedIn ads unavailable — skipping')

// ── 3. Pull Meta ads ─────────────────────────────────────────────────────────
console.log('⏳ Fetching Meta ads...')
const metaData = await scFetch('/v1/facebook/adLibrary/company/ads?pageId=187891771259726')
console.log(metaData ? '✅ Meta ads loaded' : '⚠️  Meta ads unavailable — skipping')

// ── 4. Send all three sources to Claude ──────────────────────────────────────
const prompt = `
You are a competitive intelligence analyst. Analyse the following data sources for AXA Switzerland and extract key marketing signals.

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain English summary of the most important things happening this week",
  "signals": [
    {
      "priority": "HIGH | MEDIUM | WATCH",
      "source": "Website | Meta Ads | LinkedIn",
      "category": "e.g. Campaign Activity / Website Change / Messaging Shift / Ad Creative / Social Content",
      "title": "Short signal title",
      "detail": "What you observed and why it matters",
      "recommended_action": "What the client should do or monitor"
    }
  ]
}

Only include signals that represent genuine changes or noteworthy activity. Ignore static product info. Rank by strategic importance.

---
SOURCE 1 — WEBSITE CONTENT:
${snapshot.content_md}

---
SOURCE 2 — LINKEDIN ADS:
${linkedInData ? JSON.stringify(linkedInData, null, 2) : 'No data available this week.'}

---
SOURCE 3 — META ADS:
${metaData ? JSON.stringify(metaData, null, 2) : 'No data available this week.'}
`

console.log('⏳ Sending to Claude...')

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4000,
  temperature: 0,
  messages: [{ role: 'user', content: prompt }]
})

// ── 5. Parse response ────────────────────────────────────────────────────────
const raw = message.content[0].text

// Strip any markdown code fences if present
const cleaned = raw
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim()

const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
if (!jsonMatch) {
  console.error('❌ Could not parse JSON from Claude response')
  console.log(raw)
  process.exit(1)
}

let analysis
try {
  analysis = JSON.parse(jsonMatch[0])
} catch (e) {
  console.error('❌ JSON parse error:', e.message)
  console.log('Raw Claude response:\n', raw)
  process.exit(1)
}
console.log('✅ Analysis received —', analysis.signals.length, 'signals found')
console.log('\n📋 Summary:', analysis.summary)

// ── 6. Save to Supabase ──────────────────────────────────────────────────────
const week = `W${Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000)}-${new Date().getFullYear()}`

const { error: insertError } = await supabase
  .from('analyses')
  .insert({
    competitor_id: snapshot.competitor_id,
    snapshot_id:   snapshot.id,
    week:          week,
    signals:       analysis.signals,
    summary:       analysis.summary
  })

if (insertError) { console.error('❌ Save failed:', insertError); process.exit(1) }
console.log('✅ Analysis saved to Supabase for', week)
