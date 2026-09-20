import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Console,
  createConsoleEventChannel,
  createConsoleProxy,
  type ConsoleEvent,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 1000;

export default function ConsoleWithoutConsoleHookExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);

  const events = useMemo(
    () => createConsoleEventChannel(),
    [],
  );

  const runtimeConsole = useMemo(
    () =>
      createConsoleProxy({
        events,
        source: "without-console-hook",
      }),
    [events],
  );

  const handleEvent = useCallback((event: ConsoleEvent) => {
    if (event.type === "clear") {
      setMessages([]);
      return;
    }

    setMessages((current) => {
      const next = [...current, event.message];

      return next.length > MAX_MESSAGES
        ? next.slice(-MAX_MESSAGES)
        : next;
    });
  }, []);

  useEffect(
    () => events.subscribe(handleEvent),
    [events, handleEvent],
  );

  const clear = useCallback(() => {
    events.emit({ type: "clear" });
  }, [events]);

  const runExample = useCallback(() => {
    runtimeConsole.log("Hello without useConsoleMessages", {
      channel: "ConsoleEventChannel",
    });
    runtimeConsole.info("Standard React hooks manage the component state.");
    runtimeConsole.warn("The component subscribes directly to console events.");
  }, [runtimeConsole]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={runExample}>
          Run example
        </button>
        <button type="button" onClick={clear}>
          Clear
        </button>
      </div>

      <Console
        messages={messages}
        onClear={clear}
      />
    </div>
  );
}
