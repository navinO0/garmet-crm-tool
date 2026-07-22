export interface NavVisibilityConfig {
  [key: string]: boolean;
}

export const DEFAULT_NAV_VISIBILITY: NavVisibilityConfig = {
  "/customers": true,
  "/orders": true,
  "/production": true,
  "/invoices": true,
  "/": false,
  "/payments": false,
  "/inventory": false,
  "/shop-floor": false,
  "/reports": false,
  "/calendar": false,
  "/settings": true,
};

export const NAV_VISIBILITY_KEY = "nav_menu_visibility_config";

export function getNavVisibility(): NavVisibilityConfig {
  if (typeof window === "undefined") return DEFAULT_NAV_VISIBILITY;
  try {
    const saved = localStorage.getItem(NAV_VISIBILITY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_NAV_VISIBILITY, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load nav menu visibility config", e);
  }
  return DEFAULT_NAV_VISIBILITY;
}

export function saveNavVisibility(config: NavVisibilityConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAV_VISIBILITY_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("nav_visibility_changed"));
}
