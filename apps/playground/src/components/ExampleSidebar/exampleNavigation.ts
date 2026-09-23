import type {
  ConsoleExample,
  ConsoleExampleGroup,
} from "../../examples";

export interface ExampleNavigationGroup {
  group: ConsoleExampleGroup;
  examples: readonly ConsoleExample[];
}

export function buildExampleNavigation(
  examples: readonly ConsoleExample[],
  groups: readonly ConsoleExampleGroup[],
  query: string,
): ExampleNavigationGroup[] {
  const normalizedQuery = query.trim().toLowerCase();
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  const filteredExamples = normalizedQuery
    ? examples.filter((example) => {
        const group = groupsById.get(example.groupId);

        return [
          example.label,
          example.description,
          example.id,
          group?.label ?? example.groupId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
    : examples;

  return groups
    .map((group) => ({
      group,
      examples: filteredExamples.filter(
        (example) => example.groupId === group.id,
      ),
    }))
    .filter(({ examples: groupExamples }) => groupExamples.length > 0);
}
