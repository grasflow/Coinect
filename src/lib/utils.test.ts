import { describe, it, expect } from "vitest";
import { cn, formatHoursToHumanReadable } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("łączy klasy CSS poprawnie", () => {
      const result = cn("text-sm", "font-bold");
      expect(result).toBe("text-sm font-bold");
    });

    it("nadpisuje konfliktujące klasy Tailwind", () => {
      const result = cn("text-sm", "text-lg");
      expect(result).toBe("text-lg");
    });

    it("obsługuje klasy warunkowe", () => {
      const result = cn("base-class", false && "hidden", "visible");
      expect(result).toBe("base-class visible");
    });

    it("obsługuje undefined i null", () => {
      const result = cn("text-sm", undefined, null, "font-bold");
      expect(result).toBe("text-sm font-bold");
    });
  });

  describe("formatHoursToHumanReadable", () => {
    it("formatuje pełne godziny", () => {
      expect(formatHoursToHumanReadable(2)).toBe("2h");
      expect(formatHoursToHumanReadable(8)).toBe("8h");
    });

    it("formatuje pełne minuty", () => {
      expect(formatHoursToHumanReadable(0.5)).toBe("30m");
      expect(formatHoursToHumanReadable(1 / 6)).toBe("10m");
    });

    it("formatuje godziny i minuty", () => {
      expect(formatHoursToHumanReadable(2.5)).toBe("2h 30m");
      expect(formatHoursToHumanReadable(1.25)).toBe("1h 15m");
      expect(formatHoursToHumanReadable(27.5166666667)).toBe("27h 31m");
    });

    it("zaokrągla minuty poprawnie", () => {
      expect(formatHoursToHumanReadable(1.1666666667)).toBe("1h 10m");
      expect(formatHoursToHumanReadable(2.9833333333)).toBe("2h 59m");
    });

    it("obsługuje zera", () => {
      expect(formatHoursToHumanReadable(0)).toBe("0m");
    });
  });
});
