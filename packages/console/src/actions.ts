import type { ReactNode } from "react";
import type { ConsoleMessageData, ConsoleMode } from "./types";

/** Shared metadata passed to host-defined console actions. */
export interface ConsoleActionContextBase {
  mode: ConsoleMode;
  hasMessages: boolean;
}

/** Action context for the console surface itself. */
export interface ConsoleSurfaceActionContext extends ConsoleActionContextBase {
  kind: "console";
}

/** Action context for an inspectable object rendered by the console. */
export interface ConsoleObjectActionContext extends ConsoleActionContextBase {
  kind: "object";
  value: object;
}

/** Action context for a selected structured console message. */
export interface ConsoleMessageActionContext extends ConsoleActionContextBase {
  kind: "message";
  message: ConsoleMessageData;
  index: number;
  messages: readonly ConsoleMessageData[];
}

/** Context union supplied to general context-menu actions. */
export type ConsoleContextMenuActionContext =
  | ConsoleSurfaceActionContext
  | ConsoleObjectActionContext
  | ConsoleMessageActionContext;

/**
 * Boolean value or predicate used to control action visibility and availability.
 *
 * Predicate failures are handled defensively by {@link resolveConsoleActions}.
 */
export type ConsoleActionPredicate<TContext> =
  boolean | ((context: TContext) => boolean);

/** Visual intent for an action rendered by the built-in context menu. */
export type ConsoleActionVariant = "default" | "danger";

/** Describes a host-defined command that can be rendered by the console UI. */
export interface ConsoleAction<TContext> {
  /** Stable identifier used when rendering the action collection. */
  id: string;
  /** Visible action label. */
  label: ReactNode;
  /** Optional accessible label when the visible label is not sufficient. */
  ariaLabel?: string;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Visual intent for the action. */
  variant?: ConsoleActionVariant;
  /** Whether to render a separator immediately before the action. */
  separatorBefore?: boolean;
  /** Controls whether the action is rendered for the current context. */
  visible?: ConsoleActionPredicate<TContext>;
  /** Controls whether the rendered action is disabled. */
  disabled?: ConsoleActionPredicate<TContext>;
  /** Runs when the action is selected. */
  onSelect: (context: TContext) => void | Promise<void>;
}

/** Host-defined action available from console, object, or message context menus. */
export type ConsoleContextMenuAction =
  ConsoleAction<ConsoleContextMenuActionContext>;

/** Host-defined action that is shown only for structured console messages. */
export type ConsoleMessageAction = ConsoleAction<ConsoleMessageActionContext>;

/** Internal action descriptor after visibility and disabled predicates are evaluated. */
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

/**
 * Resolves an action collection for a concrete context.
 *
 * Invisible actions are removed. A predicate that throws fails closed:
 * visibility errors hide the action and disabled-state errors disable it.
 *
 * @param actions Action descriptors to evaluate.
 * @param context Context supplied to action predicates.
 * @returns Visible actions with their resolved disabled state.
 */
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
