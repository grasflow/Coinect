import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalTeardown() {
  console.log("🧹 Cleaning up test database...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL || "test@test.pl";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Missing Supabase credentials (URL or SERVICE_ROLE_KEY), skipping cleanup");
    return;
  }

  try {
    // Create admin client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get test user ID
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.warn("⚠️ Failed to list users:", listError.message);
      return;
    }

    const testUser = users.find((u) => u.email === testEmail);

    if (!testUser) {
      console.log("ℹ️ Test user not found, nothing to clean up");
      return;
    }

    console.log(`🔍 Found test user: ${testUser.email} (${testUser.id})`);

    // Delete all test data in reverse dependency order
    // 1. Delete invoices first (references time_entries)
    const { error: invoicesError } = await supabase.from("invoices").delete().eq("user_id", testUser.id);

    if (invoicesError) {
      console.warn("⚠️ Failed to delete invoices:", invoicesError.message);
    } else {
      console.log("✅ Deleted test invoices");
    }

    // 2. Delete time entries (references clients)
    const { error: timeEntriesError } = await supabase.from("time_entries").delete().eq("user_id", testUser.id);

    if (timeEntriesError) {
      console.warn("⚠️ Failed to delete time entries:", timeEntriesError.message);
    } else {
      console.log("✅ Deleted test time entries");
    }

    // 3. Delete clients (base table)
    const { error: clientsError } = await supabase.from("clients").delete().eq("user_id", testUser.id);

    if (clientsError) {
      console.warn("⚠️ Failed to delete clients:", clientsError.message);
    } else {
      console.log("✅ Deleted test clients");
    }

    // 4. Delete AI insights (correct table name is ai_insights_data)
    const { error: insightsError } = await supabase.from("ai_insights_data").delete().eq("user_id", testUser.id);

    if (insightsError) {
      console.warn("⚠️ Failed to delete AI insights:", insightsError.message);
    } else {
      console.log("✅ Deleted test AI insights");
    }

    console.log("✅ Test database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Error during test database cleanup:", error instanceof Error ? error.message : String(error));
  }
}

export default globalTeardown;
