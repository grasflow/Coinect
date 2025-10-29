# OpenRouter Service - Dokumentacja użycia

## Podstawowe użycie

### 1. Inicjalizacja serwisu

```typescript
import { OpenRouterService } from "@/lib/services/openrouter.service";

const client = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "anthropic/claude-3.5-sonnet",
  defaultParams: { temperature: 0.5, max_tokens: 800 },
});
```

### 2. Proste generowanie tekstu

```typescript
const result = await client.generate({
  system: "Jesteś pomocnym asystentem.",
  user: "Napisz krótką historię o kocie.",
});

console.log(result.content); // string
```

### 3. Strukturyzowana odpowiedź (JSON Schema)

```typescript
import { createJsonSchema } from "@/lib/services/openrouter.helpers";

const responseFormat = createJsonSchema("story_schema", {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    content: { type: "string" },
    wordCount: { type: "number" },
  },
  required: ["title", "content", "wordCount"],
});

type Story = {
  title: string;
  content: string;
  wordCount: number;
};

const result = await client.generate<Story>({
  system: "Jesteś pisarzem. Zwracasz JSON zgodny ze schematem.",
  user: "Napisz historię o kocie.",
  responseFormat,
});

console.log(result.content.title); // string (typowane)
```

### 4. Użycie gotowych schematów

```typescript
import { createJsonSchema, commonSchemas } from "@/lib/services/openrouter.helpers";

const responseFormat = createJsonSchema("text_summary", commonSchemas.textSummary);

type Summary = {
  summary: string;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
};

const result = await client.generate<Summary>({
  system: "Podsumuj tekst zgodnie ze schematem.",
  user: "Tekst do podsumowania...",
  responseFormat,
});
```

### 5. Zmiana domyślnych parametrów

```typescript
const creativeClient = client.withDefaults({
  model: "openai/gpt-4o",
  params: { temperature: 0.9, max_tokens: 1500 },
});

const result = await creativeClient.generate({
  user: "Napisz kreatywną historię.",
});
```

### 6. Historia konwersacji

```typescript
import type { ChatMessage } from "@/lib/services/openrouter.types";

const messages: ChatMessage[] = [
  { role: "user", content: "Jak masz na imię?" },
  { role: "assistant", content: "Nazywam się Claude." },
  { role: "user", content: "Miło cię poznać!" },
];

const result = await client.generate({
  system: "Jesteś pomocnym asystentem.",
  user: messages,
});
```

## Obsługa błędów

```typescript
import {
  OpenRouterAuthError,
  OpenRouterRequestError,
  OpenRouterServerError,
  ResponseParsingError,
} from "@/lib/services/openrouter.errors";

try {
  const result = await client.generate({
    user: "Test prompt",
  });
} catch (error) {
  if (error instanceof OpenRouterAuthError) {
    console.error("Błąd autoryzacji - sprawdź API key");
  } else if (error instanceof OpenRouterRequestError) {
    console.error("Błędne żądanie:", error.details);
  } else if (error instanceof OpenRouterServerError) {
    console.error("Błąd serwera:", error.statusCode);
  } else if (error instanceof ResponseParsingError) {
    console.error("Błąd parsowania JSON");
  }
}
```

## Przykłady w API Routes

### Endpoint z walidacją

```typescript
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "text is required" }), { status: 400 });
    }

    if (text.length > 10000) {
      return new Response(JSON.stringify({ error: "text too long" }), { status: 400 });
    }

    const client = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      defaultModel: "anthropic/claude-3.5-sonnet",
    });

    const result = await client.generate({
      system: "Pomóż użytkownikowi.",
      user: text,
    });

    return new Response(JSON.stringify(result.content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
```

## Dostępne modele

```typescript
import { commonModels } from "@/lib/services/openrouter.helpers";

// Użyj predefiniowanych modeli:
commonModels.claude35Sonnet; // "anthropic/claude-3.5-sonnet"
commonModels.claude3Haiku; // "anthropic/claude-3-haiku"
commonModels.gpt4oMini; // "openai/gpt-4o-mini"
commonModels.gpt4o; // "openai/gpt-4o"
commonModels.auto; // "openrouter/auto"
```

## Parametry generowania

```typescript
import { commonParams } from "@/lib/services/openrouter.helpers";

// Gotowe zestawy parametrów:
commonParams.creative; // { temperature: 0.9, max_tokens: 1000 }
commonParams.balanced; // { temperature: 0.5, max_tokens: 800 }
commonParams.precise; // { temperature: 0.2, max_tokens: 500 }

// Własne parametry:
const result = await client.generate({
  user: "Prompt",
  params: {
    temperature: 0.7,
    max_tokens: 1200,
    top_p: 0.95,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  },
});
```

## Bezpieczeństwo

⚠️ **Ważne:**

- Nigdy nie używaj `OPENROUTER_API_KEY` po stronie klienta
- Zawsze waliduj dane wejściowe przed wysłaniem do API
- Ustaw limity długości tekstu dla zapobiegania nadużyciom
- Loguj błędy bez wrażliwych danych
- Używaj odpowiednich `max_tokens` dla kontroli kosztów

## Testowanie

Odwiedź `/ai-test` aby przetestować serwis w przeglądarce.
