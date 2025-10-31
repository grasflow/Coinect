import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types";

interface SupabaseEnv {
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
}

function getSupabaseConfig(env?: SupabaseEnv) {
  // Try to get from Cloudflare env first, then fall back to import.meta.env
  const url = env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const key =
    env?.SUPABASE_KEY || env?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY || import.meta.env.SUPABASE_ANON_KEY;

  // TEMPORARY: Log config source for debugging
  console.log("🔧 [Supabase] Config source:", {
    fromCloudflare: !!env?.SUPABASE_URL,
    hasUrl: !!url,
    hasKey: !!key,
    urlPreview: url ? `${url.substring(0, 30)}...` : "undefined",
  });

  if (!url) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  if (!key) {
    throw new Error("Missing SUPABASE_KEY or SUPABASE_ANON_KEY environment variable");
  }

  return { url, key };
}

/**
 * Tworzy klienta Supabase dla server-side operations (SSR)
 * Zarządza sesjami przez cookies
 */
export function createSupabaseServerClient(cookies: AstroCookies, env?: SupabaseEnv) {
  const config = getSupabaseConfig(env);
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
}

// Alias dla zgodności z API endpoints
export const createClient = createSupabaseServerClient;

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
