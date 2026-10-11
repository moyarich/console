/** Default selection indicator. No stylesheet or addon runtime required. */
export function SelectedMessageIndicator() {
  return (
    <span
      aria-label="Selected message"
      title="Selected"
      style={{ fontSize: 12, lineHeight: 1 }}
    >
      ●
    </span>
  );
}
