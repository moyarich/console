import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Console, useConsoleMessages } from "@moyarich/console";
import type { CapturedConsoleMethod } from "../packages/console/src/console/consoleMethods";

type MethodExample = {
  description: string;
  run: (console: globalThis.Console) => void;
  expected: string;
};

const examples = {
  log: {
    description: "Log strings, numbers, booleans, and inspectable objects.",
    run: (console) =>
      console.log("Hello from console.log", 42, true, { ready: true }),
    expected: "Hello from console.log",
  },
  debug: {
    description: "Inspect diagnostic details with debug output.",
    run: (console) =>
      console.debug("Cache lookup", { key: "profile", hit: true }),
    expected: "Cache lookup",
  },
  info: {
    description: "Report an informational event.",
    run: (console) => console.info("Connected to the server"),
    expected: "Connected to the server",
  },
  warn: {
    description: "Highlight a recoverable warning.",
    run: (console) => console.warn("Retrying request", { attempt: 2 }),
    expected: "Retrying request",
  },
  error: {
    description: "Show an error with supporting details.",
    run: (console) =>
      console.error("Request failed", { status: 503, retryable: true }),
    expected: "Request failed",
  },
  assert: {
    description:
      "Only failed assertions produce output; the passing assertion stays silent.",
    run: (console) => {
      console.assert(true, "Passing assertion should stay silent");
      console.assert(false, "Expected an authenticated user", {
        authenticated: false,
      });
    },
    expected: "Expected an authenticated user",
  },
  dir: {
    description:
      "Inspect nested object properties with an initial expansion depth.",
    run: (console) =>
      console.dir(
        { profile: { name: "Ada", preferences: { theme: "dark" } } },
        { depth: 2 },
      ),
    expected: "profile",
  },
  dirxml: {
    description: "The console proxy maps dirxml to the object inspector (dir).",
    run: (console) =>
      console.dirxml({
        tagName: "SECTION",
        children: [{ tagName: "H1", textContent: "Welcome" }],
      }),
    expected: "tagName",
  },
  table: {
    description: "Compare records in a table using selected columns.",
    run: (console) =>
      console.table(
        [
          { name: "API", status: "healthy", port: 3000 },
          { name: "Worker", status: "idle", port: 3001 },
        ],
        ["name", "status"],
      ),
    expected: "healthy",
  },
  count: {
    description:
      "Named counters increment independently. Run again to continue counting.",
    run: (console) => {
      console.count("requests");
      console.count("requests");
      console.count("cache hits");
    },
    expected: "requests:",
  },
  countReset: {
    description: "Reset a named counter; its next count starts at one again.",
    run: (console) => {
      console.countReset("requests");
      console.count("requests");
      console.count("requests");
      console.countReset("requests");
      console.count("requests");
    },
    expected: "requests: 1",
  },
  time: {
    description:
      "Start a timer without emitting a message, then use timeEnd to display its duration.",
    run: (console) => {
      console.time("load");
      console.timeEnd("load");
    },
    expected: "load:",
  },
  timeLog: {
    description:
      "Log elapsed time and extra data while keeping the timer active.",
    run: (console) => {
      console.time("load");
      console.timeLog("load", "Checkpoint reached");
      console.timeEnd("load");
    },
    expected: "Checkpoint reached",
  },
  timeEnd: {
    description:
      "Finish a timer and show its duration. Ending it again produces a missing-timer warning.",
    run: (console) => {
      console.time("load");
      console.timeEnd("load");
      console.timeEnd("load");
    },
    expected: "Timer load does not exist",
  },
  timeStamp: {
    description:
      "timeStamp is accepted as a no-op by the proxy; it does not emit a console row.",
    run: (console) => {
      console.log("Before timestamp");
      console.timeStamp("timeline marker");
      console.log("After timestamp");
    },
    expected: "After timestamp",
  },
  trace: {
    description: "Display a message and the captured JavaScript call stack.",
    run: (console) => console.trace("Trace from the story"),
    expected: "Trace from the story",
  },
  group: {
    description: "Start a group and indent its nested messages.",
    run: (console) => {
      console.group("Build");
      console.log("Compiling modules");
      console.groupEnd();
      console.info("Build complete");
    },
    expected: "Compiling modules",
  },
  groupCollapsed: {
    description:
      "Emit a groupCollapsed entry and nested output using the proxy's group depth.",
    run: (console) => {
      console.groupCollapsed("Request details");
      console.log({ path: "/api/profile", status: 200 });
      console.groupEnd();
    },
    expected: "Request details",
  },
  groupEnd: {
    description:
      "End the current group so subsequent messages return to the parent depth.",
    run: (console) => {
      console.group("Outer");
      console.group("Inner");
      console.log("Inside inner group");
      console.groupEnd();
      console.log("Back in outer group");
      console.groupEnd();
      console.log("Back at root");
    },
    expected: "Back at root",
  },
  clear: {
    description:
      "Clear the seeded output through console.clear. Restore it to try again.",
    run: (console) => console.clear(),
    expected: "No console output yet.",
  },
} satisfies Record<CapturedConsoleMethod, MethodExample>;

function ConsoleMethodExample({ method }: { method: CapturedConsoleMethod }) {
  const { messages, console, clear } = useConsoleMessages({
    source: `storybook-console-${method}`,
    initialMessages:
      method === "clear"
        ? [{ method: "log", data: ["Output to clear"], depth: 0 }]
        : [],
  });
  const example = examples[method];
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 960, margin: "0 auto" }}>
      <p style={{ margin: 0 }}>{example.description}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => example.run(console)}>
          Run console.{method}
        </button>
        {method === "clear" && (
          <button type="button" onClick={() => console.log("Output to clear")}>
            Restore output
          </button>
        )}
      </div>
      <Console
        title={`console.${method}`}
        messages={messages}
        onClear={clear}
      />
    </div>
  );
}

const meta = {
  title: "Console/Console methods",
  component: ConsoleMethodExample,
} satisfies Meta<typeof ConsoleMethodExample>;
export default meta;
type Story = StoryObj<typeof meta>;

function methodStory(method: CapturedConsoleMethod): Story {
  return {
    name: `console.${method}`,
    args: { method },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", {
          name: `Run console.${method}`,
        }),
      );
      await expect(canvasElement).toHaveTextContent(examples[method].expected);
      if (method === "assert")
        await expect(canvasElement).not.toHaveTextContent(
          "Passing assertion should stay silent",
        );
      if (method === "timeStamp")
        await expect(canvasElement).not.toHaveTextContent("timeline marker");
      if (method === "clear")
        await expect(canvasElement).not.toHaveTextContent("Output to clear");
    },
  };
}

export const Log: Story = { ...methodStory("log"), name: "console.log" };
export const Debug: Story = { ...methodStory("debug"), name: "console.debug" };
export const Info: Story = { ...methodStory("info"), name: "console.info" };
export const Warn: Story = { ...methodStory("warn"), name: "console.warn" };
export const Error: Story = { ...methodStory("error"), name: "console.error" };
export const Assert: Story = {
  ...methodStory("assert"),
  name: "console.assert",
};
export const Dir: Story = { ...methodStory("dir"), name: "console.dir" };
export const Dirxml: Story = {
  ...methodStory("dirxml"),
  name: "console.dirxml",
};
export const Table: Story = { ...methodStory("table"), name: "console.table" };
export const Count: Story = { ...methodStory("count"), name: "console.count" };
export const CountReset: Story = {
  ...methodStory("countReset"),
  name: "console.countReset",
};
export const Time: Story = { ...methodStory("time"), name: "console.time" };
export const TimeLog: Story = {
  ...methodStory("timeLog"),
  name: "console.timeLog",
};
export const TimeEnd: Story = {
  ...methodStory("timeEnd"),
  name: "console.timeEnd",
};
export const TimeStamp: Story = {
  ...methodStory("timeStamp"),
  name: "console.timeStamp",
};
export const Trace: Story = { ...methodStory("trace"), name: "console.trace" };
export const Group: Story = { ...methodStory("group"), name: "console.group" };
export const GroupCollapsed: Story = {
  ...methodStory("groupCollapsed"),
  name: "console.groupCollapsed",
};
export const GroupEnd: Story = {
  ...methodStory("groupEnd"),
  name: "console.groupEnd",
};
export const Clear: Story = { ...methodStory("clear"), name: "console.clear" };
