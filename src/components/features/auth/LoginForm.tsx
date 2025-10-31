import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthClientService } from "@/lib/services/auth.client.service";

export function LoginForm() {
  const [apiError, setApiError] = React.useState<string>("");
  const [successMessage, setSuccessMessage] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    getValues,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // DEBUG: Log component mount
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("🔵 [LoginForm] Component mounted");
    return () => {
      // eslint-disable-next-line no-console
      console.log("🔴 [LoginForm] Component unmounted");
    };
  }, []);

  // DEBUG: Log errors whenever they change
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // eslint-disable-next-line no-console
      console.log("❌ [LoginForm] Validation errors:", errors);
    }
  }, [errors]);

  // DEBUG: Watch form values
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // eslint-disable-next-line no-console
      console.log("📝 [LoginForm] Field changed:", { name, type, value: value[name as keyof LoginInput] });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Sprawdź czy jest komunikat o sukcesie resetowania hasła
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") {
      setSuccessMessage("Hasło zostało zmienione. Możesz się teraz zalogować.");
      // Usuń parametr z URL bez przeładowania strony
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const onSubmit = async (data: LoginInput) => {
    // eslint-disable-next-line no-console
    console.log("✅ [LoginForm] onSubmit called with data:", data);
    // eslint-disable-next-line no-console
    console.log("📊 [LoginForm] Current form values:", getValues());
    // eslint-disable-next-line no-console
    console.log("🔍 [LoginForm] Current errors:", errors);
    setApiError("");

    try {
      await AuthClientService.login(data);
      // Sukces - backend ustawił cookies
      // Reload strony, aby middleware załadował nową sesję i przekierował na /dashboard
      window.location.assign("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("Wystąpił błąd sieciowy. Spróbuj ponownie");
      }
    }
  };

  // DEBUG: Wrapper for handleSubmit to log when form is submitted
  const handleFormSubmit = (e: React.FormEvent) => {
    // eslint-disable-next-line no-console
    console.log("🚀 [LoginForm] Form submit event triggered");
    // eslint-disable-next-line no-console
    console.log("🚀 [LoginForm] Event:", e);
    // eslint-disable-next-line no-console
    console.log("📋 [LoginForm] Form values before submit:", getValues());
    handleSubmit(onSubmit)(e);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {successMessage && (
        <div className="rounded-xl bg-green-50/80 p-4 border border-green-200/50 backdrop-blur-sm" role="alert">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
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

      <div className="space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
            className="h-11"
          />
        </FormField>

        <div className="flex items-center justify-end pt-1">
          <a
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Zapomniałeś hasła?
          </a>
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
              Logowanie...
            </span>
          ) : (
            "Zaloguj się"
          )}
        </Button>
      </div>

      <div className="relative pt-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Nie masz konta?</span>
        </div>
      </div>

      <div className="text-center">
        <a
          href="/register"
          className="inline-flex items-center justify-center w-full h-11 px-4 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Załóż nowe konto
        </a>
      </div>
    </form>
  );
}
