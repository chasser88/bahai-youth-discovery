import { useState, useEffect } from "react";
import { authApi, mentorApi, setToken, clearSession, getToken } from "./api.js";
import { T, Shell, Card, Field, TextArea, Button, Banner, Chip, Spinner, fmtDate } from "./ui.jsx";
import Roadmap from "./Roadmap.jsx";
import Thread from "./Thread.jsx";

export default function MentorPortal() {
  const [booting, setBooting] = useState(true);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    (async () => {
      if (!getToken()) { setBooting(false); return; }
      try {
        const data = await authApi.me();
        if (data.account?.role === "mentor" || data.account?.role === "admin") {
          setAccount(data.account);
        }
      } catch { /* token dead -- fall through to sign-in */ }
      setBooting(false);
    })();
  }, []);

  function signOut() {
    clearSession();
    setAccount(null);
  }

  if (booting) {
    return <Shell title="Mentor Portal"><Spinner label="Checking your session" /></Shell>;
  }

  if (!account) {
    return <Gate onSignedIn={setAccount} />;
  }

  return <Dashboard account={account} onSignOut={signOut} />;
}

/* ------------------------------------------------------------------ gate */

function Gate({ onSignedIn }) {
  const [tab, setTab] = useState("login");

  return (
    <Shell title="Mentor Portal" subtitle="Guide a young person toward their path">
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[["login", "Sign in"], ["apply", "Apply as a mentor"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "12px 10px", borderRadius: 8, fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", fontFamily: T.font, transition: "all 0.2s",
              background: tab === key ? T.green : "#FFFFFF",
              color: tab === key ? "#FFFFFF" : T.mid,
              border: `2px solid ${tab === key ? T.green : T.border}`
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "login" ? <LoginForm onSignedIn={onSignedIn} /> : <ApplyForm onDone={() => setTab("login")} />}
    </Shell>
  );
}

function LoginForm({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await authApi.login({ email, password });
      if (data.account?.role !== "mentor" && data.account?.role !== "admin") {
        setError("This is a mentee account. Please use the mentee dashboard at /dashboard.");
        setBusy(false);
        return;
      }
      setToken(data.token);
      onSignedIn(data.account);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card>
      <Banner kind="error">{error}</Banner>
      <Field label="Email" type="email" value={email} autoComplete="username"
        onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <Field label="Password" type="password" value={password} autoComplete="current-password"
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••" />
      <Button onClick={submit} disabled={busy || !email || !password} style={{ width: "100%" }}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </Card>
  );
}

function ApplyForm({ onDone }) {
  const [f, setF] = useState({
    fullName: "", email: "", password: "", whatsapp: "", location: "",
    profession: "", experience: "", expertise: "", bio: "", availability: "", linkedin: ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await authApi.register({ role: "mentor", ...f });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card>
        <Banner kind="info">
          <strong>Application received.</strong> A programme administrator will review it.
          You'll be able to sign in here once your account is approved.
        </Banner>
        <Button variant="ghost" onClick={onDone}>Back to sign in</Button>
      </Card>
    );
  }

  return (
    <Card>
      <Banner kind="warn">
        Mentor accounts are reviewed before activation. Youth contact details stay hidden
        until a programme administrator matches you with someone.
      </Banner>
      <Banner kind="error">{error}</Banner>

      <Field label="Full name *" value={f.fullName} onChange={set("fullName")} placeholder="e.g. Amina Bello" />
      <Field label="Email *" type="email" value={f.email} onChange={set("email")} autoComplete="username" placeholder="you@example.com" />
      <Field label="Password *" type="password" value={f.password} onChange={set("password")} autoComplete="new-password"
        hint="At least 8 characters, including a letter and a number." />
      <Field label="WhatsApp number" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+234 801 234 5678" />
      <Field label="Location *" value={f.location} onChange={set("location")} placeholder="e.g. Lagos, Nigeria" />
      <Field label="Profession" value={f.profession} onChange={set("profession")} placeholder="e.g. Software Engineer" />
      <Field label="Years of experience" value={f.experience} onChange={set("experience")} placeholder="e.g. 8" />
      <Field label="Areas of expertise *" value={f.expertise} onChange={set("expertise")}
        placeholder="e.g. Web development, freelancing, digital marketing"
        hint="Comma-separated. This is what youth are matched against." />
      <Field label="Availability" value={f.availability} onChange={set("availability")} placeholder="e.g. 2 hours per week, evenings" />
      <Field label="LinkedIn" value={f.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…" />
      <TextArea label="Short bio" value={f.bio} onChange={set("bio")} rows={4}
        placeholder="How you'd like to help, and what you've built or learned that a young person could benefit from." />

      <Button onClick={submit} disabled={busy} style={{ width: "100%" }}>
        {busy ? "Submitting…" : "Submit application"}
      </Button>
    </Card>
  );
}

/* ------------------------------------------------------------- dashboard */

function Dashboard({ account, onSignOut }) {
  const [tab, setTab] = useState("mentees");
  const [mentees, setMentees] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  async function refresh() {
    setLoading(true); setError("");
    try {
      const [m, p] = await Promise.all([mentorApi.mentees(), mentorApi.pool()]);
      setMentees(m.mentees || []);
      setPool(p.youth || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  if (open) {
    return <MenteeDetail mentee={open} onBack={() => { setOpen(null); refresh(); }} />;
  }

  const signOutBtn = (
    <Button variant="ghost" onClick={onSignOut}
      style={{ padding: "8px 14px", fontSize: 12, color: "#A8D5C2", borderColor: "rgba(255,255,255,0.25)" }}>
      Sign out
    </Button>
  );

  return (
    <Shell title={`Welcome, ${account.fullName.split(" ")[0] || "Mentor"}`}
      subtitle={`${mentees.length} active ${mentees.length === 1 ? "mentee" : "mentees"}`}
      right={signOutBtn}>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[["mentees", `My mentees (${mentees.length})`], ["pool", `Youth seeking mentors (${pool.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "11px 8px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: T.font,
              background: tab === key ? T.green : "#FFFFFF",
              color: tab === key ? "#FFFFFF" : T.mid,
              border: `2px solid ${tab === key ? T.green : T.border}`
            }}>
            {label}
          </button>
        ))}
      </div>

      <Banner kind="error">{error}</Banner>

      {loading ? <Spinner /> : tab === "mentees" ? (
        mentees.length === 0 ? (
          <Card>
            <div style={{ color: T.mid, fontSize: 14.5, lineHeight: 1.8 }}>
              You have no mentees yet. Open <strong>Youth seeking mentors</strong> to see who has
              asked for support, and express interest in anyone whose path fits your experience.
              An administrator confirms each match.
            </div>
          </Card>
        ) : mentees.map(m => (
          <Card key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 700, marginBottom: 8 }}>{m.identityTitle}</div>
                <div style={{ fontSize: 13.5, color: T.mid, lineHeight: 1.6 }}>{m.primaryPath}</div>
              </div>
              <Button onClick={() => setOpen(m)} style={{ padding: "10px 18px", fontSize: 13 }}>Open</Button>
            </div>
          </Card>
        ))
      ) : (
        pool.length === 0 ? (
          <Card><div style={{ color: T.mid, fontSize: 14.5 }}>No youth are currently seeking a mentor.</div></Card>
        ) : pool.map(y => (
          <PoolRow key={y.id} youth={y} onRequested={refresh} />
        ))
      )}
    </Shell>
  );
}

function PoolRow({ youth, onRequested }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request() {
    setBusy(true); setError("");
    try {
      await mentorApi.request(youth.id);
      onRequested();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{youth.name}</div>
          <div style={{ fontSize: 12.5, color: T.gold, fontWeight: 700, marginBottom: 6 }}>{youth.identityTitle}</div>
          <div style={{ fontSize: 13, color: T.mid, lineHeight: 1.6, marginBottom: 8 }}>{youth.primaryPath}</div>
          <div style={{ fontSize: 11.5, color: T.soft }}>
            {youth.location}{youth.location && youth.submittedAt ? " · " : ""}{fmtDate(youth.submittedAt)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {youth.assignedToMe ? <Chip tone="green">Your mentee</Chip>
            : youth.requestedByMe ? <Chip tone="grey">Awaiting approval</Chip>
            : youth.assigned ? <Chip tone="grey">Matched</Chip>
            : (
              <Button variant="gold" onClick={request} disabled={busy} style={{ padding: "9px 16px", fontSize: 12.5 }}>
                {busy ? "…" : "Express interest"}
              </Button>
            )}
        </div>
      </div>
      {error && <div style={{ color: T.danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
    </Card>
  );
}

/* --------------------------------------------------------- mentee detail */

function MenteeDetail({ mentee, onBack }) {
  const [view, setView] = useState("roadmap");
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState("note");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    try {
      const data = await mentorApi.notes(mentee.id);
      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadNotes(); }, [mentee.id]);

  async function addNote() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true); setError("");
    try {
      const data = await mentorApi.addNote(mentee.id, kind, content);
      setNotes(prev => [data.note, ...prev]);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(note) {
    try {
      await mentorApi.toggleGoal(note.id, !note.done);
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, done: !n.done } : n));
    } catch (err) {
      setError(err.message);
    }
  }

  const goals = notes.filter(n => n.type === "goal");
  const plainNotes = notes.filter(n => n.type !== "goal");

  return (
    <Shell title={mentee.name} subtitle={mentee.identityTitle}
      right={<Button variant="ghost" onClick={onBack}
        style={{ padding: "8px 14px", fontSize: 12, color: "#A8D5C2", borderColor: "rgba(255,255,255,0.25)" }}>Back</Button>}>

      <Card style={{ background: T.greenSoft, borderColor: T.greenLine }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: T.green, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
          Contact
        </div>
        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.9 }}>
          {mentee.whatsapp && <div>WhatsApp: <strong>{mentee.whatsapp}</strong></div>}
          {mentee.email && <div>Email: <strong>{mentee.email}</strong></div>}
          {mentee.location && <div>Location: {mentee.location}</div>}
        </div>
        {mentee.whatsapp && (
          <a href={`https://wa.me/${mentee.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 700, color: T.green }}>
            Open in WhatsApp →
          </a>
        )}
      </Card>

      <div style={{ display: "flex", gap: 8, margin: "18px 0 20px", flexWrap: "wrap" }}>
        {[["roadmap", "Roadmap"], ["goals", `Goals & notes (${notes.length})`], ["messages", "Messages"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{
              flex: "1 1 30%", padding: "10px 8px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: T.font,
              background: view === key ? T.green : "#FFFFFF",
              color: view === key ? "#FFFFFF" : T.mid,
              border: `2px solid ${view === key ? T.green : T.border}`
            }}>
            {label}
          </button>
        ))}
      </div>

      <Banner kind="error">{error}</Banner>

      {view === "roadmap" && <Roadmap data={mentee.roadmap} />}

      {view === "messages" && <Thread recordId={mentee.id} title={`With ${mentee.name}`} />}

      {view === "goals" && (
        <div>
          <Card>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[["note", "Note"], ["goal", "Goal"]].map(([k, label]) => (
                <button key={k} onClick={() => setKind(k)}
                  style={{
                    padding: "7px 16px", borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: T.font,
                    background: kind === k ? T.greenSoft : "#FFFFFF",
                    color: kind === k ? T.green : T.soft,
                    border: `2px solid ${kind === k ? T.green : T.border}`
                  }}>{label}</button>
              ))}
            </div>
            <TextArea label={kind === "goal" ? "New goal" : "New note"} value={draft} rows={3}
              onChange={e => setDraft(e.target.value)}
              placeholder={kind === "goal" ? "e.g. Publish first portfolio piece by 15 August" : "What you discussed, and what to follow up on."} />
            <Button onClick={addNote} disabled={busy || !draft.trim()}>
              {busy ? "Saving…" : `Add ${kind}`}
            </Button>
          </Card>

          {goals.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: T.soft, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                Goals
              </div>
              {goals.map(g => (
                <Card key={g.id} style={{ padding: "14px 18px", marginBottom: 8 }}>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={g.done} onChange={() => toggle(g)}
                      style={{ marginTop: 4, width: 17, height: 17, accentColor: T.green, cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14.5, lineHeight: 1.65, color: g.done ? T.soft : T.text,
                        textDecoration: g.done ? "line-through" : "none"
                      }}>{g.content}</div>
                      <div style={{ fontSize: 11, color: T.soft, marginTop: 5 }}>{fmtDate(g.createdAt)}</div>
                    </div>
                  </label>
                </Card>
              ))}
            </div>
          )}

          {plainNotes.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: T.soft, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                Session notes
              </div>
              {plainNotes.map(n => (
                <Card key={n.id} style={{ padding: "14px 18px", marginBottom: 8 }}>
                  <div style={{ fontSize: 14.5, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap" }}>{n.content}</div>
                  <div style={{ fontSize: 11, color: T.soft, marginTop: 8 }}>{fmtDate(n.createdAt)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
