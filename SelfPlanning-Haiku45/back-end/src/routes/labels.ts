import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { Label } from "../entities/Label";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const labelRepository = AppDataSource.getRepository(Label);
const boardRepository = AppDataSource.getRepository(Board);
const boardMemberRepository = AppDataSource.getRepository(BoardMember);

const VALID_COLORS = ["vermelho", "azul", "verde", "amarelo", "roxo", "rosa", "laranja", "cinza"];

async function checkBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const board = await boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
  if (board) return true;

  const member = await boardMemberRepository.findOne({
    where: { boardId, userId },
  });
  return !!member;
}

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

    const hasAccess = await checkBoardAccess(boardId, req.userId);
    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const { nome, cor } = req.body;

    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      res.status(400).json({ error: "Nome é obrigatório" });
      return;
    }

    if (nome.length > 30) {
      res.status(400).json({ error: "Nome não pode ter mais de 30 caracteres" });
      return;
    }

    if (!cor || !VALID_COLORS.includes(cor)) {
      res.status(400).json({ error: `Cor inválida. Válidas: ${VALID_COLORS.join(", ")}` });
      return;
    }

    const label = labelRepository.create({
      boardId,
      nome: nome.trim(),
      cor,
    });

    await labelRepository.save(label);

    res.status(201).json({
      id: label.id,
      boardId: label.boardId,
      nome: label.nome,
      cor: label.cor,
      dataCriacao: label.dataCriacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar etiqueta" });
  }
});

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

    const hasAccess = await checkBoardAccess(boardId, req.userId);
    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const labels = await labelRepository.find({
      where: { boardId },
      order: { dataCriacao: "DESC" },
    });

    res.json(
      labels.map((l) => ({
        id: l.id,
        boardId: l.boardId,
        nome: l.nome,
        cor: l.cor,
        dataCriacao: l.dataCriacao,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar etiquetas" });
  }
});

router.patch("/:labelId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;
    const labelId = Array.isArray(req.params.labelId)
      ? req.params.labelId[0]
      : req.params.labelId;

    if (!boardId || !labelId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const hasAccess = await checkBoardAccess(boardId, req.userId);
    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const label = await labelRepository.findOne({
      where: { id: labelId, boardId },
    });

    if (!label) {
      res.status(404).json({ error: "Etiqueta não encontrada" });
      return;
    }

    const { nome, cor } = req.body;

    if (nome !== undefined) {
      if (typeof nome !== "string" || nome.trim().length === 0) {
        res.status(400).json({ error: "Nome é obrigatório" });
        return;
      }
      if (nome.length > 30) {
        res.status(400).json({ error: "Nome não pode ter mais de 30 caracteres" });
        return;
      }
      label.nome = nome.trim();
    }

    if (cor !== undefined) {
      if (!VALID_COLORS.includes(cor)) {
        res.status(400).json({ error: `Cor inválida. Válidas: ${VALID_COLORS.join(", ")}` });
        return;
      }
      label.cor = cor;
    }

    await labelRepository.save(label);

    res.json({
      id: label.id,
      boardId: label.boardId,
      nome: label.nome,
      cor: label.cor,
      dataCriacao: label.dataCriacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar etiqueta" });
  }
});

router.delete("/:labelId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;
    const labelId = Array.isArray(req.params.labelId)
      ? req.params.labelId[0]
      : req.params.labelId;

    if (!boardId || !labelId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const hasAccess = await checkBoardAccess(boardId, req.userId);
    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const label = await labelRepository.findOne({
      where: { id: labelId, boardId },
    });

    if (!label) {
      res.status(404).json({ error: "Etiqueta não encontrada" });
      return;
    }

    await labelRepository.remove(label);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar etiqueta" });
  }
});

export default router;
