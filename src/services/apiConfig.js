// OneMap config, two modes picked by env (see .env.example):
//  - Worker proxy (default, only safe mode for deploys): calls go through the
//    Cloudflare Worker, which holds the credentials server-side.
//  - Dev direct: if REACT_APP_ONEMAP_TOKEN is set, routing hits OneMap directly
//    with the token in the bundle, so dev only.

export const ONEMAP_TOKEN = process.env.REACT_APP_ONEMAP_TOKEN || "";

// Base URL of the Worker, no trailing slash.
export const WORKER_BASE = (process.env.REACT_APP_ROUTING_API_URL || "").replace(
  /\/+$/,
  ""
);

// Sent as X-App-Key. Ships in the bundle so it's not a real secret; must match
// the Worker's APP_KEY. Real protection is the Worker's CORS allowlist + rate limiting.
export const APP_KEY = process.env.REACT_APP_APP_KEY || "";

// X-App-Client; Worker rejects anything not starting with "sunside/". Keep in
// sync with package.json version.
export const APP_CLIENT = "sunside/0.1.0";

export const useWorker = !ONEMAP_TOKEN;

export function workerHeaders() {
  return { "X-App-Key": APP_KEY, "X-App-Client": APP_CLIENT };
}
