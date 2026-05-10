// Code-based TanStack Router setup. The popup is small enough that a file-
// based router is overkill — two routes (`/`, `/settings`) defined inline.
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "@/ui/routes/__root";
import { IndexRoute } from "@/ui/routes/index";
import { SettingsRoute } from "@/ui/routes/settings";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute]);

// Memory history — popups don't have meaningful URL state to share.
export const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] }),
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
