import { describe, it, expect } from "@jest/globals";
import { ColumnService } from "../../services/ColumnService";

describe("ColumnService.deleteColumn (Unit Test)", () => {
  it("ColumnService deve ter método deleteColumn", () => {
    const service = new ColumnService();
    expect(typeof service.deleteColumn).toBe("function");
  });

  it("ColumnService deve ter método createColumn", () => {
    const service = new ColumnService();
    expect(typeof service.createColumn).toBe("function");
  });

  it("ColumnService deve ter método updateColumn", () => {
    const service = new ColumnService();
    expect(typeof service.updateColumn).toBe("function");
  });

  it("ColumnService deve ter método getColumnsByBoard", () => {
    const service = new ColumnService();
    expect(typeof service.getColumnsByBoard).toBe("function");
  });
});
