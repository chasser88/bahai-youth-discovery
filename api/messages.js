export const config = { maxDuration: 30 };

import { atList, atFindOne, atCreate, atUpdate, atGet, esc, TABLES, airtableConfigured } from "../lib/airtable.js";
import { readToken, normEmail } from "../lib/auth.js";

function send(res, status, body) {
  return res.status(status).json(body);
}

// A thread is keyed on the youth's Response record id -- one roadmap, one conversation.
// Returns { ok, counterpartEmail, counterpartName } or { ok: false }.
async function authorise(me, recordId) {
  const youth = await atGet(TABLES.RESPONSES, recordId).catch(() => null);
  if (!youth) return { ok: false, reason: "Conversation not found." };

  const assignment = await atFindOne(
    TABLES.ASSIGNMENTS,
    `AND({Response Record ID} = "${esc(recordId)}", {Status} = "active")`
  );
  if (!assignment) return { ok: false, reason: "No active match for this conversation yet." };

  const mentorEmail = normEmail(assignment.fields?.["Mentor Email"]);
  const menteeEmail = normEmail(youth.fields?.Email || assignment.fields?.["Mentee Email"]);

  if (me === mentorEmail) {
    return { ok: true, counterpartEmail: menteeEmail, counterpartName: youth.fields?.Name || "Your mentee" };
  }
  if (me === menteeEmail) {
    const mentor = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(mentorEmail)}"`);
    return {
      ok: true,
      counterpartEmail: mentorEmail,
      counterpartName: mentor?.fields?.["Full Name"] || "Your mentor"
    };
  }
  return { ok: false, reason: "This conversation isn't yours." };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!airtableConfigured()) return send(res, 500, { error: "Server not configured." });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return send(res, 400, { error: "Invalid request body" });
  }

  const payload = readToken(body.token);
  if (!payload) return send(res, 401, { error: "Session expired. Please sign in again." });

  const me = normEmail(payload.email);
  const action = body.action;
  const recordId = String(body.recordId || "").trim();

  try {
    if (!recordId) return send(res, 400, { error: "Missing conversation id" });

    const auth = await authorise(me, recordId);
    if (!auth.ok) return send(res, 403, { error: auth.reason });

    // -------------------------------------------------------------- thread
    if (action === "thread") {
      const rows = await atList(TABLES.MESSAGES, {
        formula: `{Thread ID} = "${esc(recordId)}"`,
        sort: [{ field: "Sent At", direction: "asc" }]
      });

      // Mark anything addressed to me as read.
      const unread = rows.filter(
        r => normEmail(r.fields?.["To Email"]) === me && !r.fields?.Read
      );
      for (const r of unread.slice(0, 20)) {
        try { await atUpdate(TABLES.MESSAGES, r.id, { Read: true }); } catch { /* non-fatal */ }
      }

      return send(res, 200, {
        counterpartName: auth.counterpartName,
        messages: rows.map(r => ({
          id: r.id,
          from: r.fields?.["From Email"] || "",
          mine: normEmail(r.fields?.["From Email"]) === me,
          body: r.fields?.Body || "",
          sentAt: r.fields?.["Sent At"] || ""
        }))
      });
    }

    // ---------------------------------------------------------------- send
    if (action === "send") {
      const text = String(body.body || "").trim();
      if (!text) return send(res, 400, { error: "Nothing to send." });
      if (text.length > 4000) return send(res, 400, { error: "Message is too long (4000 characters max)." });

      const created = await atCreate(TABLES.MESSAGES, {
        "Thread ID": recordId,
        "From Email": me,
        "To Email": auth.counterpartEmail,
        Body: text,
        "Sent At": new Date().toISOString(),
        Read: false
      });

      return send(res, 200, {
        message: {
          id: created.id,
          from: me,
          mine: true,
          body: text,
          sentAt: created.fields?.["Sent At"] || new Date().toISOString()
        }
      });
    }

    return send(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("messages failed:", action, err);
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
