import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkAndCreateTestUser() {
  const testEmail = process.env.TEST_USER_EMAIL || "test@test.pl";
  const testPassword = process.env.TEST_USER_PASSWORD || "test12345";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials!");
    console.log("Required:");
    console.log("  - SUPABASE_URL");
    console.log("  - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log("🔍 Checking for test user:", testEmail);
  console.log("📝 Supabase URL:", supabaseUrl);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Failed to list users:", listError.message);
      process.exit(1);
    }

    const existingUser = users.find((u) => u.email === testEmail);

    if (existingUser) {
      console.log("✅ User already exists!");
      console.log("   ID:", existingUser.id);
      console.log("   Email:", existingUser.email);
      console.log("   Email confirmed:", existingUser.email_confirmed_at ? "Yes" : "No");
      console.log("   Created:", existingUser.created_at);

      // Check if we can login with this user
      console.log("\n🔐 Testing login...");
      const { createClient: createBrowserClient } = await import("@supabase/supabase-js");
      const browserClient = createBrowserClient(
        supabaseUrl,
        process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || ""
      );

      const { data: loginData, error: loginError } = await browserClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (loginError) {
        console.error("❌ Login failed:", loginError.message);
        console.log("\n💡 Possible issues:");
        console.log("   - Password might be incorrect");
        console.log("   - Email might not be confirmed");
        
        // Try to update password
        console.log("\n🔄 Attempting to reset password...");
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: testPassword,
          email_confirm: true,
        });

        if (updateError) {
          console.error("❌ Failed to update user:", updateError.message);
        } else {
          console.log("✅ Password updated and email confirmed!");
          console.log("   Try logging in again.");
        }
      } else {
        console.log("✅ Login successful!");
        console.log("   User ID:", loginData.user?.id);
      }
    } else {
      console.log("ℹ️ User does not exist. Creating...");

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: "Test User",
        },
      });

      if (createError) {
        console.error("❌ Failed to create user:", createError.message);
        process.exit(1);
      }

      console.log("✅ User created successfully!");
      console.log("   ID:", newUser.user?.id);
      console.log("   Email:", newUser.user?.email);
      console.log("   Email confirmed:", newUser.user?.email_confirmed_at ? "Yes" : "No");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

checkAndCreateTestUser();

