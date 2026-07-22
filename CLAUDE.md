# CLAUDE.md

## What this app is

SunSide tells commuters in Singapore which side of the train or bus the sun will
be on, so they can pick the shaded seat. The user picks an origin and
destination, the app routes the journey and reports the sun side per leg, e.g.
"Sun mostly on your LEFT."

## Hard constraints

- **Zero infrastructure cost.** No Google APIs, no paid services. Free tiers only (OneMap, Cloudflare Workers, GitHub Pages).
- **No scraping.** OneMap is used through its official free API only.
- **OneMap ToS: no redistribution.** The Worker proxy serves this app only. Don't add raw-data export, bulk download, or open-gateway features. Users see computed results (sun side, route lines), not the underlying datasets.
- **No OneMap credentials in the client.** Email/password live in the Worker. The app only holds `X-App-Key`, which ships in the bundle and is not a real secret.

## Stack

- React (Create React App), JavaScript, function components + hooks
- Leaflet (`react-leaflet`) with OpenStreetMap tiles
- `suncalc` for the sun position
- OneMap routing + search behind a Cloudflare Worker proxy (`/worker`)
- Deployed to GitHub Pages (`npm run deploy`)

## Data flow

`origin/dest` (from OneMap search) → `services/routing.fetchRoute` (transit `pt`
or `drive`, via the Worker) → `lib/routeModel.buildRouteOptions` →
`lib/sunRoute` → `components/MapView` draws the coloured lines and start/end
otter markers.

### How `lib/sunRoute` scores a leg (per segment)

It decodes the leg's polyline into N points, giving **N−1 segments** (a segment
is the line between two consecutive points). For each segment it:

1. Interpolates the clock time by segment index across the leg's real
   `startTime`→`endTime`: `t = legStart + (legEnd − legStart) × (i / nSeg)`. So a
   10-point / 10-minute MRT leg scores segment 1 at ~10:00, segment 2 at ~10:01,
   … the last at ~10:09.
2. Calls `lib/sun/sunPosition.calculateSunPosition(segment, t)` → left/right from
   the segment's travel bearing vs the sun direction at `t`.
3. Adds the segment's **length in metres** to a left/right tally (so the
   percentages track distance, not raw segment count).

Timing is **per leg** using OneMap's own leg times, not one timestamp for the
trip and not a blind divide of the total time across all points — a
walk-then-MRT trip scores the walk points across the walk's window and the MRT
points across the ride's window. Walk legs and underground/night segments get no
sun side (grey, not tallied).

## Layout

```
src/
  App.js
  components/   MapView, PlaceSearch, RouteBreakdown, RouteLegend (+ their css)
  lib/          routeModel, polyline, sunRoute, transitLines, time, sun/sunPosition
                __tests__/  __fixtures__/ (sample API responses)
  services/     apiConfig, onemap (search), routing
  assets/       svgs   styles/  app-wide css
worker/         Cloudflare Worker proxy (see worker/README.md)
```

## Sun math (src/lib/sun/sunPosition.js) — keep pure and unit-tested

- `calculateAzimuth` gives the travel bearing between two points, degrees clockwise from north.
- Sun side is the sign of the cross product between the travel direction and the sun direction: positive → left, negative → right.
- suncalc gotcha: its azimuth is radians measured from **south, positive westward**. Keep all suncalc access inside this file so the convention lives in one place.

## Conventions

- Timezone: SGT (UTC+8, no DST).
- Coordinates: WGS84 lat/lon in app code. OneMap also returns SVY21 X/Y; ignore it.
- UI copy: plain and casual, no em dashes, no hype. "Sit on the right" beats "Optimize your seating experience!"
- Comments: terse and human. Document real gotchas, not the obvious.
- Sun math and parsers get Jest tests, with fixtures in `src/lib/__fixtures__/`.

## Commands

- `npm install`, `npm start`, `npm test`, `npm run build`, `npm run deploy`
- Worker: `cd worker && npx wrangler dev` / `npx wrangler deploy` (or paste `worker/src/index.js` into the Cloudflare dashboard)

## Known limitations

- Underground segments are skipped (grey, no sun side) via `lib/sun/underground.js`, driven by the community-editable `data/underground/tunnels.json` (fetched at runtime by `services/undergroundData.js`, with `lib/sun/tunnels.fallback.json` as the bundled offline fallback). A tunnel entry is keyed by mode+route and is either `wholeLine` or a coordinate `path`; both rail and bus are supported. Not yet covered: road tunnels on drive routes.

## Do not

- Don't add Google Maps SDK, Directions API, or any billing-tied dependency.
- Don't embed OneMap tokens/emails or commit the Worker secrets.
- Don't compute or display a sun side at night (sun below the horizon).
