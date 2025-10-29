# Migracja: Wymagana autentykacja dla wszystkich endpointów API

## Data: 2025-10-13

## Opis zmian

Usunięto fallback do `DEFAULT_USER_ID` ze wszystkich endpointów API. Wszystkie chronione endpointy teraz wymagają autentykacji i zwracają błąd 401 dla nieautoryzowanych żądań.

## Zaktualizowane pliki

### 1. Endpointy klientów

- `src/pages/api/clients/index.ts` (GET, POST)
- `src/pages/api/clients/[id].ts` (PUT, DELETE)

### 2. Endpointy wpisów czasu pracy

- `src/pages/api/time-entries/index.ts` (GET, POST)
- `src/pages/api/time-entries/[id].ts` (PUT, DELETE)

### 3. Endpointy AI

- `src/pages/api/ai/summarize.ts` (POST)
- `src/pages/api/ai/analyze.ts` (POST)

### 4. Usunięto stałą

- `src/db/supabase.client.ts` - usunięto eksport `DEFAULT_USER_ID`

## Endpointy publiczne (bez zmian)

Następujące endpointy pozostają publiczne i nie wymagają autentykacji:

- `POST /api/auth/login` - logowanie
- `POST /api/auth/register` - rejestracja
- `POST /api/auth/forgot-password` - resetowanie hasła
- `POST /api/auth/logout` - wylogowanie

## Zachowanie po zmianach

### Przed zmianą

```typescript
// Fallback do DEFAULT_USER_ID
if (authError || !user) {
  userId = DEFAULT_USER_ID;
} else {
  userId = user.id;
}
```

### Po zmianie

```typescript
// Wymagana autentykacja
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

const userId = user.id;
```

## Kody błędów

### HTTP 401 Unauthorized

Zwracany gdy:

- Brak tokenu autentykacji w ciasteczkach
- Token wygasł
- Token jest nieprawidłowy

Odpowiedź:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagana autentykacja"
  }
}
```

## Wpływ na frontend

Frontend musi obsługiwać błąd 401 i przekierować użytkownika do strony logowania:

```typescript
// Przykład w React Query
const { data, error } = useQuery({
  queryKey: ["clients"],
  queryFn: async () => {
    const res = await fetch("/api/clients");
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    return res.json();
  },
});
```

## Testowanie

### Test autoryzacji

```bash
# Bez autentykacji - powinno zwrócić 401
curl -X GET http://localhost:4321/api/clients

# Z autentykacją - powinno zwrócić dane
curl -X GET http://localhost:4321/api/clients \
  -H "Cookie: sb-access-token=..."
```

### Test endpointów

```bash
# Klienci
curl -X GET http://localhost:4321/api/clients
curl -X POST http://localhost:4321/api/clients -d '{...}'
curl -X PUT http://localhost:4321/api/clients/[id] -d '{...}'
curl -X DELETE http://localhost:4321/api/clients/[id]

# Wpisy czasu
curl -X GET http://localhost:4321/api/time-entries
curl -X POST http://localhost:4321/api/time-entries -d '{...}'
curl -X PUT http://localhost:4321/api/time-entries/[id] -d '{...}'
curl -X DELETE http://localhost:4321/api/time-entries/[id]

# AI
curl -X POST http://localhost:4321/api/ai/summarize -d '{...}'
curl -X POST http://localhost:4321/api/ai/analyze -d '{...}'
```

## Zalecenia

1. **Monitorowanie** - śledzić liczbę błędów 401, aby wykryć potencjalne problemy z sesją
2. **Refresh token** - upewnić się, że mechanizm odświeżania tokenów działa poprawnie
3. **Timeout sesji** - informować użytkownika o wygaśnięciu sesji
4. **Graceful degradation** - zapisać stan formularza przed przekierowaniem do logowania

## Breaking Changes

⚠️ **UWAGA**: To jest breaking change dla wszystkich klientów API

- Wszystkie zapytania bez autentykacji będą odrzucane z kodem 401
- Nie ma już fallbacku do użytkownika testowego
- Testy integracyjne muszą zostać zaktualizowane o poprawną autentykację

## Rollback

W razie potrzeby rollbacku, przywróć `DEFAULT_USER_ID` i logikę fallback:

```bash
git revert <commit-hash>
```

## Następne kroki

1. ✅ Usunięto DEFAULT_USER_ID z endpointów
2. ✅ Dodano sprawdzanie autentykacji
3. 🔲 Zaktualizować testy integracyjne
4. 🔲 Zaktualizować dokumentację API
5. 🔲 Dodać middleware do automatycznej obsługi 401 na frontendzie
