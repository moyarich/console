import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ComponentPanelActionExample() {
  const { messages, console, clear } = useConsoleMessages();
  return (
    <Console
      messages={messages}
      onClear={clear}
      title="Panel commands"
      subtitle="Open the ellipsis menu to add a message."
      panelActions={[
        {
          id: "add-message",
          label: "Add message",
          onSelect: () => console.log("Added from the panel menu"),
        },
      ]}
    />
  );
}
