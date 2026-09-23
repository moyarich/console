import type { ConsoleExample } from "../../examples";
import { RunnableExample } from "../RunnableExample";

export interface PlaygroundProps {
  example: ConsoleExample;
}

export function Playground({ example }: PlaygroundProps) {
  return <RunnableExample example={example} />;
}
