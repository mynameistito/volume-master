# Volume Master

Per-tab volume control with up to **600% boost**. Chrome + Firefox.

Clean-slate rewrite of the upstream extension. No ads, no nags. Uses a
content-script WebAudio gain graph (compressor + soft-clipper + perceptual
curve) instead of `tabCapture`, so the same code path works on both browsers
with no extra permissions.

## Install

**Chrome / Brave / Edge** — `chrome://extensions` → Developer mode → Load
unpacked → `dist/chrome-mv3/`.

**Firefox** — `about:debugging#/runtime/this-firefox` → Load Temporary
Add-on → any file in `dist/firefox-mv2/`.

## Develop

```sh
bun install
bun run dev            # Chrome
bun run dev:firefox    # Firefox
bun run check          # lint + format (ultracite)
bun run typecheck
bun test
```

## Build

```sh
bun run build:all      # chrome-mv3 + firefox-mv2
bun run zip:all        # zipped artifacts in dist/
```

Tag `vX.Y.Z` to trigger `.github/workflows/release.yml` — builds both
browsers and attaches zips to the GitHub release. Store publishing is
manual.

## Architecture

```
popup ──msg──▶ background ──msg──▶ content script (each tab)
 (UI)            (router)            (WebAudio gain graph)
```

Content script wraps each `<audio>`/`<video>` in
`MediaElementAudioSourceNode → GainNode → DynamicsCompressor → destination`.
`MutationObserver` catches dynamically-added media. Per-tab gain persists in
`browser.storage.session` and is GC'd when the tab closes.

Trade-off vs. `tabCapture`: doesn't catch audio from page-internal
`AudioContext` or WebRTC. Acceptable for v1.

## Shortcuts (popup focused)

| Key | Action |
|---|---|
| `↑` / `→` | +10% |
| `↓` / `←` | −10% |
| Wheel on slider | ±10% |

## License

[MIT](LICENSE)
