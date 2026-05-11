// MV3 background — service worker on Chrome, event page on Firefox.
//
// Responsibilities:
//  1. Answer popup queries (vm/get-tabs, vm/get-volume).
//  2. On vm/set-volume: persist + broadcast `vm/volume-changed` to the tab.
//  3. Garbage-collect stored gains when tabs close.
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { updateActionIcon } from "@/action-icon";
import { onMessage, sendToTab } from "@/messaging/bus";
import { getVolume, removeVolume, setVolume } from "@/storage/volume-store";
import { listManagedTabs } from "@/tabs/audible";

export default defineBackground(() => {
  onMessage(async (msg, sender) => {
    switch (msg.kind) {
      case "vm/get-tabs":
        return { tabs: await listManagedTabs() };

      case "vm/get-volume": {
        // Content scripts pass `tabId: 0` to mean "resolve from sender".
        const tabId = msg.tabId > 0 ? msg.tabId : (sender.tab?.id ?? 0);
        return { tabId, volume: await getVolume(tabId) };
      }

      case "vm/set-volume": {
        const stored = await setVolume(msg.tabId, msg.volume);
        // Fire-and-forget broadcast — content script may not be ready on
        // chrome:// pages and that's fine.
        sendToTab(msg.tabId, {
          kind: "vm/volume-changed",
          tabId: msg.tabId,
          volume: stored,
        }).catch(() => undefined);
        updateActionIcon(msg.tabId, stored).catch(() => undefined);
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

  // Reapply the overlay icon when a tab becomes active — covers SW restarts
  // where Chrome may have dropped the per-tab icon override.
  browser.tabs.onActivated.addListener(({ tabId }) => {
    getVolume(tabId)
      .then((v) => updateActionIcon(tabId, v))
      .catch(() => undefined);
  });
});
