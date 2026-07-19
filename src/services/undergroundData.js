// Loads the community-editable tunnel dataset from GitHub at runtime, so
// underground coverage can be updated (including new bus tunnels) without
// redeploying the app. Contributors edit data/underground/tunnels.json.
//
// The in-memory dataset starts as the bundled snapshot so underground
// detection works synchronously from the first render; loadTunnels() then
// swaps in the fetched data (cached in localStorage, ~1 day, so repeat loads
// are cheap and it still works offline).
import fallback from "../lib/sun/tunnels.fallback.json";

const CACHE_KEY = "sunside_tunnels_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const DEFAULT_URL =
  "https://raw.githubusercontent.com/ihaveshinyboots/sun-side-best-side/dev/data/underground/tunnels.json";
const TUNNELS_URL = process.env.REACT_APP_UNDERGROUND_URL || DEFAULT_URL;

let tunnels = fallback.tunnels || [];

export function getTunnels() {
  return tunnels;
}

function apply(data) {
  if (data && Array.isArray(data.tunnels)) tunnels = data.tunnels;
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch (e) {
    return null;
  }
}

export async function loadTunnels() {
  const cached = readCache();
  if (cached && Date.now() - cached.at < MAX_AGE_MS) {
    apply(cached.data);
    return;
  }

  try {
    const res = await fetch(TUNNELS_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`tunnels fetch failed (${res.status})`);
    const data = await res.json();
    apply(data);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    } catch (e) {
      /* storage disabled/full: fine, we still have it in memory */
    }
  } catch (e) {
    // Network/parse failure: keep the last good cache if any, else the bundled
    // fallback already in memory.
    if (cached) apply(cached.data);
  }
}
