import type { ReactNode } from "react";
import type { ConsoleMessageData, ConsoleMode } from "./types";

export interface ConsoleActionContextBase {
  mode: ConsoleMode;
  hasMessages: boolean;
}

export interface ConsoleSurfaceActionContext extends ConsoleActionContextBase {
  kind: "console";
}

export interface ConsoleObjectActionContext extends ConsoleActionContextBase {
  kind: "object";
  value: object;
}

export interface ConsoleMessageActionContext extends ConsoleActionContextBase {
  kind: "message";
  message: ConsoleMessageData;
  index: number;
  messages: readonly ConsoleMessageData[];
}

export type ConsoleContextMenuActionContext =
  | ConsoleSurfaceActionContext
  | ConsoleObjectActionContext
  | ConsoleMessageActionContext;

export type ConsoleActionPredicate<TContext> =
  boolean | ((context: TContext) => boolean);

export type ConsoleActionVariant = "default" | "danger";

export interface ConsoleAction<TContext> {
  id: string;
  label: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  variant?: ConsoleActionVariant;
  separatorBefore?: boolean;
  visible?: ConsoleActionPredicate<TContext>;
  disabled?: ConsoleActionPredicate<TContext>;
  onSelect: (context: TContext) => void | Promise<void>;
}

export type ConsoleContextMenuAction =
  ConsoleAction<ConsoleContextMenuActionContext>;

export type ConsoleMessageAction = ConsoleAction<ConsoleMessageActionContext>;

export interface ResolvedConsoleAction<TContext> {
  action: ConsoleAction<TContext>;
  disabled: boolean;
}

function evaluatePredicate<TContext>(
  predicate: ConsoleActionPredicate<TContext> | undefined,
  context: TContext,
  defaultValue: boolean,
  errorValue: boolean,
) {
  if (predicate === undefined) {
    return defaultValue;
  }

  if (typeof predicate === "boolean") {
    return predicate;
  }

  try {
    return predicate(context);
  } catch {
    return errorValue;
  }
}

export function resolveConsoleActions<TContext>(
  actions: readonly ConsoleAction<TContext>[] | undefined,
  context: TContext,
): ResolvedConsoleAction<TContext>[] {
  if (!actions?.length) {
    return [];
  }

  return actions
    .filter((action) => evaluatePredicate(action.visible, context, true, false))
    .map((action) => ({
      action,
      disabled: evaluatePredicate(action.disabled, context, false, true),
    }));
}
