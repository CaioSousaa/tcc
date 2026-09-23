# RF06 — Plano Técnico: Checklists em Cards, com Itens Marcáveis e Progresso Automático

Referência: `docs/RF06-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03), `cards` (RF04) e a cascata de RF05 já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF06 é resolvido com o mesmo stack de RF01–RF05 (Express, TypeORM, PostgreSQL, `zod`, `axios`/`apiClient`).

**Restrição:** o cálculo do percentual de progresso (RN-13) é feito com uma consulta agregada (`COUNT`) no banco, não carregando checklists e itens inteiros para memória só para contar — não é necessária nenhuma biblioteca de cálculo/estatística.

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 Um único módulo `checklists` para checklist e item

RF06 introduz duas entidades novas — `Checklist` e `ChecklistItem` — mas um único módulo (`modules/checklists`), não dois. Motivo: todo item vive dentro de um checklist, e nenhuma operação de item faz sentido sem resolver o checklist primeiro; separar em dois módulos duplicaria a fronteira de resolução sem ganho — o mesmo raciocínio que já levou `boards.service` a tratar quadro como uma unidade coesa, e `lists.service` a não ter um módulo à parte para "posição".

- **Rotas (`checklists.routes`)**: aninhadas sob a cadeia completa quadro→lista→card já estabelecida em RF04, e então sob checklist para as rotas de item:
  - `POST /boards/:boardId/lists/:listId/cards/:cardId/checklists`
  - `GET /boards/:boardId/lists/:listId/cards/:cardId/checklists`
  - `DELETE /boards/:boardId/lists/:listId/cards/:cardId/checklists/:checklistId`
  - `POST /boards/:boardId/lists/:listId/cards/:cardId/checklists/:checklistId/items`
  - `PATCH /boards/:boardId/lists/:listId/cards/:cardId/checklists/:checklistId/items/:itemId`
  - `DELETE /boards/:boardId/lists/:listId/cards/:cardId/checklists/:checklistId/items/:itemId`

  Todas as rotas passam por `authenticate`, sem exceção.

- **Controller (`checklists.controller`)**: valida forma da requisição (schema `zod`), extrai `ownerId` de `req.user` e todos os parâmetros de rota (`boardId`/`listId`/`cardId`/`checklistId`/`itemId`, conforme a operação), chama o service, traduz resultado/erro em resposta HTTP.
- **Service (`checklists.service`)**: contém as regras de negócio (RN-01 a RN-16). Toda operação resolve a cadeia completa, na ordem: quadro (dono) → lista (pertence ao quadro) → card (pertence à lista) → checklist (pertence ao card, quando aplicável) → item (pertence ao checklist, quando aplicável). Não conhece Express.
- **Repository (`ChecklistRepository`, adapter TypeORM)**: acesso a dados para `Checklist` e `ChecklistItem`, sem regra de negócio, mesmo padrão de RF01–RF05.

**Restrição sobre a profundidade das rotas:** a cadeia completa (`boardId`/`listId`/`cardId` sempre presentes, mesmo para operações de checklist/item) é deliberada, não um descuido. RF04 e RF05 já estabeleceram — e RF05 já validou explicitamente (`RF05-validation.md`, divergência 1) — que resolver um recurso sem antes confirmar que seu ancestral direto existe *dentro do ancestral informado* é exatamente o tipo de atalho que quebra o isolamento entre usuários. Encurtar essas rotas (por exemplo, `/cards/:cardId/checklists/:checklistId`, sem repetir quadro/lista) exigiria um mecanismo novo de resolução de posse — subir de checklist até o dono do quadro via `JOIN`, algo que nenhum repositório deste projeto faz hoje — só para economizar caracteres de URL. Reutilizar exatamente os três métodos que já existem (`BoardRepository.findByIdAndOwner`, `ListRepository.findByIdAndBoard`, `CardRepository.findByIdAndList`) é mais simples e mais consistente do que inventar esse mecanismo novo.

### 2.2 `CardsService` passa a depender de `ChecklistRepository` (para expor o progresso)

A spec (RN-13) exige que o percentual de progresso seja "exibido no próprio card". Isso significa que a resposta de `GET /boards/:boardId/lists/:listId/cards` e de qualquer outra rota que devolve um card (RF04) precisa incluir esse dado. Para isso, `CardsService` passa a depender de uma capacidade de leitura de `ChecklistRepository` — uma consulta agregada que, dado um `cardId` (ou uma lista de `cardId`s), devolve quantos itens existem e quantos estão concluídos, somando todos os checklists daquele card.

Essa é uma dependência de **repositório** (leitura agregada), não de `ChecklistsService` — mesmo padrão de fronteira já estabelecido em RF05 para o sentido inverso (`ListsService` depende de `CardRepository`, não de `CardsService`). O grafo de dependências entre módulos, depois de RF06, tem duas arestas em sentidos opostos entre `cards` e outros módulos (`cards` depende de `lists`, RF04; `lists` depende de `cards`, RF05; `cards` depende de `checklists`, RF06) — todas elas em nível de repositório, nunca de serviço para serviço, então nenhum ciclo de importação surge (interfaces de repositório de um módulo nunca precisam importar as de outro).

**Restrição de desempenho (evitar N+1):** ao listar todos os cards de uma lista, o progresso de todos eles é obtido com **uma única consulta agregada** (agrupada por `card_id`), não uma consulta por card. Isso é uma restrição explícita, não uma sugestão — uma lista com muitos cards não pode disparar uma query de progresso por card.

## 3. Modelos de Dados e Schemas

Duas entidades novas, PostgreSQL como storage:

### 3.1 `checklists`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| name | varchar(100) | not null (RN-02) |
| card_id | uuid | FK → `cards.id`, not null, `onDelete: CASCADE` (RN-01, e cumpre RN-15 quando o próprio card for excluído — RF04) |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null |

Índice em `card_id` — toda listagem de checklists de um card, e toda consulta de progresso, filtram por essa coluna.

### 3.2 `checklist_items`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| text | varchar(500) | not null (RN-04) |
| completed | boolean | not null, default `false` (RN-05) |
| checklist_id | uuid | FK → `checklists.id`, not null, `onDelete: CASCADE` (RN-03, e cumpre RN-15) |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null |

Índice em `checklist_id` — toda listagem de itens de um checklist, e toda consulta de progresso, filtram por essa coluna.

**Sem coluna de posição.** Diferente de `lists` (RF03) e `cards` (RF04), nem `checklists` nem `checklist_items` têm uma coluna `position`. RN-14 já define a ordem de exibição como "a ordem em que foram criados" e explicitamente exclui reordenação manual do escopo — uma coluna de posição existiria só para ser lida na mesma ordem que `created_at` já dá de graça, sem nenhuma operação de escrita que a exercitasse. Ordenar por `created_at ASC` (com `id` como desempate, já que dois registros não podem ter o mesmo timestamp de forma útil de se distinguir) é suficiente e não introduz uma coluna morta.

**Exclusão em cascata dupla.** `checklist_items.checklist_id` tem `onDelete: CASCADE`, e `checklists.card_id` também. Isso significa que excluir um card (RF04) já apaga, por si só, seus checklists e os itens deles — sem precisar de nenhum código novo em `CardsService`. Seguindo a mesma decisão de RF05 (tornar a cascata explícita em código de aplicação, não só na constraint de banco, para ser testável sem depender de um PostgreSQL real), `CardsService.remove` e `ListsService.remove` (que já excluem cards em cascata, RF05) precisam também excluir os checklists (e, por tabela, seus itens) explicitamente — ver seção 6.

## 4. Interfaces: APIs e Contratos

Prefixo: `/boards/:boardId/lists/:listId/cards/:cardId`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated`. Formato de erro reutilizado de RF01–RF05:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de contrato central (encadeamento de resolução):** `boardId` → `listId` → `cardId` são resolvidos nessa ordem (reuso exato de RF04). Só então `checklistId`, quando presente na rota, é resolvido *dentro desse card* (`404 checklist_not_found` se falhar). Só então `itemId`, quando presente, é resolvido *dentro desse checklist* (`404 item_not_found` se falhar).

### `POST .../checklists`
- Body: `{ name: string }`
- 201: `{ id, name, cardId, items: [], createdAt, updatedAt }`
- 400 `validation_error`: nome ausente/vazio (critério 2) ou acima de 100 caracteres (critério 3).
- 404 `board_not_found` / `list_not_found` / `card_not_found`: conforme qual dos três falhar (critério 5).

### `GET .../checklists`
- Sem body.
- 200: `{ checklists: [{ id, name, cardId, items: [{ id, text, completed, checklistId, createdAt, updatedAt }, ...], createdAt, updatedAt }, ...] }`, checklists ordenados por `created_at`, itens de cada checklist também ordenados por `created_at`. Não existe uma rota separada de listagem de itens — eles vêm embutidos na resposta do checklist ao qual pertencem, já que nunca são exibidos fora desse contexto.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: mesmo critério de `POST`.

### `DELETE .../checklists/:checklistId`
- Sem body.
- 204: checklist e todos os seus itens excluídos (RN-15).
- 404 `board_not_found` / `list_not_found` / `card_not_found`: se algum ancestral for inacessível.
- 404 `checklist_not_found`: `checklistId` inexistente, de outro card, ou já excluído anteriormente (critério 24).

### `POST .../checklists/:checklistId/items`
- Body: `{ text: string }`
- 201: `{ id, text, completed: false, checklistId, createdAt, updatedAt }`
- 400 `validation_error`: texto ausente/vazio (critério 8) ou acima de 500 caracteres (critério 9).
- 404 `checklist_not_found`: `checklistId` inexistente ou de outro card (critério 10), além dos 404 de ancestrais.

### `PATCH .../checklists/:checklistId/items/:itemId`
- Body: `{ completed: boolean }` — único campo aceito; esta rota não edita o texto do item (não faz parte do escopo de RF06, RN-03).
- 200: item atualizado.
- 404 `checklist_not_found` / (ancestrais): se algum deles for inacessível.
- 404 `item_not_found`: `itemId` inexistente ou de outro checklist (critério 14).

### `DELETE .../checklists/:checklistId/items/:itemId`
- Sem body.
- 204: item excluído (critério 21).
- 404 `item_not_found`: `itemId` inexistente, de outro checklist, ou já excluído anteriormente (critério 22).

### Progresso exposto no card (RF04, contrato estendido)
A partir de RF06, todo card retornado por `GET .../cards`, `POST .../cards` ou `PATCH .../cards/:cardId` (RF04) passa a incluir um campo adicional:
```
"progress": { "completed": number, "total": number, "percentage": number } | null
```
`null` quando o total de itens do card (somando todos os seus checklists) for zero (RN-13, critério 17) — nunca um objeto com `percentage: 0` nesse caso. Quando há pelo menos um item, `percentage` é `Math.round((completed / total) * 100)`; a casa decimal exata de exibição além disso é decisão de front-end, não deste contrato.

## 5. Requisitos Não Funcionais

**Segurança**
- Toda resolução de `checklistId` é escopada por `card_id` na própria query (`WHERE id = :checklistId AND card_id = :cardId`).
- Toda resolução de `itemId` é escopada por `checklist_id` na própria query (`WHERE id = :itemId AND checklist_id = :checklistId`).
- Nenhuma operação aceita `card_id`/`checklist_id` livremente a partir do corpo da requisição — ambos vêm exclusivamente da URL, já validados pela cadeia de resolução.
- Rate limiting dedicado não é necessário, mesmo raciocínio de RF02–RF05.

**Desempenho**
- Consulta de progresso agregada (`COUNT`/`GROUP BY`), nunca carregando itens individuais para contá-los em código de aplicação.
- Listar cards de uma lista busca o progresso de todos eles em uma única consulta (seção 2.2) — não uma por card.
- Índices em `checklists.card_id` e `checklist_items.checklist_id` (seção 3).

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF05: nenhum estado novo em memória entre requisições.

## 6. Restrições Explícitas para a Implementação

- Toda regra de negócio de RF06 (RN-01 a RN-16) reside em `checklists.service`, nunca no controller ou nas rotas.
- Nenhuma query de checklist busca por `id` sem também filtrar por `card_id`; nenhuma query de item busca por `id` sem também filtrar por `checklist_id`.
- `boardId`/`listId`/`cardId` inacessíveis produzem os mesmos 404 já definidos em RF02/RF03/RF04, nessa ordem, antes de qualquer resolução de checklist ou item ser tentada.
- `CardsService.remove` e `ListsService.remove` (RF04/RF05) passam a excluir explicitamente os checklists (e, por cascata própria do checklist, seus itens) do(s) card(s) envolvido(s), na mesma linha de raciocínio que RF05 já aplicou para cards — a exclusão em cascata deve ser testável com repositórios fake em memória, não depender só da constraint de banco.
- `CardsService` depende de `ChecklistRepository` apenas para leitura agregada de progresso — nunca escreve em `checklists`/`checklist_items`.
- `ChecklistsService` depende de `BoardRepository`/`ListRepository`/`CardRepository` (reuso direto, mesmos métodos já existentes) para resolver a cadeia de posse — nunca de `BoardsService`/`ListsService`/`CardsService`.
- Nenhuma coluna de posição é criada para `checklists` ou `checklist_items`; a ordem de exibição é por `created_at`.
- O campo `completed` de um item só é alterado pela rota `PATCH .../items/:itemId`; nenhuma outra rota desta fase aceita esse campo.
- Nenhuma dependência nova instalada para RF06 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para `checklists` e `checklist_items`, com as FKs `onDelete: CASCADE` descritas na seção 3 — sem acesso a banco fora do ORM.
