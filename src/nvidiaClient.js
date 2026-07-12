// IMPORTANT: Never hardcode NVIDIA_API_KEY in source code.
// The key must only come from process.env.NVIDIA_API_KEY.
// If a key was previously hardcoded, rotate it immediately at:
// build.nvidia.com → Settings → API Keys → Revoke & regenerate

// Model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning for all modes
// Supports up to 32 images per call
// meta/llama-3.2-90b-vision-instruct removed — does not support 
// multiple images on NVIDIA NIM (hard 400 rejection)

const OpenAI = require('openai');

const NVIDIA_MODELS = {
  deep: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  fast: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
};

const RETRY_BACKOFFS = [15000, 30000, 60000]; // 15s → 30s → 60s
const MAX_RETRIES = 3;

let openai = null;

function getClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }
  return openai;
}

// ─── Retry wrapper with exponential backoff + jitter ─────────────────────────

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // Bad request (400): throw immediately — not retrying
      if (err.status === 400) {
        throw new Error(
          `[NVIDIA] Bad request (400) — model rejected the payload. ` +
          `Check image count and format. Not retrying.`
        );
      }

      // Quota exhaustion: throw immediately — retrying won't help
      const isQuotaExhausted =
        err.status === 402 ||
        /quota/i.test(err.message) ||
        /limit:\s*0/i.test(err.message);

      if (isQuotaExhausted) {
        const msg = '[NVIDIA] Quota exhausted — rotate key or wait for reset at build.nvidia.com/settings';
        console.error(msg);
        const quotaErr = new Error(msg);
        quotaErr.status = err.status || 402;
        throw quotaErr;
      }

      const isLast = attempt === retries;
      if (isLast) {
        err.message = `${err.message} (after ${retries + 1} attempts)`;
        throw err;
      }

      // Rate limit: use retry-after if available, otherwise backoff schedule
      if (err.status === 429) {
        const retryAfterSec =
          err.headers?.['retry-after'] ??
          err.error?.retryAfter ??
          null;

        let waitMs;
        if (retryAfterSec) {
          waitMs = (parseInt(retryAfterSec, 10) + 2) * 1000;
          console.warn(`[NVIDIA] Rate limited. Retry-After: ${retryAfterSec}s. Backing off ${Math.round(waitMs / 1000)}s...`);
        } else {
          const jitter = (Math.random() - 0.5) * 1000; // ±500ms
          waitMs = RETRY_BACKOFFS[Math.min(attempt, RETRY_BACKOFFS.length - 1)] + jitter;
          console.warn(`[NVIDIA] Rate limited. Backing off ${Math.round(waitMs / 1000)}s...`);
        }
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        // Non-429: shorter backoff with jitter
        const jitter = (Math.random() - 0.5) * 1000;
        const waitMs = RETRY_BACKOFFS[Math.min(attempt, RETRY_BACKOFFS.length - 1)] + jitter;
        console.warn(`[NVIDIA] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${Math.round(waitMs / 1000)}s...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }
}

function normalizeResult(result) {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    if (result.issues) {
      result.issues = (result.issues || []).map(issue => ({
        ...issue,
        confidence: typeof issue.confidence === 'number'
          ? issue.confidence <= 1
            ? Math.round(issue.confidence * 100)  // 0.9 → 90
            : Math.round(issue.confidence)         // 95 → 95 (already integer)
          : 80  // fallback if missing
      }));
    }
  }
  return result;
}

// ─── Core NVIDIA call ────────────────────────────────────────────────────────

async function callNvidia(messages, { mode = 'deep' } = {}) {
  const client = getClient();
  const model = NVIDIA_MODELS[mode] || NVIDIA_MODELS.deep;

  // Count image_url entries in the messages payload
  let imageCount = 0;
  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (msg && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part && part.type === 'image_url') {
            imageCount++;
          }
        }
      }
    }
  }

  return withRetry(async () => {
    console.log(`[NVIDIA] Dispatching request (model: ${model}, mode: ${mode}, images: ${imageCount})...`);

    // Both deep and fast modes now use nemotron-omni with reasoning enabled
    const isDeep = mode === 'deep';
    const params = {
      model,
      messages,
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: isDeep ? 16384 : 8192,
      reasoning_budget: isDeep ? 8192 : 4096,
      chat_template_kwargs: { enable_thinking: true },
      stream: false,
    };

    const completion = await client.chat.completions.create(params);

    const choice = completion.choices[0];
    if (!choice || !choice.message) {
      throw new Error('[NVIDIA] Empty response — no choices returned');
    }

    // Log reasoning trace length for deep mode
    if (mode === 'deep') {
      const reasoning = choice.message.reasoning_content;
      console.log(`[NVIDIA] Reasoning tokens used: ${reasoning?.length ?? 0}`);
    }

    const content = choice.message.content;
    if (!content) {
      throw new Error('[NVIDIA] Empty content in response');
    }

    // Parse JSON from content (strip markdown fences if present)
    try {
      const parsed = JSON.parse(content);
      return normalizeResult(parsed);
    } catch {
      const cleaned = content.replace(/```json|```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        return normalizeResult(parsed);
      } catch {
        // Return raw text if not JSON (for /ask chat responses)
        return content;
      }
    }
  });
}

// ─── Status helper ───────────────────────────────────────────────────────────

function getNvidiaStatus() {
  return {
    available: !!process.env.NVIDIA_API_KEY,
    models: NVIDIA_MODELS,
  };
}

module.exports = { callNvidia, getNvidiaStatus, NVIDIA_MODELS };

