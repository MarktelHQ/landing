const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── STATIC REPORT DATA (pre-analysed from AXA W13 signals) ─────────────────
const REPORT_DATA = {
  week: 13,
  year: 2026,
  dateRange: "24–30 March 2026",
  client: "AXA Switzerland",
  preparedBy: "Marktel Intelligence",
  executiveSummary: "AXA Switzerland's digital presence in W13 shows strong product-led engagement around motor and health insurance, driven by seasonal renewal intent and cross-sell activity on axa.ch. LinkedIn organic reach improved week-on-week. Paid social efficiency declined slightly on Meta due to audience fatigue on the 'Protect What Matters' creative set. One emerging competitor move from Zurich Insurance warrants monitoring.",
  signals: [
    {
      category: "Website & SEO",
      priority: "HIGH",
      title: "Motor Insurance pages up +18% traffic WoW",
      detail: "Spring renewal season is driving significant organic uplift on /private-customers/vehicles. Top landing keyword cluster: 'auto versicherung wechseln'. Bounce rate remains low at 34%, indicating strong intent.",
      action: "Consider a targeted remarketing audience from this segment for April campaigns."
    },
    {
      category: "Paid Social — Meta",
      priority: "MEDIUM",
      title: "Creative fatigue detected on 'Protect What Matters' set",
      detail: "Frequency reached 4.7x on the 35–54 CH-DE segment. CTR dropped from 1.8% to 1.1% over 10 days. Estimated CPL increase of ~22% if creative is not rotated this week.",
      action: "Pause the existing set. Rotate to lifestyle-variant B or introduce the new 'Peace of Mind' UGC format."
    },
    {
      category: "LinkedIn",
      priority: "MEDIUM",
      title: "Organic reach +31% WoW — employer brand content leading",
      detail: "AXA's 'People of AXA' post series outperformed all other content types. Average engagement rate 4.2% vs. page average of 1.9%. Decision-maker audience (CFO, Risk Manager) showing above-average dwell time.",
      action: "Amplify top post with Sponsored Content targeting Swiss FS decision-makers."
    },
    {
      category: "Competitor Intelligence",
      priority: "HIGH",
      title: "Zurich Insurance launched new SME digital campaign",
      detail: "Zurich CH pushed a new paid search and display campaign targeting 'KMU Versicherung' keywords starting 25 March. Estimated daily spend: CHF 4,000–6,000. Landing page is a new dedicated SME hub with live quote tool.",
      action: "Review AXA's SME keyword coverage. Consider defensive bid strategy on branded + category terms."
    },
    {
      category: "Content & PR",
      priority: "LOW",
      title: "ESG report coverage gained 3 earned media placements",
      detail: "AXA's 2025 sustainability report was cited in Finanz und Wirtschaft, NZZ, and Swiss Insurance Review. Sentiment positive. Share of voice in ESG/insurance conversation increased to 28% in CH market.",
      action: "Amplify coverage via LinkedIn and AXA newsroom. Pitch follow-up commentary piece to Handelszeitung."
    },
    {
      category: "Customer Signals",
      priority: "MEDIUM",
      title: "Health insurance comparison queries spiking on aggregators",
      detail: "Comparis.ch and Moneyland showing +24% YoY volume on health insurance comparison queries in CH. AXA's listing CTR is competitive but average star rating (4.1) trails Helsana (4.4) and Swica (4.3).",
      action: "Initiate review generation push via post-claim email flow. Brief CX team on response protocol."
    }
  ],
  recommendations: [
    "Rotate Meta creative immediately — estimated CHF 8,000–12,000 CPL saving over next 30 days.",
    "Launch defensive SME paid search campaign vs. Zurich Insurance within 5 business days.",
    "Amplify LinkedIn employer brand content with CHF 2,000–4,000 Sponsored Content budget.",
    "Begin review generation programme on Comparis/Moneyland to close gap with Helsana and Swica.",
    "Build remarketing audience from motor insurance traffic spike before renewal season peaks."
  ],
  footerNote: "This report is prepared exclusively for AXA Switzerland. Data sourced from public digital signals, third-party analytics, and Marktel proprietary monitoring as of 30 March 2026."
};

// ─── EMAIL BUILDER ────────────────────────────────────────────────────────────
function buildEmailHTML(data) {
  const priorityColor = {
    HIGH: '#C0392B',
    MEDIUM: '#E67E22',
    LOW: '#27AE60'
  };

  const signalRows = data.signals.map(s => `
    <tr>
      <td style="padding:16px 20px; border-bottom:1px solid #F0F0F0; vertical-align:top;">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <span style="
            display:inline-block;
            background:${priorityColor[s.priority] || '#888'};
            color:#fff;
            font-size:10px;
            font-weight:700;
            letter-spacing:0.8px;
            padding:3px 8px;
            border-radius:3px;
            white-space:nowrap;
            margin-top:2px;
          ">${s.priority}</span>
          <div>
            <div style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">${s.category}</div>
            <div style="font-size:15px; font-weight:700; color:#1A1A2E; margin-bottom:6px;">${s.title}</div>
            <div style="font-size:13px; color:#444; line-height:1.6; margin-bottom:8px;">${s.detail}</div>
            <div style="font-size:12px; color:#C0392B; font-weight:600;">▶ ${s.action}</div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const recommendationItems = data.recommendations.map((r, i) => `
    <tr>
      <td style="padding:8px 20px; border-bottom:1px solid #F5F5F5;">
        <span style="font-size:13px; color:#1A1A2E; line-height:1.6;">
          <strong style="color:#C0392B;">${i + 1}.</strong> ${r}
        </span>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Marktel Intelligence Report — W${data.week} ${data.year}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F4;padding:32px 0;">
  <tr><td align="center">
    <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:#1A1A2E;padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">MARKTEL</div>
                <div style="font-size:11px;color:#C0392B;letter-spacing:2px;font-weight:600;margin-top:2px;">INTELLIGENCE</div>
              </td>
              <td align="right">
                <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Week ${data.week} · ${data.year}</div>
                <div style="font-size:12px;color:#fff;margin-top:4px;">${data.dateRange}</div>
              </td>
            </tr>
          </table>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:18px;font-weight:700;color:#fff;">Weekly Intelligence Report</div>
            <div style="font-size:13px;color:#aaa;margin-top:4px;">Prepared for ${data.client}</div>
          </div>
        </td>
      </tr>

      <!-- EXECUTIVE SUMMARY -->
      <tr>
        <td style="padding:28px 40px 20px;background:#FAFAFA;border-bottom:3px solid #C0392B;">
          <div style="font-size:10px;color:#C0392B;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Executive Summary</div>
          <div style="font-size:14px;color:#333;line-height:1.7;">${data.executiveSummary}</div>
        </td>
      </tr>

      <!-- SIGNALS -->
      <tr>
        <td style="padding:24px 40px 8px;">
          <div style="font-size:10px;color:#888;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Intelligence Signals</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F0F0F0;border-radius:6px;overflow:hidden;">
            ${signalRows}
          </table>
        </td>
      </tr>

      <!-- RECOMMENDATIONS -->
      <tr>
        <td style="padding:28px 40px 8px;">
          <div style="font-size:10px;color:#888;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Priority Recommendations</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F0F0F0;border-radius:6px;overflow:hidden;">
            ${recommendationItems}
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding:28px 40px;background:#1A1A2E;margin-top:24px;">
          <div style="font-size:11px;color:#888;line-height:1.6;margin-bottom:12px;">${data.footerNote}</div>
          <div style="font-size:10px;color:#555;">
            © ${data.year} Marktel GmbH · Made in Switzerland ·
            <a href="https://marktel.io/privacy" style="color:#C0392B;text-decoration:none;">Privacy Policy</a> ·
            <a href="https://marktel.io/terms" style="color:#C0392B;text-decoration:none;">Terms</a>
          </div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── VERCEL HANDLER ───────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, company } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const htmlContent = buildEmailHTML(REPORT_DATA);

    const { data, error } = await resend.emails.send({
      from: 'Marktel Intelligence <reports@marktel.io>',
      to: [email],
      bcc: ['andrew@marktel.io'],
      subject: `Marktel Intelligence Report — W${REPORT_DATA.week} ${REPORT_DATA.year} | ${REPORT_DATA.client}`,
      html: htmlContent,
      replyTo: 'andrew@marktel.io'
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send report.', detail: error.message });
    }

    console.log(`Report sent to ${email} | Resend ID: ${data?.id} | Name: ${name} | Company: ${company}`);

    return res.status(200).json({
      success: true,
      message: 'Report delivered successfully.',
      recipient: email,
      reportId: data?.id,
      week: REPORT_DATA.week,
      year: REPORT_DATA.year
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Unexpected server error.', detail: err.message });
  }
};
