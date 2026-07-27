"use client";

import { useEffect } from "react";
import { useProductionStore } from "@/store/productionStore";

export function ThemeWatcher() {
  const hydrateStore = useProductionStore((state) => state.hydrateStore);

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyLightTheme = () => {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    };

    // Always enforce light theme
    applyLightTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      applyLightTheme();
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return null;
}
export default ThemeWatcher;
