import { useState, useEffect, useRef } from "react";
import { messageApi } from "./api.js";
import { T, Button, Banner, fmtTime } from "./ui.jsx";

// Airtable allows roughly 5 requests/second per base, so polling is deliberately
// slow. If BYEP grows past a few dozen concurrent conversations this is the
// first thing that should move to a real database.
const POLL_MS = 12000;

export default function Thread({ recordId, title }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const firstLoad = useRef(true);

  async function load(quiet) {
    try {
      const data = await messageApi.thread(recordId);
      setMessages(data.messages || []);
      setError("");
    } catch (err) {
      if (!quiet) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    firstLoad.current = true;
    setLoading(true);
    load();
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [recordId]);

  useEffect(() => {
    if (firstLoad.current && messages.length) {
      endRef.current?.scrollIntoView({ block: "nearest" });
      firstLoad.current = false;
    }
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const data = await messageApi.send(recordId, text);
      setMessages(prev => [...prev, data.message]);
      setDraft("");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 3, color: T.soft, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>
        {title || "Conversation"}
      </div>

      <Banner kind="error">{error}</Banner>

      <div style={{
        background: "#FFFFFF", border: `1.5px solid ${T.border}`, borderRadius: 10,
        padding: 16, maxHeight: 380, overflowY: "auto", marginBottom: 12
      }}>
        {loading && <div style={{ color: T.soft, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading messages…</div>}

        {!loading && messages.length === 0 && (
          <div style={{ color: T.soft, fontSize: 13.5, textAlign: "center", padding: "24px 12px", lineHeight: 1.7 }}>
            No messages yet. Everything sent here is logged and visible to programme administrators.
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "78%",
              background: m.mine ? T.green : "#F2F0EE",
              color: m.mine ? "#FFFFFF" : T.text,
              borderRadius: 12, padding: "10px 14px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap"
            }}>
              {m.body}
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5 }}>{fmtTime(m.sentAt)}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
          rows={2}
          style={{
            flex: 1, background: "#FFFFFF", border: `2px solid ${T.border}`, borderRadius: 8,
            padding: "11px 14px", fontSize: 14, color: T.text, outline: "none",
            fontFamily: T.font, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box"
          }}
        />
        <Button onClick={send} disabled={sending || !draft.trim()} style={{ padding: "13px 20px" }}>
          {sending ? "…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
