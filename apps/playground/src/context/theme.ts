import { createContext, useContext } from "react";

export type ResolvedColorScheme = "light" | "dark";

export const ResolvedColorSchemeContext =
  createContext<ResolvedColorScheme>("dark");

export function useResolvedColorScheme() {
  return useContext(ResolvedColorSchemeContext);
}
