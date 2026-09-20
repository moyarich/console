import {
  Console,
  listenForConsolePostMessages,
  useConsoleMessages,
} from "@moyarich/console";
import { useEffect } from "react";

const iframeSource = `<!doctype html>
<html>
<head><style>body{font-family:system-ui;padding:18px;background:#f8fafc;color:#172033}button{margin:4px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:white;cursor:pointer}</style></head>
<body>
  <strong>Iframe runtime</strong>
  <p>These buttons transport console events to the parent with postMessage.</p>
  <button onclick="send('log','hello from iframe',{frame:true,count:3})">console.log</button>
  <button onclick="send('warn','iframe warning')">console.warn</button>
  <button onclick="send('error','iframe error')">console.error</button>
  <button onclick="send('table',[{name:'margin',value:'10px'},{name:'padding',value:'8px'}])">console.table</button>
  <button onclick="clearConsole()">console.clear</button>
  <script>
    function emit(event) {
      parent.postMessage({type:'@moyarich/console',version:1,channel:'iframe-demo',event}, '*');
    }
    function send(method, ...data) {
      emit({type:'message',message:{method,data,depth:0,timestamp:Date.now(),source:'iframe'}});
    }
    function clearConsole(){ emit({type:'clear'}); }
  <\/script>
</body>
</html>`;

export default function IframeExample() {
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });

  useEffect(
    () =>
      listenForConsolePostMessages({
        onEvent,
        channel: "iframe-demo",
      }),
    [onEvent],
  );

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>Iframe transport</h2>
        <p>
          The parent listens with <code>listenForConsolePostMessages()</code>.
          The embedded frame sends the same versioned transport envelope.
        </p>

        <iframe title="Console iframe demo" srcDoc={iframeSource} />
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through postMessage"
      />
    </section>
  );
}
