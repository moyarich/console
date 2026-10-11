import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  stringifyConsoleValue,
  type ConsoleMessageData,
} from "@moyarich/console";

const message = (
  method: ConsoleMessageData["method"],
  data: unknown[],
): ConsoleMessageData => ({ method, data, depth: 0 });

function render(
  data: unknown[],
  valueDisplay: "structured" | "string" = "string",
  method: ConsoleMessageData["method"] = "log",
) {
  return renderToStaticMarkup(
    <Console messages={[message(method, data)]} valueDisplay={valueDisplay} />,
  );
}

describe("console value display", () => {
  it("keeps structured rendering by default", () => {
    const html = renderToStaticMarkup(
      <Console messages={[message("log", [{ a: 1 }])]} />,
    );
    expect(html).toContain("console-object-shell");
  });
  it("renders objects, arrays, and independent arguments as text", () => {
    const html = render([{ a: 1 }, [1, "two"], "plain"]);
    expect(html).toContain("{&quot;a&quot;:1}");
    expect(html).toContain("[1,&quot;two&quot;]");
    expect(html).toContain("plain");
    expect(html).not.toContain("console-object-shell");
  });
  it("does not quote plain strings and handles primitives", () => {
    expect(stringifyConsoleValue("hello")).toBe("hello");
    expect(stringifyConsoleValue(null)).toBe("null");
    expect(stringifyConsoleValue(undefined)).toBe("undefined");
    expect(stringifyConsoleValue(12n)).toBe("12");
    expect(render(["hello", true, 42, null, undefined])).toContain("hello");
  });
  it("serializes circular and problematic values safely", () => {
    const circular: Record<string, unknown> = { name: "a" };
    circular.self = circular;
    expect(stringifyConsoleValue(circular)).toContain("[Circular]");
    expect(stringifyConsoleValue({ count: 1n })).toContain("1");
    expect(() =>
      stringifyConsoleValue({
        get broken() {
          throw Error("oops");
        },
      }),
    ).not.toThrow();
  });
  it("preserves dir and table specific behavior", () => {
    expect(render([{ nested: true }], "string", "dir")).toContain(
      "{&quot;nested&quot;:true}",
    );
    expect(render([[{ score: 7 }]], "string", "table")).toContain(
      "console-table",
    );
  });
  it("lets custom value renderers take precedence", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[message("log", [{ a: 1 }])]}
        valueDisplay="string"
        valueRenderers={[
          {
            type: "object",
            render: () => <em>custom-value</em>,
          },
        ]}
      />,
    );
    expect(html).toContain("custom-value");
  });
  it("can switch modes on unchanged message data", () => {
    const messages = [message("log", [{ untouched: true }])];
    const structured = renderToStaticMarkup(
      <Console messages={messages} valueDisplay="structured" />,
    );
    const plain = renderToStaticMarkup(
      <Console messages={messages} valueDisplay="string" />,
    );
    const restored = renderToStaticMarkup(
      <Console messages={messages} valueDisplay="structured" />,
    );
    expect(structured).toContain("console-object-shell");
    expect(plain).toContain("untouched");
    expect(plain).not.toContain("console-object-shell");
    expect(restored).toContain("console-object-shell");
    expect(messages[0]!.data[0]).toEqual({ untouched: true });
  });
});
