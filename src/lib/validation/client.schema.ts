import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Nazwa klienta jest wymagana").max(255, "Nazwa nie może przekraczać 255 znaków"),
  tax_id: z
    .string()
    .regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr")
    .optional()
    .or(z.literal("")),
  street: z.string().max(255, "Ulica nie może przekraczać 255 znaków").optional(),
  city: z.string().max(255, "Miasto nie może przekraczać 255 znaków").optional(),
  postal_code: z.string().max(20, "Kod pocztowy nie może przekraczać 20 znaków").optional(),
  country: z.string().max(255, "Kraj nie może przekraczać 255 znaków").default("Polska").optional(),
  email: z.string().email("Nieprawidłowy format email").max(255, "Email nie może przekraczać 255 znaków").optional().or(z.literal("")),
  phone: z.string().max(50, "Telefon nie może przekraczać 50 znaków").optional().or(z.literal("")),
  default_currency: z.enum(["PLN", "EUR", "USD"]).default("PLN"),
  default_hourly_rate: z.number().min(0, "Stawka nie może być ujemna").optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientSchema = z.infer<typeof createClientSchema>;
export type UpdateClientSchema = z.infer<typeof updateClientSchema>;
