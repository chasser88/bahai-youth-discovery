// Client-side API helper.
// Every call reads the response as text first, then tries to parse -- Vercel
// timeout and gateway pages are plain text, and res.json() on those throws
// and hides the real status code.

const TOKEN_KEY = "byep_token";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* private browsing -- session lasts the tab only */ }
}

export function clearSession() {
  setToken("");
}

export async function call(endpoint, payload = {}) {
  let res;
  try {
    res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: getToken(), ...payload })
    });
  } catch (err) {
    console.error("network error", endpoint, err);
    throw new Error("Network error. Check your connection and try again.");
  }

  const raw = await res.text();
  let data = null;
  try { data = JSON.parse(raw); } catch { data = null; }

  if (!res.ok) {
    console.error("api failed", endpoint, res.status, raw.slice(0, 400));

    // A dead session should drop the user back to sign-in rather than loop.
    if (res.status === 401) clearSession();

    throw new Error(
      data?.error ||
      (res.status === 504
        ? "That took too long. Please try again."
        : `Server error (${res.status}). Please try again.`)
    );
  }

  return data || {};
}

// Convenience wrappers
export const authApi = {
  register: p => call("auth", { action: "register", ...p }),
  login: p => call("auth", { action: "login", ...p }),
  me: () => call("auth", { action: "me" }),
  dashboard: () => call("auth", { action: "dashboard" })
};

export const mentorApi = {
  pool: () => call("mentor", { action: "pool" }),
  mentees: () => call("mentor", { action: "mentees" }),
  request: recordId => call("mentor", { action: "request", recordId }),
  notes: recordId => call("mentor", { action: "notes", recordId }),
  addNote: (recordId, type, content) => call("mentor", { action: "addNote", recordId, type, content }),
  toggleGoal: (noteId, done) => call("mentor", { action: "toggleGoal", noteId, done })
};

export const adminApi = {
  overview: () => call("admin", { action: "overview" }),
  mentors: () => call("admin", { action: "mentors" }),
  youth: () => call("admin", { action: "youth" }),
  setMentorStatus: (mentorId, status) => call("admin", { action: "setMentorStatus", mentorId, status }),
  assign: (mentorEmail, recordId) => call("admin", { action: "assign", mentorEmail, recordId }),
  unassign: recordId => call("admin", { action: "unassign", recordId }),
  rejectRequest: requestId => call("admin", { action: "rejectRequest", requestId })
};

export const messageApi = {
  thread: recordId => call("messages", { action: "thread", recordId }),
  send: (recordId, body) => call("messages", { action: "send", recordId, body })
};
