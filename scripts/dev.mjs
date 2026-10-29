#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { get } from "node:http";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const children = [];
let stopping = false;
function killTree(child, signal) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) killTree(child, "SIGTERM");
  setTimeout(() => {
    for (const child of children) killTree(child, "SIGKILL");
  }, 3000).unref();
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])
  process.on(signal, () => stop());
// Also clean up if startup fails or the launcher exits unexpectedly.
process.on("exit", () => {
  for (const child of children) killTree(child, "SIGKILL");
});

// An old server must not satisfy the readiness check for this launch.
try {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(
      Number(process.env.STORYBOOK_DEV_PORT ?? 6007),
      "127.0.0.1",
      () => server.close(resolve),
    );
  });
} catch (error) {
  console.error(
    `Cannot start Storybook on port ${process.env.STORYBOOK_DEV_PORT ?? 6007}: ${error.message}`,
  );
  process.exit(1);
}

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
        // Avoid Node's bundled Undici: its socket QoS call can crash on macOS.
        const healthy = await new Promise((resolve, reject) => {
          const request = get(
            `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}/index.json`,
            { agent: false },
            (response) => {
              response.resume();
              resolve(response.statusCode === 200);
            },
          );
          request.setTimeout(1000, () =>
            request.destroy(new Error("Readiness check timed out")),
          );
          request.on("error", reject);
        });
        if (healthy) {
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
      detached: process.platform !== "win32",
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
