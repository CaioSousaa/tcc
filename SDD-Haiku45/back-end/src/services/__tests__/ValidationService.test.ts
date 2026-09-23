import { ValidationService } from "../ValidationService";

describe("ValidationService", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("validateEmail", () => {
    it("deve validar email correto", () => {
      expect(validationService.validateEmail("user@example.com")).toBe(true);
    });

    it("deve rejeitar email sem @", () => {
      expect(validationService.validateEmail("userexample.com")).toBe(false);
    });

    it("deve rejeitar email sem domínio", () => {
      expect(validationService.validateEmail("user@")).toBe(false);
    });

    it("deve rejeitar string vazia", () => {
      expect(validationService.validateEmail("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("deve aceitar password com 8+ caracteres", () => {
      expect(validationService.validatePassword("ValidPass123")).toBe(true);
    });

    it("deve rejeitar password com < 8 caracteres", () => {
      expect(validationService.validatePassword("1234567")).toBe(false);
    });

    it("deve rejeitar password vazia", () => {
      expect(validationService.validatePassword("")).toBe(false);
    });

    it("deve aceitar password com espaços", () => {
      expect(validationService.validatePassword("pass word123")).toBe(true);
    });
  });

  describe("sanitizeEmail", () => {
    it("deve trimmar espaços", () => {
      expect(validationService.sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
    });

    it("deve converter para lowercase", () => {
      expect(validationService.sanitizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
    });

    it("deve trimmar e lowercase", () => {
      expect(validationService.sanitizeEmail("  USER@EXAMPLE.COM  ")).toBe("user@example.com");
    });
  });

  describe("validateColumnName", () => {
    it("deve aceitar nome válido", () => {
      expect(validationService.validateColumnName("To Do")).toBe(true);
    });

    it("deve aceitar nome com 1 caractere", () => {
      expect(validationService.validateColumnName("a")).toBe(true);
    });

    it("deve aceitar nome com 100 caracteres", () => {
      expect(validationService.validateColumnName("x".repeat(100))).toBe(true);
    });

    it("deve rejeitar nome vazio", () => {
      expect(validationService.validateColumnName("")).toBe(false);
    });

    it("deve rejeitar nome com > 100 caracteres", () => {
      expect(validationService.validateColumnName("x".repeat(101))).toBe(false);
    });

    it("deve aceitar nome com espaços", () => {
      expect(validationService.validateColumnName("  Name  ")).toBe(true);
    });

    it("deve aceitar nome com unicode", () => {
      expect(validationService.validateColumnName("Análise™")).toBe(true);
    });
  });

  describe("sanitizeColumnName", () => {
    it("deve preservar espaços", () => {
      expect(validationService.sanitizeColumnName("  Name  ")).toBe("  Name  ");
    });

    it("deve retornar vazio para null/undefined", () => {
      expect(validationService.sanitizeColumnName("")).toBe("");
    });
  });
});
