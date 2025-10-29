import type { LoginInput, RegisterInput } from "@/lib/validation/auth.schema";

/**
 * Serwis API autentykacji po stronie klienta
 * Odpowiada za komunikację z API endpoints
 */

interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
  };
}

interface AuthErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const AuthClientService = {
  /**
   * Loguje użytkownika
   * @throws Error z komunikatem błędu
   */
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData: AuthErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Wystąpił błąd logowania");
    }

    return response.json();
  },

  /**
   * Rejestruje nowego użytkownika
   * @throws Error z komunikatem błędu
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: AuthErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Wystąpił błąd rejestracji");
    }

    return response.json();
  },

  /**
   * Wysyła żądanie resetu hasła
   * @throws Error z komunikatem błędu
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData: AuthErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się wysłać emaila");
    }

    return response.json();
  },

  /**
   * Resetuje hasło użytkownika
   * @throws Error z komunikatem błędu
   */
  async resetPassword(password: string, passwordConfirm: string): Promise<{ success: boolean }> {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, password_confirm: passwordConfirm }),
    });

    if (!response.ok) {
      const errorData: AuthErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się zresetować hasła");
    }

    return response.json();
  },
};
