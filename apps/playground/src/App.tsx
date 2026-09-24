import { useState, type CSSProperties } from "react";
import { Github } from "lucide-react";
import { Playground } from "./components/Playground";

type ThemePreference = "system" | "light" | "dark";

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function App() {
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");

  const colorScheme =
    themePreference === "system" ? "light dark" : themePreference;

  const themeStyle = {
    colorScheme,
    "--console-color-scheme": colorScheme,
  } as CSSProperties;

  return (
    <div
      className="site-shell"
      data-theme={themePreference}
      style={themeStyle}
    >
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark" aria-hidden="true">
            &gt;_
          </span>
          <span className="brand-copy">
            <strong>@moyarich/console</strong>
            <small>React developer console</small>
          </span>
        </a>

        <div className="topbar-actions">
          <label className="theme-control">
            <span>Theme</span>
            <select
              aria-label="Playground theme"
              value={themePreference}
              onChange={(event) =>
                setThemePreference(event.target.value as ThemePreference)
              }
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <a
            className="topbar-icon-link"
            href="https://github.com/moyarich/console"
            target="_blank"
            rel="noreferrer"
            aria-label="Open @moyarich/console on GitHub"
            title="GitHub repository"
          >
            <Github aria-hidden="true" />
          </a>
        </div>
      </header>

      <Playground />

      <footer className="site-footer">
        <span>@moyarich/console</span>
        <span>React console UI and transport adapters</span>
      </footer>
    </div>
  );
}
