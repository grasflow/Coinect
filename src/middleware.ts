import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.server";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client and attach to locals
  context.locals.supabase = createSupabaseServerClient(context.cookies);

  // Continue to the next middleware or route handler
  return next();
});
