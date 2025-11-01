# Dokumentacja Endpointa: Create Time Entry

## Endpoint

```
POST /api/time-entries
```

## Uwierzytelnienie

Wymagany Bearer token w nagłówku `Authorization`:

```
Authorization: Bearer {access_token}
```

## Request Body

### Wymagane pola:

- `client_id` (string, UUID) - ID klienta
- `date` (string, YYYY-MM-DD) - Data pracy
- `hours` (number, 0.01-999.99) - Liczba godzin

### Opcjonalne pola:

- `hourly_rate` (number, ≥ 0) - Stawka godzinowa (domyślnie z klienta)
- `currency` (string, PLN|EUR|USD) - Waluta (domyślnie z klienta)
- `public_description` (string, max 5000 znaków) - Opis publiczny
- `private_note` (string, max 5000 znaków) - Notatka prywatna

### Przykład:

```json
{
  "client_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-01-15",
  "hours": 8.0,
  "hourly_rate": 150.0,
  "currency": "PLN",
  "public_description": "Backend development",
  "private_note": "Client was unprepared"
}
```

## Odpowiedzi

### 201 Created

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
  "private_note": "Client was unprepared",
  "invoice_id": null,
  "deleted_at": null,
  "created_at": "2025-01-15T18:00:00Z",
  "updated_at": "2025-01-15T18:00:00Z"
}
```

### 400 Bad Request - Błąd walidacji

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data provided",
    "details": {
      "message": "Hours must be greater than 0"
    }
  }
}
```

### 401 Unauthorized - Brak autoryzacji

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### 403 Forbidden - Brak uprawnień

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Client does not belong to user"
  }
}
```

### 404 Not Found - Klient nie istnieje

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Client not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Logika Biznesowa

1. **Walidacja użytkownika** - Weryfikacja JWT tokena
2. **Walidacja danych** - Sprawdzenie wszystkich parametrów przez Zod
3. **Weryfikacja klienta** - Sprawdzenie czy klient należy do użytkownika
4. **Dziedziczenie wartości** - Pobieranie `default_hourly_rate` i `default_currency` z klienta (jeśli nie podano)
5. **Tworzenie wpisu** - INSERT do `time_entries`
6. **Trigger AI insights** - Automatyczna synchronizacja (jeśli `private_note` wypełnione)
7. **Zwrot danych** - Pobranie utworzonego wpisu

## Zabezpieczenia

- **RLS (Row-Level Security)** - Włączone na wszystkich tabelach
- **Walidacja własności** - Sprawdzenie `user_id` dla klienta
- **Parametryzowane zapytania** - Ochrona przed SQL injection
- **Walidacja typów** - Zod schema dla wszystkich parametrów

## Pliki

- **Endpoint**: `src/pages/api/time-entries/index.ts`
- **Serwis**: `src/lib/services/time-entry.service.ts`
- **Walidacja**: `src/lib/validation/time-entry.schema.ts`
- **Błędy**: `src/lib/errors.ts`
- **Typy**: `src/types.ts` (linie 108-127)
