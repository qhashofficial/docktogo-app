import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "docktogo-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.classList.add(resolved);
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    const next = applyTheme(theme);
    setResolved(next);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = getSystemTheme();
      applyTheme("system");
      setResolved(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: setThemeState, resolved }),
    [theme, resolved]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
