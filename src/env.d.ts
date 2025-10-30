/// <reference types="astro/client" />

import type { SupabaseServerClient } from "./db/supabase.server";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseServerClient;
      runtime?: {
        env: {
          SUPABASE_URL?: string;
          SUPABASE_KEY?: string;
          SUPABASE_ANON_KEY?: string;
          [key: string]: string | undefined;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly ENV_NAME?: "local" | "integration" | "prod" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
