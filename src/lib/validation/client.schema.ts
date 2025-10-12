import { z } from "zod";
import type { Currency } from "@/types";

export const createClientSchema = z.object({
  name: z.string().min(1, "Nazwa klienta jest wymagana"),
  tax_id: z.string().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr").optional().or(z.literal("")),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default("Polska").optional(),
  email: z.string().email("Nieprawidłowy format email").optional().or(z.literal("")),
  phone: z.string().optional(),
  default_currency: z.enum(["PLN", "EUR", "USD"]).default("PLN"),
  default_hourly_rate: z.number().min(0, "Stawka nie może być ujemna").optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientSchema = z.infer<typeof createClientSchema>;
export type UpdateClientSchema = z.infer<typeof updateClientSchema>;
