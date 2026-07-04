const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { compareImages } = require('./services/diffEngine');
const supabase = require('./services/supabaseClient');
require('dotenv').config();

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OR_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

function orHeaders() {
  return {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'TestPilot AI',
  };
}

function aiConfigured() {
  return !!(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.startsWith('your_'));
}

const SYSTEM_PROMPT = `You are a senior front-end QA engineer specializing in cross-browser visual regression testing. You compare a baseline screenshot, a current screenshot, and a pixel-diff overlay to find genuine visual regressions — not rendering noise.

## Report as issues
- Layout shifts, broken alignment, overlapping or clipped elements, unintended wrapping/overflow
- Missing, misplaced, resized, or distorted images/icons/buttons
- Color, contrast, or typography inconsistent with the rest of the page
- Spacing/padding/margin deviations large enough to be visually obvious
- Responsive breakage: elements squished, clipped, or overflowing the viewport
- Z-index/stacking problems, broken hover/focus/active states visible in the screenshot

## Do NOT report
- Anti-aliasing, sub-pixel font rendering, or image compression artifacts
- Differences confined to dynamic content: timestamps, ads, carousels, randomized data, cursor position, video frames, animation mid-frame
- Differences under ~2px with no visible impact
- Scrollbar/OS-chrome differences unrelated to the page itself

## Severity rubric
- "critical": page broken or unusable (content missing, layout collapsed, blocking overlap)
- "high": clearly visible defect an end user would flag as broken
- "medium": noticeable inconsistency; page still usable
- "low": minor cosmetic deviation

## Category (use exactly one)
"layout" | "typography" | "color" | "spacing" | "responsive" | "content" | "overflow" | "interaction" | "other"

## Confidence
Integer 0–100. Base this on diff magnitude and visual clarity, not on how interesting the issue sounds.

## Output rules
- Output ONLY valid JSON matching the schema you're given. No markdown fences, no preamble, no trailing commentary.
- If you find no genuine regression, return an empty "issues" array. Never invent issues to avoid an empty result.
- Each issue must reflect a distinct root cause — don't split one defect into several entries.
- "suggestedFix" must be a concrete, valid CSS snippet (or a one-line note if CSS alone can't fix it).
- Never name a selector, class, or property you can't actually see evidence for in the screenshot.
- Ground every issue in something visible in the diff overlay — don't infer changes the overlay doesn't show.`;

function buildUserPrompt(ts, browserResult) {
  return `Analyze the attached baseline screenshot, current screenshot, and diff overlay for the "${browserResult.browser}" browser.

Return JSON matching exactly this structure:

{
  "summary": "1-2 sentence overview of what changed visually",
  "browserNotes": "${browserResult.browser}-specific rendering caveats relevant here (e.g. flexbox gap support, font fallback), or empty string if none apply",
  "overallStatus": "pass" | "needs_review" | "fail",
  "issues": [
    {
      "id": "issue_${ts}_1",
      "browser": "${browserResult.browser}",
      "title": "Short, specific title",
      "severity": "critical" | "high" | "medium" | "low",
      "category": "layout" | "typography" | "color" | "spacing" | "responsive" | "content" | "overflow" | "interaction" | "other",
      "location": "Where on the page, e.g. 'header nav', 'hero CTA button'",
      "rootCause": "What changed and the likely cause",
      "suggestedFix": "Concrete CSS snippet or fix instruction",
      "affectedProperty": "CSS property most responsible",
      "confidence": 0-100
    }
  ]
}

Rules:
- Increment the numeric suffix per issue: issue_${ts}_1, issue_${ts}_2, ...
- "issues": [] if nothing genuine is found.
- "overallStatus": "fail" if any issue is "critical"; "needs_review" if any "high"/"medium"; "pass" otherwise.`;
}

function tryParseAiJson(text) {
  // Strip markdown fences if the model wrapped the output
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

function loadImageAsDataUrl(filePath) {
  if (fs.existsSync(filePath)) {
    return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
  }
  return null;
}

async function analyzeBrowserDiff(runId, browserResult) {
  try {
    if (!aiConfigured()) {
      console.warn('AI Analysis skipped: No valid OpenRouter API key provided.');
      browserResult.aiSummary = 'AI Analysis unavailable: No valid API key provided.';
      browserResult.aiBrowserNotes = '';
      browserResult.aiIssues = [];
      return;
    }

    const ts = Date.now();
    const screenshotsDir = path.join(__dirname, 'screenshots');
    const userContent = [{ type: 'text', text: buildUserPrompt(ts, browserResult) }];

    // Attach baseline, current, and diff images when available
    // Previous browser acts as baseline for diffs in this simplified logic
    const currentPath = path.join(screenshotsDir, `${runId}_${browserResult.browser}.png`);
    const diffPath = path.join(screenshotsDir, `${runId}_diff-${browserResult.browser}.png`);
    const baselinePath = path.join(screenshotsDir, `${runId}_${browserResult.browser}_baseline.png`); // Unused mostly

    for (const imgPath of [baselinePath, currentPath, diffPath]) {
      const dataUrl = loadImageAsDataUrl(imgPath);
      if (dataUrl) {
        userContent.push({
          type: 'image_url',
          image_url: { url: dataUrl }
        });
      }
    }

    const requestBody = {
      model: OR_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' }
    };

    // First attempt
    let parsed;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: orHeaders(),
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      try {
        parsed = tryParseAiJson(text);
        break; // success
      } catch (parseErr) {
        console.warn(`AI JSON parse failed (attempt ${attempt}/${maxAttempts}):`, parseErr.message);
        if (attempt === maxAttempts) throw parseErr;
        // retry on next iteration
      }
    }

    browserResult.aiSummary = parsed.summary || '';
    browserResult.aiBrowserNotes = parsed.browserNotes || '';
    browserResult.aiIssues = parsed.issues || [];
  } catch (err) {
    console.error("AI Analysis failed:", err);
    browserResult.aiSummary = 'AI Analysis failed due to an error.';
    browserResult.aiBrowserNotes = '';
    browserResult.aiIssues = [];
  }
}

let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === 'test-screenshots')) {
    await supabase.storage.createBucket('test-screenshots', { public: true });
  }
  bucketEnsured = true;
}

async function uploadToSupabase(runId, filename, filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from('test-screenshots').upload(`${runId}/${filename}`, fileBuffer, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) {
    console.error('Supabase upload error:', error);
    return null;
  }
  const { data: publicData } = supabase.storage.from('test-screenshots').getPublicUrl(`${runId}/${filename}`);
  return publicData.publicUrl;
}

// Helpers for mappings
function mapRunToFrontend(run) {
  if (!run) return null;
  return {
    id: run.id,
    url: run.url,
    browsers: run.browsers,
    aiAnalysis: run.ai_analysis,
    status: run.status,
    verdict: run.verdict,
    createdAt: run.created_at,
    duration: run.duration,
    summary: run.summary,
    userId: run.user_id,
    browserResults: run.browserResults || []
  };
}

function getUserId(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer dev-token-')) {
    return auth.substring('Bearer dev-token-'.length);
  }
  return null;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());
// Serve the screenshots directory publicly
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

const clients = new Map(); // ws -> runId

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.runId) {
        clients.set(ws, data.runId);
        
        // Fetch run status from Supabase
        const { data: run, error } = await supabase
          .from('runs')
          .select('status')
          .eq('id', data.runId)
          .maybeSingle();

        if (run && run.status === 'running') {
            ws.send(JSON.stringify({ event: 'run:started' }));
        } else if (run && run.status === 'completed') {
            ws.send(JSON.stringify({ event: 'run:completed' }));
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(runId, messageObj) {
  for (const [ws, subscribedRunId] of clients.entries()) {
    if (subscribedRunId === runId && ws.readyState === 1) {
      ws.send(JSON.stringify(messageObj));
    }
  }
}

// --- Auth endpoints ---
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;
    if (existingUser) return res.status(409).json({ error: 'User already exists' });

    const newUser = {
      email,
      name: name || email.split('@')[0]
    };

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ token: `dev-token-${user.id}`, user });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;

    if (!user) {
      const newUser = {
        email,
        name: email.split('@')[0]
      };
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = insertedUser;
    }

    res.json({ token: `dev-token-${user.id}`, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/runs', async (req, res) => {
  try {
    const { url, browsers } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const runId = 'run_' + crypto.randomUUID();
    const userId = getUserId(req);
    const aiAnalysis = req.body.aiAnalysis === true;
    const activeBrowsers = browsers || ['chromium'];

    const run = {
      id: runId,
      url,
      browsers: activeBrowsers,
      ai_analysis: aiAnalysis,
      status: 'running',
      verdict: 'pending',
      summary: { totalIssues: 0, criticalIssues: 0 },
      user_id: userId
    };

    const { data: insertedRun, error: insertError } = await supabase
      .from('runs')
      .insert(run)
      .select()
      .single();

    if (insertError) throw insertError;

    res.json(mapRunToFrontend(insertedRun));

    // Start background process
    const startTime = Date.now();
    const runnerScript = path.join(__dirname, 'screenshots', 'runner.js');
    const child = spawn('node', [runnerScript, url, activeBrowsers.join(','), runId]);

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        console.log(`[runner ${runId}] ${line}`);
        
        let browser = undefined;
        const browserMatch = line.match(/Running on (chromium|firefox|webkit|mobile-chrome)/i) || line.match(/Running mobile on (chromium|firefox|webkit|mobile-chrome)/i);
        if (browserMatch) {
            browser = browserMatch[1].toLowerCase();
        }
        
        broadcast(runId, {
          event: 'run:progress',
          stage: 'running',
          message: line,
          browser: browser
        });
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`[runner ${runId} ERR] ${data}`);
      broadcast(runId, {
        event: 'run:error',
        error: data.toString()
      });
    });

    child.on('close', async (code) => {
      console.log(`[runner ${runId}] process exited with code ${code}`);
      broadcast(runId, { event: 'run:progress', stage: 'diffing', message: 'Comparing images...' });

      try {
        const browserResults = [];
        let maxMismatch = 0;

        await ensureBucket();

        for (const browser of activeBrowsers) {
          browserResults.push({
            browser,
            screenshotUrl: null,
            diffUrl: null,
            mismatchPercent: 0,
            aiSummary: '',
            aiBrowserNotes: '',
            aiIssues: []
          });
        }

        // Compare each pair of browsers for visual diffs
        for (let i = 1; i < activeBrowsers.length; i++) {
          const prev = activeBrowsers[i - 1];
          const curr = activeBrowsers[i];
          const img1Path = path.join(__dirname, 'screenshots', `${runId}_${prev}.png`);
          const img2Path = path.join(__dirname, 'screenshots', `${runId}_${curr}.png`);
          const diffFilename = `${runId}_diff-${curr}.png`;
          const diffOutPath = path.join(__dirname, 'screenshots', diffFilename);

          if (!fs.existsSync(img1Path) || !fs.existsSync(img2Path)) continue;

          const diffResult = await compareImages(img1Path, img2Path, diffOutPath);
          maxMismatch = Math.max(maxMismatch, diffResult.percentage);

          const result = browserResults.find(r => r.browser === curr);
          if (result) {
            result.mismatchPercent = diffResult.percentage;
            result.localDiffPath = diffOutPath;
          }
        }
        
        // Upload images to Supabase
        for (const br of browserResults) {
          const imgPath = path.join(__dirname, 'screenshots', `${runId}_${br.browser}.png`);
          br.screenshotUrl = await uploadToSupabase(runId, `${br.browser}.png`, imgPath) 
            || `/screenshots/${runId}_${br.browser}.png`;
          
          if (br.localDiffPath) {
            br.diffUrl = await uploadToSupabase(runId, `diff-${br.browser}.png`, br.localDiffPath)
              || `/screenshots/${runId}_diff-${br.browser}.png`;
          }
        }

        if (aiAnalysis) {
          broadcast(runId, { event: 'run:progress', stage: 'ai analysis', message: 'Analyzing differences with AI...' });
          for (const br of browserResults) {
            if (br.mismatchPercent > 0) {
              await analyzeBrowserDiff(runId, br);
              broadcast(runId, {
                event: 'run:ai_issues',
                browser: br.browser,
                issues: br.aiIssues || []
              });
            }
          }
        }

        const verdict = maxMismatch > 5 ? 'fail' : 'pass';
        const runDuration = Date.now() - startTime;
        const summary = {
          totalIssues: maxMismatch > 5 ? 1 : 0,
          criticalIssues: maxMismatch > 10 ? 1 : 0
        };

        // 1. Insert browser results to DB
        for (const br of browserResults) {
          const { data: dbResult, error: brError } = await supabase
            .from('browser_results')
            .insert({
              run_id: runId,
              browser: br.browser,
              screenshot_url: br.screenshotUrl,
              diff_url: br.diffUrl,
              mismatch_percent: br.mismatchPercent,
              ai_summary: br.aiSummary,
              ai_browser_notes: br.aiBrowserNotes
            })
            .select()
            .single();

          if (brError) throw brError;

          // 2. Insert AI issues if any
          if (br.aiIssues && br.aiIssues.length > 0) {
            const dbIssues = br.aiIssues.map(issue => ({
              id: issue.id,
              browser_result_id: dbResult.id,
              run_id: runId,
              browser: br.browser,
              title: issue.title,
              severity: issue.severity,
              category: issue.category,
              root_cause: issue.rootCause,
              suggested_fix: issue.suggestedFix,
              affected_property: issue.affectedProperty,
              confidence: issue.confidence
            }));

            const { error: issuesError } = await supabase
              .from('ai_issues')
              .insert(dbIssues);

            if (issuesError) throw issuesError;
          }
        }

        // 3. Auto-promote to baseline if passing
        if (verdict === 'pass') {
          await supabase
            .from('baselines')
            .insert({
              run_id: runId,
              url: url,
              branch: 'main'
            });
        }

        // 4. Update the run
        const { error: updateError } = await supabase
          .from('runs')
          .update({
            status: 'completed',
            verdict,
            duration: runDuration,
            summary
          })
          .eq('id', runId);

        if (updateError) throw updateError;

      } catch (err) {
        console.error('Diffing or database saving failed:', err);
        await supabase
          .from('runs')
          .update({
            status: 'error',
            verdict: 'fail'
          })
          .eq('id', runId);
      }

      broadcast(runId, { event: 'run:completed' });
    });

    // Notify listeners that it started
    setTimeout(() => broadcast(runId, { event: 'run:started' }), 500);

  } catch (err) {
    console.error('Create run failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/runs', async (req, res) => {
  try {
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const start = (p - 1) * l;

    let query = supabase
      .from('runs')
      .select('*', { count: 'exact' });

    if (filter === 'passed') query = query.eq('verdict', 'pass');
    else if (filter === 'failed') query = query.eq('verdict', 'fail');
    else if (filter === 'running') query = query.eq('status', 'running');

    const { data: dbRuns, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, start + l - 1);

    if (error) throw error;

    const frontendRuns = dbRuns.map(mapRunToFrontend);

    res.json({ runs: frontendRuns, total: count || 0, page: p, limit: l });
  } catch (err) {
    console.error('Fetch runs failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/runs/:id/ask', async (req, res) => {
  const { id } = req.params;
  const { question, issueId } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (!aiConfigured()) {
      res.write(`data: ${JSON.stringify({ chunk: 'AI is not configured. Set OPENROUTER_API_KEY in .env' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    let context = '';
    if (issueId) {
      const { data: issue, error: issueErr } = await supabase
        .from('ai_issues')
        .select('*')
        .eq('id', issueId)
        .maybeSingle();
      
      if (issueErr) throw issueErr;
      if (issue) {
        context = `Context about the issue: ${JSON.stringify({
          id: issue.id,
          browser: issue.browser,
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
          rootCause: issue.root_cause,
          suggestedFix: issue.suggested_fix,
          affectedProperty: issue.affected_property,
          confidence: issue.confidence
        })}`;
      }
    } else {
      const { data: run, error: runErr } = await supabase
        .from('runs')
        .select('summary')
        .eq('id', id)
        .maybeSingle();

      if (runErr) throw runErr;
      if (run) {
        context = `Context about the run: ${JSON.stringify(run.summary)}`;
      }
    }

    const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(),
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful UI testing assistant. Answer concisely.' },
          { role: 'user', content: `${context}\n\nUser Question: ${question}`.trim() }
        ],
        stream: true
      })
    });

    if (!orRes.ok) {
      const errBody = await orRes.text();
      console.error('OpenRouter API error:', orRes.status, errBody);
      res.write(`data: ${JSON.stringify({ error: `OpenRouter API error: ${orRes.status}` })}\n\n`);
      return res.end();
    }

    const reader = orRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed.choices?.[0]?.delta?.content || '';
          if (chunk) res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        } catch { /* skip malformed */ }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Ask AI error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.get('/api/v1/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (runError) throw runError;
    if (!run) return res.status(404).json({ error: 'Run not found' });

    const { data: dbResults, error: resultsError } = await supabase
      .from('browser_results')
      .select('*')
      .eq('run_id', id);

    if (resultsError) throw resultsError;

    const { data: dbIssues, error: issuesError } = await supabase
      .from('ai_issues')
      .select('*')
      .eq('run_id', id);

    if (issuesError) throw issuesError;

    const browserResults = (dbResults || []).map(br => {
      const issues = (dbIssues || [])
        .filter(issue => issue.browser_result_id === br.id)
        .map(issue => ({
          id: issue.id,
          browser: issue.browser,
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
          rootCause: issue.root_cause,
          suggestedFix: issue.suggested_fix,
          affectedProperty: issue.affected_property,
          confidence: issue.confidence
        }));

      return {
        browser: br.browser,
        screenshotUrl: br.screenshot_url,
        diffUrl: br.diff_url,
        mismatchPercent: parseFloat(br.mismatch_percent),
        aiSummary: br.ai_summary || '',
        aiBrowserNotes: br.ai_browser_notes || '',
        aiIssues: issues
      };
    });

    const responseRun = mapRunToFrontend(run);
    responseRun.browserResults = browserResults;

    res.json(responseRun);
  } catch (err) {
    console.error('Fetch run details failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete run failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Baselines endpoints ---
app.get('/api/v1/baselines', async (req, res) => {
  try {
    const { data: baselines, error } = await supabase
      .from('baselines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedBaselines = (baselines || []).map(b => ({
      id: b.id,
      runId: b.run_id,
      url: b.url,
      branch: b.branch,
      createdAt: b.created_at
    }));

    res.json(formattedBaselines);
  } catch (err) {
    console.error('Fetch baselines failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/baselines', async (req, res) => {
  try {
    const { runId, url, branch } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const { data: baseline, error } = await supabase
      .from('baselines')
      .insert({
        run_id: runId,
        url,
        branch: branch || 'main'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: baseline.id,
      runId: baseline.run_id,
      url: baseline.url,
      branch: baseline.branch,
      createdAt: baseline.created_at
    });
  } catch (err) {
    console.error('Create baseline failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Settings & Insights endpoints ---

app.get('/api/v1/settings/api-keys', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (keys || []).map(k => ({
      id: k.id,
      name: k.name,
      key: k.key,
      created: new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: k.last_used ? new Date(k.last_used).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never',
      status: k.status
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch API keys failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/settings/api-keys', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newKey = `tp_live_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key: newKey,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: keyRecord.id,
      name: keyRecord.name,
      key: keyRecord.key,
      created: new Date(keyRecord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      status: keyRecord.status
    });
  } catch (err) {
    console.error('Create API key failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/settings/api-keys/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Delete API key failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/v1/settings/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { data: user, error } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(user);
  } catch (err) {
    console.error('Update profile failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/settings/team', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const team = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'Developer',
      avatar: (u.name || u.email).substring(0, 1).toUpperCase()
    }));

    res.json(team);
  } catch (err) {
    console.error('Fetch team failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/insights', async (req, res) => {
  try {
    const { count: totalIssues, error: countErr } = await supabase
      .from('ai_issues')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;

    const { count: criticalIssues, error: critErr } = await supabase
      .from('ai_issues')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical');

    if (critErr) throw critErr;

    const { data: confData, error: confErr } = await supabase
      .from('ai_issues')
      .select('confidence');

    if (confErr) throw confErr;

    const totalConf = (confData || []).reduce((acc, row) => acc + (row.confidence || 0), 0);
    const avgConfidence = confData && confData.length ? Math.round(totalConf / confData.length) : 0;

    const { count: baselineCount, error: baseErr } = await supabase
      .from('baselines')
      .select('*', { count: 'exact', head: true });

    if (baseErr) throw baseErr;
    const suggestionsApplied = (baselineCount || 0) * 3;

    const { data: issues, error: issuesErr } = await supabase
      .from('ai_issues')
      .select('category');

    if (issuesErr) throw issuesErr;

    const categoryCounts = {};
    (issues || []).forEach(iss => {
      const cat = iss.category || 'Other';
      const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      categoryCounts[formattedCat] = (categoryCounts[formattedCat] || 0) + 1;
    });

    const totalCategoriesCount = (issues || []).length;
    const colors = ['bg-accent2', 'bg-violet-500', 'bg-blue-500', 'bg-pink-500', 'bg-amber', 'bg-red', 'bg-cyan-500', 'bg-muted-foreground'];
    const categories = Object.keys(categoryCounts).map((catName, idx) => {
      const count = categoryCounts[catName];
      const pct = totalCategoriesCount ? Math.round((count / totalCategoriesCount) * 100) : 0;
      return {
        name: catName,
        count,
        pct,
        color: colors[idx % colors.length]
      };
    }).sort((a, b) => b.count - a.count);

    const { data: topIssuesDb, error: topErr } = await supabase
      .from('ai_issues')
      .select('*')
      .order('confidence', { ascending: false })
      .limit(6);

    if (topErr) throw topErr;

    const topIssues = (topIssuesDb || []).map(iss => ({
      id: iss.id,
      title: iss.title,
      severity: iss.severity,
      confidence: iss.confidence,
      browser: iss.browser,
      url: '/',
      date: new Date(iss.created_at).toLocaleDateString('en-US')
    }));

    const { data: recentAnalysesDb, error: recErr } = await supabase
      .from('runs')
      .select('*')
      .eq('ai_analysis', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recErr) throw recErr;

    const recentAnalyses = (recentAnalysesDb || []).map(r => ({
      id: r.id,
      url: r.url,
      browser: r.browsers[0] || 'chromium',
      verdict: r.verdict,
      issues: r.summary?.totalIssues || 0,
      time: new Date(r.created_at).toLocaleDateString('en-US')
    }));

    const trendWeekly = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateString = d.toISOString().split('T')[0];

      const { count: issueDayCount, error: trendErr } = await supabase
        .from('ai_issues')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${dateString}T00:00:00Z`)
        .lte('created_at', `${dateString}T23:59:59Z`);

      if (trendErr) throw trendErr;

      trendWeekly.push({
        day: dayName,
        issues: issueDayCount || 0
      });
    }

    res.json({
      metrics: {
        issuesAnalyzed: totalIssues || 0,
        criticalIssues: criticalIssues || 0,
        avgConfidence: `${avgConfidence}%`,
        suggestionsApplied
      },
      categories,
      topIssues,
      recentAnalyses,
      trendWeekly
    });
  } catch (err) {
    console.error('Fetch insights failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${PORT}`);
});
