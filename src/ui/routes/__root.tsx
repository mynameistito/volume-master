import { Link, Outlet, useRouterState } from "@tanstack/react-router";

export function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isSettings = path === "/settings";

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
        <Link
          aria-label={isSettings ? "Close settings" : "Open settings"}
          className="rounded-md p-1.5 text-fg-dim hover:bg-elev hover:text-fg"
          to={isSettings ? "/" : "/settings"}
        >
          {isSettings ? (
            <svg
              aria-hidden
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <title>Close</title>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              aria-hidden
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <title>Settings</title>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )}
        </Link>
      </header>
      <main className="px-3.5 pt-3 pb-4">
        <Outlet />
      </main>
    </div>
  );
}
