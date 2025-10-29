import type { Database } from "@/db/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface RulesContext {
  profile: Profile;
  projectType?: "web" | "mobile" | "api" | "desktop";
  techStack?: string[];
  customRules?: string[];
}

export interface RulesOutput {
  content: string;
  sections: string[];
  metadata: {
    generatedAt: Date;
    profileId: string;
    rulesCount: number;
  };
}

export class RulesBuilderService {
  private readonly MAX_CUSTOM_RULES = 50;
  private readonly MAX_TECH_STACK_ITEMS = 20;
  private readonly MIN_RULE_LENGTH = 10;
  private readonly MAX_RULE_LENGTH = 500;

  /**
   * Generuje zawartość pliku z regułami dla projektu
   */
  generateRulesContent(context: RulesContext): RulesOutput {
    this.validateContext(context);

    const sections: string[] = [];
    const profile = context.profile;

    // Header
    sections.push(this.generateHeader(profile));

    // Project info
    if (context.projectType) {
      sections.push(this.generateProjectTypeSection(context.projectType));
    }

    // Tech stack
    if (context.techStack && context.techStack.length > 0) {
      sections.push(this.generateTechStackSection(context.techStack));
    }

    // Business rules
    sections.push(this.generateBusinessRulesSection(profile));

    // Custom rules
    if (context.customRules && context.customRules.length > 0) {
      sections.push(this.generateCustomRulesSection(context.customRules));
    }

    // Footer
    sections.push(this.generateFooter());

    const content = sections.join("\n\n");

    return {
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        profileId: profile.id,
        rulesCount: this.countRules(sections),
      },
    };
  }

  private validateContext(context: RulesContext): void {
    if (!context.profile) {
      throw new Error("Profile is required");
    }

    if (!context.profile.id) {
      throw new Error("Profile ID is required");
    }

    if (context.customRules && context.customRules.length > this.MAX_CUSTOM_RULES) {
      throw new Error(`Maximum ${this.MAX_CUSTOM_RULES} custom rules allowed`);
    }

    if (context.techStack && context.techStack.length > this.MAX_TECH_STACK_ITEMS) {
      throw new Error(`Maximum ${this.MAX_TECH_STACK_ITEMS} tech stack items allowed`);
    }

    if (context.customRules) {
      context.customRules.forEach((rule, index) => {
        if (rule.trim().length < this.MIN_RULE_LENGTH) {
          throw new Error(`Custom rule at index ${index} is too short (min ${this.MIN_RULE_LENGTH} chars)`);
        }
        if (rule.length > this.MAX_RULE_LENGTH) {
          throw new Error(`Custom rule at index ${index} is too long (max ${this.MAX_RULE_LENGTH} chars)`);
        }
      });
    }

    if (context.techStack) {
      context.techStack.forEach((tech, index) => {
        if (!tech.trim()) {
          throw new Error(`Tech stack item at index ${index} cannot be empty`);
        }
      });
    }
  }

  private generateHeader(profile: Profile): string {
    const userName = profile.full_name || "User";
    return `# AI Rules for ${userName}'s Project\n\nGenerated automatically based on profile preferences.`;
  }

  private generateProjectTypeSection(projectType: string): string {
    const typeDescriptions: Record<string, string> = {
      web: "Web application with frontend and backend components",
      mobile: "Mobile application for iOS and/or Android",
      api: "RESTful or GraphQL API service",
      desktop: "Desktop application for Windows, macOS, or Linux",
    };

    const description = typeDescriptions[projectType] || "Custom project";

    return `## Project Type\n\n${description}`;
  }

  private generateTechStackSection(techStack: string[]): string {
    const items = techStack.map((tech) => `- ${tech.trim()}`).join("\n");
    return `## Tech Stack\n\n${items}`;
  }

  private generateBusinessRulesSection(profile: Profile): string {
    const rules: string[] = [];

    // Business info based on profile
    if (profile.tax_id) {
      rules.push(`- Tax ID (NIP): ${profile.tax_id}`);
    }

    // Location-based rules
    if (profile.country) {
      rules.push(`- Business location: ${profile.country}`);
    }

    if (profile.city) {
      rules.push(`- City: ${profile.city}`);
    }

    if (profile.bank_account) {
      rules.push(`- Bank account configured: Yes`);
    }

    if (rules.length === 0) {
      return `## Business Rules\n\n- No specific business rules configured`;
    }

    return `## Business Rules\n\n${rules.join("\n")}`;
  }

  private generateCustomRulesSection(customRules: string[]): string {
    const rules = customRules
      .filter((rule) => rule.trim().length >= this.MIN_RULE_LENGTH)
      .map((rule) => `- ${rule.trim()}`)
      .join("\n");

    return `## Custom Rules\n\n${rules}`;
  }

  private generateFooter(): string {
    return `## Notes\n\n- These rules are auto-generated and can be customized\n- Update your profile to modify default business rules`;
  }

  private countRules(sections: string[]): number {
    return sections.reduce((count, section) => {
      const matches = section.match(/^- /gm);
      return count + (matches ? matches.length : 0);
    }, 0);
  }
}
