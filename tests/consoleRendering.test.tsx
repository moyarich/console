import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  ConsoleStdout,
  parseAnsi,
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

  it("renders custom runtime actions without built-in restart behavior", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[]}
        actions={<button type="button">Restart server</button>}
      />,
    );

    expect(html).not.toContain("Restart server");
    expect(html).toContain("console-toolbar");
    expect(html).toContain('aria-label="Console actions"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("console-restart-button");
  });

  it("renders toolbar actions behind an ellipsis trigger", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["hello"], depth: 0 }]}
        onClear={() => undefined}
        actions={<button type="button">Export</button>}
      />,
    );

    expect(html).toContain("console-actions-trigger");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(">Export<");
    expect(html).not.toContain(">Clear<");
  });

  it("renders view tabs in their own toolbar", () => {
    const html = renderToStaticMarkup(<Console messages={[]} stdout={[]} />);

    expect(html).toContain("console-panel-header-main");
    expect(html).toContain("console-toolbar");
    expect(html).toContain('role="tablist"');
  });

  it("renders stdout tabs and ANSI output", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[]}
        stdout={[`${escape}[32mready${escape}[0m`]}
        defaultView="stdout"
        consoleTabLabel="Client"
        stdoutTabLabel="Server"
      />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain("Client");
    expect(html).toContain("Server");
    expect(html).toContain("ready");
    expect(html).toContain("color:#0dbc79");
  });

  it("renders ConsoleStdout independently", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={["one", "two"]} />,
    );

    expect(html).toContain("one");
    expect(html).toContain("two");
  });

  it("parses extended ANSI colors", () => {
    expect(parseAnsi(`${escape}[38;5;196mred${escape}[0m`)[0]).toMatchObject({
      text: "red",
      style: { color: "rgb(255 0 0)" },
    });
  });

  it("resets ANSI styles", () => {
    const segments = parseAnsi(`${escape}[31mred${escape}[0mplain`);

    expect(segments[0]).toMatchObject({
      text: "red",
      style: { color: "#cd3131" },
    });
    expect(segments[1]).toEqual({
      text: "plain",
      style: {},
    });
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
