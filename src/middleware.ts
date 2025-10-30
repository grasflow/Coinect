import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get environment variables from Cloudflare Workers runtime
  const env = context.locals.runtime?.env;

  // Create Supabase client and attach to locals
  context.locals.supabase = createSupabaseServerClient(context.cookies, env);

  // Continue to the next middleware or route handler
  return next();
});
