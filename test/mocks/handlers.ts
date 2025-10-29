import { http, HttpResponse } from "msw";

const API_BASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost:54321";

export const handlers = [
  // Mock dla Supabase Auth
  http.post(`${API_BASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: "mock-user-id",
        email: "test@example.com",
        aud: "authenticated",
        role: "authenticated",
      },
    });
  }),

  // Mock dla OpenRouter API
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "gen-mock-id",
      model: "mock-model",
      choices: [
        {
          message: {
            role: "assistant",
            content: "Mock AI response",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    });
  }),

  // Mock dla NBP API (kursy walut)
  http.get("https://api.nbp.pl/api/exchangerates/rates/:table/:code", ({ params }) => {
    return HttpResponse.json({
      table: params.table,
      currency: "dolar amerykański",
      code: params.code,
      rates: [
        {
          no: "001/A/NBP/2025",
          effectiveDate: "2025-01-02",
          mid: 4.0234,
        },
      ],
    });
  }),

  // Mock dla GUS API
  http.get("https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc", () => {
    return HttpResponse.json({
      result: "Mock GUS data",
    });
  }),
];
