import type { APIRoute } from "astro";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";
import { createSupabaseServerClient } from "@/db/supabase.server";
import { AuthService } from "@/lib/services/auth.service";
import { AuthError } from "@/lib/errors";

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Wysyła email z linkiem do resetowania hasła
 */
export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const env = context.locals.runtime?.env;
    const supabase = createSupabaseServerClient(context.cookies, env);
    const authService = new AuthService(supabase);

    // URL przekierowania po kliknięciu w link w emailu
    const resetUrl = `${new URL(context.request.url).origin}/reset-password`;

    await authService.sendPasswordResetEmail(validatedData.email, resetUrl);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Link do resetowania hasła został wysłany",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane formularza",
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

    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
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
