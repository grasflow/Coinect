import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerClient } from "@/db/supabase.server";
import { AuthError } from "@/lib/errors";
import { AuthService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validation/auth.schema";

export const prerender = false;

/**
 * POST /api/auth/login
 * Loguje użytkownika i ustawia session cookies
 */
export const POST: APIRoute = async (context) => {
  try {
    // Parsowanie i walidacja danych wejściowych
    const body = await context.request.json();
    const validatedData = loginSchema.parse(body);

    // Utworzenie klienta Supabase z obsługą cookies
    const supabase = createSupabaseServerClient(context.cookies);
    const authService = new AuthService(supabase);

    // Logowanie użytkownika
    const result = await authService.login(validatedData.email, validatedData.password);

    // Supabase SSR automatycznie ustawia cookies przez createSupabaseServerClient
    // Zwracamy tylko podstawowe informacje (bez wrażliwych danych sesji)
    return new Response(
      JSON.stringify({
        success: true,
        user: result.user,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Błędy walidacji",
            details: error.errors,
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Obsługa błędów autentykacji
    if (error instanceof AuthError) {
      const statusCode = error.code === "INVALID_CREDENTIALS" ? 401 : 400;
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
          },
        }),
        {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Nieoczekiwany błąd
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Wystąpił nieoczekiwany błąd",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
