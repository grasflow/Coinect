import type { APIRoute } from "astro";
import type { DashboardSummaryDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to access dashboard data",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = user.id;

  try {
    // 1. Count clients
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (clientsError) throw clientsError;

    // 2. Sum unbilled hours
    const { data: unbilledData, error: unbilledError } = await supabase
      .from("time_entries")
      .select("hours")
      .eq("user_id", userId)
      .is("invoice_id", null)
      .is("deleted_at", null);

    if (unbilledError) throw unbilledError;

    const unbilledHours = unbilledData.reduce((sum, entry) => sum + parseFloat(entry.hours || "0"), 0);

    // 3. Recent time entries (5 latest)
    const { data: recentTimeEntries, error: timeEntriesError } = await supabase
      .from("time_entries")
      .select(
        `
        id,
        date,
        hours,
        public_description,
        client:clients!inner(name)
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(5);

    if (timeEntriesError) throw timeEntriesError;

    // 4. AI Insights progress
    const { count: entriesWithNotes, error: aiError } = await supabase
      .from("time_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .not("private_note", "is", null)
      .neq("private_note", "");

    if (aiError) throw aiError;

    const aiThreshold = 20;
    const aiUnlocked = (entriesWithNotes || 0) >= aiThreshold;

    // 5. Faktury z bieżącego miesiąca
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const { data: monthInvoices, error: monthInvoicesError } = await supabase
      .from("invoices")
      .select("gross_amount, currency, is_manual, exchange_rate")
      .eq("user_id", userId)
      .gte("issue_date", firstDayOfMonth)
      .lte("issue_date", lastDayOfMonth)
      .is("deleted_at", null);

    if (monthInvoicesError) throw monthInvoicesError;

    // Przelicz wszystkie faktury na PLN
    let totalGrossAmountPLN = 0;
    let manualCount = 0;
    let timeEntriesCount = 0;

    (monthInvoices || []).forEach((inv) => {
      const grossPLN =
        inv.currency === "PLN" ? parseFloat(inv.gross_amount) : parseFloat(inv.gross_amount) * (inv.exchange_rate || 1);

      totalGrossAmountPLN += grossPLN;

      if (inv.is_manual) manualCount++;
      else timeEntriesCount++;
    });

    // 7. Ostatnie 5 faktur
    const { data: recentInvoices, error: recentInvoicesError } = await supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        gross_amount,
        currency,
        issue_date,
        is_manual,
        client:clients!inner(name)
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("issue_date", { ascending: false })
      .limit(5);

    if (recentInvoicesError) throw recentInvoicesError;

    // Build response
    const summary: DashboardSummaryDTO = {
      clients_count: clientsCount || 0,
      unbilled_hours: unbilledHours.toFixed(2),
      recent_time_entries: recentTimeEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        client_name: entry.client?.name || "Unknown",
        hours: entry.hours,
        public_description: entry.public_description,
      })),
      ai_insights_progress: {
        unlocked: aiUnlocked,
        entries_with_notes: entriesWithNotes || 0,
        threshold: aiThreshold,
      },
      current_month_invoices: {
        total_gross_amount_pln: parseFloat(totalGrossAmountPLN.toFixed(2)),
        count: monthInvoices?.length || 0,
        manual_count: manualCount,
        time_entries_count: timeEntriesCount,
      },
      recent_invoices: (recentInvoices || []).map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client?.name || "Nieznany",
        gross_amount: parseFloat(inv.gross_amount),
        currency: inv.currency,
        issue_date: inv.issue_date,
        is_manual: inv.is_manual,
      })),
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch dashboard summary",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
