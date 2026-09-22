import Anser from "anser";
import { ANSI_CLEAR_LINE_PATTERN } from "./constants";

/**
 * Returns whether process output contains an ANSI clear-line operation.
 *
 * @param data ANSI-encoded process-output text.
 */
export function hasAnsiClearLine(data: string): boolean {
  return (
    ANSI_CLEAR_LINE_PATTERN.test(data) ||
    Anser.ansiToJson(data).some((token) => token.clearLine)
  );
}
