import manifest from "../extension.manifest.json";

// JSON imports widen booleans. Keep the literal required by VS Code's
// discriminated workspace-trust manifest type in the public TypeScript API.
export const vscodeVisualizeCssColorsManifest = {
  ...manifest,
  capabilities: {
    ...manifest.capabilities,
    untrustedWorkspaces: { supported: true as const },
  },
};

export const vscodeVisualizeCssColorsExtensionId = `${manifest.publisher}.${manifest.name}`;

export const vscodeVisualizeCssColorsBrowserPath = manifest.browser;
