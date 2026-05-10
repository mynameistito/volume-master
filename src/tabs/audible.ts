// Query the currently audible / capturing tabs to render the popup list.
import { browser } from "wxt/browser";
import { VOLUME_DEFAULT } from "@/config";
import { getVolume } from "@/storage/volume-store";
import type { TabAudio } from "@/types";

interface BrowserTab {
  audible?: boolean;
  favIconUrl?: string;
  id?: number;
  title?: string;
  url?: string;
}

/** Map a browser Tab → our internal TabAudio shape, hydrating volume. */
export async function toTabAudio(tab: BrowserTab): Promise<TabAudio | null> {
  if (typeof tab.id !== "number") {
    return null;
  }
  return {
    tabId: tab.id,
    title: tab.title ?? "",
    url: tab.url ?? "",
    favIconUrl: tab.favIconUrl,
    audible: !!tab.audible,
    volume: await getVolume(tab.id),
  };
}

/** All audible tabs + any tabs with a non-default stored volume. */
export async function listManagedTabs(): Promise<TabAudio[]> {
  const tabs = (await browser.tabs.query({})) as BrowserTab[];
  const mapped = await Promise.all(tabs.map(toTabAudio));
  return mapped
    .filter((t): t is TabAudio => t !== null)
    .filter((t) => t.audible || t.volume !== VOLUME_DEFAULT);
}

/** Audible-only — useful for quick popup mode. */
export async function listAudibleTabs(): Promise<TabAudio[]> {
  const tabs = (await browser.tabs.query({ audible: true })) as BrowserTab[];
  const mapped = await Promise.all(tabs.map(toTabAudio));
  return mapped.filter((t): t is TabAudio => t !== null);
}
