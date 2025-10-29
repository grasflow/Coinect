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

    // Budowanie zapytania agregującego
    let query = context.locals.supabase
      .from("invoices")
      .select("net_amount, gross_amount, currency")
      .eq("user_id", userId)
      .is("deleted_at", null);

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

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Obliczanie sum
    const totals = (data || []).reduce(
      (acc, invoice) => {
        acc.netAmount += invoice.net_amount || 0;
        acc.grossAmount += invoice.gross_amount || 0;
        return acc;
      },
      { netAmount: 0, grossAmount: 0 }
    );

    return new Response(
      JSON.stringify({
        netAmount: totals.netAmount,
        grossAmount: totals.grossAmount,
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching invoice totals:", error);
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
