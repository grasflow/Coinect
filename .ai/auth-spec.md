# Specyfikacja techniczna modułu autentykacji - Coinect

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Strony publiczne (niezalogowani użytkownicy)

#### 1.1.1. Strona logowania - `/login`

**Plik**: `src/pages/login.astro`

**Opis**: Strona server-side renderowana (SSR) w Astro zawierająca formularz logowania. Obsługuje renderowanie po stronie serwera w celu walidacji sesji - jeśli użytkownik jest już zalogowany, następuje przekierowanie do `/time-entries`.

**Struktura**:

- Layout: Dedykowany `AuthLayout.astro` bez nawigacji głównej aplikacji
- Komponent formularza: `LoginForm.tsx` (React, client-side)
- Logo aplikacji na górze strony
- Link do strony rejestracji
- Link do odzyskiwania hasła

**Komponent LoginForm.tsx**:

```
Lokalizacja: src/components/features/auth/LoginForm.tsx
Typ: React Client Component
Client directive: client:load

Pola formularza:
- email (type="email", required, walidacja formatu email)
- password (type="password", required, min 8 znaków)
- Przycisk "Zaloguj się" (type="submit")

Walidacja:
- Email: format email (pattern validation)
- Hasło: minimum 8 znaków
- Wyświetlanie błędów inline pod polami

Obsługa submitowania:
- POST do endpointu `/api/auth/login`
- Body: { email: string, password: string }
- Loading state podczas wysyłania
- Obsługa błędów z API (nieprawidłowe dane, błędy sieciowe)
- Przekierowanie na `/time-entries` po sukcesie

Komunikaty błędów:
- "Nieprawidłowy format adresu email"
- "Hasło musi zawierać minimum 8 znaków"
- "Nieprawidłowy email lub hasło" (z API)
- "Wystąpił błąd. Spróbuj ponownie" (błędy sieciowe)
```

**Server-side logic w login.astro**:

```typescript
// Sprawdzenie czy użytkownik jest już zalogowany
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/time-entries");
}
```

---

#### 1.1.2. Strona rejestracji - `/register`

**Plik**: `src/pages/register.astro`

**Opis**: Strona SSR w Astro z formularzem rejestracji nowego użytkownika. Waliduje sesję i przekierowuje zalogowanych użytkowników.

**Struktura**:

- Layout: `AuthLayout.astro`
- Komponent formularza: `RegisterForm.tsx` (React, client-side)
- Logo aplikacji
- Link do strony logowania

**Komponent RegisterForm.tsx**:

```
Lokalizacja: src/components/features/auth/RegisterForm.tsx
Typ: React Client Component
Client directive: client:load

Pola formularza:
- full_name (type="text", required)
- email (type="email", required)
- password (type="password", required, min 8 znaków, zawiera literę i cyfrę)
- password_confirm (type="password", required, musi być identyczne z password)
- tax_id (type="text", optional, 10 cyfr)
- address (opcjonalne pola: street, city, postal_code)

Walidacja:
- Imię i nazwisko: wymagane, min 2 znaki
- Email: format email
- Hasło: min 8 znaków, conajmniej jedna litera, conajmniej jedna cyfra
- Potwierdzenie hasła: identyczne z hasłem
- NIP: 10 cyfr (jeśli wypełnione)
- Walidacja real-time na onChange

Obsługa submitowania:
- POST do `/api/auth/register`
- Body: { full_name, email, password, tax_id?, street?, city?, postal_code? }
- Loading state
- Obsługa błędów (email już istnieje, błędy walidacji)
- Automatyczne logowanie i przekierowanie na `/time-entries` po sukcesie
- Uruchomienie onboardingu

Komunikaty błędów:
- "Imię i nazwisko jest wymagane"
- "Nieprawidłowy format adresu email"
- "Hasło musi zawierać minimum 8 znaków, literę i cyfrę"
- "Hasła muszą być identyczne"
- "NIP musi składać się z 10 cyfr"
- "Email jest już zajęty" (z API)
- "Wystąpił błąd rejestracji. Spróbuj ponownie"
```

**Server-side logic w register.astro**:

```typescript
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/time-entries");
}
```

---

#### 1.1.3. Strona odzyskiwania hasła - `/forgot-password`

**Plik**: `src/pages/forgot-password.astro`

**Opis**: Strona SSR umożliwiająca zresetowanie hasła przez wysłanie linku resetującego na email.

**Struktura**:

- Layout: `AuthLayout.astro`
- Komponent: `ForgotPasswordForm.tsx`
- Logo aplikacji
- Link powrotny do logowania

**Komponent ForgotPasswordForm.tsx**:

```
Lokalizacja: src/components/features/auth/ForgotPasswordForm.tsx
Typ: React Client Component
Client directive: client:load

Pola formularza:
- email (type="email", required)

Walidacja:
- Email: format email

Obsługa submitowania:
- POST do `/api/auth/forgot-password`
- Body: { email: string }
- Wyświetlenie komunikatu sukcesu po wysłaniu (niezależnie czy email istnieje w bazie)
- "Link do resetowania hasła został wysłany na podany adres email"

Komunikaty:
- "Nieprawidłowy format adresu email"
- "Link został wysłany. Sprawdź swoją skrzynkę email"
- "Wystąpił błąd. Spróbuj ponownie"
```

---

#### 1.1.4. Strona resetowania hasła - `/reset-password`

**Plik**: `src/pages/reset-password.astro`

**Opis**: Strona SSR do ustawienia nowego hasła. Dostępna tylko przez link z emaila (z tokenem w URL).

**Struktura**:

- Layout: `AuthLayout.astro`
- Komponent: `ResetPasswordForm.tsx`
- Walidacja tokenu po stronie serwera

**Komponent ResetPasswordForm.tsx**:

```
Lokalizacja: src/components/features/auth/ResetPasswordForm.tsx
Typ: React Client Component
Client directive: client:load

Props:
- token: string (z query params)

Pola formularza:
- password (type="password", required, min 8 znaków, litera + cyfra)
- password_confirm (type="password", required)

Walidacja:
- Hasło: min 8 znaków, litera i cyfra
- Potwierdzenie: identyczne z hasłem

Obsługa submitowania:
- POST do `/api/auth/reset-password`
- Body: { token: string, password: string }
- Przekierowanie na `/login` z komunikatem sukcesu

Komunikaty:
- "Hasło musi zawierać minimum 8 znaków, literę i cyfrę"
- "Hasła muszą być identyczne"
- "Hasło zostało zmienione. Możesz się teraz zalogować"
- "Link resetujący wygasł lub jest nieprawidłowy"
```

**Server-side logic w reset-password.astro**:

```typescript
// Sprawdzenie czy token istnieje w URL
const token = Astro.url.searchParams.get("token");
if (!token) {
  return Astro.redirect("/forgot-password");
}

// Opcjonalnie: walidacja tokenu z Supabase
const { error } = await Astro.locals.supabase.auth.verifyOtp({
  token_hash: token,
  type: "recovery",
});
if (error) {
  // Redirect lub wyświetlenie błędu
}
```

---

### 1.2. Strony chronione (zalogowani użytkownicy)

#### 1.2.1. Główny Layout - `Layout.astro` (zmodyfikowany)

**Plik**: `src/layouts/Layout.astro`

**Modyfikacje**:

- Sprawdzenie sesji po stronie serwera w każdym renderze
- Przekierowanie niezalogowanych użytkowników na `/login`
- Dodanie przycisku "Wyloguj" w nawigacji (prawy górny róg)
- Wyświetlanie emaila/imienia użytkownika w nawigacji

**Server-side logic**:

```typescript
// Na początku pliku Layout.astro
const {
  data: { session },
  error,
} = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/login");
}

// Pobranie danych użytkownika
const { data: profile } = await Astro.locals.supabase
  .from("profiles")
  .select("full_name, email")
  .eq("id", session.user.id)
  .single();
```

**Zmiany w nawigacji**:

```
Prawy górny róg:
- Wyświetlanie: {profile?.full_name || profile?.email}
- Dropdown/menu z opcjami:
  - Ustawienia (link do /settings)
  - Wyloguj (formularz POST do /api/auth/logout)
```

**Komponent UserMenu.tsx**:

```
Lokalizacja: src/components/features/auth/UserMenu.tsx
Typ: React Client Component
Client directive: client:load

Props:
- userName: string
- userEmail: string

Struktura:
- Dropdown button z ikoną użytkownika i nazwą
- Menu rozwijane:
  - Link: "Ustawienia" → /settings
  - Separator
  - Button: "Wyloguj" → wywołanie handleLogout()

Funkcja handleLogout:
- POST do /api/auth/logout
- Przekierowanie na /login po sukcesie
```

---

#### 1.2.2. Istniejące strony - zabezpieczenie

Wszystkie istniejące chronione strony wymagają modyfikacji:

**Lista stron do zabezpieczenia**:

- `/time-entries` (już istnieje jako redirect z `/`)
- `/clients`
- `/invoices` (gdy zostanie zaimplementowana)
- `/settings` (gdy zostanie zaimplementowana)

**Wspólna logika zabezpieczenia** (dodana w `Layout.astro`):

```typescript
// W każdej chronionej stronie używającej Layout.astro
// automatycznie następuje sprawdzenie sesji i przekierowanie
```

**Alternatywnie - middleware** (preferowane):
Wykorzystanie `src/middleware/index.ts` do globalnego sprawdzania sesji.

---

### 1.3. Layout dla stron autentykacji

#### 1.3.1. AuthLayout.astro

**Plik**: `src/layouts/AuthLayout.astro`

**Opis**: Dedykowany layout dla stron logowania, rejestracji i odzyskiwania hasła.

**Struktura**:

```astro
---
interface Props {
  title?: string;
}

const { title = "Coinect - Logowanie" } = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body class="bg-gray-50">
    <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <a href="/">
          <h1 class="text-center text-3xl font-bold text-gray-900">Coinect</h1>
        </a>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <slot />
        </div>
      </div>
    </div>
  </body>
</html>
```

**Cechy**:

- Minimalistyczny design (bez głównej nawigacji)
- Centrowanie formularza na ekranie
- Responsywność (mobile-first)
- Spójny branding (logo Coinect)

---

### 1.4. Komponenty współdzielone

#### 1.4.1. FormField Component

**Plik**: `src/components/ui/form-field.tsx` (już istnieje, do wykorzystania)

Komponent wykorzystywany we wszystkich formularzach autentykacji.

---

#### 1.4.2. PasswordInput Component

**Plik**: `src/components/features/auth/PasswordInput.tsx`

**Opis**: Komponent wejścia dla hasła z możliwością pokazania/ukrycia hasła (ikona oka).

```
Props:
- value: string
- onChange: (value: string) => void
- error?: string
- label: string
- id: string
- required?: boolean

Funkcjonalność:
- Toggle visibility (type="password" ↔ type="text")
- Ikona oka po prawej stronie
- Wyświetlanie błędu walidacji pod polem
```

---

### 1.5. Walidacja i komunikaty błędów

#### 1.5.1. Walidacja po stronie klienta

**Lokalizacja logiki**: W każdym komponencie formularza (React state + Zod schema)

**Zasady**:

- Walidacja inline po opuszczeniu pola (onBlur)
- Walidacja na onChange dla pola potwierdzenia hasła
- Wyłączenie przycisku submit podczas błędów walidacji
- Wyświetlanie błędów pod odpowiednimi polami (kolor czerwony)

**Schematy Zod** (nowe):

```
Lokalizacja: src/lib/validation/auth.schema.ts

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi zawierać minimum 8 znaków")
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Imię i nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string()
    .min(8, "Hasło musi zawierać minimum 8 znaków")
    .regex(/[A-Za-z]/, "Hasło musi zawierać literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
  password_confirm: z.string(),
  tax_id: z.string().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr").optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional()
}).refine(data => data.password === data.password_confirm, {
  message: "Hasła muszą być identyczne",
  path: ["password_confirm"]
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email")
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Hasło musi zawierać minimum 8 znaków")
    .regex(/[A-Za-z]/, "Hasło musi zawierać literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
  password_confirm: z.string()
}).refine(data => data.password === data.password_confirm, {
  message: "Hasła muszą być identyczne",
  path: ["password_confirm"]
});
```

---

#### 1.5.2. Komunikaty błędów z API

**Standardowy format odpowiedzi błędu z API**:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message in Polish"
  }
}
```

**Kody błędów autentykacji**:

- `INVALID_CREDENTIALS` - Nieprawidłowy email lub hasło
- `EMAIL_TAKEN` - Email jest już zajęty
- `WEAK_PASSWORD` - Hasło jest za słabe
- `INVALID_TOKEN` - Token resetujący wygasł lub jest nieprawidłowy
- `USER_NOT_FOUND` - Użytkownik nie istnieje
- `INTERNAL_ERROR` - Wystąpił nieoczekiwany błąd

---

### 1.6. Scenariusze użytkownika

#### 1.6.1. Scenariusz: Rejestracja nowego użytkownika

**Kroki**:

1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz rejestracji (imię, email, hasło, potwierdzenie hasła)
3. Opcjonalnie wypełnia NIP i adres
4. Klika "Zarejestruj się"
5. Frontend waliduje dane (Zod schema)
6. POST do `/api/auth/register`
7. Backend tworzy konto w Supabase Auth
8. Backend tworzy profil w tabeli `profiles` (trigger automatyczny)
9. Backend automatycznie loguje użytkownika (zwraca session)
10. Frontend przekierowuje na `/time-entries`
11. Onboarding zostaje uruchomiony (flaga `onboarding_completed = false`)

**Alternatywny przepływ - błąd**:

- Email już istnieje → wyświetlenie błędu "Email jest już zajęty" pod polem email
- Walidacja nie przeszła → wyświetlenie błędów inline
- Błąd serwera → toast z komunikatem "Wystąpił błąd. Spróbuj ponownie"

---

#### 1.6.2. Scenariusz: Logowanie użytkownika

**Kroki**:

1. Użytkownik wchodzi na `/login`
2. Wypełnia email i hasło
3. Klika "Zaloguj się"
4. POST do `/api/auth/login`
5. Backend weryfikuje dane w Supabase Auth
6. Backend zwraca session
7. Frontend ustawia session (cookies/local storage - zarządzane przez Supabase)
8. Przekierowanie na `/time-entries`

**Alternatywny przepływ - błąd**:

- Nieprawidłowe dane → "Nieprawidłowy email lub hasło"
- Błąd serwera → "Wystąpił błąd. Spróbuj ponownie"

---

#### 1.6.3. Scenariusz: Wylogowanie

**Kroki**:

1. Zalogowany użytkownik klika "Wyloguj" w menu
2. POST do `/api/auth/logout`
3. Backend wywołuje `supabase.auth.signOut()`
4. Usunięcie sesji i cookies
5. Przekierowanie na `/login`

---

#### 1.6.4. Scenariusz: Odzyskiwanie hasła

**Kroki**:

1. Użytkownik wchodzi na `/forgot-password`
2. Wpisuje email
3. Klika "Wyślij link resetujący"
4. POST do `/api/auth/forgot-password`
5. Backend wywołuje `supabase.auth.resetPasswordForEmail(email)`
6. Supabase wysyła email z linkiem
7. Wyświetlenie komunikatu "Link został wysłany..."
8. Użytkownik klika link w emailu (zawiera token)
9. Przekierowanie na `/reset-password?token=XXX`
10. Użytkownik wpisuje nowe hasło
11. POST do `/api/auth/reset-password` z tokenem i hasłem
12. Backend wywołuje `supabase.auth.updateUser({ password })`
13. Przekierowanie na `/login` z komunikatem sukcesu

---

## 2. LOGIKA BACKENDOWA

### 2.1. Endpointy API

Wszystkie endpointy autentykacji znajdują się w katalogu `src/pages/api/auth/`.

---

#### 2.1.1. POST /api/auth/register

**Plik**: `src/pages/api/auth/register.ts`

**Opis**: Rejestruje nowego użytkownika w Supabase Auth i tworzy profil.

**Request Body**:

```typescript
{
  full_name: string;
  email: string;
  password: string;
  tax_id?: string;
  street?: string;
  city?: string;
  postal_code?: string;
}
```

**Response (201 Created)**:

```typescript
{
  user: {
    id: string;
    email: string;
    full_name: string;
  }
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
}
```

**Błędy**:

- 400 Bad Request - błędy walidacji (Zod)
- 409 Conflict - email już zajęty
- 500 Internal Error - błąd serwera

**Logika**:

```typescript
import type { APIRoute } from "astro";
import { registerSchema } from "@/lib/validation/auth.schema";
import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Walidacja danych wejściowych
    const body = await context.request.json();
    const validatedData = registerSchema.parse(body);

    // Utworzenie użytkownika przez serwis
    const authService = new AuthService(context.locals.supabase);
    const result = await authService.register(validatedData);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów walidacji, email zajęty, etc.
    // Zwrócenie odpowiedzi z kodem błędu i komunikatem
  }
};
```

---

#### 2.1.2. POST /api/auth/login

**Plik**: `src/pages/api/auth/login.ts`

**Opis**: Loguje użytkownika i zwraca session.

**Request Body**:

```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK)**:

```typescript
{
  user: {
    id: string;
    email: string;
  }
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
}
```

**Błędy**:

- 400 Bad Request - błędy walidacji
- 401 Unauthorized - nieprawidłowe dane logowania
- 500 Internal Error

**Logika**:

```typescript
import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/validation/auth.schema";
import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validatedData = loginSchema.parse(body);

    const authService = new AuthService(context.locals.supabase);
    const result = await authService.login(validatedData.email, validatedData.password);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów
  }
};
```

---

#### 2.1.3. POST /api/auth/logout

**Plik**: `src/pages/api/auth/logout.ts`

**Opis**: Wylogowuje użytkownika i niszczy session.

**Request Body**: brak

**Response (204 No Content)**

**Błędy**:

- 500 Internal Error

**Logika**:

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { error } = await context.locals.supabase.auth.signOut();

    if (error) throw error;

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: "LOGOUT_ERROR",
          message: "Wystąpił błąd podczas wylogowywania",
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

---

#### 2.1.4. POST /api/auth/forgot-password

**Plik**: `src/pages/api/auth/forgot-password.ts`

**Opis**: Wysyła link resetujący hasło na email użytkownika.

**Request Body**:

```typescript
{
  email: string;
}
```

**Response (200 OK)**:

```typescript
{
  message: "Link został wysłany na podany adres email";
}
```

**Uwaga**: Zawsze zwraca sukces, nawet jeśli email nie istnieje (bezpieczeństwo - nie ujawniamy czy email jest w bazie).

**Logika**:

```typescript
import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    await context.locals.supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${context.url.origin}/reset-password`,
    });

    // Zawsze zwracamy sukces (security best practice)
    return new Response(
      JSON.stringify({
        message: "Link został wysłany na podany adres email",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Obsługa błędów
  }
};
```

---

#### 2.1.5. POST /api/auth/reset-password

**Plik**: `src/pages/api/auth/reset-password.ts`

**Opis**: Resetuje hasło użytkownika używając tokenu z emaila.

**Request Body**:

```typescript
{
  token: string;
  password: string;
}
```

**Response (200 OK)**:

```typescript
{
  message: "Hasło zostało zmienione";
}
```

**Błędy**:

- 400 Bad Request - błędy walidacji
- 401 Unauthorized - nieprawidłowy lub wygasły token
- 500 Internal Error

**Logika**:

```typescript
import type { APIRoute } from "astro";
import { resetPasswordSchema } from "@/lib/validation/auth.schema";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Weryfikacja tokenu i update hasła
    const { error } = await context.locals.supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOKEN",
            message: "Link resetujący wygasł lub jest nieprawidłowy",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Obsługa błędów
  }
};
```

---

### 2.2. Serwis autentykacji

#### 2.2.1. AuthService

**Plik**: `src/lib/services/auth.service.ts`

**Opis**: Serwis abstrakcji logiki autentykacji z Supabase Auth. Centralizuje operacje auth i obsługuje błędy.

**Klasa AuthService**:

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import { AuthError } from "@/lib/errors";

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Rejestruje nowego użytkownika
   */
  async register(data: {
    full_name: string;
    email: string;
    password: string;
    tax_id?: string;
    street?: string;
    city?: string;
    postal_code?: string;
  }) {
    // Utworzenie użytkownika w Supabase Auth
    const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (signUpError) {
      // Mapowanie błędów Supabase na nasze błędy
      if (signUpError.message.includes("already registered")) {
        throw new AuthError("EMAIL_TAKEN", "Email jest już zajęty");
      }
      throw new AuthError("SIGNUP_ERROR", signUpError.message);
    }

    if (!authData.user) {
      throw new AuthError("SIGNUP_ERROR", "Nie udało się utworzyć użytkownika");
    }

    // Aktualizacja profilu dodatkowymi danymi
    if (data.tax_id || data.street || data.city || data.postal_code) {
      await this.supabase
        .from("profiles")
        .update({
          tax_id: data.tax_id,
          street: data.street,
          city: data.city,
          postal_code: data.postal_code,
        })
        .eq("id", authData.user.id);
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        full_name: data.full_name,
      },
      session: authData.session,
    };
  }

  /**
   * Loguje użytkownika
   */
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AuthError("INVALID_CREDENTIALS", "Nieprawidłowy email lub hasło");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: data.session,
    };
  }

  /**
   * Wylogowuje użytkownika
   */
  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new AuthError("LOGOUT_ERROR", error.message);
    }
  }

  /**
   * Pobiera aktualną sesję
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      throw new AuthError("SESSION_ERROR", error.message);
    }
    return data.session;
  }

  /**
   * Pobiera aktualnie zalogowanego użytkownika
   */
  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }
}
```

---

### 2.3. Obsługa błędów

#### 2.3.1. Klasa AuthError

**Plik**: `src/lib/errors.ts` (rozszerzenie istniejącego pliku)

**Dodanie nowej klasy błędu**:

```typescript
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
```

**Kody błędów**:

- `EMAIL_TAKEN` - Email już zajęty
- `INVALID_CREDENTIALS` - Nieprawidłowe dane logowania
- `WEAK_PASSWORD` - Za słabe hasło
- `SIGNUP_ERROR` - Błąd rejestracji
- `LOGIN_ERROR` - Błąd logowania
- `LOGOUT_ERROR` - Błąd wylogowania
- `SESSION_ERROR` - Błąd sesji
- `INVALID_TOKEN` - Nieprawidłowy token

---

#### 2.3.2. Wspólny handler błędów w endpointach

**Wzorzec obsługi błędów** (w każdym endpoincie):

```typescript
try {
  // Logika endpointu
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Błędy walidacji",
          details: error.errors,
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (error instanceof AuthError) {
    const statusCode = error.code === "INVALID_CREDENTIALS" ? 401 : 400;
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
        },
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Wystąpił nieoczekiwany błąd",
      },
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

### 2.4. Aktualizacja renderowania server-side

#### 2.4.1. Middleware - globalny guard autentykacji

**Plik**: `src/middleware/index.ts` (aktualizacja)

**Opis**: Rozszerzenie middleware o sprawdzanie sesji i przekierowania dla chronionych i publicznych stron.

**Zaktualizowana logika**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

// Ścieżki publiczne (nie wymagają autentykacji)
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

// Ścieżki auth (tylko dla niezalogowanych)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Dodanie klienta Supabase do context.locals
  context.locals.supabase = supabaseClient;

  // Pobranie sesji
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const pathname = context.url.pathname;

  // Logika przekierowań
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");

  // Jeśli to endpoint API, pomiń middleware (endpointy same zarządzają auth)
  if (isApiRoute) {
    return next();
  }

  // Jeśli użytkownik zalogowany próbuje wejść na stronę auth → redirect na /time-entries
  if (session && isAuthRoute) {
    return context.redirect("/time-entries");
  }

  // Jeśli użytkownik niezalogowany próbuje wejść na chronioną stronę → redirect na /login
  if (!session && !isPublicRoute) {
    return context.redirect("/login");
  }

  // Kontynuuj normalnie
  return next();
});
```

**Uwaga**: Ten middleware automatycznie zabezpiecza wszystkie strony przed dostępem niezalogowanych użytkowników oraz przekierowuje zalogowanych z auth pages.

---

#### 2.4.2. Aktualizacja istniejących endpointów API

**Modyfikacja logiki autentykacji**:

W istniejących endpointach (np. `/api/clients/index.ts`, `/api/time-entries/index.ts`) obecna logika używa `DEFAULT_USER_ID` jako fallback. Po wdrożeniu autentykacji należy to zmienić.

**Przed**:

```typescript
let userId: string;

const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  userId = DEFAULT_USER_ID; // Fallback dla testów
} else {
  userId = user.id;
}
```

**Po wdrożeniu autentykacji** (ścisła weryfikacja):

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Musisz być zalogowany aby wykonać tę akcję",
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

**Uwaga**: Usunięcie `DEFAULT_USER_ID` fallbacka z wszystkich endpointów API po wdrożeniu autentykacji.

---

### 2.5. Dane użytkownika w bazie

#### 2.5.1. Tabela profiles

Tabela `profiles` jest już zdefiniowana w migracji `20251012120100_create_profiles_table.sql`.

**Trigger automatycznego tworzenia profilu**:
Przy rejestracji użytkownika przez Supabase Auth automatycznie tworzony jest rekord w tabeli `profiles` (trigger `on_auth_user_created`).

**Pola profilu wykorzystywane w autentykacji**:

- `id` - UUID użytkownika (równy `auth.users.id`)
- `full_name` - imię i nazwisko (z metadanych przy rejestracji)
- `email` - email użytkownika
- `tax_id`, `street`, `city`, `postal_code` - opcjonalne dane dodawane po rejestracji

---

#### 2.5.2. Row Level Security (RLS)

**Uwaga**: Zgodnie z migracją `20251012121300_disable_all_policies.sql`, RLS został wyłączony na wszystkich tabelach w MVP.

**Post-MVP**: Rozważenie ponownego włączenia RLS dla zwiększenia bezpieczeństwa.

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Wykorzystanie Supabase Auth

Supabase Auth jest systemem autentykacji wbudowanym w Supabase. Zarządza użytkownikami, sesjami, tokenami i operacjami takimi jak reset hasła.

---

#### 3.1.1. Inicjalizacja klienta Supabase

**Plik**: `src/db/supabase.client.ts` (już istnieje)

Klient Supabase jest już zainicjowany w projekcie:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Wykorzystanie w middleware**:
Klient jest dodawany do `context.locals.supabase` w middleware, dzięki czemu jest dostępny we wszystkich routach i endpointach.

---

#### 3.1.2. Sesje użytkowników

**Zarządzanie sesjami**:
Supabase Auth automatycznie zarządza sesjami użytkowników poprzez:

- Cookies (server-side)
- Local Storage (client-side, opcjonalnie)

**Czas życia sesji**:

- Access token: 1 godzina (domyślnie)
- Refresh token: 30 dni (zgodnie z wymaganiem "remember me")

**Automatyczne odświeżanie**:
Supabase automatycznie odświeża access token gdy wygasa, używając refresh token.

---

#### 3.1.3. Kluczowe metody Supabase Auth

**Rejestracja**:

```typescript
supabase.auth.signUp({
  email: string,
  password: string,
  options: {
    data: { full_name: string }, // Metadane użytkownika
  },
});
```

**Logowanie**:

```typescript
supabase.auth.signInWithPassword({
  email: string,
  password: string,
});
```

**Wylogowanie**:

```typescript
supabase.auth.signOut();
```

**Pobieranie sesji**:

```typescript
supabase.auth.getSession();
```

**Pobieranie użytkownika**:

```typescript
supabase.auth.getUser();
```

**Reset hasła (wysłanie emaila)**:

```typescript
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "https://example.com/reset-password",
});
```

**Aktualizacja hasła**:

```typescript
supabase.auth.updateUser({
  password: newPassword,
});
```

---

### 3.2. Konfiguracja Supabase Auth

#### 3.2.1. Zmienne środowiskowe

**Wymagane zmienne** (już istniejące):

- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_KEY` - Klucz anon/public

**Plik**: `.env`

---

#### 3.2.2. Konfiguracja email templates w Supabase

**Panel Supabase → Authentication → Email Templates**

**Szablon "Reset Password"**:

- Temat: "Resetowanie hasła - Coinect"
- Treść: Link z tokenem przekierowujący na `/reset-password?token={{ .Token }}`
- Dostosowanie wyglądu emaila (branding Coinect)

**Szablon "Confirm Signup"** (opcjonalnie):
W MVP nie wymaga się potwierdzenia emaila, ale można włączyć w Supabase:

- Authentication → Settings → Enable email confirmations

---

#### 3.2.3. Redirect URLs w Supabase

**Panel Supabase → Authentication → URL Configuration**

**Dozwolone Redirect URLs**:

- `http://localhost:3000/reset-password` (development)
- `https://twoja-domena.pl/reset-password` (production)

---

### 3.3. Zabezpieczenia

#### 3.3.1. Password hashing

Supabase Auth automatycznie hashuje hasła używając bcrypt. Nie ma potrzeby ręcznej implementacji.

---

#### 3.3.2. HTTPS

Wszystkie połączenia z Supabase używają HTTPS. W produkcji aplikacja również musi działać na HTTPS.

---

#### 3.3.3. Session timeout

**Domyślne ustawienia**:

- Access token: 1h
- Refresh token: 30 dni

Sesja użytkownika wygasa po 30 dniach bez aktywności (zgodnie z wymaganiem).

---

#### 3.3.4. CSRF Protection

Supabase automatycznie zabezpiecza przed atakami CSRF poprzez weryfikację tokenów w cookies.

---

#### 3.3.5. Rate limiting

Supabase ma wbudowany rate limiting dla operacji autentykacji (np. maksymalna liczba prób logowania w jednostce czasu).

**Uwaga**: W produkcji warto dodać dodatkowy rate limiting na poziomie API endpoints (np. przy użyciu middleware).

---

### 3.4. Client-side storage sesji

#### 3.4.1. Cookies vs Local Storage

**Domyślnie**: Supabase używa Local Storage po stronie klienta do przechowywania sesji.

**Dla SSR w Astro**: Zaleca się używanie cookies (server-side accessible).

**Konfiguracja** (opcjonalna):

```typescript
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage, // Custom storage dla SSR
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

**Uwaga**: W MVP można pozostać przy domyślnej konfiguracji (Local Storage). Custom cookie storage można dodać w przyszłości dla lepszej integracji SSR.

---

### 3.5. Integracja z istniejącym kodem

#### 3.5.1. Aktualizacja DEFAULT_USER_ID

**Obecnie**: Kod używa `DEFAULT_USER_ID` jako hardcoded fallback dla testów bez autentykacji.

**Po wdrożeniu autentykacji**:

- Usunięcie `DEFAULT_USER_ID` z `src/db/supabase.client.ts`
- Aktualizacja wszystkich endpointów API aby wymagały autentykacji
- Usunięcie fallbacka `userId = DEFAULT_USER_ID`

**Migracja danych testowych**:
Jeśli w bazie istnieją dane powiązane z `DEFAULT_USER_ID`, należy je:

- Usunąć (jeśli to tylko test data)
- LUB przenieść do prawdziwego użytkownika testowego utworzonego przez Supabase Auth

---

#### 3.5.2. Aktualizacja komponentów React

**Komponenty wymagające update**:

- `ClientsList.tsx` - fetch z autentykacją
- `TimeEntriesList.tsx` - fetch z autentykacją
- `ClientForm.tsx` - POST z autentykacją
- `TimeEntryForm.tsx` - POST z autentykacją

**Wzorzec**: Wszystkie requesty do API automatycznie zawierają session token (zarządzany przez Supabase client), więc komponenty nie wymagają zmian w kodzie fetch. Middleware i endpointy same obsługują autentykację.

---

## 4. PODSUMOWANIE IMPLEMENTACJI

### 4.1. Nowe pliki do utworzenia

**Strony Astro**:

1. `src/pages/login.astro`
2. `src/pages/register.astro`
3. `src/pages/forgot-password.astro`
4. `src/pages/reset-password.astro`

**Layout**: 5. `src/layouts/AuthLayout.astro`

**Komponenty React**: 6. `src/components/features/auth/LoginForm.tsx` 7. `src/components/features/auth/RegisterForm.tsx` 8. `src/components/features/auth/ForgotPasswordForm.tsx` 9. `src/components/features/auth/ResetPasswordForm.tsx` 10. `src/components/features/auth/PasswordInput.tsx` 11. `src/components/features/auth/UserMenu.tsx`

**Endpointy API**: 12. `src/pages/api/auth/register.ts` 13. `src/pages/api/auth/login.ts` 14. `src/pages/api/auth/logout.ts` 15. `src/pages/api/auth/forgot-password.ts` 16. `src/pages/api/auth/reset-password.ts`

**Serwisy**: 17. `src/lib/services/auth.service.ts`

**Walidacja**: 18. `src/lib/validation/auth.schema.ts`

---

### 4.2. Pliki do modyfikacji

1. `src/middleware/index.ts` - dodanie logiki sprawdzania sesji i przekierowań
2. `src/layouts/Layout.astro` - dodanie UserMenu i sprawdzania sesji
3. `src/lib/errors.ts` - dodanie klasy AuthError
4. `src/pages/api/clients/index.ts` - usunięcie DEFAULT_USER_ID fallback
5. `src/pages/api/clients/[id].ts` - usunięcie DEFAULT_USER_ID fallback
6. `src/pages/api/time-entries/index.ts` - usunięcie DEFAULT_USER_ID fallback
7. `src/pages/api/time-entries/[id].ts` - usunięcie DEFAULT_USER_ID fallback
8. `src/db/supabase.client.ts` - usunięcie exportu DEFAULT_USER_ID (po wdrożeniu)

---

### 4.3. Konfiguracja zewnętrzna

**Supabase Dashboard**:

1. Włączenie Email Authentication
2. Konfiguracja Email Templates (Reset Password)
3. Ustawienie Redirect URLs
4. Opcjonalnie: wyłączenie email confirmation dla MVP

**Zmienne środowiskowe**:

- `SUPABASE_URL` (już istnieje)
- `SUPABASE_KEY` (już istnieje)

---

### 4.4. Kolejność implementacji (rekomendacja)

**Faza 1 - Backend i serwisy**:

1. Utworzenie `auth.schema.ts` (walidacja)
2. Rozszerzenie `errors.ts` (AuthError)
3. Utworzenie `auth.service.ts`
4. Utworzenie endpointów API (`/api/auth/*`)

**Faza 2 - Frontend strony auth**: 5. Utworzenie `AuthLayout.astro` 6. Utworzenie komponentów formularzy (`LoginForm.tsx`, `RegisterForm.tsx`, etc.) 7. Utworzenie stron (`login.astro`, `register.astro`, etc.) 8. Komponent `PasswordInput.tsx`

**Faza 3 - Middleware i guards**: 9. Aktualizacja `middleware/index.ts` (przekierowania) 10. Aktualizacja `Layout.astro` (sprawdzanie sesji server-side) 11. Komponent `UserMenu.tsx`

**Faza 4 - Aktualizacja istniejącego kodu**: 12. Usunięcie `DEFAULT_USER_ID` z endpointów API 13. Testy end-to-end całego flow autentykacji

**Faza 5 - Konfiguracja i deploy**: 14. Konfiguracja Supabase Dashboard 15. Testy na środowisku production

---

### 4.5. Metryki sukcesu implementacji

**Kryteria zakończenia**:

- Użytkownik może zarejestrować się i automatycznie zostaje zalogowany
- Użytkownik może zalogować się przy użyciu email i hasła
- Użytkownik może wylogować się z aplikacji
- Użytkownik może zresetować hasło przez email
- Niezalogowani użytkownicy nie mają dostępu do chronionych stron
- Zalogowani użytkownicy nie widzą stron logowania/rejestracji
- Wszystkie endpointy API wymagają autentykacji (brak DEFAULT_USER_ID)
- Sesja użytkownika jest utrzymywana przez 30 dni
- Dane użytkownika (klienci, wpisy czasu, faktury) są izolowane per user

---

### 4.6. Potencjalne ryzyka i mitygacja

**Ryzyko 1**: Utrata danych testowych przy usunięciu DEFAULT_USER_ID

- **Mitygacja**: Backup bazy przed wdrożeniem, migracja danych na prawdziwego użytkownika testowego

**Ryzyko 2**: Problemy z cookies/session w środowisku production

- **Mitygacja**: Testy na środowisku staging, konfiguracja HTTPS, SameSite cookies

**Ryzyko 3**: Rate limiting Supabase Auth w produkcji

- **Mitygacja**: Monitorowanie limitów, dodanie własnego rate limitingu na API

**Ryzyko 4**: Użytkownicy zapominają hasła i nie otrzymują emaili

- **Mitygacja**: Konfiguracja SMTP w Supabase, testy wysyłki emaili, monitorowanie deliverability

**Ryzyko 5**: Błędy walidacji nie są intuicyjne dla użytkowników

- **Mitygacja**: User testing formularzy, dopracowanie komunikatów błędów w języku polskim

---

## 5. ZGODNOŚĆ Z WYMAGANIAMI PRD

### 5.1. Pokrycie User Stories

**US-001: Rejestracja nowego użytkownika** ✅

- Formularz z polami: email, hasło, potwierdzenie, imię, NIP, adres
- Walidacja formatu i siły hasła
- Unikalność emaila
- Automatyczne logowanie po rejestracji
- Onboarding (flaga w bazie)

**US-002: Logowanie użytkownika** ✅

- Formularz email + hasło
- Weryfikacja danych
- Przekierowanie na dashboard
- Komunikaty błędów
- Sesja 30 dni

**US-003: Wylogowanie użytkownika** ✅

- Przycisk w nawigacji
- Przekierowanie na login
- Zakończenie sesji

**US-043: Bezpieczny dostęp i uwierzytelnianie** ✅

- Dedykowane strony logowania i rejestracji
- Wymagane email + hasło
- Przycisk logowania/wylogowania w nawigacji
- Brak zewnętrznych serwisów auth
- Możliwość odzyskiwania hasła

---

### 5.2. Zgodność z założeniami technicznymi

**Tech Stack** ✅:

- Astro 5 - strony SSR dla auth
- React 19 - formularze client-side
- TypeScript 5 - pełne typowanie
- Tailwind 4 - stylowanie
- Supabase - autentykacja i baza danych

**Struktura projektu** ✅:

- `src/pages/` - strony auth
- `src/pages/api/auth/` - endpointy
- `src/components/features/auth/` - komponenty
- `src/layouts/` - AuthLayout
- `src/lib/services/` - AuthService
- `src/lib/validation/` - schematy Zod
- `src/middleware/` - guards autentykacji

**Coding practices** ✅:

- Early returns w walidacji
- Custom error types (AuthError)
- Guard clauses w middleware
- Obsługa błędów w endpointach
- Walidacja Zod

---

### 5.3. Nie narusza istniejącej funkcjonalności

**Zachowana funkcjonalność**:

- Zarządzanie klientami (po autentykacji)
- Wpisy czasu (po autentykacji)
- Struktura bazy danych (tabela profiles już istnieje)
- API endpoints (tylko dodana weryfikacja auth)

**Zmiany breaking**:

- Usunięcie `DEFAULT_USER_ID` - wymaga migracji danych testowych
- Wszystkie strony wymagają logowania - zgodnie z wymaganiem

---

## 6. DOKUMENTACJA KONTRAKTÓW

### 6.1. Kontrakt API - Autentykacja

**Format request/response**:

- Content-Type: `application/json`
- Encoding: UTF-8

**Wspólne typy błędów**:

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Kody statusu HTTP**:

- 200 OK - sukces
- 201 Created - utworzono zasób
- 204 No Content - sukces bez zawartości
- 400 Bad Request - błędy walidacji
- 401 Unauthorized - brak autoryzacji
- 403 Forbidden - brak uprawnień
- 409 Conflict - konflikt (np. email zajęty)
- 500 Internal Server Error - błąd serwera

---

### 6.2. TypeScript Types

**Nowe typy w `src/types.ts`**:

```typescript
// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

// Registration DTO
export interface RegisterDTO {
  full_name: string;
  email: string;
  password: string;
  tax_id?: string;
  street?: string;
  city?: string;
  postal_code?: string;
}

// Login DTO
export interface LoginDTO {
  email: string;
  password: string;
}

// Forgot password DTO
export interface ForgotPasswordDTO {
  email: string;
}

// Reset password DTO
export interface ResetPasswordDTO {
  token: string;
  password: string;
}
```

---

### 6.3. Zod Schemas

**Lokalizacja**: `src/lib/validation/auth.schema.ts`

Schematy walidacji dla wszystkich operacji auth (zdefiniowane wcześniej w sekcji 1.5.1).

---

## KONIEC SPECYFIKACJI
