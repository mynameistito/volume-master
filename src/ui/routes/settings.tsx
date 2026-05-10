import { useState } from "react";
import { browser } from "wxt/browser";
import { VOLUME_MAX } from "@/config";

type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "throttled"
  | "error";

const STATUS_LABELS: Record<
  Exclude<UpdateStatus, "idle" | "checking">,
  string
> = {
  "up-to-date": "You're on the latest version",
  available: "Update available, restart to apply",
  throttled: "Checked too recently, try again later",
  error: "Could not check for updates",
};

function statusColor(status: UpdateStatus): string {
  if (status === "available") {
    return "text-accent";
  }
  if (status === "error") {
    return "text-warn";
  }
  return "text-fg-dim";
}

export function SettingsRoute() {
  const version = browser.runtime.getManifest().version;
  const [status, setStatus] = useState<UpdateStatus>("idle");

  async function checkForUpdates() {
    setStatus("checking");
    try {
      const { status: checkStatus } =
        await browser.runtime.requestUpdateCheck();
      switch (checkStatus) {
        case "update_available":
          setStatus("available");
          break;
        case "no_update":
          setStatus("up-to-date");
          break;
        case "throttled":
          setStatus("throttled");
          break;
        default:
          setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-elev p-3">
        <h2 className="m-0 font-semibold text-[12px] text-fg-dim uppercase tracking-wider">
          Updates
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-fg-dim text-sm">Version {version}</span>
          <button
            className="rounded-md border border-border bg-elev-2 px-2.5 py-1 text-fg text-xs transition-colors hover:bg-border disabled:opacity-50"
            disabled={status === "checking"}
            onClick={checkForUpdates}
            type="button"
          >
            {status === "checking" ? "Checking..." : "Check for updates"}
          </button>
        </div>
        {status !== "idle" && status !== "checking" && (
          <p className={`m-0 text-xs ${statusColor(status)}`}>
            {STATUS_LABELS[status]}
          </p>
        )}
      </section>
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
            <Kbd>0</Kbd>–<Kbd>6</Kbd> set volume to 0%, 100%, …, 600%
          </li>
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
