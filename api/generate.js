export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const { prompt, saveData } = body;

    // Handle Airtable save request
    if (saveData) {
      const airtableToken = process.env.VITE_AIRTABLE_TOKEN;
      const airtableBaseId = process.env.VITE_AIRTABLE_BASE_ID;

      if (!airtableToken || !airtableBaseId) {
        return new Response(JSON.stringify({ saved: false, error: "Missing Airtable config" }), { status: 200, headers: corsHeaders });
      }

      try {
        const atRes = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Responses`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${airtableToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fields: saveData })
        });

        const atData = await atRes.json();
        if (!atRes.ok) {
          return new Response(JSON.stringify({ saved: false, error: atData?.error?.message || "Airtable error" }), { status: 200, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ saved: true }), { status: 200, headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ saved: false, error: e.message }), { status: 200, headers: corsHeaders });
      }
    }

    // Handle AI generation request
    if (!prompt) return new Response(JSON.stringify({ error: "No prompt provided" }), { status: 400, headers: corsHeaders });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation — just the raw JSON object starting with { and ending with }.",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return new Response(JSON.stringify({ error: err?.error?.message || "Anthropic error: " + response.status }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();
    if (!data.content || !data.content.length) return new Response(JSON.stringify({ error: "Empty response from Anthropic" }), { status: 500, headers: corsHeaders });

    let text = data.content.map(i => i.text || "").join("").trim();
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return new Response(JSON.stringify({ error: "No JSON found in AI response" }), { status: 500, headers: corsHeaders });

    let parsed;
    try {
      parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch (e) {
      return new Response(JSON.stringify({ error: "JSON parse failed: " + e.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: corsHeaders });
  }
}
