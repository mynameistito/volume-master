// MV3 background — service worker on Chrome, event page on Firefox.
//
// Responsibilities:
//  1. Answer popup queries (vm/get-tabs, vm/get-volume).
//  2. On vm/set-volume: persist + broadcast `vm/volume-changed` to the tab.
//  3. Garbage-collect stored gains when tabs close.
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { onMessage, sendToTab } from "@/messaging/bus";
import { getVolume, removeVolume, setVolume } from "@/storage/volume-store";
import { listManagedTabs } from "@/tabs/audible";

export default defineBackground(() => {
  onMessage(async (msg) => {
    switch (msg.kind) {
      case "vm/get-tabs":
        return { tabs: await listManagedTabs() };

      case "vm/get-volume":
        return { tabId: msg.tabId, volume: await getVolume(msg.tabId) };

      case "vm/set-volume": {
        const stored = await setVolume(msg.tabId, msg.volume);
        // Fire-and-forget broadcast — content script may not be ready on
        // chrome:// pages and that's fine.
        sendToTab(msg.tabId, {
          kind: "vm/volume-changed",
          tabId: msg.tabId,
          volume: stored,
        }).catch(() => undefined);
        return { tabId: msg.tabId, volume: stored };
      }

      case "vm/volume-changed":
        // Background never receives this from the popup; ignore.
        return;

      default:
        return;
    }
  });

  browser.tabs.onRemoved.addListener((tabId: number) => {
    removeVolume(tabId).catch(() => undefined);
  });
});
