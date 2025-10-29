import type { ResponseFormat } from "./openrouter.types";

export const createJsonSchema = <T extends Record<string, unknown>>(name: string, schema: T): ResponseFormat => ({
  type: "json_schema",
  json_schema: {
    name,
    strict: true,
    schema,
  },
});

export const commonSchemas = {
  textSummary: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      keywords: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
      },
      sentiment: {
        type: "string",
        enum: ["positive", "neutral", "negative"],
      },
    },
    required: ["summary", "keywords", "sentiment"],
  },

  structuredAnalysis: {
    type: "object",
    additionalProperties: false,
    properties: {
      mainPoints: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
      },
      conclusion: { type: "string" },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["mainPoints", "conclusion", "confidence"],
  },
} as const;

export const commonModels = {
  claude35Sonnet: "anthropic/claude-3.5-sonnet",
  claude3Haiku: "anthropic/claude-3-haiku",
  gpt4oMini: "openai/gpt-4o-mini",
  gpt4o: "openai/gpt-4o",
  auto: "openrouter/auto",
} as const;

export const commonParams = {
  creative: { temperature: 0.9, max_tokens: 1000 },
  balanced: { temperature: 0.5, max_tokens: 800 },
  precise: { temperature: 0.2, max_tokens: 500 },
} as const;
