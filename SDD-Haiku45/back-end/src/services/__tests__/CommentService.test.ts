import { CommentService } from "../CommentService";
import { CommentRepository } from "../../repositories/CommentRepository";
import { BoardMemberRepository } from "../../repositories/BoardMemberRepository";
import { CardRepository } from "../../repositories/CardRepository";

jest.mock("../../repositories/CommentRepository");
jest.mock("../../repositories/BoardMemberRepository");
jest.mock("../../repositories/CardRepository");

describe("CommentService", () => {
  let service: CommentService;
  let mockCommentRepo: jest.Mocked<CommentRepository>;
  let mockMemberRepo: jest.Mocked<BoardMemberRepository>;
  let mockCardRepo: jest.Mocked<CardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentService();

    mockCommentRepo = (service as any).commentRepository;
    mockMemberRepo = (service as any).memberRepository;
    mockCardRepo = (service as any).cardRepository;
  });

  describe("createComment", () => {
    it("should create comment with valid content", async () => {
      mockCardRepo.findByCardId.mockResolvedValue({
        id: "c1",
        list_id: "list1",
        list: { board_id: "b1" },
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        id: "m1",
        board_id: "b1",
        user_id: "u1",
        status: "active",
      } as any);

      mockCommentRepo.insert.mockResolvedValue({
        id: "comment1",
        card_id: "c1",
        user_id: "u1",
        content: "Test comment",
        created_at: new Date(),
        updated_at: new Date(),
        edited_at: null,
      } as any);

      const result = await service.createComment("b1", "c1", "Test comment", "u1");

      expect(result.content).toBe("Test comment");
      expect(mockCommentRepo.insert).toHaveBeenCalled();
    });

    it("should reject empty content", async () => {
      mockCardRepo.findByCardId.mockResolvedValue({
        id: "c1",
        list: { board_id: "b1" },
      } as any);

      await expect(
        service.createComment("b1", "c1", "", "u1")
      ).rejects.toThrow("must be between 1 and 1000");
    });

    it("should reject content over 1000 characters", async () => {
      mockCardRepo.findByCardId.mockResolvedValue({
        id: "c1",
        list: { board_id: "b1" },
      } as any);

      const longContent = "a".repeat(1001);

      await expect(
        service.createComment("b1", "c1", longContent, "u1")
      ).rejects.toThrow("must be between 1 and 1000");
    });

    it("should reject non-active member", async () => {
      mockCardRepo.findByCardId.mockResolvedValue({
        id: "c1",
        list: { board_id: "b1" },
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        id: "m1",
        board_id: "b1",
        user_id: "u1",
        status: "invited",
      } as any);

      await expect(
        service.createComment("b1", "c1", "Test", "u1")
      ).rejects.toThrow("not an active member");
    });

    it("should reject card not in board", async () => {
      mockCardRepo.findByCardId.mockResolvedValue({
        id: "c1",
        list: { board_id: "b2" },
      } as any);

      await expect(
        service.createComment("b1", "c1", "Test", "u1")
      ).rejects.toThrow("not found");
    });
  });

  describe("updateComment", () => {
    it("should update comment content and set edited_at", async () => {
      const now = new Date();
      mockCommentRepo.findById
        .mockResolvedValueOnce({
          id: "comment1",
          card_id: "c1",
          user_id: "u1",
          content: "Old content",
          created_at: now,
          updated_at: now,
          edited_at: null,
        } as any)
        .mockResolvedValueOnce({
          id: "comment1",
          card_id: "c1",
          user_id: "u1",
          content: "New content",
          created_at: now,
          updated_at: now,
          edited_at: now,
        } as any);

      mockCommentRepo.update.mockResolvedValue(undefined);

      const result = await service.updateComment("b1", "c1", "comment1", "New content", "u1");

      expect(result.content).toBe("New content");
      expect(result.edited_at).toBe(now);
    });

    it("should reject non-author edit", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        card_id: "c1",
        user_id: "u1",
        content: "Old",
      } as any);

      await expect(
        service.updateComment("b1", "c1", "comment1", "New", "u2")
      ).rejects.toThrow("author");
    });

    it("should reject content over 1000 characters on update", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        user_id: "u1",
      } as any);

      const longContent = "a".repeat(1001);

      await expect(
        service.updateComment("b1", "c1", "comment1", longContent, "u1")
      ).rejects.toThrow("must be between 1 and 1000");
    });
  });

  describe("deleteComment", () => {
    it("should delete comment by author", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        card_id: "c1",
        user_id: "u1",
        content: "Test",
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "viewer",
      } as any);

      mockCommentRepo.delete.mockResolvedValue(undefined);

      await service.deleteComment("b1", "c1", "comment1", "u1");

      expect(mockCommentRepo.delete).toHaveBeenCalledWith("comment1", "c1");
    });

    it("should delete comment by admin", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        user_id: "u1",
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "admin",
      } as any);

      mockCommentRepo.delete.mockResolvedValue(undefined);

      await service.deleteComment("b1", "c1", "comment1", "u2");

      expect(mockCommentRepo.delete).toHaveBeenCalledWith("comment1", "c1");
    });

    it("should delete comment by editor", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        user_id: "u1",
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "editor",
      } as any);

      mockCommentRepo.delete.mockResolvedValue(undefined);

      await service.deleteComment("b1", "c1", "comment1", "u2");

      expect(mockCommentRepo.delete).toHaveBeenCalledWith("comment1", "c1");
    });

    it("should reject viewer delete of other comment", async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: "comment1",
        user_id: "u1",
      } as any);

      mockMemberRepo.findByUserAndBoard.mockResolvedValue({
        role: "viewer",
      } as any);

      await expect(
        service.deleteComment("b1", "c1", "comment1", "u2")
      ).rejects.toThrow("author or admin/editor");
    });

    it("should reject delete of non-existent comment", async () => {
      mockCommentRepo.findById.mockResolvedValue(null);

      await expect(
        service.deleteComment("b1", "c1", "comment1", "u1")
      ).rejects.toThrow("not found");
    });
  });

  describe("getCommentsOfCard", () => {
    it("should return comments ordered by created_at ASC", async () => {
      const date1 = new Date("2026-09-15T10:00:00Z");
      const date2 = new Date("2026-09-15T10:05:00Z");
      const date3 = new Date("2026-09-15T10:10:00Z");

      mockCommentRepo.findByCardId.mockResolvedValue([
        {
          id: "c1",
          content: "First",
          user: { name: "Alice" },
          created_at: date1,
          updated_at: date1,
          edited_at: null,
        },
        {
          id: "c2",
          content: "Second",
          user: { name: "Bob" },
          created_at: date2,
          updated_at: date2,
          edited_at: null,
        },
        {
          id: "c3",
          content: "Third (edited)",
          user: { name: "Alice" },
          created_at: date3,
          updated_at: date3,
          edited_at: date3,
        },
      ] as any);

      const result = await service.getCommentsOfCard("c1");

      expect(result).toHaveLength(3);
      expect(result[0].author_name).toBe("Alice");
      expect(result[1].author_name).toBe("Bob");
      expect(result[2].author_name).toBe("Alice");
      expect(result[2].edited_at).toBe(date3);
    });

    it("should handle comments with no user", async () => {
      mockCommentRepo.findByCardId.mockResolvedValue([
        {
          id: "c1",
          content: "Test",
          user: null,
          created_at: new Date(),
          updated_at: new Date(),
          edited_at: null,
        },
      ] as any);

      const result = await service.getCommentsOfCard("c1");

      expect(result[0].author_name).toBe("Unknown");
    });
  });

  describe("getCommentCount", () => {
    it("should return comment count for card", async () => {
      mockCommentRepo.countByCardId.mockResolvedValue(5);

      const count = await service.getCommentCount("c1");

      expect(count).toBe(5);
    });
  });
});
