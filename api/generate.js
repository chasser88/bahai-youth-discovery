export const config = { maxDuration: 60 };

const ANTHROPIC_TIMEOUT_MS = 50000;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { prompt, saveData } = body;

    // ---- Airtable save ----
    if (saveData) {
      const airtableToken = process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN;
      const airtableBaseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;

      if (!airtableToken || !airtableBaseId) {
        console.error("Airtable config missing", {
          hasToken: !!airtableToken,
          hasBaseId: !!airtableBaseId
        });
        return res.status(200).json({ saved: false, error: "Missing Airtable config" });
      }

      const atRes = await fetch(
        `https://api.airtable.com/v0/${airtableBaseId}/Responses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fields: saveData, typecast: true })
        }
      );

      const atRaw = await atRes.text();
      let atData = null;
      try { atData = JSON.parse(atRaw); } catch { atData = null; }

      if (!atRes.ok) {
        console.error("Airtable error", atRes.status, atRaw.slice(0, 400));
        return res.status(200).json({
          saved: false,
          error: atData?.error?.message || "Airtable error"
        });
      }

      // The record id lets the frontend link a new account to this submission.
      return res.status(200).json({ saved: true, recordId: atData?.id || "" });
    }

    // ---- AI generation ----
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set");
      return res.status(500).json({ error: "Server misconfigured: missing API key" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system:
            "You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation — just the raw JSON object starting with { and ending with }.",
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch (e) {
      if (e.name === "AbortError") {
        return res.status(504).json({ error: "Generation timed out. Please try again." });
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }

    const raw = await response.text();

    if (!response.ok) {
      console.error("Anthropic error", response.status, raw.slice(0, 500));
      let msg = `Anthropic error ${response.status}`;
      try { msg = JSON.parse(raw)?.error?.message || msg; } catch {}
      return res.status(response.status).json({ error: msg });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Non-JSON from Anthropic:", raw.slice(0, 500));
      return res.status(502).json({ error: "Upstream returned non-JSON response" });
    }

    if (!data.content?.length) {
      return res.status(500).json({ error: "Empty response from Anthropic" });
    }

    let text = data.content.map(i => i.text || "").join("").trim();
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first === -1 || last === -1) {
      console.error("No JSON braces found:", text.slice(0, 300));
      return res.status(500).json({ error: "No JSON found in AI response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(text.substring(first, last + 1));
    } catch (e) {
      console.error("Parse failed:", text.slice(0, 300));
      return res.status(500).json({ error: "JSON parse failed: " + e.message });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("generate failed:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
