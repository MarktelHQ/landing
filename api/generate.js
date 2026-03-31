// api/generate.js - Marktel demo endpoint
// Edge Runtime - native fetch only
// Claude outputs JSON -> JS builds full branded HTML template

export const config = { runtime: 'edge' };

// ─── AXA SIGNALS ────────────────────────────────────────────────────────────
const AXA_SIGNALS = {
  company: 'AXA Switzerland',
  week: 13, year: 2026,
  linkedin: {
    totalFollowers: 89400, followerGrowth: '+1.2% WoW',
    posts: [
      { date: '2026-03-25', content: 'AXA Switzerland launches new digital health portal for SME clients, integrating telemedicine and claims in one app.', likes: 312, comments: 28, shares: 45, theme: 'Digital Health' },
      { date: '2026-03-24', content: 'Our 2025 sustainability report is live. Net-zero target brought forward to 2040.', likes: 198, comments: 14, shares: 31, theme: 'ESG / Sustainability' },
      { date: '2026-03-22', content: 'Partnership with Swiss Startup Association - supporting 50 high-growth ventures in 2026.', likes: 421, comments: 52, shares: 67, theme: 'Partnerships' },
    ],
  },
  facebook: {
    pageFollowers: 124000, avgEngagementRate: '3.8%',
    posts: [
      { date: '2026-03-26', content: 'Spring driving tips - stay safe on wet roads. AXA Motor covers you 24/7.', likes: 543, comments: 61, shares: 88, theme: 'Consumer / Motor' },
      { date: '2026-03-23', content: 'Win a weekend wellness retreat! Enter our giveaway by sharing your wellness routine.', likes: 1204, comments: 237, shares: 312, theme: 'Activation / Giveaway' },
    ],
  },
  web: {
    campaigns: ['Digital Health Hub launch (Mar 2026)', 'AXA for Startups programme expansion', 'SME bundled insurance refresh'],
    pricing: 'No public price changes detected this week.',
  },
  sentiment: 'Positive - health innovation and sustainability messaging dominating.',
};

// ─── CLAUDE PROMPT ──────────────────────────────────────────────────────────
function buildPrompt(s) {
  return `You are Marktel, a Swiss B2B competitive intelligence analyst. Analyse these signals for ${s.company} W${s.week} ${s.year} and return ONLY a valid JSON object - no markdown, no explanation, no code fences.

SIGNALS:
LinkedIn ${s.linkedin.totalFollowers} followers ${s.linkedin.followerGrowth}:
${s.linkedin.posts.map(p => `[${p.date}] ${p.content} (likes:${p.likes} comments:${p.comments} shares:${p.shares}) Theme:${p.theme}`).join('\n')}

Facebook ${s.facebook.pageFollowers} followers avg ${s.facebook.avgEngagementRate}:
${s.facebook.posts.map(p => `[${p.date}] ${p.content} (likes:${p.likes} comments:${p.comments} shares:${p.shares}) Theme:${p.theme}`).join('\n')}

Campaigns: ${s.web.campaigns.join(', ')}
Pricing: ${s.web.pricing}
Sentiment: ${s.sentiment}

Return this exact JSON structure with your analysis (all strings must be plain text, no HTML tags):
{
  "hero_headline": "one sharp punchy headline summarising the biggest signal this week (max 12 words)",
  "hero_sub": "one sentence expanding on the headline with a key implication (max 25 words)",
  "total_signals": <number>,
  "high_priority": <number>,
  "linkedin_signals": <number>,
  "facebook_signals": <number>,
  "exec_summary": [
    { "level": "high", "tag": "short tag label", "body": "2-3 sentence insight with bold key phrase marked as **bold**" },
    { "level": "high", "tag": "short tag label", "body": "2-3 sentence insight" },
    { "level": "watch", "tag": "short tag label", "body": "2-3 sentence insight" }
  ],
  "linkedin_posts": [
    { "initials": "2 letter initials", "color": "hex color", "title": "post title", "meta": "platform and reach details", "content": "quote or summary of post content", "stat1_label": "label", "stat1_val": "value", "stat2_label": "label", "stat2_val": "value", "stat3_label": "label", "stat3_val": "value", "analyst_note": "sharp 2 sentence analyst commentary with **bold** key phrase" },
    { "initials": "2 letter initials", "color": "hex color", "title": "post title", "meta": "platform and reach details", "content": "quote or summary", "stat1_label": "label", "stat1_val": "value", "stat2_label": "label", "stat2_val": "value", "stat3_label": "label", "stat3_val": "value", "analyst_note": "sharp 2 sentence analyst commentary" }
  ],
  "facebook_posts": [
    { "initials": "2 letter initials", "color": "hex color", "title": "post title", "meta": "platform details", "content": "summary", "stat1_label": "label", "stat1_val": "value", "stat2_label": "label", "stat2_val": "value", "stat3_label": "label", "stat3_val": "value", "analyst_note": "sharp 2 sentence note" }
  ],
  "actions": [
    { "level": "high", "title": "action title", "body": "2 sentence explanation" },
    { "level": "high", "title": "action title", "body": "2 sentence explanation" },
    { "level": "medium", "title": "action title", "body": "2 sentence explanation" },
    { "level": "watch", "title": "action title", "body": "2 sentence explanation" }
  ]
}`;
}

// ─── HTML BUILDER ───────────────────────────────────────────────────────────
function bold(str) {
  return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function badgeClass(level) {
  return level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'watch';
}

function badgeLabel(level) {
  return level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Watch';
}

function buildPostCard(p, platformColor) {
  return `
    <div class="post-card">
      <div class="post-header">
        <div class="post-av" style="background:${p.color || platformColor};">${p.initials}</div>
        <div class="post-meta">
          <strong>${p.title}</strong>
          <span>${p.meta}</span>
        </div>
      </div>
      <div class="post-content">&ldquo;${p.content}&rdquo;</div>
      <div class="post-stats">
        <div class="post-stat">&#128293; <strong>${p.stat1_val}</strong> ${p.stat1_label}</div>
        <div class="post-stat">&#128172; <strong>${p.stat2_val}</strong> ${p.stat2_label}</div>
        <div class="post-stat">&#128257; <strong>${p.stat3_val}</strong> ${p.stat3_label}</div>
      </div>
      <div class="post-intel">
        <div class="post-intel-label">Analyst Note</div>
        <p>${bold(p.analyst_note)}</p>
      </div>
    </div>`;
}

function buildEmail(name, d, week, year) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const execCards = d.exec_summary.map(e => `
    <div class="insight ${badgeClass(e.level)}">
      <div class="insight-tag">${e.tag} <span class="badge ${badgeClass(e.level)}">${badgeLabel(e.level)}</span></div>
      <p>${bold(e.body)}</p>
    </div>`).join('');

  const liPosts = d.linkedin_posts.map(p => buildPostCard(p, 'linear-gradient(135deg,#0A66C2,#004182)')).join('');
  const fbPosts = d.facebook_posts.map(p => buildPostCard(p, 'linear-gradient(135deg,#1877F2,#0a58ca)')).join('');

  const actions = d.actions.map((a, i) => `
    <div class="action-item">
      <div class="action-num">${i + 1}</div>
      <div class="action-content">
        <strong>${a.title}</strong>
        <p>${a.body}</p>
        <span class="action-tag ${badgeClass(a.level)}">${badgeLabel(a.level)}</span>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Marktelio &mdash; AXA Switzerland W${week} ${year}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#E8E9F0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0D0D1A;-webkit-font-smoothing:antialiased;}
  .email-wrap{max-width:680px;margin:32px auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 48px rgba(13,13,26,0.18);}
  .header{background:#0D0D1A;padding:24px 36px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1A2A3A;}
  .logo-text{font-size:20px;font-weight:800;letter-spacing:-0.5px;margin-left:10px;color:#fff;}
  .logo-text .tel{color:#00E5C8;}
  .header-meta{text-align:right;}
  .header-meta .week{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#00E5C8;}
  .header-meta .date{font-size:11px;color:#556688;margin-top:2px;}
  .hero-band{background:linear-gradient(135deg,#0D1825 0%,#0D0D1A 100%);padding:32px 36px 28px;border-bottom:1px solid #1A2A3A;}
  .tracking-pill{display:inline-flex;align-items:center;gap:8px;background:#1A2A3A;border:1px solid #2A3A4A;border-radius:20px;padding:5px 14px;margin-bottom:18px;}
  .live{width:7px;height:7px;background:#00E5C8;border-radius:50%;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  .tracking-pill span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#8888AA;}
  .tracking-pill strong{color:#00E5C8;font-size:10px;letter-spacing:1.5px;}
  .hero-band h1{font-weight:800;font-size:22px;color:#fff;letter-spacing:-0.5px;line-height:1.3;margin-bottom:10px;}
  .hero-band h1 em{font-style:normal;color:#00E5C8;}
  .hero-band p{font-size:13px;color:#8888AA;line-height:1.6;}
  .analyst-bar{display:flex;align-items:center;gap:10px;margin-top:18px;padding-top:18px;border-top:1px solid #1A2A3A;}
  .analyst-av{width:30px;height:30px;background:linear-gradient(135deg,#00A896,#00E5C8);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#0D0D1A;flex-shrink:0;}
  .analyst-bar-text{font-size:11px;color:#556688;line-height:1.5;}
  .analyst-bar-text strong{color:#AABBCC;}
  .signal-row{display:flex;border-bottom:1px solid #F0F1F5;background:#fff;}
  .signal-box{flex:1;padding:20px 12px;text-align:center;border-right:1px solid #F0F1F5;}
  .signal-box:last-child{border-right:none;}
  .signal-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#8888AA;margin-bottom:6px;}
  .signal-val{font-size:26px;font-weight:900;color:#0D0D1A;line-height:1;}
  .signal-sub{font-size:11px;color:#00A896;font-weight:600;margin-top:4px;}
  .body-wrap{background:#fff;}
  .section{padding:28px 36px;border-bottom:1px solid #F0F1F5;}
  .section-eyebrow{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#00A896;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
  .section-eyebrow::after{content:'';flex:1;height:1px;background:#F0F1F5;}
  .badge{font-size:9px;padding:2px 7px;border-radius:5px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
  .badge.high{background:#FFE0E0;color:#C62828;}
  .badge.medium{background:#FFF3E0;color:#E65100;}
  .badge.watch{background:#E8F5E9;color:#2E7D32;}
  .insight{background:#F8F9FC;border-left:3px solid #EBEBF5;border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:12px;}
  .insight:last-child{margin-bottom:0;}
  .insight.high{border-left-color:#C62828;}
  .insight.medium{border-left-color:#E65100;}
  .insight.watch{border-left-color:#2E7D32;}
  .insight-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0D0D1A;margin-bottom:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .insight p{font-size:13px;color:#444466;line-height:1.7;}
  .post-card{background:#F8F9FC;border-radius:10px;padding:16px;margin-bottom:10px;border:1px solid #EBEBF5;}
  .post-card:last-child{margin-bottom:0;}
  .post-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .post-av{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;}
  .post-meta strong{font-size:12px;font-weight:700;color:#0D0D1A;display:block;}
  .post-meta span{font-size:11px;color:#8888AA;}
  .post-content{font-size:12px;color:#444466;line-height:1.7;margin-bottom:10px;font-style:italic;}
  .post-stats{display:flex;gap:16px;padding-top:10px;border-top:1px solid #EBEBF5;flex-wrap:wrap;}
  .post-stat{font-size:11px;color:#8888AA;display:flex;align-items:center;gap:4px;}
  .post-stat strong{color:#0D0D1A;font-size:12px;font-weight:700;}
  .post-intel{background:#0D0D1A;border-radius:8px;padding:10px 12px;margin-top:10px;}
  .post-intel-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#00E5C8;margin-bottom:4px;}
  .post-intel p{font-size:11px;color:#AABBCC;line-height:1.6;}
  .post-intel p strong{color:#fff;}
  .action-item{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #F0F1F5;}
  .action-item:last-child{border-bottom:none;padding-bottom:0;}
  .action-num{width:28px;height:28px;background:#0D0D1A;color:#00E5C8;font-size:12px;font-weight:800;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
  .action-content strong{font-size:13px;font-weight:700;color:#0D0D1A;display:block;margin-bottom:4px;}
  .action-content p{font-size:12px;color:#666688;line-height:1.6;}
  .action-tag{display:inline-block;margin-top:6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:5px;}
  .action-tag.high{background:#FFE0E0;color:#C62828;}
  .action-tag.medium{background:#FFF3E0;color:#E65100;}
  .action-tag.watch{background:#E8F5E9;color:#2E7D32;}
  .footer{background:#0D0D1A;padding:28px 36px;text-align:center;}
  .footer-logo{font-weight:800;font-size:16px;letter-spacing:-0.5px;margin-bottom:8px;color:#fff;}
  .footer-logo .tel{color:#00E5C8;}
  .footer-tagline{font-size:11px;color:#556688;margin-bottom:16px;}
  .footer-links{display:flex;justify-content:center;gap:20px;margin-bottom:16px;flex-wrap:wrap;}
  .footer-links a{font-size:11px;color:#556688;text-decoration:none;}
  .footer-note{font-size:11px;color:#2A3A4A;line-height:1.8;}
  .li-icon{display:inline-block;width:14px;height:14px;background:#0A66C2;border-radius:3px;vertical-align:middle;margin-right:4px;}
  .fb-icon{display:inline-block;width:14px;height:14px;background:#1877F2;border-radius:3px;vertical-align:middle;margin-right:4px;}
</style>
</head>
<body>
<div class="email-wrap">

  <!-- HEADER -->
  <div class="header">
    <div style="display:flex;align-items:center;">
      <svg width="28" height="28" viewBox="0 0 68 68" fill="none"><rect width="68" height="68" rx="16" fill="#1A2A3A"/><polyline points="9,34 19,34 24,18 30,50 35,26 41,42 47,34 59,34" stroke="#00E5C8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="59" cy="34" r="4.5" fill="#00E5C8"/></svg>
      <span class="logo-text">&nbsp;markte<span class="tel">lio</span></span>
    </div>
    <div class="header-meta">
      <div class="week">W${week} &middot; ${year}</div>
      <div class="date">Delivered ${today}</div>
    </div>
  </div>

  <!-- HERO -->
  <div class="hero-band">
    <div class="tracking-pill"><div class="live"></div><span>Tracking</span>&nbsp;<strong>AXA SWITZERLAND</strong></div>
    <h1><em>${d.hero_headline}</em></h1>
    <p>${d.hero_sub}</p>
    <div class="analyst-bar">
      <div class="analyst-av">AI</div>
      <div class="analyst-bar-text"><strong>Generated by Marktelio AI</strong> &middot; ${d.total_signals} signals detected &middot; ${d.high_priority} high priority &middot; Delivered ${today}</div>
    </div>
  </div>

  <!-- SIGNAL ROW -->
  <div class="signal-row">
    <div class="signal-box"><div class="signal-label">Total Signals</div><div class="signal-val">${d.total_signals}</div><div class="signal-sub">This week</div></div>
    <div class="signal-box"><div class="signal-label">High Priority</div><div class="signal-val">${d.high_priority}</div><div class="signal-sub">Flagged High</div></div>
    <div class="signal-box"><div class="signal-label">LinkedIn</div><div class="signal-val">${d.linkedin_signals}</div><div class="signal-sub">Posts tracked</div></div>
    <div class="signal-box"><div class="signal-label">Facebook</div><div class="signal-val">${d.facebook_signals}</div><div class="signal-sub">Posts tracked</div></div>
  </div>

  <div class="body-wrap">

    <!-- EXEC SUMMARY -->
    <div class="section">
      <div class="section-eyebrow">&#9889; Executive Summary</div>
      ${execCards}
    </div>

    <!-- LINKEDIN -->
    <div class="section">
      <div class="section-eyebrow"><span class="li-icon"></span> LinkedIn &mdash; This Week</div>
      ${liPosts}
    </div>

    <!-- FACEBOOK -->
    <div class="section">
      <div class="section-eyebrow"><span class="fb-icon"></span> Facebook &mdash; This Week</div>
      ${fbPosts}
    </div>

    <!-- ACTIONS -->
    <div class="section">
      <div class="section-eyebrow">&#9989; Recommended Actions</div>
      ${actions}
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-logo">markte<span class="tel">lio</span></div>
    <div class="footer-tagline">We do the research. You stay ahead.</div>
    <div class="footer-links">
      <a href="https://marktelio.io">marktelio.io</a>
      <a href="https://marktelio.io/privacy">Privacy</a>
      <a href="https://marktelio.io/terms">Terms</a>
      <a href="mailto:hello@marktelio.io">hello@marktelio.io</a>
    </div>
    <div class="footer-note">Hi ${name} &mdash; your on-demand report for <strong>AXA Switzerland</strong> is ready.<br>Made in Switzerland &#127464;&#127469;</div>
  </div>

</div>
</body>
</html>`;
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────
export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

  const { name, email } = body;
  if (!name || !email) return new Response(JSON.stringify({ error: 'Missing name or email' }), { status: 400, headers });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });

  const { week, year } = AXA_SIGNALS;

  // Step 1: Claude returns JSON content
  let reportData;
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(AXA_SIGNALS) }],
      }),
    });
    if (!claudeRes.ok) throw new Error(await claudeRes.text());
    const claudeData = await claudeRes.json();
    let raw = claudeData.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    reportData = JSON.parse(raw);
  } catch (err) {
    console.error('[Marktel] Claude error:', err.message);
    return new Response(JSON.stringify({ error: 'Report generation failed' }), { status: 500, headers });
  }

  // Step 2: Build full HTML from template
  const html = buildEmail(name, reportData, week, year);

  // Step 3: Send via Resend
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Marktelio Intelligence <reports@marktel.io>',
        to: [email],
        subject: `AXA Switzerland Intelligence Report \u2014 W${week} ${year}`,
        html,
      }),
    });
    if (!resendRes.ok) throw new Error(await resendRes.text());
  } catch (err) {
    console.error('[Marktel] Resend error:', err.message);
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ success: true, message: `Report sent to ${email}` }), { status: 200, headers });
}
