import crypto from "crypto";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { CardAssignmentRepository } from "../repositories/CardAssignmentRepository";
import { InvitationRepository } from "../repositories/InvitationRepository";
import { BoardMember, MemberRole, MemberStatus } from "../entities/BoardMember";
import { Invitation } from "../entities/Invitation";
import { ValidationService } from "./ValidationService";

export class MemberService {
  private memberRepository: BoardMemberRepository;
  private assignmentRepository: CardAssignmentRepository;
  private invitationRepository: InvitationRepository;
  private validationService: ValidationService;

  constructor() {
    this.memberRepository = new BoardMemberRepository();
    this.assignmentRepository = new CardAssignmentRepository();
    this.invitationRepository = new InvitationRepository();
    this.validationService = new ValidationService();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async inviteMember(
    boardId: string,
    email: string,
    role: string,
    userId: string
  ): Promise<Invitation> {
    const sanitizedEmail = this.validationService.sanitizeEmail(email);

    if (!this.validationService.validateEmail(sanitizedEmail)) {
      throw new Error("Email inválido");
    }

    const userRole = await this.getMemberRole(boardId, userId);
    if (userRole !== MemberRole.ADMIN) {
      throw new Error("Apenas administradores podem convidar membros");
    }

    const validRoles = Object.values(MemberRole);
    const validatedRole = role as MemberRole;
    if (!validRoles.includes(validatedRole)) {
      throw new Error("Papel inválido");
    }

    const existingMember = await this.memberRepository.findByBoardId(boardId);
    const alreadyInvited = existingMember.find((m) => m.user?.email === sanitizedEmail);
    if (alreadyInvited && alreadyInvited.status === MemberStatus.ACTIVE) {
      throw new Error("Este email já é membro do quadro");
    }

    const existingInvitation =
      await this.invitationRepository.findActiveByBoardAndEmail(boardId, sanitizedEmail);
    if (existingInvitation) {
      throw new Error("Convite já foi enviado para este email");
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.invitationRepository.insert({
      board_id: boardId,
      email: sanitizedEmail,
      role: validatedRole,
      token,
      expires_at: expiresAt,
    });

    await this.sendInvitationEmail(sanitizedEmail, token, boardId);

    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<BoardMember> {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      throw new Error("Convite não encontrado");
    }

    const now = new Date();
    if (invitation.expires_at < now) {
      throw new Error("Convite expirado");
    }

    if (invitation.accepted_at !== null) {
      throw new Error("Convite já foi aceito");
    }

    const boardMember = await this.memberRepository.insert({
      board_id: invitation.board_id,
      user_id: userId,
      role: invitation.role as MemberRole,
      status: MemberStatus.ACTIVE,
      accepted_at: now,
      invited_at: invitation.created_at,
    });

    await this.invitationRepository.update(invitation.id, {
      accepted_at: now,
    });

    return boardMember;
  }

  async getMembersOfBoard(
    boardId: string,
    userId: string
  ): Promise<{ members: BoardMember[]; invitations: Invitation[] }> {
    const userRole = await this.getMemberRole(boardId, userId);

    if (!userRole) {
      throw new Error("Usuário não é membro deste quadro");
    }

    const members = await this.memberRepository.findByBoardId(boardId);
    const invitations = await this.invitationRepository.findByBoardId(boardId);

    return { members, invitations };
  }

  async changeMemberRole(
    boardId: string,
    memberId: string,
    newRole: string,
    userId: string
  ): Promise<void> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (userRole !== MemberRole.ADMIN) {
      throw new Error("Apenas administradores podem alterar papéis");
    }

    const member = await this.memberRepository.findById(memberId, boardId);
    if (!member) {
      throw new Error("Membro não encontrado");
    }

    const validRoles = Object.values(MemberRole);
    if (!validRoles.includes(newRole as MemberRole)) {
      throw new Error("Papel inválido");
    }

    if (member.role === MemberRole.ADMIN && newRole !== MemberRole.ADMIN) {
      const adminCount = await this.memberRepository.findAdminCount(boardId);
      if (adminCount === 1) {
        throw new Error("Não é possível remover o último administrador");
      }
    }

    await this.memberRepository.update(memberId, boardId, {
      role: newRole as MemberRole,
    });
  }

  async removeMember(
    boardId: string,
    memberId: string,
    userId: string
  ): Promise<void> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (userRole !== MemberRole.ADMIN) {
      throw new Error("Apenas administradores podem remover membros");
    }

    const member = await this.memberRepository.findById(memberId, boardId);
    if (!member) {
      throw new Error("Membro não encontrado");
    }

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.memberRepository.findAdminCount(boardId);
      if (adminCount === 1) {
        throw new Error("Não é possível remover o último administrador");
      }
    }

    await this.assignmentRepository.deleteByBoardMemberId(memberId);

    await this.memberRepository.delete(memberId, boardId);
  }

  async getMemberRole(boardId: string, userId: string): Promise<MemberRole | null> {
    const member = await this.memberRepository.findByUserAndBoard(userId, boardId);
    return member?.role || null;
  }

  private async sendInvitationEmail(
    email: string,
    token: string,
    boardId: string
  ): Promise<void> {
    const inviteLink = `${process.env.FRONTEND_URL}/invitations/${token}`;
    console.log(`[EMAIL PLACEHOLDER] Convite para ${email}: ${inviteLink}`);
  }
}
