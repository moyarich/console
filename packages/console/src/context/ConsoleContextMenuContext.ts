import { createContext, type MouseEvent } from "react";
import type { ConsoleMessageData } from "../types";

/** Imperative context-menu API exposed to console value/message descendants. */
export interface ConsoleContextMenuApi {
  copyObject: (value: object) => void;
  openForValue: (event: MouseEvent<HTMLElement>, value: object) => void;
  openForMessage: (
    event: MouseEvent<HTMLElement>,
    message: ConsoleMessageData,
    index: number,
    messages: readonly ConsoleMessageData[],
  ) => void;
  messageContextEnabled: boolean;
}

/** React context backing {@link useConsoleContextMenu}. */
export const ConsoleContextMenuContext =
  createContext<ConsoleContextMenuApi | null>(null);
