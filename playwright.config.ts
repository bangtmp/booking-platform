import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the public booking flow + owner approve flow.
 *
 * `npm run dev` is used as the webServer (simpler than build+start, and the
 * cold compile of the booking pages is absorbed by the generous webServer and
 * expect timeouts below). reuseExistingServer lets us point tests at an
 * already-running dev server.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
