import { detectWebLinks } from "./detectWebLinks";
import { isSafeConsoleLinkTarget } from "./isSafeConsoleLinkTarget";
import type {
  ConsoleLink,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "./types";

export interface ResolvedConsoleLink extends ConsoleLink {
  providerId?: string;
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
        (existing) => link.start < existing.end && link.end > existing.start,
      )
    ) {
      continue;
    }

    resolved.push(link);
  }

  return resolved;
}
