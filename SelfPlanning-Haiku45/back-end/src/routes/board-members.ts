import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { BoardMember, MemberRole } from "../entities/BoardMember";
import { Board } from "../entities/Board";
import { User } from "../entities/User";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const boardMemberRepository = AppDataSource.getRepository(BoardMember);
const boardRepository = AppDataSource.getRepository(Board);
const userRepository = AppDataSource.getRepository(User);

async function checkBoardOwnership(boardId: string, userId: string): Promise<Board | null> {
  return boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
}

async function getUserRole(boardId: string, userId: string): Promise<MemberRole | null> {
  const board = await boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
  if (board) return "owner";

  const member = await boardMemberRepository.findOne({
    where: { boardId, userId },
  });
  return member?.role || null;
}

router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;

    if (!boardId) {
      res.status(400).json({ error: "ID do quadro inválido" });
      return;
    }

    const role = await getUserRole(boardId, req.userId);
    if (!role) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const members = await boardMemberRepository.find({
      where: { boardId },
      relations: { user: true },
    });

    const board = await boardRepository.findOne({ where: { id: boardId } });
    const owner = board
      ? {
          id: board.usuarioId,
          email: (await userRepository.findOne({ where: { id: board.usuarioId } }))?.email,
          role: "owner",
        }
      : null;

    res.json({
      owner,
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        nome: m.user.nome,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar membros" });
  }
});

router.post("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;

    if (!boardId) {
      res.status(400).json({ error: "ID do quadro inválido" });
      return;
    }

    const board = await checkBoardOwnership(boardId, req.userId);
    if (!board) {
      res.status(403).json({ error: "Apenas proprietário pode convidar" });
      return;
    }

    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ error: "Email e role são obrigatórios" });
      return;
    }

    const validRoles: MemberRole[] = ["editor", "viewer", "assignee"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Role inválido" });
      return;
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    if (user.id === req.userId) {
      res.status(400).json({ error: "Não pode convidar a si mesmo" });
      return;
    }

    let member = await boardMemberRepository.findOne({
      where: { boardId, userId: user.id },
    });

    if (member) {
      res.status(400).json({ error: "Usuário já é membro" });
      return;
    }

    member = boardMemberRepository.create({
      boardId,
      userId: user.id,
      role,
    });

    await boardMemberRepository.save(member);

    res.status(201).json({
      id: member.id,
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: member.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao convidar membro" });
  }
});

router.patch(
  "/:memberId",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const boardId = Array.isArray(req.params.boardId)
        ? req.params.boardId[0]
        : req.params.boardId;
      const memberId = Array.isArray(req.params.memberId)
        ? req.params.memberId[0]
        : req.params.memberId;

      if (!boardId || !memberId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const board = await checkBoardOwnership(boardId, req.userId);
      if (!board) {
        res.status(403).json({ error: "Apenas proprietário pode mudar role" });
        return;
      }

      const member = await boardMemberRepository.findOne({
        where: { id: memberId, boardId },
        relations: { user: true },
      });

      if (!member) {
        res.status(404).json({ error: "Membro não encontrado" });
        return;
      }

      const { role } = req.body;

      const validRoles: MemberRole[] = ["editor", "viewer", "assignee"];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({ error: "Role inválido" });
        return;
      }

      if (role) {
        member.role = role;
      }

      await boardMemberRepository.save(member);

      res.json({
        id: member.id,
        userId: member.user.id,
        email: member.user.email,
        nome: member.user.nome,
        role: member.role,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar membro" });
    }
  }
);

router.delete(
  "/:memberId",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const boardId = Array.isArray(req.params.boardId)
        ? req.params.boardId[0]
        : req.params.boardId;
      const memberId = Array.isArray(req.params.memberId)
        ? req.params.memberId[0]
        : req.params.memberId;

      if (!boardId || !memberId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const board = await checkBoardOwnership(boardId, req.userId);
      if (!board) {
        res.status(403).json({ error: "Apenas proprietário pode remover" });
        return;
      }

      const member = await boardMemberRepository.findOne({
        where: { id: memberId, boardId },
      });

      if (!member) {
        res.status(404).json({ error: "Membro não encontrado" });
        return;
      }

      await boardMemberRepository.remove(member);

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover membro" });
    }
  }
);

export default router;
