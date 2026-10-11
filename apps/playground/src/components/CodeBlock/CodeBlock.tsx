import "./CodeBlock.css";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { writeClipboardText } from "@moyarich/console";

export interface CodeBlockProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  /** Raw, unescaped source to display and copy. */
  code: string;
  /** Shiki language identifier, e.g. "tsx", "bash", or "json". */
  language?: string;
  /** Optional filename displayed above the source. */
  filename?: string;
  /** Show line numbers without altering copied source. */
  showLineNumbers?: boolean;
  /** Display the copy action. */
  copyable?: boolean;
}

/** Read-only, syntax-highlighted source with a keyboard-accessible copy button. */
export function CodeBlock({
  code,
  language = "text",
  filename,
  showLineNumbers = false,
  copyable = true,
  className,
  ...props
}: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setHtml(null);
    setError(false);
    // Load Shiki only for mounted code blocks; keep its grammars out of
    // the initial playground bundle.
    void import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, { lang: language, theme: "github-dark" }),
      )
      .then((markup) => {
        if (active) setHtml(markup);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [code, language]);

  useEffect(() => {
    setCopied(false);
  }, [code]);

  async function copyCode() {
    try {
      await writeClipboardText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      {...props}
      className={["console-code-block", className].filter(Boolean).join(" ")}
      aria-label={filename ? `Code: ${filename}` : `Code in ${language}`}
    >
      <div className="console-code-block__toolbar">
        <span className="console-code-block__filename">
          {filename ?? language}
        </span>
        {copyable && (
          <button
            type="button"
            className="console-code-block__copy"
            onClick={() => void copyCode()}
            aria-label={copied ? "Copied code" : "Copy code"}
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>
      <div className="console-code-block__viewport">
        {html ? (
          <div
            className={
              showLineNumbers ? "console-code-block__numbered" : undefined
            }
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre
            className={
              showLineNumbers ? "console-code-block__numbered" : undefined
            }
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
      {error && (
        <span className="console-code-block__sr-only">
          Syntax highlighting unavailable; plain source shown.
        </span>
      )}
    </section>
  );
}
