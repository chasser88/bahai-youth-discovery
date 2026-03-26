export const config = { runtime: "edge" };

export default async function handler(req) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // Report exactly what env vars are present
  const token = process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;

  if (!token || !baseId) {
    return new Response(JSON.stringify({
      status: "MISSING_CONFIG",
      hasToken: !!token,
      hasBaseId: !!baseId,
      hint: "Check Vercel environment variables - need VITE_AIRTABLE_TOKEN and VITE_AIRTABLE_BASE_ID"
    }), { status: 200, headers });
  }

  // Try a real test save
  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/Responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          Name: "DIAGNOSTIC TEST",
          "Submitted At": new Date().toISOString().split("T")[0],
          Answers: "This is an automated diagnostic test entry. Safe to delete.",
          "Location & Access": "Test",
          "Identity Title": "Test",
          "Primary Path": "Test",
          "Immediate Win": "Test",
          "Full Roadmap": "Test"
        }
      })
    });

    const data = await res.json();

    return new Response(JSON.stringify({
      status: res.ok ? "SUCCESS" : "AIRTABLE_ERROR",
      httpStatus: res.status,
      response: data
    }), { status: 200, headers });

  } catch (e) {
    return new Response(JSON.stringify({
      status: "FETCH_ERROR",
      error: e.message
    }), { status: 200, headers });
  }
}
