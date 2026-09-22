import type { ReactNode } from "react";
import type { ConsoleMode } from "./types";

/** Metadata describing an interactive range inside rendered console text. */
export interface ConsoleLink {
  text: string;
  start: number;
  end: number;
  target?: string;
  title?: string;
  action?: (context: ConsoleLinkActionContext) => void;
}

/** Context supplied to custom link providers. */
export interface ConsoleLinkProviderContext {
  mode: ConsoleMode;
  value?: unknown;
  propertyKey?: string;
  index?: number;
  id?: string;
  stream?: "stdout" | "stderr";
  metadata?: Readonly<Record<string, unknown>>;
}

/** Context supplied when a host-defined link action runs. */
export interface ConsoleLinkActionContext extends ConsoleLinkProviderContext {
  link: ConsoleLink;
  sourceText: string;
  providerId?: string;
}

/** Ordered provider that can discover application-specific links in text. */
export interface ConsoleLinkProvider {
  readonly id?: string;
  provideLinks(
    text: string,
    context: ConsoleLinkProviderContext,
  ): readonly ConsoleLink[] | undefined | void;
}

interface ResolvedConsoleLink extends ConsoleLink {
  providerId?: string;
}

const WEB_URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?]+$/;

function trimWebUrlCandidate(candidate: string): string {
  let trimmed = candidate.replace(TRAILING_PUNCTUATION_PATTERN, "");

  const pairs: Array<[string, string]> = [
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
  ];

  for (const [opening, closing] of pairs) {
    while (trimmed.endsWith(closing)) {
      const openingCount = trimmed.split(opening).length - 1;
      const closingCount = trimmed.split(closing).length - 1;

      if (closingCount <= openingCount) {
        break;
      }

      trimmed = trimmed.slice(0, -1);
    }
  }

  return trimmed;
}

function isSafeWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns whether a provider target is safe to place in an href attribute. */
export function isSafeConsoleLinkTarget(target: string): boolean {
  if (
    target.startsWith("/") ||
    target.startsWith("./") ||
    target.startsWith("../") ||
    target.startsWith("#")
  ) {
    return true;
  }

  return isSafeWebUrl(target);
}

/** Detects safe HTTP/HTTPS links with source text ranges. */
export function detectWebLinks(text: string): ConsoleLink[] {
  const links: ConsoleLink[] = [];

  for (const match of text.matchAll(WEB_URL_PATTERN)) {
    const raw = match[0];
    const start = match.index;

    if (start === undefined) {
      continue;
    }

    const value = trimWebUrlCandidate(raw);

    if (!value || !isSafeWebUrl(value)) {
      continue;
    }

    links.push({
      text: value,
      start,
      end: start + value.length,
      target: value,
    });
  }

  return links;
}

function normalizeLink(
  link: ConsoleLink,
  sourceText: string,
  providerId?: string,
): ResolvedConsoleLink | undefined {
  if (
    !Number.isInteger(link.start) ||
    !Number.isInteger(link.end) ||
    link.start < 0 ||
    link.end <= link.start ||
    link.end > sourceText.length
  ) {
    return undefined;
  }

  const rangeText = sourceText.slice(link.start, link.end);

  if (!rangeText || link.text !== rangeText) {
    return undefined;
  }

  const target =
    link.target && isSafeConsoleLinkTarget(link.target)
      ? link.target
      : undefined;

  if (!target && !link.action) {
    return undefined;
  }

  return {
    ...link,
    ...(target ? { target } : {}),
    ...(providerId ? { providerId } : {}),
  };
}

/**
 * Resolves custom providers in declaration order, then optional built-in
 * HTTP/HTTPS detection. Earlier links win when ranges overlap.
 */
export function resolveConsoleLinks(
  text: string,
  context: ConsoleLinkProviderContext,
  options: {
    detectLinks?: boolean;
    providers?: readonly ConsoleLinkProvider[];
    links?: readonly ConsoleLink[];
  } = {},
): ResolvedConsoleLink[] {
  const candidates: ResolvedConsoleLink[] = [];
  const { detectLinks = true, providers, links } = options;

  const append = (
    sourceLinks: readonly ConsoleLink[] | undefined,
    providerId?: string,
  ) => {
    for (const link of sourceLinks ?? []) {
      const normalized = normalizeLink(link, text, providerId);

      if (normalized) {
        candidates.push(normalized);
      }
    }
  };

  append(links);

  for (const provider of providers ?? []) {
    try {
      append(provider.provideLinks(text, context) ?? undefined, provider.id);
    } catch {
      // A custom provider must not prevent the original text from rendering.
    }
  }

  if (detectLinks) {
    append(detectWebLinks(text), "web");
  }

  const resolved: ResolvedConsoleLink[] = [];
  const sorted = candidates
    .map((link, order) => ({ link, order }))
    .sort(
      (left, right) =>
        left.link.start - right.link.start ||
        left.order - right.order ||
        right.link.end - left.link.end,
    );

  for (const { link } of sorted) {
    if (
      resolved.some(
        (existing) =>
          link.start < existing.end && link.end > existing.start,
      )
    ) {
      continue;
    }

    resolved.push(link);
  }

  return resolved;
}

export interface ConsoleLinkedTextProps {
  text: string;
  context: ConsoleLinkProviderContext;
  detectLinks?: boolean;
  providers?: readonly ConsoleLinkProvider[];
  links?: readonly ConsoleLink[];
  renderText?: (text: string, key: string) => ReactNode;
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
    return <>{renderText(text, "text")}</>;
  }

  const parts: ReactNode[] = [];
  let offset = 0;

  resolved.forEach((link, index) => {
    if (offset < link.start) {
      parts.push(
        renderText(text.slice(offset, link.start), `text-${index}`),
      );
    }

    const linkContext: ConsoleLinkActionContext = {
      ...context,
      link,
      sourceText: text,
      ...(link.providerId ? { providerId: link.providerId } : {}),
    };
    const content = renderText(link.text, `link-text-${index}`);

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
    parts.push(renderText(text.slice(offset), "text-end"));
  }

  return <>{parts}</>;
}
