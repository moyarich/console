import type { Preview } from "@storybook/react-vite";
import "../packages/console/src/styles.css";
import "../packages/addons/resizable/src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
  },
};

export default preview;
