import type { ConsoleMode } from "../types";

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
