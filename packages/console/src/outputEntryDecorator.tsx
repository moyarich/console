import type { ReactNode } from "react";
import type {
  ConsoleOutputEntryDecorator,
  ConsoleOutputEntryDecoratorContext,
} from "./addons";

/** Earlier decorators wrap later ones, with the original entry as the innermost renderer. */
export function decorateConsoleOutputEntry(
  decorators: readonly ConsoleOutputEntryDecorator<ReactNode>[],
  context:
    | {
        readonly mode: "console";
        readonly message: import("./types").ConsoleMessageData;
        readonly index: number;
        readonly id?: string;
      }
    | {
        readonly mode: "terminal";
        readonly entry: import("./processOutput").ConsoleStdoutEntry;
        readonly index: number;
        readonly id?: string;
      },
  renderDefault: () => ReactNode,
): ReactNode {
  let render = renderDefault;
  for (const decorator of [...decorators].reverse()) {
    const next = render;
    render = () =>
      decorator.render({
        ...context,
        renderDefault: next,
      } as ConsoleOutputEntryDecoratorContext<ReactNode>) ?? next();
  }
  return render();
}
