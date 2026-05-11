import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "@/ui/router";
import "@/ui/theme.css";

// Apply stored theme before the first paint so light-mode users don't flash
// dark. Inline scripts are blocked by the MV3 extension CSP, so this has to
// live in the bundled module instead of <script> in index.html.
try {
  const stored = localStorage.getItem("vm-theme");
  document.documentElement.dataset.theme =
    stored === "light" ? "light" : "dark";
} catch {
  // localStorage unavailable; keep the default data-theme="dark" from the HTML.
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
