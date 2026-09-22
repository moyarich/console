import type { ReactNode } from "react";
import { resolveConsoleLinks } from "../links/resolveConsoleLinks";
import type {
  ConsoleLink,
  ConsoleLinkActionContext,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "../links/types";

export interface ConsoleLinkedTextProps {
  text: string;
  context: ConsoleLinkProviderContext;
  detectLinks?: boolean;
  providers?: readonly ConsoleLinkProvider[];
  links?: readonly ConsoleLink[];
  renderText?: (
    text: string,
    key: string,
    start: number,
    end: number,
  ) => ReactNode;
}

function isExternalWebTarget(target: string): boolean {
  return /^https?:\/\//i.test(target);
}

/** Renders text with discovered link ranges while preserving text selection. */
export function ConsoleLinkedText({
  text,
  context,
  detectLinks = true,
  providers,
  links,
  renderText = (value) => value,
}: ConsoleLinkedTextProps) {
  const resolved = resolveConsoleLinks(text, context, {
    detectLinks,
    providers,
    links,
  });

  if (!resolved.length) {
    return <>{renderText(text, "text", 0, text.length)}</>;
  }

  const parts: ReactNode[] = [];
  let offset = 0;

  resolved.forEach((link, index) => {
    if (offset < link.start) {
      parts.push(
        renderText(
          text.slice(offset, link.start),
          `text-${index}`,
          offset,
          link.start,
        ),
      );
    }

    const linkContext: ConsoleLinkActionContext = {
      ...context,
      link,
      sourceText: text,
      ...(link.providerId ? { providerId: link.providerId } : {}),
    };
    const content = renderText(
      link.text,
      `link-text-${index}`,
      link.start,
      link.end,
    );

    if (link.target) {
      const external = isExternalWebTarget(link.target);

      parts.push(
        <a
          className="console-link"
          href={link.target}
          key={`link-${index}`}
          title={link.title}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          onClick={() => link.action?.(linkContext)}
        >
          {content}
        </a>,
      );
    } else if (link.action) {
      parts.push(
        <button
          type="button"
          className="console-link console-link-button"
          key={`link-${index}`}
          title={link.title}
          onClick={() => link.action?.(linkContext)}
        >
          {content}
        </button>,
      );
    }

    offset = link.end;
  });

  if (offset < text.length) {
    parts.push(renderText(text.slice(offset), "text-end", offset, text.length));
  }

  return <>{parts}</>;
}
