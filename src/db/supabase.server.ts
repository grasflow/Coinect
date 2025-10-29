import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Tworzy klienta Supabase dla server-side operations (SSR)
 * Zarządza sesjami przez cookies
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: any) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: any) {
        cookies.delete(key, options);
      },
    },
  });
}

// Alias dla zgodności z API endpoints
export const createClient = createSupabaseServerClient;

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
