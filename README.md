# Volume Master

Per-tab volume control with up to **600% boost** for Chrome and Firefox.
Dark-mode-first, minimal UI. TypeScript + WXT + React + TanStack Router.

A clean-slate rewrite of the upstream "Volume Master" extension. Strips the
ad/upsell layer, drops Chrome-only `tabCapture` + offscreen-document
machinery in favor of a content-script WebAudio gain graph that works
identically on Chrome and Firefox.

## Quickstart

```sh
bun install            # WXT auto-runs `wxt prepare` to generate types
bun run icons          # rasterize assets/icon.svg → public/icon/*.png
bun run dev            # Chrome dev (loads .output/chrome-mv3 in a temp profile)
bun run dev:firefox    # Firefox dev (loads .output/firefox-mv2)
```

## Quality gates

```sh
bun run check          # ultracite (biome) lint + format
bun run typecheck      # tsgo --noEmit
bun test               # bun test (co-located __tests__/)
```

## Build & ship

```sh
bun run build:all      # chrome-mv3 + firefox-mv2 production builds
bun run zip:all        # zipped artifacts under dist/
bun run changeset      # record a release intent → .changeset/*.md
```

Tag a commit `vX.Y.Z` to trigger `.github/workflows/release.yml`. CI lints,
typechecks, tests, builds both browsers, and attaches the resulting zips to
the GitHub release. No store-publishing automation — pushes to the Chrome
Web Store / Firefox Add-ons stay manual.

### Loading the unpacked build

**Chrome / Brave / Edge** — `chrome://extensions` → enable Developer mode →
"Load unpacked" → select `dist/chrome-mv3/`.

**Firefox** — `about:debugging#/runtime/this-firefox` → "Load Temporary
Add-on" → pick any file inside `dist/firefox-mv2/`.

## Architecture

```
popup ──msg──▶ background ──msg──▶ content script (each tab)
 (UI)            (router)            (WebAudio gain graph)
```

| Path | Role |
|---|---|
| `src/entrypoints/background.ts` | MV3 background. Routes popup messages, persists per-tab gain, broadcasts updates, GCs storage on tab close. |
| `src/entrypoints/content.ts` | Wraps every `<audio>`/`<video>` in `MediaElementAudioSourceNode → GainNode → destination`. `MutationObserver` catches dynamically-added media. |
| `src/entrypoints/popup/` | React 19 + TanStack Router popup (`/`, `/settings`). |
| `src/audio/gain-graph.ts` | WebAudio plumbing. Singleton `AudioContext` + `GainNode` per page, idempotent `attach()` per element. |
| `src/messaging/` | `protocol.ts` — typed messages with shape validation returning `Result`. `bus.ts` — `send` / `sendToTab` / `onMessage`. |
| `src/storage/volume-store.ts` | `browser.storage.session`-backed per-tab gain map. In-memory fallback for tests. |
| `src/tabs/audible.ts` | `browser.tabs.query` wrapper that hydrates tabs with their stored gain. |
| `src/ui/` | Routes, components (`VolumeSlider`, `TabList`, `TabRow`), and `theme.css`. |
| `src/config.ts` | `VOLUME_MIN/MAX/DEFAULT`, presets, storage prefixes. |
| `assets/icon.svg` | Source vector. `scripts/rasterize-icons.ts` → 16/32/48/128 PNGs. |

### Why content-script WebAudio (and not `tabCapture`)?

The upstream extension used `chrome.tabCapture.getMediaStreamId` + an
offscreen document to run a `MediaStreamAudioSourceNode`. That API does not
exist on Firefox MV3, and the offscreen-document machinery is Chromium-only,
so a Firefox port required a second codepath.

Wrapping individual `HTMLMediaElement`s in a `MediaElementAudioSourceNode`
gain graph from a content script gives identical behavior on both browsers
with **no** extra permissions (no `tabCapture`, no `offscreen`,
no `getUserMedia` prompt). The trade-off: it doesn't capture audio that
bypasses media elements (page-internal `AudioContext`, WebRTC). That's
acceptable for v1; a tab-capture fallback can be added later behind a flag.

## Keyboard shortcuts (popup focused)

| Key | Action |
|---|---|
| `0` – `6` | Set volume to 0%, 100%, 200%, 300%, 400%, 500%, 600% |
| `↑` / `→` | +10% |
| `↓` / `←` | −10% |
| Mouse wheel on slider | ±10% |

## Removed vs. upstream

- Promo notifications, rating nags, "discover other extensions" pane.
- Scroll-direction-invert toggle.
- Equalizer / spectrum analyser UI (engine present in upstream but hidden;
  left out of v1 — easy to re-introduce as a route).
- 56-locale i18n bundle (English-only initially; restoration is a future
  task once strings stabilize).

## License

MIT.
