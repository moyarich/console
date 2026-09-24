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
import { CONSOLE_EXAMPLE_GROUPS, type ConsoleExample } from "../../examples";
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
    <section className="sidebar-section" aria-labelledby="sidebar-examples-title">
      <div className="sidebar-section-header">
        <div className="sidebar-section-heading">
          <strong id="sidebar-examples-title">Examples</strong>
          <span className="sidebar-count">{examples.length}</span>
        </div>

        <label className="sidebar-search">
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

      <div className="sidebar-groups">
        {navigationGroups.map(({ group, examples: groupExamples }) => {
          const Icon = getGroupIcon(group.id);
          const expanded = searching || !collapsedGroupIds.has(group.id);

          return (
            <div className="sidebar-group" key={group.id}>
              <button
                type="button"
                className="sidebar-group-trigger"
                aria-expanded={expanded}
                onClick={() => toggleGroup(group.id)}
              >
                <span className="sidebar-group-label">
                  <Icon aria-hidden="true" />
                  <span>{group.label}</span>
                </span>
                <span className="sidebar-group-meta">
                  <span>{groupExamples.length}</span>
                  <ChevronDown
                    className={expanded ? "expanded" : undefined}
                    aria-hidden="true"
                  />
                </span>
              </button>

              {expanded && (
                <div className="sidebar-items">
                  {groupExamples.map((example) => {
                    const active = example.id === value;

                    return (
                      <button
                        key={example.id}
                        type="button"
                        className="sidebar-item"
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
            </div>
          );
        })}

        {!navigationGroups.length && (
          <div className="sidebar-empty">
            <Search aria-hidden="true" />
            <strong>No examples found</strong>
            <span>Try log, table, ANSI, transport, or addon.</span>
          </div>
        )}
      </div>
    </section>
  );
}
