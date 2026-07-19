# Sun Side Best Side

Tells you which side of the train or bus the sun will be on during your Singapore
commute, so you can pick the shaded seat (or chase the sun, if that's your thing).

Enter where you're starting and where you're going. The app routes the journey and
works out, leg by leg, whether the sun lands on your **left** or **right** based on
the direction you're travelling and where the sun sits in the sky at that time.

Live app: https://ihaveshinyboots.github.io/sun-side-best-side

## Why you need this app

- **Mirror-shine shoes:** sit on the sunny side, let your wax melt, and you'll have a reason to polish them again before your big meeting. Shoe polishing is therapy, right?
- **New phone:** get the most out of that peak-brightness screen by basking in the sun.
- **Sun tan:** who needs a beach vacation when you can top up on your daily commute?
- **Sunflower mimicry:** perfect your impression by always turning to face the sun. Impress your friends, confuse your enemies.
- **Warm up your snacks:** forgot lunch? Leave your snack in the sun for a bit and enjoy a warm meal.

## How it works

1. You pick a start and destination (search is powered by OneMap).
2. The route comes from OneMap's routing API, proxied through a small Cloudflare Worker so the app never holds any API credentials.
3. Each leg's path is broken into segments. For each segment we compare the travel bearing against the sun's position (via `suncalc`) at that segment's actual clock time, then tally left vs right.

No Google APIs, no paid services. Just OneMap's free API and free-tier Cloudflare.

## Tech stack

- React (Create React App)
- Leaflet for the map
- `suncalc` for the sun position
- `react-i18next` for the four official languages (English, 中文, Malay, Tamil)
- Installable as a PWA, and wrapped with [Capacitor](https://capacitorjs.com) into native iOS/Android apps from the same build
- A Cloudflare Worker (`/worker`) that proxies OneMap and keeps the credentials server-side

## Project structure

```
src/
  App.js              app shell + state
  components/         UI: MapView, PlaceSearch, RouteBreakdown, RouteLegend
  lib/                logic: routing model, polyline decode, sun math (sun/)
    __tests__/        Jest tests
    __fixtures__/     sample API responses used by tests
  services/           API clients: onemap (search), routing, apiConfig, undergroundData
  i18n/               translations (en, zh, ms, ta) + setup
  assets/             SVGs (logo, otters, fish)
  styles/             app-wide CSS
data/underground/     community-editable tunnel data (tunnels.json) — see its README
worker/               Cloudflare Worker proxy (see worker/README.md)
```

## Quick start

```sh
npm install
cp .env.example .env    # then fill in the values (see below)
npm start               # http://localhost:3000
```

You need a routing backend. Two options:

- **Easiest:** point `.env` at a running Cloudflare Worker (see [worker/README.md](worker/README.md)) by setting `REACT_APP_ROUTING_API_URL` and `REACT_APP_APP_KEY`.
- **Local dev shortcut:** set `REACT_APP_ONEMAP_TOKEN` to a OneMap token to call OneMap directly, skipping the Worker. Tokens expire after ~3 days. Never commit this or ship a build with it set.

`.env` is git-ignored. See `.env.example` for every variable and what it does.

## Install it / run on mobile

**As a web app (PWA) — no store needed.** Open the live site on your phone and
"Add to Home Screen" (Share menu on iOS Safari; the browser menu on Android). It
then launches full-screen like an app.

**As a native iOS / Android app.** The same web build is wrapped with Capacitor:

```sh
# one-time on your machine (needs Xcode for iOS / Android Studio for Android):
npx cap add ios
npx cap add android

# build the web app and open the native project:
npm run cap:ios       # opens Xcode
npm run cap:android   # opens Android Studio
```

`npm run build:native` makes a relative-path build (Capacitor serves the app
locally, so it can't use the GitHub Pages sub-path). Everything stays in this one
repo — the `ios/` and `android/` folders are created next to the web app.

## Tests

```sh
npm test        # Jest, runs the sun math + parser tests
```

## Contributing

New here? Good first steps:

- Run the app locally with the dev token option above (no Worker setup needed).
- The sun math lives in [src/lib/sun/](src/lib/sun/) and is unit-tested. Changes there should keep the tests green (`npm test`) and add a test for anything new.
- UI copy stays plain and casual. "Sit on the right" beats "Optimize your seating experience!"
- **Add underground tunnels** (trains or buses) by editing [data/underground/tunnels.json](data/underground/tunnels.json) — see [its README](data/underground/README.md). No code needed; the app fetches it at runtime, so merged edits reach everyone.
- **Improve a translation** in [src/i18n/locales/](src/i18n/locales/) — the 中文/Malay/Tamil first pass especially needs a native review.
- One known limitation: routing is line-specific for MRT and has no shortest-path across lines yet (e.g. EW Jurong East to NS Bukit Batok won't route, but NS to NS will). That's a great area to help with.

## License

The code is open source under the [MIT License](LICENSE). OneMap data is used
through its official API under OneMap's terms (no redistribution of the raw
data) — the licence covers this app's code, not OneMap's underlying datasets.

## Support

If this saved you from a sweaty commute: https://buymeacoffee.com/ihaveshinyboots
