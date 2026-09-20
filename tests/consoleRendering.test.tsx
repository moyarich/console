import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console, type ConsoleMessageData } from "@moyarich/console";

function renderConsole(messages: ConsoleMessageData[], error = "") {
  return renderToStaticMarkup(<Console messages={messages} error={error} onClear={() => undefined} />);
}

describe("Console rendering", () => {
  it("renders primitive values", () => {
    const html = renderConsole([{ method: "log", data: ["text", 2, true, null, undefined], depth: 0 }]);
    expect(html).toContain("&quot;text&quot;");
    expect(html).toContain(">2<");
    expect(html).toContain(">true<");
    expect(html).toContain(">null<");
    expect(html).toContain(">undefined<");
  });

  it("renders object and array inspectors", () => {
    const html = renderConsole([{ method: "log", data: [{ margin: "10px" }, [1, 2, 3]], depth: 0 }]);
    expect(html).toContain("Object");
    expect(html).toContain("margin");
    expect(html).toContain("Array(3)");
    expect(html.match(/aria-label="Copy object"/g)?.length).toBe(2);
  });

  it("honors dir expansion depth", () => {
    const html = renderConsole([{ method: "dir", data: [{ outer: { inner: { value: 1 } } }], depth: 0, expandLevel: 2 }]);
    expect(html.match(/<details[^>]* open=""/g)?.length).toBe(2);
    expect(html).toContain("outer");
    expect(html).toContain("inner");
  });

  it("renders console.table", () => {
    const html = renderConsole([{ method: "table", data: [[3, 23, 34]], depth: 0 }]);
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

  it("appends runtime errors", () => {
    const html = renderConsole([{ method: "log", data: ["before"], depth: 0 }], "Error: boom");
    expect(html).toContain("before");
    expect(html).toContain('data-method="error"');
    expect(html).toContain("Error: boom");
  });
});
