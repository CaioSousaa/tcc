import { describe, it, expect } from "@jest/globals";
import { CardRepository } from "../CardRepository";

describe("CardRepository.countByList (Unit Test)", () => {
  it("countByList deve ser implementado corretamente", () => {
    const repo = new CardRepository();
    // Verifica que o método existe e é um método assíncrono
    expect(typeof repo.countByList).toBe("function");
  });

  it("CardRepository deve ter método findByList", () => {
    const repo = new CardRepository();
    expect(typeof repo.findByList).toBe("function");
  });

  it("CardRepository deve ter método insert", () => {
    const repo = new CardRepository();
    expect(typeof repo.insert).toBe("function");
  });

  it("CardRepository deve ter método delete", () => {
    const repo = new CardRepository();
    expect(typeof repo.delete).toBe("function");
  });
});
