import * as React from "react";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [apiError, setApiError] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setIsSuccess(false);

    try {
      const validatedData = forgotPasswordSchema.parse({ email });
      setErrors({});
      setIsSubmitting(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error) {
          setApiError(errorData.error.message || "Wystąpił błąd. Spróbuj ponownie");
        } else {
          setApiError("Wystąpił błąd. Spróbuj ponownie");
        }
        return;
      }

      setIsSuccess(true);
      setEmail("");
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
        setApiError("Wystąpił błąd sieciowy. Spróbuj ponownie");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {isSuccess && (
        <div className="rounded-xl bg-green-50/80 p-4 border border-green-200/50 backdrop-blur-sm" role="alert">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-green-800">
              Link do resetowania hasła został wysłany na podany adres email. Sprawdź swoją skrzynkę pocztową.
            </p>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Email" required errorText={errors.email} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jan@firma.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            className="h-11"
          />
        </FormField>

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
                Wysyłanie...
              </span>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>
        </div>

        <div className="text-center text-sm pt-2">
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
            ← Powrót do logowania
          </a>
        </div>
      </form>
    </div>
  );
}
