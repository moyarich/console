import { MDXProvider } from "@mdx-js/react";
import { createMdxComponents, moyaForgeComponents } from "@moyarich/moyaforge";
import { ProcessOutput, RunnableConsole } from "@moyarich/console";
import { useMemo, type ReactNode } from "react";
import {
  RunnableExample,
  type RunnableExampleProps,
} from "../components/RunnableExample";
import { MdxCodeBlock } from "./components/MdxCodeBlock";
import { MdxTable } from "./components/MdxTable";
import "./mdx.css";

interface PlaygroundMDXProviderProps {
  children: ReactNode;
  pageTitle: string;
}

export function PlaygroundMDXProvider({
  children,
  pageTitle,
}: PlaygroundMDXProviderProps) {
  const components = useMemo(
    () =>
      createMdxComponents(moyaForgeComponents, {
        ProcessOutput,
        RunnableConsole,
        pre: MdxCodeBlock,
        table: MdxTable,
        RunnableExample: (props: RunnableExampleProps) => (
          <RunnableExample title={pageTitle} {...props} />
        ),
      }),
    [pageTitle],
  );

  return <MDXProvider components={components}>{children}</MDXProvider>;
}
