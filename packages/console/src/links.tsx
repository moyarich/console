import type { ReactNode } from "react";
import type { ConsoleMode } from "./types";

export interface ConsoleLink {
  text: string;
  start: number;
  end: number;
  target?: string;
  title?: string;
  action?: (context: ConsoleLinkActionContext) => void;
}

export interface ConsoleLinkProviderContext {
  mode: ConsoleMode;
  value?: unknown;
  propertyKey?: string;
  index?: number;
  id?: string;
  stream?: "stdout" | "stderr";
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ConsoleLinkActionContext extends ConsoleLinkProviderContext {
  link: ConsoleLink;
  sourceText: string;
  providerId?: string;
}

export interface ConsoleLinkProvider {
  readonly id?: string;
  provideLinks(
    text: string,
    context: ConsoleLinkProviderContext,
  ): readonly ConsoleLink[] | undefined | void;
}

export interface ConsoleLinkedTextProps {
  text: string;
  context: ConsoleLinkProviderContext;
  detectLinks?: boolean;
  providers?: readonly ConsoleLinkProvider[];
  links?: readonly ConsoleLink[];
  renderText?: (text: string, key: string) => ReactNode;
}
