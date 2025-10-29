import { describe, it, expect } from "vitest";
import { calculateInvoiceTotal, formatInvoiceNumber, isInvoiceOverdue } from "./invoice.helpers";

describe("Invoice Helpers", () => {
  describe("calculateInvoiceTotal", () => {
    it("oblicza poprawnie sumę z podatkiem", () => {
      const result = calculateInvoiceTotal(1000, 23);
      expect(result).toEqual({
        subtotal: 1000,
        taxAmount: 230,
        total: 1230,
      });
    });

    it("obsługuje stawkę 0%", () => {
      const result = calculateInvoiceTotal(1000, 0);
      expect(result).toEqual({
        subtotal: 1000,
        taxAmount: 0,
        total: 1000,
      });
    });

    it("zaokrągla do 2 miejsc po przecinku", () => {
      const result = calculateInvoiceTotal(100.55, 23);
      expect(result.taxAmount).toBe(23.13);
      expect(result.total).toBe(123.68);
    });
  });

  describe("formatInvoiceNumber", () => {
    it("formatuje numer faktury z szablonem", () => {
      const result = formatInvoiceNumber("FV/{YYYY}/{MM}/{NN}", 1, new Date("2025-10-14"));
      expect(result).toBe("FV/2025/10/001");
    });

    it("obsługuje różne liczniki", () => {
      const result = formatInvoiceNumber("FV/{YYYY}/{NN}", 42, new Date("2025-10-14"));
      expect(result).toBe("FV/2025/042");
    });
  });

  describe("isInvoiceOverdue", () => {
    it("zwraca true dla przeterminowanej faktury", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      expect(isInvoiceOverdue(pastDate, "sent")).toBe(true);
    });

    it("zwraca false dla nieopłaconej faktury w terminie", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      expect(isInvoiceOverdue(futureDate, "sent")).toBe(false);
    });

    it("zwraca false dla opłaconej faktury", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      expect(isInvoiceOverdue(pastDate, "paid")).toBe(false);
    });
  });
});
