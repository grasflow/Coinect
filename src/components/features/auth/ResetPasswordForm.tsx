import * as React from "react";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validation/auth.schema";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { supabaseBrowserClient } from "@/db/supabase.browser";

export function ResetPasswordForm() {
  const [formData, setFormData] = React.useState({
    password: "",
    password_confirm: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string>("");
  const [hasValidSession, setHasValidSession] = React.useState(false);

  // Sprawdź czy mamy sesję recovery z Supabase po załadowaniu
  // UWAGA: To jest wyjątek od reguły - używamy getSession() bo to flow recovery
  // Recovery session jest tymczasowa i weryfikowana przez Supabase
  // W standardowym flow uwierzytelniania zawsze używaj getUser()
  React.useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseBrowserClient.auth.getSession();
      if (data.session) {
        setHasValidSession(true);
      } else {
        setApiError("Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy link.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!hasValidSession) {
      setApiError("Brak ważnej sesji. Poproś o nowy link resetujący.");
      return;
    }

    try {
      const validatedData = resetPasswordSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);

      // Użyj Supabase bezpośrednio do zmiany hasła
      const { error } = await supabaseBrowserClient.auth.updateUser({
        password: validatedData.password,
      });

      if (error) {
        setApiError(error.message || "Nie udało się zmienić hasła");
        return;
      }

      // Wyloguj użytkownika po zmianie hasła
      await supabaseBrowserClient.auth.signOut();

      // Przekierowanie do logowania z komunikatem sukcesu
      window.location.href = "/login?reset=success";
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setApiError("Wystąpił błąd. Spróbuj ponownie");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="rounded-xl bg-red-50/80 p-4 border border-red-200/50 backdrop-blur-sm" role="alert">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-red-800">{apiError}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <PasswordInput
          id="password"
          label="Nowe hasło"
          required
          value={formData.password}
          onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
          error={errors.password}
        />

        <PasswordInput
          id="password_confirm"
          label="Potwierdź nowe hasło"
          required
          value={formData.password_confirm}
          onChange={(value) => setFormData((prev) => ({ ...prev, password_confirm: value }))}
          error={errors.password_confirm}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="filled"
          className="w-full h-11 text-sm md:text-base font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Resetowanie...
            </span>
          ) : (
            "Zresetuj hasło"
          )}
        </Button>
      </div>

      <div className="text-center text-sm pt-2">
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
          ← Powrót do logowania
        </a>
      </div>
    </form>
  );
}
