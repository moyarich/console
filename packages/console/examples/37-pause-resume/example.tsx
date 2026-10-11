import { useMemo, useState } from "react";
import { Console, useConsoleOutputPause, type ConsoleMessageData } from "@moyarich/console";

const allMessages: ConsoleMessageData[] = Array.from({ length: 80 }, (_, index) => ({
  id: `message-${index}`, method: "log", depth: 0, data: [`Captured message ${index + 1}`],
}));

export default function Example() {
  const [count, setCount] = useState(10);
  const source = useMemo(() => allMessages.slice(0, count), [count]);
  const view = useConsoleOutputPause(source);
  return <div style={{ display: "grid", gap: 8 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button type="button" onClick={view.paused ? view.resume : view.pause}>{view.paused ? "Resume" : "Pause"} output</button>
      <button type="button" onClick={() => setCount((n) => Math.min(80, n + 10))}>Capture 10 messages</button>
      <span role="status">{view.paused ? `${view.bufferedCount} newer entries buffered` : "Live output"}</span>
    </div>
    <Console messages={[...view.displayed]} autoScroll={!view.paused} />
  </div>;
}
