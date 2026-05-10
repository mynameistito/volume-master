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
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqhnNzcny2HcKmrzwwCmW16Dasgvh9jE96UwRCH6VwzwxHa1pc3rWkeOa6clbIRhhQQxixDsXnpxaM03VHC75hAC+NRHK45FDh5xriVLyy2Ks2Xm1VmHiHqpjGJCF7ylajz88kBrt1hcE17/sWLis0FGUUARm5XVFlnfFuxYKB/lb29H1/7ImLgpmvv7Ep7p5myCU7Py2819jg6kS1DkYF8K8CwbPbxVwCJ1kmVjFrugQHH/5zPUS3VenREJNs5ZfGG4pFlsQ9qtoYzo5ohzA3dUkSF4NqLvQDyIU2o2fRhMNqOsPgMnhwAIL9B5OUNNQ/Ag9tqMyKnbZRsuU0Sa0DwIDAQAB",
    update_url:
      "https://raw.githubusercontent.com/mynameistito/volume-master/main/updates.xml",
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
  },
  outDir: "dist",
});
