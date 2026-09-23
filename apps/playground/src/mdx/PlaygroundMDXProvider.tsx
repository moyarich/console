import { MDXProvider } from "@mdx-js/react";
import { useMemo, type ReactNode } from "react";
import {
  RunnableExample,
  type RunnableExampleProps,
} from "../components/RunnableExample";

interface PlaygroundMDXProviderProps {
  children: ReactNode;
  exampleTitle: string;
}

export function PlaygroundMDXProvider({
  children,
  exampleTitle,
}: PlaygroundMDXProviderProps) {
  const components = useMemo(
    () => ({
      RunnableExample: (props: RunnableExampleProps) => (
        <RunnableExample title={exampleTitle} {...props} />
      ),
    }),
    [exampleTitle],
  );

  return <MDXProvider components={components}>{children}</MDXProvider>;
}
