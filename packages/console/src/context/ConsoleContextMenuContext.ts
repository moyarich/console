import { createContext, type MouseEvent } from "react";
import type { ConsoleMessageData } from "../types";

/** Imperative context-menu API exposed to console value/message descendants. */
export interface ConsoleContextMenuApi {
  /** Copies an inspectable object using the console's safe object formatter. */
  copyObject: (value: object) => void;
  /** Opens the context menu for an inspectable value. */
  openForValue: (event: MouseEvent<HTMLElement>, value: object) => void;
  /** Opens the context menu for a structured message. */
  openForMessage: (
    event: MouseEvent<HTMLElement>,
    message: ConsoleMessageData,
    index: number,
    messages: readonly ConsoleMessageData[],
  ) => void;
  /** Whether descendants should expose keyboard-focusable message targets. */
  messageContextEnabled: boolean;
}

/** React context backing {@link useConsoleContextMenu}. */
export const ConsoleContextMenuContext =
  createContext<ConsoleContextMenuApi | null>(null);
