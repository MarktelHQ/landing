// api/generate.js — Marktel on-demand report endpoint (Vercel Serverless)
// POST /api/generate
// Body: { name, email, competitor, competitorHandle, competitorPageId }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Competitors config — expand as needed
const COMPETITORS = {
  axa: {
    label: 'AXA Switzerland',
    linkedinHandle: 'axaswitzerland',
    facebookPageId: '187891771259726',
  },
  zurich: {
    label: 'Zurich Insurance',
    linkedinHandle: 'zurich-insurance-group',
    facebookPageId: '104059546295898',
  },
  helvetia: {
    label: 'Helvetia',
    linkedinHandle: 'helvetia-group',
    facebookPageId: '161548790558',
  },
  allianz: {
    label: 'Allianz Schweiz',
    linkedinHandle: 'allianz',
    facebookPageId: '113928028629169',
  },
};

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

function runCollector(script, args) {
  const cmd = `node collectors/${script} ${args}`;
  console.log(`[API] Running: ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: process.cwd(),
      timeout: 60000,
      env: process.env,
    });
    console.log(`[API] ${script} output:`, output.toString());
    return true;
  } catch (err) {
    console.error(`[API] ${script} failed:`, err.message);
    return false;
  }
}

function runReportGenerator(client, week, year) {
  const cmd = `node generate-report.js --client ${client} --week ${week} --year ${year}`;
  console.log(`[API] Running: ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: process.cwd(),
      timeout: 120000,
      env: process.env,
    });
    console.log('[API] Report generated:', output.toString());
    return true;
  } catch (err) {
    console.error('[API] Report generation failed:', err.message);
    return false;
  }
}

async function fetchReportHtml(client, week, year) {
  // Look for the report in local output or Supabase
  const localPath = path.join(process.cwd(), 'output', `${client}_W${week}_${year}.html`);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }

  // Fallback: fetch from Supabase reports table
  const { data, error } = await supabase
    .from('reports')
    .select('html_content')
    .eq('client_slug', client)
    .eq('week', week)
    .eq('year', year)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('[API] Could not fetch report HTML from Supabase:', error?.message);
    return null;
  }

  return data.html_content;
}

async function sendReportEmail({ name, email, competitor, html, week, year }) {
  const { data, error } = await resend.emails.send({
    from: 'Marktel Intelligence <reports@marktel.io>',
    to: [email],
    subject: `Your ${competitor} Intelligence Report — W${week} ${year}`,
    html: `
      <p>Hi ${name},</p>
      <p>Your on-demand intelligence report for <strong>${competitor}</strong> is ready.</p>
      <p>Report covers Week ${week}, ${year}.</p>
      <hr/>
      ${html}
      <hr/>
      <p style="font-size:12px;color:#999;">
        Marktel Intelligence &middot; Made in Switzerland<br/>
        <a href="https://marktel.io/privacy">Privacy</a> &middot;
        <a href="https://marktel.io/terms">Terms</a> &middot;
        <a href="https://marktel.io/contact">Contact</a>
      </p>
    `,
  });

  if (error) {
    console.error('[API] Resend error:', error);
    return false;
  }

  console.log('[API] Email sent:', data?.id);
  return true;
}

async function logRequest({ name, email, competitor, week, year, status }) {
  await supabase.from('report_requests').insert({
    name,
    email,
    competitor,
    week,
    year,
    status,
    requested_at: new Date().toISOString(),
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, competitor: competitorKey } = req.body;

  // Validate inputs
  if (!name || !email || !competitorKey) {
    return res.status(400).json({ error: 'Missing required fields: name, email, competitor' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const competitor = COMPETITORS[competitorKey];
  if (!competitor) {
    return res.status(400).json({
      error: `Unknown competitor. Valid options: ${Object.keys(COMPETITORS).join(', ')}`,
    });
  }

  const week = getCurrentWeek();
  const year = new Date().getFullYear();
  const clientSlug = competitorKey;

  console.log(`[API] Request from ${name} <${email}> — competitor: ${competitor.label} — W${week}/${year}`);

  // Log request immediately
  await logRequest({ name, email, competitor: competitor.label, week, year, status: 'processing' });

  // Acknowledge immediately — Vercel functions have a 10s limit on hobby plan
  // For now we run synchronously (works on Pro plan with 60s limit)
  // TODO: replace with background queue (Inngest) for production

  try {
    // Step 1: Collect LinkedIn data
    const linkedinOk = runCollector(
      'linkedin.js',
      `--client ${clientSlug} --handle ${competitor.linkedinHandle} --week ${week}`
    );

    // Step 2: Collect Facebook data
    const facebookOk = runCollector(
      'facebook.js',
      `--client ${clientSlug} --pageId ${competitor.facebookPageId} --week ${week}`
    );

    if (!linkedinOk && !facebookOk) {
      await logRequest({ name, email, competitor: competitor.label, week, year, status: 'collection_failed' });
      return res.status(500).json({ error: 'Data collection failed for both sources.' });
    }

    // Step 3: Generate report
    const reportOk = runReportGenerator(clientSlug, week, year);

    if (!reportOk) {
      await logRequest({ name, email, competitor: competitor.label, week, year, status: 'report_failed' });
      return res.status(500).json({ error: 'Report generation failed.' });
    }

    // Step 4: Fetch the HTML
    const html = await fetchReportHtml(clientSlug, week, year);

    if (!html) {
      return res.status(500).json({ error: 'Could not retrieve generated report.' });
    }

    // Step 5: Email it
    const emailOk = await sendReportEmail({
      name,
      email,
      competitor: competitor.label,
      html,
      week,
      year,
    });

    await logRequest({
      name,
      email,
      competitor: competitor.label,
      week,
      year,
      status: emailOk ? 'delivered' : 'email_failed',
    });

    return res.status(200).json({
      success: true,
      message: `Report for ${competitor.label} sent to ${email}`,
      week,
      year,
    });

  } catch (err) {
    console.error('[API] Unhandled error:', err);
    await logRequest({ name, email, competitor: competitor.label, week, year, status: 'error' });
    return res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  }
}
