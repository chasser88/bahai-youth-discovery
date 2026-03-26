export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const token = process.env.VITE_AIRTABLE_TOKEN;
  const baseId = process.env.VITE_AIRTABLE_BASE_ID;

  if (!token || !baseId) {
    return new Response(JSON.stringify({
      status: "MISSING ENV VARS",
      hasToken: !!token,
      hasBaseId: !!baseId
    }), { status: 200, headers: corsHeaders });
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/Responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          Name: "TEST USER",
          "Submitted At": new Date().toISOString().split("T")[0],
          Answers: "This is a test entry",
          "Location & Access": "Test Location",
          "Identity Title": "Test Identity",
          "Primary Path": "Test Path",
          "Immediate Win": "Test Win",
          "Full Roadmap": "Test Roadmap"
        }
      })
    });

    const data = await res.json();

    return new Response(JSON.stringify({
      status: res.ok ? "SUCCESS" : "FAILED",
      httpStatus: res.status,
      airtableResponse: data
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({
      status: "ERROR",
      message: err.message
    }), { status: 200, headers: corsHeaders });
  }
}
