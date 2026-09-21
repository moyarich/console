import Anser from "anser";

export interface ConsoleStdoutEntry {
  id?: string;
  data: string;
}

export interface ConsoleStdoutProps {
  entries: readonly (ConsoleStdoutEntry | string)[];
  emptyMessage?: string;
}

export function ConsoleStdout({
  entries,
  emptyMessage = "No stdout output yet.",
}: ConsoleStdoutProps) {
  if (!entries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {entries.map((entry, index) => {
        const data = typeof entry === "string" ? entry : entry.data;
        const key =
          typeof entry === "string"
            ? `stdout-${index}`
            : (entry.id ?? `stdout-${index}`);
        const html = Anser.ansiToHtml(Anser.escapeForHtml(data));

        return (
          <pre
            className="console-stdout-line"
            key={key}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}
