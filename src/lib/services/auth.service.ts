import type { SupabaseServerClient } from "@/db/supabase.server";
import { AuthError } from "@/lib/errors";

/**
 * Serwis autentykacji - centralizuje operacje auth z Supabase
 * Obsługuje logowanie, rejestrację, wylogowanie i zarządzanie sesjami
 */
export class AuthService {
  constructor(private supabase: SupabaseServerClient) {}

  /**
   * Loguje użytkownika przez email i hasło
   * @throws AuthError jeśli dane logowania są nieprawidłowe
   */
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Wszystkie błędy logowania mapowane na ogólny komunikat (security best practice)
      throw new AuthError("INVALID_CREDENTIALS", "Nieprawidłowy email lub hasło");
    }

    if (!data.user || !data.session) {
      throw new AuthError("LOGIN_ERROR", "Nie udało się zalogować");
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
   * Rejestruje nowego użytkownika
   * Profil użytkownika jest tworzony automatycznie przez trigger w bazie
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
      // Mapowanie błędów Supabase na czytelne komunikaty
      if (signUpError.message.includes("already registered")) {
        throw new AuthError("EMAIL_TAKEN", "Email jest już zajęty");
      }
      if (signUpError.message.includes("password")) {
        throw new AuthError("WEAK_PASSWORD", "Hasło jest za słabe");
      }
      throw new AuthError("SIGNUP_ERROR", "Nie udało się utworzyć konta");
    }

    if (!authData.user) {
      throw new AuthError("SIGNUP_ERROR", "Nie udało się utworzyć użytkownika");
    }

    // Aktualizacja profilu dodatkowymi danymi (jeśli podane)
    if (data.tax_id || data.street || data.city || data.postal_code) {
      const { error: updateError } = await this.supabase
        .from("profiles")
        .update({
          tax_id: data.tax_id,
          street: data.street,
          city: data.city,
          postal_code: data.postal_code,
        })
        .eq("id", authData.user.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        // Nie rzucamy błędu - użytkownik został utworzony, tylko profil nie został w pełni zaktualizowany
      }
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
   * Wylogowuje użytkownika i niszczy sesję
   */
  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new AuthError("LOGOUT_ERROR", "Nie udało się wylogować");
    }
  }

  /**
   * Pobiera aktualną sesję użytkownika
   * @deprecated Używaj getCurrentUser() zamiast getSession() dla operacji wymagających bezpieczeństwa.
   * getSession() tylko odczytuje dane z cookies, które mogą być sfałszowane.
   * getCurrentUser() weryfikuje token z serwerem Supabase.
   *
   * Ta metoda jest zachowana dla kompatybilności wstecznej, ale nie powinna być używana
   * do weryfikacji tożsamości użytkownika po stronie serwera.
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
   * ✅ BEZPIECZNE - weryfikuje token z serwerem Supabase
   *
   * W przeciwieństwie do getSession(), ta metoda zawsze weryfikuje token
   * z serwerem Supabase, co chroni przed sfałszowanymi danymi w cookies.
   */
  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  /**
   * Wysyła email z linkiem do resetowania hasła
   */
  async sendPasswordResetEmail(email: string, redirectUrl: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new AuthError("PASSWORD_RESET_ERROR", "Nie udało się wysłać emaila");
    }
  }

  /**
   * Aktualizuje hasło użytkownika (używane po resecie)
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AuthError("PASSWORD_UPDATE_ERROR", "Nie udało się zmienić hasła");
    }
  }
}
