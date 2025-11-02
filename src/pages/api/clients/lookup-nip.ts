import type { APIRoute } from "astro";
import { fetchCompanyByNIP } from "@/lib/services/gus.service";

/**
 * GET /api/clients/lookup-nip?nip=XXXXXXXXXX
 *
 * Fetches company data from Biała Lista VAT (Polish Ministry of Finance)
 * Free API, no registration required
 * Limit: 300 queries per day
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const nip = url.searchParams.get("nip");

    if (!nip) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Parametr NIP jest wymagany",
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch company data from Biała Lista VAT
    const companyData = await fetchCompanyByNIP(nip);

    return new Response(JSON.stringify({ data: companyData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Nie udało się pobrać danych firmy";

    return new Response(
      JSON.stringify({
        error: {
          code: "FETCH_ERROR",
          message: errorMessage,
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
