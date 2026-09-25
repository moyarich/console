import type { ReactNode } from "react";

/**
 * Props for the reusable runnable-console surface.
 *
 * Execution and editor controls are supplied by the host so Console stays
 * independent of Monaco, bundlers, and documentation frameworks.
 */
export interface RunnableConsoleProps {
  /** Console/output surface rendered for the current run. */
  children?: ReactNode;
  /** Optional editor or source surface supplied by the host. */
  editor?: ReactNode;
  /** Optional controls such as Run, Reset, or Stop. */
  controls?: ReactNode;
  /** Accessible label for the runnable surface. */
  "aria-label"?: string;
}

/**
 * Framework-agnostic composition surface for runnable Console experiences.
 */
export function RunnableConsole({
  children,
  editor,
  controls,
  "aria-label": ariaLabel = "Runnable console",
}: RunnableConsoleProps) {
  return (
    <section className="console-runnable" aria-label={ariaLabel}>
      {editor ? <div className="console-runnable-editor">{editor}</div> : null}
      {controls ? (
        <div className="console-runnable-controls">{controls}</div>
      ) : null}
      <div className="console-runnable-output">{children}</div>
    </section>
  );
}
