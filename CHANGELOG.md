# volume-master

## 0.2.0

### Minor Changes

- 9767c3a: Initial rewrite of Volume Master as a modern, cross-browser extension.

  - Per-tab volume control (0–600% boost) via WebAudio gain graph in a content script — works on Chrome MV3 and Firefox MV2 with no `tabCapture` / offscreen permissions.
  - React 19 + TanStack Router popup with dark-mode-first design.
  - Bun + WXT + Vite build, Ultracite (Biome) lint/format, `tsgo` typechecking, `bun test` for unit tests in co-located `__tests__/` directories.
  - New SVG logo rasterized to PNG icon set during build.
  - GitHub Actions CI (lint + typecheck + tests + dual-browser build) and Release (zips attached to GitHub Release).
  - Dropped from upstream: rating/promo nags, "discover other extensions" pane, scroll-direction-invert toggle, equalizer/analyser UI.
