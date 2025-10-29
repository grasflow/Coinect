import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalSetup() {
  console.log("🔧 Setting up test user with Supabase Cloud...");

  const testEmail = process.env.TEST_USER_EMAIL || "test@test.pl";
  const testPassword = process.env.TEST_USER_PASSWORD || "test12345";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Missing Supabase credentials (URL or SERVICE_ROLE_KEY), skipping user setup");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.warn("⚠️ Failed to list users:", listError.message);
      return;
    }

    const existingUser = users.find((u) => u.email === testEmail);

    if (existingUser) {
      console.log("ℹ️ Test user already exists");
      return;
    }

    // Create user using Admin API (bypasses email verification)
    const { error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Automatically confirm email
      user_metadata: {
        full_name: "Test User",
      },
    });

    if (createError) {
      console.warn("⚠️ Failed to create test user:", createError.message);
    } else {
      console.log("✅ Test user created successfully");
    }
  } catch (error) {
    console.warn("⚠️ Error setting up test user:", error instanceof Error ? error.message : String(error));
  }
}

export default globalSetup;
