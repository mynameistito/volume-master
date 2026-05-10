import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "wxt";

// WXT config — multi-browser MV3 build.
// Manifest is auto-generated from entrypoints under src/entrypoints/.
export default defineConfig({
  srcDir: "src",
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "Volume Master",
    description:
      "Per-tab volume control with boost up to 600%. Dark-mode, minimal UI.",
    permissions: ["activeTab", "tabs", "storage", "scripting"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Volume Master",
    },
    browser_specific_settings: {
      gecko: {
        id: "volume-master@mynameistito.dev",
        strict_min_version: "115.0",
      },
    },
  },
  outDir: "dist",
});
