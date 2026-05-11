// Content script — installed on every page. Wraps audio/video elements in a
// gain graph and listens for `vm/volume-changed` broadcasts from the
// background.
import { defineContentScript } from "wxt/utils/define-content-script";
import {
  attach,
  findMediaElements,
  observe,
  setGain,
} from "@/audio/gain-graph";
import { onMessage, send } from "@/messaging/bus";
import type { GetVolumeRes } from "@/messaging/protocol";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  allFrames: true,
  main() {
    // Watch for media added later. Initial scan at document_start usually
    // finds nothing (no <body> yet), so we also rescan on DOMContentLoaded.
    observe(document);
    const scan = () => {
      for (const el of findMediaElements()) {
        attach(el);
      }
    };
    scan();
    document.addEventListener("DOMContentLoaded", scan, { once: true });
    window.addEventListener("load", scan, { once: true });

    // Restore this tab's stored volume. Background fills in tabId from the
    // message sender, so we send `tabId: 0` as a placeholder.
    const restore = () => {
      send<GetVolumeRes>({ kind: "vm/get-volume", tabId: 0 })
        .then((res) => {
          if (res && typeof res.volume === "number") {
            setGain(res.volume);
          }
        })
        .catch(() => undefined);
    };
    restore();
    // bfcache restore — page becomes visible again without re-running scripts
    // in some browsers; re-apply just in case.
    window.addEventListener("pageshow", (e) => {
      if ((e as PageTransitionEvent).persisted) {
        restore();
      }
    });

    // Apply gain when the background broadcasts a change.
    onMessage((msg) => {
      if (msg.kind === "vm/volume-changed") {
        setGain(msg.volume);
        return { status: "ok" };
      }
      return;
    });
  },
});
