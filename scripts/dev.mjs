#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());

for (const [entry, args, cwd, env] of [
  [
    "storybook/dist/bin/dispatcher.js",
    [
      "dev",
      "--port",
      process.env.STORYBOOK_DEV_PORT ?? "6007",
      "--host",
      "127.0.0.1",
      "--exact-port",
      "--ci",
      "--no-open",
    ],
    root,
    { STORYBOOK_BASE_PATH: "/storybook/", STORYBOOK_UNIFIED_DEV: "1" },
  ],
  ["vite/bin/vite.js", [], resolve(root, "apps/playground"), {}],
]) {
  if (entry.startsWith("vite/")) {
    const deadline = Date.now() + 120_000;
    let ready = false;
    while (!stopping && Date.now() < deadline) {
      try {
        const response = await fetch(
          `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}/index.json`,
          { signal: AbortSignal.timeout(1000) },
        );
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* Storybook is still starting. */
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) {
      if (!stopping)
        console.error("Storybook did not become ready within two minutes.");
      stop(1);
      break;
    }
  }
  const child = spawn(
    process.execPath,
    [resolve(root, "node_modules", entry), ...args],
    {
      cwd,
      env: { ...process.env, ...env },
      stdio: "inherit",
    },
  );
  children.push(child);
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
}
