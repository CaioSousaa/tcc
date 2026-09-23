import { ChecklistService } from "../ChecklistService";
import { ChecklistRepository } from "../../repositories/ChecklistRepository";
import { ChecklistItemRepository } from "../../repositories/ChecklistItemRepository";
import { CardRepository } from "../../repositories/CardRepository";

jest.mock("../../repositories/ChecklistRepository");
jest.mock("../../repositories/ChecklistItemRepository");
jest.mock("../../repositories/CardRepository");

describe("ChecklistService", () => {
  let service: ChecklistService;
  let mockChecklistRepo: jest.Mocked<ChecklistRepository>;
  let mockChecklistItemRepo: jest.Mocked<ChecklistItemRepository>;
  let mockCardRepo: jest.Mocked<CardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChecklistRepo = ChecklistRepository as jest.Mocked<typeof ChecklistRepository>;
    mockChecklistItemRepo = ChecklistItemRepository as jest.Mocked<typeof ChecklistItemRepository>;
    mockCardRepo = CardRepository as jest.Mocked<typeof CardRepository>;

    service = new ChecklistService();
    (service as any).checklistRepository = mockChecklistRepo;
    (service as any).checklistItemRepository = mockChecklistItemRepo;
    (service as any).cardRepository = mockCardRepo;
  });

  describe("createChecklist", () => {
    it("should create a checklist for a valid card", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const userId = "user1";

      const mockCard = {
        id: cardId,
        list: { board_id: boardId },
      };

      const mockChecklist = {
        id: "checklist1",
        card_id: cardId,
      };

      mockCardRepo.findByCardId.mockResolvedValue(mockCard as any);
      mockChecklistRepo.findByCardId.mockResolvedValue(null);
      mockChecklistRepo.insert.mockResolvedValue(mockChecklist as any);

      const result = await service.createChecklist(boardId, cardId, userId);

      expect(result.id).toBe("checklist1");
      expect(mockChecklistRepo.insert).toHaveBeenCalledWith({ card_id: cardId });
    });

    it("should throw error if card not found", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const userId = "user1";

      mockCardRepo.findByCardId.mockResolvedValue(null);

      await expect(
        service.createChecklist(boardId, cardId, userId)
      ).rejects.toThrow("Card not found");
    });

    it("should throw error if checklist already exists", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const userId = "user1";

      const mockCard = {
        id: cardId,
        list: { board_id: boardId },
      };

      mockCardRepo.findByCardId.mockResolvedValue(mockCard as any);
      mockChecklistRepo.findByCardId.mockResolvedValue({} as any);

      await expect(
        service.createChecklist(boardId, cardId, userId)
      ).rejects.toThrow("already has a checklist");
    });
  });

  describe("addItem", () => {
    it("should add item with valid title", async () => {
      const checklistId = "checklist1";
      const title = "Test item";
      const userId = "user1";

      const mockChecklist = { id: checklistId };
      const mockItem = {
        id: "item1",
        checklist_id: checklistId,
        title,
        is_completed: false,
        position: 0,
      };

      mockChecklistRepo.findById.mockResolvedValue(mockChecklist as any);
      mockChecklistItemRepo.getMaxPosition.mockResolvedValue(0);
      mockChecklistItemRepo.insert.mockResolvedValue(mockItem as any);

      const result = await service.addItem(checklistId, title, userId);

      expect(result.title).toBe(title);
      expect(result.is_completed).toBe(false);
    });

    it("should throw error if title is empty", async () => {
      const checklistId = "checklist1";
      const userId = "user1";

      await expect(
        service.addItem(checklistId, "", userId)
      ).rejects.toThrow("between 1 and 500");
    });

    it("should throw error if title exceeds 500 chars", async () => {
      const checklistId = "checklist1";
      const userId = "user1";
      const longTitle = "a".repeat(501);

      await expect(
        service.addItem(checklistId, longTitle, userId)
      ).rejects.toThrow("between 1 and 500");
    });

    it("should throw error if checklist not found", async () => {
      const checklistId = "checklist1";
      const title = "Test item";
      const userId = "user1";

      mockChecklistRepo.findById.mockResolvedValue(null);

      await expect(
        service.addItem(checklistId, title, userId)
      ).rejects.toThrow("Checklist not found");
    });
  });

  describe("updateItem", () => {
    it("should update is_completed", async () => {
      const checklistId = "checklist1";
      const itemId = "item1";
      const userId = "user1";

      const mockItem = {
        id: itemId,
        checklist_id: checklistId,
        title: "Test",
        is_completed: false,
      };

      mockChecklistItemRepo.findById.mockResolvedValue(mockItem as any);
      mockChecklistItemRepo.update.mockResolvedValue(undefined);
      mockChecklistItemRepo.findById.mockResolvedValueOnce({
        ...mockItem,
        is_completed: true,
      } as any);

      const result = await service.updateItem(
        checklistId,
        itemId,
        { is_completed: true },
        userId
      );

      expect(result.is_completed).toBe(true);
    });

    it("should update title", async () => {
      const checklistId = "checklist1";
      const itemId = "item1";
      const userId = "user1";
      const newTitle = "Updated title";

      const mockItem = {
        id: itemId,
        checklist_id: checklistId,
        title: "Old title",
        is_completed: false,
      };

      mockChecklistItemRepo.findById.mockResolvedValue(mockItem as any);
      mockChecklistItemRepo.update.mockResolvedValue(undefined);
      mockChecklistItemRepo.findById.mockResolvedValueOnce({
        ...mockItem,
        title: newTitle,
      } as any);

      const result = await service.updateItem(
        checklistId,
        itemId,
        { title: newTitle },
        userId
      );

      expect(result.title).toBe(newTitle);
    });

    it("should throw error if item not found", async () => {
      const checklistId = "checklist1";
      const itemId = "item1";
      const userId = "user1";

      mockChecklistItemRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateItem(checklistId, itemId, { is_completed: true }, userId)
      ).rejects.toThrow("not found");
    });
  });

  describe("removeItem", () => {
    it("should remove item", async () => {
      const checklistId = "checklist1";
      const itemId = "item1";
      const userId = "user1";

      const mockItem = {
        id: itemId,
        checklist_id: checklistId,
        title: "Test",
        is_completed: false,
      };

      mockChecklistItemRepo.findById.mockResolvedValue(mockItem as any);
      mockChecklistItemRepo.delete.mockResolvedValue(undefined);

      await service.removeItem(checklistId, itemId, userId);

      expect(mockChecklistItemRepo.delete).toHaveBeenCalledWith(itemId);
    });

    it("should throw error if item not found", async () => {
      const checklistId = "checklist1";
      const itemId = "item1";
      const userId = "user1";

      mockChecklistItemRepo.findById.mockResolvedValue(null);

      await expect(
        service.removeItem(checklistId, itemId, userId)
      ).rejects.toThrow("not found");
    });
  });

  describe("getProgress", () => {
    it("should calculate progress correctly", async () => {
      const checklistId = "checklist1";

      mockChecklistItemRepo.countCompleted.mockResolvedValue(2);
      mockChecklistItemRepo.countAll.mockResolvedValue(5);

      const result = await service.getProgress(checklistId);

      expect(result.completed).toBe(2);
      expect(result.total).toBe(5);
      expect(result.percentage).toBe(40);
    });

    it("should return 0 percentage when total is 0", async () => {
      const checklistId = "checklist1";

      mockChecklistItemRepo.countCompleted.mockResolvedValue(0);
      mockChecklistItemRepo.countAll.mockResolvedValue(0);

      const result = await service.getProgress(checklistId);

      expect(result.percentage).toBe(0);
    });

    it("should return 100 percentage when all completed", async () => {
      const checklistId = "checklist1";

      mockChecklistItemRepo.countCompleted.mockResolvedValue(3);
      mockChecklistItemRepo.countAll.mockResolvedValue(3);

      const result = await service.getProgress(checklistId);

      expect(result.percentage).toBe(100);
    });
  });

  describe("deleteChecklist", () => {
    it("should delete checklist", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const checklistId = "checklist1";
      const userId = "user1";

      const mockCard = {
        id: cardId,
        list: { board_id: boardId },
      };

      const mockChecklist = {
        id: checklistId,
        card_id: cardId,
      };

      mockCardRepo.findByCardId.mockResolvedValue(mockCard as any);
      mockChecklistRepo.findById.mockResolvedValue(mockChecklist as any);
      mockChecklistRepo.delete.mockResolvedValue(undefined);

      await service.deleteChecklist(boardId, cardId, checklistId, userId);

      expect(mockChecklistRepo.delete).toHaveBeenCalledWith(checklistId);
    });

    it("should throw error if card not found", async () => {
      const boardId = "board1";
      const cardId = "card1";
      const checklistId = "checklist1";
      const userId = "user1";

      mockCardRepo.findByCardId.mockResolvedValue(null);

      await expect(
        service.deleteChecklist(boardId, cardId, checklistId, userId)
      ).rejects.toThrow("Card not found");
    });
  });
});
