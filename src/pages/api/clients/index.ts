import type { APIRoute } from "astro";
import { z } from "zod";
import { createClientSchema } from "@/lib/validation/client.schema";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Próba autentykacji - jeśli nie ma tokenu, użyj domyślnego user ID do testowania
    let userId: string;

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      // Brak autentykacji - użyj domyślnego user ID do testowania
      userId = DEFAULT_USER_ID;
    } else {
      // Prawdziwa autentykacja
      userId = user.id;
    }

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

    const { data, error } = await context.locals.supabase
      .from("clients")
      .insert([insertData])
      .select("*")
      .single();

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
    let userId: string;

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      userId = DEFAULT_USER_ID;
    } else {
      userId = user.id;
    }

    const { data, error } = await context.locals.supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("name");

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
