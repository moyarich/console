import type { Meta, StoryObj } from "@storybook/react-vite";
import { MDXProvider } from "@mdx-js/react";
import { MarkdownStory, samples } from "./fixtures";

function WithMDXComponents() {
  return (
    <MDXProvider
      components={{
        h2: (props) => <h2 {...props} style={{ color: "#58a6ff" }} />,
        blockquote: (props) => (
          <blockquote {...props} style={{ borderLeftColor: "#58a6ff" }} />
        ),
      }}
    >
      <MarkdownStory values={[samples.overview, samples.code]} />
    </MDXProvider>
  );
}

const meta = {
  title: "Addons/Markdown",
  component: WithMDXComponents,
} satisfies Meta<typeof WithMDXComponents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MDXComponents: Story = {};
