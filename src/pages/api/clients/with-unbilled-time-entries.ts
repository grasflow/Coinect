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

    // Pobierz klientów, którzy mają niewyfakturowane wpisy czasu
    const { data, error } = await context.locals.supabase
      .from("clients")
      .select(
        `
        id,
        name,
        tax_id,
        street,
        city,
        postal_code,
        country,
        email,
        phone,
        default_currency,
        default_hourly_rate,
        time_entries:time_entries!inner(
          id
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("time_entries.invoice_id", null)
      .is("time_entries.deleted_at", null)
      .order("name");

    if (error) {
      console.error("Database error:", error);
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

    // Usuń duplikaty klientów (mogą pojawić się jeśli klient ma wiele niewyfakturowanych wpisów)
    const uniqueClients =
      data?.reduce((acc, client) => {
        if (!acc.some((c) => c.id === client.id)) {
          // Usuń pole time_entries z odpowiedzi
          const { time_entries, ...clientWithoutTimeEntries } = client;
          acc.push(clientWithoutTimeEntries);
        }
        return acc;
      }, [] as any[]) || [];

    return new Response(JSON.stringify(uniqueClients), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
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
