import { useState, useEffect } from "react";
import { authApi, adminApi, setToken, clearSession, getToken } from "./api.js";
import { T, Shell, Card, Field, Button, Banner, Chip, Spinner, fmtDate } from "./ui.jsx";

export default function AdminPortal() {
  const [booting, setBooting] = useState(true);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    (async () => {
      if (!getToken()) { setBooting(false); return; }
      try {
        const data = await authApi.me();
        if (data.account?.isAdmin) setAccount(data.account);
      } catch { /* dead session */ }
      setBooting(false);
    })();
  }, []);

  if (booting) return <Shell title="Administration" wide><Spinner label="Checking your session" /></Shell>;
  if (!account) return <AdminSignIn onSignedIn={setAccount} />;
  return <Console onSignOut={() => { clearSession(); setAccount(null); }} />;
}

function AdminSignIn({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await authApi.login({ email, password });
      if (!data.account?.isAdmin) {
        setError("This account doesn't have administrator access.");
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
    <Shell title="Administration" subtitle="Programme oversight">
      <Card>
        <Banner kind="error">{error}</Banner>
        <Field label="Email" type="email" value={email} autoComplete="username" onChange={e => setEmail(e.target.value)} />
        <Field label="Password" type="password" value={password} autoComplete="current-password"
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        <Button onClick={submit} disabled={busy || !email || !password} style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </Card>
    </Shell>
  );
}

function Console({ onSignOut }) {
  const [tab, setTab] = useState("review");
  const [overview, setOverview] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [youth, setYouth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function refresh() {
    setLoading(true); setError("");
    try {
      const [o, m, y] = await Promise.all([adminApi.overview(), adminApi.mentors(), adminApi.youth()]);
      setOverview(o);
      setMentors(m.mentors || []);
      setYouth(y.youth || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function act(fn, successMsg) {
    setError(""); setNote("");
    try {
      await fn();
      setNote(successMsg);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const signOutBtn = (
    <Button variant="ghost" onClick={onSignOut}
      style={{ padding: "8px 14px", fontSize: 12, color: "#A8D5C2", borderColor: "rgba(255,255,255,0.25)" }}>
      Sign out
    </Button>
  );

  const s = overview?.stats;

  return (
    <Shell title="Administration" subtitle="Approvals, matches and oversight" right={signOutBtn} wide>
      {s && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 22 }}>
          {[
            ["Youth", s.totalYouth], ["Seeking mentor", s.wantsMentor], ["Matched", s.matched],
            ["Active mentors", s.mentorsActive], ["Pending mentors", s.mentorsPending]
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#FFFFFF", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 25, fontWeight: 700, color: T.green }}>{value}</div>
              <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: T.soft, textTransform: "uppercase", marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["review", `Review (${(overview?.pendingMentors?.length || 0) + (overview?.requests?.length || 0)})`],
          ["mentors", `Mentors (${mentors.length})`],
          ["youth", `Youth (${youth.length})`]
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              flex: "1 1 30%", padding: "11px 8px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: T.font,
              background: tab === key ? T.green : "#FFFFFF",
              color: tab === key ? "#FFFFFF" : T.mid,
              border: `2px solid ${tab === key ? T.green : T.border}`
            }}>{label}</button>
        ))}
      </div>

      <Banner kind="error">{error}</Banner>
      <Banner kind="info">{note}</Banner>

      {loading ? <Spinner /> : (
        <>
          {tab === "review" && (
            <div>
              <SectionTitle>Mentor applications</SectionTitle>
              {(overview?.pendingMentors || []).length === 0 && (
                <Card><div style={{ color: T.soft, fontSize: 14 }}>No applications waiting.</div></Card>
              )}
              {(overview?.pendingMentors || []).map(m => (
                <Card key={m.id}>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{m.fullName}</div>
                  <div style={{ fontSize: 13, color: T.soft, marginBottom: 10 }}>
                    {m.email}{m.whatsapp ? ` · ${m.whatsapp}` : ""} · applied {fmtDate(m.createdAt)}
                  </div>
                  <div style={{ fontSize: 13.5, color: T.mid, lineHeight: 1.8, marginBottom: 10 }}>
                    {m.profession && <div><strong>Profession:</strong> {m.profession}{m.experience ? ` (${m.experience} yrs)` : ""}</div>}
                    {m.location && <div><strong>Location:</strong> {m.location}</div>}
                    {m.expertise && <div><strong>Expertise:</strong> {m.expertise}</div>}
                    {m.availability && <div><strong>Availability:</strong> {m.availability}</div>}
                    {m.linkedin && <div><strong>LinkedIn:</strong> {m.linkedin}</div>}
                  </div>
                  {m.bio && (
                    <p style={{ fontSize: 14, color: T.text, lineHeight: 1.75, background: "#FAFAFA", padding: "12px 16px", borderRadius: 8 }}>
                      {m.bio}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <Button onClick={() => act(() => adminApi.setMentorStatus(m.id, "active"), `${m.fullName} approved.`)}
                      style={{ padding: "10px 20px", fontSize: 13 }}>Approve</Button>
                    <Button variant="danger" onClick={() => act(() => adminApi.setMentorStatus(m.id, "suspended"), `${m.fullName} declined.`)}
                      style={{ padding: "10px 20px", fontSize: 13 }}>Decline</Button>
                  </div>
                </Card>
              ))}

              <SectionTitle style={{ marginTop: 28 }}>Match requests</SectionTitle>
              {(overview?.requests || []).length === 0 && (
                <Card><div style={{ color: T.soft, fontSize: 14 }}>No mentor has requested a match.</div></Card>
              )}
              {(overview?.requests || []).map(r => (
                <Card key={r.id}>
                  <div style={{ fontSize: 15, lineHeight: 1.7 }}>
                    <strong>{r.mentorName}</strong> would like to mentor <strong>{r.menteeName}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: T.soft, marginTop: 4 }}>Requested {fmtDate(r.requestedAt)}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <Button onClick={() => act(() => adminApi.assign(r.mentorEmail, r.recordId), "Match confirmed.")}
                      style={{ padding: "10px 20px", fontSize: 13 }}>Confirm match</Button>
                    <Button variant="ghost" onClick={() => act(() => adminApi.rejectRequest(r.id), "Request declined.")}
                      style={{ padding: "10px 20px", fontSize: 13 }}>Decline</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "mentors" && (
            mentors.length === 0
              ? <Card><div style={{ color: T.soft, fontSize: 14 }}>No mentors registered yet.</div></Card>
              : mentors.map(m => (
                <Card key={m.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{m.fullName}</div>
                      <div style={{ fontSize: 12.5, color: T.soft, marginTop: 3 }}>{m.email}</div>
                      <div style={{ fontSize: 13, color: T.mid, marginTop: 8, lineHeight: 1.6 }}>
                        {m.profession}{m.location ? ` · ${m.location}` : ""}
                      </div>
                      {m.expertise && <div style={{ fontSize: 12.5, color: T.mid, marginTop: 4 }}>{m.expertise}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Chip tone={m.status === "active" ? "green" : m.status === "pending" ? "gold" : "grey"}>{m.status}</Chip>
                      <div style={{ fontSize: 12, color: T.soft, marginTop: 6 }}>
                        {m.menteeCount} {m.menteeCount === 1 ? "mentee" : "mentees"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {m.status !== "active" && (
                      <Button onClick={() => act(() => adminApi.setMentorStatus(m.id, "active"), "Mentor activated.")}
                        style={{ padding: "9px 16px", fontSize: 12.5 }}>Activate</Button>
                    )}
                    {m.status === "active" && (
                      <Button variant="danger" onClick={() => act(() => adminApi.setMentorStatus(m.id, "suspended"), "Mentor suspended.")}
                        style={{ padding: "9px 16px", fontSize: 12.5 }}>Suspend</Button>
                    )}
                  </div>
                </Card>
              ))
          )}

          {tab === "youth" && (
            youth.length === 0
              ? <Card><div style={{ color: T.soft, fontSize: 14 }}>No submissions yet.</div></Card>
              : youth.map(y => (
                <YouthRow key={y.id} youth={y} mentors={mentors.filter(m => m.status === "active")} onAct={act} />
              ))
          )}
        </>
      )}
    </Shell>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 3.5, color: T.soft, textTransform: "uppercase", fontWeight: 700, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function YouthRow({ youth, mentors, onAct }) {
  const [pick, setPick] = useState("");

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{youth.name}</div>
          <div style={{ fontSize: 12.5, color: T.soft, marginTop: 3 }}>
            {[youth.email, youth.whatsapp, fmtDate(youth.submittedAt)].filter(Boolean).join(" · ")}
          </div>
          {youth.identityTitle && (
            <div style={{ fontSize: 13, color: T.gold, fontWeight: 700, marginTop: 8 }}>{youth.identityTitle}</div>
          )}
          {youth.primaryPath && (
            <div style={{ fontSize: 13, color: T.mid, marginTop: 3, lineHeight: 1.6 }}>{youth.primaryPath}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {!youth.hasRoadmap && <Chip tone="grey">No roadmap</Chip>}
          {youth.wantsMentor ? <Chip tone="gold">Wants mentor</Chip> : <Chip tone="grey">No mentor wanted</Chip>}
          {youth.assignedMentor && <Chip tone="green">{youth.assignedMentor}</Chip>}
        </div>
      </div>

      {youth.wantsMentor && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          {youth.assignedMentor ? (
            <Button variant="danger" onClick={() => onAct(() => adminApi.unassign(youth.id), "Match ended.")}
              style={{ padding: "9px 16px", fontSize: 12.5 }}>End match</Button>
          ) : (
            <>
              <select value={pick} onChange={e => setPick(e.target.value)}
                style={{
                  flex: "1 1 220px", padding: "10px 12px", borderRadius: 8, border: `2px solid ${T.border}`,
                  fontSize: 13, fontFamily: T.font, color: T.text, background: "#FFFFFF", outline: "none"
                }}>
                <option value="">Assign a mentor…</option>
                {mentors.map(m => (
                  <option key={m.id} value={m.email}>
                    {m.fullName} — {m.expertise || m.profession || "no expertise listed"} ({m.menteeCount})
                  </option>
                ))}
              </select>
              <Button disabled={!pick} onClick={() => onAct(() => adminApi.assign(pick, youth.id), "Mentor assigned.")}
                style={{ padding: "10px 18px", fontSize: 12.5 }}>Assign</Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
