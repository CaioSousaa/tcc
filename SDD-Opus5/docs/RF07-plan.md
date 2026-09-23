# RF07 — Plano técnico

**Base:** `docs/RF07-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 ao RF06 (C01–C142).
Este plano acrescenta C143–C178 e **substitui o modelo de autorização por dono** (RF02 F9/F10, C27, C29, C30; RF03 F21/C46; RF04 C69; RF06 F63/C119) pelo modelo de **participação com papel**. As alterações estão listadas em 3.5.

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF07 |
| --- | --- | --- |
| Banco | PostgreSQL | tabelas de participantes, convites e responsáveis; FKs compostas com cascata; migração de dados |
| ORM | TypeORM | migration e transações pelos bloqueios existentes |
| API | Express 5 + TypeScript | rotas de membros, convites do quadro, convites do usuário e responsáveis |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | janela "Membros do quadro", seção "Convites", "Responsáveis", avatares e ocultação por papel |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T10.** Nenhuma biblioteca de controle de acesso (CASL, AccessControl, Casbin) é adicionada. A matriz de RN05 é uma tabela pequena e fixa, implementada como função pura nos dois projetos (F78).
- **T11.** Nenhum serviço de e-mail é integrado; o envio de convites está fora de escopo.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador
  BoardsView ─ InvitationsSection ─ invitationService → /api/invitations[/:id/accept|decline]
            └ BoardCard (selo, avatares, ações por papel)
  BoardView ─ BoardHeader (Membros + avatares) ─ MembersDialog ─ memberService → /api/boards/:boardId/members|invitations
           ├ BoardLists / ListColumn (ações de lista só para admin)
           └ CardDialog ─ AssigneesSection ─ assigneeService → /api/boards/:boardId/cards/:cardId/assignees/:userId
  lib/permissions.ts (matriz RN05 no cliente, só para ocultar controles)

API
  toda rota de quadro → authenticate → … → Service
     → runInBoardLock / runInCardLock / leitura escopada: resolvem PARTICIPAÇÃO e PAPEL
     → domain/permissions.assertCan(role, action)
```

### 2.2 Autorização: regras de fronteira obrigatórias

- **F77.** `BoardScope` passa a ser `{ userId }`. **Nenhuma** consulta de autorização usa `boards.owner_id`. O acesso é sempre dado pela existência de uma linha em `board_members` para `(board_id, user_id)`. A coluna `owner_id` permanece apenas como registro de quem criou o quadro (D30).
- **F78.** A matriz de RN05 é implementada **uma única vez no back-end**, em `domain/permissions.ts`:
  - `BoardAction`: união fechada de ações, por exemplo `board.update`, `board.delete`, `list.manage`, `card.write`, `checklist.write`, `assignee.write`, `members.manage`, `members.leave`, `labels.manage`, `labels.apply`, `comments.write`, `dueDate.write`;
  - `can(role, action): boolean`;
  - `assertCan(role, action)`, que lança `FORBIDDEN`.

  Os serviços chamam `assertCan` e nunca comparam papéis diretamente.
- **F79.** A resolução de acesso retorna o **papel** junto com a confirmação de participação, na mesma instrução que adquire o bloqueio:
  - **`runInBoardLock`:** `SELECT m.role FROM boards b JOIN board_members m ON m.board_id = b.id AND m.user_id = :userId WHERE b.id = :boardId FOR UPDATE OF b`. Sem linha, o resultado é `{ found: false }`; com linha, `work` recebe o papel.
  - **`runInCardLock`:** resolve o papel pela participação (sem bloqueio do quadro) e depois bloqueia o card, como no RF06.
  - **Leituras sem bloqueio** (quadro, card, membros): filtram por participação e devolvem o papel quando necessário.
- **F80.** Ordem de avaliação em toda rota de quadro:
  1. sessão;
  2. formato de `boardId`;
  3. validação de corpo ou query;
  4. **participação** (`BOARD_NOT_FOUND`);
  5. **permissão do papel** (`FORBIDDEN`);
  6. existência de recursos internos (lista, card, item, participante, convite);
  7. regras de estado (último Administrador, limite, duplicidade).

  Assim, um não participante nunca recebe `FORBIDDEN`, que revelaria a existência do quadro (RN02).
- **F81.** O papel usado na verificação é sempre o lido **dentro** da operação (RN06). Nenhum papel enviado pelo cliente ou guardado em sessão é considerado.
- **F82.** Toda escrita que altera participação ou papel (convidar, alterar papel de convite ou de participante, cancelar convite, remover, sair, aceitar) roda em `runInBoardLock` do quadro. É isso que serializa RN04 (último Administrador), RN12 (limite), a duplicidade de convite (CB11) e o aceite concorrente com o cancelamento (CB12).
- **F83.** A remoção de atribuições quando alguém deixa o quadro é feita **pelo banco**, por FK composta de `card_assignees (board_id, user_id)` para `board_members (board_id, user_id)` com `ON DELETE CASCADE` (D32). Nenhum serviço apaga atribuições explicitamente ao remover participante.

### 2.3 Back-end: componentes

```
back-end/src/
  domain/permissions.ts            BoardRole, BoardAction, can, assertCan
  domain/members.ts                MemberView, InvitationView, UserInvitationView, AssigneeRef, limites
  migrations/<ts>-BoardMembersInvitationsAssignees.ts
  entities/BoardMember.ts, BoardInvitation.ts, CardAssignee.ts
  repositories/boardLock.ts        alterado: participação + papel (F79)
  repositories/cardLock.ts         alterado: participação + papel
  repositories/MemberRepository.ts MemberTransaction (primitivas) + leitura escopada
  repositories/InvitationRepository.ts leitura por e-mail + aceite/recusa
  repositories/AssigneeRepository.ts   primitivas sobre card_assignees no card bloqueado
  services/MemberService.ts        listar, convidar, alterar papel, cancelar, remover, sair
  services/InvitationService.ts    convites do usuário, aceitar, recusar
  services/AssigneeService.ts      atribuir, remover
  controllers/MemberController.ts, InvitationController.ts, AssigneeController.ts
  routes/member.routes.ts          /api/boards/:boardId/members, /invitations
  routes/invitation.routes.ts      /api/invitations
  routes/assignee.routes.ts        /api/boards/:boardId/cards/:cardId/assignees
  schemas/member.schemas.ts
  services/BoardService.ts, ListService.ts, CardService.ts, ChecklistService.ts   alterados: assertCan
  repositories/BoardRepository.ts, listsWithCards.ts, BoardCardRepository.ts      alterados: participação e novos campos
```

Primitivas de `MemberTransaction`, restritas ao quadro bloqueado:

| Primitiva | Efeito |
| --- | --- |
| `listMembers()` | participantes com nome, e-mail, papel e data de entrada, ordenados por `joined_at, user_id` |
| `listInvitations()` | convites pendentes ordenados por `created_at, id` |
| `countPeople()` | participantes + convites |
| `countAdmins()` | participantes com papel `admin` |
| `findMember(userId)` | participante ou `null` |
| `isMemberEmail(email)` | existe participante cuja conta tem esse e-mail |
| `findInvitation(invitationId)` / `findInvitationByEmail(email)` | convite deste quadro ou `null` |
| `insertInvitation`, `updateInvitationRole`, `deleteInvitation` | escrita de convites |
| `updateMemberRole`, `deleteMember` | escrita de participantes |
| `insertMember(userId, role)` | usada no aceite |

- **F84.** `MemberService` contém RN04, RN07, RN10, RN12 e a regra "remover a si mesmo = sair". Primitivas não contêm regra.
- **F85.** A criação de quadro (RF02) insere o criador em `board_members` como `admin` **na mesma transação** da criação do quadro e das listas padrão (RF02 F12, RN01).

### 2.4 Algoritmos

Todos dentro de `runInBoardLock` do quadro, depois da resolução de participação (F80).

**Convidar (RN07, RN12, CB08, CB11):**
1. `assertCan(role, "members.manage")`.
2. `isMemberEmail(email)` → `ALREADY_MEMBER`.
3. `findInvitationByEmail(email)` → `INVITATION_ALREADY_PENDING`.
4. `countPeople() >= 50` → `MEMBER_LIMIT_REACHED`.
5. `insertInvitation({ id, email, role, invitedBy: userId })`.
6. Responder com o estado completo da janela (4.3).

**Alterar papel de participante (RN04, CB07):**
1. `assertCan(role, "members.manage")`.
2. `findMember(targetUserId)` ausente → `MEMBER_NOT_FOUND`.
3. Se o alvo é `admin`, o novo papel é `member` e `countAdmins() = 1` → `LAST_ADMIN`.
4. `updateMemberRole`.
5. Responder com o estado completo.

**Alterar papel e cancelar convite:** `assertCan(role, "members.manage")` → `findInvitation` ausente → `INVITATION_NOT_FOUND` → escrita → estado completo.

**Remover participante ou sair (RN04, RN10):**
1. **Se o alvo é o próprio usuário**, é "sair": `assertCan(role, "members.leave")`. Caso contrário, `assertCan(role, "members.manage")`.
2. `findMember(targetUserId)` ausente → `MEMBER_NOT_FOUND`.
3. Se o alvo é `admin` e `countAdmins() = 1` → `LAST_ADMIN`.
4. `deleteMember`: a cascata remove as atribuições (F83).
5. Responder com o estado completo, ou `{ left: true }` quando foi saída.

**Aceitar convite (RN08, RN09, CB12):**
1. Ler o convite por `id` **e** e-mail igual ao e-mail da sessão, sem bloqueio, para descobrir o quadro; ausente → `INVITATION_NOT_FOUND`.
2. `runInBoardLock` do quadro **sem exigir participação** (variante `runInBoardLockForInvitation`, que bloqueia só pelo `id` do quadro). Quadro ausente → `INVITATION_NOT_FOUND` (CB19).
3. Reler o convite por `id` e e-mail dentro do bloqueio; ausente → `INVITATION_NOT_FOUND`.
4. Se a conta já é participante (caso defensivo), só apaga o convite; senão, `insertMember(userId, invitation.role)` e `deleteInvitation`.
5. Responder com o `BoardSummary` do quadro para o usuário.

**Recusar convite:** passos 1 a 3 do aceite, seguidos de `deleteInvitation`.

**Atribuir e remover responsável (RN11, CB16):** dentro de `runInCardLock`:
1. `assertCan(role, "assignee.write")`.
2. Atribuir: `targetUserId` malformado ou não participante → `ASSIGNEE_NOT_MEMBER`; `INSERT ... ON CONFLICT DO NOTHING`.
3. Remover: `DELETE` idempotente.
4. Responder com a lista de responsáveis do card.

- **F86.** O limite de 50 pessoas conta participantes e convites no mesmo bloqueio, então dois convites simultâneos no 49º nunca produzem 51 pessoas (CB08).
- **F87.** A unicidade `UNIQUE (board_id, email)` de convites é a última barreira contra CB11; sua violação é traduzida para `INVITATION_ALREADY_PENDING`.

### 2.5 Front-end: componentes

```
front-end/src/
  lib/permissions.ts                 matriz RN05 no cliente (só exibição)
  lib/members.ts                     avatares visíveis e "+K", textos de estado, ordenação, tabela de falhas
  services/memberService.ts, invitationService.ts, assigneeService.ts
  schemas/member.ts                  e-mail do convite (regra do RF01)
  components/members/
    Avatar.tsx, AvatarStack.tsx      iniciais (lib/initials do RF01) e "+K"
    MembersDialog.tsx                janela "Membros do quadro"
    InviteForm.tsx
    MemberRow.tsx, InvitationRow.tsx
    ConfirmRemoveDialog.tsx
  components/invitations/InvitationsSection.tsx
  components/cards/AssigneesSection.tsx
  alterados: BoardsView, BoardCard, BoardView, BoardHeader, BoardLists, ListColumn, CardFace, CardDialog
```

Regras de fronteira obrigatórias:

- **F88.** A interface decide o que exibir com `can(myRole, action)` de `lib/permissions.ts`, sempre a partir do `myRole` vindo da API: `BoardSummary.myRole` na listagem e `BoardDetail.myRole` no quadro. Essa matriz serve **só** para ocultar controles; nunca substitui a verificação do servidor (RN06).
- **F89.** Ocultação por papel, via `can`:

| Componente | Controle | Ação exigida |
| --- | --- | --- |
| `BoardCard` | editar e excluir quadro | `board.update` / `board.delete` |
| `BoardHeader` | editar quadro | `board.update` |
| `BoardLists` | "Adicionar lista" | `list.manage` |
| `ListColumn` | editar e excluir lista | `list.manage` |
| `MembersDialog` | formulário de convite, seletores de papel, remover, cancelar | `members.manage` |

- **F90.** `FORBIDDEN` recebido em qualquer operação do quadro:
  - mantém a janela ou o formulário aberto com a mensagem;
  - **recarrega o quadro**, o que atualiza `myRole` e esconde os controles (CA40).

  Se a janela aberta é de uma ação que o novo papel não permite, ela é fechada após a recarga.
- **F91.** `MembersDialog` carrega o estado com `GET` ao abrir e substitui o estado local pela resposta de cada ação (CB18). Ações com resultado de "sair", ou que removem o próprio usuário, levam a `/boards`.
- **F92.** A seção "Convites" é carregada junto com a listagem de quadros, em paralelo e de forma independente: uma falha nos convites não impede a grade. Ao aceitar, o `BoardSummary` retornado é **inserido no início** da grade (CA12). Ao recusar ou receber `INVITATION_NOT_FOUND`, o convite é removido da seção (CA16).
- **F93.** `AssigneesSection` segue o padrão da checklist (RF06 C133–C137):
  - salvamento imediato, sem atualização otimista;
  - controle pendente por participante;
  - atualização da face via `onAssigneesChange(cardId, assigneeIds)`;
  - independência do "Salvar card".
- **F94.** Avatares:
  - são derivados de `BoardDetail.members`, a lista de participantes com `userId`, nome e papel;
  - a face do card resolve `assigneeIds` por essa lista;
  - um id sem participante correspondente, por dado desatualizado, não é exibido.
- **F95.** Mensagens, estados e o "+K" dos avatares vêm de funções puras de `lib/members.ts`:
  - `visibleAvatars(list, max)` retorna `{ shown, extra }`;
  - `memberStatus(member, currentUserId)` retorna "você" ou "ativo";
  - `boardsSubtitle(boards)` monta o subtítulo;
  - `memberFailureAction(operation, error)` define o tratamento de falhas.

---

## 3. Modelo de dados e schema

### 3.1 Tabela `board_members`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `board_id` | `uuid` | `NOT NULL`, FK → `boards.id` `ON DELETE CASCADE` |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` `ON DELETE RESTRICT` |
| `role` | `varchar(16)` | `NOT NULL`, `CHECK (role IN ('admin', 'member'))` |
| `joined_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Chave primária `(board_id, user_id)`. Índice `IDX_board_members_user` em `(user_id, board_id)`, para a listagem.

### 3.2 Tabela `board_invitations`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `board_id` | `uuid` | `NOT NULL`, FK → `boards.id` `ON DELETE CASCADE` |
| `email` | `varchar(254)` | `NOT NULL`, já normalizado |
| `role` | `varchar(16)` | `NOT NULL`, `CHECK (role IN ('admin', 'member'))` |
| `invited_by` | `uuid` | `NOT NULL`, FK → `users.id` `ON DELETE RESTRICT` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Restrição `UQ_board_invitations_board_email UNIQUE (board_id, email)`. Índice `IDX_board_invitations_email` em `(email, created_at DESC)`.

### 3.3 Tabela `card_assignees`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `card_id` | `uuid` | `NOT NULL`, FK → `cards.id` `ON DELETE CASCADE` |
| `board_id` | `uuid` | `NOT NULL` |
| `user_id` | `uuid` | `NOT NULL` |
| `assigned_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Chave primária `(card_id, user_id)`. FK composta `(board_id, user_id)` → `board_members (board_id, user_id)` `ON DELETE CASCADE`. Índice `IDX_card_assignees_board_user` em `(board_id, user_id)`.

### 3.4 Restrições de modelagem

- **D30.** `boards.owner_id` é mantido como "criado por" e continua `NOT NULL` com `RESTRICT`, mas **não participa de autorização** (F77). O índice `IDX_boards_owner_created` deixa de servir à listagem e é mantido só para compatibilidade. A remoção da coluna fica fora deste requisito.
- **D31.** Migração de dados na mesma migration: `INSERT INTO board_members (board_id, user_id, role, joined_at) SELECT id, owner_id, 'admin', created_at FROM boards` (RN01).
- **D32.** `card_assignees.board_id` é redundante com o quadro do card, mas **imutável e sempre correto**: um card nunca muda de quadro (RF04 RN01, D23), e a inserção grava `board_id` a partir de `cards JOIN lists` do card bloqueado, nunca a partir do cliente. Essa redundância habilita a FK composta de F83, que garante RN10 e RN11 no banco: não existe atribuição de quem não é participante.
- **D33.** O convite guarda o e-mail, e não o `user_id`, porque pode ser enviado a e-mail sem conta (spec 2.4). O vínculo com a conta acontece no aceite, comparando com o e-mail da sessão. O e-mail de uma conta não muda (RF01 RN14).
- **D34.** Ordem de participantes: `joined_at, user_id`. Ordem de convites: `created_at, id`. Ordem de responsáveis: `assigned_at, user_id` (RN13).
- **D35.** Exclusão do quadro remove participantes, convites e atribuições por cascata (RN15). Exclusão de card e de lista em cascata removem atribuições por `card_id` (RF04, RF05).

### 3.5 Alterações em decisões e contratos anteriores

| Anterior | Nova regra |
| --- | --- |
| RF02 F9/F10, C27, C29, C30 — escopo e autorização por `owner_id` | Escopo por participação (F77); autorização por papel (F78); `ownerId` continua fora das respostas |
| RF02 N28 — "nenhum caminho lê quadro sem `owner_id` no filtro" | "Nenhum caminho lê quadro sem participação do usuário no filtro" |
| RF02 `BoardService.create` | Insere o criador como `admin` na mesma transação (F85) |
| RF02 `update`/`delete` do quadro em instrução única escopada | Executados em `runInBoardLock`, com `assertCan` antes da escrita |
| RF03 F21/C46, RF04 C69 — bloqueio escopado por dono | Bloqueio escopado por participação, com papel (F79) |
| RF06 F63/C119 — `runInCardLock` por dono | Por participação, com papel |
| RF02 `BoardSummary` | Ganha `myRole`, `memberCount`, `memberPreview` (até 4, `{ userId, name }`) |
| RF02 `BoardDetail` | Ganha `myRole` e `members` (todos os participantes, `{ userId, name, email, role }`) |
| RF04 `CardSummary` | Ganha `assigneeIds` (ordem de atribuição) |
| RF04 `CardDetail` | Ganha `assignees` (`{ userId, name }`, ordem de atribuição) |

---

## 4. Interfaces: API e contratos

### 4.1 Representações

| Representação | Campos |
| --- | --- |
| `MemberView` | `userId`, `name`, `email`, `role` (`"admin"` / `"member"`), `joinedAt` |
| `InvitationView` | `id`, `email`, `role`, `createdAt` |
| `MembersState` | `{ myRole, members: MemberView[], invitations: InvitationView[] }` |
| `UserInvitationView` | `id`, `role`, `createdAt`, `board: { id, name, color }`, `invitedBy: { name }` |
| `AssigneeRef` | `userId`, `name` |

### 4.2 `GET /api/boards/:boardId/members`

Qualquer participante. `200` com `MembersState`. Não participante → `404 BOARD_NOT_FOUND`.

### 4.3 Convites do quadro

| Rota | Permissão | Corpo | Sucesso |
| --- | --- | --- | --- |
| `POST /api/boards/:boardId/invitations` | `members.manage` | `{ email, role? }` (`role` ausente = `"member"`, CB04) | `201` `MembersState` |
| `PATCH /api/boards/:boardId/invitations/:invitationId` | `members.manage` | `{ role }` | `200` `MembersState` |
| `DELETE /api/boards/:boardId/invitations/:invitationId` | `members.manage` | — | `200` `MembersState` |

### 4.4 Participantes

| Rota | Permissão | Corpo | Sucesso |
| --- | --- | --- | --- |
| `PATCH /api/boards/:boardId/members/:userId` | `members.manage` | `{ role }` | `200` `MembersState` |
| `DELETE /api/boards/:boardId/members/:userId` | outro: `members.manage`; o próprio usuário: `members.leave` | — | outro: `200` `MembersState`; o próprio: `200` `{ "left": true }` |

- **A53.** Sair do quadro é `DELETE .../members/:userId` com o próprio `userId`, e não uma rota separada, porque o efeito sobre os dados é idêntico. A diferença de permissão e de resposta fica no serviço.
- **A54.** `DELETE` de convite ou participante que não existe responde `404` (`INVITATION_NOT_FOUND` / `MEMBER_NOT_FOUND`), e o front-end trata o caso como sucesso e recarrega o estado (CB17), como em A26, A33, A39 e A50.

### 4.5 Convites do usuário

| Rota | Efeito | Sucesso |
| --- | --- | --- |
| `GET /api/invitations` | convites cujo e-mail é o da sessão, do mais recente para o mais antigo (CB09) | `200` `{ invitations: UserInvitationView[] }` |
| `POST /api/invitations/:invitationId/accept` | aceite (2.4) | `200` `{ board: BoardSummary }` |
| `POST /api/invitations/:invitationId/decline` | recusa | `204` |

Convite inexistente, de outro e-mail, de quadro excluído ou com `invitationId` malformado → `404 INVITATION_NOT_FOUND` (RN08).

### 4.6 Responsáveis

| Rota | Permissão | Sucesso |
| --- | --- | --- |
| `PUT /api/boards/:boardId/cards/:cardId/assignees/:userId` | `assignee.write` | `200` `{ assignees: AssigneeRef[] }` (idempotente) |
| `DELETE /api/boards/:boardId/cards/:cardId/assignees/:userId` | `assignee.write` | `200` `{ assignees: AssigneeRef[] }` (idempotente, sem 404 para quem não é responsável) |

`userId` malformado ou não participante no `PUT` → `409 ASSIGNEE_NOT_MEMBER`.

- **A55.** `PUT`/`DELETE` no recurso da atribuição tornam a operação naturalmente idempotente (RN11, CB16): repetir não gera erro nem duplicidade.

### 4.7 Alterações de contratos existentes

- `GET /api/boards`: cada `BoardSummary` ganha `myRole`, `memberCount` e `memberPreview`.
- `GET /api/boards/:boardId`: `BoardDetail` ganha `myRole` e `members`; cada `CardSummary` ganha `assigneeIds`.
- `GET` e `PATCH` do card: `CardDetail.assignees`.
- `POST /api/boards`: a resposta já traz `myRole: "admin"` e o criador em `members`.
- Todas as rotas de quadro, lista, card e checklist podem responder `403 FORBIDDEN` conforme RN05.

### 4.8 Erros

- **A56.** Novos códigos:

| Código | Status | Mensagem |
| --- | --- | --- |
| `FORBIDDEN` | 403 | "Você não tem permissão para esta ação." |
| `LAST_ADMIN` | 409 | "O quadro precisa ter pelo menos um administrador." |
| `ALREADY_MEMBER` | 409 | "Essa pessoa já participa do quadro." |
| `INVITATION_ALREADY_PENDING` | 409 | "Já existe um convite pendente para esse e-mail." |
| `MEMBER_LIMIT_REACHED` | 409 | "O quadro atingiu o limite de 50 pessoas." |
| `INVITATION_NOT_FOUND` | 404 | "Convite não encontrado." |
| `MEMBER_NOT_FOUND` | 404 | "Participante não encontrado." |
| `ASSIGNEE_NOT_MEMBER` | 409 | "Essa pessoa não participa do quadro." |

- **A57.** Mensagens de campo:
  - `email`: vazio → "Campo obrigatório."; formato inválido → "Informe um e-mail válido.", com a mesma regra do RF01;
  - `role`: diferente de `admin` e `member` → "Valor inválido.".
- **A58.** O front-end exibe `ALREADY_MEMBER`, `INVITATION_ALREADY_PENDING` e `MEMBER_LIMIT_REACHED` junto ao campo de e-mail (spec 2.4).

### 4.9 Front-end: serviços

| Serviço | Funções |
| --- | --- |
| `memberService` | `get(boardId)`, `invite(boardId, email, role)`, `updateInvitation(boardId, id, role)`, `cancelInvitation(boardId, id)`, `updateMember(boardId, userId, role)`, `removeMember(boardId, userId)` |
| `invitationService` | `list()`, `accept(id)`, `decline(id)` |
| `assigneeService` | `assign(boardId, cardId, userId)`, `unassign(boardId, cardId, userId)` |

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `GET /api/boards` | < 200 ms | 200 quadros, 50 pessoas cada |
| `GET /api/boards/:boardId` | < 220 ms | 2.000 cards, 50 participantes, 20.000 itens |
| Operações de membros e convites | < 100 ms | 50 pessoas |
| Atribuir e remover responsável | < 60 ms | — |

- **N135.** A listagem continua em **uma** instrução (RF02 N23). Ela filtra por `EXISTS` em `board_members` do usuário, com `myRole` por `JOIN`, `memberCount` por subconsulta e `memberPreview` por subconsulta ordenada e limitada a 4 com agregação em JSON.
- **N136.** O quadro aberto usa no máximo quatro instruções: resumo com papel, participantes, listas e cards com contagens de checklist e `assigneeIds` agregados na **mesma** instrução de cards (RF06 N112).
- **N137.** Cada operação de membros usa um número constante de instruções, independente da quantidade de pessoas: bloqueio com papel, verificações por índice, escrita e releitura do estado.
- **N138.** Todos os filtros de participação usam a chave primária `(board_id, user_id)` ou `IDX_board_members_user`.

### 5.2 Segurança

- **N139.** Nenhuma autorização por `owner_id` (F77). Um teste de revisão verifica que `owner_id` só aparece em migrations, na entidade e na inserção do quadro.
- **N140.** Não participante recebe `BOARD_NOT_FOUND` antes de qualquer verificação de papel (F80), inclusive nas rotas de membros e convites do quadro.
- **N141.** Convite só é visível, aceito ou recusado pela conta com o mesmo e-mail (RN08). Qualquer outra conta recebe `INVITATION_NOT_FOUND`, sem distinguir "não existe" de "não é seu".
- **N142.** Papel verificado dentro da transação, depois do bloqueio (F81). Rebaixamentos concorrentes com ações são decididos pela ordem de processamento.
- **N143.** Atribuição só a participante garantida pelo serviço e pela FK composta (D32).
- **N144.** Nomes, e-mails e nomes de quadros renderizados como texto (CB10).
- **N145.** A listagem de membros expõe e-mails só a participantes do próprio quadro. O convite do usuário expõe apenas o nome de quem convidou, e não o e-mail.

### 5.3 Integridade e concorrência

- **N146.** RN04 serializada pelo bloqueio do quadro (F82). Dois rebaixamentos simultâneos terminam com exatamente um Administrador (CA21).
- **N147.** RN12 e CB11 serializados pelo mesmo bloqueio, com a unicidade `(board_id, email)` como última barreira.
- **N148.** Aceite e cancelamento concorrentes serializados pelo bloqueio do quadro do convite (CB12). O aceite insere o participante e apaga o convite na mesma transação (RN09).
- **N149.** Remoção e saída apagam a participação e, por cascata, as atribuições, em uma instrução (RN10, CE05).
- **N150.** A atribuição usa `ON CONFLICT DO NOTHING` sob o bloqueio do card (CB16).

### 5.4 Interface e acessibilidade

- **N151.** `Avatar` tem `aria-label` com o nome completo. O "+K" tem rótulo "e mais {K} pessoas".
- **N152.** Seletores de papel nativos (`<select>`) com rótulo "Papel de {nome}". Ações de remover e cancelar têm rótulos "Remover {nome}" e "Cancelar convite de {e-mail}".
- **N153.** A lista de atribuição é um grupo de `<input type="checkbox">`, cada um rotulado pelo nome do participante.
- **N154.** O selo "ADMIN"/"MEMBRO" é texto, e não só cor.
- **N155.** O layout segue `prototipo/modais/membros.png`: formulário em linha com e-mail, papel e "Convidar"; linhas com avatar, nome, e-mail, estado, seletor e lixeira. Segue também os avatares de `meus-quadros.png` e `quadro.png`.

### 5.5 Testabilidade

- **N156.** `domain/permissions.ts` e `lib/permissions.ts` testados linha a linha contra a tabela de RN05, com a mesma tabela de casos nos dois projetos.
- **N157.** Serviços testados com repositórios em memória que reproduzem participação, bloqueio por quadro (fila), cascata de atribuições ao remover participante e unicidade de convites. Casos obrigatórios:
  - último Administrador, inclusive concorrente;
  - limite concorrente;
  - aceite contra cancelamento;
  - ordem `BOARD_NOT_FOUND` antes de `FORBIDDEN`.
- **N158.** Os testes de RF02 a RF06 que usavam `ownerId` passam a usar participação. Novos testes de "Membro recebe `FORBIDDEN`" cobrem cada serviço de gerenciamento.
- **N159.** Integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - migração de donos para Administradores;
  - FK composta removendo atribuições;
  - rebaixamentos concorrentes;
  - limite concorrente;
  - listagem com prévia de avatares em uma instrução.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C143 | Nenhuma dependência nova; matriz de permissões como função pura |
| C144 | Tabelas `board_members`, `board_invitations`, `card_assignees` com `CHECK`s, unicidades, FKs e cascatas de 3.1–3.3; migration reversível com migração de donos |
| C145 | `BoardScope = { userId }`; nenhuma autorização por `owner_id` |
| C146 | Matriz RN05 em `domain/permissions.ts`, com `assertCan`; serviços nunca comparam papéis diretamente |
| C147 | Participação e papel resolvidos na mesma instrução do bloqueio ou da leitura escopada |
| C148 | Ordem: sessão → `boardId` → corpo → participação → permissão → recursos → estado |
| C149 | Papel sempre lido no processamento; nunca do cliente |
| C150 | Escritas de participação e papel em `runInBoardLock` |
| C151 | Criação de quadro insere o criador como `admin` na mesma transação |
| C152 | Último Administrador protegido em alterar papel, remover e sair (`409 LAST_ADMIN`) |
| C153 | Limite de 50 pessoas contado sob bloqueio (`409 MEMBER_LIMIT_REACHED`) |
| C154 | Convite por e-mail normalizado; `UNIQUE (board_id, email)`; sem vínculo a conta até o aceite |
| C155 | Convite do usuário acessível só pelo e-mail da sessão; `404 INVITATION_NOT_FOUND` para qualquer outro caso |
| C156 | Aceite insere participante e apaga convite na mesma transação, sob o bloqueio do quadro |
| C157 | Sair = `DELETE members/:userId` com o próprio id; permissão `members.leave` |
| C158 | Atribuições removidas pela FK composta ao remover participante; nenhum serviço as apaga explicitamente |
| C159 | `card_assignees.board_id` gravado a partir do card, nunca do cliente |
| C160 | Atribuição por `PUT`/`DELETE` idempotentes; `409 ASSIGNEE_NOT_MEMBER` para não participante |
| C161 | Novos códigos de A56 com as mensagens da spec |
| C162 | `BoardSummary` com `myRole`, `memberCount`, `memberPreview`; `BoardDetail` com `myRole`, `members`; `CardSummary.assigneeIds`; `CardDetail.assignees` |
| C163 | Listagem em uma instrução; quadro aberto em até quatro |
| C164 | Respostas de membros sempre com o `MembersState` completo |
| C165 | `DELETE` inexistente de convite ou participante tratado como sucesso no front-end |
| C166 | Front-end oculta controles por `can(myRole, action)` conforme F89 |
| C167 | `FORBIDDEN` no front-end: mensagem + recarga do quadro (F90) |
| C168 | `MembersDialog` carrega por `GET` e substitui estado pela resposta; saída leva a `/boards` |
| C169 | Seção "Convites" independente da grade; aceite insere o quadro no início |
| C170 | `AssigneesSection` com salvamento imediato, sem otimismo, independente do "Salvar card" |
| C171 | Avatares resolvidos de `BoardDetail.members`; até 4 no quadro e 3 na face, com "+K" |
| C172 | Textos, estados, subtítulo e "+K" por funções puras de `lib/members.ts` |
| C173 | Acessibilidade de avatares, seletores e caixas conforme N151–N154 |
| C174 | Exclusão de quadro, card e lista remove participantes, convites e atribuições por cascata |
| C175 | Convites listados do mais recente para o mais antigo; participantes por entrada; responsáveis por atribuição |
| C176 | Testes: matriz nos dois projetos, serviços em memória com concorrência, ajuste dos testes anteriores, integração condicionada |
| C177 | E-mails de participantes expostos só a participantes; convite do usuário sem e-mail de quem convidou |
| C178 | Não participante nunca recebe `FORBIDDEN` |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01 | F85 (criador `admin` na criação) + `GET members` |
| CA02 | `BoardSummary.myRole/memberPreview` (C162) + ocultação (C166) |
| CA03, CA04 | escopo por participação (C145) + ordem de avaliação (C148, C178) |
| CA05–CA08 | algoritmo de convidar (2.4), normalização, duplicidade e já participante (C154) |
| CA09 | convite por e-mail sem vínculo a conta (D33) + `GET /api/invitations` |
| CA10, CA25, CA28 | `assertCan` → `403 FORBIDDEN` (C146) + ocultação (C166) |
| CA11–CA14, CA16, CA17 | rotas de 4.5, aceite e recusa sob bloqueio (C155, C156, C169) |
| CA15 | `DELETE invitations/:id` (4.3) |
| CA18, CA19 | `PATCH members/:userId` + recarga de papel (C149, C167) |
| CA20, CA21 | último Administrador sob bloqueio (C150, C152) |
| CA22–CA24, CA26 | remoção e saída + cascata de atribuições (C157, C158), conteúdo intacto |
| CA27, CA30 | matriz RN05 (`card.write`, `checklist.write`, `list.manage` etc.) |
| CA29 | ocultação por `can(myRole, …)` (F89) |
| CA31–CA35, CA37 | `AssigneesSection` + `PUT`/`DELETE` + `assigneeIds` na face (C160, C170, C171) |
| CA36 | `ASSIGNEE_NOT_MEMBER` + FK composta (C159, C160) |
| CA38 | atribuições por `card_id`, preservadas ao mover e removidas em cascata ao excluir (C174) |
| CA39, CA40 | `BOARD_NOT_FOUND` e `FORBIDDEN` com papel lido no processamento (C149) + recarga (C167) |
| CA41 | `authenticate` + interceptador do RF01 |
| CB01–CB10 | schemas de 4.3–4.4, primitivas escopadas, limite sob bloqueio |
| CB11–CB19 | bloqueio do quadro, unicidade, `ON CONFLICT`, estado completo nas respostas, tratamento de 404 como sucesso |
| CE01–CE06 | formulários e janelas mantidos, sem otimismo, transações únicas, envelope de erro |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Troca do modelo de autorização em código já pronto | Atinge repositórios e testes de RF02 a RF06. É mitigada pela concentração em `BoardScope`, `runInBoardLock`, `runInCardLock` e `boardAccess.ts`, que já eram pontos únicos (F10, F20, F34), e pela revisão de N139. |
| `owner_id` mantido | Evita uma migration destrutiva agora. O risco de alguém voltar a usá-lo para autorização é controlado por N139. |
| Redundância de `board_id` em `card_assignees` | Justificada pela FK composta, que torna RN10 e RN11 garantias do banco. A imutabilidade do quadro do card (RF04) impede divergência. |
| Convite sem vínculo a conta | Permite convidar quem ainda não se cadastrou. O vínculo por e-mail é seguro porque o e-mail da conta é imutável e único (RF01). |
| `FORBIDDEN` revela que o quadro existe | Só é devolvido a participantes, que já sabem que o quadro existe (F80, C178). |
| Tela desatualizada após mudança de papel | Aceito pela spec (2.6). O servidor recusa, e a recarga após `FORBIDDEN` corrige a tela (C167). |
| Ordem de entrada com empate de `joined_at` | O desempate por `user_id` garante ordem determinística. Na migração, o criador recebe `joined_at = created_at` do quadro. |
