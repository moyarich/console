import type { ComponentProps, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleValueRenderer,
} from "@moyarich/console-core";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import "./styles.css";

/** Stable package-qualified identity for the Markdown addon. */
export const CONSOLE_MARKDOWN_ADDON_ID = "@moyarich/console-addon-markdown";

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
 *
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

    if (
      node.type === "link" &&
      isBareAutolink(node as LinkNode, text)
    ) {
      return;
    }

    found = true;
    return EXIT;
  });

  return found;
}

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;

  return (
    href.startsWith("#") ||
    href.startsWith("/") ||
    href.startsWith("./") ||
    href.startsWith("../") ||
    /^(?:https?:|mailto:|tel:)/i.test(href)
  );
}

function MarkdownLink({
  href,
  ...props
}: ComponentProps<"a">): ReactNode {
  return <a {...props} href={isSafeHref(href) ? href : undefined} />;
}

/** Renders one Markdown string using the same GFM dialect used for detection. */
export function MarkdownValue({ text }: { text: string }): ReactNode {
  const tree = markdownRenderer.runSync(markdownRenderer.parse(text));

  return (
    <div className="console-markdown-value">
      {toJsxRuntime(tree, {
        Fragment,
        jsx,
        jsxs,
        components: {
          a: MarkdownLink,
        },
      })}
    </div>
  );
}

/** Value renderer contributed by the first-party Markdown addon. */
export const markdownValueRenderer: ConsoleValueRenderer = {
  type: "string",
  match: ({ value }) =>
    typeof value === "string" && hasMarkdown(value),
  render: ({ value }) =>
    typeof value === "string" ? <MarkdownValue text={value} /> : undefined,
};

/** Creates an addon that automatically renders detected Markdown strings. */
export function createConsoleMarkdownAddon(): ConsoleAddon {
  return {
    id: CONSOLE_MARKDOWN_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.valueRenderer,
        markdownValueRenderer,
        { id: `${CONSOLE_MARKDOWN_ADDON_ID}:value-renderer` },
      );
    },
  };
}
