import { describe, expect, it, vi } from "vitest";
import type {
  ConsoleContextMenuAction,
  ConsoleContextMenuActionContext,
  ConsoleMessageAction,
  ConsoleMessageActionContext,
  ConsoleMessageData,
} from "@moyarich/console";
import { resolveConsoleActions } from "../packages/console/src/actions";

describe("console actions", () => {
  it("filters context actions and resolves disabled predicates", () => {
    const context: ConsoleContextMenuActionContext = {
      kind: "console",
      mode: "console",
      hasMessages: false,
    };
    const actions: ConsoleContextMenuAction[] = [
      {
        id: "always",
        label: "Always",
        onSelect: () => undefined,
      },
      {
        id: "hidden",
        label: "Hidden",
        visible: false,
        onSelect: () => undefined,
      },
      {
        id: "requires-output",
        label: "Requires output",
        disabled: ({ hasMessages }) => !hasMessages,
        onSelect: () => undefined,
      },
    ];

    const resolved = resolveConsoleActions(actions, context);

    expect(resolved.map(({ action }) => action.id)).toEqual([
      "always",
      "requires-output",
    ]);
    expect(resolved[0]?.disabled).toBe(false);
    expect(resolved[1]?.disabled).toBe(true);
  });

  it("passes message metadata to per-message action callbacks", async () => {
    const message: ConsoleMessageData = {
      id: "message-1",
      method: "error",
      data: ["boom"],
      depth: 0,
      source: "worker.ts:42",
    };
    const messages = [message];
    const context: ConsoleMessageActionContext = {
      kind: "message",
      mode: "console",
      hasMessages: true,
      message,
      index: 0,
      messages,
    };
    const onSelect = vi.fn();
    const actions: ConsoleMessageAction[] = [
      {
        id: "open-source",
        label: "Open source",
        visible: ({ message: candidate }) => Boolean(candidate.source),
        disabled: ({ message: candidate }) => !candidate.source,
        onSelect,
      },
    ];

    const [resolved] = resolveConsoleActions(actions, context);

    expect(resolved?.disabled).toBe(false);
    await resolved?.action.onSelect(context);
    expect(onSelect).toHaveBeenCalledWith(context);
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      kind: "message",
      message,
      index: 0,
      messages,
    });
  });

  it("fails closed when host predicates throw", () => {
    const context: ConsoleContextMenuActionContext = {
      kind: "console",
      mode: "ansi",
      hasMessages: true,
    };
    const actions: ConsoleContextMenuAction[] = [
      {
        id: "broken-visible",
        label: "Broken visible",
        visible: () => {
          throw new Error("visibility failed");
        },
        onSelect: () => undefined,
      },
      {
        id: "broken-disabled",
        label: "Broken disabled",
        disabled: () => {
          throw new Error("disabled failed");
        },
        onSelect: () => undefined,
      },
    ];

    const resolved = resolveConsoleActions(actions, context);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.action.id).toBe("broken-disabled");
    expect(resolved[0]?.disabled).toBe(true);
  });
});
