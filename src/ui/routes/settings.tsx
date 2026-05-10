import { VOLUME_MAX } from "@/config";

export function SettingsRoute() {
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-elev p-3">
        <h2 className="m-0 font-semibold text-[12px] text-fg-dim uppercase tracking-wider">
          About
        </h2>
        <p className="m-0 text-fg-dim text-sm leading-relaxed">
          Volume Master is an open-source per-tab volume controller with up to{" "}
          <strong className="text-fg">{VOLUME_MAX}% boost</strong>. No
          telemetry, no tracking.
        </p>
        <p className="m-0 text-fg-dim text-sm leading-relaxed">
          <a
            className="text-accent"
            href="https://github.com/mynameistito/volume-master"
            rel="noreferrer"
            target="_blank"
          >
            Source &amp; issues on GitHub
          </a>
        </p>
      </section>
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-elev p-3">
        <h2 className="m-0 font-semibold text-[12px] text-fg-dim uppercase tracking-wider">
          Shortcuts
        </h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-fg-dim text-xs">
          <li>
            <Kbd>↑</Kbd> / <Kbd>→</Kbd> volume up by 10%
          </li>
          <li>
            <Kbd>↓</Kbd> / <Kbd>←</Kbd> volume down by 10%
          </li>
        </ul>
      </section>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block min-w-[18px] rounded border border-border bg-elev-2 px-1.5 py-px text-center font-mono text-[11px] text-fg">
      {children}
    </kbd>
  );
}
