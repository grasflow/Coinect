import type { APIRoute } from "astro";
import { generateInvoicePDF } from "@/lib/services/pdf.service";
import type { InvoiceDetailDTO, Profile } from "@/types";

export const prerender = false;

/**
 * GET /api/invoices/{id}/pdf
 * Generuje i zwraca PDF faktury on-the-fly
 */
export const GET: APIRoute = async (context) => {
  try {
    const invoiceId = context.params.id;

    console.log("PDF endpoint wywołany dla faktury:", invoiceId);

    if (!invoiceId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Brak ID faktury",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Autoryzacja
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

    // Pobranie pełnych danych faktury
    const { data: invoice, error: invoiceError } = await context.locals.supabase
      .from("invoices")
      .select(
        `*,
        client:clients(*),
        items:invoice_items(
          *,
          time_entries:invoice_item_time_entries(
            time_entry:time_entries(id, date, hours)
          )
        )`
      )
      .eq("id", invoiceId)
      .eq("user_id", userId)
      .single();

    if (invoiceError || !invoice) {
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

    // Pobranie profilu użytkownika
    const { data: profile, error: profileError } = await context.locals.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "Nie udało się pobrać danych profilu",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generowanie PDF on-the-fly
    const pdfBlob = await generateInvoicePDF({
      invoice: invoice as InvoiceDetailDTO,
      profile: profile as Profile,
    });

    // Sanityzacja nazwy klienta dla nazwy pliku
    const clientName = invoice.client?.name || "Klient";
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");

    const fileName = `faktura_${invoice.invoice_number.replace(/\//g, "-")}_${sanitizedClientName}.pdf`;

    // Zwrócenie wygenerowanego PDF
    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Błąd generowania PDF:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
