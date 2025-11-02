import type { APIRoute } from "astro";
import type { Currency } from "@/types";

export const prerender = false;

interface NBPResponse {
  rates: {
    mid: number;
    effectiveDate: string;
  }[];
}

async function fetchNBPRate(currency: string, date: string): Promise<number | null> {
  const currencyCode = currency === "USD" ? "usd" : "eur";

  try {
    // Próba pobrania kursu dla konkretnej daty
    const response = await fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/${date}/?format=json`);

    if (response.ok) {
      const data: NBPResponse = await response.json();
      return data.rates[0].mid;
    }

    // Fallback - pobierz ostatni dostępny kurs
    const fallbackResponse = await fetch(
      `https://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/last/?format=json`
    );

    if (fallbackResponse.ok) {
      const data: NBPResponse = await fallbackResponse.json();
      return data.rates[0].mid;
    }

    return null;
  } catch (error) {
    return null;
  }
}

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

    const currency = context.params.currency as Currency;
    const date = context.params.date;

    if (!currency || !date) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Wymagane parametry: currency i date",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (currency !== "EUR" && currency !== "USD") {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Obsługiwane waluty: EUR, USD",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sprawdzenie cache w bazie danych
    const { data: cachedRate, error: cacheError } = await context.locals.supabase
      .from("exchange_rates")
      .select("*")
      .eq("currency", currency)
      .eq("date", date)
      .single();

    if (!cacheError && cachedRate) {
      return new Response(
        JSON.stringify({
          currency,
          date,
          rate: cachedRate.rate,
          source: "cache",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pobieranie kursu z API NBP
    const rate = await fetchNBPRate(currency, date);

    if (!rate) {
      return new Response(
        JSON.stringify({
          error: {
            code: "EXTERNAL_API_ERROR",
            message: "Nie udało się pobrać kursu waluty z API NBP. Wprowadź kurs ręcznie.",
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Zapisanie w cache
    await context.locals.supabase.from("exchange_rates").insert({
      currency,
      date,
      rate: rate.toString(),
    });

    return new Response(
      JSON.stringify({
        currency,
        date,
        rate: rate.toString(),
        source: "api",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
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
