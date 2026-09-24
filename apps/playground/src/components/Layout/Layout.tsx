import type { ComponentPropsWithoutRef } from "react";
import "./layout.css";

function classes(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

export function Layout({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={classes("layout", className)} {...props} />;
}

export function LayoutHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"header">) {
  return <header className={classes("layout-header", className)} {...props} />;
}

export function LayoutContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={classes("layout-content", className)} {...props} />;
}

export function LayoutSidebar({
  className,
  ...props
}: ComponentPropsWithoutRef<"aside">) {
  return <aside className={classes("layout-sidebar", className)} {...props} />;
}

export function LayoutMain({
  className,
  ...props
}: ComponentPropsWithoutRef<"main">) {
  return <main className={classes("layout-main", className)} {...props} />;
}

export function LayoutFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"footer">) {
  return <footer className={classes("layout-footer", className)} {...props} />;
}
