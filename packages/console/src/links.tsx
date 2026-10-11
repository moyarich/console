import type { ReactNode } from "react";
import type {
  ConsoleLink as CoreConsoleLink,
  ConsoleLinkActionContext as CoreConsoleLinkActionContext,
  ConsoleLinkProvider as CoreConsoleLinkProvider,
  ConsoleLinkProviderContext as CoreConsoleLinkProviderContext,
} from "./addons";

/** Metadata describing an interactive range inside rendered console text. */
export type ConsoleLink = CoreConsoleLink;

/** Context supplied to custom link providers. */
export type ConsoleLinkProviderContext = CoreConsoleLinkProviderContext;

/** Context supplied when a host-defined link action runs. */
export type ConsoleLinkActionContext = CoreConsoleLinkActionContext;

/** Ordered provider that can discover application-specific links in text. */
export type ConsoleLinkProvider = CoreConsoleLinkProvider;

type ConsoleLinkProviderBaseContext = Omit<ConsoleLinkProviderContext, "text">;

interface ResolvedConsoleLink extends ConsoleLink {
  providerId?: string;
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
    (target.startsWith("/") && !target.startsWith("//")) ||
    target.startsWith("./") ||
    target.startsWith("../") ||
    target.startsWith("#")
  ) {
    return true;
  }

  return isSafeWebUrl(target);
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
    target,
    ...(providerId ? { providerId } : {}),
  };
}

/**
 * Resolves explicit links and registered providers in declaration order.
 * Earlier links win when ranges overlap.
 */
export function resolveConsoleLinks(
  text: string,
  context: ConsoleLinkProviderBaseContext,
  options: {
    /** @deprecated Automatic detection belongs to the links addon; this option is ignored. */
    detectLinks?: boolean;
    providers?: readonly ConsoleLinkProvider[];
    links?: readonly ConsoleLink[];
  } = {},
): ResolvedConsoleLink[] {
  const candidates: ResolvedConsoleLink[] = [];
  const { providers, links } = options;

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

  const providerContext: ConsoleLinkProviderContext = {
    ...context,
    text,
  };

  for (const provider of providers ?? []) {
    try {
      append(provider.provideLinks(providerContext) ?? undefined, provider.id);
    } catch {
      // A custom provider must not prevent the original text from rendering.
    }
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
        (existing) => link.start < existing.end && link.end > existing.start,
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
  context: ConsoleLinkProviderBaseContext;
  /** @deprecated Automatic detection belongs to the links addon; this option is ignored. */
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
  providers,
  links,
  renderText = (value) => value,
}: ConsoleLinkedTextProps) {
  const resolved = resolveConsoleLinks(text, context, {
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
      text,
      link,
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
