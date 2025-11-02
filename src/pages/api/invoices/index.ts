import type { APIRoute } from "astro";

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
    const status = url.searchParams.get("status");
    const currency = url.searchParams.get("currency");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("page_size") || "20", 10);

    // Budowanie zapytania
    let query = context.locals.supabase
      .from("invoices")
      .select(
        `
        *,
        client:clients(name, tax_id)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("issue_date", { ascending: false });

    // Filtrowanie
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (dateFrom) {
      query = query.gte("issue_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("issue_date", dateTo);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (currency && currency !== "all") {
      query = query.eq("currency", currency);
    }

    // Paginacja
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        total: count || 0,
        page,
        pageSize,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
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
