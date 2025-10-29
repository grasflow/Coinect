import type { APIRoute } from "astro";
import type { AIInsightsStatusDTO } from "@/types";

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
    // Count time entries with private notes
    const { count: entriesWithNotes, error } = await supabase
      .from("time_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("private_note", "is", null)
      .neq("private_note", "")
      .is("deleted_at", null);

    if (error) throw error;

    const threshold = 20;
    const count = entriesWithNotes || 0;
    const unlocked = count >= threshold;
    const progressPercentage = Math.min((count / threshold) * 100, 100);

    const status: AIInsightsStatusDTO = {
      unlocked,
      entries_with_notes: count,
      threshold,
      progress_percentage: progressPercentage,
      message: unlocked
        ? "AI Insights jest gotowy do analizy!"
        : `Dodaj jeszcze ${threshold - count} wpisów z notatkami prywatnymi, aby odblokować AI Insights`,
    };

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Insights status error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch AI Insights status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
