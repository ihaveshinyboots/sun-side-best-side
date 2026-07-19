// OneMap place/station search. Goes through the Worker by default; dev mode
// (REACT_APP_ONEMAP_TOKEN set) hits OneMap's public tokenless search directly.

import { WORKER_BASE, useWorker, workerHeaders } from "./apiConfig";

const ONEMAP_SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search";

// Map raw result rows to the shape the UI uses. Worker and direct endpoint
// both return { results: [...] }.
function toPlaces(data) {
  return (data.results || [])
    .filter((r) => r.LATITUDE && r.LONGITUDE)
    .map((r) => ({
      value: r.SEARCHVAL,
      lat: Number(r.LATITUDE),
      lng: Number(r.LONGITUDE),
      address: r.ADDRESS || "",
    }));
}

/**
 * Search OneMap for places/stations matching `term`.
 * @param {string} term
 * @returns {Promise<Array<{value:string, lat:number, lng:number, address:string}>>}
 */
export async function searchPlaces(term) {
  const q = (term || "").trim();
  if (q.length < 2) return [];

  let res;
  if (useWorker) {
    if (!WORKER_BASE) {
      throw new Error("No search target: set REACT_APP_ROUTING_API_URL.");
    }
    const params = new URLSearchParams({ q });
    res = await fetch(`${WORKER_BASE}/search?${params.toString()}`, {
      headers: workerHeaders(),
    });
  } else {
    // Dev: OneMap search direct.
    const params = new URLSearchParams({
      searchVal: q,
      returnGeom: "Y",
      getAddrDetails: "Y",
      pageNum: "1",
    });
    res = await fetch(`${ONEMAP_SEARCH_URL}?${params.toString()}`);
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("Search proxy rejected the app key (401).");
    if (res.status === 429) throw new Error("Rate limit hit (429). Try again shortly.");
    throw new Error(`OneMap search failed (${res.status})`);
  }
  return toPlaces(await res.json());
}

export default searchPlaces;
