// api/generate.js — Marktel demo endpoint
// ES Module — pure Node.js serverless. NO Claude. No require().
// Flow: POST → build HTML from static pre-written data → Resend → ~2s response.

export const config = { maxDuration: 30 };

const WEEK = 13;
const YEAR = 2026;

// ─── PRE-WRITTEN REPORT DATA (W13 2026, real verified signals) ───────────────
const REPORT_DATA = {
  hero_headline: 'Crisis response leads homepage.<br><em>Global Meta targets UK expats. Zero Swiss paid social detected.</em>',
  hero_sub: 'AXA ran 5 active Meta creatives across 3 markets this week — none targeting Switzerland. Homepage leads with Crans-Montana fire response. Their paid social gap is an open opportunity.',
  total_signals: 8,
  high_priority: 3,
  ad_signals: 5,
  site_changes: 3,
  analyst_initials: 'AI',
  analyst_label: 'Marktelio Intelligence',

  exec_summary: [
    {
      level: 'high',
      tag: 'Crisis response dominates homepage',
      body: 'Two live notices on axa.ch: <strong>Crans-Montana fire</strong> support and a persistent <strong>Middle East travel claims advisory</strong>. AXA is positioning as the empathetic insurer in real-world crises — with zero paid social to amplify it. <strong>Competitors are not visibly matching this.</strong>',
    },
    {
      level: 'high',
      tag: 'Global Healthcare Meta push — 3 markets, zero CH',
      body: 'AXA Global Healthcare is running <strong>5 active Meta campaigns</strong> across France, Belgium, and UK — DCO carousels, video, full-funnel, with a 10% discount live in Belgium/France. <strong>No AXA Switzerland paid social detected anywhere.</strong>',
    },
    {
      level: 'watch',
      tag: 'Paid social gap confirmed',
      body: 'LinkedIn ads this week are from AXA France (pension education, 150–200k impressions/ad) and AXA Germany (tech recruitment). <strong>AXA Switzerland has zero paid social presence detected</strong> — the Crans-Montana moment was a missed brand-building opportunity.',
    },
  ],

  meta_ads: [
    {
      level: 'high',
      platform: 'Meta · DCO · NEW Mar 23 · UK Prospecting',
      headline: '"Up To 2 Months Free"',
      body: 'HNWI female targeting. 8 creative variants. "For the global go-getters" — fresh upper-funnel batch from Global Healthcare.',
      tags: ['High', 'DCO', 'Prospecting'],
      link: 'https://www.facebook.com/ads/library/?id=778287415356676',
    },
    {
      level: 'high',
      platform: 'Meta · DCO · UK Retargeting',
      headline: '"Health Cover Wherever You Go"',
      body: 'Leads retargeting paired with prospecting batch. Full-funnel HNWI + lookalike strategy deployed in one market.',
      tags: ['High', 'DCO', 'Retargeting'],
      link: null,
    },
    {
      level: 'watch',
      platform: 'Meta · Video · Since Jul 2024 · France',
      headline: '"Connecté où que vous alliez"',
      body: '20+ months running. France retargeting DCO also active since Jan 2026. Proven evergreen — not retiring.',
      tags: ['Watch', 'Evergreen', 'Video'],
      link: null,
    },
    {
      level: 'watch',
      platform: 'Meta · Image · Belgium',
      headline: '"Assurance Santé Expats à -10%"',
      body: '10% discount offer since Feb 2025. Retargeting DCO also active. Watch if this mechanic migrates to CH.',
      tags: ['Watch', 'Evergreen', 'Discount CTA'],
      link: 'https://www.facebook.com/ads/library/?id=120210609575600321',
    },
  ],

  meta_insight: 'All 5 active Meta ads are AXA Global Healthcare — UK, France, Belgium. <strong>Zero Switzerland-specific Meta ads detected.</strong> The 10% Belgium offer and "2 months free" UK mechanic are worth monitoring for potential CH deployment.',

  linkedin_posts: [
    {
      av_bg: 'linear-gradient(135deg, #003087, #0057B8)',
      initials: 'FR',
      title: 'AXA France — Épargne Salariale Campaign',
      meta: 'LinkedIn Sponsored · 3 video ads · 150–200k impressions each',
      label: 'AXA France — Sponsored',
      link: 'https://www.linkedin.com/ad-library/search?companyIds=1684&q=epargne',
      content: '"Your savings aren\'t locked away" — myth-busting financial education targeting HR decision-makers. Regulatory urgency: new 2025 profit-sharing obligations for companies with 11+ employees.',
      stats: [
        { icon: '📊', val: '150–200k', label: 'impressions/ad' },
        { icon: '🎯', val: 'B2B2C', label: 'targeting' },
        { icon: '🎞', val: '3', label: 'video ads' },
      ],
      analyst_note: 'Financial education at high volume is proven. <strong>AXA Switzerland has an identical opportunity with Pillar 2/3 complexity</strong> — a demystifying pensions content play on LinkedIn could directly address Swiss corporate audiences at Q1 tax season.',
    },
    {
      av_bg: 'linear-gradient(135deg, #444, #888)',
      initials: 'AP',
      title: 'AXA Partners — Insurtech / AI Thought Leadership',
      meta: 'LinkedIn Sponsored · 1k–5k impressions · 2% CH share',
      label: null,
      link: null,
      content: 'Global Head of B2B2C summarising Insurtech Insights Europe: ecosystem models, data platform competition, AI scaling. Switzerland receives 2% of impressions.',
      stats: [],
      analyst_note: 'Low volume but a bellwether. <strong>Watch for AXA Switzerland to pick up the AI/innovation narrative locally</strong> — if Zurich Insurance or Helvetia move first, AXA CH will need to respond.',
    },
  ],

  website_changes: [
    {
      level: 'high',
      url: 'https://www.axa.ch/en/landingpage/crans-montana.html',
      url_label: 'axa.ch → /landingpage/crans-montana ↗',
      title: 'Crans-Montana fire response page live',
      body: 'Homepage banner directing affected customers to Care and Case Management support. AXA is the visible first-responder in a major Swiss crisis moment — with no paid amplification behind it.',
    },
    {
      level: 'high',
      url: 'https://www.axa.ch/en/private-customers/claims/travel-abroad/middle-east.html',
      url_label: 'axa.ch → Middle East Travel Advisory ↗',
      title: 'Middle East travel claims notice persists',
      body: 'Emergency line (+41 800 809 809) prominently featured. Persistent notice signals ongoing claims exposure — and doubles as a trust signal for travel insurance shoppers ahead of summer.',
    },
    {
      level: 'medium',
      url: 'https://www.axa.ch/en',
      url_label: 'axa.ch → Homepage Blog ↗',
      title: 'Pillar 3 + cohabitation content surfaced on homepage',
      body: 'Four articles live: cohabitation/retirement provision (Pillar 3), winter driving, child support, cancer prevention. Q1 tax-season timing on the pension piece is deliberate — watch if Pillar 3 pages see paid traffic next week.',
    },
  ],

  actions: [
    {
      level: 'high',
      title: 'Own the Crans-Montana moment on social',
      body: 'AXA holds the homepage response but has zero paid social amplification. A brand-safety or empathy-led post this week captures space they have left completely open.',
    },
    {
      level: 'high',
      title: 'Assess the Global Healthcare expat overlap',
      body: 'AXA\'s group is spending heavily on expat health across 3 markets. Ensure your health messaging is differentiated — and review whether a discount mechanic could work locally.',
    },
    {
      level: 'medium',
      title: 'Push Pillar 3 content before Q1 closes',
      body: 'AXA\'s homepage is surfacing pension content at exactly the right moment. If your Pillar 3 product pages aren\'t optimised for this traffic, you\'re leaving conversions behind.',
    },
    {
      level: 'watch',
      title: 'Verify AXA Switzerland\'s paid social status',
      body: 'Check whether they run from a separate Swiss ad account not captured here. If genuinely dark on paid social — this is an unusual and exploitable gap. Confirm next week.',
    },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function bc(level) { return level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'watch'; }
function bl(level) { return level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Watch'; }

// ─── HTML BUILDER ────────────────────────────────────────────────────────────
function buildEmail(name, d, week, year) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const execCards = d.exec_summary.map(e => `
    <div class="insight ${bc(e.level)}">
      <div class="insight-tag">${e.tag} <span class="badge ${bc(e.level)}">${bl(e.level)}</span></div>
      <p>${e.body}</p>
    </div>`).join('');

  const adCards = d.meta_ads.map(a => `
    <div class="ad-card signal-${bc(a.level)}">
      <div class="ad-platform">${a.platform}</div>
      <div class="ad-headline">&ldquo;${a.headline.replace(/^"|"$/g,'')}&rdquo;</div>
      <div class="ad-body">${a.body}</div>
      <div class="ad-meta">
        ${a.tags.map(t => `<span class="ad-meta-tag ${t === 'High' ? 'high' : t === 'Medium' ? 'medium' : t === 'Watch' ? 'watch' : ''}">${t}</span>`).join('')}
      </div>
      ${a.link ? `<a class="ad-view-link" href="${a.link}" target="_blank">View ad &rarr;</a>` : ''}
    </div>`).join('');

  const liCards = d.linkedin_posts.map(p => `
    <div class="post-card">
      ${p.label ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div class="post-label">${p.label}</div>${p.link ? `<a class="ad-view-link" href="${p.link}" target="_blank">View post &rarr;</a>` : ''}</div>` : ''}
      <div class="post-header">
        <div class="post-av" style="background:${p.av_bg};">${p.initials}</div>
        <div class="post-meta">
          <strong>${p.title}</strong>
          <span>${p.meta}</span>
        </div>
      </div>
      <div class="post-content">&ldquo;${p.content}&rdquo;</div>
      ${p.stats.length ? `<div class="post-stats">${p.stats.map(s => `<div class="post-stat">${s.icon} <strong>${s.val}</strong> ${s.label}</div>`).join('')}</div>` : ''}
      <div class="post-intel">
        <div class="post-intel-label">Analyst Note</div>
        <p>${p.analyst_note}</p>
      </div>
    </div>`).join('');

  const changeRows = d.website_changes.map(c => `
    <div class="change-row">
      <div class="change-signal"><div class="signal-pill ${bc(c.level)}">${bl(c.level)}</div></div>
      <div class="change-content">
        <a class="change-url" href="${c.url}" target="_blank">${c.url_label}</a>
        <strong>${c.title}</strong>
        <p>${c.body}</p>
      </div>
    </div>`).join('');

  const actionItems = d.actions.map((a, i) => `
    <div class="action-item">
      <div class="action-num">${i + 1}</div>
      <div class="action-content">
        <strong>${a.title}</strong>
        <p>${a.body}</p>
        <span class="action-tag ${bc(a.level)}">${bl(a.level)}</span>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Marktelio &mdash; AXA Switzerland &middot; W${week} ${year} Intelligence Brief</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #E8E9F0; font-family: 'Open Sans', sans-serif; color: #0D0D1A; -webkit-font-smoothing: antialiased; }
  .email-wrap { max-width: 680px; margin: 32px auto; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 48px rgba(13,13,26,0.18); }
  .header { background: #0D0D1A; padding: 28px 36px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1A2A3A; }
  .logo { display: flex; align-items: center; }
  .logo-text { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: -0.5px; margin-left: 10px; }
  .logo-text .mark { color: #fff; }
  .logo-text .tel { color: #00E5C8; }
  .header-meta { text-align: right; }
  .header-meta .week { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #00E5C8; }
  .header-meta .date { font-size: 11px; color: #556688; margin-top: 2px; }
  .hero-band { background: linear-gradient(135deg, #0D1825 0%, #0D0D1A 100%); padding: 32px 36px 28px; border-bottom: 1px solid #1A2A3A; }
  .tracking-pill { display: inline-flex; align-items: center; gap: 8px; background: #1A2A3A; border: 1px solid #2A3A4A; border-radius: 20px; padding: 5px 14px; margin-bottom: 18px; }
  .tracking-pill .live { width: 7px; height: 7px; background: #00E5C8; border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .tracking-pill span { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8888AA; }
  .tracking-pill strong { color: #00E5C8; font-size: 10px; letter-spacing: 1.5px; }
  .hero-band h1 { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 22px; color: #fff; letter-spacing: -0.5px; line-height: 1.3; margin-bottom: 10px; }
  .hero-band h1 em { font-style: normal; color: #00E5C8; }
  .hero-band p { font-size: 13px; color: #8888AA; line-height: 1.6; max-width: 560px; }
  .analyst-bar { display: flex; align-items: center; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid #1A2A3A; }
  .analyst-av { width: 30px; height: 30px; background: linear-gradient(135deg, #00A896, #00E5C8); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; color: #0D0D1A; flex-shrink: 0; }
  .analyst-bar-text { font-size: 11px; color: #556688; line-height: 1.5; }
  .analyst-bar-text strong { color: #AABBCC; }
  .body { background: #fff; }
  .signal-row { display: flex; border-bottom: 1px solid #F0F1F5; }
  .signal-box { flex: 1; padding: 20px 12px; text-align: center; border-right: 1px solid #F0F1F5; }
  .signal-box:last-child { border-right: none; }
  .signal-label { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8888AA; margin-bottom: 6px; }
  .signal-val { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 900; color: #0D0D1A; line-height: 1; }
  .signal-sub { font-size: 11px; color: #00A896; font-weight: 600; margin-top: 4px; }
  .section { padding: 28px 36px; border-bottom: 1px solid #F0F1F5; }
  .section-eyebrow { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #00A896; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .section-eyebrow::after { content: ''; flex: 1; height: 1px; background: #F0F1F5; }
  .badge { font-family: 'Montserrat', sans-serif; font-size: 9px; padding: 2px 7px; border-radius: 5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .badge.high   { background: #FFE0E0; color: #C62828; }
  .badge.medium { background: #FFF3E0; color: #E65100; }
  .badge.watch  { background: #E8F5E9; color: #2E7D32; }
  .insight { background: #F8F9FC; border-left: 3px solid #EBEBF5; border-radius: 0 10px 10px 0; padding: 14px 16px; margin-bottom: 12px; }
  .insight:last-child { margin-bottom: 0; }
  .insight.high   { border-left-color: #C62828; }
  .insight.medium { border-left-color: #E65100; }
  .insight.watch  { border-left-color: #2E7D32; }
  .insight-tag { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0D0D1A; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .insight p { font-size: 13px; color: #444466; line-height: 1.7; }
  .insight p strong { color: #0D0D1A; }
  .ad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ad-card { background: #F8F9FC; border-radius: 10px; padding: 14px; border: 1px solid #EBEBF5; }
  .ad-card.signal-high   { border-left: 3px solid #C62828; }
  .ad-card.signal-medium { border-left: 3px solid #E65100; }
  .ad-card.signal-watch  { border-left: 3px solid #2E7D32; }
  .ad-platform { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8888AA; margin-bottom: 6px; }
  .ad-headline { font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; color: #0D0D1A; margin-bottom: 5px; line-height: 1.4; }
  .ad-body { font-size: 11px; color: #666688; line-height: 1.6; }
  .ad-meta { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .ad-meta-tag { font-family: 'Montserrat', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background: #EBEBF5; color: #666688; }
  .ad-meta-tag.high   { background: #FFE0E0; color: #C62828; }
  .ad-meta-tag.medium { background: #FFF3E0; color: #E65100; }
  .ad-meta-tag.watch  { background: #E8F5E9; color: #2E7D32; }
  .ad-view-link { display: inline-block; margin-top: 8px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #00A896; text-decoration: none; }
  .intel-box { margin-top: 14px; padding: 12px 14px; background: #F0F1F5; border-radius: 8px; }
  .intel-box-label { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0D0D1A; margin-bottom: 4px; }
  .intel-box p { font-size: 12px; color: #444466; line-height: 1.6; }
  .post-card { background: #F8F9FC; border-radius: 10px; padding: 16px; margin-bottom: 10px; border: 1px solid #EBEBF5; }
  .post-card:last-child { margin-bottom: 0; }
  .post-label { display: inline-flex; align-items: center; gap: 4px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #00A896; background: #E6FDF9; border: 1px solid #00E5C8; border-radius: 5px; padding: 2px 8px; }
  .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .post-av { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0; }
  .post-meta strong { font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; color: #0D0D1A; display: block; }
  .post-meta span { font-size: 11px; color: #8888AA; }
  .post-content { font-size: 12px; color: #444466; line-height: 1.7; margin-bottom: 10px; font-style: italic; }
  .post-stats { display: flex; gap: 16px; padding-top: 10px; border-top: 1px solid #EBEBF5; flex-wrap: wrap; }
  .post-stat { font-size: 11px; color: #8888AA; display: flex; align-items: center; gap: 4px; }
  .post-stat strong { color: #0D0D1A; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; }
  .post-intel { background: #0D0D1A; border-radius: 8px; padding: 10px 12px; margin-top: 10px; }
  .post-intel-label { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #00E5C8; margin-bottom: 4px; }
  .post-intel p { font-size: 11px; color: #AABBCC; line-height: 1.6; }
  .post-intel p strong { color: #fff; }
  .change-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #F0F1F5; }
  .change-row:last-child { border-bottom: none; padding-bottom: 0; }
  .change-signal { flex-shrink: 0; width: 68px; }
  .signal-pill { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 7px; border-radius: 5px; text-align: center; }
  .signal-pill.high   { background: #FFE0E0; color: #C62828; }
  .signal-pill.medium { background: #FFF3E0; color: #E65100; }
  .signal-pill.watch  { background: #E8F5E9; color: #2E7D32; }
  .change-url { font-family: 'Montserrat', sans-serif; font-size: 10px; color: #00A896; margin-bottom: 4px; font-weight: 600; display: inline-block; text-decoration: none; }
  .change-content strong { font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; color: #0D0D1A; display: block; margin-bottom: 3px; }
  .change-content p { font-size: 12px; color: #666688; line-height: 1.6; }
  .action-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #F0F1F5; }
  .action-item:last-child { border-bottom: none; padding-bottom: 0; }
  .action-num { width: 28px; height: 28px; background: #0D0D1A; color: #00E5C8; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .action-content strong { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; color: #0D0D1A; display: block; margin-bottom: 4px; }
  .action-content p { font-size: 12px; color: #666688; line-height: 1.6; }
  .action-tag { display: inline-block; margin-top: 6px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 2px 8px; border-radius: 5px; }
  .action-tag.high   { background: #FFE0E0; color: #C62828; }
  .action-tag.medium { background: #FFF3E0; color: #E65100; }
  .action-tag.watch  { background: #E8F5E9; color: #2E7D32; }
  .footer { background: #0D0D1A; padding: 28px 36px; text-align: center; }
  .footer-logo { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 16px; letter-spacing: -0.5px; margin-bottom: 8px; }
  .footer-logo .mark { color: #fff; }
  .footer-logo .tel { color: #00E5C8; }
  .footer-tagline { font-size: 11px; color: #556688; margin-bottom: 16px; }
  .footer-links { display: flex; justify-content: center; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; }
  .footer-links a { font-size: 11px; color: #556688; text-decoration: none; }
  .footer-note { font-size: 11px; color: #2A3A4A; line-height: 1.8; }
  @media (max-width: 600px) {
    .email-wrap { margin: 0; border-radius: 0; }
    .header, .hero-band, .section, .footer { padding-left: 20px; padding-right: 20px; }
    .ad-grid { grid-template-columns: 1fr; }
    .signal-val { font-size: 20px; }
    .hero-band h1 { font-size: 18px; }
  }
</style>
</head>
<body>
<div class="email-wrap">

  <!-- HEADER -->
  <div class="header">
    <div class="logo">
      <svg width="28" height="28" viewBox="0 0 68 68" fill="none">
        <rect width="68" height="68" rx="16" fill="#1A2A3A"/>
        <polyline points="9,34 19,34 24,18 30,50 35,26 41,42 47,34 59,34" stroke="#00E5C8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="59" cy="34" r="4.5" fill="#00E5C8"/>
      </svg>
      <span class="logo-text"><span class="mark">markte</span><span class="tel">lio</span></span>
    </div>
    <div class="header-meta">
      <div class="week">W${week} &middot; ${year}</div>
      <div class="date">Delivered ${today}</div>
    </div>
  </div>

  <!-- HERO -->
  <div class="hero-band">
    <div class="tracking-pill">
      <div class="live"></div>
      <span>Tracking</span> <strong>AXA SWITZERLAND</strong>
    </div>
    <h1>${d.hero_headline}</h1>
    <p>${d.hero_sub}</p>
    <div class="analyst-bar">
      <div class="analyst-av">${d.analyst_initials}</div>
      <div class="analyst-bar-text"><strong>${d.analyst_label}</strong> &middot; ${d.total_signals} signals detected &middot; ${d.high_priority} high priority &middot; Delivered ${today}</div>
    </div>
  </div>

  <!-- SIGNAL ROW -->
  <div class="body">
    <div class="signal-row">
      <div class="signal-box">
        <div class="signal-label">Total Signals</div>
        <div class="signal-val">${d.total_signals}</div>
        <div class="signal-sub">This week</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">High Priority</div>
        <div class="signal-val">${d.high_priority}</div>
        <div class="signal-sub">Flagged High</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">Ad Signals</div>
        <div class="signal-val">${d.ad_signals}</div>
        <div class="signal-sub">Meta &middot; 3 markets</div>
      </div>
      <div class="signal-box">
        <div class="signal-label">Site Changes</div>
        <div class="signal-val">${d.site_changes}</div>
        <div class="signal-sub">Homepage + blog</div>
      </div>
    </div>

    <!-- EXEC SUMMARY -->
    <div class="section">
      <div class="section-eyebrow">&#9889; Executive Summary</div>
      ${execCards}
    </div>

    <!-- META ADS -->
    <div class="section">
      <div class="section-eyebrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-right:2px"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.562 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
        Meta Ads &mdash; This Week
      </div>
      <div class="ad-grid">${adCards}</div>
      <div class="intel-box">
        <div class="intel-box-label">Marktelio Insight</div>
        <p>${d.meta_insight}</p>
      </div>
    </div>

    <!-- LINKEDIN -->
    <div class="section">
      <div class="section-eyebrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-right:2px"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path d="M7.5 10v6.5M7.5 7.5a.5.5 0 110 1 .5.5 0 010-1zM10.5 16.5v-4c0-1.5 1-2 2-2s2 .5 2 2v4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        LinkedIn &mdash; This Week
      </div>
      ${liCards}
    </div>

    <!-- WEBSITE CHANGES -->
    <div class="section">
      <div class="section-eyebrow">&#127760; Website Changes &mdash; ${d.site_changes} Detected</div>
      ${changeRows}
    </div>

    <!-- RECOMMENDED ACTIONS -->
    <div class="section">
      <div class="section-eyebrow">&#9989; Suggested Follow-Ups</div>
      ${actionItems}
    </div>

  </div><!-- /body -->

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-logo"><span class="mark">markte</span><span class="tel">lio</span></div>
    <div class="footer-tagline">We do the research. You stay ahead.</div>
    <div class="footer-links">
      <a href="https://marktel.io">marktel.io</a>
      <a href="https://marktel.io/privacy">Privacy Policy</a>
      <a href="https://marktel.io/terms">Terms</a>
      <a href="mailto:hello@marktel.io">hello@marktel.io</a>
    </div>
    <div class="footer-note">
      Hi ${name} &mdash; your on-demand report for <strong>AXA Switzerland</strong> is ready.<br>
      Delivered ${today} &middot; Next report: Mon 6 Apr 2026 &middot; Made in Switzerland &#127464;&#127469;
    </div>
  </div>

</div>
</body>
</html>`;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Missing name or email' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  try {
    const html = buildEmail(name, REPORT_DATA, WEEK, YEAR);
    console.log('[Marktelio] HTML built OK');

    console.log('[Resend] Sending to:', email, '| key set:', !!process.env.RESEND_API_KEY);
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Marktelio Intelligence <reports@marktel.io>',
        to: [email],
        subject: `AXA Switzerland Intelligence Report — W${WEEK} ${YEAR}`,
        html,
      }),
    });

    const resendBody = await resendRes.text();
    console.log('[Resend] status:', resendRes.status, resendBody);
    if (!resendRes.ok) throw new Error('[Resend] ' + resendBody);

    return res.status(200).json({ success: true, message: `Report sent to ${email}` });

  } catch (err) {
    console.error('[Marktelio] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
