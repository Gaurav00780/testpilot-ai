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
const { analyzeScreenshots } = require('./src/nvidiaAnalyzer');
const { callNvidia, getNvidiaStatus } = require('./src/nvidiaClient');
require('dotenv').config();

// ─── Startup check ───────────────────────────────────────────────────────────
if (!process.env.NVIDIA_API_KEY) {
  console.error('[Startup] NVIDIA_API_KEY is not set — add it to .env');
  process.exit(1);
}

function aiConfigured() {
  return !!process.env.NVIDIA_API_KEY;
}


async function analyzeBrowserDiff(runId, browserResult, baselineBrowser) {
  try {
    if (!aiConfigured()) {
      console.warn('AI Analysis skipped: No valid NVIDIA_API_KEY provided.');
      browserResult.aiSummary = 'AI Analysis unavailable: No valid API key provided.';
      browserResult.aiBrowserNotes = '';
      browserResult.aiIssues = [];
      return;
    }

    const ts = Date.now();
    const screenshotsDir = path.join(__dirname, 'screenshots');

    const currentPath = path.join(screenshotsDir, `${runId}_${browserResult.browser}.png`);
    const diffPath = path.join(screenshotsDir, `${runId}_diff-${browserResult.browser}.png`);

    // Use the first browser's screenshot as baseline for comparison
    const baselinePath = baselineBrowser
      ? path.join(screenshotsDir, `${runId}_${baselineBrowser}.png`)
      : null;

    if (!fs.existsSync(currentPath)) {
      console.warn(`[AI] No screenshot found at ${currentPath}, skipping AI for ${browserResult.browser}`);
      browserResult.aiSummary = 'Screenshot not found; AI analysis skipped.';
      browserResult.aiIssues = [];
      return;
    }

    const hasDiff = fs.existsSync(diffPath);
    const hasBaseline = baselinePath && fs.existsSync(baselinePath);
    console.log(`[AI] Sending NVIDIA request for ${browserResult.browser} | hasBaseline=${hasBaseline} | hasDiff=${hasDiff}`);

    const parsed = await analyzeScreenshots({
      baselinePath: hasBaseline ? baselinePath : null,
      currentPath,
      diffPath: hasDiff ? diffPath : null,
      browser: browserResult.browser,
      ts,
    });

    if (!parsed) {
      throw new Error('NVIDIA returned no analysis result');
    }

    browserResult.aiSummary = parsed.summary || '';
    browserResult.aiBrowserNotes = parsed.browserNotes || '';
    browserResult.aiIssues = parsed.issues || [];
    console.log(`[AI] Analysis complete for ${browserResult.browser}: ${browserResult.aiIssues.length} issues found`);
  } catch (err) {
    console.error('[AI] Analysis failed:', err.message);
    browserResult.aiSummary = `AI Analysis failed: ${err.message}`;
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

const allowedOrigins = [
  'https://testpilot-ai-rose.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
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
      return res.status(401).json({ error: 'User does not exist. Please create an account first.' });
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

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const runId = 'run_' + crypto.randomUUID();
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

    // Global safety net: kill the runner if it takes longer than 3 minutes
    const RUNNER_TIMEOUT_MS = 3 * 60 * 1000;
    const runnerKillTimer = setTimeout(() => {
      if (!child.killed) {
        console.error(`[runner ${runId}] Timed out after ${RUNNER_TIMEOUT_MS / 1000}s — killing process`);
        child.kill('SIGKILL');
      }
    }, RUNNER_TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        console.log(`[runner ${runId}] ${line}`);
        
        // Skip broadcasting memory or runner logs to the frontend
        if (line.includes('[Memory]') || line.includes('[Runner]')) {
          continue;
        }

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
      // Only log stderr — Playwright writes normal info/warnings to stderr
      // Don't broadcast run:error here as it would kill the run prematurely
      console.error(`[runner ${runId} ERR] ${data.toString().trim()}`);
    });

    child.on('close', async (code) => {
      clearTimeout(runnerKillTimer); // clear the safety-net timer
      console.log(`[runner ${runId}] process exited with code ${code}`);

      if (code !== 0) {
        console.error(`[runner ${runId}] Runner failed with exit code ${code}`);
        await supabase.from('runs').update({ status: 'error', verdict: 'fail' }).eq('id', runId);
        broadcast(runId, { event: 'run:error', error: `Screenshot runner failed (exit code ${code}). Check server logs.` });
        return;
      }

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
          const baselineBrowser = activeBrowsers[0]; // first browser serves as baseline
          await Promise.all(
            browserResults.map(async (br) => {
              // Pass the baseline browser so NVIDIA can compare against it
              await analyzeBrowserDiff(runId, br, br.browser === baselineBrowser ? null : baselineBrowser);
              broadcast(runId, {
                event: 'run:ai_issues',
                browser: br.browser,
                issues: br.aiIssues || []
              });
            })
          );
        }

        // Compute real issue counts from AI results
        const allAiIssues = browserResults.flatMap(br => br.aiIssues || []);
        const totalIssues = allAiIssues.length;
        const criticalIssues = allAiIssues.filter(i => i.severity === 'critical').length;

        const verdict = (maxMismatch > 5 || criticalIssues > 0) ? 'fail' : totalIssues > 0 ? 'needs_review' : 'pass';
        const runDuration = Date.now() - startTime;
        const summary = { totalIssues, criticalIssues };

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

        broadcast(runId, { event: 'run:completed' });

      } catch (err) {
        console.error('Diffing or database saving failed:', err);
        await supabase
          .from('runs')
          .update({
            status: 'error',
            verdict: 'fail'
          })
          .eq('id', runId);
        broadcast(runId, { event: 'run:error', error: err.message });
      }
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

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let query = supabase
      .from('runs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

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
    const userId = getUserId(req);
    if (!userId) {
      res.write(`data: ${JSON.stringify({ error: 'Unauthorized' })}\n\n`);
      return res.end();
    }

    // Verify run ownership
    const { data: runCheck, error: runCheckErr } = await supabase
      .from('runs')
      .select('user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (runCheckErr || !runCheck) {
      res.write(`data: ${JSON.stringify({ error: 'Run not found or unauthorized' })}\n\n`);
      return res.end();
    }

    if (!aiConfigured()) {
      res.write(`data: ${JSON.stringify({ chunk: 'AI is not configured. Set NVIDIA_API_KEY in .env' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    // Tell client we're working
    res.write(`data: ${JSON.stringify({ thinking: true, message: 'Analyzing with NVIDIA NIM...', model: 'llama-3.2-90b' })}\n\n`);

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

    // Build OpenAI-format messages for NVIDIA
    const messages = [
      { role: 'system', content: 'You are a helpful UI testing assistant. Answer concisely.' },
      {
        role: 'user',
        content: `${context}\n\nUser Question: ${question}`.trim()
      }
    ];

    // Use fast mode for chat Q&A (no vision needed)
    const result = await callNvidia(messages, { mode: 'fast' });

    // Send the response as a single chunk (compatible with existing frontend)
    const responseText = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    res.write(`data: ${JSON.stringify({ chunk: responseText })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Ask AI error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// --- NVIDIA status endpoint (for debugging) ---
app.get('/api/v1/status', (req, res) => {
  res.json(getNvidiaStatus());
});

app.get('/api/v1/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
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
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify ownership
    const { data: runCheck, error: runCheckErr } = await supabase
      .from('runs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (runCheckErr) throw runCheckErr;
    if (!runCheck) return res.status(404).json({ error: 'Run not found or unauthorized' });

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
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: baselines, error } = await supabase
      .from('baselines')
      .select('*, runs!inner(user_id)')
      .eq('runs.user_id', userId)
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
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Verify run ownership
    const { data: runCheck, error: runCheckErr } = await supabase
      .from('runs')
      .select('user_id')
      .eq('id', runId)
      .eq('user_id', userId)
      .maybeSingle();

    if (runCheckErr) throw runCheckErr;
    if (!runCheck) return res.status(403).json({ error: 'Unauthorized run reference' });

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

    const newKey = `tp_live_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`;

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
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { count: totalIssues, error: countErr } = await supabase
      .from('ai_issues')
      .select('*, runs!inner(user_id)', { count: 'exact', head: true })
      .eq('runs.user_id', userId);

    if (countErr) throw countErr;

    const { count: criticalIssues, error: critErr } = await supabase
      .from('ai_issues')
      .select('*, runs!inner(user_id)', { count: 'exact', head: true })
      .eq('runs.user_id', userId)
      .eq('severity', 'critical');

    if (critErr) throw critErr;

    const { data: confData, error: confErr } = await supabase
      .from('ai_issues')
      .select('confidence, runs!inner(user_id)')
      .eq('runs.user_id', userId);

    if (confErr) throw confErr;

    const totalConf = (confData || []).reduce((acc, row) => acc + (row.confidence || 0), 0);
    const avgConfidence = confData && confData.length ? Math.round(totalConf / confData.length) : 0;

    const { count: baselineCount, error: baseErr } = await supabase
      .from('baselines')
      .select('*, runs!inner(user_id)', { count: 'exact', head: true })
      .eq('runs.user_id', userId);

    if (baseErr) throw baseErr;
    const suggestionsApplied = (baselineCount || 0) * 3;

    const { data: issues, error: issuesErr } = await supabase
      .from('ai_issues')
      .select('category, runs!inner(user_id)')
      .eq('runs.user_id', userId);

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
      .select('*, runs!inner(user_id)')
      .eq('runs.user_id', userId)
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
      .eq('user_id', userId)
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
        .select('*, runs!inner(user_id)', { count: 'exact', head: true })
        .eq('runs.user_id', userId)
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
