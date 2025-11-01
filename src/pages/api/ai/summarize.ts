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

    // Get API key from runtime environment (Cloudflare Pages)
    const env = context.locals.runtime?.env;
    const apiKey = env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;

    const client = new OpenRouterService({
      apiKey,
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
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error("Unknown error");
    console.error("Error in /api/ai/summarize:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    const statusCode = error.name === "OpenRouterAuthError" ? 401 : 500;
    const errorMessage = error.message ?? "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: error.name,
        details: error.stack?.split("\n")[0],
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
};
