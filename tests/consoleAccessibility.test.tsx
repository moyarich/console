import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console, type ConsoleMessageData } from "@moyarich/console";

const messages: ConsoleMessageData[] = [
  { id: "first", method: "log", depth: 0, data: ["Build started"] },
  { id: "second", method: "warn", depth: 0, data: ["Review warnings"] },
];

describe("Console announcement accessibility", () => {
  it("defaults to a named, non-live log for high-volume output", () => {
    const html = renderToStaticMarkup(
      <Console messages={messages} title="Build output" />,
    );
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-label="Build output"');
    expect(html).toContain('aria-live="off"');
    expect(html).toContain('aria-relevant="additions"');
    expect(html).toContain('aria-atomic="false"');
    expect(html).toContain("Build started");
  });

  it.each(["polite", "assertive"] as const)(
    "supports explicit %s announcements",
    (announcementMode) => {
      const html = renderToStaticMarkup(
        <Console
          messages={messages}
          announcementMode={announcementMode}
          outputLabel="Streaming results"
        />,
      );
      expect(html).toContain(`aria-live="${announcementMode}"`);
      expect(html).toContain('aria-label="Streaming results"');
    },
  );

  it("keeps the log focusable programmatically without adding inert message tab stops", () => {
    const html = renderToStaticMarkup(
      <Console messages={messages} announcementMode="off" />,
    );
    expect(html).toContain('aria-live="off"');
    expect(html).toContain('tabindex="-1"');
    // Message groups become keyboard-focusable only when context actions exist.
    expect(html).not.toContain('role="group"');
  });

  it("uses the same announcement policy for terminal output", () => {
    const html = renderToStaticMarkup(
      <Console
        mode="terminal"
        messages={["Connected", "Ready"]}
        announcementMode="off"
        outputLabel="Process output"
      />,
    );
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-label="Process output"');
    expect(html).toContain('aria-live="off"');
  });
});
