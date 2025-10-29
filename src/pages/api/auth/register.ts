import type { APIRoute } from "astro";
import { z } from "zod";
import { registerSchema } from "@/lib/validation/auth.schema";
import { createSupabaseServerClient } from "@/db/supabase.server";
import { AuthService } from "@/lib/services/auth.service";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const supabase = createSupabaseServerClient(cookies);
    const authService = new AuthService(supabase);

    const { user } = await authService.register(validatedData);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      }),
      {
        status: 201,
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

    if (error instanceof Error) {
      const errorCode =
        error.name === "AuthError" && "code" in error ? (error as { code: string }).code : "REGISTRATION_ERROR";

      return new Response(
        JSON.stringify({
          error: {
            code: errorCode,
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
