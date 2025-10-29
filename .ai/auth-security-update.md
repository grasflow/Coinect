# Aktualizacja bezpieczeństwa autentykacji

## Problem

`supabase.auth.getSession()` zwraca dane użytkownika bezpośrednio z cookies/storage bez weryfikacji z serwerem Supabase. Te dane mogą być sfałszowane przez użytkownika, co stanowi lukę bezpieczeństwa.

## Rozwiązanie

Zamieniono wszystkie server-side użycia `getSession()` na bezpieczne `getUser()`, które weryfikuje token z serwerem Supabase.

## Wprowadzone zmiany

### 1. Middleware ([src/middleware/index.ts](src/middleware/index.ts))
- ✅ Zamieniono `getSession()` → `getUser()`
- Middleware teraz bezpiecznie weryfikuje użytkownika przed każdym requestem

### 2. Layout ([src/layouts/Layout.astro](src/layouts/Layout.astro))
- ✅ Zamieniono `getSession()` → `getUser()`
- Layout pobiera ID użytkownika z zweryfikowanego obiektu `user`

### 3. Strony autentykacji
- ✅ [src/pages/login.astro](src/pages/login.astro) - zamieniono `getSession()` → `getUser()`
- ✅ [src/pages/register.astro](src/pages/register.astro) - zamieniono `getSession()` → `getUser()` i odkomentowano kod

### 4. AuthService ([src/lib/services/auth.service.ts](src/lib/services/auth.service.ts))
- ✅ Oznaczono `getSession()` jako `@deprecated` z pełną dokumentacją
- ✅ Zaktualizowano dokumentację `getCurrentUser()` jako bezpieczną metodę
- Metoda `getSession()` zachowana dla kompatybilności wstecznej

### 5. API Endpoints
- ✅ Zweryfikowano, że wszystkie API endpoints już używają `getUser()`
- Endpointy już były bezpieczne

### 6. Wyjątek: ResetPasswordForm.tsx
- ⚠️ [src/components/features/auth/ResetPasswordForm.tsx](src/components/features/auth/ResetPasswordForm.tsx:25) - pozostawiono `getSession()`
- Dodano komentarz wyjaśniający wyjątek
- To jest flow recovery - recovery session jest tymczasowa i weryfikowana przez Supabase
- W tym kontekście użycie `getSession()` jest bezpieczne

## Różnice między metodami

### ❌ getSession()
- Tylko odczytuje dane z cookies
- Dane mogą być sfałszowane
- **NIE** weryfikuje z serwerem
- Używaj tylko dla client-side recovery flow

### ✅ getUser()
- Weryfikuje token z serwerem Supabase
- Bezpieczne dla server-side
- Chroni przed sfałszowanymi danymi
- **ZAWSZE** używaj dla weryfikacji użytkownika

## Testy

Po wprowadzeniu zmian należy przetestować:

1. ✓ Logowanie użytkownika
2. ✓ Rejestracja nowego użytkownika
3. ✓ Dostęp do chronionych stron
4. ✓ Przekierowania middleware
5. ✓ Reset hasła (recovery flow)
6. ✓ API endpoints z uwierzytelnieniem

## Rekomendacje na przyszłość

1. **Nigdy nie używaj `getSession()` po stronie serwera** (Astro pages, API endpoints, middleware)
2. **Zawsze używaj `getUser()`** do weryfikacji tożsamości użytkownika
3. **Jedyny wyjątek**: client-side recovery flows w komponentach React
4. Przy dodawaniu nowych features z autentykacją, używaj `getUser()`

## Migracja dla deweloperów

Jeśli dodajesz nowy kod:

```typescript
// ❌ NIE RÓB TEGO (server-side)
const { data: { session } } = await supabase.auth.getSession()
const user = session?.user

// ✅ RÓB TO (server-side)
const { data: { user } } = await supabase.auth.getUser()
```

## Status

✅ **UKOŃCZONE** - Wszystkie server-side użycia `getSession()` zostały zamienione na `getUser()`

- Middleware: ✅
- Layout: ✅
- Login page: ✅
- Register page: ✅
- API endpoints: ✅ (już były bezpieczne)
- AuthService: ✅ (deprecated z dokumentacją)
- Client-side exceptions: ✅ (udokumentowane)
