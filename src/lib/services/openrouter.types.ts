export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

export interface GenerateParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface GenerateOptions {
  model?: string;
  system?: string;
  user: string | ChatMessage[];
  params?: GenerateParams;
  responseFormat?: ResponseFormat;
}

export interface GenerateResult<T = unknown> {
  content: T | string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  finish_reason?: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultParams?: GenerateParams;
}
