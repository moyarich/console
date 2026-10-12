import {
  consoleExtensionPoints,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleProcessControlParser,
} from "@moyarich/console-core";

export const CONSOLE_PROCESS_STATE_ADDON_ID =
  "@moyarich/console-addon-process-state";

export interface ProcessState {
  readonly progress?: { readonly state: number; readonly value?: number };
  readonly cwd?: string;
  readonly command?: {
    readonly phase: "prompt" | "started" | "executing" | "finished";
    readonly exitCode?: number;
  };
  readonly notifications: readonly {
    readonly title: string;
    readonly message: string;
  }[];
}
export type ProcessStateEvent =
  | {
      readonly type: "progress";
      readonly state: number;
      readonly value?: number;
    }
  | { readonly type: "cwd"; readonly cwd: string }
  | {
      readonly type: "command";
      readonly phase: "prompt" | "started" | "executing" | "finished";
      readonly exitCode?: number;
    }
  | {
      readonly type: "notification";
      readonly title: string;
      readonly message: string;
    };

export interface ProcessStateController {
  getState(): ProcessState;
  getEvents(): readonly ProcessStateEvent[];
  subscribe(listener: () => void): () => void;
  reset(): void;
  apply(event: ProcessStateEvent): void;
}

export const consoleProcessStateService =
  createConsoleServiceToken<ProcessStateController>(
    CONSOLE_PROCESS_STATE_ADDON_ID + ".controller",
  );

export function createProcessStateController(): ProcessStateController {
  let state: ProcessState = { notifications: [] };
  let events: ProcessStateEvent[] = [];
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  return {
    getState: () => state,
    getEvents: () => events,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset() {
      state = { notifications: [] };
      events = [];
      emit();
    },
    apply(event) {
      events = [...events, event];
      switch (event.type) {
        case "progress":
          state = {
            ...state,
            progress: {
              state: event.state,
              ...(event.value === undefined ? {} : { value: event.value }),
            },
          };
          break;
        case "cwd":
          state = { ...state, cwd: event.cwd };
          break;
        case "command":
          state = {
            ...state,
            command: {
              phase: event.phase,
              ...(event.exitCode === undefined
                ? {}
                : { exitCode: event.exitCode }),
            },
          };
          break;
        case "notification":
          state = {
            ...state,
            notifications: [
              ...state.notifications,
              { title: event.title, message: event.message },
            ],
          };
          break;
      }
      emit();
    },
  };
}

const sanitize = (value: string) =>
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127 && code !== 155;
    })
    .join("")
    .slice(0, 1024);

function interpret(payload: string): ProcessStateEvent | undefined {
  const parts = payload.split(";");
  if (parts[0] === "9" && parts[1] === "4") {
    if (!/^[0-5]$/.test(parts[2] ?? "")) return undefined;
    if (parts.length > 4) return undefined;
    const value = parts[3] === undefined ? undefined : Number(parts[3]);
    if (
      parts[3] !== undefined &&
      (!/^\d{1,3}$/.test(parts[3]) || (value ?? -1) < 0 || (value ?? 101) > 100)
    )
      return undefined;
    return {
      type: "progress",
      state: Number(parts[2]),
      ...(value === undefined ? {} : { value }),
    };
  }
  if (parts[0] === "9" && parts[1] === "9") {
    const cwd = sanitize(parts.slice(2).join(";"));
    return cwd ? { type: "cwd", cwd } : undefined;
  }
  if (parts[0] === "133") {
    const phases: Record<string, ProcessStateEvent & { type: "command" }> = {
      A: { type: "command", phase: "prompt" },
      B: { type: "command", phase: "started" },
      C: { type: "command", phase: "executing" },
    };
    if (parts[1] === "D") {
      if (
        parts.length > 3 ||
        (parts[2] !== undefined && !/^-?\d{1,8}$/.test(parts[2]))
      )
        return undefined;
      return {
        type: "command",
        phase: "finished",
        ...(parts[2] === undefined ? {} : { exitCode: Number(parts[2]) }),
      };
    }
    return parts.length === 2 ? phases[parts[1] ?? ""] : undefined;
  }
  if (parts[0] === "777" && parts[1] === "notify") {
    const title = sanitize(parts[2] ?? "");
    const message = sanitize(parts.slice(3).join(";"));
    return title || message
      ? { type: "notification", title, message }
      : undefined;
  }
  return undefined;
}

/** Stateful OSC decoder; parsed sequences are removed while printable text is preserved. */
export function createProcessStateParser(
  controller: ProcessStateController,
): ConsoleProcessControlParser {
  let pending = "";
  return {
    id: CONSOLE_PROCESS_STATE_ADDON_ID,
    reset() {
      pending = "";
      controller.reset();
    },
    parse({ output }) {
      const input = pending + output.data;
      pending = "";
      let visible = "";
      const events: ProcessStateEvent[] = [];
      let pos = 0;
      while (pos < input.length) {
        const begin = input.indexOf("\x1b", pos);
        if (begin < 0) {
          visible += input.slice(pos);
          break;
        }
        visible += input.slice(pos, begin);
        if (begin === input.length - 1) {
          pending = input.slice(begin);
          break;
        }
        if (input[begin + 1] !== "]") {
          visible += "\x1b";
          pos = begin + 1;
          continue;
        }
        let end = begin + 2;
        while (
          end < input.length &&
          input[end] !== "\x07" &&
          !(input[end] === "\x1b" && input[end + 1] === "\\")
        )
          end++;
        if (
          end >= input.length ||
          (input[end] === "\x1b" && end + 1 >= input.length)
        ) {
          pending = input.slice(begin).slice(0, 8192);
          break;
        }
        const payload = input.slice(begin + 2, end);
        const event = payload.length <= 4096 ? interpret(payload) : undefined;
        if (event) {
          events.push(event);
          controller.apply(event);
        } else {
          visible += input.slice(begin, end + (input[end] === "\x07" ? 1 : 2));
        }
        pos = end + (input[end] === "\x07" ? 1 : 2);
      }
      return {
        data: visible,
        events: events.map((event) => ({
          type: event.type,
          data: { ...event },
        })),
        omit: visible.length === 0,
      };
    },
  };
}

export interface ProcessStateAddon extends ConsoleAddon {
  readonly controller: ProcessStateController;
}
export function createConsoleProcessStateAddon(
  controller = createProcessStateController(),
): ProcessStateAddon {
  return {
    id: CONSOLE_PROCESS_STATE_ADDON_ID,
    controller,
    activate(host) {
      host.services.provide(consoleProcessStateService, controller);
      host.extensions.register(
        consoleExtensionPoints.processControlParser,
        createProcessStateParser(controller),
        {
          id: CONSOLE_PROCESS_STATE_ADDON_ID + ":parser",
        },
      );
    },
  };
}
