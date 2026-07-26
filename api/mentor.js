export const config = { maxDuration: 30 };

import { atList, atFindOne, atCreate, atUpdate, atGet, esc, TABLES, airtableConfigured } from "../lib/airtable.js";
import { readToken, normEmail } from "../lib/auth.js";

function send(res, status, body) {
  return res.status(status).json(body);
}

function parseRoadmap(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Summary view -- no contact details. Shown for youth this mentor is NOT matched with.
function summariseYouth(rec, { assigned, assignedToMe, requestedByMe }) {
  const f = rec.fields || {};
  return {
    id: rec.id,
    name: f.Name || "Unnamed",
    identityTitle: f["Identity Title"] || "",
    primaryPath: f["Primary Path"] || "",
    location: (f["Location & Access"] || "").split("(")[0].trim(),
    submittedAt: f["Submitted At"] || "",
    ageBand: f["Age Band"] || "",
    assigned,
    assignedToMe,
    requestedByMe
  };
}

// Full view -- contact details included. Only for youth assigned to this mentor.
function fullYouth(rec) {
  const f = rec.fields || {};
  return {
    id: rec.id,
    name: f.Name || "Unnamed",
    email: f.Email || "",
    whatsapp: f.WhatsApp || "",
    location: f["Location & Access"] || "",
    submittedAt: f["Submitted At"] || "",
    ageBand: f["Age Band"] || "",
    identityTitle: f["Identity Title"] || "",
    primaryPath: f["Primary Path"] || "",
    immediateWin: f["Immediate Win"] || "",
    answers: f.Answers || "",
    roadmap: parseRoadmap(f["Full Roadmap"])
  };
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

  try {
    // Confirm the caller is an approved mentor on every request -- the token
    // alone isn't enough, since approval can be revoked after sign-in.
    const acct = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(me)}"`);
    const role = acct?.fields?.Role;
    const status = acct?.fields?.Status;

    if (!acct || (role !== "mentor" && role !== "admin")) {
      return send(res, 403, { error: "Mentor access only." });
    }
    if (status !== "active") {
      return send(res, 403, { error: "Your mentor account is not active yet." });
    }

    const myAssignments = await atList(TABLES.ASSIGNMENTS, {
      formula: `LOWER({Mentor Email}) = "${esc(me)}"`
    });

    const activeIds = new Set(
      myAssignments.filter(a => a.fields?.Status === "active").map(a => a.fields?.["Response Record ID"])
    );
    const requestedIds = new Set(
      myAssignments.filter(a => a.fields?.Status === "requested").map(a => a.fields?.["Response Record ID"])
    );

    // ---------------------------------------------------------------- pool
    if (action === "pool") {
      const youth = await atList(TABLES.RESPONSES, {
        formula: `AND({Wants Mentor} = "Yes", {Full Roadmap} != "")`,
        sort: [{ field: "Submitted At", direction: "desc" }]
      });

      const list = youth.map(rec => summariseYouth(rec, {
        assigned: Boolean((rec.fields?.["Assigned Mentor"] || "").trim()),
        assignedToMe: activeIds.has(rec.id),
        requestedByMe: requestedIds.has(rec.id)
      }));

      return send(res, 200, { youth: list });
    }

    // ------------------------------------------------------------- mentees
    if (action === "mentees") {
      const ids = [...activeIds].filter(Boolean);
      if (!ids.length) return send(res, 200, { mentees: [] });

      const records = await Promise.all(ids.map(id =>
        atGet(TABLES.RESPONSES, id).catch(e => {
          console.error("Missing response record", id, e.message);
          return null;
        })
      ));

      return send(res, 200, { mentees: records.filter(Boolean).map(fullYouth) });
    }

    // ------------------------------------------------------------- request
    if (action === "request") {
      const recordId = String(body.recordId || "").trim();
      if (!recordId) return send(res, 400, { error: "Missing record id" });
      if (activeIds.has(recordId)) return send(res, 200, { ok: true, already: true });
      if (requestedIds.has(recordId)) return send(res, 200, { ok: true, already: true });

      const rec = await atGet(TABLES.RESPONSES, recordId).catch(() => null);
      if (!rec) return send(res, 404, { error: "That submission no longer exists." });
      if ((rec.fields?.["Assigned Mentor"] || "").trim()) {
        return send(res, 409, { error: "This youth already has a mentor." });
      }

      await atCreate(TABLES.ASSIGNMENTS, {
        "Mentor Email": me,
        "Mentee Email": rec.fields?.Email || "",
        "Response Record ID": recordId,
        Status: "requested",
        "Assigned At": new Date().toISOString(),
        "Assigned By": me
      });

      return send(res, 200, { ok: true });
    }

    // --------------------------------------------------------------- notes
    if (action === "notes") {
      const recordId = String(body.recordId || "").trim();
      if (!activeIds.has(recordId)) return send(res, 403, { error: "Not your mentee." });

      const notes = await atList(TABLES.NOTES, {
        formula: `AND(LOWER({Mentor Email}) = "${esc(me)}", {Response Record ID} = "${esc(recordId)}")`,
        sort: [{ field: "Created At", direction: "desc" }]
      });

      return send(res, 200, {
        notes: notes.map(n => ({
          id: n.id,
          type: n.fields?.Type || "note",
          content: n.fields?.Content || "",
          done: Boolean(n.fields?.Done),
          createdAt: n.fields?.["Created At"] || ""
        }))
      });
    }

    if (action === "addNote") {
      const recordId = String(body.recordId || "").trim();
      const content = String(body.content || "").trim();
      const type = body.type === "goal" ? "goal" : "note";

      if (!activeIds.has(recordId)) return send(res, 403, { error: "Not your mentee." });
      if (!content) return send(res, 400, { error: "Nothing to save." });
      if (content.length > 5000) return send(res, 400, { error: "That's too long -- keep it under 5000 characters." });

      const created = await atCreate(TABLES.NOTES, {
        "Mentor Email": me,
        "Response Record ID": recordId,
        Type: type,
        Content: content,
        Done: false,
        "Created At": new Date().toISOString()
      });

      return send(res, 200, {
        note: { id: created.id, type, content, done: false, createdAt: created.fields?.["Created At"] || "" }
      });
    }

    if (action === "toggleGoal") {
      const noteId = String(body.noteId || "").trim();
      if (!noteId) return send(res, 400, { error: "Missing note id" });

      const note = await atGet(TABLES.NOTES, noteId).catch(() => null);
      if (!note) return send(res, 404, { error: "Note not found." });
      if (normEmail(note.fields?.["Mentor Email"]) !== me) {
        return send(res, 403, { error: "Not your note." });
      }

      await atUpdate(TABLES.NOTES, noteId, { Done: Boolean(body.done) });
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("mentor failed:", action, err);
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
