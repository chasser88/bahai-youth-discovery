export const config = { maxDuration: 30 };

import { atList, atFindOne, atCreate, atUpdate, atGet, esc, TABLES, airtableConfigured } from "../lib/airtable.js";
import {
  hashPassword, verifyPassword, issueToken, readToken,
  normEmail, validEmail, passwordProblem, isAdmin
} from "../lib/auth.js";

function send(res, status, body) {
  return res.status(status).json(body);
}

// Shape an account record for the client. Never leaks hash or salt.
function publicAccount(rec) {
  const f = rec.fields || {};
  return {
    id: rec.id,
    email: f.Email || "",
    role: f.Role || "mentee",
    fullName: f["Full Name"] || "",
    whatsapp: f.WhatsApp || "",
    status: f.Status || "active",
    location: f.Location || "",
    profession: f.Profession || "",
    experience: f.Experience || "",
    expertise: f.Expertise || "",
    bio: f.Bio || "",
    availability: f.Availability || "",
    linkedin: f.LinkedIn || "",
    responseRecordId: f["Response Record ID"] || ""
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  if (!airtableConfigured()) {
    console.error("Airtable env vars missing");
    return send(res, 500, { error: "Server not configured. Contact the administrator." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return send(res, 400, { error: "Invalid request body" });
  }

  const action = body.action;

  try {
    // ---------------------------------------------------------------- me
    if (action === "me") {
      const payload = readToken(body.token);
      if (!payload) return send(res, 401, { error: "Session expired. Please sign in again." });

      const rec = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(payload.email)}"`);
      if (!rec) return send(res, 401, { error: "Account not found." });

      const account = publicAccount(rec);
      if (account.status === "suspended") {
        return send(res, 403, { error: "This account has been suspended." });
      }
      account.isAdmin = isAdmin(payload) || isAdmin({ email: account.email, role: account.role });
      return send(res, 200, { account });
    }

    // -------------------------------------------------- mentee dashboard
    if (action === "dashboard") {
      const payload = readToken(body.token);
      if (!payload) return send(res, 401, { error: "Session expired. Please sign in again." });
      const email = normEmail(payload.email);

      const acct = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(email)}"`);
      if (!acct) return send(res, 401, { error: "Account not found." });

      // Prefer the record linked at registration; fall back to matching on email.
      let record = null;
      const linkedId = acct.fields?.["Response Record ID"];
      if (linkedId) record = await atGet(TABLES.RESPONSES, linkedId).catch(() => null);
      if (!record) {
        record = await atFindOne(TABLES.RESPONSES, `LOWER({Email}) = "${esc(email)}"`);
      }

      if (!record) {
        return send(res, 200, { roadmap: null, recordId: "", mentor: null, name: acct.fields?.["Full Name"] || "" });
      }

      let roadmap = null;
      try { roadmap = JSON.parse(record.fields?.["Full Roadmap"] || "null"); } catch { roadmap = null; }

      const assignment = await atFindOne(
        TABLES.ASSIGNMENTS,
        `AND({Response Record ID} = "${esc(record.id)}", {Status} = "active")`
      );

      let mentor = null;
      if (assignment) {
        const m = await atFindOne(
          TABLES.ACCOUNTS,
          `LOWER({Email}) = "${esc(normEmail(assignment.fields?.["Mentor Email"]))}"`
        );
        if (m) {
          mentor = {
            fullName: m.fields?.["Full Name"] || "",
            email: m.fields?.Email || "",
            whatsapp: m.fields?.WhatsApp || "",
            location: m.fields?.Location || "",
            profession: m.fields?.Profession || "",
            expertise: m.fields?.Expertise || "",
            bio: m.fields?.Bio || "",
            availability: m.fields?.Availability || ""
          };
        }
      }

      return send(res, 200, {
        name: record.fields?.Name || acct.fields?.["Full Name"] || "",
        recordId: record.id,
        wantsMentor: record.fields?.["Wants Mentor"] === "Yes",
        roadmap,
        mentor
      });
    }

    // ------------------------------------------------------------ register
    if (action === "register") {
      const email = normEmail(body.email);
      const role = body.role === "mentor" ? "mentor" : "mentee";
      const fullName = String(body.fullName || "").trim();

      if (!validEmail(email)) return send(res, 400, { error: "Please enter a valid email address." });
      if (!fullName) return send(res, 400, { error: "Please enter your full name." });

      const pwProblem = passwordProblem(body.password);
      if (pwProblem) return send(res, 400, { error: pwProblem });

      if (role === "mentor") {
        if (!String(body.expertise || "").trim()) {
          return send(res, 400, { error: "Please list at least one area of expertise." });
        }
        if (!String(body.location || "").trim()) {
          return send(res, 400, { error: "Please enter your location." });
        }
      }

      const existing = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(email)}"`);
      if (existing) {
        return send(res, 409, { error: "An account with this email already exists. Try signing in." });
      }

      const { salt, hash } = hashPassword(body.password);
      const adminEmail = normEmail(process.env.ADMIN_EMAIL);
      const isTheAdmin = adminEmail && email === adminEmail;

      // Mentees are active immediately. Mentors wait for approval.
      const status = isTheAdmin ? "active" : (role === "mentor" ? "pending" : "active");

      const fields = {
        Email: email,
        "Password Hash": hash,
        Salt: salt,
        Role: isTheAdmin ? "admin" : role,
        "Full Name": fullName,
        WhatsApp: String(body.whatsapp || "").trim(),
        Status: status,
        "Created At": new Date().toISOString(),
        "Response Record ID": String(body.responseRecordId || "").trim()
      };

      if (role === "mentor") {
        fields.Location = String(body.location || "").trim();
        fields.Profession = String(body.profession || "").trim();
        fields.Experience = String(body.experience || "").trim();
        fields.Expertise = String(body.expertise || "").trim();
        fields.Bio = String(body.bio || "").trim();
        fields.Availability = String(body.availability || "").trim();
        fields.LinkedIn = String(body.linkedin || "").trim();
      }

      const created = await atCreate(TABLES.ACCOUNTS, fields);

      // Link the account back to the youth's roadmap submission, if we have one.
      if (role === "mentee" && fields["Response Record ID"]) {
        try {
          await atUpdate(TABLES.RESPONSES, fields["Response Record ID"], { Email: email });
        } catch (e) {
          console.error("Could not link response to account:", e.message);
        }
      }

      if (status === "pending") {
        return send(res, 200, {
          pending: true,
          message: "Your mentor application has been received. You'll be able to sign in once it is approved."
        });
      }

      const account = publicAccount(created);
      account.isAdmin = isTheAdmin;
      return send(res, 200, { token: issueToken({ email, role: fields.Role }), account });
    }

    // --------------------------------------------------------------- login
    if (action === "login") {
      const email = normEmail(body.email);
      if (!email || !body.password) {
        return send(res, 400, { error: "Please enter your email and password." });
      }

      const rec = await atFindOne(TABLES.ACCOUNTS, `LOWER({Email}) = "${esc(email)}"`);
      const f = rec?.fields || {};

      // Same message either way -- don't reveal whether an email is registered.
      if (!rec || !verifyPassword(body.password, f.Salt, f["Password Hash"])) {
        return send(res, 401, { error: "Email or password is incorrect." });
      }

      if (f.Status === "pending") {
        return send(res, 403, {
          error: "Your mentor application is still awaiting approval. You'll be notified once it's reviewed."
        });
      }
      if (f.Status === "suspended") {
        return send(res, 403, { error: "This account has been suspended." });
      }

      try {
        await atUpdate(TABLES.ACCOUNTS, rec.id, { "Last Login": new Date().toISOString() });
      } catch { /* non-fatal */ }

      const account = publicAccount(rec);
      account.isAdmin = isAdmin({ email, role: f.Role });
      return send(res, 200, { token: issueToken({ email, role: f.Role || "mentee" }), account });
    }

    return send(res, 400, { error: "Unknown action" });
  } catch (err) {
    console.error("auth failed:", action, err);
    return send(res, 500, { error: err.message });
  }
}
