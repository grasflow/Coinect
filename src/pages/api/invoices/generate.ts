import type { APIRoute } from "astro";
import { z } from "zod";
import { findNextInvoiceNumber, amountToWords } from "@/lib/helpers/invoice.helpers";

export const prerender = false;

const generateInvoiceSchema = z
  .object({
    client_id: z.string().uuid(),
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    vat_rate: z.number().min(0).max(100),
    time_entry_ids: z.array(z.string().uuid()).optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1),
          time_entry_ids: z.array(z.string().uuid()).min(1),
        })
      )
      .optional(),
    manual_items: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().positive(),
          unit_price: z.number().min(0),
        })
      )
      .optional(),
    custom_exchange_rate: z.number().positive().nullable().optional(),
    notes: z.string().optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine(
    (data) => {
      const hasTimeEntries = data.time_entry_ids && data.time_entry_ids.length > 0;
      const hasManualItems = data.manual_items && data.manual_items.length > 0;
      return hasTimeEntries || hasManualItems;
    },
    {
      message: "Faktura musi zawierać co najmniej jedną pozycję (z wpisów czasu lub manualną)",
      path: ["time_entry_ids"],
    }
  );

export const POST: APIRoute = async (context) => {
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
    const body = await context.request.json();

    // Walidacja z lepszym error handlingiem
    const validationResult = generateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane wejściowe",
            details: validationResult.error.format(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // 1. Sprawdzenie czy klient należy do użytkownika
    const { data: client, error: clientError } = await context.locals.supabase
      .from("clients")
      .select("*")
      .eq("id", validatedData.client_id)
      .eq("user_id", userId)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Klient nie został znaleziony",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Pobranie wpisów czasu i weryfikacja (tylko jeśli są time_entry_ids)
    let timeEntries: {
      id: string;
      hours: number;
      hourly_rate: number;
    }[] = [];
    if (validatedData.time_entry_ids && validatedData.time_entry_ids.length > 0) {
      const { data: entries, error: entriesError } = await context.locals.supabase
        .from("time_entries")
        .select("*")
        .in("id", validatedData.time_entry_ids)
        .eq("user_id", userId)
        .eq("client_id", validatedData.client_id)
        .is("invoice_id", null); // Tylko niezafakturowane

      if (entriesError || !entries || entries.length === 0) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Nie znaleziono niezafakturowanych wpisów czasu",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Sprawdzenie czy wszystkie wpisy zostały znalezione
      if (entries.length !== validatedData.time_entry_ids.length) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Niektóre wpisy czasu są już zafakturowane lub nie istnieją",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      timeEntries = entries;
    }

    // 3. Obliczenie pozycji faktury
    const itemsData: {
      position: number;
      description: string;
      quantity: number;
      unitPrice: number;
      netAmount: number;
      timeEntryIds?: string[];
    }[] = [];

    // Dodaj pozycje z time entries (jeśli istnieją)
    if (validatedData.items && validatedData.items.length > 0) {
      validatedData.items.forEach((item) => {
        const itemEntries = timeEntries.filter((e) => item.time_entry_ids.includes(e.id));

        const quantity = itemEntries.reduce((sum, e) => sum + parseFloat(e.hours.toString()), 0);
        const avgRate =
          itemEntries.reduce((sum, e) => sum + parseFloat(e.hourly_rate.toString()), 0) / itemEntries.length;
        const netAmount = quantity * avgRate;

        itemsData.push({
          position: itemsData.length + 1,
          description: item.description,
          quantity,
          unitPrice: avgRate,
          netAmount,
          timeEntryIds: item.time_entry_ids,
        });
      });
    }

    // Dodaj manualne pozycje (jeśli istnieją)
    if (validatedData.manual_items && validatedData.manual_items.length > 0) {
      validatedData.manual_items.forEach((item) => {
        itemsData.push({
          position: itemsData.length + 1,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          netAmount: item.quantity * item.unit_price,
        });
      });
    }

    // 4. Obliczenie sum
    const netAmount = itemsData.reduce((sum, item) => sum + item.netAmount, 0);
    const vatAmount = netAmount * (validatedData.vat_rate / 100);
    const grossAmount = netAmount + vatAmount;

    // 5. Obsługa kursu waluty
    const currency = client.default_currency || "PLN";
    let exchangeRate = null;
    let exchangeRateDate = null;
    let isCustomExchangeRate = false;
    let netAmountPLN = null;
    let vatAmountPLN = null;
    let grossAmountPLN = null;

    if (currency !== "PLN") {
      if (validatedData.custom_exchange_rate !== null && validatedData.custom_exchange_rate !== undefined) {
        // Użyj kursu przekazanego w żądaniu (może być z API lub wprowadzony ręcznie)
        exchangeRate = validatedData.custom_exchange_rate;
        isCustomExchangeRate = true;
        exchangeRateDate = validatedData.issue_date;
      } else {
        // Pobranie kursu z cache jako fallback
        const { data: cachedRate } = await context.locals.supabase
          .from("exchange_rate_cache")
          .select("*")
          .eq("currency", currency)
          .eq("rate_date", validatedData.issue_date)
          .single();

        if (cachedRate) {
          exchangeRate = parseFloat(cachedRate.rate.toString());
          exchangeRateDate = cachedRate.rate_date;
        } else {
          return new Response(
            JSON.stringify({
              error: {
                code: "VALIDATION_ERROR",
                message: "Brak kursu waluty. Wprowadź kurs ręcznie.",
              },
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Przeliczenie na PLN
      netAmountPLN = netAmount * exchangeRate;
      vatAmountPLN = vatAmount * exchangeRate;
      grossAmountPLN = grossAmount * exchangeRate;
    }

    // 6. Generowanie numeru faktury
    // Używamy daty faktury (issue_date) do określenia miesiąca i roku
    const invoiceDate = new Date(validatedData.issue_date);
    const year = invoiceDate.getFullYear();
    const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");

    // Pobranie wszystkich faktur z tego samego miesiąca/roku
    const { data: existingInvoices } = await context.locals.supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", userId)
      .like("invoice_number", `FV/${year}/${month}/%`)
      .is("deleted_at", null); // Pomijamy usunięte faktury

    const existingNumbers = existingInvoices?.map((inv) => inv.invoice_number) || [];
    const invoiceNumber = findNextInvoiceNumber(existingNumbers, year, month);

    // 7. Kwota słownie
    const grossAmountWords = amountToWords(grossAmount, currency);

    // 8. Rozpoczęcie transakcji - zapis faktury
    const isManualInvoice = !validatedData.time_entry_ids || validatedData.time_entry_ids.length === 0;

    const { data: invoice, error: invoiceError } = await context.locals.supabase
      .from("invoices")
      .insert({
        user_id: userId,
        client_id: validatedData.client_id,
        invoice_number: invoiceNumber,
        issue_date: validatedData.issue_date,
        sale_date: validatedData.sale_date,
        currency,
        exchange_rate: exchangeRate || null,
        exchange_rate_date: exchangeRateDate,
        is_custom_exchange_rate: isCustomExchangeRate,
        net_amount: netAmount,
        vat_rate: validatedData.vat_rate,
        vat_amount: vatAmount,
        gross_amount: grossAmount,
        net_amount_pln: netAmountPLN,
        vat_amount_pln: vatAmountPLN,
        gross_amount_pln: grossAmountPLN,
        gross_amount_words: grossAmountWords,
        status: "unpaid",
        is_paid: false,
        is_manual: isManualInvoice,
        notes: validatedData.notes || null,
        due_date: validatedData.due_date || null,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Nie udało się utworzyć faktury");
    }

    // 9. Zapis pozycji faktury
    const invoiceItemsToInsert = itemsData.map((item) => ({
      invoice_id: invoice.id,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      net_amount: item.netAmount,
    }));

    const { data: insertedItems, error: itemsError } = await context.locals.supabase
      .from("invoice_items")
      .insert(invoiceItemsToInsert)
      .select();

    if (itemsError || !insertedItems) {
      // Rollback - usunięcie faktury
      await context.locals.supabase.from("invoices").delete().eq("id", invoice.id);
      throw new Error("Nie udało się utworzyć pozycji faktury");
    }

    // 10. Zapis powiązań wpisy czas <-> pozycje faktury (tylko dla pozycji z time entries)
    if (validatedData.time_entry_ids && validatedData.time_entry_ids.length > 0) {
      const timeEntryLinks: {
        invoice_item_id: string;
        time_entry_id: string;
      }[] = [];

      itemsData.forEach((item, index) => {
        if (item.timeEntryIds) {
          const invoiceItemId = insertedItems[index].id;
          item.timeEntryIds.forEach((timeEntryId) => {
            timeEntryLinks.push({
              invoice_item_id: invoiceItemId,
              time_entry_id: timeEntryId,
            });
          });
        }
      });

      const { error: linksError } = await context.locals.supabase
        .from("invoice_item_time_entries")
        .insert(timeEntryLinks);

      if (linksError) {
        // Rollback
        await context.locals.supabase.from("invoices").delete().eq("id", invoice.id);
        throw new Error("Nie udało się powiązać wpisów czasu z fakturą");
      }

      // 11. Aktualizacja wpisów czasu - oznaczenie jako zafakturowane
      const { error: updateEntriesError } = await context.locals.supabase
        .from("time_entries")
        .update({ invoice_id: invoice.id })
        .in("id", validatedData.time_entry_ids);

      if (updateEntriesError) {
        // Rollback
        await context.locals.supabase.from("invoices").delete().eq("id", invoice.id);
        throw new Error("Nie udało się zaktualizować wpisów czasu");
      }
    }

    return new Response(
      JSON.stringify({
        id: invoice.id,
        invoice_number: invoiceNumber,
        gross_amount: grossAmount.toFixed(2),
        currency,
        message: `Faktura ${invoiceNumber} została wygenerowana`,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane wejściowe",
            details: error.errors,
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
          message: error instanceof Error ? error.message : "An unexpected error occurred",
          details: error instanceof Error ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
