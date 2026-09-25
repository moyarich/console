import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";

export async function captureScenario({ page, name, projectDirectory }) {
  const directory = path.join(projectDirectory, "demo/generated-scenarios/");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFile = path.join(directory, `${name}-${timestamp}.mjs`);
  const context = page.context();
  // The Playwright CLI uses this internal API for codegen output. Keep the
  // dependency pinned and this adapter isolated until a public API exists.
  if (typeof context._enableRecorder !== "function") {
    throw new Error(
      "This Playwright version does not support the Inspector recorder adapter.",
    );
  }
  // Monaco swatches have no accessible name. Give codegen stable targets
  // instead of generating a click on the entire editor's text content.
  await page.evaluate(() => {
    const labelSwatches = () => {
      document
        .querySelectorAll(".monaco-editor .colorpicker-color-decoration")
        .forEach((element, index) => {
          const id = `color-swatch-${index}`;
          if (element.getAttribute("data-testid") !== id)
            element.setAttribute("data-testid", id);
        });
    };
    labelSwatches();
    const observer = new MutationObserver(labelSwatches);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), {
      once: true,
    });
  });

  await context._enableRecorder({
    language: "javascript", //"playwright-test"
    mode: "recording",
    testIdAttributeName: "data-testid",
    outputFile,
    handleSIGINT: false,
  });

  console.log(`Inspector recording to ${outputFile}`);
  console.log(
    "Interact with VS Code. Press Enter in this terminal when finished.",
  );
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let finish;
  const interrupted = new Promise((resolve) => {
    finish = resolve;
  });
  process.once("SIGINT", finish);
  try {
    await Promise.race([
      interrupted,
      terminal.question("Finish recording: "),
      new Promise((resolve) => page.once("close", resolve)),
    ]);
  } finally {
    process.removeListener("SIGINT", finish);
    terminal.close();
    await context._disableRecorder().catch(() => undefined);
  }
  // Codegen batches file writes for 250 ms. Allow its last action to flush.
  await new Promise((resolve) => setTimeout(resolve, 300));
  await access(outputFile);
  console.log(`Saved Playwright code: ${outputFile}`);
}
