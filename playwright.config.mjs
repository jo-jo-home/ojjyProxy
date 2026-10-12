import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://localhost:8000", headless: true },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: { WISP_TEST_MODE: "1" },
  },
});
