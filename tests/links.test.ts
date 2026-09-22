import { describe, expect, it } from "vitest";
import {
  detectWebLinks,
  isSafeConsoleLinkTarget,
  resolveConsoleLinks,
  type ConsoleLinkProvider,
} from "@moyarich/console";

describe("console links", () => {
  it("detects safe HTTP and HTTPS URLs with exact ranges", () => {
    const text = "Docs: https://example.com/docs, then http://localhost:3000/test.";
    const links = detectWebLinks(text);

    expect(links).toEqual([
      {
        text: "https://example.com/docs",
        start: 6,
        end: 30,
        target: "https://example.com/docs",
      },
      {
        text: "http://localhost:3000/test",
        start: 37,
        end: 63,
        target: "http://localhost:3000/test",
      },
    ]);
  });

  it("resolves custom providers before built-in URL detection", () => {
    const text = "Open src/app.ts:42:8 or https://example.com";
    const provider: ConsoleLinkProvider = {
      id: "source",
      provideLinks(value) {
        const match = /src\/app\.ts:42:8/.exec(value);

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

    const links = resolveConsoleLinks(
      text,
      { mode: "console" },
      { providers: [provider] },
    );

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({
      text: "src/app.ts:42:8",
      start: 5,
      end: 20,
      providerId: "source",
    });
    expect(links[1]).toMatchObject({
      text: "https://example.com",
      target: "https://example.com",
      providerId: "web",
    });
  });

  it("ignores invalid ranges and navigation targets", () => {
    expect(isSafeConsoleLinkTarget("https://example.com")).toBe(true);
    expect(isSafeConsoleLinkTarget("/issues/5")).toBe(true);
    expect(isSafeConsoleLinkTarget("//example.com")).toBe(false);
    expect(isSafeConsoleLinkTarget("javascript:alert(1)")).toBe(false);

    const links = resolveConsoleLinks(
      "source.ts:4",
      { mode: "console" },
      {
        detectLinks: false,
        links: [
          {
            text: "wrong",
            start: 0,
            end: 4,
            target: "/wrong",
          },
          {
            text: "source.ts:4",
            start: 0,
            end: 11,
            target: "javascript:alert(1)",
          },
        ],
      },
    );

    expect(links).toEqual([]);
  });
});
