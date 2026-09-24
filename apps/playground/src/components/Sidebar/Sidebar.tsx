import type { ComponentPropsWithoutRef } from "react";
import "./sidebar.css";

export type SidebarProps = ComponentPropsWithoutRef<"nav">;

export function Sidebar({ className, ...props }: SidebarProps) {
  const classes = className ? `sidebar ${className}` : "sidebar";

  return <nav className={classes} {...props} />;
}
