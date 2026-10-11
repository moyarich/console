import { createContext } from "react";
import type { ConsoleTextHighlightProvider } from "@moyarich/console-core";

/** Scoped to the Console instance, so separate consoles never share search state. */
export const ConsoleTextHighlightContext =
  createContext<ConsoleTextHighlightProvider | null>(null);
