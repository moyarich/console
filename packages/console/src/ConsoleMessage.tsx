import type { LucideIcon } from "lucide-react";
import { Braces, Bug, ChevronDown, CircleX, Hash, Info, ListTree, Table2, Terminal, Timer, TriangleAlert } from "lucide-react";
import { ConsoleTable } from "./ConsoleTable";
import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleMessageData } from "./types";

export interface ConsoleMessageProps { message: ConsoleMessageData; }
function getMessageIcon(method: ConsoleMessageData["method"]): LucideIcon {
  switch (method) {
    case "debug": return Bug;
    case "info": return Info;
    case "warn":
    case "assert": return TriangleAlert;
    case "error": return CircleX;
    case "dir": return Braces;
    case "table": return Table2;
    case "count": return Hash;
    case "timeEnd": return Timer;
    case "trace": return ListTree;
    case "group":
    case "groupCollapsed": return ChevronDown;
    default: return Terminal;
  }
}
export function ConsoleMessage({ message }: ConsoleMessageProps) {
  const style = { paddingLeft: 14 + message.depth * 16 };
  const MessageIcon = getMessageIcon(message.method);
  const icon = <span className="console-message-icon" aria-hidden="true"><MessageIcon size={14} strokeWidth={1.8} /></span>;
  if (message.method === "table") return <div className="console-message console-message-table" data-method={message.method} style={style}>{icon}<ConsoleTable data={message.data[0]} columns={message.columns} /></div>;
  if (message.method === "dir" && message.data.length === 1) return <div className="console-message" data-method={message.method} style={style}>{icon}<ConsoleValue value={message.data[0]} expandLevel={message.expandLevel ?? 1} /></div>;
  return <div className="console-message" data-method={message.method} style={style}>{icon}<div className="console-values">{message.data.map((value, index) => <ConsoleValue key={index} value={value} />)}</div></div>;
}
