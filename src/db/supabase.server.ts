import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types";

function getEnvVar(name: string): string {
  const value = process.env[name] || import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function getSupabaseConfig() {
  const url = getEnvVar("SUPABASE_URL");
  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("Missing SUPABASE_KEY or SUPABASE_ANON_KEY environment variable");
  }

  return { url, key };
}

/**
 * Tworzy klienta Supabase dla server-side operations (SSR)
 * Zarządza sesjami przez cookies
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  const config = getSupabaseConfig();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options?: Parameters<typeof cookies.set>[1]) {
        cookies.set(key, value, options);
      },
      remove(key: string, options?: Parameters<typeof cookies.delete>[1]) {
        cookies.delete(key, options);
      },
    },
  });
}

// Alias dla zgodności z API endpoints
export const createClient = createSupabaseServerClient;

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
