import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().max(255, "Imię i nazwisko nie może przekraczać 255 znaków").optional(),
  tax_id: z
    .string()
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "NIP musi składać się z 10 cyfr",
    })
    .optional(),
  street: z.string().max(255, "Ulica nie może przekraczać 255 znaków").optional(),
  city: z.string().max(255, "Miasto nie może przekraczać 255 znaków").optional(),
  postal_code: z
    .string()
    .max(20, "Kod pocztowy nie może przekraczać 20 znaków")
    .refine((val) => val === "" || /^\d{2}-\d{3}$/.test(val), {
      message: "Kod pocztowy musi być w formacie XX-XXX",
    })
    .optional(),
  country: z.string().max(255, "Kraj nie może przekraczać 255 znaków").optional(),
  email: z.string().email("Nieprawidłowy format email").max(255, "Email nie może przekraczać 255 znaków").optional(),
  phone: z.string().max(50, "Telefon nie może przekraczać 50 znaków").optional(),
  bank_account: z.string().max(255, "Numer konta nie może przekraczać 255 znaków").optional(),
  bank_name: z.string().max(255, "Nazwa banku nie może przekraczać 255 znaków").optional(),
  bank_swift: z.string().max(50, "Kod SWIFT nie może przekraczać 50 znaków").optional(),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Nieprawidłowy format koloru")
    .optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
