import { createElement } from "react";
import { addons, types } from "storybook/manager-api";

function PlaygroundLink() {
  // The unified dev server and Pages both mount Storybook at /storybook/.
  const location = new URL(window.location.href);
  const href = /\/storybook\/?$/.test(location.pathname)
    ? new URL(
        location.pathname.replace(/\/storybook\/?$/, "/"),
        location.origin,
      ).href
    : `${location.protocol}//${location.hostname}:5173/`;
  return createElement(
    "a",
    {
      href,
      title: "Open the playground",
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: "0 12px",
        color: "inherit",
        fontSize: 12,
        fontWeight: 600,
        textDecoration: "none",
      },
    },
    "← Playground",
  );
}

addons.register("console/site-navigation", () => {
  addons.add("console/site-navigation/playground", {
    type: types.TOOL,
    title: "Playground",
    render: PlaygroundLink,
  });
});
