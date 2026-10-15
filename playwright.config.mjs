import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://localhost:8700", headless: true },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8700/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    // 8700 keeps the test stack off port 8000, where a sibling project's dev
    // server tends to respawn whenever the port is free. The headless engine
    // service rides along so its E2E test can run.
    env: {
      WISP_TEST_MODE: "1",
      DEV_PORT: "8700",
      HEADLESS_SERVICE: "1",
      HEADLESS_PARENT: "http://localhost:8700",
      HEADLESS_SELF: "http://localhost:9100",
      HEADLESS_ORIGINS: "http://localhost:9100",
      HEADLESS_ALLOW_PRIVATE: "1",
    },
  },
});
