import { useConsoleAddonMessages } from "@moyarich/console";
/** Default selection indicator. No stylesheet or addon runtime required. */
export function SelectedMessageIndicator() {
  const t = useConsoleAddonMessages();
  return (
    <span
      aria-label={t.selectedMessage}
      title={t.selected}
      style={{ fontSize: 12, lineHeight: 1 }}
    >
      ●
    </span>
  );
}
