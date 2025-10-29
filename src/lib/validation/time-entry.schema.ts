import { z } from "zod";

export const createTimeEntrySchema = z.object({
  client_id: z.string().uuid("Invalid client ID format"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  hours: z.number().positive("Hours must be greater than 0").max(999.99, "Hours cannot exceed 999.99"),
  hourly_rate: z.number().nonnegative("Hourly rate cannot be negative").optional(),
  currency: z.enum(["PLN", "EUR", "USD"]).optional(),
  public_description: z.string().max(5000).optional(),
  private_note: z.string().max(5000).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const updateTimeEntrySchema = createTimeEntrySchema.partial();

export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
