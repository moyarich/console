import type { ReactNode } from "react";
import type {
  ConsoleAction as CoreConsoleAction,
  ConsoleActionContextBase,
  ConsoleActionPredicate,
  ConsoleActionVariant,
  ConsoleContextMenuAction as CoreConsoleContextMenuAction,
  ConsoleContextMenuActionContext,
  ConsoleMessageAction as CoreConsoleMessageAction,
  ConsoleMessageActionContext,
  ConsoleObjectActionContext,
  ConsolePanelAction as CoreConsolePanelAction,
  ConsoleSurfaceActionContext,
} from "./addons";

export type {
  ConsoleActionContextBase,
  ConsoleActionPredicate,
  ConsoleActionVariant,
  ConsoleContextMenuActionContext,
  ConsoleMessageActionContext,
  ConsoleObjectActionContext,
  ConsoleSurfaceActionContext,
};

/** Describes a host-defined command that can be rendered by the React console UI. */
export type ConsoleAction<TContext> = CoreConsoleAction<TContext, ReactNode>;

/** Host-defined action rendered in the console panel actions menu. */
export type ConsolePanelAction = CoreConsolePanelAction<ReactNode>;

/** Host-defined action available from console, object, or message context menus. */
export type ConsoleContextMenuAction = CoreConsoleContextMenuAction<ReactNode>;

/** Host-defined action that is shown only for structured console messages. */
export type ConsoleMessageAction = CoreConsoleMessageAction<ReactNode>;

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
