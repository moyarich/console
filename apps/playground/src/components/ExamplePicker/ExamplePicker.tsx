import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import {
  CONSOLE_EXAMPLE_GROUPS,
  type ConsoleExample,
} from "../../examples";

interface ExamplePickerProps {
  examples: readonly ConsoleExample[];
  value: string;
  onChange: (id: string) => void;
}

function getExampleGroupLabel(example: ConsoleExample) {
  return (
    CONSOLE_EXAMPLE_GROUPS.find((group) => group.id === example.groupId)
      ?.label ?? example.groupId
  );
}

export function ExamplePicker({
  examples,
  value,
  onChange,
}: ExamplePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState(value);

  const selected =
    examples.find((example) => example.id === value) ?? examples[0];

  const filteredExamples = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return examples;
    }

    return examples.filter((example) =>
      [
        example.label,
        example.description,
        example.id,
        getExampleGroupLabel(example),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [examples, query]);

  const groupedExamples = useMemo(
    () =>
      CONSOLE_EXAMPLE_GROUPS.map((group) => ({
        group,
        examples: filteredExamples.filter(
          (example) => example.groupId === group.id,
        ),
      })).filter(({ examples: groupExamples }) => groupExamples.length > 0),
    [filteredExamples],
  );

  const positionPopover = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;

    if (!trigger || !popover) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    popover.style.left = `${rect.left}px`;
    popover.style.top = `${rect.bottom + 8}px`;
    popover.style.width = `${rect.width}px`;
  }, []);

  const openPopover = useCallback(() => {
    const popover = popoverRef.current;

    if (!popover || popover.matches(":popover-open")) {
      return;
    }

    positionPopover();
    popover.showPopover();
  }, [positionPopover]);

  const closePopover = useCallback(() => {
    const popover = popoverRef.current;

    if (popover?.matches(":popover-open")) {
      popover.hidePopover();
    }
  }, []);

  const handlePopoverToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    const isOpen = event.currentTarget.matches(":popover-open");

    setOpen(isOpen);

    if (!isOpen) {
      setQuery("");
      return;
    }

    const firstVisible =
      filteredExamples.find((example) => example.id === value) ??
      filteredExamples[0];

    setHighlightedId(firstVisible?.id ?? "");

    requestAnimationFrame(() => {
      positionPopover();
      searchRef.current?.focus();
    });
  };

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPopover();
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [openPopover]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleViewportChange = () => positionPopover();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, positionPopover]);

  const selectExample = (id: string) => {
    onChange(id);
    setHighlightedId(id);
    closePopover();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredExamples.length) {
      return;
    }

    const currentIndex = Math.max(
      0,
      filteredExamples.findIndex((example) => example.id === highlightedId),
    );

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + filteredExamples.length) %
        filteredExamples.length;

      setHighlightedId(filteredExamples[nextIndex]!.id);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const target =
        filteredExamples.find((example) => example.id === highlightedId) ??
        filteredExamples[0];

      if (target) {
        selectExample(target.id);
      }
    }
  };

  return (
    <div className="example-picker">
      <span className="example-picker-label">Example</span>

      <button
        ref={triggerRef}
        type="button"
        className="example-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        popoverTarget="example-picker-popover"
        onClick={positionPopover}
      >
        <span className="example-picker-trigger-copy">
          <span className="example-picker-trigger-title">
            {selected?.label ?? "Choose an example"}
          </span>
          <span className="example-picker-trigger-meta">
            {selected ? getExampleGroupLabel(selected) : "Examples"}
          </span>
        </span>

        <svg
          className="example-picker-chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>

      <div
        ref={popoverRef}
        id="example-picker-popover"
        className="example-picker-popover"
        popover="auto"
        onToggle={handlePopoverToggle}
      >
        <div className="example-picker-search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search examples…"
            aria-label="Search examples"
          />
          <kbd>⌘K</kbd>
        </div>

        <div
          className="example-picker-list"
          role="listbox"
          aria-label="Console examples"
        >
          {groupedExamples.map(({ group, examples: groupExamples }) => (
            <div className="example-picker-group" key={group.id}>
              <div className="example-picker-group-heading">
                <span>{group.label}</span>
                <span>{groupExamples.length}</span>
              </div>

              {groupExamples.map((example) => {
                const active = example.id === value;
                const highlighted = example.id === highlightedId;

                return (
                  <button
                    key={example.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={[
                      "example-picker-option",
                      active ? "active" : "",
                      highlighted ? "highlighted" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onMouseEnter={() => setHighlightedId(example.id)}
                    onClick={() => selectExample(example.id)}
                  >
                    <strong>{example.label}</strong>

                    {active && (
                      <svg
                        className="example-picker-check"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="m5 10 3 3 7-7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!filteredExamples.length && (
            <div className="example-picker-empty">
              <strong>No examples found</strong>
              <span>Try a method name like log, table, iframe, or trace.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
