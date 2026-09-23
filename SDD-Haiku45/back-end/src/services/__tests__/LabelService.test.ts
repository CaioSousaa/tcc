import { LabelService } from "../LabelService";
import { LabelRepository } from "../../repositories/LabelRepository";
import { CardLabelRepository } from "../../repositories/CardLabelRepository";
import { BoardMemberRepository } from "../../repositories/BoardMemberRepository";

jest.mock("../../repositories/LabelRepository");
jest.mock("../../repositories/CardLabelRepository");
jest.mock("../../repositories/BoardMemberRepository");

describe("LabelService", () => {
  let service: LabelService;
  let mockLabelRepo: jest.Mocked<LabelRepository>;
  let mockCardLabelRepo: jest.Mocked<CardLabelRepository>;
  let mockMemberRepo: jest.Mocked<BoardMemberRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LabelService();

    mockLabelRepo = (service as any).labelRepository;
    mockCardLabelRepo = (service as any).cardLabelRepository;
    mockMemberRepo = (service as any).memberRepository;
  });

  describe("createLabel", () => {
    it("should create label with valid name and color", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        id: "m1",
        board_id: "b1",
        user_id: "u1",
        role: "admin",
        status: "active",
      } as any);

      mockLabelRepo.findByName.mockResolvedValue(null);
      mockLabelRepo.insert.mockResolvedValue({
        id: "l1",
        board_id: "b1",
        name: "Bug",
        color: "#FF0000",
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const result = await service.createLabel(
        "b1",
        "Bug",
        "#FF0000",
        "u1"
      );

      expect(result.name).toBe("Bug");
      expect(result.color).toBe("#FF0000");
      expect(mockLabelRepo.insert).toHaveBeenCalled();
    });

    it("should reject invalid hex color", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      await expect(
        service.createLabel("b1", "Bug", "red", "u1")
      ).rejects.toThrow("Cor deve ser um valor HEX válido");
    });

    it("should reject empty name", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      await expect(
        service.createLabel("b1", "", "#FF0000", "u1")
      ).rejects.toThrow("Nome deve ter entre 1 e 50 caracteres");
    });

    it("should reject duplicate name in same board", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findByName.mockResolvedValue({
        id: "l1",
        name: "Bug",
      } as any);

      await expect(
        service.createLabel("b1", "Bug", "#FF0000", "u1")
      ).rejects.toThrow("Já existe etiqueta com este nome neste quadro");
    });

    it("should reject non-admin/editor user", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "viewer",
      } as any);

      await expect(
        service.createLabel("b1", "Bug", "#FF0000", "u1")
      ).rejects.toThrow("Apenas administradores e editores podem criar etiquetas");
    });
  });

  describe("updateLabel", () => {
    it("should update label name and color", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById
        .mockResolvedValueOnce({
          id: "l1",
          name: "Bug",
          color: "#FF0000",
        } as any)
        .mockResolvedValueOnce({
          id: "l1",
          name: "BugReport",
          color: "#FF8800",
        } as any);

      mockLabelRepo.findByName.mockResolvedValue(null);
      mockLabelRepo.update.mockResolvedValue(undefined);

      const result = await service.updateLabel(
        "b1",
        "l1",
        "BugReport",
        "#FF8800",
        "u1"
      );

      expect(result.name).toBe("BugReport");
      expect(result.color).toBe("#FF8800");
    });

    it("should reject non-existent label", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateLabel("b1", "l1", "Bug", "#FF0000", "u1")
      ).rejects.toThrow("Etiqueta não encontrada");
    });
  });

  describe("deleteLabel", () => {
    it("should delete label", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue({
        id: "l1",
        name: "Bug",
      } as any);

      mockLabelRepo.delete.mockResolvedValue(undefined);

      await service.deleteLabel("b1", "l1", "u1");

      expect(mockLabelRepo.delete).toHaveBeenCalledWith("l1", "b1");
    });

    it("should reject deletion of non-existent label", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue(null);

      await expect(
        service.deleteLabel("b1", "l1", "u1")
      ).rejects.toThrow("Etiqueta não encontrada");
    });
  });

  describe("applyLabel", () => {
    it("should apply label to card", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue({
        id: "l1",
        name: "Bug",
      } as any);

      mockCardLabelRepo.findDuplicate.mockResolvedValue(null);
      mockCardLabelRepo.insert.mockResolvedValue({
        id: "cl1",
        card_id: "c1",
        label_id: "l1",
        created_at: new Date(),
      } as any);

      const result = await service.applyLabel("b1", "c1", "l1", "u1");

      expect(result.card_id).toBe("c1");
      expect(result.label_id).toBe("l1");
    });

    it("should reject duplicate label application", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue({
        id: "l1",
      } as any);

      mockCardLabelRepo.findDuplicate.mockResolvedValue({
        id: "cl1",
      } as any);

      await expect(
        service.applyLabel("b1", "c1", "l1", "u1")
      ).rejects.toThrow("Etiqueta já foi aplicada a este cartão");
    });

    it("should reject non-existent label", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockLabelRepo.findById.mockResolvedValue(null);

      await expect(
        service.applyLabel("b1", "c1", "l1", "u1")
      ).rejects.toThrow("Etiqueta não encontrada");
    });
  });

  describe("removeLabel", () => {
    it("should remove label from card", async () => {
      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockCardLabelRepo.delete.mockResolvedValue(undefined);

      await service.removeLabel("b1", "c1", "cl1", "u1");

      expect(mockCardLabelRepo.delete).toHaveBeenCalledWith("cl1");
    });
  });

  describe("getLabelsOfBoard", () => {
    it("should return labels with card counts", async () => {
      const mockLabels = [
        { id: "l1", name: "Bug", color: "#FF0000" },
        { id: "l2", name: "Feature", color: "#00FF00" },
      ];

      mockLabelRepo.findByBoardId.mockResolvedValue(mockLabels as any);
      mockLabelRepo.countByLabel.mockResolvedValueOnce(5);
      mockLabelRepo.countByLabel.mockResolvedValueOnce(8);

      const result = await service.getLabelsOfBoard("b1");

      expect(result.length).toBe(2);
      expect(result[0].card_count).toBe(5);
      expect(result[1].card_count).toBe(8);
    });
  });

  describe("getLabelsOfCard", () => {
    it("should return labels applied to card", async () => {
      const mockCardLabels = [
        {
          id: "cl1",
          label: { id: "l1", name: "Bug", color: "#FF0000" },
        },
        {
          id: "cl2",
          label: { id: "l2", name: "Feature", color: "#00FF00" },
        },
      ];

      mockCardLabelRepo.findByCardId.mockResolvedValue(mockCardLabels as any);

      const result = await service.getLabelsOfCard("c1");

      expect(result.length).toBe(2);
      expect(result[0].name).toBe("Bug");
      expect(result[1].name).toBe("Feature");
    });
  });
});
