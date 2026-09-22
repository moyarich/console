import { useContext } from "react";
import { ConsoleContextMenuContext } from "../context/ConsoleContextMenuContext";

/**
 * Returns the nearest console context-menu API.
 *
 * @throws When called outside a {@link ConsoleContextMenu} provider.
 */
export function useConsoleContextMenu() {
  const context = useContext(ConsoleContextMenuContext);
  if (!context) {
    throw new Error(
      "useConsoleContextMenu must be used within ConsoleContextMenu.",
    );
  }
  return context;
}
