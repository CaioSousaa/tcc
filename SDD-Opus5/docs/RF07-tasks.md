# RF07 — Tarefas de implementação

**Base:** `docs/RF07-spec.md` e `docs/RF07-plan.md` (herda RF01–RF06).

Cada tarefa entrega uma parte funcional e verificável, na ordem de dependência: permissões e dados, troca do modelo de acesso, novas APIs, front-end, testes e conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Matriz de permissões e códigos de erro
- `domain/permissions.ts`: `BoardRole`, `BoardAction`, `can`, `assertCan` — F78, C146.
- `domain/members.ts`: tipos e limite de 50 pessoas.
- Códigos de A56 com as mensagens da spec — C161.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Tabelas e migração de donos
- Migration `BoardMembersInvitationsAssignees`: `board_members`, `board_invitations`, `card_assignees` (FK composta com cascata), migração de donos para `admin` — 3.1–3.4, C144, D31, D32.
- Entidades e registro no `DataSource`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Troca do modelo de acesso
- `BoardScope = { userId }`; `boardAccess.ts` — F77, C145.
- `runInBoardLock` e `runInCardLock` resolvendo participação e papel na instrução do bloqueio — F79, C147.
- `BoardRepository` (listagem, resumo, detalhe, criação com `admin`, atualização e exclusão) e leitura do card por participação — F85, C151.
- `assertCan` em `BoardService`, `ListService`, `CardService` e `ChecklistService`, na ordem de C148.
- **Pronto quando:** `tsc` e `npm run build` passam e `owner_id` não aparece em nenhuma consulta de autorização (N139).
- **Estado:** concluída

### T04 — Novos campos nos contratos
- `BoardSummary`: `myRole`, `memberCount`, `memberPreview` em uma instrução — N135.
- `BoardDetail`: `myRole`, `members`; `CardSummary.assigneeIds` agregado na consulta de cards; `CardDetail.assignees` — C162, N136.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T05 — Membros e convites do quadro
- `MemberRepository` com as primitivas de 2.3 sob `runInBoardLock`.
- `MemberService`: listar, convidar, alterar papel de convite e participante, cancelar, remover, sair — 2.4, C150, C152–C154, C157, C164.
- `schemas/member.schemas.ts`, controller e rotas `/api/boards/:boardId/members` e `/invitations` — 4.2–4.4.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T06 — Convites do usuário
- `InvitationService`: listar pelo e-mail da sessão, aceitar e recusar sob o bloqueio do quadro — 2.4, C155, C156.
- Rotas `/api/invitations` — 4.5.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T07 — Responsáveis
- `AssigneeService` com `PUT`/`DELETE` idempotentes sob `runInCardLock` — C159, C160.
- Rotas `.../cards/:cardId/assignees/:userId` — 4.6.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T08 — Testes do back-end
- Matriz de permissões contra RN05 — N156.
- Repositórios em memória com participação, convites, atribuições com cascata e bloqueio por quadro — N157.
- Serviços de membros, convites e responsáveis (último Administrador concorrente, limite concorrente, aceite contra cancelamento, ordem `BOARD_NOT_FOUND` → `FORBIDDEN`).
- `FORBIDDEN` para Membro em quadro e listas; ajuste dos testes de RF02–RF06 — N158.
- Integração com PostgreSQL condicionada a `TEST_DATABASE_URL` — N159.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Front-end

### T09 — Base do front-end
- `lib/permissions.ts` (matriz no cliente), `lib/members.ts` (avatares visíveis, estados, subtítulo, falhas) — F88, F95, C172.
- Tipos novos, `memberService`, `invitationService`, `assigneeService`, `schemas/member.ts`, mensagens e códigos.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T10 — "Meus quadros"
- Seção "Convites" com aceitar e recusar — F92, C169.
- `BoardCard` com selo, avatares e ações por papel; subtítulo — C166, C171.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T11 — Quadro: membros e permissões
- `BoardHeader` com "Membros" e avatares; ocultação por papel em cabeçalho, listas e colunas — F89.
- `MembersDialog`, `InviteForm`, `MemberRow`, `InvitationRow`, confirmações de remover e sair — 2.3–2.7, C165, C168.
- Tratamento de `FORBIDDEN` com recarga do quadro — F90, C167.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T12 — Responsáveis no card
- `AssigneesSection` na janela do card e avatares na face — 2.9, F93, F94, C170, C171.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T13 — Testes do front-end
- Matriz de permissões (mesma tabela do back-end), `lib/members.ts`, schema de convite, códigos, ajuste de fixtures.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Verificação

### T14 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C143–C178, de N139 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resultado da implementação

### Verificação executada

| Projeto | Comando | Resultado |
| --- | --- | --- |
| back-end | `npx tsc --noEmit` (código e testes) | sem erros |
| back-end | `npm run build` | sem erros |
| front-end | `npx tsc --noEmit` (código e testes) | sem erros |
| front-end | `npm run build` | sem erros |

Nenhum teste, endpoint ou fluxo de API foi executado (`context.md`, regra 3). Nenhuma dependência nova foi necessária (C143).

### Arquivos por tarefa

| Tarefa | Arquivos |
| --- | --- |
| T01 | `domain/permissions.ts`, `domain/members.ts`, `errors/AppError.ts`, `errors/messages.ts`, `middlewares/errorHandler.ts` |
| T02 | `migrations/1760000006000-BoardMembersInvitationsAssignees.ts`, `entities/BoardMember.ts`, `entities/BoardInvitation.ts`, `entities/CardAssignee.ts`, `config/data-source.ts` |
| T03 | `services/boardAccess.ts`, `repositories/boardLock.ts`, `repositories/cardLock.ts`, `repositories/BoardRepository.ts`, `repositories/BoardListRepository.ts`, `repositories/BoardCardRepository.ts`, `repositories/ChecklistRepository.ts`, `services/BoardService.ts`, `services/ListService.ts`, `services/CardService.ts`, `services/ChecklistService.ts` |
| T04 | `domain/boards.ts`, `domain/cards.ts`, `repositories/listsWithCards.ts`, `repositories/members.ts`, `repositories/BoardRepository.ts` |
| T05 | `repositories/MemberRepository.ts`, `repositories/pgErrors.ts`, `services/MemberService.ts`, `schemas/member.schemas.ts`, `controllers/MemberController.ts`, `routes/member.routes.ts`, `routes/board.routes.ts` |
| T06 | `repositories/InvitationRepository.ts`, `services/InvitationService.ts`, `controllers/InvitationController.ts`, `routes/invitation.routes.ts`, `routes/index.ts` |
| T07 | `repositories/AssigneeRepository.ts`, `services/AssigneeService.ts`, `controllers/AssigneeController.ts`, `routes/assignee.routes.ts`, `routes/card.routes.ts`, `app.ts`, `main.ts` |
| T08 | `__tests__/permissions.test.ts`, `member.schemas.test.ts`, `MemberService.test.ts`, `InvitationService.test.ts`, `AssigneeService.test.ts`, `RolePermissions.test.ts`, `ownerIdReview.test.ts`, `Members.integration.test.ts`; helpers `InMemoryBoardRepository`, `InMemoryBoardLock`, `InMemoryMemberRepository`, `InMemoryInvitationRepository`, `InMemoryAssigneeRepository`, `sprintBoard`; ajustes em `BoardService.test.ts`, `CardService.test.ts` e nos quatro testes de integração anteriores |
| T09 | `lib/permissions.ts`, `lib/members.ts`, `lib/api.ts`, `lib/messages.ts`, `services/memberService.ts`, `services/invitationService.ts`, `services/assigneeService.ts`, `services/boardService.ts`, `services/cardService.ts`, `schemas/member.ts` |
| T10 | `components/invitations/InvitationsSection.tsx`, `components/boards/BoardCard.tsx`, `app/(app)/boards/BoardsView.tsx` |
| T11 | `components/members/*` (`Avatar`, `AvatarStack`, `RoleSelect`, `InviteForm`, `MemberRow`, `InvitationRow`, `ConfirmRemoveDialog`, `MembersDialog`, `icons`), `components/boards/BoardHeader.tsx`, `components/lists/BoardLists.tsx`, `components/lists/ListColumn.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx` |
| T12 | `components/cards/AssigneesSection.tsx`, `components/cards/CardDialog.tsx`, `components/cards/CardFace.tsx` |
| T13 | `lib/__tests__/permissions.test.ts`, `lib/__tests__/members.test.ts`, `schemas/__tests__/member.test.ts`, `lib/__tests__/api.test.ts`; fixtures de `boardState`, `boardsState`, `checklist` e `listDeletion` |

### Decisões e desvios registrados

- **Atualização e exclusão de quadro (T03).** `BoardRepository.update/delete` foram substituídos por `withBoardLock(scope, boardId, (tx, role) => …)`, com a interface primitiva `BoardTransaction`. Assim, papel e escrita ficam na mesma transação (plano 3.5).
- **Papel nos bloqueios (T03).** `runInBoardLock` e `runInCardLock` passam o papel como segundo argumento de `work`. Os serviços chamam `assertCan` dentro do bloqueio, antes de ler listas, cards ou itens (C148). `runInCardLock` resolve o papel pela participação sem bloquear o quadro, como pede F79.
- **Ids de responsáveis (T04).** `assigneeIds` é agregado como `text[]` na mesma instrução dos cards, para evitar depender do parser de `uuid[]` do driver.
- **Violação de FK na atribuição (T07).** Se a pessoa deixa o quadro entre a verificação e a inserção, a FK composta recusa a linha. `AssigneeTransaction.assign` devolve `false`, e o serviço responde `ASSIGNEE_NOT_MEMBER`.
- **`DELETE` de responsável com `userId` malformado (T07).** Não gera erro: devolve a lista atual, mantendo a idempotência de RN11.
- **Aceite de convite (T06).** O convite é relido dentro do bloqueio, e o registro relido é entregue ao aceite e à recusa, o que evita uma terceira leitura.
- **`FORBIDDEN` no quadro (T11, F90).** Para ações de quadro e de lista, o front-end fecha o diálogo, mostra a mensagem como aviso do quadro e recarrega o quadro. O plano permite fechar a janela após a recarga quando o novo papel não permite a ação, e `FORBIDDEN` sempre indica esse caso. Na janela "Membros do quadro", a mensagem aparece na própria janela, e o estado e o quadro são recarregados.
- **"Sair do quadro" (T11).** Na própria linha aparece como botão de texto "Sair do quadro", e não como lixeira (o protótipo mostra lixeira), porque a spec 2.3 nomeia a ação e ela tem outra confirmação.
- **Falhas genéricas ao convidar (T11, CE01).** A mensagem aparece junto ao campo de e-mail, e e-mail e papel são mantidos.
- **Revisão de `owner_id` (T08, N139).** `ownerIdReview.test.ts` lê o código-fonte e garante que `owner_id`/`ownerId`, fora de comentários, só aparece na entidade `Board` e na inserção do quadro.
- **Testes de integração anteriores (T08).** Receberam a nova migration, a inserção do dono em `board_members` e mais um `undoLastMigration` nos testes de reversão.
- **Pendências de verificação.** Os testes unitários e de integração foram escritos, mas não executados nesta seção. A execução e a validação dos critérios de aceite ficam para a FASE 4.
