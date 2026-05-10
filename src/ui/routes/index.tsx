import { useCallback, useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { VOLUME_DEFAULT } from "@/config";
import { send } from "@/messaging/bus";
import type { TabAudio } from "@/types";
import { TabList } from "@/ui/components/tab-list";
import { VolumeSlider } from "@/ui/components/volume-slider";

interface ActiveTab {
  favIconUrl?: string;
  id: number | undefined;
  title: string;
  url: string;
}

async function queryActiveTab(): Promise<ActiveTab | null> {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs[0];
  if (!tab) {
    return null;
  }
  return {
    id: tab.id,
    title: tab.title ?? "",
    url: tab.url ?? "",
    favIconUrl: tab.favIconUrl,
  };
}

export function IndexRoute() {
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [volume, setLocalVolume] = useState<number>(VOLUME_DEFAULT);
  const [tabs, setTabs] = useState<TabAudio[]>([]);

  // Initial load: active tab + its volume + the audible-tab list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tab = await queryActiveTab();
      if (cancelled) {
        return;
      }
      setActiveTab(tab);
      if (tab?.id != null) {
        const res = (await send({ kind: "vm/get-volume", tabId: tab.id })) as
          | { volume: number }
          | undefined;
        if (!cancelled && res) {
          setLocalVolume(res.volume);
        }
      }
      const list = (await send({ kind: "vm/get-tabs" })) as
        | { tabs: TabAudio[] }
        | undefined;
      if (!cancelled && list) {
        setTabs(list.tabs);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist + broadcast volume changes for the active tab.
  const onVolumeChange = useCallback(
    (next: number) => {
      setLocalVolume(next);
      const id = activeTab?.id;
      if (id == null) {
        return;
      }
      send({ kind: "vm/set-volume", tabId: id, volume: next }).catch(
        () => undefined
      );
      setTabs((prev) =>
        prev.map((t) => (t.tabId === id ? { ...t, volume: next } : t))
      );
    },
    [activeTab?.id]
  );

  // Keyboard shortcuts: arrows nudge ±10.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        onVolumeChange(Math.min(600, volume + 10));
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        onVolumeChange(Math.max(0, volume - 10));
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [volume, onVolumeChange]);

  const onPickTab = (t: TabAudio) => {
    setActiveTab({
      id: t.tabId,
      title: t.title,
      url: t.url,
      favIconUrl: t.favIconUrl,
    });
    setLocalVolume(t.volume);
    browser.tabs.update(t.tabId, { active: true }).catch(() => undefined);
  };

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-elev p-3">
        <div className="grid grid-cols-[24px_1fr] items-center gap-2.5">
          <span
            aria-hidden
            className="size-6 rounded-md bg-center bg-cover bg-elev-2"
            style={
              activeTab?.favIconUrl
                ? {
                    backgroundImage: `url(${JSON.stringify(activeTab.favIconUrl)})`,
                  }
                : undefined
            }
          />
          <div className="min-w-0">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[13px]">
              {activeTab?.title || "No active tab"}
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-fg-mute">
              {activeTab?.url ?? ""}
            </div>
          </div>
        </div>
        <VolumeSlider onChange={onVolumeChange} value={volume} />
        <button
          className={`w-full rounded-xl py-2.5 font-semibold text-[13px] transition-colors ${
            volume === VOLUME_DEFAULT
              ? "bg-elev-2 text-fg-mute/30"
              : "bg-accent text-bg hover:bg-accent-strong active:bg-accent-strong"
          }`}
          disabled={volume === VOLUME_DEFAULT}
          onClick={() => onVolumeChange(VOLUME_DEFAULT)}
          type="button"
        >
          Reset to {VOLUME_DEFAULT}%
        </button>
      </section>
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-elev p-3">
        <h2 className="m-0 font-semibold text-[12px] text-fg-dim uppercase tracking-wider">
          Audible tabs
        </h2>
        <TabList activeTabId={activeTab?.id} onSelect={onPickTab} tabs={tabs} />
      </section>
    </div>
  );
}
