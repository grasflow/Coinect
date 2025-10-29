import type { APIRoute } from "astro";
import { z } from "zod";
import { createTimeEntrySchema } from "@/lib/validation/time-entry.schema";
import { TimeEntryService } from "@/lib/services/time-entry.service";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const prerender = false;

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

    const url = new URL(context.request.url);
    const clientId = url.searchParams.get("client_id");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const status = url.searchParams.get("status") as "billed" | "unbilled" | "all" | null;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("page_size") || "20", 10);

    const service = new TimeEntryService(context.locals.supabase);
    const result = await service.getTimeEntries(userId, {
      clientId: clientId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || "all",
      page,
      pageSize,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/time-entries error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    // Validate that supabase client is initialized
    if (!context.locals.supabase) {
      console.error("POST /api/time-entries error: Supabase client not initialized in context.locals");
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "Database client not initialized",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      console.error("POST /api/time-entries auth error:", authError);
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

    const validatedData = createTimeEntrySchema.parse(body);

    const service = new TimeEntryService(context.locals.supabase);
    const result = await service.createTimeEntry(userId, validatedData);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("POST /api/time-entries validation error:", error.errors);
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data provided",
            details: error.errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof NotFoundError) {
      console.error("POST /api/time-entries not found error:", error.message);
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ForbiddenError) {
      console.error("POST /api/time-entries forbidden error:", error.message);
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("POST /api/time-entries error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
