import { createScenarioRegistry } from "@moyarich/vscode-dev-toolkit/demo";
import config from "../../vscode-dev.config.mjs";

export const { scenarios, selectScenarios } = await createScenarioRegistry({
  config,
});
