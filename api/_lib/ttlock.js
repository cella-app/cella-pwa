import crypto from "node:crypto";

const API = "https://api.sciener.com";
const FORM = { "Content-Type": "application/x-www-form-urlencoded" };

let cache = {
  access_token: null,
  refresh_token: null,
  expires_at: 0, // ms epoch
};

const now = () => Date.now();
const md5Lower = (s) => crypto.createHash("md5").update(s).digest("hex");
const env = (k, req = true) => {
  const v = process.env[k];
  if (!v && req) throw new Error(`Missing env: ${k}`);
  return v || "";
};

async function postForm(url, paramsObj) {
  const body = new URLSearchParams(paramsObj);
  const r = await fetch(url, { method: "POST", headers: FORM, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(j?.errmsg || j?.message || `${r.status} ${r.statusText}`);
  return j;
}

async function login() {
  const client_id = env("TTLOCK_CLIENT_ID");
  const client_secret = env("TTLOCK_CLIENT_SECRET");
  const username = env("TTLOCK_USERNAME");

  const pwdMd5 =
    process.env.TTLOCK_PASSWORD_MD5 ||
    (process.env.TTLOCK_PASSWORD_PLAIN
      ? md5Lower(process.env.TTLOCK_PASSWORD_PLAIN)
      : null);
  if (!pwdMd5)
    throw new Error("Provide TTLOCK_PASSWORD_MD5 or TTLOCK_PASSWORD_PLAIN");

  const data = await postForm(`${API}/oauth2/token`, {
    client_id,
    client_secret,
    username,
    password: pwdMd5,
    grant_type: "password",
  });

  cache = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: now() + (data.expires_in ?? 0) * 1000,
  };
  return cache.access_token;
}

async function refreshIfNeeded() {
  if (cache.access_token && now() < cache.expires_at - 60_000)
    return cache.access_token;
  if (cache.refresh_token) {
    try {
      const data = await postForm(`${API}/oauth2/token`, {
        client_id: env("TTLOCK_CLIENT_ID"),
        client_secret: env("TTLOCK_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: cache.refresh_token,
      });
      cache = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: now() + (data.expires_in ?? 0) * 1000,
      };
      return cache.access_token;
    } catch (_) {
      /* fallthrough */
    }
  }
  return login();
}

async function ttReq(path, params = {}) {
  const accessToken = await refreshIfNeeded();
  const body = {
    clientId: env("TTLOCK_CLIENT_ID"),
    accessToken,
    date: now(),
    ...params,
  };
  return postForm(`${API}${path}`, body);
}

// Exported API calls
export async function openState(lockId) {
  return ttReq("/v3/lock/queryOpenState", { lockId: Number(lockId) });
}
export async function unlock(lockId) {
  return ttReq("/v3/lock/unlock", { lockId: Number(lockId) });
}
export async function lock(lockId) {
  return ttReq("/v3/lock/lock", { lockId: Number(lockId) });
}
export async function listLocks() {
  return ttReq("/v3/lock/list", { pageNo: 1, pageSize: 100 });
}

// Minimal header gate
export function requireAdminHeader(req, res) {
  const hdr = req.headers["x-admin-secret"];
  if (!hdr || hdr !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
