const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const { callNvidia } = require("./nvidiaClient");

// ─── Prompts (refined system prompt for visual regression QA) ────────────────

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

## Output rules
- Output ONLY valid JSON matching the schema. No markdown fences, no preamble, no trailing commentary.
- If you find no genuine regression, return an empty "issues" array. Never invent issues to avoid an empty result.
- Each issue must reflect a distinct root cause.
- "suggestedFix" must be a concrete, valid CSS snippet.
- Ground every issue in something visible in the diff overlay.`;

function buildUserPrompt(ts, browser) {
  return `Analyze the attached baseline, current, and diff screenshots for browser: "${browser}".

Return JSON matching exactly this structure:
{
  "summary": "1–2 sentence overview of what changed visually",
  "browserNotes": "${browser}-specific rendering notes, or empty string",
  "overallStatus": "pass | needs_review | fail",
  "issues": [
    {
      "id": "issue_${ts}_1",
      "browser": "${browser}",
      "title": "Short specific title",
      "severity": "critical | high | medium | low",
      "category": "layout | typography | color | spacing | responsive | content | overflow | interaction | other",
      "location": "Where on the page, e.g. 'header nav', 'hero CTA button'",
      "rootCause": "What changed and likely cause",
      "suggestedFix": "Concrete CSS snippet",
      "affectedProperty": "CSS property most responsible",
      "confidence": "integer from 0 to 100 (NOT a decimal — 90 not 0.9)"
    }
  ]
}

Rules:
- Increment id suffix per issue: issue_${ts}_1, issue_${ts}_2, ...
- "issues": [] if nothing genuine found.
- "overallStatus": "fail" if any critical; "needs_review" if any high/medium; "pass" otherwise.`;
}

// ─── Image helper ─────────────────────────────────────────────────────────────

function imageToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

// ─── Core analyzer ───────────────────────────────────────────────────────────

async function analyzeScreenshots({
  baselinePath,
  currentPath,
  diffPath,
  browser = "chrome",
  ts = Date.now(),
}) {
  // ─── Image readiness guard ─────────────────────────────────────────────────
  // Don't waste API quota on requests with missing images
  const currentExists = currentPath && fs.existsSync(currentPath);
  const baselineExists = baselinePath && fs.existsSync(baselinePath);
  const diffExists = diffPath && fs.existsSync(diffPath);

  if (!currentExists) {
    console.warn(`[NvidiaAnalyzer] Skipped ${browser} — currentPath missing or not on disk: ${currentPath}`);
    return { summary: "Skipped — images not ready", overallStatus: "skipped", issues: [] };
  }

  if (baselinePath && !baselineExists) {
    console.warn(`[NvidiaAnalyzer] Skipped ${browser} — baselinePath missing or not on disk: ${baselinePath}`);
    return { summary: "Skipped — images not ready", overallStatus: "skipped", issues: [] };
  }

  if (diffPath && !diffExists) {
    console.warn(`[NvidiaAnalyzer] Skipped ${browser} — diffPath missing or not on disk: ${diffPath}`);
    return { summary: "Skipped — images not ready", overallStatus: "skipped", issues: [] };
  }

  // ─── Build image content array for OpenAI format ───────────────────────────
  const imageContent = [];

  if (baselineExists) {
    imageContent.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${imageToBase64(baselinePath)}` },
    });
  }

  if (currentExists) {
    imageContent.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${imageToBase64(currentPath)}` },
    });
  }

  if (diffExists) {
    imageContent.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${imageToBase64(diffPath)}` },
    });
  }

  // ─── Build OpenAI-format messages ──────────────────────────────────────────
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: buildUserPrompt(ts, browser) },
        ...imageContent,
      ],
    },
  ];

  // Select mode based on browser
  const mode = browser === "chromium" ? "deep" : "fast";

  console.log(`[NvidiaAnalyzer] Queuing analysis for ${browser} (${imageContent.length} images, mode: ${mode})...`);
  const result = await callNvidia(messages, { mode });

  if (!result) {
    throw new Error("NVIDIA returned no analysis result");
  }

  return result;
}

module.exports = { analyzeScreenshots };
