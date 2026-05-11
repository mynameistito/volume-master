import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "vm-theme";

function read(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
