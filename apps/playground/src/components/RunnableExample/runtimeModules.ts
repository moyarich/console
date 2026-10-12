import * as MetadataAddonPackage from "@moyarich/console-addon-metadata";
import * as ProcessStateAddonPackage from "@moyarich/console-addon-process-state";
import * as AnnotationsAddonPackage from "@moyarich/console-addon-annotations";
import * as AnimationAddonPackage from "@moyarich/console-addon-animation";
import * as NavigationAddonPackage from "@moyarich/console-addon-navigation";
import * as SelectionAddonPackage from "@moyarich/console-addon-selection";
import * as ConsolePackage from "@moyarich/console";
import * as ConsoleCorePackage from "@moyarich/console-core";
import * as DataExportAddonPackage from "@moyarich/console-addon-data-export";
import * as DiagnosticsAddonPackage from "@moyarich/console-addon-diagnostics";
import * as FilteringAddonPackage from "@moyarich/console-addon-filtering";
import * as ImperativeScrollingAddonPackage from "@moyarich/console-addon-imperative-scrolling";
import * as MarkdownAddonPackage from "@moyarich/console-addon-markdown";
import * as ConsoleFeedAddonPackage from "@moyarich/console-addon-console-feed";
import * as XtermAddonPackage from "@moyarich/console-addon-xterm";
import * as LinksAddonPackage from "@moyarich/console-addon-links";
import * as SessionAddonPackage from "@moyarich/console-addon-session";
import * as SearchAddonPackage from "@moyarich/console-addon-search";
import * as ResizableAddonPackage from "@moyarich/console-addon-resizable";
import * as LucideReact from "lucide-react";
import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";

/** Built-in dependencies available to all runnable playground examples. */
export const DEFAULT_RUNTIME_MODULES: Readonly<Record<string, unknown>> = {
  "@moyarich/console-addon-metadata": MetadataAddonPackage,
  "@moyarich/console-addon-process-state": ProcessStateAddonPackage,
  "@moyarich/console-addon-annotations": AnnotationsAddonPackage,
  "@moyarich/console-addon-animation": AnimationAddonPackage,
  "@moyarich/console-addon-navigation": NavigationAddonPackage,
  "@moyarich/console-addon-selection": SelectionAddonPackage,
  react: React,
  "react/jsx-runtime": JSXRuntime,
  "react/jsx-dev-runtime": JSXRuntime,
  "@moyarich/console": ConsolePackage,
  "@moyarich/console-core": ConsoleCorePackage,
  "@moyarich/console/styles.css": {},
  "@moyarich/console-addon-data-export": DataExportAddonPackage,
  "@moyarich/console-addon-diagnostics": DiagnosticsAddonPackage,
  "@moyarich/console-addon-filtering": FilteringAddonPackage,
  "@moyarich/console-addon-imperative-scrolling":
    ImperativeScrollingAddonPackage,
  "@moyarich/console-addon-markdown": MarkdownAddonPackage,
  "@moyarich/console-addon-console-feed": ConsoleFeedAddonPackage,
  "@moyarich/console-addon-xterm": XtermAddonPackage,
  "@moyarich/console-addon-links": LinksAddonPackage,
  "@moyarich/console-addon-search": SearchAddonPackage,
  "@moyarich/console-addon-session": SessionAddonPackage,
  "@moyarich/console-addon-resizable": ResizableAddonPackage,
  "@moyarich/console-addon-resizable/styles.css": {},
  "lucide-react": LucideReact,
};
