import { describe, it, expect, beforeEach, vi } from "vitest";
import { RulesBuilderService, type RulesContext } from "./rules-builder.service";
import type { Database } from "@/db/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

describe("RulesBuilderService", () => {
  let service: RulesBuilderService;
  let mockProfile: Profile;
  let mockDate: Date;

  beforeEach(() => {
    service = new RulesBuilderService();
    mockDate = new Date("2024-10-14T12:00:00Z");
    vi.setSystemTime(mockDate);

    mockProfile = {
      id: "user-123",
      full_name: "Jan Kowalski",
      email: "jan@example.com",
      tax_id: "1234567890",
      country: "Poland",
      city: "Warsaw",
      postal_code: "00-001",
      street: "Test Street 1",
      bank_account: "12345678901234567890123456",
      phone: null,
      logo_url: null,
      accent_color: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
  });

  describe("generateRulesContent - Happy Path", () => {
    it("generuje podstawową zawartość z samym profilem", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Jan Kowalski");
      expect(result.content).toContain("Business Rules");
      expect(result.sections).toHaveLength(3); // header, business rules, footer
      expect(result.metadata.profileId).toBe("user-123");
      expect(result.metadata.generatedAt).toEqual(mockDate);
    });

    it("generuje pełną zawartość ze wszystkimi sekcjami", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "web",
        techStack: ["React", "TypeScript", "Tailwind CSS"],
        customRules: ["Always use functional components", "Prefer hooks over class components"],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Project Type");
      expect(result.content).toContain("Web application");
      expect(result.content).toContain("Tech Stack");
      expect(result.content).toContain("React");
      expect(result.content).toContain("Custom Rules");
      expect(result.content).toContain("functional components");
      expect(result.sections).toHaveLength(6);
    });

    it("liczy poprawnie wszystkie reguły", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: ["React", "Node.js"],
        customRules: ["Rule 1 is here", "Rule 2 is also here"],
      };

      const result = service.generateRulesContent(context);

      // Business rules: tax_id, country, city, bank_account = 4
      // Tech stack: 2
      // Custom rules: 2
      // Footer notes: 2
      expect(result.metadata.rulesCount).toBe(10);
    });
  });

  describe("generateRulesContent - Project Types", () => {
    it("generuje sekcję dla projektu webowego", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "web",
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Web application with frontend and backend");
    });

    it("generuje sekcję dla projektu mobilnego", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "mobile",
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Mobile application for iOS and/or Android");
    });

    it("generuje sekcję dla API", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "api",
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("RESTful or GraphQL API service");
    });

    it("generuje sekcję dla aplikacji desktop", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "desktop",
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Desktop application for Windows, macOS, or Linux");
    });
  });

  describe("generateRulesContent - Business Rules Section", () => {
    it("zawiera wszystkie reguły biznesowe gdy profil jest kompletny", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Tax ID (NIP): 1234567890");
      expect(result.content).toContain("Business location: Poland");
      expect(result.content).toContain("City: Warsaw");
      expect(result.content).toContain("Bank account configured: Yes");
    });

    it("pomija puste opcjonalne pola w profilu", () => {
      const minimalProfile: Profile = {
        ...mockProfile,
        tax_id: null,
        country: null,
        city: null,
        bank_account: null,
      };

      const context: RulesContext = {
        profile: minimalProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("No specific business rules configured");
      expect(result.content).not.toContain("Tax ID:");
      expect(result.content).not.toContain("Business location:");
    });

    it("pokazuje konfigurację konta bankowego gdy jest ustawione", () => {
      const profile: Profile = {
        ...mockProfile,
        bank_account: "12345678901234567890123456",
      };

      const context: RulesContext = {
        profile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Bank account configured: Yes");
    });
  });

  describe("generateRulesContent - Tech Stack", () => {
    it("formatuje tech stack jako listę", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: ["React 19", "TypeScript 5", "Astro 5"],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("## Tech Stack");
      expect(result.content).toContain("- React 19");
      expect(result.content).toContain("- TypeScript 5");
      expect(result.content).toContain("- Astro 5");
    });

    it("pomija tech stack gdy lista jest pusta", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: [],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).not.toContain("## Tech Stack");
    });

    it("trimuje whitespace z nazw technologii", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: ["  React  ", "\tTypeScript\t", "\nNode.js\n"],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("- React");
      expect(result.content).toContain("- TypeScript");
      expect(result.content).toContain("- Node.js");
    });
  });

  describe("generateRulesContent - Custom Rules", () => {
    it("formatuje custom rules jako listę", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: [
          "Always write unit tests for business logic",
          "Use TypeScript strict mode",
          "Follow accessibility guidelines",
        ],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("## Custom Rules");
      expect(result.content).toContain("- Always write unit tests");
      expect(result.content).toContain("- Use TypeScript strict mode");
      expect(result.content).toContain("- Follow accessibility guidelines");
    });

    it("pomija custom rules gdy lista jest pusta", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: [],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).not.toContain("## Custom Rules");
    });

    it("renderuje tylko reguły spełniające minimalną długość", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: ["Valid rule here", "Another valid rule here that is long enough"],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Valid rule here");
      expect(result.content).toContain("Another valid rule here");
      expect(result.content).toContain("## Custom Rules");
    });
  });

  describe("generateRulesContent - Validation Errors", () => {
    it("rzuca błąd gdy brak profilu", () => {
      const context = {
        profile: null as any,
      };

      expect(() => service.generateRulesContent(context)).toThrow("Profile is required");
    });

    it("rzuca błąd gdy brak ID profilu", () => {
      const context: RulesContext = {
        profile: { ...mockProfile, id: "" },
      };

      expect(() => service.generateRulesContent(context)).toThrow("Profile ID is required");
    });

    it("rzuca błąd gdy za dużo custom rules (>50)", () => {
      const tooManyRules = Array(51).fill("This is a valid custom rule that meets minimum length");

      const context: RulesContext = {
        profile: mockProfile,
        customRules: tooManyRules,
      };

      expect(() => service.generateRulesContent(context)).toThrow("Maximum 50 custom rules allowed");
    });

    it("rzuca błąd gdy za dużo tech stack items (>20)", () => {
      const tooManyTechs = Array(21).fill("Technology");

      const context: RulesContext = {
        profile: mockProfile,
        techStack: tooManyTechs,
      };

      expect(() => service.generateRulesContent(context)).toThrow("Maximum 20 tech stack items allowed");
    });

    it("rzuca błąd gdy custom rule jest za krótka (<10 znaków)", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: ["Valid rule here", "Short", "Another rule"],
      };

      expect(() => service.generateRulesContent(context)).toThrow("Custom rule at index 1 is too short (min 10 chars)");
    });

    it("rzuca błąd gdy custom rule jest za długa (>500 znaków)", () => {
      const longRule = "a".repeat(501);

      const context: RulesContext = {
        profile: mockProfile,
        customRules: ["Valid rule here", longRule],
      };

      expect(() => service.generateRulesContent(context)).toThrow("Custom rule at index 1 is too long (max 500 chars)");
    });

    it("rzuca błąd gdy tech stack item jest pusty", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: ["React", "", "Node.js"],
      };

      expect(() => service.generateRulesContent(context)).toThrow("Tech stack item at index 1 cannot be empty");
    });

    it("rzuca błąd gdy tech stack item zawiera tylko whitespace", () => {
      const context: RulesContext = {
        profile: mockProfile,
        techStack: ["React", "   ", "Node.js"],
      };

      expect(() => service.generateRulesContent(context)).toThrow("Tech stack item at index 1 cannot be empty");
    });
  });

  describe("generateRulesContent - Edge Cases", () => {
    it("obsługuje profil z pustym full_name", () => {
      const profile: Profile = {
        ...mockProfile,
        full_name: "",
      };

      const context: RulesContext = {
        profile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("User's Project");
    });

    it("obsługuje maksymalną dozwoloną liczbę custom rules (50)", () => {
      const maxRules = Array(50).fill("This is a valid custom rule that meets minimum length requirement");

      const context: RulesContext = {
        profile: mockProfile,
        customRules: maxRules,
      };

      expect(() => service.generateRulesContent(context)).not.toThrow();

      const result = service.generateRulesContent(context);
      expect(result.content).toContain("## Custom Rules");
    });

    it("obsługuje maksymalną dozwoloną liczbę tech stack items (20)", () => {
      const maxTechs = Array(20).fill("Technology");

      const context: RulesContext = {
        profile: mockProfile,
        techStack: maxTechs,
      };

      expect(() => service.generateRulesContent(context)).not.toThrow();
    });

    it("obsługuje custom rule o minimalnej długości (10 znaków)", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: ["1234567890"], // exactly 10 chars
      };

      expect(() => service.generateRulesContent(context)).not.toThrow();
    });

    it("obsługuje custom rule o maksymalnej długości (500 znaków)", () => {
      const maxLengthRule = "a".repeat(500);

      const context: RulesContext = {
        profile: mockProfile,
        customRules: [maxLengthRule],
      };

      expect(() => service.generateRulesContent(context)).not.toThrow();
    });

    it("obsługuje wszystkie opcjonalne pola profilu jako null", () => {
      const emptyProfile: Profile = {
        id: "user-123",
        full_name: "Test User",
        email: "test@test.com",
        tax_id: null,
        country: null,
        city: null,
        postal_code: null,
        street: null,
        phone: null,
        bank_account: null,
        logo_url: null,
        accent_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const context: RulesContext = {
        profile: emptyProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("Test User");
      expect(result.content).toContain("No specific business rules configured");
      expect(result.metadata.profileId).toBe("user-123");
    });
  });

  describe("generateRulesContent - Output Structure", () => {
    it("zwraca poprawną strukturę metadata", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.metadata).toEqual({
        generatedAt: mockDate,
        profileId: "user-123",
        rulesCount: expect.any(Number),
      });
    });

    it("zwraca sections jako tablicę stringów", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.every((section) => typeof section === "string")).toBe(true);
    });

    it("łączy sections przez podwójny newline", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toBe(result.sections.join("\n\n"));
    });

    it("zawsze zawiera header i footer", () => {
      const context: RulesContext = {
        profile: mockProfile,
      };

      const result = service.generateRulesContent(context);

      expect(result.sections[0]).toContain("AI Rules for");
      expect(result.sections[result.sections.length - 1]).toContain("## Notes");
    });
  });

  describe("generateRulesContent - Business Logic", () => {
    it("generuje spójny content przy wielokrotnym wywołaniu z tymi samymi danymi", () => {
      const context: RulesContext = {
        profile: mockProfile,
        projectType: "web",
        techStack: ["React"],
        customRules: ["Rule one here"],
      };

      const result1 = service.generateRulesContent(context);
      const result2 = service.generateRulesContent(context);

      expect(result1.content).toBe(result2.content);
      expect(result1.sections).toEqual(result2.sections);
      expect(result1.metadata.rulesCount).toBe(result2.metadata.rulesCount);
    });

    it("trimuje whitespace z custom rules przed dodaniem do listy", () => {
      const context: RulesContext = {
        profile: mockProfile,
        customRules: ["  Rule with spaces  ", "\tRule with tabs\t", "\nRule with newlines\n"],
      };

      const result = service.generateRulesContent(context);

      expect(result.content).toContain("- Rule with spaces");
      expect(result.content).toContain("- Rule with tabs");
      expect(result.content).toContain("- Rule with newlines");
      expect(result.content).not.toContain("  Rule with spaces  ");
    });
  });
});
