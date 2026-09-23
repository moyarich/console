import { Playground } from "./components/Playground";

export function App() {
  return (
    <div className="site-shell">
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

        <a
          className="topbar-link"
          href="https://github.com/moyarich/console"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      <Playground />
    </div>
  );
}
