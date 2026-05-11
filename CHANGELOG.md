# volume-master

## 0.6.0

### Minor Changes

- e3ef05a: Refresh the extension icon and improve the per-tab volume readout on the toolbar.

  - Swap `assets/icon.svg` to a lucide `audio-lines` design (kept brand blue `#1E9BF0`).
  - Replace the outlined-text overlay with a colored pill behind the volume readout: red for mute, amber for boost, brand-blue for normal. Text is white on all states.
  - Pill auto-shrinks the font when needed so `999+` stays inside the icon bounds at both 16px and 32px toolbar sizes.
  - Tests: add coverage for the WebAudio gesture-resume listener and its rejection path; lift `src/` coverage to 100% functions + 100% lines.

### Patch Changes

- 83de7e1: Fix boost being silent or inaudible — rework the audio graph to bypass WebAudio entirely at ≤100% and only intercept when boosting.

  - **Silent-until-popup bug**: the content script eagerly created an `AudioContext` at `document_start` and called `createMediaElementSource` on every `<audio>`/`<video>`. Chrome's autoplay policy keeps the context suspended until a user gesture, but `createMediaElementSource` reroutes the element's audio exclusively through the (suspended) graph — so media played mute on every page until the popup was opened. Now the graph is only built when boost > 100% is actually requested.
  - **Boost was being eaten by the compressor**: previous chain ran `DynamicsCompressor(threshold −6 dB, ratio 12:1, knee 12)` + `WaveShaper` soft-clipper inline at every gain, including unity. At 600% the `(v/100)^1.6` curve produced ~+23 dB of linear gain that the compressor immediately squashed back down to a few dB and the waveshaper coloured. Replaced with a linear `v/100` curve and a gentle limiter (`threshold −3 dB, ratio 4:1, knee 6, attack 3 ms, release 100 ms`), and dropped the waveshaper. 600% now actually sounds ~6× louder.
  - **Native fidelity at ≤100%**: at and below unity, volume is applied as `el.volume` on each tracked element — the page's audio is bit-identical to no extension installed (no compressor colouring, no autoplay-policy interactions).
  - **Volume restore on page load**: the content script now queries `vm/get-volume` on init (and on bfcache `pageshow`) so navigating within a boosted tab keeps the boost. Background resolves the tab from the message sender.
  - **Late media + gesture handling**: rescan media elements on `DOMContentLoaded` and `load` in addition to the existing `MutationObserver`; hook one-shot `pointerdown`/`keydown`/`touchstart` listeners that resume the `AudioContext` on user gesture.

## 0.5.0

### Minor Changes

- 9741cf2: Popup UI refresh, theme switching, privacy policy, and build cleanup.

  - **Icon**: redesigned `assets/icon.svg` as three flat solid-blue concentric arcs (no background, no gradient, bolder strokes) so it stays legible at 16px and sits cleanly on any toolbar theme.
  - **Popup header**: replaced the CSS gradient `.vm-brand-mark` with the real rasterized icon, and swapped the Tabs/Settings text links for a cog icon that toggles to an X on the settings route.
  - **Light / dark mode**: added a sun/moon toggle in the header. Dark by default; the preference persists to `localStorage` (`vm-theme`) and is applied at the top of the bundled `popup/main.tsx` before React mounts — inline scripts are blocked by the MV3 extension CSP, so it cannot live in `index.html`. Uses the canonical Tailwind v4 dark-vars pattern (`@custom-variant dark` + CSS variable overrides under `:root[data-theme="dark"]`), with the dark selector scoped to `:root` so its specificity beats the later light `color-scheme` rule. Component classes (`bg-elev`, `text-fg`, …) are unchanged.
  - **Tab row**: dropped the blue `bg-accent/10` tint and accent outline on the active row in favour of a subtle `bg-elev-2`.
  - **Styling cleanup**: migrated `.vm-range`, `.vm-pulse`, and `.vm-brand-mark` to Tailwind utilities (arbitrary variants for the range thumb pseudo-elements; `animate-[vm-pulse_…]` for the audible indicator). `theme.css` now only holds Tailwind config (`@theme` tokens, `@custom-variant dark`), base resets, and the `vm-pulse` keyframes.
  - **a11y**: restored a keyboard focus ring on the volume slider (`focus-visible:outline-2 outline-accent outline-offset-4`); the previous blanket `outline-none` removed it for both pointer and keyboard users.
  - **Imports**: normalized the last `../../` relative import in `src/` to the `@/` alias.
  - **Build**: disabled WXT's auto-generated `volume-master-x.x.x-sources.zip` (`zip.zipSources: false`). The git repository is the canonical source archive; the release workflow now ships only the Chrome/Firefox build zips.
  - **Privacy**: added `PRIVACY.md` documenting that the extension makes no network requests, has no telemetry, and only stores per-tab volume (`chrome.storage.session`) and theme preference (`localStorage`) locally. Each manifest permission is explained. Linked from the settings page.

### Patch Changes

- 25a7243: Pin Chrome extension ID across builds by deriving `manifest.key` from `key.pem` (or `$CHROME_EXTENSION_KEY_PEM` in CI). Firefox already had a stable ID via `gecko.id`. Release builds hard-fail if the signing key is missing so the ID can't silently drift.

## 0.4.0

### Minor Changes

- f30251b: Overlay volume percent on toolbar icon for the active tab

  The browser-action icon now shows the current volume on top of the base
  icon when a tab's volume differs from 100%. Mute shows "M" in red, boost
  (>100%) shows the percent in amber, and values over 999 clamp to "999+".
  Only the active tab gets the overlay; switching tabs reapplies it to
  survive service-worker restarts.

## 0.3.0

### Minor Changes

- 944123d: Replace raw gain with a proper audio processing chain

  The volume boost was previously just a linear gain multiplier on the audio signal. Above 100% this caused harsh digital clipping because the amplified waveform exceeded the 0dBFS ceiling.

  The new chain: `Source → GainNode → DynamicsCompressorNode (limiter) → WaveShaperNode (soft-clip) → Destination`

  - Added a dynamics compressor that kicks in at -6dB with a 12:1 ratio, preventing hard clipping while letting the signal get louder
  - Added a waveshaper with a smooth tanh-like soft saturation curve and 4x oversampling, so driven signals saturate pleasantly instead of distorting
  - Switched from linear gain mapping to a perceptual curve (`(v/100)^1.6` above unity) so the slider feels more natural and matches how humans perceive loudness
  - Below 100% the mapping stays linear (same as before)

## 0.2.0

### Minor Changes

- 9767c3a: Initial rewrite of Volume Master as a modern, cross-browser extension.

  - Per-tab volume control (0–600% boost) via WebAudio gain graph in a content script — works on Chrome MV3 and Firefox MV2 with no `tabCapture` / offscreen permissions.
  - React 19 + TanStack Router popup with dark-mode-first design.
  - Bun + WXT + Vite build, Ultracite (Biome) lint/format, `tsgo` typechecking, `bun test` for unit tests in co-located `__tests__/` directories.
  - New SVG logo rasterized to PNG icon set during build.
  - GitHub Actions CI (lint + typecheck + tests + dual-browser build) and Release (zips attached to GitHub Release).
  - Dropped from upstream: rating/promo nags, "discover other extensions" pane, scroll-direction-invert toggle, equalizer/analyser UI.
