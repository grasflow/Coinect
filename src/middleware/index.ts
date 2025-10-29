import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.server.ts";

const PUBLIC_ROUTES = ["/kitchen-sink", "/"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Utwórz klienta Supabase dla server-side z obsługą cookies
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

  // Bezpieczna weryfikacja użytkownika przez serwer Supabase
  // getUser() weryfikuje token z serwerem, w przeciwieństwie do getSession() która tylko czyta cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = context.url.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");

  // Endpointy API zarządzają auth samodzielnie
  if (isApiRoute) {
    return next();
  }

  // Zalogowani użytkownicy nie mogą wchodzić na strony auth
  if (user && isAuthRoute) {
    return context.redirect("/dashboard");
  }

  // Niezalogowani muszą iść na /login (z wyjątkiem public i auth routes)
  if (!user && !isPublicRoute && !isAuthRoute) {
    return context.redirect("/login");
  }

  return next();
});
