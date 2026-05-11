---
"volume-master": minor
---

Refresh the extension icon and improve the per-tab volume readout on the toolbar.

- Swap `assets/icon.svg` to a lucide `audio-lines` design (kept brand blue `#1E9BF0`).
- Replace the outlined-text overlay with a colored pill behind the volume readout: red for mute, amber for boost, brand-blue for normal. Text is white on all states.
- Pill auto-shrinks the font when needed so `999+` stays inside the icon bounds at both 16px and 32px toolbar sizes.
- Tests: add coverage for the WebAudio gesture-resume listener and its rejection path; lift `src/` coverage to 100% functions + 100% lines.
