import { CardService } from "../CardService";
import { CardRepository } from "../../repositories/CardRepository";
import { BoardRepository } from "../../repositories/BoardRepository";
import { ColumnRepository } from "../../repositories/ColumnRepository";
import { ValidationService } from "../ValidationService";

jest.mock("../../repositories/CardRepository");
jest.mock("../../repositories/BoardRepository");
jest.mock("../../repositories/ColumnRepository");
jest.mock("../ValidationService");

describe("CardService - Due Dates", () => {
  let service: CardService;
  let mockCardRepo: jest.Mocked<CardRepository>;
  let mockBoardRepo: jest.Mocked<BoardRepository>;
  let mockColumnRepo: jest.Mocked<ColumnRepository>;
  let mockValidationService: jest.Mocked<ValidationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCardRepo = CardRepository as jest.Mocked<typeof CardRepository>;
    mockBoardRepo = BoardRepository as jest.Mocked<typeof BoardRepository>;
    mockColumnRepo = ColumnRepository as jest.Mocked<typeof ColumnRepository>;
    mockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

    service = new CardService();
    (service as any).cardRepository = mockCardRepo;
    (service as any).boardRepository = mockBoardRepo;
    (service as any).columnRepository = mockColumnRepo;
    (service as any).validationService = mockValidationService;
  });

  describe("setDueDate", () => {
    it("should set due date for a card with valid date", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";
      const dueDate = "2026-09-20";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: userId };
      const mockCard = { id: cardId, list_id: listId };
      const updatedCard = { ...mockCard, due_date: new Date(dueDate) };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);
      mockCardRepo.findById.mockResolvedValue(mockCard as any);
      mockValidationService.validateDateFormat.mockReturnValue(true);
      mockCardRepo.updateDueDate.mockResolvedValue(void 0);
      mockCardRepo.findById.mockResolvedValueOnce(updatedCard as any);

      const result = await service.setDueDate(boardId, cardId, listId, dueDate, userId);

      expect(result.due_date).toEqual(new Date(dueDate));
      expect(mockCardRepo.updateDueDate).toHaveBeenCalledWith(cardId, listId, new Date(dueDate));
    });

    it("should reject invalid date format", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";
      const invalidDate = "invalid-date";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: userId };
      const mockCard = { id: cardId, list_id: listId };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);
      mockCardRepo.findById.mockResolvedValue(mockCard as any);
      mockValidationService.validateDateFormat.mockReturnValue(false);

      await expect(
        service.setDueDate(boardId, cardId, listId, invalidDate, userId)
      ).rejects.toThrow("Data inválida");
    });

    it("should reject if card not found", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";
      const dueDate = "2026-09-20";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: userId };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);
      mockCardRepo.findById.mockResolvedValue(null);

      await expect(
        service.setDueDate(boardId, cardId, listId, dueDate, userId)
      ).rejects.toThrow("Cartão não encontrado");
    });

    it("should reject if user is not board owner", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";
      const dueDate = "2026-09-20";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: "different-user" };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);

      await expect(
        service.setDueDate(boardId, cardId, listId, dueDate, userId)
      ).rejects.toThrow("Acesso negado");
    });
  });

  describe("removeDueDate", () => {
    it("should remove due date from a card", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: userId };
      const mockCard = { id: cardId, list_id: listId, due_date: new Date("2026-09-20") };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);
      mockCardRepo.findById.mockResolvedValue(mockCard as any);
      mockCardRepo.removeDueDate.mockResolvedValue(void 0);

      await service.removeDueDate(boardId, cardId, listId, userId);

      expect(mockCardRepo.removeDueDate).toHaveBeenCalledWith(cardId, listId);
    });

    it("should reject if card not found", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const listId = "list1";
      const userId = "user1";

      const mockList = { board_id: boardId };
      const mockBoard = { user_id: userId };

      mockColumnRepo.findByIdOnly.mockResolvedValue(mockList as any);
      mockBoardRepo.findByIdOnly.mockResolvedValue(mockBoard as any);
      mockCardRepo.findById.mockResolvedValue(null);

      await expect(
        service.removeDueDate(boardId, cardId, listId, userId)
      ).rejects.toThrow("Cartão não encontrado");
    });
  });

  describe("calculateDueStatus", () => {
    it("should return 'no_due' for null date", () => {
      const result = service.calculateDueStatus(null);
      expect(result).toBe("no_due");
    });

    it("should return 'overdue' for past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = service.calculateDueStatus(pastDate);
      expect(result).toBe("overdue");
    });

    it("should return 'due_today' for today's date", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = service.calculateDueStatus(today);
      expect(result).toBe("due_today");
    });

    it("should return 'due_soon' for future date within 7 days", () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 5);

      const result = service.calculateDueStatus(soon);
      expect(result).toBe("due_soon");
    });

    it("should return 'no_due' for future date beyond 7 days", () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);

      const result = service.calculateDueStatus(future);
      expect(result).toBe("no_due");
    });
  });

  describe("getCardsByDueFilter", () => {
    it("should call repository with correct filter parameter", async () => {
      const boardId = "board1";
      const mockCards = [{ id: "card1" }];

      mockCardRepo.findByDueFilter.mockResolvedValue(mockCards as any);

      const result = await service.getCardsByDueFilter(boardId, "overdue");

      expect(mockCardRepo.findByDueFilter).toHaveBeenCalledWith(boardId, "overdue");
      expect(result).toEqual(mockCards);
    });

    it("should handle due_today filter", async () => {
      const boardId = "board1";
      const mockCards = [];

      mockCardRepo.findByDueFilter.mockResolvedValue(mockCards as any);

      await service.getCardsByDueFilter(boardId, "due_today");

      expect(mockCardRepo.findByDueFilter).toHaveBeenCalledWith(boardId, "due_today");
    });
  });
});
