import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── 1. Pull latest analysis from Supabase ────────────────────────────────────
console.log('⏳ Fetching latest analysis...')
const { data: analysis, error } = await supabase
  .from('analyses')
  .select('*')
  .eq('competitor_id', '6a9b66b9-c62c-43d6-b20f-dd3f25dd3595')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (error) { console.error('❌ Failed to fetch analysis:', error); process.exit(1) }
console.log('✅ Analysis loaded —', analysis.signals.length, 'signals —', analysis.week)

// ── 2. Helpers ───────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
})

const signals = analysis.signals

function pillClass(priority) {
  const map = { HIGH: 'high', MEDIUM: 'medium', WATCH: 'watch' }
  return map[priority?.toUpperCase()] || 'watch'
}

function pillLabel(priority) {
  const map = { HIGH: 'High', MEDIUM: 'Medium', WATCH: 'Watch' }
  return map[priority?.toUpperCase()] || priority
}

function insightClass(priority) {
  const map = { HIGH: 'high', MEDIUM: 'medium', WATCH: 'watch' }
  return map[priority?.toUpperCase()] || 'watch'
}

// ── 3. Build sections ────────────────────────────────────────────────────────

// Executive summary — top 4 signals
const summaryHTML = signals.slice(0, 4).map(s => `
  <div class="insight ${insightClass(s.priority)}">
    <div class="insight-tag">${s.title} <span class="pill ${pillClass(s.priority)}">${pillLabel(s.priority)}</span></div>
    <p>${s.detail}</p>
  </div>
`).join('')

// Meta ad cards
const metaSignals = signals.filter(s => s.source === 'Meta Ads')
const metaCardsHTML = metaSignals.map(s => `
  <div class="card">
    <div class="card-platform">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
      Meta Ads
    </div>
    <div class="card-title">${s.title}</div>
    <div class="card-body">${s.detail}</div>
    <div class="card-meta">
      <span class="meta-tag">${pillLabel(s.priority)}</span>
      <span class="meta-tag">${s.category}</span>
    </div>
    <div class="intel-box" style="margin-top:10px;">
      <div class="intel-box-label">Recommended Action</div>
      <p>${s.recommended_action}</p>
    </div>
  </div>
`).join('')

// LinkedIn post cards
const linkedInSignals = signals.filter(s => s.source === 'LinkedIn')
const linkedInCardsHTML = linkedInSignals.map(s => `
  <div class="card">
    <div class="card-platform">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/></svg>
      LinkedIn
    </div>
    <div class="card-title">${s.title}</div>
    <div class="card-body">${s.detail}</div>
    <div class="card-meta">
      <span class="meta-tag">${pillLabel(s.priority)}</span>
      <span class="meta-tag">${s.category}</span>
    </div>
    <div class="post-intel" style="margin-top:10px;">
      <div class="post-intel-label">🧠 Intel</div>
      <p>${s.recommended_action}</p>
    </div>
  </div>
`).join('')

// Website changes
const websiteSignals = signals.filter(s => s.source === 'Website')
const websiteHTML = websiteSignals.map(s => `
  <div class="change-row">
    <div class="change-signal">
      <div class="signal-pill ${pillClass(s.priority)}">${pillLabel(s.priority)}</div>
    </div>
    <div class="change-content">
      <strong>${s.title}</strong>
      <p>${s.detail}</p>
    </div>
  </div>
`).join('')

// Recommended actions
const actionsHTML = signals.map((s, i) => `
  <div class="action-item">
    <div class="action-num">${i + 1}</div>
    <div class="action-content">
      <strong>${s.title}</strong>
      <p>${s.recommended_action}</p>
      <span class="pill ${pillClass(s.priority)} action-tag">${pillLabel(s.priority)}</span>
    </div>
  </div>
`).join('')

// KPI counts
const highCount   = signals.filter(s => s.priority === 'HIGH').length
const adCount     = metaSignals.length + linkedInSignals.length
const siteCount   = websiteSignals.length

// ── 4. Assemble HTML ─────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marktelio — AXA Switzerland ${analysis.week} Intelligence Brief</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #e8e9f0; font-family: 'Open Sans', sans-serif; color: #0d0d1a; -webkit-font-smoothing: antialiased; }
    .email-wrap { max-width: 680px; margin: 32px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 48px rgba(13,13,26,0.18); }
    .header { background: #0d0d1a; padding: 28px 36px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a2a3a; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-text { font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 800; color: #ffffff; }
    .logo-text .accent { color: #00e5c8; }
    .header-meta { text-align: right; }
    .header-meta .week { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #00e5c8; }
    .header-meta .date { margin-top: 2px; font-size: 11px; color: #6f7d95; }
    .hero { background: linear-gradient(135deg, #0d1825 0%, #0d0d1a 100%); padding: 32px 36px 28px; border-bottom: 1px solid #1a2a3a; }
    .tracking-pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 999px; background: #1a2a3a; border: 1px solid #2a3a4a; margin-bottom: 18px; }
    .tracking-pill .dot { width: 7px; height: 7px; border-radius: 50%; background: #00e5c8; }
    .tracking-pill span { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #8a95a8; }
    .tracking-pill strong { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; color: #00e5c8; }
    .hero h1 { font-family: 'Montserrat', sans-serif; font-size: 22px; line-height: 1.3; font-weight: 800; color: #ffffff; margin-bottom: 10px; }
    .hero h1 em { font-style: normal; color: #00e5c8; }
    .hero p { font-size: 13px; line-height: 1.6; color: #aab4c3; }
    .analyst-bar { margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2a3a; display: flex; align-items: center; gap: 10px; }
    .analyst-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; color: #0d0d1a; background: linear-gradient(135deg, #00a896, #00e5c8); flex-shrink: 0; }
    .analyst-text { font-size: 11px; line-height: 1.5; color: #6f7d95; }
    .analyst-text strong { color: #dbe5f0; }
    .signal-row { display: flex; border-bottom: 1px solid #f0f1f5; }
    .signal-box { flex: 1; padding: 18px 10px; text-align: center; border-right: 1px solid #f0f1f5; }
    .signal-box:last-child { border-right: none; }
    .signal-label { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8a95a8; margin-bottom: 6px; }
    .signal-val { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 900; color: #0d0d1a; line-height: 1; }
    .signal-change { margin-top: 4px; font-size: 11px; font-weight: 600; color: #00a896; }
    .section { padding: 28px 36px; border-bottom: 1px solid #f0f1f5; }
    .section:last-of-type { border-bottom: none; }
    .section-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #00a896; }
    .section-eyebrow::after { content: ''; flex: 1; height: 1px; background: #f0f1f5; }
    .insight { background: #f8f9fc; border-left: 3px solid #00e5c8; border-radius: 0 10px 10px 0; padding: 14px 16px; margin-bottom: 12px; }
    .insight:last-child { margin-bottom: 0; }
    .insight.high { border-left-color: #c62828; }
    .insight.medium { border-left-color: #e65100; }
    .insight.watch { border-left-color: #2e7d32; }
    .insight-tag { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0d0d1a; }
    .pill { display: inline-block; padding: 2px 7px; border-radius: 5px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; }
    .pill.high { background: #fdecec; color: #c62828; }
    .pill.medium { background: #fff4e5; color: #e65100; }
    .pill.watch { background: #eaf7ea; color: #2e7d32; }
    .insight p { font-size: 13px; line-height: 1.7; color: #444466; }
    .insight p strong { color: #0d0d1a; }
    .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { background: #f8f9fc; border: 1px solid #ebebf5; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; }
    .card-platform { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8a95a8; }
    .card-title { font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; line-height: 1.4; color: #0d0d1a; margin-bottom: 5px; }
    .card-body { font-size: 11px; line-height: 1.6; color: #666688; }
    .card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .meta-tag { padding: 2px 6px; border-radius: 4px; background: #ebebf5; color: #666688; font-family: 'Montserrat', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .intel-box { padding: 12px 14px; background: #f0f1f5; border-radius: 8px; }
    .intel-box-label { margin-bottom: 4px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0d0d1a; }
    .intel-box p { font-size: 12px; line-height: 1.6; color: #444466; }
    .post-intel { padding: 10px 12px; border-radius: 8px; background: #0d0d1a; }
    .post-intel-label { margin-bottom: 4px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #00e5c8; }
    .post-intel p { font-size: 11px; line-height: 1.6; color: #aabbcc; }
    .change-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #f0f1f5; }
    .change-row:last-child { border-bottom: none; padding-bottom: 0; }
    .change-signal { width: 62px; flex-shrink: 0; }
    .signal-pill { padding: 3px 7px; border-radius: 5px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .signal-pill.high { background: #fdecec; color: #c62828; }
    .signal-pill.medium { background: #fff4e5; color: #e65100; }
    .signal-pill.watch { background: #eaf7ea; color: #2e7d32; }
    .change-content strong { display: block; margin-bottom: 3px; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; color: #0d0d1a; }
    .change-content p { font-size: 12px; line-height: 1.6; color: #666688; }
    .action-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f0f1f5; }
    .action-item:last-child { border-bottom: none; padding-bottom: 0; }
    .action-num { width: 28px; height: 28px; border-radius: 8px; background: #0d0d1a; color: #00e5c8; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; flex-shrink: 0; }
    .action-content strong { display: block; margin-bottom: 4px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; color: #0d0d1a; }
    .action-content p { font-size: 12px; line-height: 1.6; color: #666688; }
    .action-tag { display: inline-block; margin-top: 6px; }
    .footer { background: #0d0d1a; padding: 28px 36px; text-align: center; }
    .footer-logo { margin-bottom: 8px; font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 800; color: #ffffff; }
    .footer-logo .accent { color: #00e5c8; }
    .footer-tagline { margin-bottom: 16px; font-size: 11px; color: #6f7d95; }
    .footer-links { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
    .footer-links a { font-size: 11px; color: #8aa0b8; text-decoration: none; }
    .footer-note { font-size: 11px; line-height: 1.8; color: #6f7d95; }
    @media (max-width: 600px) {
      .email-wrap { margin: 0; border-radius: 0; }
      .header, .hero, .section, .footer { padding-left: 20px; padding-right: 20px; }
      .signal-row { display: block; }
      .signal-box { border-right: none; border-bottom: 1px solid #f0f1f5; }
      .signal-box:last-child { border-bottom: none; }
      .card-grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 18px; }
      .signal-val { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-wrap">

    <!-- HEADER -->
    <div class="header">
      <div class="logo">
        <svg width="28" height="28" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="68" height="68" rx="16" fill="#1A2A3A"/>
          <polyline points="9,34 19,34 24,18 30,50 35,26 41,42 47,34 59,34" stroke="#00E5C8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="59" cy="34" r="4.5" fill="#00E5C8"/>
        </svg>
        <div class="logo-text">Marktel<span class="accent">io</span></div>
      </div>
      <div class="header-meta">
        <div class="week">${analysis.week}</div>
        <div class="date">Delivered ${today}</div>
      </div>
    </div>

    <!-- HERO -->
    <div class="hero">
      <div class="tracking-pill">
        <div class="dot"></div>
        <span>Tracking</span>
        <strong>AXA SWITZERLAND</strong>
      </div>
      <h1><em>${analysis.summary}</em></h1>
      <div class="analyst-bar">
        <div class="analyst-av">BW</div>
        <div class="analyst-text"><strong>Reviewed by Ben W., Lead Analyst</strong> · ${signals.length} signals detected · ${highCount} high priority · Delivered ${today}</div>
      </div>
    </div>

    <!-- KPI STRIP -->
    <div class="signal-row">
      <div class="signal-box">
        <div class="signal-label">Total Signals</div>
        <div class="signal-val">${signals.length}</div>
        <div class="signal-change">This week</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">High Priority</div>
        <div class="signal-val">${highCount}</div>
        <div class="signal-change">Act now</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">Ad Signals</div>
        <div class="signal-val">${adCount}</div>
        <div class="signal-change">Meta + LinkedIn</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">Site Changes</div>
        <div class="signal-val">${siteCount}</div>
        <div class="signal-change">Detected</div>
      </div>
    </div>

    <!-- EXECUTIVE SUMMARY -->
    <div class="section">
      <div class="section-eyebrow">Executive Summary</div>
      ${summaryHTML}
    </div>

    ${metaSignals.length ? `
    <!-- META ADS -->
    <div class="section">
      <div class="section-eyebrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
        Meta Ads — This Week
      </div>
      <div class="card-grid">${metaCardsHTML}</div>
    </div>` : ''}

    ${linkedInSignals.length ? `
    <!-- LINKEDIN -->
    <div class="section">
      <div class="section-eyebrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/><path d="M7.5 10v6.5M7.5 7v.01M10.5 16.5V12.5c0-1.5 1-2 2-2s2 .5 2 2v4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="7" r="0.01" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>
        LinkedIn — This Week
      </div>
      <div class="card-grid">${linkedInCardsHTML}</div>
    </div>` : ''}

    ${websiteSignals.length ? `
    <!-- WEBSITE CHANGES -->
    <div class="section">
      <div class="section-eyebrow">Website Changes — This Week</div>
      ${websiteHTML}
    </div>` : ''}

    <!-- RECOMMENDED ACTIONS -->
    <div class="section">
      <div class="section-eyebrow">Suggested Follow-Ups</div>
      ${actionsHTML}
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-logo">Marktel<span class="accent">io</span></div>
      <div class="footer-tagline">We do the research. You stay ahead.</div>
      <div class="footer-links">
        <a href="https://marktel.io">marktel.io</a>
        <a href="https://marktel.io/legal">Privacy & Legal</a>
        <a href="mailto:hello@marktel.io">hello@marktel.io</a>
      </div>
      <div class="footer-note">You're receiving this because you track <strong>AXA Switzerland</strong> on Marktelio.<br>Delivered ${today} · Next report: Mon 6 Apr 2026 · Made in Switzerland 🇨🇭</div>
    </div>

  </div>
</body>
</html>`

// ── 5. Save ──────────────────────────────────────────────────────────────────
fs.writeFileSync('./report.html', html, 'utf8')
console.log('✅ Report saved to report.html')
