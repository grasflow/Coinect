import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const updateInvoiceSchema = z.object({
  issue_date: z.string().optional(),
  sale_date: z.string().optional(),
  vat_rate: z.number().optional(),
  items: z
    .array(
      z.object({
        position: z.number(),
        description: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
      })
    )
    .optional(),
  custom_exchange_rate: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  invoice_number: z
    .string()
    .regex(/^FV\/\d{4}\/\d{2}\/\d{3}$/, "Numer faktury musi mieć format FV/RRRR/MM/NNN")
    .optional(),
});

const patchInvoiceSchema = z.object({
  is_paid: z.boolean().optional(),
  status: z.enum(["paid", "unpaid"]).optional(),
});

export const GET: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const invoiceId = context.params.id;

    const { data, error } = await context.locals.supabase
      .from("invoices")
      .select(
        `
        *,
        client:clients(*),
        items:invoice_items(
          *,
          time_entries:invoice_item_time_entries(
            time_entry:time_entries(id, date, hours)
          )
        )
      `
      )
      .eq("id", invoiceId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Faktura nie została znaleziona",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const invoiceId = context.params.id;
    const body = await context.request.json();

    const validatedData = updateInvoiceSchema.parse(body);

    // Sprawdzenie czy faktura istnieje i należy do użytkownika
    const { data: existingInvoice, error: fetchError } = await context.locals.supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingInvoice) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Faktura nie została znaleziona",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sprawdzenie unikalności numeru faktury jeśli został zmieniony
    if (validatedData.invoice_number && validatedData.invoice_number !== existingInvoice.invoice_number) {
      const { data: duplicateInvoice } = await context.locals.supabase
        .from("invoices")
        .select("id")
        .eq("user_id", userId)
        .eq("invoice_number", validatedData.invoice_number)
        .is("deleted_at", null)
        .single();

      if (duplicateInvoice) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Faktura o tym numerze już istnieje",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Aktualizacja podstawowych danych faktury
    const updateData: {
      is_edited: boolean;
      edited_at: string;
      issue_date?: string;
      sale_date?: string;
      vat_rate?: number;
      exchange_rate?: number | null;
      is_custom_exchange_rate?: boolean;
      notes?: string | null;
      invoice_number?: string;
    } = {
      is_edited: true,
      edited_at: new Date().toISOString(),
    };

    if (validatedData.issue_date) {
      updateData.issue_date = validatedData.issue_date;
    }

    if (validatedData.sale_date) {
      updateData.sale_date = validatedData.sale_date;
    }

    if (validatedData.vat_rate !== undefined) {
      updateData.vat_rate = validatedData.vat_rate;
    }

    if (validatedData.custom_exchange_rate !== undefined) {
      updateData.exchange_rate = validatedData.custom_exchange_rate;
      updateData.is_custom_exchange_rate = validatedData.custom_exchange_rate !== null;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.due_date !== undefined) {
      updateData.due_date = validatedData.due_date;
    }

    if (validatedData.invoice_number) {
      updateData.invoice_number = validatedData.invoice_number;
    }

    const { error: updateError } = await context.locals.supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    if (updateError) {
      throw updateError;
    }

    // Aktualizacja pozycji faktury jeśli zostały podane
    if (validatedData.items) {
      // Usunięcie starych pozycji
      await context.locals.supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

      // Dodanie nowych pozycji
      const itemsToInsert = validatedData.items.map((item) => ({
        invoice_id: invoiceId,
        position: item.position,
        description: item.description,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        net_amount: (item.quantity * item.unit_price).toString(),
      }));

      const { error: itemsError } = await context.locals.supabase.from("invoice_items").insert(itemsToInsert);

      if (itemsError) {
        throw itemsError;
      }

      // Przelicz kwoty w fakturze na podstawie nowych pozycji
      const netAmount = validatedData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const vatRate = validatedData.vat_rate ?? parseFloat(existingInvoice.vat_rate);
      const vatAmount = netAmount * (vatRate / 100);
      const grossAmount = netAmount + vatAmount;

      // Oblicz kwoty w PLN jeśli waluta jest inna niż PLN
      let grossAmountPLN = null;
      let netAmountPLN = null;
      let vatAmountPLN = null;

      if (existingInvoice.currency !== "PLN") {
        const exchangeRate = validatedData.custom_exchange_rate ?? parseFloat(existingInvoice.exchange_rate || "0");
        if (exchangeRate > 0) {
          grossAmountPLN = grossAmount * exchangeRate;
          netAmountPLN = netAmount * exchangeRate;
          vatAmountPLN = vatAmount * exchangeRate;
        }
      }

      // Zaktualizuj kwoty w tabeli invoices
      const { error: amountsError } = await context.locals.supabase
        .from("invoices")
        .update({
          net_amount: netAmount.toFixed(2),
          vat_amount: vatAmount.toFixed(2),
          gross_amount: grossAmount.toFixed(2),
          gross_amount_pln: grossAmountPLN ? grossAmountPLN.toFixed(2) : null,
          net_amount_pln: netAmountPLN ? netAmountPLN.toFixed(2) : null,
          vat_amount_pln: vatAmountPLN ? vatAmountPLN.toFixed(2) : null,
        })
        .eq("id", invoiceId);

      if (amountsError) {
        throw amountsError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Faktura została zaktualizowana",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data provided",
            details: error.errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const invoiceId = context.params.id;
    const body = await context.request.json();

    const validatedData = patchInvoiceSchema.parse(body);

    const { error } = await context.locals.supabase
      .from("invoices")
      .update(validatedData)
      .eq("id", invoiceId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Status faktury został zaktualizowany",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data provided",
            details: error.errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Wymagana autentykacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const invoiceId = context.params.id;

    // Rozpocznij transakcję - najpierw sprawdź czy faktura istnieje i należy do użytkownika
    const { data: existingInvoice, error: fetchError } = await context.locals.supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingInvoice) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Faktura nie została znaleziona",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Usuń powiązania między pozycjami faktury a wpisami czasu
    // To automatycznie usunie wpisy z invoice_item_time_entries dzięki CASCADE
    await context.locals.supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

    // Wyczyść invoice_id w powiązanych wpisach czasu pracy
    await context.locals.supabase
      .from("time_entries")
      .update({ invoice_id: null })
      .eq("invoice_id", invoiceId)
      .eq("user_id", userId);

    // Soft delete faktury - ustaw deleted_at
    const { error } = await context.locals.supabase
      .from("invoices")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Faktura została usunięta",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
