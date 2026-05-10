import type { TabAudio } from "@/types";
import { TabRow } from "@/ui/components/tab-row";

interface Props {
  activeTabId?: number;
  onSelect: (tab: TabAudio) => void;
  tabs: TabAudio[];
}

export function TabList({ tabs, activeTabId, onSelect }: Props) {
  if (tabs.length === 0) {
    return (
      <p className="m-0 text-fg-dim text-sm leading-relaxed">
        No audible tabs right now.
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {tabs.map((t) => (
        <li key={t.tabId}>
          <TabRow
            isActive={t.tabId === activeTabId}
            onSelect={onSelect}
            tab={t}
          />
        </li>
      ))}
    </ul>
  );
}
