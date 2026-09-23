import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../utils/data-source";
import { BOARD_MEMBER_ROLES, BoardMember, BoardMemberRole } from "../entities/BoardMember";
import { CardAssignee } from "../entities/CardAssignee";
import { Card } from "../entities/Card";
import { User } from "../entities/User";
import { findAccessibleBoard, requireBoardAdmin } from "../utils/ownership";

function isValidRole(role: unknown): role is BoardMemberRole {
  return (
    typeof role === "string" &&
    (BOARD_MEMBER_ROLES as readonly string[]).includes(role)
  );
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const userRepository = AppDataSource.getRepository(User);
  const memberRepository = AppDataSource.getRepository(BoardMember);

  const [owner, members] = await Promise.all([
    userRepository.findOne({ where: { id: board.ownerId } }),
    memberRepository.find({
      where: { boardId: board.id },
      relations: { user: true },
      order: { createdAt: "ASC" },
    }),
  ]);

  const rows = [
    {
      userId: owner?.id,
      name: owner?.name,
      email: owner?.email,
      role: "owner" as const,
      isOwner: true,
    },
    ...members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      isOwner: false,
    })),
  ];

  res.status(200).json({ members: rows });
}

export async function inviteMember(req: Request, res: Response): Promise<void> {
  const { email, role } = req.body as { email?: string; role?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: "E-mail é obrigatório." });
    return;
  }

  if (role !== undefined && !isValidRole(role)) {
    res.status(400).json({ error: "Papel inválido." });
    return;
  }

  const resolvedRole: BoardMemberRole =
    role !== undefined ? (role as BoardMemberRole) : "member";

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const userRepository = AppDataSource.getRepository(User);
  const targetUser = await userRepository.findOne({
    where: { email: email.trim().toLowerCase() },
  });
  if (!targetUser) {
    res.status(404).json({
      error: "Nenhum usuário encontrado com este e-mail. Ele precisa ter uma conta no Kanbo.",
    });
    return;
  }

  if (targetUser.id === board.ownerId) {
    res.status(400).json({ error: "Este usuário já é o administrador do quadro." });
    return;
  }

  const memberRepository = AppDataSource.getRepository(BoardMember);
  const existing = await memberRepository.findOne({
    where: { boardId: board.id, userId: targetUser.id },
  });
  if (existing) {
    res.status(409).json({ error: "Usuário já é membro deste quadro." });
    return;
  }

  const member = memberRepository.create({
    boardId: board.id,
    userId: targetUser.id,
    role: resolvedRole,
  });
  await memberRepository.save(member);

  res.status(201).json({
    member: {
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: member.role,
      isOwner: false,
    },
  });
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  const { role } = req.body as { role?: string };

  if (!isValidRole(role)) {
    res.status(400).json({ error: "Papel inválido." });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;
  const targetUserId = req.params.userId as string;

  if (targetUserId === board.ownerId) {
    res.status(400).json({ error: "Não é possível alterar o papel do proprietário." });
    return;
  }

  const memberRepository = AppDataSource.getRepository(BoardMember);
  const member = await memberRepository.findOne({
    where: { boardId: board.id, userId: targetUserId },
    relations: { user: true },
  });
  if (!member) {
    res.status(404).json({ error: "Membro não encontrado." });
    return;
  }

  member.role = role;
  await memberRepository.save(member);

  res.status(200).json({
    member: {
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      isOwner: false,
    },
  });
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;
  const targetUserId = req.params.userId as string;

  if (targetUserId === board.ownerId) {
    res.status(400).json({ error: "Não é possível remover o proprietário." });
    return;
  }

  const memberRepository = AppDataSource.getRepository(BoardMember);
  const member = await memberRepository.findOne({
    where: { boardId: board.id, userId: targetUserId },
  });
  if (!member) {
    res.status(404).json({ error: "Membro não encontrado." });
    return;
  }

  await memberRepository.remove(member);

  const cardRepository = AppDataSource.getRepository(Card);
  const boardCards = await cardRepository.find({ where: { boardId: board.id } });
  if (boardCards.length > 0) {
    const assigneeRepository = AppDataSource.getRepository(CardAssignee);
    await assigneeRepository.delete({
      userId: targetUserId,
      cardId: In(boardCards.map((card) => card.id)),
    });
  }

  res.status(204).send();
}
