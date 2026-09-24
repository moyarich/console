import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  ConsoleLinkedText,
  ConsoleStdout,
  type ConsoleHandle,
  type ConsoleLinkProvider,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";

function renderConsole(messages: ConsoleMessageData[], error = "") {
  return renderToStaticMarkup(
    <Console messages={messages} error={error} onClear={() => undefined} />,
  );
}

describe("Console rendering", () => {
  const escape = String.fromCharCode(27);

  it("renders stable logical message ids as viewport targets", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "message-42",
            method: "log",
            data: ["target"],
            depth: 0,
          },
        ]}
      />,
    );

    expect(html).toContain('data-console-message-id="message-42"');
  });

  it("renders ANSI entry ids as viewport targets", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[{ id: "stdout-42", data: "target", stream: "stdout" }]}
      />,
    );

    expect(html).toContain('data-console-message-id="stdout-42"');
  });

  it("renders scroll-end breathing room after non-empty output", () => {
    const html = renderConsole([
      { method: "log", data: ["last message"], depth: 0 },
    ]);
    const emptyHtml = renderConsole([]);

    expect(html.indexOf("console-scroll-end-spacer")).toBeGreaterThan(
      html.indexOf("last message"),
    );
    expect(html).toContain('class="console-scroll-end-spacer"');
    expect(html).toContain('aria-hidden="true"');
    expect(emptyHtml).not.toContain("console-scroll-end-spacer");
  });

  it("accepts a ConsoleHandle ref across the server render lifecycle", () => {
    const ref = createRef<ConsoleHandle>();

    expect(ref.current).toBeNull();

    renderToStaticMarkup(
      <Console
        ref={ref}
        messages={[
          {
            id: "ref-target",
            method: "log",
            data: ["ref"],
            depth: 0,
          },
        ]}
      />,
    );

    expect(ref.current).toBeNull();
  });

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
        filter={({ message }) => message.method !== "debug"}
      />,
    );

    expect(html).toContain("visible");
    expect(html).not.toContain("&quot;hidden&quot;");
  });

  it("uses namespaced header classes only", () => {
    const html = renderConsole([{ method: "log", data: ["hello"], depth: 0 }]);

    expect(html).toContain('class="console-panel-header"');
    expect(html).not.toContain('class="console-panel-header panel-header"');
    expect(html).not.toContain('class="console-actions result-actions"');
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
    expect(html).toContain("popoverTarget=");
    expect(html).toContain('popover="auto"');
    expect(html).toContain(">Export<");
    expect(html).toContain("console-clear-button");
    expect(html).toContain("Clear");
    expect(html).not.toContain("console-toolbar");
    expect(html).not.toContain('role="tablist"');
  });

  it("registers keyboard-focusable targets for per-message actions", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "error-1",
            method: "error",
            data: ["boom"],
            depth: 0,
            source: "worker.ts:42",
          },
        ]}
        messageActions={[
          {
            id: "open-source",
            label: "Open source",
            onSelect: () => undefined,
          },
        ]}
      />,
    );

    expect(html).toContain("console-message-action-target");
    expect(html).toContain('aria-label="error console message"');
    expect(html).toContain('tabindex="0"');
  });

  it("registers message targets for custom context menu actions", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["hello"], depth: 0 }]}
        contextMenuActions={[
          {
            id: "inspect",
            label: "Inspect",
            visible: (context) => context.kind === "message",
            onSelect: () => undefined,
          },
        ]}
      />,
    );

    expect(html).toContain("console-message-action-target");
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
    expect(html).toContain("console-copy-output-button");
    expect(html).toContain("Copy output");
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

  it("collapses carriage-return progress updates into one rendered line", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout
        entries={[
          { id: "p10", data: "loading 10%\r", stream: "stdout" },
          { id: "p20", data: "loading 20%\r", stream: "stdout" },
          { id: "p100", data: "loading 100%", stream: "stdout" },
        ]}
      />,
    );

    expect(html).toContain("loading 100%");
    expect(html).not.toContain("loading 10%");
    expect(html).not.toContain("loading 20%");
    expect(html).toContain('data-stream="stdout"');
  });

  it("collapses leading carriage-return redraw chunks like tqdm", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout
        entries={[
          {
            id: "tqdm-0",
            data: "\rDownloading:   0%|          | 0/100",
            stream: "stderr",
          },
          {
            id: "tqdm-1",
            data: "\rDownloading:   1%|1         | 1/100",
            stream: "stderr",
          },
          {
            id: "tqdm-2",
            data: "\rDownloading: 100%|##########| 100/100\n",
            stream: "stderr",
          },
        ]}
      />,
    );

    expect(html).toContain("Downloading: 100%");
    expect(html).not.toContain("Downloading:   0%");
    expect(html).not.toContain("Downloading:   1%");
    expect(html).toContain('data-stream="stderr"');
  });

  it("keeps completed lines stable while progress redraws the current line", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout
        entries={[
          "prepare\n",
          "building 10%\r",
          "building 60%\r",
          "building 100%\ncomplete\n",
        ]}
      />,
    );

    expect(html).toContain("prepare");
    expect(html).toContain("building 100%");
    expect(html).toContain("complete");
    expect(html).not.toContain("building 10%");
    expect(html).not.toContain("building 60%");
  });

  it("treats chunked CRLF as a normal completed newline", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout entries={["first\r", "\nsecond"]} />,
    );

    expect(html).toContain("first");
    expect(html).toContain("second");
  });

  it("honors ANSI clear-line redraws across process-output entries", () => {
    const html = renderToStaticMarkup(
      <ConsoleStdout
        entries={[
          {
            id: "old-progress",
            data: "old progress",
            stream: "stderr",
          },
          {
            id: "new-progress",
            data: `${escape}[2K\rnew progress`,
            stream: "stderr",
          },
        ]}
      />,
    );

    expect(html).toContain("new progress");
    expect(html).not.toContain("old progress");
    expect(html).toContain('data-stream="stderr"');
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

  it("parses structured ANSI output with custom parser hooks", () => {
    let receivedText = "";
    let receivedId: string | undefined;
    let receivedStream: string | undefined;
    let receivedIndex = -1;
    let receivedRawData = "";

    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[
          {
            id: "diagnostic-1",
            data: `  ${escape}[31mERROR TS2322: invalid value${escape}[0m  `,
            stream: "stderr",
          },
        ]}
        structuredOutputParsers={[
          (context) => {
            const { text } = context;
            receivedText = text;
            receivedId = context.id;
            receivedStream = context.stream;
            receivedIndex = context.index;
            receivedRawData =
              typeof context.entry === "string"
                ? context.entry
                : context.entry.data;

            if (!text.includes("TS2322")) {
              return undefined;
            }

            return {
              kind: "diagnostic",
              code: "TS2322",
              message: text.trim(),
            };
          },
        ]}
      />,
    );

    expect(receivedText).toBe("  ERROR TS2322: invalid value  ");
    expect(receivedId).toBe("diagnostic-1");
    expect(receivedStream).toBe("stderr");
    expect(receivedIndex).toBe(0);
    expect(receivedRawData).toContain(`${escape}[31m`);
    expect(html).toContain("Object");
    expect(html).toContain("diagnostic");
    expect(html).toContain("TS2322");
    expect(html).toContain('data-stream="stderr"');
  });

  it("uses undefined as the parser opt-out sentinel", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={["zero"]}
        structuredOutputParsers={[() => undefined, () => 0]}
      />,
    );

    expect(html).toContain(">0<");
    expect(html).not.toContain("zero");
  });

  it("falls back to ANSI text when a structured output parser throws", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={["plain fallback"]}
        structuredOutputParsers={[
          () => {
            throw new Error("parser failed");
          },
        ]}
      />,
    );

    expect(html).toContain("plain fallback");
    expect(html).not.toContain('aria-label="Copy object"');
  });

  it("runs process-output processors in order and composes their output", () => {
    const observations: Array<[string, unknown]> = [];
    const processors: ConsoleProcessOutputProcessor[] = [
      {
        id: "prefix",
        process: ({ output }) => ({
          data: `first: ${output.data}`,
          metadata: { stage: "first" },
        }),
      },
      {
        id: "promote",
        process: (context) => {
          const { output } = context;
          observations.push([context.text, output.metadata.stage]);

          return {
            structuredValue: {
              kind: "processed",
              text: context.text,
              stage: output.metadata.stage,
            },
          };
        },
      },
    ];

    const html = renderToStaticMarkup(
      <Console mode="ansi" messages={["hello"]} processors={processors} />,
    );

    expect(observations).toEqual([["first: hello", "first"]]);
    expect(html).toContain("processed");
    expect(html).toContain("first: hello");
    expect(html).toContain("first");
    expect(html).not.toContain(">hello<");
  });

  it("continues with later processors when one throws", () => {
    const processors: ConsoleProcessOutputProcessor[] = [
      {
        process: ({ output }) => ({ data: `before ${output.data}` }),
      },
      {
        process: () => {
          throw new Error("plugin failed");
        },
      },
      {
        process: ({ output }) => ({ data: `${output.data} after` }),
      },
    ];

    const html = renderToStaticMarkup(
      <Console mode="ansi" messages={["value"]} processors={processors} />,
    );

    expect(html).toContain("before value after");
  });

  it("passes processor metadata to structured output parsers", () => {
    let receivedKind: unknown;

    renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={["EVENT ready"]}
        processors={[
          {
            process: () => ({ metadata: { kind: "runtime-event" } }),
          },
        ]}
        structuredOutputParsers={[
          (context) => {
            const { text } = context;
            receivedKind = context.metadata?.kind;
            return text.startsWith("EVENT") ? { text } : undefined;
          },
        ]}
      />,
    );

    expect(receivedKind).toBe("runtime-event");
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

  it("dispatches custom message renderers by method", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "warn", data: ["custom warning"], depth: 0 }]}
        messageRenderers={[
          {
            method: "warn",
            render: ({ renderDefault }) => (
              <section data-custom-message="warning">{renderDefault()}</section>
            ),
          },
        ]}
      />,
    );

    expect(html).toContain('data-custom-message="warning"');
    expect(html).toContain('data-method="warn"');
    expect(html).toContain("custom warning");
  });

  it("dispatches nested value renderers and falls back on undefined", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[
          {
            method: "dir",
            data: [{ answer: 42, other: 7 }],
            depth: 0,
            expandLevel: 1,
          },
        ]}
        valueRenderers={[
          {
            type: "number",
            render: ({ value }) =>
              value === 42 ? (
                <mark data-custom-value="answer">42</mark>
              ) : undefined,
          },
        ]}
      />,
    );

    expect(html).toContain('data-custom-value="answer"');
    expect(html).toContain(">42<");
    expect(html).toContain(">7<");
  });

  it("falls back to built-in rendering when a custom renderer throws", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[{ method: "log", data: ["safe fallback"], depth: 0 }]}
        messageRenderers={[
          {
            match: () => true,
            render: () => {
              throw new Error("renderer failed");
            },
          },
        ]}
      />,
    );

    expect(html).toContain('data-method="log"');
    expect(html).toContain("safe fallback");
  });

  it("detects web links in structured console strings", () => {
    const html = renderToStaticMarkup(
      <Console
        messages={[
          {
            method: "log",
            data: ["Docs: https://example.com/docs."],
            depth: 0,
          },
        ]}
      />,
    );

    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("console-link");
  });

  it("can disable built-in web-link detection", () => {
    const html = renderToStaticMarkup(
      <Console
        detectLinks={false}
        messages={[
          {
            method: "log",
            data: ["https://example.com/docs"],
            depth: 0,
          },
        ]}
      />,
    );

    expect(html).toContain("https://example.com/docs");
    expect(html).not.toContain('class="console-link"');
    expect(html).not.toContain('href="https://example.com/docs"');
  });

  it("passes stable source ranges to linked text renderers", () => {
    const text = "Before https://example.com after";
    const target = "https://example.com";
    const linkStart = text.indexOf(target);
    const linkEnd = linkStart + target.length;
    const ranges: Array<[string, number, number]> = [];

    renderToStaticMarkup(
      <ConsoleLinkedText
        text={text}
        context={{ mode: "ansi" }}
        renderText={(value, _key, start, end) => {
          ranges.push([value, start, end]);
          return value;
        }}
      />,
    );

    expect(ranges).toEqual([
      [text.slice(0, linkStart), 0, linkStart],
      [target, linkStart, linkEnd],
      [text.slice(linkEnd), linkEnd, text.length],
    ]);
  });

  it("uses custom link providers in structured and ANSI modes", () => {
    const provider: ConsoleLinkProvider = {
      id: "source-location",
      provideLinks({ text }) {
        const match = /src\/app\.ts:42:8/.exec(text);

        if (match?.index === undefined) {
          return undefined;
        }

        return [
          {
            text: match[0],
            start: match.index,
            end: match.index + match[0].length,
            title: "Open source",
            action: () => undefined,
          },
        ];
      },
    };

    const consoleHtml = renderToStaticMarkup(
      <Console
        messages={[
          {
            method: "error",
            data: ["Failure at src/app.ts:42:8"],
            depth: 0,
          },
        ]}
        linkProviders={[provider]}
      />,
    );
    const ansiHtml = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={["Failure at src/app.ts:42:8"]}
        linkProviders={[provider]}
      />,
    );

    expect(consoleHtml).toContain("console-link-button");
    expect(consoleHtml).toContain('title="Open source"');
    expect(ansiHtml).toContain("console-link-button");
    expect(ansiHtml).toContain('title="Open source"');
  });

  it("renders processor-supplied link metadata in ANSI output", () => {
    const text = "Build failed ISSUE-42";
    const start = text.indexOf("ISSUE-42");
    const processors: ConsoleProcessOutputProcessor[] = [
      {
        id: "issue-link",
        process: () => ({
          links: [
            {
              text: "ISSUE-42",
              start,
              end: start + "ISSUE-42".length,
              target: "#issue-42",
            },
          ],
        }),
      },
    ];

    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[text]}
        processors={processors}
        detectLinks={false}
      />,
    );

    expect(html).toContain('href="#issue-42"');
    expect(html).toContain("ISSUE-42");
  });

  it("renders link providers for completed stdout and stderr entries", () => {
    const provider: ConsoleLinkProvider = {
      id: "source-location",
      provideLinks({ text }) {
        const match = /src\/cli\/run\.ts:91:12/.exec(text);

        return match?.index === undefined
          ? undefined
          : [
              {
                text: match[0],
                start: match.index,
                end: match.index + match[0].length,
                action: () => undefined,
              },
            ];
      },
    };

    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[
          {
            id: "docs",
            stream: "stdout",
            data: "Docs: https://example.com/cli\n",
          },
          {
            id: "source-error",
            stream: "stderr",
            data: "Error: src/cli/run.ts:91:12\n",
          },
        ]}
        linkProviders={[provider]}
      />,
    );

    expect(html).toContain('href="https://example.com/cli"');
    expect(html).toContain("console-link-button");
    expect(html).toContain("src/cli/run.ts:91:12");
  });

  it("detects one ANSI link across style-token boundaries", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[`Visit ${escape}[36mhttps://example${escape}[0m.com/docs`]}
      />,
    );

    expect(html).toContain('href="https://example.com/docs"');
    expect(html.match(/href="https:\/\/example\.com\/docs"/g)?.length).toBe(1);
  });
});
