export const THEMES = ["default", "emerald"] as const;
export type Theme = (typeof THEMES)[number];

const THEME_STORAGE_KEY = "ui-theme";
const THEME_ONBOARDING_KEY = "theme-onboarding-completed";

export function setColorTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const html = document.documentElement;

  // Remove all theme classes
  THEMES.forEach((t) => {
    if (t !== "default") {
      html.classList.remove(`theme-${t}`);
    }
  });

  // Add new theme class (skip for default)
  if (theme !== "default") {
    html.classList.add(`theme-${theme}`);
  }

  // Persist to localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error("Failed to save theme preference:", e);
  }
}

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.includes(saved as Theme)) {
      return saved as Theme;
    }
  } catch (e) {
    console.error("Failed to read theme preference:", e);
  }

  return null;
}

export function hasCompletedThemeOnboarding(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(THEME_ONBOARDING_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function markThemeOnboardingComplete() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_ONBOARDING_KEY, "true");
  } catch (e) {
    console.error("Failed to save onboarding state:", e);
  }
}

export function getThemeLabel(theme: Theme): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}
