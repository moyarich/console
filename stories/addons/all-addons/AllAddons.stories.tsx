import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnimationAddon } from "@moyarich/console-addon-animation";
import { createConsoleAnnotationsAddon } from "@moyarich/console-addon-annotations";
import { createConsoleFeedAddon } from "@moyarich/console-addon-console-feed";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";
import { createConsoleFilteringAddon } from "@moyarich/console-addon-filtering";
import { createImperativeScrollingAddon } from "@moyarich/console-addon-imperative-scrolling";
import { createConsoleLinksAddon } from "@moyarich/console-addon-links";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";
import { createConsoleMetadataAddon } from "@moyarich/console-addon-metadata";
import { createConsoleNavigationAddon } from "@moyarich/console-addon-navigation";
import { createConsolePersistenceAddon } from "@moyarich/console-addon-persistence";
import { createResizableConsoleAddon } from "@moyarich/console-addon-resizable";
import { createConsoleSearchAddon } from "@moyarich/console-addon-search";
import { createConsoleSelectionAddon } from "@moyarich/console-addon-selection";
import { createConsoleSessionAddon } from "@moyarich/console-addon-session";

const initialMessages: ConsoleMessageData[] = [
  {
    id: "intro",
    method: "log",
    depth: 0,
    source: "build",
    timestamp: 1793188800000,
    data: [
      "## Addon showcase\nSearch, filter, select, bookmark, resize, and export these messages.",
    ],
  },
  {
    id: "link",
    method: "info",
    depth: 0,
    data: ["Repository: https://github.com/moyarich/console"],
  },
  {
    id: "warning",
    method: "warn",
    depth: 0,
    data: ["A dependency needs updating."],
  },
  {
    id: "error",
    method: "error",
    depth: 0,
    data: ["Example build error", { file: "src/example.ts", line: 12 }],
  },
];

function AllAddonsExample() {
  const [messages, setMessages] = useState(initialMessages);
  const [persisted, setPersisted] = useState(0);
  const [savedSession, setSavedSession] = useState<string>();
  const [status, setStatus] = useState("Ready");
  const setup = useMemo(() => {
    const annotations = createConsoleAnnotationsAddon();
    annotations.controller.addAnnotation("warning", {
      id: "bookmark",
      label: "Review",
    });
    const navigation = createConsoleNavigationAddon();
    const session = createConsoleSessionAddon();
    const persistence = createConsolePersistenceAddon({
      batchSize: 1,
      flushInterval: 0,
      adapters: [
        { write: (records) => setPersisted((count) => count + records.length) },
      ],
      onError: () => setStatus("Persistence failed"),
    });
    return {
      navigation,
      session,
      addons: [
        createConsoleAnimationAddon(),
        annotations,
        createConsoleDataExportAddon(),
        createConsoleDiagnosticsAddon(),
        createConsoleFilteringAddon(),
        createImperativeScrollingAddon(),
        createConsoleLinksAddon(),
        createConsoleMarkdownAddon(),
        createConsoleMetadataAddon(),
        navigation,
        persistence,
        createResizableConsoleAddon({
          defaultWidth: "100%",
          defaultHeight: 520,
        }),
        createConsoleSearchAddon(),
        createConsoleSelectionAddon(),
        session,
      ],
      feed: [createConsoleFeedAddon()],
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Structured addons</h1>
      <p>
        The structured console combines 15 addons. Console-feed provides an
        alternative renderer below. The Terminal story demonstrates xterm and
        process state separately.
      </p>
      <section aria-label="Addons used">
        <h2>Addons used</h2>
        {[
          { label: "Combined console", addons: setup.addons },
          { label: "Console-feed view", addons: setup.feed },
        ].map(({ label, addons }) => (
          <div key={label}>
            <h3>
              {label} ({addons.length})
            </h3>
            <ul
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 24px",
                paddingInlineStart: 20,
              }}
            >
              {addons.map((addon) => (
                <li key={addon.id}>
                  <code title={addon.id}>
                    {addon.id.replace("@moyarich/console-addon-", "")}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={() =>
            setMessages((current) => [
              ...current,
              {
                id: `event-${current.length}`,
                method: "log",
                depth: 0,
                data: [`New event ${current.length + 1}`],
              },
            ])
          }
        >
          Add event
        </button>
        <button
          onClick={() => {
            setup.navigation.controller.nextError();
          }}
        >
          Next error
        </button>
        <button
          onClick={() => {
            setup.navigation.controller.nextAnnotated();
          }}
        >
          Next bookmark
        </button>
        <button
          onClick={() => {
            setSavedSession(setup.session.service.save());
            setStatus("Session saved");
          }}
        >
          Save session
        </button>
        <button
          disabled={!savedSession}
          onClick={() => {
            if (!savedSession) return;
            const restored = setup.session.service.restore(savedSession);
            if (restored.mode === "console")
              setMessages([...restored.messages]);
            setStatus("Session restored");
          }}
        >
          Restore session
        </button>
      </div>
      <output aria-live="polite">
        {status} · Persisted records: {persisted}
      </output>
      <Console
        title="Combined addons"
        messages={messages}
        addons={setup.addons}
        onClear={() => setMessages([])}
        style={{ width: "100%", height: 520 }}
      />
      <h2>Console-feed renderer</h2>
      <Console
        title="Console-feed"
        messages={messages}
        addons={setup.feed}
        style={{ width: "100%", height: 280 }}
      />
    </div>
  );
}

const meta = {
  title: "Addons/All addons",
  component: AllAddonsExample,
} satisfies Meta<typeof AllAddonsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllAddons: Story = {
  name: "Structured",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save session" }));
    await expect(canvas.getByText(/Session saved/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Add event" }));
    await expect(canvas.getAllByText("New event 5").length).toBeGreaterThan(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "Restore session" }),
    );
    await expect(canvas.queryByText("New event 5")).not.toBeInTheDocument();
    await expect(canvas.getByText(/Session restored/)).toBeVisible();
  },
};
