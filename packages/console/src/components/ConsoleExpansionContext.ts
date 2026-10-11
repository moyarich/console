import { createContext } from "react";

/** Per-row cache that keeps object expansion through virtual unmount/remount. */
export const ConsoleExpansionContext = createContext<WeakMap<object, boolean> | null>(
  null,
);
