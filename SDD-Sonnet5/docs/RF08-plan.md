# RF08 — Plano Técnico: Etiquetas Coloridas em Cards, com Filtro por Etiqueta

Referência: `docs/RF08-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03), `cards` (RF04), a cascata de RF05, `checklists` (RF06) e o modelo de membership de RF07 já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF08 é resolvido com o mesmo stack de RF01–RF07 (Express, TypeORM, PostgreSQL, `zod`, `apiClient` no front-end).

**Restrição:** RN-03 da spec deixa deliberadamente em aberto qual é "o conjunto de cores que o sistema oferece" — essa é uma decisão de construção, não de comportamento, e este plano a resolve agora: o conjunto suportado é um enum fixo de **oito** cores nomeadas — `verde`, `amarelo`, `laranja`, `vermelho`, `roxo`, `azul`, `ciano`, `cinza`. Nenhuma outra fase deste projeto usa um color picker de valor livre (hex/RGB); um enum fixo, validado por `zod`, é consistente com o padrão de validação por enum já usado em RF07 (`role`) e não exige nenhuma biblioteca nova.

## 2. Arquitetura de Componentes e Fronteiras

RF08 introduz dois recursos novos — `Label` (escopada a um quadro) e `CardLabel` (associação card↔etiqueta) — com uma diferença estrutural importante em relação a RF07: **nenhuma cascata desta fase precisa de coluna denormalizada**, porque toda cascata de RF08 é expressável como uma cadeia de FKs de uma única tabela para a outra (ver §3), diferente da cascata "remover atribuições de um membro em todo o quadro" de RF07, que cruzava `card_assignments` por `(board_id, user_id)` sem passar por `cards`.

### 2.1 `Label` como módulo próprio, não uma extensão de `boards`

Diferente de `BoardMember` (RF07, que virou parte do módulo `boards` por ser uma associação de acesso, não um recurso com identidade própria), uma etiqueta é um recurso de primeira classe com CRUD completo e nome escolhido pelo usuário — mesma natureza de `List` (RF03), que também é "escopada a um quadro" e ainda assim tem seu próprio módulo. RF08 segue esse precedente: novo módulo `modules/labels/`.

- **Entidade** `Label` (`entities/label.entity.ts`): `boardId`, `name`, `color` (enum de oito valores, §1).
- **Rotas (`labels.routes`)**, todas sob `authenticate`, aninhadas em `/boards/:boardId/labels`:
  - `POST /boards/:boardId/labels`
  - `GET /boards/:boardId/labels`
  - `PATCH /boards/:boardId/labels/:labelId`
  - `DELETE /boards/:boardId/labels/:labelId`
- **Controller (`labels.controller`)**: valida forma (zod), extrai `boardId`/`labelId`/`req.user.id`, chama o service, traduz erro/sucesso em resposta HTTP.
- **Service (`labels.service`)**: contém RN-01 a RN-04. Depende só de `BoardRepository` (para confirmar membership) e `LabelRepository` — **nenhuma dependência de `BoardMemberRepository`**, porque RN-05 não introduz checagem de papel nenhuma; toda operação usa `findByIdAndMember` (qualquer papel), o mesmo portão já usado por `lists`/`cards`/`checklists`.
- **Erros (`labels.errors.ts`)**: `LabelNotFoundError` (404) — reaproveitado também pelo módulo `cards` (ver §2.2) para o caso "etiqueta de outro quadro" (RN-17).

### 2.2 Associação card↔etiqueta como extensão do módulo `cards`

Mesma decisão estrutural de RF07 para `CardAssignment`: a associação não tem identidade própria fora do card e da etiqueta que ela liga, então vive dentro de `modules/cards/`, não em `modules/labels/`.

- **Entidade** `CardLabel` (`entities/card-label.entity.ts`): `cardId`, `labelId` — **sem `boardId` denormalizado** (§2 acima; ver justificativa em §3.2).
- **Rotas (`cards-labels.routes`)**, aninhadas na cadeia completa já estabelecida em RF04/RF06/RF07:
  - `POST /boards/:boardId/lists/:listId/cards/:cardId/labels`
  - `DELETE /boards/:boardId/lists/:listId/cards/:cardId/labels/:labelId`

  Sem rota própria de listagem: as etiquetas de um card são embutidas na resposta do card (§4), mesmo padrão de `progress` (RF06) e `assignees` (RF07) — não existe um lugar em que se olha "etiquetas de um card" fora do card ao qual pertencem (critério 24).
- **Controller/Service**: `cards-labels.controller` e `cards-labels.service`. O service depende de `CardRepository`/`ListRepository`/`BoardRepository` (resolver a cadeia de posse, reuso direto) e de `LabelRepository` (confirmar que a etiqueta pertence ao mesmo quadro do card, RN-06/RN-17).
- **Erros (`cards-labels.errors.ts`)**: `CardLabelNotFoundError` (404, "associação não existe") — reusa `LabelNotFoundError` do módulo `labels` para o caso "etiqueta de outro quadro" na associação (importado, não duplicado).
- **`CardsService`** ganha um método de leitura agregada, `getLabelsForCards(cardIds)`, no mesmo padrão de `getProgressForCards` (RF06) e `getAssigneesForCards` (RF07) — uma única consulta para todos os cards de uma listagem. Esta é a **terceira** vez que esse padrão de "leitura agregada em lote, delegada ao repositório do recurso filho" se repete neste projeto; ele é agora o idioma padrão deste projeto para dado exibido no card, mas calculado a partir de uma tabela associada, e deve continuar sendo seguido por qualquer RF futuro com a mesma forma.

### 2.3 Filtro por etiqueta é um parâmetro da listagem existente de cards, não uma rota nova

RN-13 já deixa claro que filtrar é só visualização. Em vez de criar um endpoint novo (por exemplo, "buscar cards por etiqueta"), `GET /boards/:boardId/lists/:listId/cards` (RF04) ganha um parâmetro de query opcional, `labelIds` (lista de ids separados por vírgula). Isso é consistente com o fato de que o endpoint de listagem de cards já é por lista, não por quadro — o front-end já agrega os cards de todas as listas de um quadro fazendo uma chamada por lista (padrão estabelecido desde RF04); o filtro por etiqueta se encaixa nesse mesmo padrão, sendo repetido em cada uma dessas chamadas.

**Onde a filtragem acontece:** `CardsService.list` primeiro busca os cards da lista normalmente (`CardRepository.findAllByList`, sem nenhuma mudança nesse método). Se `labelIds` foi informado, o service pede a `CardLabelRepository` (não a `CardRepository`) quais desses cards têm ao menos uma das etiquetas pedidas — `CardLabelRepository.filterCardIdsByLabels(cardIds, labelIds)` — e filtra a lista em memória por esse conjunto de ids. `CardRepository` nunca aprende a existência de `card_labels`; a mesma disciplina de fronteira de RF06/RF07 (consulta que cruza tabelas vive no repositório da tabela associada, nunca no repositório do card).

## 3. Modelos de Dados e Schemas

### 3.1 `labels`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| board_id | uuid | FK → `boards.id`, not null, `onDelete: CASCADE` (cumpre RN-12) |
| name | varchar(50) | not null (RN-02) |
| color | varchar(20) | not null, um dos oito valores do enum (RN-03, §1) |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null |

**Sem constraint de unicidade em `(board_id, name)` nem em `(board_id, color)`** — decisão deliberada, não uma omissão: RN-04 exige explicitamente que nome e cor não precisem ser únicos. Índice em `board_id` — toda listagem e toda checagem de posse (`findByIdAndBoard`) filtram por ele.

### 3.2 `card_labels`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| card_id | uuid | FK → `cards.id`, not null, `onDelete: CASCADE` (cumpre RN-11, e RN-10 quando o próprio card é excluído) |
| label_id | uuid | FK → `labels.id`, not null, `onDelete: CASCADE` (cumpre RN-10) |
| created_at | timestamp | not null, default now |

Constraint de unicidade em `(card_id, label_id)` — impõe RN-08 (associar é idempotente) no próprio banco, além da checagem em `service`. Índice em `card_id` (leitura de etiquetas de um card ou de vários, via `getLabelsForCards`) e em `label_id` (a consulta de filtro, `filterCardIdsByLabels`, busca por `label_id IN (...)`).

**Por que `card_labels` não precisa de `board_id` denormalizado, diferente de `card_assignments` (RF07):** a cascata de RF07 que motivou a denormalização (RN-15: "remover um *membro* apaga as atribuições dele em *qualquer card do quadro*") cruza o quadro inteiro a partir de um `userId`, sem nenhum card específico como ponto de partida — daí a necessidade de indexar `(board_id, user_id)` diretamente na tabela de atribuição. Nenhuma cascata de RF08 tem essa forma: excluir uma etiqueta cascateia por `label_id` (uma FK direta), excluir um card cascateia por `card_id` (outra FK direta), e excluir um quadro cascateia por `labels.board_id` — que já apaga `card_labels` transitivamente, via a própria cascata de `labels`, sem `card_labels` precisar saber a que quadro pertence. Adicionar `board_id` aqui seria a mesma "engenhosidade evitável" que RF06 já rejeitou para posição de checklist — uma coluna sem nenhuma consulta que a use.

### 3.3 `boards`, `cards` — sem alteração de schema
Nenhuma coluna nova em `boards` ou `cards`. As FKs de `labels` e `card_labels` são suficientes para as três cascatas (RN-10, RN-11, RN-12).

## 4. Interfaces: APIs e Contratos

Prefixo de etiquetas: `/boards/:boardId/labels`. Prefixo de associação: `/boards/:boardId/lists/:listId/cards/:cardId/labels`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated`. Formato de erro reutilizado de RF01–RF07:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de ordem de resolução:** para toda rota desta fase, a ordem é quadro/membership do ator (`404 board_not_found` se não for membro) → checagens específicas da operação. Diferente de RF07, **nenhuma rota desta fase tem um passo de checagem de papel** — RN-05 já descarta isso; qualquer membro passa direto da checagem de quadro para a checagem específica.

### `POST /boards/:boardId/labels`
- Body: `{ name: string, color: "verde"|"amarelo"|"laranja"|"vermelho"|"roxo"|"azul"|"ciano"|"cinza" }`
- 201: `{ id, name, color, boardId, createdAt, updatedAt }`
- 400 `validation_error`: `name` ausente/vazio/acima de 50 caracteres, ou `color` fora do enum.
- 404 `board_not_found`: ator não é membro do quadro (critério 7).

### `GET /boards/:boardId/labels`
- Sem body.
- 200: `{ labels: [{ id, name, color, boardId, createdAt, updatedAt }, ...] }` (critérios 8, 9).
- 404 `board_not_found`: ator não é membro (critério 10).

### `PATCH /boards/:boardId/labels/:labelId`
- Body: `{ name?: string, color?: "verde"|... }` — ao menos um dos dois, mesma convenção de update parcial de RF02/RF03.
- 200: etiqueta atualizada.
- 404 `board_not_found`: ator não é membro.
- 404 `label_not_found`: `:labelId` inexistente ou de outro quadro (critério 13).

### `DELETE /boards/:boardId/labels/:labelId`
- Sem body.
- 204: etiqueta excluída; suas associações com cards são removidas junto (RN-10).
- 404 `board_not_found` / 404 `label_not_found`: mesma lógica de `PATCH` (critério 16).

### `POST /boards/:boardId/lists/:listId/cards/:cardId/labels` (associar)
- Body: `{ labelId: string }`
- 201: `{ id, name, color }` (a etiqueta associada).
- 400 `validation_error`: `labelId` ausente.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: cadeia de ancestrais (reuso de RF04/RF06/RF07).
- 404 `label_not_found`: `labelId` inexistente ou pertence a outro quadro (critério 20).
- Idempotência: associar uma etiqueta já associada ao mesmo card não é um erro — repete a mesma resposta 201, sem duplicar (constraint de unicidade em `(card_id, label_id)`; mesma convenção adotada em RF07 para atribuição de card, RN-08).

### `DELETE /boards/:boardId/lists/:listId/cards/:cardId/labels/:labelId` (desassociar)
- Sem body.
- 204: associação removida.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: cadeia de ancestrais.
- 404 `card_label_not_found`: `labelId` não estava associado a este card — seja porque nunca esteve, seja porque pertence a outro quadro (RN-09, critério 23). Diferente da associação, a desassociação não distingue os dois casos: uma tentativa de exclusão que afeta zero linhas é sempre a mesma resposta.

### Contrato estendido: `GET .../cards` ganha filtro por etiqueta
- Query param opcional: `?labelIds=id1,id2,...` — lista de ids de etiqueta separados por vírgula.
- Sem esse parâmetro (ou vazio): comportamento inalterado, todos os cards da lista (RN-15).
- Com o parâmetro: só os cards com ao menos uma das etiquetas informadas (RN-14, união — nunca interseção).
- Um id de etiqueta no filtro que não existe, ou pertence a outro quadro, não é um erro — simplesmente não casa com nenhum card, then aparece um resultado vazio ou parcial conforme os outros ids do filtro (critério 28 já cobre o caso "etiqueta sem cards"; nenhum critério exige validar a existência dos ids do filtro, então este plano não introduz essa checagem, para não sobre-especificar).

### Contrato estendido: card sempre inclui suas etiquetas
A partir de RF08, toda resposta de card (`GET/POST/PATCH .../cards`) passa a incluir:
```
"labels": [{ "id": string, "name": string, "color": string }, ...]
```
Lista vazia quando não há etiquetas associadas — nunca `null`, mesma convenção de `assignees` (RF07): ausência de etiqueta é um estado normal, não "sem dado calculável" (diferente de `progress`, que usa `null`).

## 5. Requisitos Não Funcionais

**Segurança**
- Toda checagem de posse de etiqueta é escopada por `board_id` na própria query (`WHERE id = :labelId AND board_id = :boardId`).
- Toda checagem de associação é escopada por `card_id` **e** `label_id` juntos, nunca um sozinho.
- Nenhuma operação aceita `boardId`/`cardId`/`labelId` livremente a partir do corpo da requisição fora dos casos explícitos do contrato (`labelId` no corpo de `POST .../labels` de associação é o único caso, e é sempre validado contra o quadro do card antes de qualquer escrita).
- Rate limiting dedicado não é necessário, mesmo raciocínio de RF02–RF07.

**Desempenho**
- `CardsService.getLabelsForCards` busca etiquetas de todos os cards de uma listagem em uma única consulta (`IN (:...cardIds)`), nunca uma por card — mesmo padrão de `getProgressForCards`/`getAssigneesForCards`.
- `CardLabelRepository.filterCardIdsByLabels` é uma única consulta por chamada a `CardsService.list`, não uma por card nem uma por etiqueta do filtro.
- Índices em `labels.board_id`, `card_labels.card_id` e `card_labels.label_id` (seção 3) cobrem toda consulta introduzida por esta fase.

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF07: nenhum estado novo em memória entre requisições.
- Nenhum limite de quantidade de etiquetas por quadro ou de etiquetas por card é imposto nesta fase (RN-07) — sem paginação nas listagens novas, mesmo padrão já adotado para listas/cards/checklists/membros.

## 6. Restrições Explícitas para a Implementação

- Toda regra de negócio de RF08 (RN-01 a RN-17) reside em `labels.service` ou `cards-labels.service`, nunca em controller ou rotas.
- `labels.service` depende só de `BoardRepository` (via `findByIdAndMember`) e `LabelRepository` — nunca de `BoardMemberRepository`; nenhuma checagem de papel é introduzida nesta fase (RN-05).
- `cards-labels.service` depende de `CardRepository`/`ListRepository`/`BoardRepository` (cadeia de posse, reuso direto) e de `LabelRepository` (checar que a etiqueta pertence ao quadro do card) — nunca de `CardLabelRepository` para nada além de criar/excluir a própria associação.
- `card_labels` não tem coluna `board_id`; nenhuma cascata desta fase precisa dela (§3.2) — não reintroduzir essa denormalização "só para manter consistência com RF07".
- `CardRepository` nunca aprende a existência de `card_labels`; toda consulta que cruza as duas tabelas (filtro, leitura agregada de etiquetas por card) vive em `CardLabelRepository`, composta pelo `CardsService` — mesma fronteira de RF06/RF07.
- O filtro por etiqueta é um parâmetro de query do endpoint de listagem de cards já existente (`GET .../cards`), nunca uma rota nova.
- Nenhuma etiqueta do filtro (`labelIds`) é validada quanto à existência — um id inexistente ou de outro quadro simplesmente não casa com nenhum card (§4).
- O enum de cores (§1) é definido em `labels.schemas.ts` (validação `zod`) e replicado como `type` TypeScript na entidade `Label` — um único lugar de verdade, não duplicado em `cards-labels`.
- Nenhuma dependência nova instalada para RF08 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para `labels` e `card_labels`, com as FKs `onDelete: CASCADE` descritas na seção 3 — sem acesso a banco fora do ORM.
