/**
 * SunSide OneMap proxy (Cloudflare Worker).
 *
 * Keeps the OneMap login server-side and exposes just what the app needs:
 *   GET /health   liveness, no auth
 *   GET /route    routing (transit + drive), needs X-App-Key
 *   GET /search   address search, needs X-App-Key
 *
 * Setup: secrets ONEMAP_EMAIL, ONEMAP_PASSWORD, APP_KEY; optional KV binding
 * TOKEN_KV to cache the token; optional 12h Cron Trigger to refresh it early.
 * Add your site's origin to ALLOWED_ORIGINS below.
 */

const ONEMAP_BASE = "https://www.onemap.gov.sg";
const TOKEN_CACHE_KEY = "onemap_token_v1";

/** Refresh the token when it has less than this long left. */
const REFRESH_MARGIN_MS = 12 * 60 * 60 * 1000;

/** Cron refresh threshold: renew once the token is past mid-life (~36h left). */
const PROACTIVE_REFRESH_MS = 36 * 60 * 60 * 1000;

// The app sends X-App-Client: sunside/<version>. Used for logging and as a
// version kill-switch, not as real auth.
const REQUIRED_CLIENT_PREFIX = "sunside/";

// Websites allowed to call this Worker. An origin is scheme + host (+ port),
// no path, so GitHub Pages at username.github.io/repo is "https://username.github.io".
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://ihaveshinyboots.github.io",
  // Native apps (Capacitor): iOS serves from capacitor://localhost, Android
  // from http/https://localhost.
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-App-Key, X-App-Client, Content-Type",
};

// In-memory token cache, per Worker isolate.
let memToken = null;

// Rough per-IP rate limit. Per-isolate only, so it's a deterrent, not a hard cap.
const WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 30;
const buckets = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// OneMap token management
// ---------------------------------------------------------------------------

async function fetchNewToken(env) {
  const res = await fetch(`${ONEMAP_BASE}/api/auth/post/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: env.ONEMAP_EMAIL,
      password: env.ONEMAP_PASSWORD,
    }),
  });
  if (!res.ok) {
    throw new Error(`OneMap auth failed with status ${res.status}`);
  }
  const data = await res.json();
  const expiresAt = Number(data.expiry_timestamp) * 1000; // epoch seconds → ms
  if (!data.access_token || Number.isNaN(expiresAt)) {
    throw new Error("OneMap auth returned an unexpected payload");
  }
  return { token: data.access_token, expiresAt };
}

async function getToken(env, forceRefresh = false) {
  const now = Date.now();
  // KV is optional (just a cache). If it's not bound, fall back to a fresh fetch.
  const kv = env.TOKEN_KV || null;

  if (!forceRefresh) {
    if (memToken && memToken.expiresAt - now > REFRESH_MARGIN_MS) {
      return memToken;
    }
    const cached = kv ? await kv.get(TOKEN_CACHE_KEY, "json") : null;
    if (cached && cached.expiresAt - now > REFRESH_MARGIN_MS) {
      memToken = cached;
      return cached;
    }
  }

  const fresh = await fetchNewToken(env);
  memToken = fresh;

  // KV `expiration` must be in the future; guard against near-expired tokens.
  const expirationSeconds = Math.floor(fresh.expiresAt / 1000);
  if (kv && expirationSeconds > Math.floor(now / 1000) + 60) {
    await kv.put(TOKEN_CACHE_KEY, JSON.stringify(fresh), {
      expiration: expirationSeconds,
    });
  }
  return fresh;
}

/**
 * Fetch an upstream OneMap URL with the token attached. If OneMap rejects the
 * token (revoked early, clock drift), refresh once and retry.
 * Note: OneMap docs show the raw token in the Authorization header. If OneMap
 * ever starts rejecting valid tokens, try prefixing with "Bearer ".
 */
async function proxyWithToken(target, env) {
  let token = await getToken(env);
  let upstream = await fetch(target.toString(), {
    headers: { Authorization: token.token },
  });

  if (upstream.status === 401 || upstream.status === 403) {
    token = await getToken(env, true);
    upstream = await fetch(target.toString(), {
      headers: { Authorization: token.token },
    });
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const SG_BOUNDS = { minLat: 1.13, maxLat: 1.5, minLng: 103.55, maxLng: 104.15 };

function parseLatLng(raw) {
  if (!raw) return null;
  const match = raw
    .trim()
    .match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < SG_BOUNDS.minLat || lat > SG_BOUNDS.maxLat) return null;
  if (lng < SG_BOUNDS.minLng || lng > SG_BOUNDS.maxLng) return null;
  return `${lat},${lng}`;
}

/** Current date/time in SGT (UTC+8, no DST) in OneMap's expected formats. */
function sgtNow() {
  const sgt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${pad(sgt.getUTCMonth() + 1)}-${pad(sgt.getUTCDate())}-${sgt.getUTCFullYear()}`,
    time: `${pad(sgt.getUTCHours())}:${pad(sgt.getUTCMinutes())}:00`,
  };
}

function clampInt(raw, fallback, min, max) {
  const n = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const PT_MODES = new Set(["TRANSIT", "BUS", "RAIL"]);

const NON_PT_ROUTE_TYPES = new Set(["drive", "walk", "cycle"]);

async function handleRoute(url, env) {
  const start = parseLatLng(url.searchParams.get("start"));
  const end = parseLatLng(url.searchParams.get("end"));
  if (!start || !end) {
    return json(
      { error: "start and end must be 'lat,lng' within Singapore" },
      400,
    );
  }

  // Non-transit routing (drive/walk/cycle) takes no date/time/mode — OneMap
  // returns route_geometry + route_summary directly.
  const routeType = (url.searchParams.get("routeType") ?? "pt").toLowerCase();
  if (NON_PT_ROUTE_TYPES.has(routeType)) {
    const target = new URL(`${ONEMAP_BASE}/api/public/routingsvc/route`);
    target.searchParams.set("start", start);
    target.searchParams.set("end", end);
    target.searchParams.set("routeType", routeType);
    return proxyWithToken(target, env);
  }

  const defaults = sgtNow();
  const date = url.searchParams.get("date") ?? defaults.date; // MM-DD-YYYY
  const time = url.searchParams.get("time") ?? defaults.time; // HH:MM:SS
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    return json({ error: "date must be MM-DD-YYYY" }, 400);
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return json({ error: "time must be HH:MM:SS" }, 400);
  }

  const mode = (url.searchParams.get("mode") ?? "TRANSIT").toUpperCase();
  if (!PT_MODES.has(mode)) {
    return json({ error: "mode must be TRANSIT, BUS or RAIL" }, 400);
  }

  const maxWalkDistance = clampInt(
    url.searchParams.get("maxWalkDistance"),
    1000,
    100,
    2000,
  );
  const numItineraries = clampInt(
    url.searchParams.get("numItineraries"),
    3,
    1,
    3,
  );

  const target = new URL(`${ONEMAP_BASE}/api/public/routingsvc/route`);
  target.searchParams.set("start", start);
  target.searchParams.set("end", end);
  target.searchParams.set("routeType", "pt");
  target.searchParams.set("date", date);
  target.searchParams.set("time", time);
  target.searchParams.set("mode", mode);
  target.searchParams.set("maxWalkDistance", String(maxWalkDistance));
  target.searchParams.set("numItineraries", String(numItineraries));

  return proxyWithToken(target, env);
}

async function handleSearch(url, env) {
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2 || query.length > 100) {
    return json({ error: "q must be between 2 and 100 characters" }, 400);
  }
  const page = clampInt(url.searchParams.get("page"), 1, 1, 20);

  const target = new URL(`${ONEMAP_BASE}/api/common/elastic/search`);
  target.searchParams.set("searchVal", query);
  target.searchParams.set("returnGeom", "Y");
  target.searchParams.set("getAddrDetails", "Y");
  target.searchParams.set("pageNum", String(page));

  return proxyWithToken(target, env);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      // CORS preflight: only approve allowlisted origins.
      const origin = request.headers.get("Origin");
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, {
          status: 204,
          headers: {
            ...CORS_HEADERS,
            "Access-Control-Allow-Origin": origin,
            Vary: "Origin",
          },
        });
      }
      return new Response(null, { status: 204, headers: { Vary: "Origin" } });
    }
    if (request.method !== "GET") {
      return json({ error: "only GET is supported" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    // Reject unknown browser origins. Non-browser callers (no Origin) skip this.
    const origin = request.headers.get("Origin");
    if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "forbidden origin" }, 403);
    }

    const appKey = request.headers.get("X-App-Key");
    if (!appKey || appKey !== env.APP_KEY) {
      return json({ error: "unauthorized" }, 401);
    }

    const client = request.headers.get("X-App-Client") ?? "";
    if (!client.startsWith(REQUIRED_CLIENT_PREFIX)) {
      return json({ error: "unauthorized" }, 401);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (isRateLimited(ip)) {
      return json({ error: "rate limited, slow down" }, 429);
    }

    try {
      switch (url.pathname) {
        case "/route":
          return await handleRoute(url, env);
        case "/search":
          return await handleSearch(url, env);
        default:
          return json({ error: "not found" }, 404);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return json({ error: message }, 502);
    }
  },

  // Optional cron: refresh the token early so requests don't wait on it.
  async scheduled(_controller, env) {
    const cached =
      memToken ??
      (env.TOKEN_KV ? await env.TOKEN_KV.get(TOKEN_CACHE_KEY, "json") : null);
    if (!cached || cached.expiresAt - Date.now() < PROACTIVE_REFRESH_MS) {
      await getToken(env, true);
    }
  },
};
