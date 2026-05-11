# volume-master

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
