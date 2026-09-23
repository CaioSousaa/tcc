# RF07 — Tarefas de Implementação

Referência: `docs/RF07-spec.md`, `docs/RF07-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — base de autorização (dono → membro)

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| A1 | Entidade `BoardMember` (TypeORM), registrada no `DataSource` | Plano §2.1, §3.1 | done |
| A2 | `BoardRepository`: renomear `findByIdAndOwner`→`findByIdAndMember`, `findAllByOwner`→`findAllByMember`, `updateByIdAndOwner`→`updateByIdAndMember`; `deleteByIdAndOwner`→`deleteById` (checagem de papel movida para o service, não para o repositório — desvio justificado do plano §6, ver notas) | Plano §2.3 | done |
| A3 | `BoardMemberRepository` (interface + adapter TypeORM): `create`, `findAllByBoard`, `findAllByBoardWithUser`, `findByBoardAndUser`, `findAllByUserId`, `updateRole`, `delete`, `countAdminsByBoard` | Plano §2.1, §3.1 | done |
| A4 | `TypeOrmBoardRepository.findByIdAndMember/findAllByMember/updateByIdAndMember` via `EXISTS`/`INNER JOIN` contra `board_members` (query builder) | Plano §2.3 | done |
| A5 | `BoardsService.create` grava quadro + membership inicial (administrador); atomicidade obtida por compensação (desfaz o quadro se a membership falhar), não por transação de banco — desvio justificado do plano §2.4, ver notas | Plano §2.4, RN-02 | done |
| A6 | `BoardsService`: `list`/`getById`/`update` passam a expor o papel do requisitante (`role`) junto ao quadro; `remove` resolve membership→papel→exclusão | Plano §2.3, §4 (contrato de quadro) | done |
| A7 | `boards.controller`: `serializeBoard` inclui `role`; testes atualizados | Plano §4 | done |
| A8 | `lists.service`, `cards.service`, `checklists.service`: trocar `findByIdAndOwner`→`findByIdAndMember` nos helpers privados de resolução | Plano §2.3, RN-13 | done |
| A9 | Atualizar todos os testes existentes que usam `FakeBoardRepository` (boards/lists/cards/checklists) para o modelo de membership | qualidade | done |

## Back-end — módulo `boards-members`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| M1 | `boards-members.errors.ts` (`MemberNotFoundError` 404, `MemberAlreadyExistsError` 409, `UserNotFoundError` 404, `LastAdministratorError` 409, `ForbiddenRoleError` 403) | Plano §2.1 | done |
| M2 | `boards-members.schemas.ts` (zod: convite `{email, role}`; alteração `{role}`) + testes | RN-01, critérios 1-6 | done |
| M3 | `boards-members.service`: `invite`, `list`, `updateRole`, `remove`, `leave` — RN-01 a RN-08, RN-14 a RN-17, ordem de resolução do Plano §4 | Spec §3/§4 | done |
| M4 | Testes unitários de `boards-members.service` cobrindo critérios 1-20 e RNs relacionadas | Spec §3/§4 | done |
| M5 | `boards-members.controller` + `boards-members.routes` (montadas em `app.ts` como `/boards/:boardId/members`) + testes de controller | Plano §2.1, §4 | done |

## Back-end — atribuição de membros a cards

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| C1 | Entidade `CardAssignment` (com `boardId` denormalizado), registrada no `DataSource` | Plano §2.2, §3.2 | done |
| C2 | `CardAssignmentRepository` (interface + adapter): `create`, `exists`, `delete`, `findAllByCardIds` (batelada), `deleteAllByBoardAndUser` | Plano §2.2, §3.2 | done |
| C3 | `cards-assignments.errors.ts` (`AssignmentNotFoundError` 404) reusando `MemberNotFoundError`/`ForbiddenRoleError` de `boards-members.errors.ts` | Plano §2.2 | done |
| C4 | `cards-assignments.service`: `assign`/`unassign`, RN-09, RN-10, RN-11, ordem de resolução | Spec §3/§4 | done |
| C5 | Testes unitários de `cards-assignments.service` cobrindo critérios 21-26 | Spec §3 | done |
| C6 | `cards-assignments.controller` + rotas montadas em `app.ts` como `/boards/:boardId/lists/:listId/cards/:cardId/assignees` + testes | Plano §2.2, §4 | done |
| C7 | `CardsService.getAssigneesForCards` (leitura agregada em batelada); `cards.controller` inclui `assignees` na serialização de card | Plano §2.2, §4 | done |
| C8 | `boards-members.service.remove`/`leave` disparam `CardAssignmentRepository.deleteAllByBoardAndUser` (RN-15, critério 31) | Plano §6 | done |

## Back-end — integração final

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| I1 | `main.ts`: instanciar `BoardMemberRepository`/`CardAssignmentRepository`, religar `boardsService`, criar `boardsMembersService`/`cardsAssignmentsService`, montar novas rotas em `app.ts` | Plano §2 | done |
| I2 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte) | qualidade | done — 26 suítes / 317 testes |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/boards/api.ts`: `Board.role`; `lib/boards-members/api.ts` (listar/convidar/alterar papel/remover/sair) | Plano §4 | done |
| F2 | `lib/cards/api.ts`: `Card.assignees`; funções de atribuir/desatribuir | Plano §4 | done |
| F3 | Página `/quadros/[id]`: seção "Membros" (listar, convidar por e-mail+papel, alterar papel, remover, sair), visível/editável conforme `role`; seletor de responsáveis por card | Spec §2, critérios 1-31 | done |
| F4 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — os 31 critérios e as 17 RNs têm implementação e teste rastreáveis; a ordem de resolução (quadro/membership → papel → checagem específica) é testada explicitamente para convite, alteração de papel, remoção e atribuição |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — nenhuma regressão em `auth`/`boards`/`lists`/`cards`/`checklists` | done — 317/317 testes passando (26 suítes) |

## Notas de implementação

- **Desvio 1 — sem transação de banco real em `BoardsService.create`.** O plano (§2.4) pedia uma única transação de banco para quadro+membership inicial. Como cada repositório deste projeto encapsula uma única entidade (`Repository<T>` do TypeORM, sem passagem de `EntityManager` transacional entre repositórios — padrão nunca usado em RF01–RF06), implementar uma transação real exigiria reestruturar a injeção de repositórios em todo o projeto, fora do escopo de RF07. Optou-se por atomicidade por compensação: se a criação da membership falhar após o quadro já ter sido persistido, o quadro é excluído antes de propagar o erro — nunca fica um quadro sem administrador de forma persistente.
- **Desvio 2 — `deleteByIdAndAdmin` virou `deleteById` simples.** O plano nomeava um método de repositório que já checava papel de administrador via `JOIN`/`EXISTS`. Na implementação, a checagem de papel foi centralizada inteiramente em `BoardsService.remove` (busca a membership, valida `role === "administrador"`, só então exclui) — mesma disciplina que "toda regra de negócio reside no service" já usada por todo o restante do plano, e evita duplicar a lógica de papel entre service e repositório. `BoardRepository.deleteById` ficou um método de exclusão simples de uma única tabela, consistente com os demais métodos do repositório.
- **Reuso de erros entre módulos.** `cards-assignments.service` importa `MemberNotFoundError`/`ForbiddenRoleError` de `boards-members.errors.ts` (módulo `boards`), exatamente como o plano previu — não há duplicação de classes de erro com o mesmo significado.
- **`CardAssignmentRepository.create` é idempotente.** Atribuir um usuário já atribuído ao mesmo card não gera duplicata nem erro (constraint de unicidade em `(card_id, user_id)` na entidade; o adapter TypeORM verifica existência antes de inserir) — conforme a nota de idempotência do plano §4.
- Nenhuma dependência nova instalada; nenhum mecanismo de e-mail/notificação introduzido, como o plano previu.
