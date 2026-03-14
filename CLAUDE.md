# Garmin Poster — Project Context for AI Sessions

## Project Overview

A React web app that generates shareable workout posters from Garmin/Strava data.

- **Source**: `app.jsx` (JSX source, do not load directly in browser)
- **Compiled**: `app.js` (pre-compiled via sucrase — this is what the browser loads)
- **Styles**: `styles.css`
- **Shell**: `index.html` (loads React UMD + `app.js`, no Babel)
- **Preview server**: `python3 -m http.server 8085 --directory /Users/arthur_dealmeida/Downloads/garmin-poster`

## After Every Edit to `app.jsx`

**You must recompile before the browser will see changes:**

```bash
node /tmp/compile_jsx.js
```

The compile script lives at `/tmp/compile_jsx.js`:
```js
const {transform} = require('/Users/arthur_dealmeida/Downloads/GarminPosters/node_modules/sucrase');
const fs = require('fs');
const src = fs.readFileSync('/Users/arthur_dealmeida/Downloads/garmin-poster/app.jsx','utf8');
const out = transform(src, {transforms:['jsx']}).code;
fs.writeFileSync('/Users/arthur_dealmeida/Downloads/garmin-poster/app.js', out);
console.log('Done, lines:', out.split('\n').length);
```

---

## Architecture Decisions

### Why pre-compiled JS (not Babel standalone)?
Babel standalone blocks the main thread when compiling large files (1500+ lines), causing blank screens and timeouts. Sucrase pre-compiles `app.jsx` → `app.js` once; the browser just loads plain JS.

### Why not a build toolchain?
No npm, no Vite, no bundler. React 18 is loaded from CDN (unpkg UMD). Sucrase is used only as a one-shot JSX transformer from an existing node_modules.

### Responsive layout
Uses a `useWindowSize()` hook. `isMobile = winW < 1024`. Mobile and desktop render completely different JSX trees — CSS-only responsive was insufficient for this layout.

### Persistence
User preferences saved to `localStorage` under key `posterprefs_v1`.

---

## Mobile UX

The mobile layout (< 1024px) is designed for post-workout use — quick to share.

### Bottom bar states
**State A — no data connected** (`!hasRealData`):
```
[ ⚡ Connect Strava  ────────────────── ]   ← full-width primary CTA
[ Import GPX ]   [ Customize ]              ← secondary row
```

**State B — data loaded** (`hasRealData`):
```
[ workout dropdown ▾ ]   [ Customize ⚙ ]
[ ↑ Download / Share PNG              ]
```

### Swipe to cycle styles
Horizontal swipe on the poster area cycles through poster styles. Dot indicators below the poster show current style.

### Customize modal
Bottom sheet. Order: Style → Colors → City → divider → Activity source → Format → Background.

---

## Strava OAuth Flow

- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` defined as constants at top of `app.jsx`
- Redirect URI: `window.location.origin + window.location.pathname`
- Scope: `activity:read_all`

### Token storage (localStorage keys)
| Key | Value |
|-----|-------|
| `strava_token` | access token |
| `strava_token_expiry` | unix epoch seconds |
| `strava_refresh_token` | refresh token (persists across sessions) |

### Silent refresh on return visits
On mount, if `strava_token` is expired but `strava_refresh_token` exists, the app silently exchanges it for a new token (`grant_type: "refresh_token"`) before showing any UI. The user sees a brief loading state, then their latest activities — no re-auth needed.

---

## UI Layout (Desktop)

- **Left panel**: `position:fixed`, 260px, 24px from edges, `border-radius:16px`, frosted glass
- **Right panel**: same, opposite side
- **Poster area**: fills viewport between panels; scaled via `ResizeObserver`

---

## Poster Styles (7 total)

`Street` · `Minimal` · `Bold` · `Neon` · `Retro` · `Swiss` · `Route`

- Registered in `STYLES` array, dispatched via `POSTER_MAP`
- `Route` renders GPS path as logo mark (RDP + Catmull-Rom → cubic bezier)

---

## Color System

- 8 `COLOR_COMBOS` presets: `Noir`, `Flame`, `Gold`, `Mint`, `Ice`, `Brass`, `Rose`, `Chalk`
- Each: `{ name, bg, text }` — bg and text always travel together
- State: `comboIdx` → destructures to `{ text: color, bg: bgColor }`

---

## Background Image System

```js
BG_PRESETS = [null, BG_IMAGE]
effectiveBg = customBg || BG_PRESETS[bgPresetIdx]
```

- `bgPresetIdx` defaults to `1` (photo visible)
- `customBg` = base64 data URL from user upload
- All poster components: `{photo && <img .../>}` — no fallback to `BG_IMAGE` inside components

---

## GPX / Workout Data

- `parseGPX(text, filename)` — Haversine distance, elevation gain, avg HR, pace splits, sampled route (max 600 points)
- `gpxWorkout` state prepended to `WORKOUTS_EFF`
- `route` prop flows: `Poster` → all poster components → `PosterStage` → export div

---

## Format Selector

```js
FORMATS = [
  { id:'portrait', label:'2:3',  w:600, h:900  },
  { id:'square',   label:'1:1',  w:600, h:600  },
  { id:'stories',  label:'9:16', w:600, h:1067 },
]
```

---

## Key App State

```js
idx            // poster style index into STYLES
comboIdx       // color combo index into COLOR_COMBOS
workoutIdx     // selected workout
formatIdx      // selected format
bgPresetIdx    // 0=blank, 1=BG_IMAGE
customBg       // null or base64 data URL
gpxWorkout     // null or parsed GPX workout object
customCity     // string override for city/title label
stravaToken    // null or access token string
stravaActs     // array of Strava activities mapped to workout format
hasRealData    // !!(stravaToken || gpxWorkout || urlWorkout)
dropOpen       // activity dropdown open (mobile)
customizeOpen  // Customize bottom sheet open (mobile)
toast          // { icon, msg } or null
downloading    // export in progress
isMobile       // winW < 1024
```

---

## Pending Features / Ideas

### Discussed but not scoped
- **Tapered stroke on Route style**: stroke width varies with GPS speed
- **City fingerprint**: overlay many GPX routes normalized to same canvas
- **Oscilloscope**: unroll lat/lon over time as a waveform
- **HR pulse ring**: route in polar coords, heart rate as radius
- **Split clock**: km splits as radial bar chart

---

## Deployment

Upload the 4 files to any static host:
- `index.html`
- `app.js` (compiled — required)
- `app.jsx` (source — optional but good to keep)
- `styles.css`

**GitHub Pages**, Netlify, or Vercel all work. No build step needed at deploy time.

---

## Known Bugs Fixed (don't reintroduce)

1. `PosterStreet` hardcoded `const bgSrc = BG_IMAGE` ignoring `photo` prop → fixed to use prop
2. All poster components used `photo || BG_IMAGE` fallback → replaced with `{photo && <img/>}`
3. `hasRealData` referenced `stravaToken` before its `useState` declaration (TDZ error) → moved after declaration
4. `fmtDate` declared twice (`const` at line ~142, `function` at ~806) → second renamed to `fmtDateShort`
