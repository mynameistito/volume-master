import { Link, Outlet } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-border border-b px-3.5 py-3">
        <div className="flex items-center gap-2">
          <img
            alt=""
            aria-hidden
            className="size-[22px]"
            height={22}
            src="/icon/icon-32.png"
            width={22}
          />
          <span className="font-semibold tracking-wide">Volume Master</span>
        </div>
        <nav className="flex gap-1">
          <Link
            activeProps={{
              className: "rounded-md px-2 py-1 text-xs bg-elev text-fg",
            }}
            className="rounded-md px-2 py-1 text-fg-dim text-xs hover:bg-elev hover:text-fg"
            to="/"
          >
            Tabs
          </Link>
          <Link
            activeProps={{
              className: "rounded-md px-2 py-1 text-xs bg-elev text-fg",
            }}
            className="rounded-md px-2 py-1 text-fg-dim text-xs hover:bg-elev hover:text-fg"
            to="/settings"
          >
            Settings
          </Link>
        </nav>
      </header>
      <main className="px-3.5 pt-3 pb-4">
        <Outlet />
      </main>
    </div>
  );
}
