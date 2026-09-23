import { ValidationService } from "../ValidationService";

describe("ValidationService - Board", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("validateBoardName", () => {
    it("deve validar nome com 1 caractere", () => {
      expect(validationService.validateBoardName("a")).toBe(true);
    });

    it("deve validar nome com 100 caracteres", () => {
      const longName = "x".repeat(100);
      expect(validationService.validateBoardName(longName)).toBe(true);
    });

    it("deve rejeitar nome vazio", () => {
      expect(validationService.validateBoardName("")).toBe(false);
    });

    it("deve rejeitar nome com 101+ caracteres", () => {
      const longName = "x".repeat(101);
      expect(validationService.validateBoardName(longName)).toBe(false);
    });

    it("deve aceitar nome com espaços", () => {
      expect(validationService.validateBoardName("Meu Projeto")).toBe(true);
    });

    it("deve aceitar nome com caracteres especiais", () => {
      expect(validationService.validateBoardName("Projeto™")).toBe(true);
    });
  });

  describe("sanitizeBoardName", () => {
    it("deve preservar nome como está", () => {
      expect(validationService.sanitizeBoardName("  Meu Projeto  ")).toBe("  Meu Projeto  ");
    });

    it("deve retornar string vazia se null/undefined", () => {
      expect(validationService.sanitizeBoardName(null as any)).toBe("");
    });
  });
});
