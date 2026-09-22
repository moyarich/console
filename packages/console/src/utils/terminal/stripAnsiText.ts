import Anser from "anser";

/**
 * Removes ANSI control sequences while preserving visible text.
 *
 * @param data ANSI-encoded process-output text.
 * @returns Plain visible text.
 */
export function stripAnsiText(data: string): string {
  return Anser.ansiToText(data);
}
