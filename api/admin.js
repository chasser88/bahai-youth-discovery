export const config = { maxDuration: 30 };

import { atList, atFindOne, atCreate, atUpdate, atGet, esc, TABLES, airtableConfigured } from "../lib/airtable.js";
import { readToken, normEmail, isAdmin } from "../lib/auth.js";

function send(res, status, body) {
  return res.status(status).json(body);
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
    // Re-check admin rights against Airtable, not just the token.
    const acct = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(me)}"`);
    const admin = isAdmin({ email: me, role: acct?.fields?.Role });
    if (!admin) return send(res, 403, { error: "Admin access only." });

    // ------------------------------------------------------------ overview
    if (action === "overview") {
      const [accounts, youth, assignments] = await Promise.all([
        atList(TABLES.ACCOUNTS),
        atList(TABLES.RESPONSES, { formula: `{Full Roadmap} != ""` }),
        atList(TABLES.ASSIGNMENTS)
      ]);

      const mentors = accounts.filter(a => a.fields?.Role === "mentor");
      const wantsMentor = youth.filter(y => y.fields?.["Wants Mentor"] === "Yes");

      const requests = assignments
        .filter(a => a.fields?.Status === "requested")
        .map(a => ({
          id: a.id,
          mentorEmail: a.fields?.["Mentor Email"] || "",
          recordId: a.fields?.["Response Record ID"] || "",
          requestedAt: a.fields?.["Assigned At"] || ""
        }));

      // Attach names to requests so the admin isn't reading raw record ids.
      const nameById = new Map(youth.map(y => [y.id, y.fields?.Name || "Unnamed"]));
      const mentorNameByEmail = new Map(
        accounts.map(a => [normEmail(a.fields?.Email), a.fields?.["Full Name"] || a.fields?.Email || ""])
      );
      requests.forEach(r => {
        r.menteeName = nameById.get(r.recordId) || "(submission removed)";
        r.mentorName = mentorNameByEmail.get(normEmail(r.mentorEmail)) || r.mentorEmail;
      });

      return send(res, 200, {
        stats: {
          totalYouth: youth.length,
          wantsMentor: wantsMentor.length,
          matched: youth.filter(y => (y.fields?.["Assigned Mentor"] || "").trim()).length,
          mentorsActive: mentors.filter(m => m.fields?.Status === "active").length,
          mentorsPending: mentors.filter(m => m.fields?.Status === "pending").length
        },
        pendingMentors: mentors
          .filter(m => m.fields?.Status === "pending")
          .map(m => ({
            id: m.id,
            email: m.fields?.Email || "",
            fullName: m.fields?.["Full Name"] || "",
            whatsapp: m.fields?.WhatsApp || "",
            location: m.fields?.Location || "",
            profession: m.fields?.Profession || "",
            experience: m.fields?.Experience || "",
            expertise: m.fields?.Expertise || "",
            bio: m.fields?.Bio || "",
            availability: m.fields?.Availability || "",
            linkedin: m.fields?.LinkedIn || "",
            createdAt: m.fields?.["Created At"] || ""
          })),
        requests
      });
    }

    // ------------------------------------------------------------- mentors
    if (action === "mentors") {
      const accounts = await atList(TABLES.ACCOUNTS, { formula: `{Role} = "mentor"` });
      const assignments = await atList(TABLES.ASSIGNMENTS, { formula: `{Status} = "active"` });

      const countByMentor = new Map();
      assignments.forEach(a => {
        const k = normEmail(a.fields?.["Mentor Email"]);
        countByMentor.set(k, (countByMentor.get(k) || 0) + 1);
      });

      return send(res, 200, {
        mentors: accounts.map(m => ({
          id: m.id,
          email: m.fields?.Email || "",
          fullName: m.fields?.["Full Name"] || "",
          whatsapp: m.fields?.WhatsApp || "",
          location: m.fields?.Location || "",
          profession: m.fields?.Profession || "",
          expertise: m.fields?.Expertise || "",
          availability: m.fields?.Availability || "",
          status: m.fields?.Status || "",
          lastLogin: m.fields?.["Last Login"] || "",
          menteeCount: countByMentor.get(normEmail(m.fields?.Email)) || 0
        }))
      });
    }

    // --------------------------------------------------------------- youth
    if (action === "youth") {
      const youth = await atList(TABLES.RESPONSES, {
        sort: [{ field: "Submitted At", direction: "desc" }]
      });

      return send(res, 200, {
        youth: youth
          .filter(y => (y.fields?.Name || "").trim())
          .map(y => ({
            id: y.id,
            name: y.fields?.Name || "",
            email: y.fields?.Email || "",
            whatsapp: y.fields?.WhatsApp || "",
            location: y.fields?.["Location & Access"] || "",
            ageBand: y.fields?.["Age Band"] || "",
            identityTitle: y.fields?.["Identity Title"] || "",
            primaryPath: y.fields?.["Primary Path"] || "",
            wantsMentor: y.fields?.["Wants Mentor"] === "Yes",
            assignedMentor: y.fields?.["Assigned Mentor"] || "",
            submittedAt: y.fields?.["Submitted At"] || "",
            hasRoadmap: Boolean((y.fields?.["Full Roadmap"] || "").trim())
          }))
      });
    }

    // ------------------------------------------------- mentor approval flow
    if (action === "setMentorStatus") {
      const id = String(body.mentorId || "").trim();
      const status = ["active", "pending", "suspended"].includes(body.status) ? body.status : null;
      if (!id || !status) return send(res, 400, { error: "Missing mentor or status" });

      await atUpdate(TABLES.ACCOUNTS, id, { Status: status });
      return send(res, 200, { ok: true });
    }

    // ---------------------------------------------------------- assignment
    if (action === "assign") {
      const mentorEmail = normEmail(body.mentorEmail);
      const recordId = String(body.recordId || "").trim();
      if (!mentorEmail || !recordId) return send(res, 400, { error: "Missing mentor or youth" });

      const mentor = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(mentorEmail)}"`);
      if (!mentor) return send(res, 404, { error: "Mentor account not found." });
      if (mentor.fields?.Status !== "active") {
        return send(res, 400, { error: "That mentor is not approved yet." });
      }

      const youth = await atGet(TABLES.RESPONSES, recordId).catch(() => null);
      if (!youth) return send(res, 404, { error: "Youth submission not found." });

      // Close any existing active assignment for this youth.
      const existing = await atList(TABLES.ASSIGNMENTS, {
        formula: `AND({Response Record ID} = "${esc(recordId)}", {Status} = "active")`
      });
      for (const a of existing) {
        await atUpdate(TABLES.ASSIGNMENTS, a.id, { Status: "ended" });
      }

      // Reuse the mentor's own request row if there is one, else create fresh.
      const requested = await atFindOne(
        TABLES.ASSIGNMENTS,
        `AND({Response Record ID} = "${esc(recordId)}", LOWER({Mentor Email}) = "${esc(mentorEmail)}", {Status} = "requested")`
      );

      if (requested) {
        await atUpdate(TABLES.ASSIGNMENTS, requested.id, {
          Status: "active",
          "Assigned At": new Date().toISOString(),
          "Assigned By": me
        });
      } else {
        await atCreate(TABLES.ASSIGNMENTS, {
          "Mentor Email": mentorEmail,
          "Mentee Email": youth.fields?.Email || "",
          "Response Record ID": recordId,
          Status: "active",
          "Assigned At": new Date().toISOString(),
          "Assigned By": me
        });
      }

      await atUpdate(TABLES.RESPONSES, recordId, {
        "Assigned Mentor": mentor.fields?.["Full Name"] || mentorEmail
      });

      return send(res, 200, { ok: true });
    }

    if (action === "unassign") {
      const recordId = String(body.recordId || "").trim();
      if (!recordId) return send(res, 400, { error: "Missing youth" });

      const existing = await atList(TABLES.ASSIGNMENTS, {
        formula: `AND({Response Record ID} = "${esc(recordId)}", {Status} = "active")`
      });
      for (const a of existing) {
        await atUpdate(TABLES.ASSIGNMENTS, a.id, { Status: "ended" });
      }

      await atUpdate(TABLES.RESPONSES, recordId, { "Assigned Mentor": "" });
      return send(res, 200, { ok: true });
    }

    if (action === "rejectRequest") {
      const id = String(body.requestId || "").trim();
      if (!id) return send(res, 400, { error: "Missing request" });
      await atUpdate(TABLES.ASSIGNMENTS, id, { Status: "declined" });
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("admin failed:", action, err);
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
