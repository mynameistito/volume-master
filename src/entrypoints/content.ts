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
import { onMessage } from "@/messaging/bus";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  allFrames: true,
  main() {
    // Initial wiring: catch any pre-existing media + watch for new ones.
    for (const el of findMediaElements()) {
      attach(el);
    }
    observe(document);

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
