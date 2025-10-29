import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { createJsonSchema, commonSchemas } from "@/lib/services/openrouter.helpers";

export const prerender = false;

interface SummaryResult {
  summary: string;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
}

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

    const body = await context.request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "text is required and must be non-empty string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (text.length > 10000) {
      return new Response(JSON.stringify({ error: "text exceeds maximum length of 10000 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      defaultModel: "meta-llama/llama-3.3-8b-instruct:free",
      defaultParams: { temperature: 0.5, max_tokens: 400 },
    });

    const responseFormat = createJsonSchema("text_summary", commonSchemas.textSummary);

    const result = await client.generate<SummaryResult>({
      system:
        "Jesteś ekspertem od podsumowań. Zwracaj wyłącznie JSON zgodny ze schematem. Odpowiadaj w języku polskim.",
      user: `Podsumuj następujący tekst:\n\n${text}`,
      responseFormat,
    });

    return new Response(JSON.stringify(result.content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error in /api/ai/summarize:", e);
    console.error("Error details:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
    });

    const statusCode = e.name === "OpenRouterAuthError" ? 401 : 500;
    const errorMessage = e?.message ?? "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: e?.name,
        details: e?.stack?.split("\n")[0],
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
};
