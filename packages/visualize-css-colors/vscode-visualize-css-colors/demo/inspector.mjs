import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";

function dedent(source) {
  const lines = source.replace(/^\n+|\n+$/g, "").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const width = indents.length ? Math.min(...indents) : 0;

  return lines.map((line) => line.slice(width)).join("\n");
}

function extractPageActions(source) {
  const start = source.indexOf("await page.");

  if (start === -1) {
    throw new Error("Playwright codegen did not record any page actions.");
  }

  const endMarkers = [
    "// ---------------------",
    "await context.close()",
    "await browser.close()",
  ];
  const ends = endMarkers
    .map((marker) => source.indexOf(marker, start))
    .filter((index) => index !== -1);
  const end = ends.length ? Math.min(...ends) : source.length;

  return dedent(source.slice(start, end));
}

function indent(source, spaces) {
  const prefix = " ".repeat(spaces);
  return source
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : ""))
    .join("\n");
}

async function convertRecording({
  outputFile,
  scenarioName,
  baseScenarioName,
  timestamp,
}) {
  const generated = await readFile(outputFile, "utf8");
  const actions = extractPageActions(generated);
  const content = `import baseScenario from "../scenarios/${baseScenarioName}.mjs";
import { runScenarioModule } from "../scenario-runner.mjs";

const scenario = {
  ...baseScenario,
  name: ${JSON.stringify(scenarioName)},
  baseScenarioName: ${JSON.stringify(baseScenarioName)},
  title: \`${baseScenario.title} — recorded ${timestamp}\`,

  async run({ page }) {
${indent(actions, 4)}
  },
};

export default scenario;

await runScenarioModule({
  moduleUrl: import.meta.url,
  name: scenario.name,
  scenario,
});
`;

  await writeFile(outputFile, content, "utf8");
}

export async function captureScenario({
  page,
  name,
  baseScenarioName = name,
  projectDirectory,
}) {
  const directory = path.join(projectDirectory, "demo/generated-scenarios");
  await mkdir(directory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const scenarioName = `${path.basename(name)}-${timestamp}`;
  const outputFile = path.join(directory, `${scenarioName}.scenario.mjs`);
  const context = page.context();

  if (typeof context._enableRecorder !== "function") {
    throw new Error(
      "This Playwright version does not support the Inspector recorder adapter.",
    );
  }

  await page.evaluate(() => {
    const labelSwatches = () => {
      document
        .querySelectorAll(".monaco-editor .colorpicker-color-decoration")
        .forEach((element, index) => {
          const id = `color-swatch-${index}`;
          if (element.getAttribute("data-testid") !== id) {
            element.setAttribute("data-testid", id);
          }
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
    language: "javascript",
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

  await new Promise((resolve) => setTimeout(resolve, 300));
  await access(outputFile);

  await convertRecording({
    outputFile,
    scenarioName,
    baseScenarioName,
    timestamp,
  });

  console.log(`Saved runnable demo scenario: ${outputFile}`);
}
