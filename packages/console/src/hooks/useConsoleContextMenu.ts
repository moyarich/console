import { useContext } from "react";
import { ConsoleContextMenuContext } from "../context/ConsoleContextMenuContext";

export function useConsoleContextMenu() {
  const context = useContext(ConsoleContextMenuContext);
  if (!context) {
    throw new Error(
      "useConsoleContextMenu must be used within ConsoleContextMenu.",
    );
  }
  return context;
}
