import { useState } from "react";
import {
  createConsoleAddonManager,
  createConsoleServiceToken,
  type ConsoleAddon,
} from "@moyarich/console-core";

const buildService = createConsoleServiceToken<{ rerun(): void }>(
  "example.build",
);

export default function SharedServicesExample() {
  const [builds, setBuilds] = useState(0);
  function runBuild() {
    const manager = createConsoleAddonManager();
    const provider: ConsoleAddon = {
      id: "example.build-provider",
      activate(host) {
        host.services.provide(buildService, {
          rerun: () => setBuilds((count) => count + 1),
        });
      },
    };
    const consumer: ConsoleAddon = {
      id: "example.build-consumer",
      activate(host) {
        host.services.require(buildService).rerun();
      },
    };
    try {
      manager.load(provider);
      manager.load(consumer);
    } finally {
      manager.dispose();
    }
  }
  return (
    <div>
      <button type="button" onClick={runBuild}>
        Run build through shared service
      </button>
      <p role="status">Completed builds: {builds}</p>
    </div>
  );
}
