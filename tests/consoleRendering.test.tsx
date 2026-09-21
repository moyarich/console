import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  ConsoleStdout,
  type ConsoleMessageData,
} from "@moyarich/console";

function renderConsole(messages: ConsoleMessageData[], error = "") {
  return renderToStaticMarkup(
    <Console messages={messages} error={error} onClear={() => undefined} />,
  );
}

describe("Console rendering", () => {
  const escape = String.fromCharCode(27);

  it("renders primitive values", () => {
    const html = renderConsole([
      { method: "log", data: ["text", 2, true, null, undefined], depth: 0 },
    ]);
    expect(html).toContain("&quot;text&quot;");
    expect(html).toContain(">2<");
    expect(html).toContain(">true<");
    expect(html).toContain(">null<");
    expect(html).toContain(">undefined<");
  });

  it("renders object and array inspectors", () => {
    const html = renderConsole([
      { method: "log", data: [{ margin: "10px" }, [1, 2, 3]], depth: 0 },
    ]);
    expect(html).toContain("Object");
    expect(html).toContain("margin");
    expect(html).toContain("Array(3)");
    expect(html.match(/aria-label="Copy object"/g)?.length).toBe(2);
  });

  it("honors dir expansion depth", () => {
    const html = renderConsole([
      {
        method: "dir",
        data: [{ outer: { inner: { value: 1 } } }],
        depth: 0,
        expandLevel: 2,
      },
    ]);
    expect(html.match(/<details[^>]* open=""/g)?.length).toBe(2);
    expect(html).toContain("outer");
    expect(html).toContain("inner");
  });

  it("renders Map and Set inspectors", () => {
    const html = renderConsole([
      {
        method: "log",
        data: [new Map([["name", "console"]]), new Set(["log", "warn"])],
        depth: 0,
      },
    ]);

    expect(html).toContain("Map(1)");
    expect(html).toContain("Set(2)");
  });

  it("renders console.table", () => {
    const html = renderConsole([
      { method: "table", data: [[3, 23, 34]], depth: 0 },
    ]);
    expect(html).toContain("(index)");
    expect(html).toContain(">Value<");
    expect(html).toContain('aria-label="Copy table data"');
  });

  it("renders grouped message indentation", () => {
    const html = renderConsole([
      { method: "group", data: ["outer"], depth: 0 },
      { method: "log", data: ["inside"], depth: 1 },
    ]);
    expect(html).toContain('data-method="group"');
    expect(html).toContain("padding-left:30px");
  });

  it("filters visible messages", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[
          { method: "log", data: ["visible"], depth: 0 },
          { method: "debug", data: ["hidden"], depth: 0 },
        ]}
        filter={(message) => message.method !== "debug"}
      />,
    );

    expect(html).toContain("visible");
    expect(html).not.toContain("&quot;hidden&quot;");
  });

  it("can hide the header", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["hello"], depth: 0 }]}
        showHeader={false}
      />,
    );

    expect(html).not.toContain("console-panel-header");
    expect(html).toContain("hello");
  });

  it("can hide the clear button while rendering custom actions", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["hello"], depth: 0 }]}
        onClear={() => undefined}
        showClearButton={false}
        actions={<button type="button">Custom action</button>}
      />,
    );

    expect(html).toContain("Custom action");
    expect(html).not.toContain("> Clear<");
  });

  it("renders console actions behind an ellipsis popover", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["hello"], depth: 0 }]}
        onClear={() => undefined}
        actions={<button type="button">Export</button>}
      />,
    );

    expect(html).toContain("console-actions-trigger");
    expect(html).toContain("popovertarget=");
    expect(html).toContain('popover="auto"');
    expect(html).toContain(">Export<");
    expect(html).toContain(">Clear<");
    expect(html).not.toContain("console-toolbar");
    expect(html).not.toContain('role="tablist"');
  });

  it("renders ANSI messages through Console mode", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[
          `${escape}[38;5;196mred${escape}[0m`,
          { id: "plain", data: "plain stdout" },
          { id: "stderr", data: "stderr output", stream: "stderr" },
        ]}
      />,
    );

    expect(html).toContain("red");
    expect(html).toContain("rgb(255, 0, 0)");
    expect(html).toContain("plain stdout");
    expect(html).toContain("ANSI-aware process output");
    expect(html).toContain('data-stream="stderr"');
    expect(html).toContain(">Copy output<");
    expect(html).toContain('data-console-mode="ansi"');
  });

  it("does not add the ANSI copy action in console mode", () => {
    const html = renderToStaticMarkup(
      <Console messages={[{ method: "log", data: ["hello"], depth: 0 }]} />,
    );

    expect(html).not.toContain(">Copy output<");
    expect(html).toContain('data-console-mode="console"');
  });

  it("renders the ANSI empty state through Console", () => {
    const html = renderToStaticMarkup(<Console mode="ansi" messages={[]} />);

    expect(html).toContain("No process output yet.");
  });

  it("renders ConsoleStdout independently", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={["one", "two"]} />,
    );

    expect(html).toContain("one");
    expect(html).toContain("two");
  });

  it("renders ANSI stdout with Anser", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={[`${escape}[38;5;196mred${escape}[0m`]} />,
    );

    expect(html).toContain("red");
    expect(html).toContain("rgb(255, 0, 0)");
  });

  it("renders ANSI decorations and truecolor from Anser tokens", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout
        entries={[`${escape}[1;3;38;2;12;34;56mstyled${escape}[0m`]}
      />,
    );

    expect(html).toContain("styled");
    expect(html).toContain("font-weight:bold");
    expect(html).toContain("font-style:italic");
    expect(html).toContain("rgb(12, 34, 56)");
  });

  it("marks carriage-return output using Anser clearLine metadata", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={["loading 10%\rloading 20%"]} />,
    );

    expect(html).toContain('data-clear-line="true"');
  });

  it("promotes strict JSON ANSI output to expandable objects", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        parseStructuredOutput
        messages={[
          `${escape}[36m{"user":{"id":42,"name":"Ada"},"roles":["admin"]}${escape}[0m`,
        ]}
      />,
    );

    expect(html).toContain("Object");
    expect(html).toContain("user");
    expect(html).toContain("roles");
    expect(html).toContain('aria-label="Copy object"');
  });

  it("leaves JavaScript-like terminal objects as text", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        parseStructuredOutput
        messages={["{ name: 'Ada', score: 42 }"]}
      />,
    );

    expect(html).toContain("{ name: &#x27;Ada&#x27;, score: 42 }");
    expect(html).not.toContain('aria-label="Copy object"');
  });

  it("escapes stdout HTML before ANSI conversion", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={["<script>alert('x')</script>"]} />,
    );

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("appends runtime errors", () => {
    const html = renderConsole(
      [{ method: "log", data: ["before"], depth: 0 }],
      "Error: boom",
    );
    expect(html).toContain("before");
    expect(html).toContain('data-method="error"');
    expect(html).toContain("Error: boom");
  });
});
