import {
  Braces,
  ChevronDown,
  CircleDot,
  Layers3,
  Puzzle,
  Radio,
  Search,
  SquareTerminal,
  Terminal,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CONSOLE_EXAMPLE_GROUPS,
  type ConsoleExample,
} from "../../examples";
import { buildExampleNavigation } from "./exampleNavigation";

interface ExampleSidebarProps {
  examples: readonly ConsoleExample[];
  value: string;
  onChange: (id: string) => void;
}

function getGroupIcon(groupId: string): LucideIcon {
  if (groupId.includes("ansi")) {
    return Terminal;
  }

  if (groupId.includes("console-method")) {
    return SquareTerminal;
  }

  if (groupId.includes("transport")) {
    return Waypoints;
  }

  if (groupId.includes("event")) {
    return Radio;
  }

  if (groupId.includes("addon")) {
    return Puzzle;
  }

  if (groupId.includes("capture")) {
    return CircleDot;
  }

  if (groupId.includes("usage")) {
    return Layers3;
  }

  return Braces;
}

export function ExampleSidebar({
  examples,
  value,
  onChange,
}: ExampleSidebarProps) {
  const [query, setQuery] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );

  const navigationGroups = useMemo(
    () => buildExampleNavigation(examples, CONSOLE_EXAMPLE_GROUPS, query),
    [examples, query],
  );

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  const searching = query.trim().length > 0;

  return (
    <nav className="example-navigation" aria-label="Console examples">
      <div className="example-navigation-header">
        <div className="example-navigation-title">
          <div>
            <span className="panel-kicker">Examples</span>
            <strong>Playground</strong>
          </div>
          <span className="example-count">{examples.length}</span>
        </div>

        <label className="example-navigation-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search examples…"
            aria-label="Search examples"
          />
        </label>
      </div>

      <div className="example-navigation-groups">
        {navigationGroups.map(({ group, examples: groupExamples }) => {
          const Icon = getGroupIcon(group.id);
          const expanded = searching || !collapsedGroupIds.has(group.id);

          return (
            <section className="example-navigation-group" key={group.id}>
              <button
                type="button"
                className="example-navigation-group-trigger"
                aria-expanded={expanded}
                onClick={() => toggleGroup(group.id)}
              >
                <span className="example-navigation-group-label">
                  <Icon aria-hidden="true" />
                  <span>{group.label}</span>
                </span>
                <span className="example-navigation-group-meta">
                  <span>{groupExamples.length}</span>
                  <ChevronDown
                    className={expanded ? "expanded" : undefined}
                    aria-hidden="true"
                  />
                </span>
              </button>

              {expanded && (
                <div className="example-navigation-items">
                  {groupExamples.map((example) => {
                    const active = example.id === value;

                    return (
                      <button
                        key={example.id}
                        type="button"
                        className={
                          active
                            ? "example-navigation-item active"
                            : "example-navigation-item"
                        }
                        aria-current={active ? "page" : undefined}
                        title={example.description}
                        onClick={() => onChange(example.id)}
                      >
                        <span>{example.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {!navigationGroups.length && (
          <div className="example-navigation-empty">
            <Search aria-hidden="true" />
            <strong>No examples found</strong>
            <span>Try log, table, ANSI, transport, or addon.</span>
          </div>
        )}
      </div>
    </nav>
  );
}
