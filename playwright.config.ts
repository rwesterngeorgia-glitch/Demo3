import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  workers: 3,
  timeout: 45000,
  webServer: process.env.BASE_URL ? undefined : {command:"node scripts/static-server.mjs dist 5192",url:"http://127.0.0.1:5192",reuseExistingServer:!process.env.CI},
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:5192",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
