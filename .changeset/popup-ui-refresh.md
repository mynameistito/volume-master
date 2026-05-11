---
"volume-master": minor
---

Popup UI refresh, theme switching, privacy policy, and build cleanup.

- **Icon**: redesigned `assets/icon.svg` as three flat solid-blue concentric arcs (no background, no gradient, bolder strokes) so it stays legible at 16px and sits cleanly on any toolbar theme.
- **Popup header**: replaced the CSS gradient `.vm-brand-mark` with the real rasterized icon, and swapped the Tabs/Settings text links for a cog icon that toggles to an X on the settings route.
- **Light / dark mode**: added a sun/moon toggle in the header. Dark by default; the preference persists to `localStorage` (`vm-theme`) and is applied at the top of the bundled `popup/main.tsx` before React mounts — inline scripts are blocked by the MV3 extension CSP, so it cannot live in `index.html`. Uses the canonical Tailwind v4 dark-vars pattern (`@custom-variant dark` + CSS variable overrides under `:root[data-theme="dark"]`), with the dark selector scoped to `:root` so its specificity beats the later light `color-scheme` rule. Component classes (`bg-elev`, `text-fg`, …) are unchanged.
- **Tab row**: dropped the blue `bg-accent/10` tint and accent outline on the active row in favour of a subtle `bg-elev-2`.
- **Styling cleanup**: migrated `.vm-range`, `.vm-pulse`, and `.vm-brand-mark` to Tailwind utilities (arbitrary variants for the range thumb pseudo-elements; `animate-[vm-pulse_…]` for the audible indicator). `theme.css` now only holds Tailwind config (`@theme` tokens, `@custom-variant dark`), base resets, and the `vm-pulse` keyframes.
- **a11y**: restored a keyboard focus ring on the volume slider (`focus-visible:outline-2 outline-accent outline-offset-4`); the previous blanket `outline-none` removed it for both pointer and keyboard users.
- **Imports**: normalized the last `../../` relative import in `src/` to the `@/` alias.
- **Build**: disabled WXT's auto-generated `volume-master-x.x.x-sources.zip` (`zip.zipSources: false`). The git repository is the canonical source archive; the release workflow now ships only the Chrome/Firefox build zips.
- **Privacy**: added `PRIVACY.md` documenting that the extension makes no network requests, has no telemetry, and only stores per-tab volume (`chrome.storage.session`) and theme preference (`localStorage`) locally. Each manifest permission is explained. Linked from the settings page.
