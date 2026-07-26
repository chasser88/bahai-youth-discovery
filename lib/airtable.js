// Shared Airtable REST helper.
// Lives OUTSIDE /api on purpose: files inside /api each count against the
// Vercel Hobby limit of 12 serverless functions. Modules in /lib do not.

const TOKEN = () => process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN;
const BASE = () => process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;

export function airtableConfigured() {
  return Boolean(TOKEN() && BASE());
}

function url(table, qs = "") {
  return `https://api.airtable.com/v0/${BASE()}/${encodeURIComponent(table)}${qs}`;
}

async function call(fullUrl, options = {}) {
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const raw = await res.text();
  let data = null;
  try { data = JSON.parse(raw); } catch { data = null; }

  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || raw.slice(0, 200);
    const err = new Error(`Airtable ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Escape a value for safe interpolation into an Airtable formula string.
export function esc(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

// List records, following pagination. Caps out to avoid runaway loops.
export async function atList(table, { formula, fields, maxRecords, sort, view } = {}) {
  const out = [];
  let offset = null;
  let guard = 0;

  do {
    const params = new URLSearchParams();
    if (formula) params.set("filterByFormula", formula);
    if (view) params.set("view", view);
    if (maxRecords) params.set("maxRecords", String(maxRecords));
    params.set("pageSize", "100");
    (fields || []).forEach(f => params.append("fields[]", f));
    (sort || []).forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      params.append(`sort[${i}][direction]`, s.direction || "asc");
    });
    if (offset) params.set("offset", offset);

    const data = await call(url(table, `?${params.toString()}`));
    out.push(...(data.records || []));
    offset = data.offset || null;
    guard += 1;
  } while (offset && guard < 10);

  return out;
}

export async function atFindOne(table, formula) {
  const rows = await atList(table, { formula, maxRecords: 1 });
  return rows[0] || null;
}

export async function atCreate(table, fields) {
  const data = await call(url(table), {
    method: "POST",
    body: JSON.stringify({ fields, typecast: true })
  });
  return data;
}

export async function atUpdate(table, id, fields) {
  const data = await call(url(table, `/${id}`), {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true })
  });
  return data;
}

export async function atGet(table, id) {
  return call(url(table, `/${id}`));
}

export const TABLES = {
  RESPONSES: "Responses",
  ACCOUNTS: "Accounts",
  ASSIGNMENTS: "Assignments",
  MESSAGES: "Messages",
  NOTES: "Notes"
};
