## Przewodnik implementacji usługi OpenRouter

### 1. Opis usługi

`OpenRouterService` to serwis TypeScript do komunikacji z API OpenRouter (endpoint `POST /api/v1/chat/completions`). Zapewnia:

- Bezpieczne użycie klucza API po stronie serwera (Astro API routes).
- Budowę wiadomości czatu (system, user) oraz parametrów modelu.
- Ustrukturyzowane odpowiedzi przez `response_format` z JSON Schema (z walidacją).
- Spójne mapowanie błędów i politykę retry dla błędów tymczasowych.

Integracja jest projektowana pod stack: Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui; wykonywana w katalogach `src/lib` oraz `src/pages/api` z zachowaniem zasad czystego kodu.

### 2. Opis konstruktora

Konstruktor przyjmuje klucz API i opcjonalną konfigurację domyślną modelu:

```ts
type OpenRouterConfig = {
  apiKey: string; // wymagany, wyłącznie po stronie serwera
  baseUrl?: string; // domyślnie 'https://openrouter.ai/api/v1'
  defaultModel?: string; // np. 'openrouter/auto' lub konkretny model
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
};
```

Założenia bezpieczeństwa:

- `apiKey` zawsze pobierany z `import.meta.env.OPENROUTER_API_KEY` w kontekście serwerowym (Astro API route, middleware, edge). Nie używać po stronie klienta.
- Walidacja, że `apiKey` istnieje; w przeciwnym razie rzucany jest błąd konfiguracyjny.

### 3. Publiczne metody i pola

- `generate(options)`
  - **Argumenty**:
    - `model` (string) — nazwa modelu OpenRouter (np. `anthropic/claude-3.5-sonnet` lub `openai/gpt-4o-mini`).
    - `system` (string?) — komunikat systemowy (kontekst/reguły).
    - `user` (string | Array<{ role: 'user'|'assistant'|'system'; content: string }>) — treść użytkownika lub pełna historia.
    - `params` (obiekt) — parametry modelu (temperature, max_tokens, top_p, itp.).
    - `responseFormat` (opcjonalnie) — obiekt JSON Schema wg specyfikacji `response_format` OpenRouter.
  - **Zwraca**: `{ content, usage, model, finish_reason }`, gdzie `content` jest tekstem lub obiektem (gdy `responseFormat` wymaga JSON).

- `withDefaults(partial)`
  - Zwraca nową instancję serwisu z nadpisanymi domyślnymi: `model`, `params`, `responseFormat`.

Pola:

- `baseUrl` (readonly)
- `defaultModel` (readonly)
- `defaultParams` (readonly)

### 4. Prywatne metody i pola

- `_buildMessages(system, userOrMessages)` — składa tablicę `messages` zgodną z OpenRouter (kolejno: system?, user/assistant/itd.).
- `_buildPayload(opts)` — scala model, messages, params oraz `response_format` w ciało żądania.
- `_request(payload)` — wykonuje `fetch`, dodaje nagłówki i politykę retry (np. 3 próby dla 429/5xx z backoffem).
- `_parse(apiResponse, expectsJson)` — zwraca finalne `{ content, usage, model, finish_reason }`, z parsowaniem JSON przy wymogu schematu.
- `_mapAndThrowHttpError(res)` — mapuje statusy HTTP → klasy błędów domenowych.

### 5. Obsługa błędów

Potencjalne scenariusze i zalecenia:

1. Brak/nieprawidłowy klucz API (401): rzuć `OpenRouterAuthError`, komunikat konfiguracyjny, nie ponawiaj.
2. Limit zapytań (429): polityka retry z wykładniczym backoffem i jitterem, do 3 prób.
3. Błędy walidacji żądania (400): `OpenRouterRequestError` z treścią odpowiedzi; napraw wejście.
4. Błędy serwera (5xx): retry z backoffem; po wyczerpaniu prób `OpenRouterServerError`.
5. Błąd parsowania JSON (gdy `responseFormat`): `ResponseParsingError` (nie retry).
6. Niezgodność ze schematem JSON: `SchemaValidationError` (nie retry), zwróć szczegóły naruszeń.
7. Timeout sieci: `NetworkTimeoutError` + retry; ustaw rozsądny `timeout` (np. 30s) po stronie wywołującej.

### 6. Kwestie bezpieczeństwa

- Klucz `OPENROUTER_API_KEY` tylko po stronie serwera; nigdy w bundlu klienta.
- Walidacja danych wejściowych (np. długość, dozwolone znaki) dla promptów użytkownika.
- Przechowywanie logów bez wrażliwych danych (maskowanie kluczy, skracanie promptów).
- Ochrona przed injection w komunikacie systemowym — nie łącz bez walidacji danych od użytkownika z rolą `system`.
- Ustal limity `max_tokens` oraz rozsądne `temperature` zgodnie z przypadkiem użycia.

### 7. Plan wdrożenia krok po kroku

#### Krok 1: Zmienne środowiskowe

- Dodaj do `.env` (nie commitować):

```env
OPENROUTER_API_KEY="sk-or-..."
```

- W Astro używaj wyłącznie po stronie serwera: `import.meta.env.OPENROUTER_API_KEY`.

#### Krok 2: Struktura plików

- `src/lib/services/openrouter.service.ts` — implementacja serwisu.
- `src/lib/services/openrouter.types.ts` — typy opcji/rezultatów.
- (opcjonalnie) `src/lib/services/openrouter.errors.ts` — klasy błędów.
- Przykładowy endpoint testowy: `src/pages/api/ai/summarize.ts`.

#### Krok 3: Interfejsy i typy (przykład)

```ts
// src/lib/services/openrouter.types.ts
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type GenerateParams = {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
};

export type GenerateOptions = {
  model?: string;
  system?: string;
  user: string | ChatMessage[];
  params?: GenerateParams;
  responseFormat?: ResponseFormat; // włącza wymóg JSON
};

export type GenerateResult<T = unknown> = {
  content: T | string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
  finish_reason?: string;
};
```

#### Krok 4: Konstrukcja `response_format` i wiadomości (przykłady)

- **(1) Komunikat systemowy** — przykład:

```ts
const system = "Jesteś asystentem, odpowiadasz krótko i w języku polskim.";
```

- **(2) Komunikat użytkownika** — przykład:

```ts
const user = "Stwórz krótkie podsumowanie tego artykułu.";
```

- **(3) Ustrukturyzowana odpowiedź (`response_format`)** — przykład z JSON Schema:

```ts
const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "article_summary",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        keywords: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
      },
      required: ["summary", "keywords", "sentiment"],
    },
  },
} as const;
```

- **(4) Nazwa modelu** — przykłady:
  - `openrouter/auto` (delegacja wyboru)
  - `anthropic/claude-3.5-sonnet`
  - `openai/gpt-4o-mini`

- **(5) Parametry modelu** — przykład:

```ts
const params = { temperature: 0.4, max_tokens: 400, top_p: 0.95 };
```

#### Krok 5: Implementacja serwisu (szkielet)

```ts
// src/lib/services/openrouter.service.ts
import type { GenerateOptions, GenerateResult, ChatMessage } from "./openrouter.types";

export class OpenRouterService {
  public readonly baseUrl: string;
  public readonly defaultModel?: string;
  public readonly defaultParams?: GenerateOptions["params"];
  private readonly apiKey: string;

  constructor(cfg: {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    defaultParams?: GenerateOptions["params"];
  }) {
    if (!cfg?.apiKey) throw new Error("OPENROUTER_API_KEY is required");
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
    this.defaultModel = cfg.defaultModel;
    this.defaultParams = cfg.defaultParams;
  }

  withDefaults(partial: { model?: string; params?: GenerateOptions["params"] }) {
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

  private _buildPayload(options: GenerateOptions) {
    const messages = this._buildMessages(options.system, options.user);
    const model = options.model ?? this.defaultModel;
    if (!model) throw new Error("Model is required");

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

  private _buildMessages(system?: string, userOrMessages?: string | ChatMessage[]) {
    const messages: ChatMessage[] = [];
    if (system) messages.push({ role: "system", content: system });

    if (Array.isArray(userOrMessages)) {
      return [...messages, ...userOrMessages];
    }
    if (typeof userOrMessages === "string") {
      messages.push({ role: "user", content: userOrMessages });
    }
    return messages;
  }

  private async _request(path: string, payload: Record<string, unknown>) {
    const url = `${this.baseUrl}${path}`;

    const doFetch = () =>
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://coinect.app", // opcjonalny nagłówek rekomendowany przez OpenRouter
          "X-Title": "Coinect",
        },
        body: JSON.stringify(payload),
      });

    let attempt = 0;
    const maxAttempts = 3;
    while (true) {
      const res = await doFetch();
      if (res.ok) return res.json();

      if (res.status === 401) throw new Error("OpenRouterAuthError: unauthorized");
      if (res.status === 400) throw new Error(`OpenRouterRequestError: ${await res.text()}`);

      // retry dla 429/5xx
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (++attempt >= maxAttempts) throw new Error(`OpenRouterServerError: ${res.status}`);
        const backoffMs = Math.min(1000 * 2 ** attempt + Math.random() * 200, 8000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      throw new Error(`OpenRouterUnexpectedError: ${res.status}`);
    }
  }

  private _parse<T>(apiResponse: any, expectsJson: boolean): GenerateResult<T> {
    const choice = apiResponse?.choices?.[0];
    const usage = apiResponse?.usage;
    const model = apiResponse?.model;
    const finish = choice?.finish_reason;

    if (!choice) throw new Error("Empty choices in response");

    if (expectsJson) {
      // OpenRouter z response_format zwraca JSON w treści odpowiedzi modelu
      const raw = choice?.message?.content;
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return { content: parsed as T, usage, model, finish_reason: finish };
      } catch {
        throw new Error("ResponseParsingError: invalid JSON");
      }
    }

    return { content: choice?.message?.content as string, usage, model, finish_reason: finish };
  }
}
```

#### Krok 6: Przykład API Route w Astro

```ts
// src/pages/api/ai/summarize.ts
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";

export const POST: APIRoute = async ({ request }) => {
  const { text } = await request.json();
  if (!text) return new Response(JSON.stringify({ error: "text is required" }), { status: 400 });

  const client = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: "anthropic/claude-3.5-sonnet",
    defaultParams: { temperature: 0.5, max_tokens: 400 },
  });

  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "text_summary",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          keywords: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
        },
        required: ["summary", "keywords", "sentiment"],
      },
    },
  } as const;

  try {
    const result = await client.generate<{ summary: string; keywords: string[]; sentiment: string }>({
      system: "Jesteś ekspertem od podsumowań. Zwracaj wyłącznie JSON.",
      user: `Podsumuj: ${text}`,
      responseFormat,
    });

    return new Response(JSON.stringify(result.content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500 });
  }
};
```

---

### Uzupełniające przykłady użycia elementów OpenRouter

1. System message: `system: 'Jesteś surowym walidatorem JSON. Odrzucaj wolne odpowiedzi.'`
2. User message: `user: 'Wygeneruj plan dnia dla junior developera.'`
3. response_format (JSON Schema): patrz sekcja „Krok 4”.
4. Nazwa modelu: `model: 'openai/gpt-4o-mini'` lub globalnie przez `defaultModel`.
5. Parametry modelu: `params: { temperature: 0.2, max_tokens: 300 }`.
