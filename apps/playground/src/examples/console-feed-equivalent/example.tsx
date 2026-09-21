import {
  Console,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const LogsContainer = () => {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    target: window.console,
    source: "console-feed-equivalent",
    passThrough: true,
  });

  const writeMessage = () => {
    console.log("Hello from console-feed equivalent", {
      package: "@moyarich/console",
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={writeMessage}>
        Write message to console
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Captured from window.console"
      />
    </div>
  );
};

export { LogsContainer };
