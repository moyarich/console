import { createContext, type MouseEvent } from "react";
import type { ConsoleMessageData } from "../types";

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

export const ConsoleContextMenuContext =
  createContext<ConsoleContextMenuApi | null>(null);
