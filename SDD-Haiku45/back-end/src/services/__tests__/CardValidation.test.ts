import { ValidationService } from "../ValidationService";

describe("ValidationService - Card Validation", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("validateCardTitle", () => {
    test("Valid title (1-255 chars)", () => {
      expect(validationService.validateCardTitle("Task")).toBe(true);
    });

    test("Title with 1 char", () => {
      expect(validationService.validateCardTitle("A")).toBe(true);
    });

    test("Title with 255 chars", () => {
      const title = "x".repeat(255);
      expect(validationService.validateCardTitle(title)).toBe(true);
    });

    test("Title with 256+ chars", () => {
      const title = "x".repeat(256);
      expect(validationService.validateCardTitle(title)).toBe(false);
    });

    test("Empty title", () => {
      expect(validationService.validateCardTitle("")).toBe(false);
    });

    test("Title with spaces", () => {
      expect(validationService.validateCardTitle("  Task name  ")).toBe(true);
    });

    test("Title with unicode/acentos", () => {
      expect(validationService.validateCardTitle("Tarefa Açúcar")).toBe(true);
    });
  });

  describe("validateCardDescription", () => {
    test("Valid description (0-5000 chars)", () => {
      expect(validationService.validateCardDescription("Some description")).toBe(
        true
      );
    });

    test("Empty description", () => {
      expect(validationService.validateCardDescription("")).toBe(true);
    });

    test("Description with 5000 chars", () => {
      const desc = "x".repeat(5000);
      expect(validationService.validateCardDescription(desc)).toBe(true);
    });

    test("Description with 5001+ chars", () => {
      const desc = "x".repeat(5001);
      expect(validationService.validateCardDescription(desc)).toBe(false);
    });

    test("Undefined description", () => {
      expect(validationService.validateCardDescription(undefined)).toBe(true);
    });

    test("Null description", () => {
      expect(validationService.validateCardDescription(null)).toBe(true);
    });
  });

  describe("sanitizeCardTitle", () => {
    test("Preserve spaces", () => {
      const title = "  Task  ";
      expect(validationService.sanitizeCardTitle(title)).toBe("  Task  ");
    });

    test("Preserve unicode", () => {
      const title = "Açúcar 🎯";
      expect(validationService.sanitizeCardTitle(title)).toBe("Açúcar 🎯");
    });

    test("Empty string returns empty", () => {
      expect(validationService.sanitizeCardTitle("")).toBe("");
    });

    test("Undefined returns empty", () => {
      expect(validationService.sanitizeCardTitle(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCardDescription", () => {
    test("Preserve spaces", () => {
      const desc = "  Some description  ";
      expect(validationService.sanitizeCardDescription(desc)).toBe(
        "  Some description  "
      );
    });

    test("Empty string returns empty", () => {
      expect(validationService.sanitizeCardDescription("")).toBe("");
    });

    test("Undefined returns empty", () => {
      expect(validationService.sanitizeCardDescription(undefined)).toBe("");
    });

    test("Null returns empty", () => {
      expect(validationService.sanitizeCardDescription(null)).toBe("");
    });
  });
});
