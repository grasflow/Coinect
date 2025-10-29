import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

/**
 * Tworzy klienta Supabase dla client-side operations (browser)
 * Automatycznie zarządza sesjami przez cookies
 */
export const supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseBrowserClient = typeof supabaseBrowserClient;
