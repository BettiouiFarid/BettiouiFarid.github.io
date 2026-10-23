const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    // BASE_URL=https://bettiouifarid.github.io npm test  → test the live site
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "node server.js",
        url: "http://localhost:3000",
        reuseExistingServer: true,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
