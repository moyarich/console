import { createMdxSection } from "@src/content/mdxSection";
import registry from "../../registry.config";
import { DOCS_MODULES } from "./registrySources.generated";

export const REPOSITORY_DOCS_SECTIONS = createMdxSection({
  id: "docs",
  label: registry.sources.docs.navigation.label,
  modules: DOCS_MODULES,
});
