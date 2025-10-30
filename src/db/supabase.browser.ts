import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

// Debug: log environment variables (remove after fixing)
console.log("[Supabase Browser] URL:", supabaseUrl);
console.log("[Supabase Browser] Key:", supabaseAnonKey ? "SET (length: " + supabaseAnonKey.length + ")" : "NOT SET");
console.log("[Supabase Browser] PUBLIC_SUPABASE_URL:", import.meta.env.PUBLIC_SUPABASE_URL);
console.log("[Supabase Browser] PUBLIC_SUPABASE_KEY:", import.meta.env.PUBLIC_SUPABASE_KEY ? "SET" : "NOT SET");

/**
 * Tworzy klienta Supabase dla client-side operations (browser)
 * Automatycznie zarządza sesjami przez cookies
 */
export const supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseBrowserClient = typeof supabaseBrowserClient;
