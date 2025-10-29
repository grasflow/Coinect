import type { GenerateOptions, GenerateResult, ChatMessage, OpenRouterConfig } from "./openrouter.types";
import {
  OpenRouterAuthError,
  OpenRouterRequestError,
  OpenRouterServerError,
  ResponseParsingError,
} from "./openrouter.errors";

export class OpenRouterService {
  public readonly baseUrl: string;
  public readonly defaultModel?: string;
  public readonly defaultParams?: GenerateOptions["params"];
  private readonly apiKey: string;

  constructor(cfg: OpenRouterConfig) {
    if (!cfg?.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
    this.defaultModel = cfg.defaultModel;
    this.defaultParams = cfg.defaultParams;
  }

  withDefaults(partial: { model?: string; params?: GenerateOptions["params"] }): OpenRouterService {
    return new OpenRouterService({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      defaultModel: partial.model ?? this.defaultModel,
      defaultParams: { ...this.defaultParams, ...partial.params },
    });
  }

  async generate<T = unknown>(options: GenerateOptions): Promise<GenerateResult<T>> {
    const payload = this._buildPayload(options);
    const res = await this._request("/chat/completions", payload);
    return this._parse<T>(res, Boolean(options.responseFormat));
  }

  private _buildPayload(options: GenerateOptions): Record<string, unknown> {
    const messages = this._buildMessages(options.system, options.user);
    const model = options.model ?? this.defaultModel;

    if (!model) {
      throw new Error("Model is required");
    }

    const payload: Record<string, unknown> = {
      model,
      messages,
      ...(this.defaultParams ?? {}),
      ...(options.params ?? {}),
    };

    if (options.responseFormat) {
      payload.response_format = options.responseFormat;
    }

    return payload;
  }

  private _buildMessages(system?: string, userOrMessages?: string | ChatMessage[]): ChatMessage[] {
    const messages: ChatMessage[] = [];

    if (system) {
      messages.push({ role: "system", content: system });
    }

    if (Array.isArray(userOrMessages)) {
      return [...messages, ...userOrMessages];
    }

    if (typeof userOrMessages === "string") {
      messages.push({ role: "user", content: userOrMessages });
    }

    return messages;
  }

  private async _request(path: string, payload: Record<string, unknown>): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    const doFetch = () =>
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://coinect.app",
          "X-Title": "Coinect",
        },
        body: JSON.stringify(payload),
      });

    let attempt = 0;
    const maxAttempts = 3;

    while (true) {
      const res = await doFetch();

      if (res.ok) {
        return res.json();
      }

      if (res.status === 401) {
        throw new OpenRouterAuthError();
      }

      if (res.status === 400) {
        const errorText = await res.text();
        throw new OpenRouterRequestError("Bad request", errorText);
      }

      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (++attempt >= maxAttempts) {
          throw new OpenRouterServerError(res.status);
        }

        const backoffMs = Math.min(1000 * 2 ** attempt + Math.random() * 200, 8000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      throw new OpenRouterServerError(res.status, `Unexpected error: ${res.status}`);
    }
  }

  private _parse<T>(apiResponse: any, expectsJson: boolean): GenerateResult<T> {
    const choice = apiResponse?.choices?.[0];
    const usage = apiResponse?.usage;
    const model = apiResponse?.model;
    const finish = choice?.finish_reason;

    if (!choice) {
      throw new Error("Empty choices in response");
    }

    if (expectsJson) {
      const raw = choice?.message?.content;
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return {
          content: parsed as T,
          usage,
          model,
          finish_reason: finish,
        };
      } catch {
        throw new ResponseParsingError();
      }
    }

    return {
      content: choice?.message?.content as string,
      usage,
      model,
      finish_reason: finish,
    };
  }
}
