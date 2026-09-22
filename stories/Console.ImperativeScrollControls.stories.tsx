import { useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  consoleExtensionPoints,
  consoleServices,
  type ConsoleAddon,
  type ConsoleHandle,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";

const messages: ConsoleMessageData[] = Array.from(
  { length: 60 },
  (_, index) => ({
    id: `story-message-${index + 1}`,
    method: index === 29 ? "warn" : "log",
    depth: 0,
    data: [
      `Story message ${index + 1}`,
      index === 29 ? { status: "warning target" } : { status: "complete" },
    ],
  }),
);

const meta = {
  title: "Console/Console",
  component: Console,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function ImperativeScrollControlsStory() {
  const consoleRef = useRef<ConsoleHandle>(null);
  const [position, setPosition] = useState("Ready");
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "storybook-viewport-navigation",
        activate(host) {
          const viewport = host.services.require(consoleServices.viewport);

          host.extensions.register(consoleExtensionPoints.panelAction, {
            id: "jump-to-warning",
            label: "Jump to warning target",
            onSelect: () => {
              viewport.scrollToMessage("story-message-30", {
                block: "center",
              });
            },
          });
        },
      },
    ],
    [],
  );

  const run = (action: (handle: ConsoleHandle) => void) => {
    const handle = consoleRef.current;
    if (!handle) return;

    action(handle);
    setPosition(
      handle.isAtTop()
        ? "At top"
        : handle.isAtBottom()
          ? "At bottom"
          : "Between top and bottom",
    );
  };

  return (
    <div style={{ width: 760, maxWidth: "90vw" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => run((handle) => handle.scrollToTop())}
        >
          Top
        </button>
        <button
          type="button"
          onClick={() =>
            run((handle) =>
              handle.scrollToMessage("story-message-30", {
                block: "center",
              }),
            )
          }
        >
          Jump to message 30
        </button>
        <button
          type="button"
          onClick={() => run((handle) => handle.scrollToBottom())}
        >
          Bottom
        </button>
        <button type="button" onClick={() => run((handle) => handle.focus())}>
          Focus
        </button>
        <span style={{ alignSelf: "center", fontSize: 12 }}>{position}</span>
      </div>

      <Console
        ref={consoleRef}
        messages={messages}
        addons={addons}
        autoScroll
        title="Imperative scroll controls"
        subtitle="Ref controls and addon service share one viewport implementation."
        style={{ width: "100%", height: 320 }}
      />
    </div>
  );
}

export const ImperativeScrollControls: Story = {
  render: () => <ImperativeScrollControlsStory />,
};
