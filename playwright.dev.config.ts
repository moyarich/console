import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/dev",
  use: { baseURL: "http://localhost:5173" },
  expect: { timeout: 30_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/storybook/index.json",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
