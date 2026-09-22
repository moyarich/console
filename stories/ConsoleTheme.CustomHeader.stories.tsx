import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
const meta = { title: "Console/Theming", component: Console } satisfies Meta<
  typeof Console
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomHeader: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "100vh",
          padding: "48px 24px",
          background: "#0b1018",
          fontFamily: "system-ui, sans-serif",
          color: "#e2e8f0",
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <p
            style={{
              margin: "0 0 8px",
              color: "#7dd3fc",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            CONSOLE THEME
          </p>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            Slate
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              color: "#94a3b8",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            A quiet dark theme with a distinct header and a soft blue accent.
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    title: "Build output",
    subtitle: "Production · web-app",
    messages: [
      { method: "info", data: ["Starting production build"], depth: 0 },
      { method: "log", data: ["Compiled 24 modules in 184 ms"], depth: 0 },
      {
        method: "log",
        data: [{ status: "ready", assets: 8, cached: true }],
        depth: 0,
      },
    ],
    style: {
      height: 340,
      "--console-min-height": "0px",
      "--console-color-scheme": "dark",
      "--console-background-color": "#101620",
      "--console-panel-border": "1px solid #293445",
      "--console-panel-border-radius": "12px",
      "--console-panel-box-shadow": "0 16px 48px rgb(0 0 0 / 0.2)",
      "--console-panel-header-background-color": "#18212e",
      "--console-panel-header-color": "#f1f5f9",
      "--console-panel-header-muted-color": "#94a3b8",
      "--console-panel-header-border-bottom": "1px solid #293445",
      "--console-header-icon-color": "#7dd3fc",
    } as CSSProperties,
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector(".console-panel-header");
    const title = header?.querySelector("h2");
    const subtitle = header?.querySelector("p");
    if (
      !header ||
      !title ||
      !subtitle ||
      getComputedStyle(header).backgroundColor !== "rgb(24, 33, 46)" ||
      getComputedStyle(title).color !== "rgb(241, 245, 249)" ||
      getComputedStyle(subtitle).color !== "rgb(148, 163, 184)"
    )
      throw new Error("Header theme overrides must apply independently");
  },
};
