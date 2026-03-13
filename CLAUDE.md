# Garmin Poster — Project Context for AI Sessions

## Project Overview

A single-file React app that generates shareable workout posters from Garmin/Strava data.

- **Main file**: `index.html` (everything is here — no other files needed)
- **Open**: directly in any browser via `file://` — no server, no install
- **Export**: `html2canvas` loaded from CDN on demand → 3× scale PNG download

## Architecture Decisions

### Why a single file?
Opening multiple files via `file://` protocol triggers CORS errors in Chrome — external `.js` and `.css` files get blocked. Inlining everything into one HTML file sidesteps this entirely.

### Why Babel standalone?
No build tooling needed. Babel loads from CDN and compiles JSX in-browser at page load. Small startup delay (~1s) is acceptable for a local tool.

### Persistence
User preferences saved to `localStorage` under key `posterprefs_v1`.

---

## UI Layout

- **Dark theme**: `#000000` canvas background
- **Right-side panel**: `position:fixed`, 260px wide, 24px from all edges, `border-radius:16px`, frosted glass (`rgba(8,8,8,0.92)` + `backdrop-filter:blur(28px)`)
- **Poster area**: fills viewport left of panel; poster scaled via `ResizeObserver` at 70% of available space
- **Poster**: `24px border-radius`, `overflow:hidden`

---

## Poster Styles (7 total)

`Street` · `Minimal` · `Bold` · `Neon` · `Retro` · `Swiss` · `Route`

- Registered in `STYLES` array, dispatched via `POSTER_MAP` object
- `Route` style renders the GPS path as a simplified + smoothed logo mark (RDP algorithm + Catmull-Rom → cubic bezier); shows a placeholder if no GPX is loaded

---

## Color System

- 8 `COLOR_COMBOS` presets: `Noir`, `Flame`, `Gold`, `Mint`, `Ice`, `Brass`, `Rose`, `Chalk`
- Each preset: `{ name, bg, text }` — bg and text always travel together, no single color picker
- State: `comboIdx` → destructures to `{ text: color, bg: bgColor }`

---

## Background Image System

```js
BG_PRESETS = [null, BG_IMAGE]   // null = blank/solid color
effectiveBg = customBg || BG_PRESETS[bgPresetIdx]
```

- `bgPresetIdx` defaults to `1` (photo visible)
- `customBg` = base64 data URL from user file upload
- All poster components use `{photo && <img .../>}` — **no fallback** to `BG_IMAGE` inside components (this was a deliberate fix to make the blank option work)

---

## GPX / Workout Data

- `parseGPX(text, filename)` — uses `DOMParser`, Haversine distance, elevation gain, avg HR, pace splits, sampled route path (max 600 points as `[[lat, lon], ...]`)
- `gpxWorkout` state prepended to `WORKOUTS_EFF`
- `route` prop flows through: `Poster` dispatcher → all poster components → `PosterStage` → export div

---

## Format Selector

```js
FORMATS = [
  { id:'portrait', label:'2:3',  w:600, h:900  },
  { id:'square',   label:'1:1',  w:600, h:600  },
  { id:'stories',  label:'9:16', w:600, h:1067 },
]
```

- `formatIdx` state
- `PosterStage` scale uses `fmt.h` (not hardcoded 900)
- Export hidden div dimensions: `fmt.w × fmt.h`

---

## Panel Controls Order

1. Logo ("Garmin Poster")
2. Format selector (Portrait / Square / Stories)
3. Activity dropdown
4. Poster Style pill buttons
5. City / Title text input
6. Color Scheme split swatches
7. Background Image (blank ✕ + photo preset + uploaded thumbnail with ✕)
8. Upload photo button
9. GPX import button
10. Spacer (`flex:1`)
11. Download / Share button

---

## Key App State

```js
idx          // poster style index into STYLES
comboIdx     // color combo index into COLOR_COMBOS
workoutIdx   // selected workout
formatIdx    // selected format
bgPresetIdx  // 0=blank, 1=BG_IMAGE
customBg     // null or base64 data URL from user upload
gpxWorkout   // null or parsed GPX workout object
customCity   // string override for city/title label
dropOpen     // activity dropdown open state
downloading  // export in progress flag
```

---

## Pending Features / Ideas

### Planned (approved, not yet implemented)
- **Route style** (`PosterRoute`): GPS path as logo mark — RDP simplification + Catmull-Rom smoothing, large distance stat at bottom, placeholder when no GPX loaded. Register in `STYLES` + `POSTER_MAP`.

### Discussed but not scoped
- **Tapered stroke on Route style**: stroke width varies with GPS speed from parsed data
- **City fingerprint**: overlay many GPX routes (normalized to same canvas) to show movement density
- **Oscilloscope**: unroll lat/lon over time as a waveform
- **HR pulse ring**: route in polar coords, heart rate as radius
- **Split clock**: km splits as radial bar chart

---

## Deployment

Publish as-is — no build step needed. Options:
- **GitHub Pages**: push file to repo, enable Pages
- **Netlify / Vercel**: drag and drop the HTML file
- `html2canvas` (export) requires internet; everything else works offline

---

## Known Bugs Fixed (don't reintroduce)

1. `PosterStreet` used to hardcode `const bgSrc = BG_IMAGE` ignoring the `photo` prop → fixed by using the prop
2. All poster components used `photo || BG_IMAGE` fallback → replaced with `{photo && <img/>}` so blank actually works
3. Multiple files caused CORS errors on `file://` → consolidated into single HTML file
