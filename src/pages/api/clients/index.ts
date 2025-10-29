import type { APIRoute } from "astro";
import { z } from "zod";
import { createClientSchema } from "@/lib/validation/client.schema";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    const body = await context.request.json();

    // Walidacja danych wejściowych
    const validatedData = createClientSchema.parse(body);

    // Przygotowanie danych do wstawienia (usuń puste stringi)
    const insertData = {
      user_id: userId,
      name: validatedData.name,
      tax_id: validatedData.tax_id || null,
      street: validatedData.street || null,
      city: validatedData.city || null,
      postal_code: validatedData.postal_code || null,
      country: validatedData.country || "Polska",
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      default_currency: validatedData.default_currency || "PLN",
      default_hourly_rate: validatedData.default_hourly_rate || null,
    };

    const { data, error } = await context.locals.supabase.from("clients").insert([insertData]).select("*").single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({
            error: {
              code: "CONFLICT",
              message: "Klient o tej nazwie już istnieje",
            },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "DB_ERROR",
            message: error.message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("POST /api/clients validation error:", error.errors);
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane",
            details: error.errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("POST /api/clients error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Wystąpił nieoczekiwany błąd",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    const { data, error } = await context.locals.supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("name")
      .limit(10000); // Zwiększ z domyślnego 1000 aby zapobiec problemom z dużą ilością danych

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DB_ERROR",
            message: error.message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Wystąpił nieoczekiwany błąd",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
