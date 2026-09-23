import { Router } from "express";
import { AppDataSource } from "../database";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { Board } from "../entities/Board";
import { User } from "../entities/User";
import { MemberService } from "../services/MemberService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const { email, role } = req.body;
    const userId = req.userId!;

    if (!email || !role) {
      res.status(400).json({ error: "Email and role are required" });
      return;
    }

    const memberRepo = AppDataSource.getRepository(BoardMember);
    const boardRepo = AppDataSource.getRepository(Board);
    const userRepo = AppDataSource.getRepository(User);
    const service = new MemberService(memberRepo, boardRepo, userRepo);

    const member = await service.addMember(boardId, userId, email, role, userId);
    res.status(201).json(member);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to add member";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";

    const memberRepo = AppDataSource.getRepository(BoardMember);
    const boardRepo = AppDataSource.getRepository(Board);
    const userRepo = AppDataSource.getRepository(User);
    const service = new MemberService(memberRepo, boardRepo, userRepo);

    const members = await service.getMembers(boardId);
    res.json(members);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch members";
    res.status(400).json({ error: errorMessage });
  }
});

router.patch("/:memberId", async (req: AuthRequest, res) => {
  try {
    const rawMemberId = req.params.memberId;
    const memberId = (Array.isArray(rawMemberId) ? rawMemberId[0] : rawMemberId) || "";
    const { role } = req.body;
    const userId = req.userId!;

    if (!role) {
      res.status(400).json({ error: "Role is required" });
      return;
    }

    const memberRepo = AppDataSource.getRepository(BoardMember);
    const boardRepo = AppDataSource.getRepository(Board);
    const userRepo = AppDataSource.getRepository(User);
    const service = new MemberService(memberRepo, boardRepo, userRepo);

    const member = await service.updateMemberRole(memberId, userId, role);
    res.json(member);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update member";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:memberId", async (req: AuthRequest, res) => {
  try {
    const rawMemberId = req.params.memberId;
    const memberId = (Array.isArray(rawMemberId) ? rawMemberId[0] : rawMemberId) || "";
    const userId = req.userId!;

    const memberRepo = AppDataSource.getRepository(BoardMember);
    const boardRepo = AppDataSource.getRepository(Board);
    const userRepo = AppDataSource.getRepository(User);
    const service = new MemberService(memberRepo, boardRepo, userRepo);

    await service.removeMember(memberId, userId);
    res.json({ message: "Member removed" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to remove member";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
