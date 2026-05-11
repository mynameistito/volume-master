---
"volume-master": minor
---

Popup UI refresh and accessibility pass.

- **Icon**: redesigned `assets/icon.svg` as three flat solid-blue concentric arcs (no background, no gradient, bolder strokes) so it stays legible at 16px and sits cleanly on any toolbar theme.
- **Popup header**: replaced the CSS gradient `.vm-brand-mark` with the real rasterized icon, and swapped the Tabs/Settings text links for a cog icon (toggles to an X on the settings route).
- **Light / dark mode**: added a sun/moon toggle in the header. Dark is the default; preference persists to `localStorage` and is applied pre-React via an inline script in `popup/index.html` to avoid theme flash. Uses the canonical Tailwind v4 dark-vars pattern (`@custom-variant dark` + CSS variable overrides under `[data-theme="dark"]`), so component classes (`bg-elev`, `text-fg`, …) are unchanged.
- **Tab row**: removed the blue `bg-accent/10` tint and accent outline on the active row in favour of a subtle `bg-elev-2`.
- **Styling**: migrated the remaining custom CSS classes (`.vm-range`, `.vm-pulse`, `.vm-brand-mark`) to Tailwind utilities (arbitrary variants for the range thumb pseudo-elements; `animate-[vm-pulse_…]` for the audible indicator). `theme.css` now only holds Tailwind config (`@theme` tokens, `@custom-variant dark`), base resets, and the `vm-pulse` keyframes.
- **a11y**: restored a keyboard focus ring on the volume slider (`focus-visible:outline-2 outline-accent outline-offset-4`); the previous blanket `outline-none` removed it for both pointer and keyboard users.
