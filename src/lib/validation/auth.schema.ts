import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi zawierać minimum 8 znaków"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Imię i nazwisko jest wymagane").max(255, "Imię i nazwisko nie może przekraczać 255 znaków"),
    email: z.string().email("Nieprawidłowy format adresu email").max(255, "Email nie może przekraczać 255 znaków"),
    password: z
      .string()
      .min(8, "Hasło musi zawierać minimum 8 znaków")
      .regex(/[A-Za-z]/, "Hasło musi zawierać literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
    password_confirm: z.string(),
    tax_id: z
      .string()
      .refine((val) => val === "" || /^\d{10}$/.test(val), {
        message: "NIP musi składać się z 10 cyfr",
      })
      .optional()
      .default(""),
    street: z.string().max(255, "Ulica nie może przekraczać 255 znaków").optional().default(""),
    city: z.string().max(255, "Miasto nie może przekraczać 255 znaków").optional().default(""),
    postal_code: z.string().max(20, "Kod pocztowy nie może przekraczać 20 znaków").optional().default(""),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Hasła muszą być identyczne",
    path: ["password_confirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi zawierać minimum 8 znaków")
      .regex(/[A-Za-z]/, "Hasło musi zawierać literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Hasła muszą być identyczne",
    path: ["password_confirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
