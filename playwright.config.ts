import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalSetup() {
  console.log("Setting up test user...");

  const testEmail = process.env.TEST_USER_EMAIL || "test@test.com";
  const testPassword = process.env.TEST_USER_PASSWORD || "Test123456";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials, skipping user setup");
    return;
  }

  try {
    // Try to sign up the test user (will fail if already exists, which is fine)
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          full_name: "Test User",
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Test user created successfully");
    } else if (data.error?.message?.includes("already registered")) {
      console.log("ℹ️ Test user already exists");
    } else {
      console.warn("⚠️ Failed to create test user:", data.error?.message);
    }
  } catch (error) {
    console.warn("⚠️ Error setting up test user:", error instanceof Error ? error.message : String(error));
  }
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/utils/global-setup.ts",
  globalTeardown: "./e2e/utils/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: [["html"], ["json", { outputFile: "playwright-report/results.json" }], ["list"]],
  timeout: 90000, // 90 sekund na cały test (zwiększone z 60)
  expect: {
    timeout: 15000, // 15 sekund na pojedynczy expect (zwiększone z 10)
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30000, // 30 sekund na pojedynczą akcję (zwiększone z 15)
    navigationTimeout: 45000, // 45 sekund na nawigację (zwiększone z 30)
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: {
    command: "npm run dev:test",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Allow reusing existing server for debugging
    timeout: 120 * 1000,
  },
});
