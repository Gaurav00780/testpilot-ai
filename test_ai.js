require('dotenv').config();
const key = process.env.OPENROUTER_API_KEY;

const SYSTEM_PROMPT = `You are a senior front-end QA engineer specializing in cross-browser visual regression testing.
Output ONLY valid JSON. No markdown, no preamble, no trailing text.`;

const userPrompt = `Return JSON matching exactly this structure (populate all fields with plausible sample values):

{
  "summary": "1-2 sentence overview of what changed visually",
  "browserNotes": "browser-specific rendering caveats or empty string",
  "overallStatus": "needs_review",
  "issues": [
    {
      "id": "issue_1234_1",
      "browser": "chromium",
      "title": "Short specific title",
      "severity": "medium",
      "category": "layout",
      "location": "header nav",
      "rootCause": "Element shifted due to box model change",
      "suggestedFix": "padding: 0 16px;",
      "affectedProperty": "padding",
      "confidence": 75
    }
  ]
}`;

async function testModel(model) {
  console.log('\n=============================');
  console.log('Testing model:', model);
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'TestPilot AI',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      })
    });

    const d = await r.json();

    if (d.error) {
      console.log('❌ API ERROR:', d.error.code, '-', d.error.message.substring(0, 100));
      return { model, ok: false };
    }

    const choice = d.choices?.[0];
    const text = choice?.message?.content || '';
    const finishReason = choice?.finish_reason;

    console.log('Finish reason:', finishReason);
    console.log('Content length:', text.length);
    console.log('Reasoning tokens:', d.usage?.completion_tokens_details?.reasoning_tokens);

    if (!text) {
      console.log('❌ EMPTY CONTENT — model likely not outputting to content field');
      return { model, ok: false };
    }

    // Strip markdown fences if present
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON VALID');
      console.log('  summary:', parsed.summary?.substring(0, 80));
      console.log('  overallStatus:', parsed.overallStatus);
      console.log('  issues count:', parsed.issues?.length);
      if (parsed.issues?.[0]) {
        const i = parsed.issues[0];
        const hasAll = i.id && i.title && i.severity && i.category && i.confidence !== undefined;
        console.log('  schema complete:', hasAll ? '✅' : '❌ missing fields');
      }
      console.log('  cost: $' + d.usage?.cost);
      return { model, ok: true };
    } catch(e) {
      console.log('❌ JSON PARSE FAILED:', e.message);
      console.log('Raw (first 300):', text.substring(0, 300));
      return { model, ok: false };
    }
  } catch(e) {
    console.log('❌ FETCH ERROR:', e.message);
    return { model, ok: false };
  }
}

(async () => {
  const candidates = [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
  ];

  const results = [];
  for (const m of candidates) {
    const result = await testModel(m);
    results.push(result);
  }

  console.log('\n\n========= SUMMARY =========');
  results.forEach(r => console.log(r.ok ? '✅' : '❌', r.model));

  const winner = results.find(r => r.ok);
  if (winner) {
    console.log('\n🏆 Best model to use:', winner.model);
    console.log('Update .env: OPENROUTER_MODEL=' + winner.model);
  } else {
    console.log('\n⚠️  No free models passed. Consider topping up OpenRouter credits.');
  }
})();
