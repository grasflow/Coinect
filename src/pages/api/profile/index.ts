import type { APIRoute } from "astro";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";
import { updateProfileSchema } from "@/lib/validation/profile.schema";
import { ZodError } from "zod";

export const prerender = false;

// GET current user profile
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (error) throw error;

    if (!profile) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Profile not found",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const profileDTO: ProfileDTO = profile;

    return new Response(JSON.stringify(profileDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch profile",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// PATCH update profile
export const PATCH: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await context.request.json();

    // Walidacja danych wejściowych
    const validatedData = updateProfileSchema.parse(body);

    // Update profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        data: profile,
        message: "Profil zaktualizowany pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update profile error:", error);

    // Obsługa błędów walidacji Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Błąd walidacji danych",
            details: error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update profile",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
