import type { APIRoute } from "astro";

export const prerender = false;

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
    // Parse query parameters for filtering
    const url = context.url;
    const clientId = url.searchParams.get("client_id");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const isInvoiced = url.searchParams.get("is_invoiced");

    // Build query
    let query = supabase
      .from("time_entries")
      .select(
        `
        id,
        date,
        hours,
        hourly_rate,
        currency,
        public_description,
        private_note,
        invoice_id,
        client:clients!inner(id, name)
      `
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false });

    // Apply filters
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    if (isInvoiced !== null && isInvoiced !== undefined && isInvoiced !== "") {
      if (isInvoiced === "true") {
        query = query.not("invoice_id", "is", null);
      } else {
        query = query.is("invoice_id", null);
      }
    }

    const { data: timeEntries, error } = await query;

    if (error) throw error;

    if (!timeEntries || timeEntries.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NO_DATA",
            message: "No time entries found for export",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate CSV
    const csvRows: string[] = [];

    // Header row
    csvRows.push("Data,Klient,Opis,Godziny,Stawka,Waluta,Wartość,Zafakturowane,Notatka prywatna");

    // Data rows
    timeEntries.forEach((entry: any) => {
      const hours = parseFloat(entry.hours || "0");
      const rate = parseFloat(entry.hourly_rate || "0");
      const value = (hours * rate).toFixed(2);
      const isInvoiced = entry.invoice_id ? "Tak" : "Nie";
      const clientName = entry.client?.name || "Brak klienta";

      // Escape fields that may contain commas or quotes
      const escapeCSV = (field: string | null | undefined) => {
        if (!field) return '""';
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      csvRows.push(
        [
          entry.date,
          escapeCSV(clientName),
          escapeCSV(entry.public_description),
          entry.hours,
          entry.hourly_rate,
          entry.currency,
          value,
          isInvoiced,
          escapeCSV(entry.private_note),
        ].join(",")
      );
    });

    const csvContent = csvRows.join("\n");

    // Add BOM for proper Excel encoding
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    // Generate filename with date range
    const today = new Date().toISOString().split("T")[0];
    let filename = `wpisy-czasu_${today}.csv`;

    if (dateFrom && dateTo) {
      filename = `wpisy-czasu_${dateFrom}_${dateTo}.csv`;
    } else if (dateFrom) {
      filename = `wpisy-czasu_od_${dateFrom}.csv`;
    } else if (dateTo) {
      filename = `wpisy-czasu_do_${dateTo}.csv`;
    }

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export time entries error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export time entries",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
