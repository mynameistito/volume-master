---
"volume-master": patch
---

Pin Chrome extension ID across builds by deriving `manifest.key` from `key.pem` (or `$CHROME_EXTENSION_KEY_PEM` in CI). Firefox already had a stable ID via `gecko.id`. Release builds hard-fail if the signing key is missing so the ID can't silently drift.
