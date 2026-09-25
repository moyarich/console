import { packageExtension } from "@moyarich/vscode-dev-toolkit/extension";
import config from "../vscode-dev.config.mjs";

await packageExtension(config, {
  list: process.argv.includes("--list"),
});
