# SunSide OneMap proxy (Cloudflare Worker)

A small proxy that sits between the app and OneMap. It logs in to OneMap with
your account, caches the ~3-day token, and exposes only the endpoints the app
needs. The frontend never sees the OneMap credentials.

## Endpoints

All responses are OneMap's JSON, passed through as-is. Route data is never
stored (OneMap terms of service).

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `GET /health` | none | Returns `{ ok: true }`. |
| `GET /route` | yes | Routing. `?start=lat,lng&end=lat,lng` plus either `routeType=pt` (transit, with `date=MM-DD-YYYY&time=HH:MM:SS&mode=TRANSIT`) or `routeType=drive` / `walk` / `cycle`. |
| `GET /search` | yes | Address search. `?q=<text>&page=1`. |

Authed endpoints need two headers:

- `X-App-Key: <APP_KEY>` — must match the Worker's `APP_KEY` secret.
- `X-App-Client: sunside/<version>` — must start with `sunside/`.

Browser requests must come from an origin in the `ALLOWED_ORIGINS` list at the
top of `src/index.js` (localhost and the GitHub Pages site are already there).

## Secrets and config

Set three secrets. `APP_KEY` is the shared key the app sends; the email and
password are your OneMap account.

- `ONEMAP_EMAIL`
- `ONEMAP_PASSWORD`
- `APP_KEY`

Optional:

- **KV namespace bound as `TOKEN_KV`** — caches the token across requests. The
  Worker works fine without it (it just fetches a fresh token more often).
- **A 12h Cron Trigger** (`0 */12 * * *`) — refreshes the token early so no
  request waits on it.

To change which sites can call the Worker, edit `ALLOWED_ORIGINS` in `src/index.js`.

## Deploy

Two ways. Pick one.

### A. Cloudflare dashboard (no local tooling)

1. Create a Worker in the dashboard.
2. Paste the contents of `src/index.js` into the editor and **Deploy**.
3. Settings → Variables and Secrets: add `ONEMAP_EMAIL`, `ONEMAP_PASSWORD`, `APP_KEY`.
4. (Optional) Bind a KV namespace as `TOKEN_KV`, and add a Cron Trigger `0 */12 * * *`.

### B. Wrangler CLI

```sh
cd worker
npm install

# secrets (not committed)
npx wrangler secret put ONEMAP_EMAIL
npx wrangler secret put ONEMAP_PASSWORD
npx wrangler secret put APP_KEY

# optional token cache: create the namespace, then put its id in wrangler.toml
npx wrangler kv namespace create TOKEN_KV

npx wrangler deploy   # prints the https://<name>.<subdomain>.workers.dev URL
```

## Local dev

```sh
cp .dev.vars.example .dev.vars   # fill ONEMAP_EMAIL / ONEMAP_PASSWORD / APP_KEY
npx wrangler dev                 # http://localhost:8787
```

Point the app at it: in the repo-root `.env`, set
`REACT_APP_ROUTING_API_URL=http://localhost:8787` and `REACT_APP_APP_KEY` to the
same `APP_KEY`.

## Notes

- `X-App-Key` ships inside the app bundle, so it isn't a real secret. It only
  deters casual abuse. The real server-side controls are the origin allowlist
  and rate limiting.
- Rate limiting is a rough per-IP, per-isolate counter (~30 req/min): a
  deterrent, not a strict quota. Use the Workers Rate Limiting binding if you
  need hard limits.
