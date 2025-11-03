import { describe, it, expect } from "vitest";
import { calculateInvoiceTotal, formatInvoiceNumber, isInvoiceOverdue, findNextInvoiceNumber } from "./invoice.helpers";

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

  describe("findNextInvoiceNumber", () => {
    it("zwraca 001 gdy brak faktur", () => {
      const result = findNextInvoiceNumber([], 2025, "10");
      expect(result).toBe("FV/2025/10/001");
    });

    it("inkrementuje numer gdy brak luk", () => {
      const existing = ["FV/2025/10/001", "FV/2025/10/002", "FV/2025/10/003"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/004");
    });

    it("wypełnia pierwszą lukę w numeracji", () => {
      const existing = ["FV/2025/10/001", "FV/2025/10/003", "FV/2025/10/004"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/002");
    });

    it("wypełnia lukę w środku sekwencji", () => {
      const existing = ["FV/2025/10/001", "FV/2025/10/002", "FV/2025/10/004", "FV/2025/10/005"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/003");
    });

    it("obsługuje wiele luk - wypełnia pierwszą", () => {
      const existing = ["FV/2025/10/001", "FV/2025/10/003", "FV/2025/10/005"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/002");
    });

    it("obsługuje niesortowaną listę numerów", () => {
      const existing = ["FV/2025/10/003", "FV/2025/10/001", "FV/2025/10/005"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/002");
    });

    it("obsługuje lukę na początku (brak 001)", () => {
      const existing = ["FV/2025/10/002", "FV/2025/10/003"];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/001");
    });

    it("poprawnie dodaje zera wiodące", () => {
      const existing = [
        "FV/2025/10/001",
        "FV/2025/10/002",
        "FV/2025/10/003",
        "FV/2025/10/005",
        "FV/2025/10/006",
        "FV/2025/10/007",
        "FV/2025/10/008",
      ];
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/004");
    });

    it("obsługuje numery powyżej 100", () => {
      const existing = Array.from({ length: 150 }, (_, i) => `FV/2025/10/${String(i + 1).padStart(3, "0")}`);
      const result = findNextInvoiceNumber(existing, 2025, "10");
      expect(result).toBe("FV/2025/10/151");
    });

    it("obsługuje różne formaty roku i miesiąca", () => {
      const existing = ["FV/2024/01/001", "FV/2024/01/002"];
      const result = findNextInvoiceNumber(existing, 2024, "01");
      expect(result).toBe("FV/2024/01/003");
    });
  });
});
