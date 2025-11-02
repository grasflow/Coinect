import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

// Throw error if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    "🚨 CRITICAL ERROR: Supabase environment variables not configured!\n" +
    `  - URL: ${supabaseUrl ? "✅" : "❌ MISSING"}\n` +
    `  - Key: ${supabaseAnonKey ? "✅" : "❌ MISSING"}\n\n` +
    "This indicates a build-time configuration issue.\n" +
    "Check that PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are set during build.\n\n" +
    "For Cloudflare Pages deployment:\n" +
    "1. Variables must be set in GitHub Actions workflow\n" +
    "2. vite.define must be configured in astro.config.mjs\n" +
    "3. Environment variables must be added to Cloudflare Pages dashboard";

  throw new Error("Supabase client initialization failed: missing environment variables");
}

/**
 * Tworzy klienta Supabase dla client-side operations (browser)
 * Automatycznie zarządza sesjami przez cookies
 */
export const supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseBrowserClient = typeof supabaseBrowserClient;
