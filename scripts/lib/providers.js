// Thin wrappers around each provider's REST API. Each call* function takes
// ({ model, prompt, maxTokens }) and an API key, and returns:
//   { text, latencyMs, raw }
// or throws an Error with a descriptive message on failure.
//
// NOTE: model ID strings live in /config/models.json and /config/judges.json,
// not here — providers rename/retire model IDs often, so check current docs
// before relying on the defaults shipped in this repo.

async function timedFetch(url, options) {
  const start = Date.now();
  const res = await fetch(url, options);
  const latencyMs = Date.now() - start;
  const bodyText = await res.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const detail = json ? JSON.stringify(json) : bodyText;
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${detail}`);
  }
  return { json, latencyMs };
}

export async function callAnthropic({ model, prompt, maxTokens = 4096, apiKey }) {
  const { json, latencyMs } = await timedFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const text = (json.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  return { text, latencyMs, raw: json };
}

export async function callOpenAI({ model, prompt, maxTokens = 4096, apiKey }) {
  const { json, latencyMs } = await timedFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const text = json.choices?.[0]?.message?.content ?? "";
  return { text, latencyMs, raw: json };
}

export async function callGoogle({ model, prompt, maxTokens = 4096, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const { json, latencyMs } = await timedFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  const text = (json.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n");
  return { text, latencyMs, raw: json };
}

const CALLERS = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  google: callGoogle,
};

export async function callProvider(entry, prompt) {
  const caller = CALLERS[entry.provider];
  if (!caller) {
    throw new Error(`Unknown provider "${entry.provider}" for model key "${entry.key}"`);
  }
  const apiKey = process.env[entry.envKey];
  if (!apiKey) {
    throw new Error(`Missing API key in env var "${entry.envKey}" for model key "${entry.key}"`);
  }
  return caller({ model: entry.model, prompt, maxTokens: entry.maxTokens, apiKey });
}
