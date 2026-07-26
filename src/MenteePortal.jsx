import { useState, useEffect } from "react";
import { authApi, setToken, clearSession, getToken } from "./api.js";
import { T, Shell, Card, Field, Button, Banner, Spinner } from "./ui.jsx";
import Roadmap from "./Roadmap.jsx";
import Thread from "./Thread.jsx";

export default function MenteePortal() {
  const [booting, setBooting] = useState(true);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    (async () => {
      if (!getToken()) { setBooting(false); return; }
      try {
        const data = await authApi.me();
        if (data.account) setAccount(data.account);
      } catch { /* dead session */ }
      setBooting(false);
    })();
  }, []);

  if (booting) return <Shell title="My Dashboard"><Spinner label="Checking your session" /></Shell>;

  if (!account) return <SignIn onSignedIn={setAccount} />;

  if (account.role === "mentor" || account.role === "admin") {
    return (
      <Shell title="My Dashboard">
        <Card>
          <Banner kind="warn">
            You're signed in as a mentor. Your workspace is at <strong>/mentor</strong>.
          </Banner>
          <Button onClick={() => { window.location.href = "/mentor"; }}>Go to mentor portal</Button>
        </Card>
      </Shell>
    );
  }

  return <Dashboard account={account} onSignOut={() => { clearSession(); setAccount(null); }} />;
}

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await authApi.login({ email, password });
      setToken(data.token);
      onSignedIn(data.account);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Shell title="My Dashboard" subtitle="Your roadmap and your mentor, in one place">
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
        <div style={{ marginTop: 18, fontSize: 13, color: T.soft, lineHeight: 1.7, textAlign: "center" }}>
          No account yet? Complete the discovery questionnaire on the{" "}
          <a href="/" style={{ color: T.green, fontWeight: 700 }}>home page</a> and create one at the end.
        </div>
      </Card>
    </Shell>
  );
}

function Dashboard({ account, onSignOut }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("roadmap");

  useEffect(() => {
    (async () => {
      try {
        setData(await authApi.dashboard());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signOutBtn = (
    <Button variant="ghost" onClick={onSignOut}
      style={{ padding: "8px 14px", fontSize: 12, color: "#A8D5C2", borderColor: "rgba(255,255,255,0.25)" }}>
      Sign out
    </Button>
  );

  if (loading) return <Shell title="My Dashboard" right={signOutBtn}><Spinner /></Shell>;

  const firstName = (data?.name || account.fullName || "").split(" ")[0];
  const mentor = data?.mentor;

  return (
    <Shell title={firstName ? `Welcome back, ${firstName}` : "My Dashboard"}
      subtitle={mentor ? `Mentored by ${mentor.fullName}` : "Your personal roadmap"}
      right={signOutBtn}>

      <Banner kind="error">{error}</Banner>

      {!mentor && data?.wantsMentor && (
        <Banner kind="warn">
          You've asked for a mentor. A programme administrator is matching you with someone
          whose experience fits your path — you'll see them here once that's done.
        </Banner>
      )}

      {mentor && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["roadmap", "My roadmap"], ["mentor", "My mentor"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "11px 8px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: T.font,
                background: tab === key ? T.green : "#FFFFFF",
                color: tab === key ? "#FFFFFF" : T.mid,
                border: `2px solid ${tab === key ? T.green : T.border}`
              }}>{label}</button>
          ))}
        </div>
      )}

      {(!mentor || tab === "roadmap") && <Roadmap data={data?.roadmap} />}

      {mentor && tab === "mentor" && (
        <div>
          <Card style={{ background: T.greenSoft, borderColor: T.greenLine }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: T.green, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
              Your mentor
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>{mentor.fullName}</div>
            {mentor.profession && <div style={{ fontSize: 13.5, color: T.mid, marginBottom: 4 }}>{mentor.profession}</div>}
            {mentor.location && <div style={{ fontSize: 13, color: T.soft, marginBottom: 10 }}>{mentor.location}</div>}
            {mentor.bio && <p style={{ fontSize: 14, color: T.mid, lineHeight: 1.75, margin: "10px 0" }}>{mentor.bio}</p>}
            {mentor.expertise && (
              <div style={{ fontSize: 13, color: T.mid, marginTop: 8 }}>
                <strong>Expertise:</strong> {mentor.expertise}
              </div>
            )}
            {mentor.availability && (
              <div style={{ fontSize: 13, color: T.mid, marginTop: 4 }}>
                <strong>Availability:</strong> {mentor.availability}
              </div>
            )}
            {mentor.whatsapp && (
              <a href={`https://wa.me/${mentor.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: 14, fontSize: 13, fontWeight: 700, color: T.green }}>
                Message on WhatsApp →
              </a>
            )}
          </Card>

          <div style={{ marginTop: 22 }}>
            <Thread recordId={data.recordId} title={`With ${mentor.fullName}`} />
          </div>
        </div>
      )}
    </Shell>
  );
}
