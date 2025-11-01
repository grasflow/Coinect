# Plan Implementacji API: Create Time Entry

## 1. Przegląd punktu końcowego

**Endpoint:** `POST /api/time-entries`  
**Provider:** Custom Astro API

Punkt końcowy służy do tworzenia nowego wpisu czasu pracy dla zalogowanego użytkownika. Umożliwia przypisanie wpisu do konkretnego klienta, określenie liczby godzin, stawki godzinowej, waluty oraz opcjonalnych opisów. Endpoint automatycznie synchronizuje dane do tabeli `ai_insights_data` przez trigger bazodanowy (gdy `private_note` jest wypełnione).

**Główne funkcjonalności:**

- Tworzenie wpisu czasu z walidacją danych
- Dziedziczenie domyślnych wartości (stawka, waluta) z klienta
- Automatyczna synchronizacja do AI insights przez trigger
- Zabezpieczenie przez RLS na poziomie bazy danych

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

```
/api/time-entries
```

### Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Parametry

**Wymagane:**

- `client_id` (string, UUID) - Identyfikator klienta, dla którego wykonano pracę
- `date` (string, YYYY-MM-DD) - Data wykonania pracy
- `hours` (number) - Liczba przepracowanych godzin (> 0, max 999.99)

**Opcjonalne:**

- `hourly_rate` (number) - Stawka godzinowa (≥ 0). Jeśli nie podano, używana jest `default_hourly_rate` klienta
- `currency` (string) - Waluta stawki (PLN/EUR/USD). Jeśli nie podano, używana jest `default_currency` klienta
- `public_description` (string) - Opis publiczny, widoczny na fakturze
- `private_note` (string) - Notatka prywatna, używana do analizy AI (nie pojawia się na fakturach)

### Request Body (przykład)

```json
{
  "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-01-15",
  "hours": 8.0,
  "hourly_rate": 150.0,
  "currency": "PLN",
  "public_description": "Backend development",
  "private_note": "Lots of scope changes, client was unprepared"
}
```

---

## 3. Wykorzystywane typy

### Request

```typescript
// src/types.ts
export type CreateTimeEntryCommand = {
  client_id: string;
  date: string;
  hours: number;
  hourly_rate?: number;
  currency?: Currency;
  public_description?: string;
  private_note?: string;
};
```

### Response

```typescript
// src/types.ts
export type CreateTimeEntryResponse = TimeEntry;

export type TimeEntry = Tables<"time_entries">; // z database.types.ts
```

### Validation Schema (do utworzenia)

```typescript
// src/lib/validation/time-entry.schema.ts
import { z } from "zod";

export const createTimeEntrySchema = z.object({
  client_id: z.string().uuid("Invalid client ID format"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  hours: z.number().positive("Hours must be greater than 0").max(999.99, "Hours cannot exceed 999.99"),
  hourly_rate: z.number().nonnegative("Hourly rate cannot be negative").optional(),
  currency: z.enum(["PLN", "EUR", "USD"]).optional(),
  public_description: z.string().max(5000).optional(),
  private_note: z.string().max(5000).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});
```

---

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "client_id": "uuid",
  "date": "2025-01-15",
  "hours": "8.00",
  "hourly_rate": "150.00",
  "currency": "PLN",
  "public_description": "Backend development",
  "private_note": "Lots of scope changes",
  "invoice_id": null,
  "deleted_at": null,
  "created_at": "2025-01-15T18:00:00Z",
  "updated_at": "2025-01-15T18:00:00Z"
}
```

### Error Responses

**400 Bad Request**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data provided",
    "details": {
      "field": "hours",
      "issue": "Hours must be greater than 0"
    }
  }
}
```

**401 Unauthorized**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

**403 Forbidden**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Client belongs to different user"
  }
}
```

**404 Not Found**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Client not found"
  }
}
```

**500 Internal Server Error**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create time entry"
  }
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
1. Request → API Endpoint
   ↓
2. Middleware → Verify JWT Token (Astro.locals.supabase.auth.getUser())
   ↓
3. Endpoint → Parse & Validate Request Body (Zod schema)
   ↓
4. Service Layer → TimeEntryService.createTimeEntry()
   ↓
5. Service → Validate client ownership & get defaults
   ↓ (Query: SELECT from clients WHERE id = ? AND user_id = ?)
   ↓
6. Service → Insert time entry
   ↓ (INSERT INTO time_entries)
   ↓
7. Database Trigger → Auto-sync to ai_insights_data (if private_note exists)
   ↓
8. Service → Fetch created entry
   ↓
9. Response → Return 201 with created entry
```

### Interakcje z bazą danych

**Tabele zaangażowane:**

- `clients` (SELECT) - weryfikacja i pobieranie domyślnych wartości
- `time_entries` (INSERT) - tworzenie wpisu
- `ai_insights_data` (INSERT/UPDATE przez trigger) - automatyczna synchronizacja

**Triggery wywołane:**

- `sync_time_entries_to_ai_insights` - automatycznie wywołany po INSERT na `time_entries`

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- **Metoda:** JWT Bearer token dostarczany przez Supabase Auth
- **Weryfikacja:** W middleware Astro przez `context.locals.supabase.auth.getUser()`
- **Brak tokenu/nieprawidłowy token:** Zwróć 401 Unauthorized

### Autoryzacja

- **RLS (Row-Level Security):** Wszystkie operacje na bazie danych są chronione przez RLS policies
- **Sprawdzenie własności klienta:** Service musi zweryfikować, że `client_id` należy do `auth.uid()`
- **Brak uprawnień:** Zwróć 403 Forbidden

### Walidacja danych wejściowych

- **Zod schema:** Walidacja typu, formatu i zakresu wszystkich parametrów
- **UUID validation:** Sprawdzenie formatu UUID dla `client_id`
- **Date validation:** Sprawdzenie formatu daty i czy jest prawidłowa (nie futurystyczna)
- **Range validation:** `hours` > 0 i ≤ 999.99, `hourly_rate` ≥ 0
- **Enum validation:** `currency` musi być jedną z: PLN, EUR, USD

### Ochrona przed atakami

- **SQL Injection:** Chronione przez Supabase Client (parametryzowane zapytania)
- **XSS:** Sanityzacja `public_description` i `private_note` (escape HTML)
- **CSRF:** Token CSRF w Astro middleware (jeśli włączony)
- **Rate Limiting:** 100 requests/min per user (zgodnie z api-plan.md)

### Audyt i logging

- **Automatyczne timestampy:** `created_at` i `updated_at` ustawiane automatycznie
- **User tracking:** `user_id` automatycznie wypełniane z `auth.uid()`
- **Error logging:** Błędy logowane do systemu monitoringu (np. Sentry)

---

## 7. Obsługa błędów

### Tabela błędów

| Scenariusz                          | Kod statusu | Kod błędu        | Komunikat                               | Akcja                                         |
| ----------------------------------- | ----------- | ---------------- | --------------------------------------- | --------------------------------------------- |
| Brak tokenu                         | 401         | UNAUTHORIZED     | Missing or invalid authentication token | Zwróć błąd z instrukcją zalogowania           |
| Nieprawidłowy token                 | 401         | UNAUTHORIZED     | Invalid authentication token            | Zwróć błąd z instrukcją ponownego zalogowania |
| Brak wymaganych pól                 | 400         | VALIDATION_ERROR | Missing required field: {field}         | Zwróć błąd z listą brakujących pól            |
| Nieprawidłowy format danych         | 400         | VALIDATION_ERROR | Invalid {field}: {reason}               | Zwróć błąd z wyjaśnieniem                     |
| Hours ≤ 0                           | 400         | VALIDATION_ERROR | Hours must be greater than 0            | Zwróć błąd walidacji                          |
| Hours > 999.99                      | 400         | VALIDATION_ERROR | Hours cannot exceed 999.99              | Zwróć błąd walidacji                          |
| Hourly rate < 0                     | 400         | VALIDATION_ERROR | Hourly rate cannot be negative          | Zwróć błąd walidacji                          |
| Nieprawidłowa waluta                | 400         | VALIDATION_ERROR | Currency must be PLN, EUR, or USD       | Zwróć błąd walidacji                          |
| Nieprawidłowy format daty           | 400         | VALIDATION_ERROR | Date must be in YYYY-MM-DD format       | Zwróć błąd walidacji                          |
| Klient nie istnieje                 | 404         | NOT_FOUND        | Client not found                        | Zwróć błąd 404                                |
| Klient należy do innego użytkownika | 403         | FORBIDDEN        | Client belongs to different user        | Zwróć błąd 403                                |
| Błąd bazy danych                    | 500         | INTERNAL_ERROR   | Failed to create time entry             | Loguj błąd, zwróć ogólny komunikat            |
| Błąd triggera                       | 500         | INTERNAL_ERROR   | Database operation failed               | Loguj błąd, zwróć ogólny komunikat            |

### Przykład funkcji obsługi błędów

```typescript
function handleError(error: unknown): Response {
  console.error("TimeEntry creation error:", error);

  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid data provided",
          details: error.errors[0],
        },
      }),
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      }),
      { status: 404 }
    );
  }

  if (error instanceof ForbiddenError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      }),
      { status: 403 }
    );
  }

  // Generic server error
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    }),
    { status: 500 }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Pobieranie domyślnych wartości klienta:** Dodatkowe zapytanie SELECT
   - **Optymalizacja:** Użyj indeksu `idx_clients_user_id`, zapytanie jest szybkie

2. **Zwracanie utworzonego wpisu:** Wymaga dodatkowego SELECT
   - **Optymalizacja:** Użyj `select` z relacjami Supabase zamiast osobnych zapytań

### Strategie optymalizacji

1. **Indeksy bazodanowe:**
   - Upewnij się, że istnieje indeks: `idx_clients_user_id`
   - Sprawdź wydajność przez `EXPLAIN ANALYZE`

2. **Caching domyślnych wartości klienta:**
   - Rozważ cache w Redis dla często używanych klientów (post-MVP)

3. **Connection pooling:**
   - Supabase automatycznie używa connection pooling
   - Upewnij się, że nie tworzysz nowych połączeń w pętli

4. **Error-first approach:**
   - Najpierw waliduj wszystkie dane (fail fast)
   - Dopiero później wykonuj operacje bazodanowe

### Monitoring wydajności

- **Response time target:** < 200ms dla 95% requestów
- **Metryki do śledzenia:**
  - Czas walidacji
  - Czas zapytań do bazy
  - Czas wykonania triggerów
  - Całkowity response time
- **Alerting:** Alert jeśli median response time > 500ms

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

**Plik:** `src/lib/validation/time-entry.schema.ts`

```typescript
import { z } from "zod";

export const createTimeEntrySchema = z.object({
  client_id: z.string().uuid("Invalid client ID format"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  hours: z.number().positive("Hours must be greater than 0").max(999.99, "Hours cannot exceed 999.99"),
  hourly_rate: z.number().nonnegative("Hourly rate cannot be negative").optional(),
  currency: z.enum(["PLN", "EUR", "USD"]).optional(),
  public_description: z.string().max(5000).optional(),
  private_note: z.string().max(5000).optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
```

### Krok 2: Utworzenie serwisu

**Plik:** `src/lib/services/time-entry.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateTimeEntryCommand, CreateTimeEntryResponse } from "@/types";

export class TimeEntryService {
  constructor(private supabase: SupabaseClient) {}

  async createTimeEntry(userId: string, command: CreateTimeEntryCommand): Promise<CreateTimeEntryResponse> {
    // 1. Pobierz i zweryfikuj klienta
    const client = await this.getAndValidateClient(command.client_id, userId);

    // 2. Przygotuj dane wpisu (z domyślnymi wartościami)
    const entryData = {
      user_id: userId,
      client_id: command.client_id,
      date: command.date,
      hours: command.hours,
      hourly_rate: command.hourly_rate ?? client.default_hourly_rate,
      currency: command.currency ?? client.default_currency,
      public_description: command.public_description ?? null,
      private_note: command.private_note ?? null,
    };

    // 3. Wstaw wpis czasu
    const { data: timeEntry, error: insertError } = await this.supabase
      .from("time_entries")
      .insert(entryData)
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Zwróć utworzony wpis
    return timeEntry;
  }

  private async getAndValidateClient(clientId: string, userId: string) {
    const { data: client, error } = await this.supabase
      .from("clients")
      .select("id, default_hourly_rate, default_currency")
      .eq("id", clientId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !client) {
      throw new Error("Client not found or does not belong to user");
    }

    return client;
  }
}
```

### Krok 3: Utworzenie custom error classes

**Plik:** `src/lib/errors.ts`

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

### Krok 4: Utworzenie endpointu API

**Plik:** `src/pages/api/time-entries/index.ts`

```typescript
import type { APIRoute } from "astro";
import { createTimeEntrySchema } from "@/lib/validation/time-entry.schema";
import { TimeEntryService } from "@/lib/services/time-entry.service";
import type { CreateTimeEntryCommand } from "@/types";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Uwierzytelnienie
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid authentication token",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse request body
    const body = await context.request.json();

    // 3. Walidacja danych wejściowych
    const validatedData = createTimeEntrySchema.parse(body);

    // 4. Wywołanie serwisu
    const service = new TimeEntryService(context.locals.supabase);
    const result = await service.createTimeEntry(user.id, validatedData);

    // 5. Zwróć sukces
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TimeEntry creation error:", error);

    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data provided",
            details: error.errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa Not Found
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa Forbidden
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów z message (np. z serwisu)
    if (error instanceof Error) {
      // Check if it's a client not found error
      if (error.message.includes("not found") || error.message.includes("does not belong")) {
        return new Response(
          JSON.stringify({
            error: {
              code: error.message.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
              message: error.message,
            },
          }),
          {
            status: error.message.includes("not found") ? 404 : 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Ogólny błąd serwera
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Krok 5: Aktualizacja typu SupabaseClient (jeśli potrzebne)

**Plik:** `src/db/supabase.client.ts`

Upewnij się, że eksportowany jest typ `SupabaseClient`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabaseClient = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export type SupabaseClient = typeof supabaseClient;
```

### Krok 6: Testy jednostkowe serwisu

**Plik:** `src/lib/services/__tests__/time-entry.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TimeEntryService } from "../time-entry.service";

describe("TimeEntryService", () => {
  let service: TimeEntryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      is: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    service = new TimeEntryService(mockSupabase);
  });

  it("should create time entry with client defaults", async () => {
    // Setup mocks
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "client-id",
        default_hourly_rate: 150,
        default_currency: "PLN",
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "entry-id", hours: 8 },
      error: null,
    });

    const result = await service.createTimeEntry("user-id", {
      client_id: "client-id",
      date: "2025-01-15",
      hours: 8,
    });

    expect(result).toBeDefined();
    expect(result.hours).toBe(8);
  });

  it("should throw error if client not found", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    await expect(
      service.createTimeEntry("user-id", {
        client_id: "invalid-id",
        date: "2025-01-15",
        hours: 8,
      })
    ).rejects.toThrow("Client not found");
  });
});
```

### Krok 7: Testy integracyjne endpointu

**Plik:** `src/pages/api/time-entries/__tests__/index.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("POST /api/time-entries", () => {
  it("should return 401 without auth token", async () => {
    const response = await fetch("http://localhost:4321/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "test-id",
        date: "2025-01-15",
        hours: 8,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid data", async () => {
    // Mock auth...
    const response = await fetch("http://localhost:4321/api/time-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token",
      },
      body: JSON.stringify({
        client_id: "test-id",
        date: "2025-01-15",
        hours: -5, // Invalid
      }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });
});
```

### Krok 8: Dokumentacja API

**Plik:** `docs/api/time-entries.md` (opcjonalnie)

Stwórz dokumentację z przykładami użycia dla frontend developers.

### Krok 9: Weryfikacja RLS policies

**Sprawdzenie:** Upewnij się, że polityki RLS są włączone i działają poprawnie:

```sql
-- Test w Supabase SQL Editor
SELECT * FROM time_entries WHERE user_id != auth.uid();
-- Powinno zwrócić 0 rekordów

INSERT INTO time_entries (user_id, client_id, date, hours, hourly_rate, currency)
VALUES ('different-user-id', 'client-id', '2025-01-15', 8, 150, 'PLN');
-- Powinno zakończyć się błędem
```

### Krok 10: Deployment checklist

- [ ] Wszystkie testy przechodzą
- [ ] Linter nie zgłasza błędów
- [ ] RLS policies działają poprawnie
- [ ] Triggery bazodanowe działają
- [ ] Environment variables są ustawione
- [ ] Dokumentacja API jest aktualna
- [ ] Error tracking (Sentry) jest skonfigurowany
- [ ] Rate limiting jest włączony
- [ ] Monitoring wydajności jest skonfigurowany

---

## 10. Checklist przed deployment

### Kod

- [ ] Implementacja zgodna z planem
- [ ] Wszystkie typy TypeScript są poprawne
- [ ] Walidacja Zod jest kompletna
- [ ] Obsługa błędów jest kompleksowa
- [ ] Kod jest sformatowany (prettier/eslint)

### Testy

- [ ] Testy jednostkowe serwisu przechodzą
- [ ] Testy integracyjne endpointu przechodzą
- [ ] Testy E2E dla krytycznych ścieżek
- [ ] Coverage > 80%

### Bezpieczeństwo

- [ ] RLS policies są aktywne i zweryfikowane
- [ ] Uwierzytelnienie działa poprawnie
- [ ] Walidacja ownership dla wszystkich zasobów
- [ ] Input sanitization jest włączona
- [ ] Rate limiting jest skonfigurowany

### Wydajność

- [ ] Indeksy bazodanowe są utworzone
- [ ] Query optimization jest przeprowadzona
- [ ] Response time < 200ms dla 95% requestów
- [ ] Monitoring jest skonfigurowany

### Dokumentacja

- [ ] API dokumentacja jest zaktualizowana
- [ ] Komentarze w kodzie są aktualne
- [ ] README zawiera instrukcje użycia
- [ ] Changelog jest zaktualizowany

---

## 11. Potencjalne rozszerzenia (post-MVP)

1. **Bulk create:** Endpoint do tworzenia wielu wpisów na raz
2. **Templates:** Możliwość tworzenia szablonów wpisów czasu
3. **Auto-suggestions:** AI sugerujące opisy na podstawie historii
4. **Timers:** Integracja z timer'ami do automatycznego trackingu
5. **Mobile offline support:** Synchronizacja offline wpisów
6. **Recurring entries:** Automatyczne tworzenie powtarzających się wpisów
7. **Import from calendar:** Integracja z Google Calendar / Outlook
8. **Voice input:** Tworzenie wpisów przez komendy głosowe

---

## 12. Referencje

- **API Specification:** `.ai/api-plan.md` sekcja 6.3
- **Database Schema:** `.ai/db-plan.md` sekcja 1.4
- **Type Definitions:** `src/types.ts` linie 86-146
- **Supabase RLS:** `.ai/db-plan.md` sekcja 5.4
- **Database Triggers:** `.ai/db-plan.md` sekcja 6.2, 6.3
