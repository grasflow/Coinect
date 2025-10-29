import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * @deprecated Użyj createSupabaseServerClient() dla server-side lub supabaseBrowserClient dla client-side
 * Ten klient jest zachowany tylko dla kompatybilności wstecznej
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;
