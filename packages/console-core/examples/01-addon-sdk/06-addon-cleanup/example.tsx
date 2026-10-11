import { useEffect, useMemo, useState } from "react";
import {
  createConsoleAddonManager,
  type ConsoleAddon,
} from "@moyarich/console-core";

export function createCleanupAddon(
  target: EventTarget,
  onEvent: () => void,
): ConsoleAddon {
  return {
    id: "example.cleanup",
    activate(host) {
      const controller = new AbortController();
      target.addEventListener("sample", onEvent, { signal: controller.signal });
      host.scope.defer(() => controller.abort());
    },
  };
}

export default function AddonCleanupExample() {
  const [active, setActive] = useState(false);
  const [received, setReceived] = useState(0);
  const target = useMemo(() => new EventTarget(), []);

  useEffect(() => {
    if (!active) return;
    const manager = createConsoleAddonManager();
    manager.load(
      createCleanupAddon(target, () => setReceived((count) => count + 1)),
    );
    return () => manager.dispose();
  }, [active, target]);

  return (
    <div>
      <button type="button" onClick={() => setActive((value) => !value)}>
        {active ? "Unload addon" : "Load addon"}
      </button>
      <button
        type="button"
        onClick={() => target.dispatchEvent(new Event("sample"))}
      >
        Send event
      </button>
      <p role="status">
        {active ? "Listener active" : "Listener removed"}. Events received:{" "}
        {received}
      </p>
    </div>
  );
}
