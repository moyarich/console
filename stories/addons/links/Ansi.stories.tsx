import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Console,
  type ConsoleLinkProvider,
  type ConsoleMessageData,
  type ConsoleMode,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const structuredMessages: ConsoleMessageData[] = [
  {
    method: "info",
    data: [
      "Repository: https://github.com/moyarich/console",
      { source: "packages/console/src/components/Console.tsx:1" },
    ],
    depth: 0,
  },
  {
    method: "error",
    data: ["Build failed at packages/console/src/links.tsx:1"],
    depth: 0,
  },
];
const terminalMessages: ConsoleStdoutEntry[] = [
  {
    id: "docs",
    stream: "stdout",
    data: "Repository: https://github.com/moyarich/console\n",
  },
  {
    id: "source-error",
    stream: "stderr",
    data: "Error: packages/console/src/components/ConsoleStdout.tsx:1\n",
  },
];

function LinkProviderExample({
  initialMode = "console",
}: { initialMode?: ConsoleMode } = {}) {
  const [mode, setMode] = useState<ConsoleMode>(initialMode);
  const [lastOpened, setLastOpened] = useState("");
  const sourceProvider: ConsoleLinkProvider = {
    id: "source-location",
    provideLinks({ text }) {
      return Array.from(
        text.matchAll(/\b[\w./-]+\.(?:ts|tsx|js|jsx):\d+(?::\d+)?\b/g),
        (match) => ({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          title: "Open source location",
          action: ({ link }) => setLastOpened(link.text),
        }),
      );
    },
  };
  const input =
    mode === "terminal"
      ? { mode: "terminal" as const, messages: terminalMessages }
      : { mode: "console" as const, messages: structuredMessages };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>
        Output mode{" "}
        <select
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as ConsoleMode);
            setLastOpened("");
          }}
        >
          <option value="console">Structured messages</option>
          <option value="terminal">Terminal output</option>
        </select>
      </label>
      <Console
        {...input}
        linkProviders={[sourceProvider]}
        title="Source-location links"
        subtitle="One provider works with both output modes."
      />
      <div data-console-link-provider-result role="status">
        Last source action:{" "}
        <strong>{lastOpened || "click a source link"}</strong>
      </div>
    </div>
  );
}

const meta = {
  title: "Addons/Links",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnsiSourceLocation: Story = {
  render: () => <LinkProviderExample initialMode="terminal" />,
  play: async ({ canvasElement }) => {
    const ansiConsole = canvasElement.querySelector(
      '[data-console-mode="terminal"]',
    );

    if (!ansiConsole) {
      throw new Error("Expected the ANSI link-provider console.");
    }

    const sourceLink = ansiConsole.querySelector<HTMLButtonElement>(
      "button.console-link-button",
    );

    if (!sourceLink) {
      throw new Error("Expected an ANSI source-location provider link.");
    }

    sourceLink.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const result = canvasElement.querySelector(
      "[data-console-link-provider-result] strong",
    );

    if (!result?.textContent?.includes(".tsx:")) {
      throw new Error("Expected the ANSI provider action to run.");
    }
  },
};
