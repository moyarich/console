import {
  prepareScenarioRuntime,
  runScenario,
} from "./scenario-runner.mjs";
import { scenarios, selectScenarios } from "./scenarios/index.mjs";

const codegen = process.argv.includes("--codegen");
const selection =
  process.argv
    .find((argument) => argument.startsWith("--scenario="))
    ?.slice("--scenario=".length) ?? (codegen ? "color-mix" : "all");

const selected = selectScenarios(selection);

if (process.argv.includes("--list")) {
  for (const [name, scenario] of Object.entries(scenarios)) {
    console.log(`${name}: ${scenario.title}`);
  }
} else {
  if (!process.argv.includes("--demo") && !codegen) {
    throw new Error(
      "Use --demo to record video, --codegen to capture actions, or --list to list scenarios.",
    );
  }

  const executable = await prepareScenarioRuntime({ codegen });

  for (const name of selected) {
    await runScenario({
      name,
      scenario: scenarios[name],
      vscodeExecutablePath: executable,
      codegen,
    });
  }
}
