import { createContext, type MouseEvent } from "react";

export interface ConsoleContextMenuApi {
  copyObject: (value: object) => void;
  openForValue: (event: MouseEvent<HTMLElement>, value: object) => void;
}

export const ConsoleContextMenuContext = createContext<ConsoleContextMenuApi | null>(null);
