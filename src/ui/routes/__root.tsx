import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTheme } from "@/ui/hooks/use-theme";

export function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isSettings = path === "/settings";
  const { theme, toggle } = useTheme();

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
        <div className="flex items-center gap-1">
          <button
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-md p-1.5 text-fg-dim hover:bg-elev hover:text-fg"
            onClick={toggle}
            type="button"
          >
            {theme === "dark" ? (
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
                <title>Light mode</title>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
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
                <title>Dark mode</title>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
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
        </div>
      </header>
      <main className="px-3.5 pt-3 pb-4">
        <Outlet />
      </main>
    </div>
  );
}
