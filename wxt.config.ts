import { createPublicKey } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "wxt";

const ROOT = dirname(fileURLToPath(import.meta.url));

// Derive Chrome `manifest.key` (SPKI base64) from key.pem so the extension
// keeps a stable ID across builds. Reads $CHROME_EXTENSION_KEY_PEM in CI,
// falls back to key.pem at repo root for local builds. Returns undefined
// when neither is present so dev builds still work.
function chromeManifestKey(): string | undefined {
  const pem =
    process.env.CHROME_EXTENSION_KEY_PEM ??
    (existsSync(resolve(ROOT, "key.pem"))
      ? readFileSync(resolve(ROOT, "key.pem"), "utf8")
      : undefined);
  if (!pem) {
    return;
  }
  return createPublicKey(pem)
    .export({ type: "spki", format: "der" })
    .toString("base64");
}

// WXT config — multi-browser MV3 build.
// Manifest is auto-generated from entrypoints under src/entrypoints/.
export default defineConfig({
  srcDir: "src",
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: ({ browser }) => {
    const key = browser === "chrome" ? chromeManifestKey() : undefined;
    // Hard-fail release builds when the signing key is missing. The
    // release workflow sets REQUIRE_CHROME_KEY=1; regular CI verification
    // and local dev are unaffected.
    if (browser === "chrome" && process.env.REQUIRE_CHROME_KEY && !key) {
      throw new Error(
        "CHROME_EXTENSION_KEY_PEM is not set. Refusing to build Chrome without a stable extension ID. Set the repo secret and re-run."
      );
    }
    return {
      name: "Volume Master",
      description:
        "Per-tab volume control with boost up to 600%. Dark-mode, minimal UI.",
      permissions: ["activeTab", "tabs", "storage", "scripting"],
      host_permissions: ["<all_urls>"],
      icons: {
        "16": "icon/icon-16.png",
        "32": "icon/icon-32.png",
        "48": "icon/icon-48.png",
        "128": "icon/icon-128.png",
      },
      action: {
        default_title: "Volume Master",
        default_icon: {
          "16": "icon/icon-16.png",
          "32": "icon/icon-32.png",
          "48": "icon/icon-48.png",
          "128": "icon/icon-128.png",
        },
      },
      browser_specific_settings: {
        gecko: {
          id: "volume-master@mynameistito.com",
          strict_min_version: "115.0",
        },
      },
      ...(key && { key }),
    };
  },
  outDir: "dist",
});
