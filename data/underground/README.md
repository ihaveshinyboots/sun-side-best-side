# Underground tunnel data

`tunnels.json` marks which parts of a journey run underground, so SunSide can
skip the sun-side calculation there (a tunnel has no sun). **Anyone can improve
it with a pull request** — no code needed.

The app fetches this file at runtime, so merged changes reach everyone without a
new app release.

## Format

```jsonc
{
  "version": 1,
  "tunnels": [
    { "mode": "SUBWAY", "route": "NE", "wholeLine": true },
    { "mode": "SUBWAY", "route": "EW", "path": [[1.2861, 103.8270], [1.2896, 103.8168]] },
    { "mode": "BUS", "route": "190", "path": [[1.2900, 103.8400]] }
  ]
}
```

Each entry is matched by `mode` + `route`:

- `mode`: `"SUBWAY"` (train) or `"BUS"`.
- `route`: the line code (`"NE"`, `"EW"`, `"DT"`, …) or the bus number (`"190"`).
- `wholeLine: true`: the entire route is underground.
- `path`: `[[lat, lng], …]` tracing the underground stretch. A part of the
  journey within ~250 m of this path counts as underground. Add a few points
  along the tunnel (roughly one every couple of hundred metres is plenty).

## How to contribute

1. Edit `tunnels.json` (add or fix an entry).
2. Open a pull request describing the tunnel (e.g. "Bus 190 through the CTE
   tunnel").

That's it. Coordinates are WGS84 `lat, lng` (the order shown on Google Maps).
