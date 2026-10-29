import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import type { HighlighterCore } from "shiki";
import { useMDXComponents } from "@mdx-js/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import "./MarkdownValue.css";

const PLAIN_MARKDOWN_NODE_TYPES = new Set([
  "root",
  "paragraph",
  "text",
  "break",
]);

const markdownParser = unified().use(remarkParse).use(remarkGfm);
const markdownRenderer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype);

interface PositionedNode {
  type: string;
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
}

interface LinkNode extends PositionedNode {
  type: "link";
  url: string;
  children?: readonly { type: string; value?: string }[];
}

function isBareAutolink(node: LinkNode, source: string): boolean {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;

  if (start === undefined || end === undefined) {
    return false;
  }

  const raw = source.slice(start, end);

  if (raw === node.url || raw === `<${node.url}>`) {
    return true;
  }

  return (
    /^(?:https?:\/\/|www\.)/i.test(raw) &&
    node.children?.length === 1 &&
    node.children[0]?.type === "text" &&
    node.children[0]?.value === raw
  );
}

/**
 * Returns true when a string contains Markdown syntax beyond a plain paragraph.
 * Bare URLs are intentionally ignored because remark-gfm promotes them to link
 * nodes even when the producer did not intentionally emit Markdown.
 */
export function hasMarkdown(text: string): boolean {
  const tree = markdownParser.parse(text);
  let found = false;

  visit(tree, (node) => {
    if (PLAIN_MARKDOWN_NODE_TYPES.has(node.type)) {
      return;
    }

    if (node.type === "link" && isBareAutolink(node as LinkNode, text)) {
      return;
    }

    found = true;
    return EXIT;
  });

  return found;
}

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  const normalized = href.trim();
  if (
    !normalized ||
    [...normalized].some((char) => {
      const code = char.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  )
    return false;

  return (
    (normalized.startsWith("#") && !normalized.startsWith("##")) ||
    (normalized.startsWith("/") && !normalized.startsWith("//")) ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    /^(?:https?:|mailto:|tel:)/i.test(normalized)
  );
}

function MarkdownLink({ href, ...props }: ComponentProps<"a">): ReactNode {
  return <a {...props} href={isSafeHref(href) ? href : undefined} />;
}

/** Load Shiki once and share its language grammars across code fences. */
const supportedLanguages = [
  "bash",
  "css",
  "html",
  "javascript",
  "json",
  "markdown",
  "python",
  "sh",
  "tsx",
  "typescript",
  "yaml",
] as const;

const aliases: Record<string, (typeof supportedLanguages)[number]> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  yml: "yaml",
  shell: "bash",
  jsx: "tsx",
};
type HighlightedLine = { content: string; color?: string }[];

let highlighterPromise: Promise<HighlighterCore> | undefined;
function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= import("shiki").then(({ createHighlighter }) =>
    createHighlighter({
      themes: ["github-dark"],
      langs: [...supportedLanguages],
    }),
  );
  return highlighterPromise;
}

function MarkdownCode({
  className,
  children,
  ...props
}: ComponentProps<"code">): ReactNode {
  const language = /(?:^|\\s)language-([\\w+#.-]+)/.exec(className ?? "")?.[1];
  const code = typeof children === "string" ? children : undefined;
  const normalizedLanguage = language
    ? (aliases[language.toLowerCase()] ?? language.toLowerCase())
    : undefined;
  const [tokens, setTokens] = useState<HighlightedLine[] | null>(null);

  useEffect(() => {
    let active = true;
    setTokens(null);
    if (
      !code ||
      !normalizedLanguage ||
      !supportedLanguages.some((lang) => lang === normalizedLanguage)
    ) {
      return () => {
        active = false;
      };
    }
    void getHighlighter()
      .then((highlighter) => {
        const result = highlighter.codeToTokens(code, {
          lang: normalizedLanguage,
          theme: "github-dark",
        });
        if (active) setTokens(result.tokens);
      })
      .catch(() => {
        if (active) setTokens(null);
      });
    return () => {
      active = false;
    };
  }, [code, normalizedLanguage]);

  return (
    <code
      {...props}
      className={className}
      data-language={language}
      data-highlighted={tokens ? "true" : undefined}
    >
      {tokens
        ? tokens.map((line, lineIndex) => (
            <Fragment key={lineIndex}>
              {line.map((token, index) => (
                <span key={index} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
              {lineIndex < tokens.length - 1 ? "\n" : null}
            </Fragment>
          ))
        : children}
    </code>
  );
}

/** Renders one Markdown string using the same GFM dialect used for detection. */
export function MarkdownValue({ text }: { text: string }): ReactNode {
  const tree = markdownRenderer.runSync(markdownRenderer.parse(text));
  const mdxComponents = useMDXComponents();

  return (
    <div className="console-markdown-value">
      {toJsxRuntime(tree, {
        Fragment,
        jsx,
        jsxs,
        components: {
          ...mdxComponents,
          a: (props: ComponentProps<"a">) => {
            const Link = mdxComponents.a ?? MarkdownLink;
            return (
              <Link
                {...props}
                href={isSafeHref(props.href) ? props.href : undefined}
              />
            );
          },
          code: mdxComponents.code ?? MarkdownCode,
        },
      })}
    </div>
  );
}
