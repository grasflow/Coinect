import type { APIRoute } from "astro";
import type { AIInsightsAnalysisDTO, AIInsightDataDTO } from "@/types";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { createJsonSchema } from "@/lib/services/openrouter.helpers";

export const prerender = false;

const MINIMUM_ENTRIES_FOR_ANALYSIS = 1;

export const POST: APIRoute = async (context) => {
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

    // Pobierz dane AI dla użytkownika (tylko z bieżącego miesiąca)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayString = firstDayOfMonth.toISOString().split("T")[0];

    const { data: aiData, error: dataError } = await context.locals.supabase
      .from("ai_insights_data")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", firstDayString)
      .order("date", { ascending: false });

    if (dataError) {
      throw dataError;
    }

    // Sprawdź czy użytkownik ma wystarczająco dużo danych
    if (!aiData || aiData.length < MINIMUM_ENTRIES_FOR_ANALYSIS) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INSUFFICIENT_DATA",
            message: `Potrzebujesz co najmniej ${MINIMUM_ENTRIES_FOR_ANALYSIS} wpisów z notatkami prywatnymi. Obecnie masz ${aiData?.length || 0}.`,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Przygotuj dane do analizy - anonimizacja i agregacja
    const analysisData = prepareDataForAnalysis(aiData as AIInsightDataDTO[]);

    // Get API key from runtime environment (Cloudflare Pages)
    const env = context.locals.runtime?.env;
    const apiKey = env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const client = new OpenRouterService({
      apiKey,
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      defaultParams: { temperature: 0.7, max_tokens: 2000 },
    });

    const responseFormat = createJsonSchema("ai_insights_analysis", {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        work_patterns: {
          type: "object",
          properties: {
            peak_days: { type: "array", items: { type: "string" } },
            average_hours_per_week: { type: "number" },
            consistency_score: { type: "number" },
            insights: { type: "array", items: { type: "string" } },
          },
          required: ["peak_days", "average_hours_per_week", "consistency_score", "insights"],
        },
        rate_analysis: {
          type: "object",
          properties: {
            current_average_rate: { type: "number" },
            rate_range: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
              },
              required: ["min", "max"],
            },
            optimization_potential: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["current_average_rate", "rate_range", "optimization_potential", "recommendations"],
        },
        productivity_insights: {
          type: "object",
          properties: {
            most_productive_periods: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["most_productive_periods", "suggestions"],
        },
        action_items: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "work_patterns", "rate_analysis", "productivity_insights", "action_items"],
    });

    const result = await client.generate<Omit<AIInsightsAnalysisDTO, "generated_at">>({
      system: `Jesteś ekspertem od analizy wzorców pracy i optymalizacji stawek dla freelancerów.
Analizujesz dane o wpisach czasu pracy i zwracasz szczegółowe rekomendacje w języku polskim.

Zasady analizy:
- Consistency score to ocena regularności pracy (0-10, gdzie 10 = bardzo regularna)
- Identyfikuj wzorce w dniach tygodnia i godzinach pracy
- Sugeruj optymalizacje stawek na podstawie rodzaju pracy i czasu
- Wskazuj możliwości poprawy work-life balance
- Bądź konkretny i praktyczny w rekomendacjach

Odpowiadaj wyłącznie w formacie JSON zgodnym ze schematem.`,
      user: `Przeanalizuj poniższe dane o pracy freelancera i wygeneruj szczegółowe insighty:

${analysisData}

Przeanalizuj wzorce pracy, stawki, produktywność i zasugeruj konkretne działania do podjęcia.`,
      responseFormat,
    });

    if (typeof result.content === "string") {
      throw new Error("Unexpected string response from AI");
    }

    const analysis: AIInsightsAnalysisDTO = {
      ...result.content,
      entries_count: aiData.length,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const error = e as Error & { name?: string };

    console.error("AI Insights analysis error:", error);

    const statusCode = error.name === "OpenRouterAuthError" ? 401 : 500;
    const errorMessage = error?.message ?? "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: {
          code: error?.name || "INTERNAL_ERROR",
          message: errorMessage,
          details: error?.stack?.split("\n")[0],
        },
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Przygotowuje dane do analizy - agreguje i formatuje
 */
function prepareDataForAnalysis(data: AIInsightDataDTO[]): string {
  const stats = {
    total_entries: data.length,
    total_hours: data.reduce((sum, entry) => sum + entry.hours, 0),
    average_rate: data.reduce((sum, entry) => sum + entry.hourly_rate, 0) / data.length,
    date_range: {
      from: data[data.length - 1]?.date,
      to: data[0]?.date,
    },
    by_day_of_week: {} as Record<number, { count: number; total_hours: number }>,
    rate_distribution: {
      min: Math.min(...data.map((d) => d.hourly_rate)),
      max: Math.max(...data.map((d) => d.hourly_rate)),
    },
  };

  // Agregacja po dniach tygodnia
  data.forEach((entry) => {
    if (!stats.by_day_of_week[entry.day_of_week]) {
      stats.by_day_of_week[entry.day_of_week] = { count: 0, total_hours: 0 };
    }
    stats.by_day_of_week[entry.day_of_week].count++;
    stats.by_day_of_week[entry.day_of_week].total_hours += entry.hours;
  });

  // Przykładowe notatki (pierwsze 10) - bez wrażliwych danych
  const sampleNotes = data
    .slice(0, 10)
    .filter((d) => d.private_note)
    .map((d) => ({
      day_of_week: d.day_of_week,
      hours: d.hours,
      rate: d.hourly_rate,
      note_preview: d.private_note?.substring(0, 100),
    }));

  return JSON.stringify(
    {
      statistics: stats,
      sample_entries: sampleNotes,
    },
    null,
    2
  );
}
