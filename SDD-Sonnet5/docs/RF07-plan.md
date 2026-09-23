# RF07 — Plano Técnico: Membros do Quadro com Papéis e Atribuição a Cards

Referência: `docs/RF07-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03), `cards` (RF04), a cascata de RF05 e `checklists` (RF06) já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF07 é resolvido com o mesmo stack de RF01–RF06 (Express, TypeORM, PostgreSQL, `zod`, `apiClient` no front-end).

**Restrição:** nenhum mecanismo de e-mail/notificação é introduzido (RN-03 da spec já descarta isso). "Convidar" é uma escrita direta em banco — não há fila, worker, nem serviço externo envolvido.

## 2. Arquitetura de Componentes e Fronteiras

RF07 introduz duas relações novas — associação usuário↔quadro (com papel) e associação usuário↔card (atribuição) — e altera a base de autorização de **todos** os módulos existentes, que hoje resolvem posse por `ownerId` único. As duas relações vivem em módulos diferentes porque têm ciclos de vida e consumidores diferentes: membership é uma extensão natural de `boards` (mesmo módulo que já possui `Board`), enquanto atribuição é uma extensão natural de `cards`.

### 2.1 Membership como extensão do módulo `boards`

Novo conjunto de arquivos dentro de `modules/boards/`, não um módulo novo — mesma decisão de RF06 de manter junto o que é indissociável do seu recurso pai: uma associação de membro não existe fora do contexto de um quadro específico, do mesmo jeito que um item de checklist não existe fora de um checklist.

- **Entidade nova** `BoardMember` (`entities/board-member.entity.ts`): `boardId`, `userId`, `role` (`administrador` | `membro`).
- **Rotas (`boards.routes`, seção nova)**, todas sob `authenticate`, aninhadas em `/boards/:boardId`:
  - `POST /boards/:boardId/members`
  - `GET /boards/:boardId/members`
  - `PATCH /boards/:boardId/members/:memberId`
  - `DELETE /boards/:boardId/members/:memberId`
  - `DELETE /boards/:boardId/members/me`
- **Controller (`boards-members.controller`)**: valida forma (zod), extrai `boardId`/`memberId`/`req.user.id`, chama o service, traduz erro/sucesso em resposta HTTP.
- **Service (`boards-members.service`)**: contém RN-01 a RN-08, RN-14 a RN-17 relativas a membership. Depende de `BoardMemberRepository`, `BoardRepository` (para confirmar o quadro existe), `UserRepository` (para resolver e-mail → usuário no convite) e `CardAssignmentRepository` (para a cascata de RN-15 ao remover/sair).
- **Erros (`boards-members.errors.ts`)**: `MemberNotFoundError` (404), `MemberAlreadyExistsError` (409), `UserNotFoundError` (404, para e-mail sem cadastro), `LastAdministratorError` (409), `ForbiddenRoleError` (403).

**Restrição de rota deliberada — `DELETE .../members/me` é uma rota própria, não um caso especial de `DELETE .../members/:memberId`.** Sair do quadro (RN-07) não exige papel de administrador; remover outro membro (RN-06) exige. Resolver os dois com o mesmo handler exigiria um `if (memberId === req.user.id)` escondendo duas regras de autorização diferentes atrás de uma única rota — mais frágil de testar e de auditar do que ter dois handlers pequenos, cada um com sua única regra. `:memberId` nas demais rotas identifica o usuário-alvo pelo `userId` dele (não um id interno de linha de `board_members`, que nunca é exposto pela API).

### 2.2 Atribuição de card como extensão do módulo `cards`

- **Entidade nova** `CardAssignment` (`entities/card-assignment.entity.ts`): `cardId`, `userId`, e `boardId` **denormalizado** (ver §3.2).
- **Rotas (`cards.routes`, seção nova)**, aninhadas na cadeia completa já estabelecida em RF04/RF06:
  - `POST /boards/:boardId/lists/:listId/cards/:cardId/assignees`
  - `DELETE /boards/:boardId/lists/:listId/cards/:cardId/assignees/:userId`

  Não há rota própria de listagem: assim como o progresso de checklist (RF06) é embutido na resposta do card, os responsáveis atribuídos também são — não existe um lugar em que se olha "atribuições" fora do card ao qual pertencem (critério 26).
- **Controller/Service**: `cards-assignments.controller` e `cards-assignments.service`, seguindo a mesma forma dos demais. O service depende de `CardRepository`/`ListRepository`/`BoardRepository` (resolver a cadeia de posse, reuso direto dos mesmos métodos já existentes) e de `BoardMemberRepository` (confirmar que o alvo é membro do quadro, RN-10) e `BoardMemberRepository` de novo para checar o papel do ator (RN-09).
- **Erros (`cards-assignments.errors.ts`)**: `AssignmentNotFoundError` (404), reuso de `MemberNotFoundError`/`ForbiddenRoleError` do módulo `boards` (importados, não duplicados — o significado é idêntico: "esse usuário não é membro deste quadro"/"esse ator não é administrador deste quadro").
- **`CardsService`** ganha um método de leitura agregada, `getAssigneesForCards(cardIds)`, no mesmo padrão de `getProgressForCards` (RF06) — uma única consulta para todos os cards de uma listagem, nunca uma por card.

### 2.3 A mudança central: de "dono" para "membro" em toda a base de autorização

Hoje, `BoardRepository.findByIdAndOwner(boardId, userId)` é o portão de entrada usado por `boards.service`, `lists.service`, `cards.service` e `checklists.service` para toda operação. RF07 substitui esse portão por um baseado em membership:

- `findByIdAndOwner` → **`findByIdAndMember(boardId, userId)`**: verdadeiro se `userId` é membro do quadro (qualquer papel). Usado por toda operação de RN-13 (listas, cards, checklists, e a leitura/edição do próprio quadro).
- `findAllByOwner(ownerId)` → **`findAllByMember(userId)`**: usado por `GET /boards` (RN-14).
- `deleteByIdAndOwner` → **`deleteByIdAndAdmin(boardId, userId)`**: verdadeiro só se `userId` é membro **e** tem papel administrador (RN-12). Usado só pela exclusão do quadro.
- `updateByIdAndOwner` permanece como está em espírito, mas passa a checar membership (qualquer papel), não posse — renomeado para **`updateByIdAndMember`**.

**Restrição de migração:** os três serviços consumidores (`lists.service`, `cards.service`, `checklists.service`) têm hoje, cada um, sua própria cópia do método privado `assertBoardOwnership` (duplicação já existente, não introduzida por RF07). Cada uma dessas três cópias passa a chamar `findByIdAndMember` no lugar de `findByIdAndOwner`. Nenhum desses serviços ganha uma dependência nova — `BoardRepository` já era uma dependência de todos eles.

**A coluna `ownerId` de `Board` é mantida, mas deixa de ser consultada por qualquer verificação de acesso a partir de RF07.** Ela passa a ser só um registro histórico de quem criou o quadro (útil para auditoria/exibição), sem papel na autorização — que passa a residir inteiramente em `BoardMember`. Remover a coluna exigiria alterar a relação inversa em `User` e não traz benefício funcional nesta fase; mantê-la como dado inerte é preferível a uma migração de schema sem motivo funcional.

### 2.4 Criação do quadro é atômica com a primeira membership

`BoardsService.create` passa a fazer duas escritas — o quadro e a membership inicial do criador como administrador (RN-02) — dentro de uma única transação de banco. Sem isso, uma falha entre as duas escritas deixaria um quadro sem nenhum administrador, violando RN-08 desde a origem.

## 3. Modelos de Dados e Schemas

### 3.1 `board_members`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| board_id | uuid | FK → `boards.id`, not null, `onDelete: CASCADE` |
| user_id | uuid | FK → `users.id`, not null, `onDelete: CASCADE` |
| role | varchar/enum | not null, um de `administrador`, `membro` (RN-01) |
| created_at | timestamp | not null, default now |

Constraint de unicidade em `(board_id, user_id)` — impõe RN-05 (sem membro duplicado) no próprio banco, além da checagem em `service`. Índice em `board_id` (toda listagem/checagem de membership filtra por ele) e em `user_id` (toda listagem "meus quadros" filtra por ele).

### 3.2 `card_assignments`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| card_id | uuid | FK → `cards.id`, not null, `onDelete: CASCADE` (cumpre RN-15 quando o próprio card é excluído, RF04/RF05) |
| user_id | uuid | FK → `users.id`, not null |
| board_id | uuid | FK → `boards.id`, not null — **denormalizado** |
| created_at | timestamp | not null, default now |

Constraint de unicidade em `(card_id, user_id)`. Índice em `card_id` (toda leitura de responsáveis de um card) e em `(board_id, user_id)` (a cascata de RN-15).

**Justificativa da denormalização de `board_id`:** RN-15 exige que remover um membro do quadro apague as atribuições dele em qualquer card *desse quadro*. Sem `board_id` na própria tabela, essa operação exigiria um `JOIN` de três tabelas (`card_assignments` → `cards` → `lists` → `boards`) em código de aplicação — algo que nenhum repositório deste projeto faz hoje, e que um repositório fake em memória (usado nos testes unitários, já que não há Postgres disponível neste ambiente) teria que reimplementar como lógica de junção só para este caso. Gravar `board_id` no momento da atribuição (o card já pertence a uma lista de um quadro conhecido nesse momento) torna a cascata um filtro direto por duas colunas indexadas — mesma disciplina de RF06 de preferir uma operação simples e testável a uma engenhosidade evitável.

### 3.3 `boards` e `users` — sem alteração de schema
Nenhuma coluna nova em `boards` ou `users`. A relação `User.boards` (inversa de `Board.owner`) permanece como está — continua descrevendo "quadros que este usuário criou", não "quadros dos quais é membro"; não é usada por nenhuma operação de RF07.

## 4. Interfaces: APIs e Contratos

Prefixo de membership: `/boards/:boardId/members`. Prefixo de atribuição: `/boards/:boardId/lists/:listId/cards/:cardId/assignees`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated`. Formato de erro reutilizado de RF01–RF06:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de ordem de resolução, válida para toda rota administrador-only desta fase (adicionar/remover/alterar papel de membro, atribuir/desatribuir card, excluir quadro):**
1. `401 unauthenticated` se não autenticado.
2. `404 board_not_found` se o quadro não existir ou o ator não for membro dele.
3. `403 forbidden_role` se o ator for membro mas não administrador — **antes** de qualquer validação sobre o alvo da operação (critério 5 da spec: a rejeição por falta de permissão precede a checagem de existência do alvo).
4. Só então as checagens específicas da operação (alvo existe / já é membro / regra do último administrador / alvo é membro do quadro).

### `POST /boards/:boardId/members` (convidar/adicionar)
- Body: `{ email: string, role: "administrador" | "membro" }`
- 201: `{ userId, name, email, role, boardId }`
- 400 `validation_error`: `email` ausente/mal formado, ou `role` fora do enum.
- 404 `board_not_found`: quadro inacessível ao ator.
- 403 `forbidden_role`: ator não é administrador (critério 5).
- 404 `user_not_found`: e-mail não corresponde a usuário cadastrado (critério 3).
- 409 `member_already_exists`: e-mail já é membro do quadro (critério 4).

### `GET /boards/:boardId/members`
- Sem body.
- 200: `{ members: [{ userId, name, email, role }, ...] }`, qualquer membro pode chamar (critério 8).
- 404 `board_not_found`: ator não é membro (critério 9).

### `PATCH /boards/:boardId/members/:memberId` (alterar papel)
- Body: `{ role: "administrador" | "membro" }`
- 200: membership atualizada.
- 404 `board_not_found` / 403 `forbidden_role`: mesma ordem da restrição geral.
- 404 `member_not_found`: `:memberId` não é membro do quadro (critério 14).
- 409 `last_administrator_required`: operação rebaixaria o único administrador (critério 12).

### `DELETE /boards/:boardId/members/:memberId` (remover outro membro)
- Sem body.
- 204: membro removido; suas atribuições de card neste quadro são removidas junto (RN-15).
- 404 `board_not_found` / 403 `forbidden_role`: mesma ordem geral.
- 404 `member_not_found`: `:memberId` não é membro (critério 18).
- 409 `last_administrator_required`: `:memberId` é o único administrador (critério 16).

### `DELETE /boards/:boardId/members/me` (sair do quadro)
- Sem body.
- 204: ator removido; sem checagem de papel (RN-07), mas sujeito à mesma regra do último administrador.
- 404 `board_not_found`: ator não é membro.
- 409 `last_administrator_required`: ator é o único administrador (critério 20).

### `POST /boards/:boardId/lists/:listId/cards/:cardId/assignees` (atribuir)
- Body: `{ userId: string }`
- 201: `{ userId, name, email, cardId }`
- 400 `validation_error`: `userId` ausente.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: cadeia de ancestrais (reuso de RF04/RF06).
- 403 `forbidden_role`: ator não é administrador (critério 25).
- 404 `member_not_found`: `userId` não é membro do quadro do card (critério 24).
- Idempotência: atribuir alguém já atribuído ao mesmo card não é um erro novo desta fase — repete a mesma resposta 201, sem duplicar (a constraint de unicidade em `(card_id, user_id)` impede duplicata; o service trata isso como sucesso, não como conflito, já que reatribuir o mesmo responsável não é uma condição de erro descrita na spec).

### `DELETE /boards/:boardId/lists/:listId/cards/:cardId/assignees/:userId` (desatribuir)
- Sem body.
- 204: atribuição removida.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: cadeia de ancestrais.
- 403 `forbidden_role`: ator não é administrador.
- 404 `assignment_not_found`: `userId` não estava atribuído a este card (critério do caso de borda "desatribuir quem não está atribuído").

### Contratos estendidos: quadro e card passam a incluir dados de RF07
A partir de RF07:
- Toda resposta de quadro (`GET/POST/PATCH /boards`, `GET /boards/:id`) passa a incluir `"role": "administrador" | "membro"` — o papel do usuário autenticado **naquele** quadro, para o front-end decidir se mostra a interface de gestão de membros sem precisar de uma segunda chamada.
- Toda resposta de card (`GET/POST/PATCH .../cards`) passa a incluir `"assignees": [{ userId, name, email }, ...]` (lista vazia quando não há ninguém atribuído — nunca `null`, diferente de `progress`, já que a ausência de responsáveis é um estado normal, não "sem dado calculável").

## 5. Requisitos Não Funcionais

**Segurança**
- Toda checagem de papel (administrador vs. membro) acontece no `service`, nunca no `controller` nem nas rotas — mesma disciplina de RN já aplicada a RF01–RF06.
- Resposta de `user_not_found` (convite) não deve ser usada para permitir enumeração de e-mails cadastrados por um usuário sem nenhuma relação com o quadro: a checagem de papel do ator (passo 3 da ordem de resolução, §4) acontece **antes** da busca pelo e-mail convidado, então um não-administrador nunca descobre, por meio desta rota, se um e-mail está cadastrado.
- Nenhuma query de membership busca por `board_id` sem também restringir por `user_id` (ou vice-versa, conforme o caso) — mesma disciplina de escopo de RF04–RF06.
- `card_assignments.board_id` é gravado pelo `service` a partir do quadro já resolvido na cadeia (nunca aceito do corpo da requisição).
- Rate limiting dedicado não é necessário, mesmo raciocínio de RF02–RF06.

**Desempenho**
- Checagem de membership e de papel é uma única consulta indexada (`board_id` + `user_id`), sem N+1, tanto para o ator quanto para o alvo.
- `CardsService.getAssigneesForCards` busca atribuições de todos os cards de uma listagem em uma única consulta, mesmo padrão de `getProgressForCards` (RF06) — não uma por card.
- Índices descritos na seção 3 cobrem toda consulta de autorização introduzida por esta fase.

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF06: nenhum estado novo em memória entre requisições.
- Nenhum limite de quantidade de membros por quadro ou de atribuições por card é imposto nesta fase (RN-11) — não há paginação nas listagens de membros/atribuições, mesmo padrão já adotado para listas/cards/checklists.

## 6. Restrições Explícitas para a Implementação

- Toda regra de negócio de RF07 (RN-01 a RN-17) reside em `boards-members.service` ou `cards-assignments.service`, nunca em controller ou rotas.
- `BoardRepository.findByIdAndOwner`, `findAllByOwner`, `updateByIdAndOwner` e `deleteByIdAndOwner` são renomeados para `findByIdAndMember`, `findAllByMember`, `updateByIdAndMember` e `deleteByIdAndAdmin`, respectivamente; todo chamador (`boards.service`, `lists.service`, `cards.service`, `checklists.service`) é atualizado para o novo nome e semântica — não convivem duas versões do método.
- `deleteByIdAndAdmin` é o único ponto de checagem de papel para exclusão de quadro; nenhum outro método de `BoardRepository` passa a aceitar ou checar papel.
- `BoardsService.create` grava o quadro e a membership inicial do criador em uma única transação de banco (§2.4) — nunca duas operações não atômicas.
- A ordem de resolução descrita na seção 4 (autenticação → quadro/membership do ator → papel do ator → validação específica da operação) é a mesma para toda rota administrador-only; nenhuma rota valida o alvo antes de validar o papel do ator.
- `card_assignments.board_id` é uma coluna denormalizada preenchida pelo `service`, nunca recebida do cliente; existe unicamente para tornar RN-15 uma operação de filtro simples (§3.2).
- Remover ou a saída de um membro (`boards-members.service`) dispara, na mesma operação, a exclusão de suas atribuições de card no quadro via `CardAssignmentRepository.deleteAllByBoardAndUser(boardId, userId)` — nunca deixado para um job separado ou para a constraint de banco.
- `cards-assignments.service` depende de `BoardMemberRepository` só para leitura (checar papel do ator, checar se o alvo é membro) — nunca escreve em `board_members`.
- `boards-members.service` depende de `UserRepository` só para leitura (`findByEmail`, resolver o convite) — nunca cria usuário; um e-mail sem cadastro é sempre `user_not_found` (RN-04), nunca uma criação implícita de conta.
- Nenhuma dependência nova instalada para RF07 (seção 1); nenhum mecanismo de e-mail/notificação introduzido.
- `ownerId` em `Board` é mantido só como dado histórico (§2.3); nenhuma verificação de acesso o consulta a partir desta fase.
- Uso de PostgreSQL via TypeORM obrigatório para `board_members` e `card_assignments`, com as FKs `onDelete: CASCADE` descritas na seção 3 — sem acesso a banco fora do ORM.
