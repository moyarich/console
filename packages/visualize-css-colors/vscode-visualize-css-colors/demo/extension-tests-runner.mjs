import { access } from "node:fs/promises";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Keeps the VS Code extension-test process alive until the recorder signals
 * that the current demo scenario has finished.
 */
export async function run() {
  const completionFile = process.env.EXTENSION_DEMO_COMPLETION_FILE;
  if (!completionFile) {
    throw new Error("EXTENSION_DEMO_COMPLETION_FILE is required.");
  }

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      await access(completionFile);
      return;
    } catch {
      await delay(250);
    }
  }

  throw new Error("Timed out waiting for the demo recorder to finish.");
}
