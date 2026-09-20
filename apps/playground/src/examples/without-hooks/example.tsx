import { Component } from "react";
import {
  Console,
  createConsoleEventChannel,
  createConsoleProxy,
  type ConsoleEvent,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 1000;

interface State {
  messages: ConsoleMessageData[];
}

export default class ConsoleWithoutHooksExample extends Component<{}, State> {
  state: State = {
    messages: [],
  };

  private readonly events = createConsoleEventChannel();

  private readonly runtimeConsole = createConsoleProxy({
    events: this.events,
    source: "without-hooks",
  });

  private unsubscribe?: () => void;

  componentDidMount() {
    this.unsubscribe = this.events.subscribe(this.handleEvent);
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  private handleEvent = (event: ConsoleEvent) => {
    if (event.type === "clear") {
      this.setState({ messages: [] });
      return;
    }

    this.setState((current) => {
      const next = [...current.messages, event.message];

      return {
        messages:
          next.length > MAX_MESSAGES
            ? next.slice(-MAX_MESSAGES)
            : next,
      };
    });
  };

  private clear = () => {
    this.events.emit({ type: "clear" });
  };

  private runExample = () => {
    this.runtimeConsole.log("Hello without hooks", {
      channel: "ConsoleEventChannel",
    });
    this.runtimeConsole.info("No useConsoleMessages hook is used.");
    this.runtimeConsole.warn("The class subscribes directly to console events.");
  };

  render() {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={this.runExample}>
            Run example
          </button>
          <button type="button" onClick={this.clear}>
            Clear
          </button>
        </div>

        <Console
          messages={this.state.messages}
          onClear={this.clear}
        />
      </div>
    );
  }
}
