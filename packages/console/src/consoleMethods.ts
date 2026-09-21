/**
 * Registry describing supported native console methods and how they map to
 * renderable {@link ConsoleMethod} values.
 */
export const CONSOLE_METHOD_REGISTRY = {
  log: { messageMethod: "log", direct: true },
  debug: { messageMethod: "debug", direct: true },
  info: { messageMethod: "info", direct: true },
  warn: { messageMethod: "warn", direct: true },
  error: { messageMethod: "error", direct: true },
  assert: { messageMethod: "assert", direct: false },
  dir: { messageMethod: "dir", direct: false },
  table: { messageMethod: "table", direct: false },
  count: { messageMethod: "count", direct: false },
  timeEnd: { messageMethod: "timeEnd", direct: false },
  trace: { messageMethod: "trace", direct: false },
  group: { messageMethod: "group", direct: false },
  groupCollapsed: { messageMethod: "groupCollapsed", direct: false },
  clear: { messageMethod: null, direct: false },
  countReset: { messageMethod: null, direct: false },
  dirxml: { messageMethod: "dir", direct: false },
  groupEnd: { messageMethod: null, direct: false },
  time: { messageMethod: null, direct: false },
  timeLog: { messageMethod: "log", direct: false },
  timeStamp: { messageMethod: null, direct: false },
} as const;

/** Native console method name recognized by capture/proxy utilities. */
export type CapturedConsoleMethod = keyof typeof CONSOLE_METHOD_REGISTRY;

/** Message method that can be represented as a structured console entry. */
export type ConsoleMethod = Exclude<
  (typeof CONSOLE_METHOD_REGISTRY)[CapturedConsoleMethod]["messageMethod"],
  null
>;

/** Ordered list of native console methods recognized by the package. */
export const CAPTURED_CONSOLE_METHODS = Object.freeze(
  Object.keys(CONSOLE_METHOD_REGISTRY) as CapturedConsoleMethod[],
);

const consoleMethodSet = new Set<ConsoleMethod>();

for (const method of CAPTURED_CONSOLE_METHODS) {
  const messageMethod = CONSOLE_METHOD_REGISTRY[method].messageMethod;
  if (messageMethod) {
    consoleMethodSet.add(messageMethod);
  }
}

/** Unique structured message methods produced by the console implementation. */
export const CONSOLE_METHODS = Object.freeze(Array.from(consoleMethodSet));

/**
 * Checks whether a value is a supported structured console message method.
 */
export function isConsoleMethod(value: unknown): value is ConsoleMethod {
  return (
    typeof value === "string" && consoleMethodSet.has(value as ConsoleMethod)
  );
}

/**
 * Returns whether a native method can be forwarded directly without additional
 * stateful console semantics.
 */
export function isDirectConsoleMethod(method: CapturedConsoleMethod): boolean {
  return CONSOLE_METHOD_REGISTRY[method].direct;
}

/**
 * Maps a native console method to the structured message method it emits.
 *
 * @returns The renderable method, or `null` when the native method is handled
 * without emitting a message.
 */
export function getConsoleMessageMethod(
  method: CapturedConsoleMethod,
): ConsoleMethod | null {
  return CONSOLE_METHOD_REGISTRY[method].messageMethod;
}
