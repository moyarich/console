import { MDXProvider } from "@mdx-js/react";
import { useMemo, type ReactNode } from "react";
import {
  RunnableExample,
  type RunnableExampleProps,
} from "../components/RunnableExample";

interface PlaygroundMDXProviderProps {
  children: ReactNode;
  pageTitle: string;
}

export function PlaygroundMDXProvider({
  children,
  pageTitle,
}: PlaygroundMDXProviderProps) {
  const components = useMemo(
    () => ({
      RunnableExample: (props: RunnableExampleProps) => (
        <RunnableExample title={pageTitle} {...props} />
      ),
    }),
    [pageTitle],
  );

  return <MDXProvider components={components}>{children}</MDXProvider>;
}
