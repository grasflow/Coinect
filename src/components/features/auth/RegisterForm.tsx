import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthClientService } from "@/lib/services/auth.client.service";

export function RegisterForm() {
  const [apiError, setApiError] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      password_confirm: "",
      tax_id: "",
      street: "",
      city: "",
      postal_code: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setApiError("");

    try {
      await AuthClientService.register(data);
      // Przekierowanie po udanej rejestracji
      window.location.assign("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("Wystąpił błąd sieciowy. Spróbuj ponownie");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <FormField label="Imię i nazwisko" required errorText={errors.full_name?.message} htmlFor="full_name">
          <Input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jan Kowalski"
            {...register("full_name")}
            aria-invalid={!!errors.full_name}
            className="h-11"
          />
        </FormField>

        <FormField label="Email" required errorText={errors.email?.message} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jan@firma.pl"
            {...register("email")}
            aria-invalid={!!errors.email}
            className="h-11"
          />
        </FormField>

        <FormField label="Hasło" required errorText={errors.password?.message} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
            className="h-11"
          />
        </FormField>

        <FormField
          label="Potwierdź hasło"
          required
          errorText={errors.password_confirm?.message}
          htmlFor="password_confirm"
        >
          <Input
            id="password_confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("password_confirm")}
            aria-invalid={!!errors.password_confirm}
            className="h-11"
          />
        </FormField>
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Dane opcjonalne</h3>

        <FormField label="NIP" helperText="10 cyfr" errorText={errors.tax_id?.message} htmlFor="tax_id">
          <Input
            id="tax_id"
            type="text"
            placeholder="1234567890"
            maxLength={10}
            {...register("tax_id")}
            aria-invalid={!!errors.tax_id}
            className="h-11"
          />
        </FormField>

        <FormField label="Ulica" errorText={errors.street?.message} htmlFor="street">
          <Input id="street" type="text" placeholder="ul. Przykładowa 123" {...register("street")} className="h-11" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Miasto" errorText={errors.city?.message} htmlFor="city">
            <Input id="city" type="text" placeholder="Warszawa" {...register("city")} className="h-11" />
          </FormField>

          <FormField label="Kod pocztowy" errorText={errors.postal_code?.message} htmlFor="postal_code">
            <Input id="postal_code" type="text" placeholder="00-000" {...register("postal_code")} className="h-11" />
          </FormField>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="filled"
          className="w-full h-11 text-base font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
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
              Tworzenie konta...
            </span>
          ) : (
            "Zarejestruj się"
          )}
        </Button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">Masz już konto?</span>{" "}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
