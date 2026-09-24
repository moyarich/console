export interface NavigableExample {
  id: string;
  groupId: string;
  label: string;
  description?: string;
}

export interface NavigableExampleGroup {
  id: string;
  label: string;
}

export interface ExampleNavigationGroup<
  TExample extends NavigableExample,
  TGroup extends NavigableExampleGroup,
> {
  group: TGroup;
  examples: readonly TExample[];
}

export function buildExampleNavigation<
  TExample extends NavigableExample,
  TGroup extends NavigableExampleGroup,
>(
  examples: readonly TExample[],
  groups: readonly TGroup[],
  query: string,
): ExampleNavigationGroup<TExample, TGroup>[] {
  const normalizedQuery = query.trim().toLowerCase();
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  const filteredExamples = normalizedQuery
    ? examples.filter((example) => {
        const group = groupsById.get(example.groupId);

        return [
          example.label,
          example.description ?? "",
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
