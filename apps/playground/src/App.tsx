import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { Playground } from "./components/Playground";
import {
  ResolvedColorSchemeContext,
  type ResolvedColorScheme,
} from "./theme";

type ThemePreference = "system" | "light" | "dark";

const themeOptions = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useSystemColorScheme() {
  const [colorScheme, setColorScheme] =
    useState<ResolvedColorScheme>(getSystemColorScheme);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () =>
      setColorScheme(mediaQuery.matches ? "dark" : "light");

    updateColorScheme();
    mediaQuery.addEventListener("change", updateColorScheme);

    return () => {
      mediaQuery.removeEventListener("change", updateColorScheme);
    };
  }, []);

  return colorScheme;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .08 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

export function App() {
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const systemColorScheme = useSystemColorScheme();
  const resolvedColorScheme =
    themePreference === "system" ? systemColorScheme : themePreference;

  const colorScheme =
    themePreference === "system" ? "light dark" : themePreference;

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = colorScheme;

    return () => {
      root.style.removeProperty("color-scheme");
    };
  }, [colorScheme]);

  return (
    <ResolvedColorSchemeContext.Provider value={resolvedColorScheme}>
      <div className="layout" data-theme={themePreference}>
        <header className="layout-header topbar">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              &gt;_
            </span>
            <span className="brand-copy">
              <strong>@moyarich/console</strong>
              <small>React developer console</small>
            </span>
          </Link>

          <div className="topbar-actions">
            <div className="theme-switcher" role="group" aria-label="Appearance">
              {themeOptions.map(({ value, label, Icon }) => {
                const isActive = themePreference === value;

                return (
                  <button
                    key={value}
                    className="theme-switcher-button"
                    type="button"
                    aria-label={`${label} theme`}
                    aria-pressed={isActive}
                    title={label}
                    onClick={() => setThemePreference(value)}
                  >
                    <Icon aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <a
              className="topbar-icon-link"
              href="https://github.com/moyarich/console"
              target="_blank"
              rel="noreferrer"
              aria-label="Open @moyarich/console on GitHub"
              title="GitHub repository"
            >
              <GitHubIcon />
            </a>
          </div>
        </header>

        <Playground />

        <footer className="layout-footer site-footer">
          <span>@moyarich/console</span>
          <span>React console UI and transport adapters</span>
        </footer>
      </div>
    </ResolvedColorSchemeContext.Provider>
  );
}
