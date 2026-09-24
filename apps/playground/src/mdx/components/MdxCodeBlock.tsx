import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MonacoEditor } from "../../components/MonacoEditor";

interface CodeElementProps extends ComponentPropsWithoutRef<"code"> {
  children?: ReactNode;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shell",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  sh: "shell",
  ts: "typescript",
  tsx: "typescript",
};

function getPreferredMonacoTheme() {
  if (typeof window === "undefined") {
    return "vs-dark";
  }

  const preference = document.documentElement.dataset.theme;

  if (preference === "light") {
    return "vs";
  }

  if (preference === "dark") {
    return "vs-dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "vs-dark"
    : "vs";
}

function getCodeBlock(children: ReactNode) {
  if (!isValidElement<CodeElementProps>(children) || children.type !== "code") {
    return undefined;
  }

  const source =
    typeof children.props.children === "string"
      ? children.props.children
      : undefined;

  if (source === undefined) {
    return undefined;
  }

  const languageMatch = /(?:^|\s)language-([^\s]+)/.exec(
    children.props.className ?? "",
  );
  const language = languageMatch?.[1] ?? "plaintext";

  return {
    source: source.replace(/\n$/, ""),
    language: LANGUAGE_ALIASES[language] ?? language,
    extension: language,
  };
}

export function MdxCodeBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const codeBlock = useMemo(() => getCodeBlock(children), [children]);
  const [theme, setTheme] = useState(getPreferredMonacoTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => setTheme(getPreferredMonacoTheme());
    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    media.addEventListener("change", updateTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateTheme);
    };
  }, []);

  if (!codeBlock) {
    return <pre {...props}>{children}</pre>;
  }

  const lineCount = Math.max(1, codeBlock.source.split("\n").length);
  const height = Math.min(520, Math.max(110, lineCount * 22 + 32));

  return (
    <div className="mdx-code-block" data-language={codeBlock.extension}>
      <MonacoEditor
        height={height}
        language={codeBlock.language}
        value={codeBlock.source}
        theme={theme}
        options={{
          readOnly: true,
          domReadOnly: true,
          contextmenu: true,
          lineNumbers: "on",
          renderLineHighlight: "none",
          wordWrap: "off",
          folding: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
        }}
      />
    </div>
  );
}
