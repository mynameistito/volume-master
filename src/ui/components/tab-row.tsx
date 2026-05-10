import type { TabAudio } from "@/types";

interface Props {
  isActive: boolean;
  onSelect: (tab: TabAudio) => void;
  tab: TabAudio;
}

export function TabRow({ tab, isActive, onSelect }: Props) {
  const isBoosted = tab.volume > 100;

  return (
    <button
      className={`grid w-full grid-cols-[18px_1fr_auto_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-elev-2 ${
        isActive
          ? "bg-accent/10 outline outline-accent/30"
          : "outline-transparent"
      }`}
      onClick={() => onSelect(tab)}
      title={tab.title}
      type="button"
    >
      <span
        aria-hidden
        className="size-4 rounded-sm bg-center bg-cover bg-elev-2"
        style={
          tab.favIconUrl
            ? { backgroundImage: `url(${JSON.stringify(tab.favIconUrl)})` }
            : undefined
        }
      />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-fg text-xs">
        {tab.title || tab.url}
      </span>
      <span
        className={`font-semibold text-[11px] tabular-nums ${
          isBoosted ? "text-warn" : "text-fg-dim"
        }`}
      >
        {tab.volume}%
      </span>
      {tab.audible ? (
        <span aria-hidden className="vm-pulse" title="Audible" />
      ) : (
        <span aria-hidden className="size-1.5" />
      )}
    </button>
  );
}
