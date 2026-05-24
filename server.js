const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { compareImages } = require('./services/diffEngine');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '');

async function analyzeBrowserDiff(runId, browserResult) {
  try {
    if (!genAI.apiKey || genAI.apiKey === 'your_key_here') {
      console.warn('AI Analysis skipped: No valid API key provided.');
      browserResult.aiSummary = 'AI Analysis unavailable: No valid API key provided.';
      browserResult.aiBrowserNotes = '';
      browserResult.aiIssues = [];
      return;
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze this browser screenshot and the visual diff, then return a JSON list of UI issues.
Return EXACTLY this JSON structure, no markdown wrapping:
{
  "summary": "Short summary of visual issues",
  "browserNotes": "Browser specific notes",
  "issues": [
    {
      "id": "issue_${Date.now()}",
      "browser": "${browserResult.browser}",
      "title": "Short title",
      "severity": "critical",
      "category": "layout",
      "rootCause": "Explanation",
      "suggestedFix": "CSS snippet",
      "affectedProperty": "css property",
      "confidence": 95
    }
  ]
}`;
    
    const imagePath = path.join(__dirname, 'screenshots', 'screenshots', `${browserResult.browser}.png`);
    const parts = [{ text: prompt }];
    
    if (fs.existsSync(imagePath)) {
      parts.push({
        inlineData: {
          data: fs.readFileSync(imagePath).toString("base64"),
          mimeType: "image/png"
        }
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    
    // Extract JSON from markdown block if present
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = match ? match[1].trim() : text.trim();
    
    const parsed = JSON.parse(jsonStr);

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

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());
// Serve the screenshots directory publicly
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots', 'screenshots')));

// In-memory db
const runs = [];
const clients = new Map(); // ws -> runId

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.runId) {
        clients.set(ws, data.runId);
        const run = runs.find((r) => r.id === data.runId);
        if (run && run.status === 'running') {
            ws.send(JSON.stringify({ event: 'run:started' }));
        } else if (run && run.status === 'completed') {
            ws.send(JSON.stringify({ event: 'run:completed' }));
        }
      }
    } catch (err) {
      console.error(err);
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

app.post('/api/v1/runs', (req, res) => {
  const { url, browsers } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const runId = uuidv4();
  const run = {
    id: runId,
    url,
    browsers: browsers || ['chromium'],
    aiAnalysis: req.body.aiAnalysis === true,
    status: 'running',
    verdict: 'pending',
    createdAt: new Date().toISOString(),
    summary: { totalIssues: 0, criticalIssues: 0 },
    browserResults: []
  };
  runs.unshift(run);

  res.json(run);

  // Start the background process
  const runnerScript = path.join(__dirname, 'screenshots', 'runner.js');
  const child = spawn('node', [runnerScript, url]);

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      console.log(`[runner ${runId}] ${line}`);
      
      let browser = undefined;
      const browserMatch = line.match(/Running on (chromium|firefox|webkit)/i) || line.match(/Running mobile on (chromium|firefox|webkit)/i);
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
      // Run diff between chromium and firefox as an example test flow
      const img1Path = path.join(__dirname, 'screenshots', 'screenshots', 'chromium.png');
      const img2Path = path.join(__dirname, 'screenshots', 'screenshots', 'firefox.png');
      const diffFilename = `diff-${runId}.png`;
      const diffOutPath = path.join(__dirname, 'screenshots', 'screenshots', diffFilename);

      const diffResult = await compareImages(img1Path, img2Path, diffOutPath);

      run.browserResults = [
        {
          browser: 'chromium',
          screenshotUrl: 'http://localhost:3001/screenshots/chromium.png',
          diffUrl: null,
          mismatchPercent: 0
        },
        {
          browser: 'firefox',
          screenshotUrl: 'http://localhost:3001/screenshots/firefox.png',
          diffUrl: `http://localhost:3001/screenshots/${diffFilename}`,
          mismatchPercent: diffResult.percentage
        }
      ];

      if (run.aiAnalysis) {
        broadcast(runId, { event: 'run:progress', stage: 'ai analysis', message: 'Analyzing differences with AI...' });
        for (const br of run.browserResults) {
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

      run.status = 'completed';
      run.verdict = diffResult.percentage > 5 ? 'fail' : 'pass';
      run.duration = Date.now() - new Date(run.createdAt).getTime();
      run.summary.totalIssues = diffResult.percentage > 5 ? 1 : 0;
      run.summary.criticalIssues = diffResult.percentage > 10 ? 1 : 0;
      
    } catch (err) {
      console.error('Diffing failed', err);
      run.status = 'error';
      run.verdict = 'fail';
    }

    broadcast(runId, { event: 'run:completed' });
  });

  // Notify listeners that it started
  setTimeout(() => broadcast(runId, { event: 'run:started' }), 500);
});

app.get('/api/v1/runs', (req, res) => {
  res.json({
    runs: runs,
    total: runs.length
  });
});

app.post('/api/v1/runs/:id/ask', async (req, res) => {
  const { id } = req.params;
  const { question, issueId } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const run = runs.find(r => r.id === id);
    let context = '';
    if (run) {
      if (issueId) {
        const issue = run.browserResults.flatMap(br => br.aiIssues || []).find(i => i.id === issueId);
        if (issue) context = `Context about the issue: ${JSON.stringify(issue)}`;
      } else {
        context = `Context about the run: ${JSON.stringify(run.summary)}`;
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${context}\n\nUser Question: ${question}`;

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Ask AI error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.get('/api/v1/runs/:id', (req, res) => {
  const run = runs.find(r => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
