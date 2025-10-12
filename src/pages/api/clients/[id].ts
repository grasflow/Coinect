import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { updateClientSchema } from "@/lib/validation/client.schema";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    const id = context.params.id;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_ID",
            message: "ID klienta jest wymagane",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    const body = await context.request.json();
    
    const validationResult = updateClientSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane wejściowe",
            details: validationResult.error.format(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingClient, error: fetchError } = await context.locals.supabase
      .from("clients")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingClient) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Klient nie został znaleziony",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: updatedClient, error: updateError } = await context.locals.supabase
      .from("clients")
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DB_ERROR",
            message: updateError.message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(updatedClient), {
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

export const DELETE: APIRoute = async (context) => {
  try {
    const id = context.params.id;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_ID",
            message: "ID klienta jest wymagane",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Sprawdź czy klient należy do użytkownika
    const { data: existingClient, error: fetchError } = await context.locals.supabase
      .from("clients")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingClient) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Klient nie został znaleziony",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Soft delete - ustaw deleted_at
    const { error: deleteError } = await context.locals.supabase
      .from("clients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DB_ERROR",
            message: deleteError.message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Klient został usunięty" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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

