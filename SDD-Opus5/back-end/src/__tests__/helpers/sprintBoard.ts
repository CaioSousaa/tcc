import { AssigneeService } from "../../services/AssigneeService";
import { CardLabelService } from "../../services/CardLabelService";
import { BoardService } from "../../services/BoardService";
import { CardService } from "../../services/CardService";
import { ChecklistService } from "../../services/ChecklistService";
import { CommentService } from "../../services/CommentService";
import { InvitationService } from "../../services/InvitationService";
import { LabelService } from "../../services/LabelService";
import { ListService } from "../../services/ListService";
import { MemberService } from "../../services/MemberService";
import { AppError } from "../../errors/AppError";
import { InMemoryAssigneeRepository } from "./InMemoryAssigneeRepository";
import { InMemoryBoardCardRepository } from "./InMemoryBoardCardRepository";
import { InMemoryBoardListRepository } from "./InMemoryBoardListRepository";
import { InMemoryBoardRepository } from "./InMemoryBoardRepository";
import { InMemoryCardLabelRepository } from "./InMemoryCardLabelRepository";
import { InMemoryChecklistRepository } from "./InMemoryChecklistRepository";
import { InMemoryCommentRepository } from "./InMemoryCommentRepository";
import { InMemoryInvitationRepository } from "./InMemoryInvitationRepository";
import { InMemoryLabelRepository } from "./InMemoryLabelRepository";
import { InMemoryMemberRepository } from "./InMemoryMemberRepository";

export const CAIO = "c0000000-0000-4000-8000-000000000001";
export const MARINA = "c0000000-0000-4000-8000-000000000002";
export const JOAO = "c0000000-0000-4000-8000-000000000003";
export const ANA = "c0000000-0000-4000-8000-000000000004";
export const BRUNO = "c0000000-0000-4000-8000-000000000005";
export const PEDRO = "c0000000-0000-4000-8000-000000000006";

export const ACCOUNTS = {
  caio: { id: CAIO, email: "caio@empresa.com" },
  marina: { id: MARINA, email: "marina@empresa.com" },
  joao: { id: JOAO, email: "joao@empresa.com" },
  ana: { id: ANA, email: "ana@empresa.com" },
  bruno: { id: BRUNO, email: "bruno@empresa.com" },
  pedro: { id: PEDRO, email: "pedro@empresa.com" },
};

export async function code(promise: Promise<unknown>): Promise<string | undefined> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error instanceof AppError ? error.code : undefined;
}

/**
 * Scenario of RF07 section 3: "Sprint" with Caio (admin, creator), Marina (admin)
 * and João (member), a pending invitation to ana@empresa.com as member, lists
 * "A fazer" and "Concluído" and the card "Refatorar filtros" in "A fazer".
 */
export async function sprintBoard() {
  const store = new InMemoryBoardRepository();
  store.addUser(CAIO, "Caio Sousa", ACCOUNTS.caio.email);
  store.addUser(MARINA, "Marina Alves", ACCOUNTS.marina.email);
  store.addUser(JOAO, "João Pereira", ACCOUNTS.joao.email);
  store.addUser(ANA, "Ana Lima", ACCOUNTS.ana.email);
  store.addUser(BRUNO, "Bruno Reis", ACCOUNTS.bruno.email);

  const memberRepo = new InMemoryMemberRepository(store);
  const assigneeRepo = new InMemoryAssigneeRepository(store);
  const labelRepo = new InMemoryLabelRepository(store);
  const cardLabelRepo = new InMemoryCardLabelRepository(store);
  const commentRepo = new InMemoryCommentRepository(store);
  const cardRepo = new InMemoryBoardCardRepository(store);
  const services = {
    boards: new BoardService(store),
    lists: new ListService(new InMemoryBoardListRepository(store)),
    cards: new CardService(cardRepo),
    checklist: new ChecklistService(new InMemoryChecklistRepository(store)),
    members: new MemberService(memberRepo),
    invitations: new InvitationService(new InMemoryInvitationRepository(store)),
    assignees: new AssigneeService(assigneeRepo),
    labels: new LabelService(labelRepo),
    cardLabels: new CardLabelService(cardLabelRepo),
    comments: new CommentService(commentRepo),
  };

  const board = await services.boards.create(CAIO, { name: "Sprint", color: "navy", withDefaultLists: false });
  const sprint = board.id;
  const aFazer = store.addList(sprint, "A fazer");
  const concluido = store.addList(sprint, "Concluído");
  const card = store.addCard(aFazer, "Refatorar filtros");

  store.addMember(sprint, MARINA, "admin");
  store.addMember(sprint, JOAO, "member");
  await services.members.invite(CAIO, sprint, { email: ACCOUNTS.ana.email, role: "member" });

  const anaInvitation = [...store.invitations.values()].find((row) => row.email === ACCOUNTS.ana.email)?.id ?? "";

  return { store, memberRepo, assigneeRepo, labelRepo, cardLabelRepo, commentRepo, cardRepo, ...services, sprint, aFazer, concluido, card, anaInvitation };
}
