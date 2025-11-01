import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { createJsonSchema, commonParams } from "@/lib/services/openrouter.helpers";

export const prerender = false;

interface AnalysisResult {
  mainPoints: string[];
  conclusion: string;
  confidence: number;
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
    const { text, model } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "text is required and must be non-empty string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get API key from runtime environment (Cloudflare Pages)
    const env = context.locals.runtime?.env;
    const apiKey = env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;

    const client = new OpenRouterService({
      apiKey,
      defaultModel: model ?? "meta-llama/llama-3.3-8b-instruct:free",
      defaultParams: commonParams.balanced,
    });

    const responseFormat = createJsonSchema("structured_analysis", {
      type: "object",
      additionalProperties: false,
      properties: {
        mainPoints: {
          type: "array",
          items: { type: "string" },
        },
        conclusion: { type: "string" },
        confidence: {
          type: "number",
        },
      },
      required: ["mainPoints", "conclusion", "confidence"],
    });

    const result = await client.generate<AnalysisResult>({
      system:
        "Jesteś analitykiem. Analizujesz tekst i zwracasz kluczowe punkty, wnioski oraz pewność analizy (0-1). Odpowiadaj w języku polskim.",
      user: `Przeanalizuj tekst:\n\n${text}`,
      responseFormat,
    });

    if (typeof result.content === "string") {
      throw new Error("Unexpected string response");
    }

    return new Response(
      JSON.stringify({
        mainPoints: result.content.mainPoints,
        conclusion: result.content.conclusion,
        confidence: result.content.confidence,
        usage: result.usage,
        model: result.model,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: unknown) {
    const error = e as Error & { name?: string };

    const statusCode = error.name === "OpenRouterAuthError" ? 401 : 500;
    const errorMessage = error?.message ?? "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: error?.name,
        details: error?.stack?.split("\n")[0],
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
