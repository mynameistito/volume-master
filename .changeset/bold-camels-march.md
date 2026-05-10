---
"volume-master": minor
---

Add auto-update via GitHub Releases with manual check button in settings

Extension now self-updates using an `updates.xml` manifest hosted on
`raw.githubusercontent.com`, regenerated automatically by CI on each release.
The settings page shows the current version and has a "Check for updates"
button using `chrome.runtime.requestUpdateCheck()`.

