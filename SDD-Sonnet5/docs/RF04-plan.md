# RF04 — Plano Técnico: Criar, Editar, Excluir e Mover Cards entre Listas de um Quadro

Referência: `docs/RF04-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02) e `lists` (RF03) já implementados e testados no back-end, e `AuthProvider`/`apiClient`/`RequireAuth`/página de detalhe de quadro já implementados no front-end.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária — RF04 é resolvido com o mesmo stack de RF01/RF02/RF03:

**Back-end**
- Express + TypeORM + PostgreSQL, para o novo módulo `cards`.
- `zod`, para validação de payloads de criação/edição/movimentação.
- Middleware `authenticate` (RF01), verificação de posse de quadro (RF02) e resolução de lista dentro de um quadro (RF03) — reutilizados sem alteração.

**Front-end**
- Next.js + React + `axios`/`apiClient` (RF01/RF02/RF03) — reutilizados para as novas chamadas de cards.

**Restrição:** nenhuma dependência nova para RF04. Assim como em RF03, a ordenação dos cards (RN-10/RN-09/RN-12) é resolvida com uma coluna de posição inteira e lógica de aplicação — não introduzir biblioteca de drag-and-drop nem esquema de posição fracionária.

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 Back-end — módulo `cards`

Mesma divisão em camadas de `auth`, `boards` e `lists`:

- **Rotas (`cards.routes`)**: aninhadas sob lista **e** quadro — `POST /boards/:boardId/lists/:listId/cards`, `GET /boards/:boardId/lists/:listId/cards`, `PATCH /boards/:boardId/lists/:listId/cards/:cardId`, `DELETE /boards/:boardId/lists/:listId/cards/:cardId`. Isso existe pelo mesmo motivo que RF03 aninhou listas sob quadro: a spec distingue três respostas de "não encontrado" (quadro, lista, card — RN-06/RN-07/RN-08), e cada uma só é alcançável se o identificador correspondente estiver na própria URL da operação, resolvido em ordem. Todas as rotas passam por `authenticate`, sem exceção.
- **Controller (`cards.controller`)**: valida forma da requisição (schema `zod`), extrai `ownerId` de `req.user` e `boardId`/`listId`/`cardId` dos parâmetros de rota, chama o service, traduz resultado/erro em resposta HTTP.
- **Service (`cards.service`)**: contém as regras de negócio (RN-01 a RN-16). Toda operação resolve, nesta ordem: (1) o quadro pertence ao usuário (reuso de `boards` — RF02 RN-06); (2) a lista pertence a esse quadro (reuso de `lists` — RF03 RN-06); (3) o card pertence a essa lista. Editar e mover são a **mesma operação de service** (ver seção 4) — não dois métodos separados — porque mover é, na prática, uma edição do campo "lista a que pertence" de um card, e tratá-las como operações distintas duplicaria a resolução de quadro/lista/card. Não conhece Express.
- **Repository (`CardRepository`, adapter TypeORM)**: acesso a dados, sem regra de negócio, mesmo padrão de RF01–RF03. É o único componente que sabe reindexar `position` (criar, editar sem mover, mover entre listas, excluir).
- **Reuso explícito:** `cards.service` depende das mesmas capacidades de verificação de posse que `lists.service` já usa — `BoardRepository.findByIdAndOwner` e o equivalente de `ListRepository` para resolver uma lista dentro de um quadro. Nenhuma dessas verificações é duplicada.

### 2.2 Front-end — módulo `cards`

- **Camada de acesso a dados (`lib/cards/api.ts`)**: funções finas sobre o `apiClient` existente, seguindo exatamente o padrão de `lib/lists/api.ts` — uma função por operação (criar, listar, atualizar/mover, excluir).
- **Página**: a página de detalhe de um quadro (`/quadros/[id]`, hoje mostrando nome/descrição do quadro e a listagem de listas — RF02/RF03) passa a exibir, dentro de cada lista, os cards que pertencem a ela, com ações de criar, editar, excluir e mover para outra lista do mesmo quadro.
- **Estado**: mesmo estilo `useEffect`/`useState` já usado nas páginas de RF02/RF03; sem Context dedicado a cards nem biblioteca de data-fetching.

## 3. Modelos de Dados e Schemas

Nova entidade TypeORM, PostgreSQL como storage:

### 3.1 `cards`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| title | varchar(200) | not null (RN-02) |
| description | varchar(2000) | nullable (RN-03) |
| list_id | uuid | FK → `lists.id`, not null, `onDelete: CASCADE` (RN-01) |
| position | integer | not null — posição de exibição entre os cards da mesma lista, base 0 |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null, atualizado em cada update |

Índice composto em `(list_id, position)` — mesmo raciocínio de `(board_id, position)` em `lists` (RF03): toda listagem ordenada (critério 8) e toda operação de reposicionamento consultam/atualizam por essa combinação.

**Estratégia de posição:** idêntica à de RF03 — inteiro contíguo por lista, começando em 0, sem lacunas. Move o custo de reordenação para as operações de escrita (criar, editar com movimentação, excluir) e mantém a leitura trivial (`ORDER BY position ASC`).

**Movimentação entre listas como caso particular de reindexação:** mover um card da lista A para a lista B afeta a numeração de posições de **duas** listas na mesma operação — a lista A perde uma posição (as seguintes recuam) e a lista B ganha uma no final. Isso é uma extensão direta do recálculo já usado em `lists` para excluir (que reindexava uma lista) — aqui, uma operação de movimentação reindexa a lista de origem exatamente como uma exclusão reindexaria, e insere na lista de destino exatamente como uma criação insere.

## 4. Interfaces: API e Contratos

Prefixo: `/boards/:boardId/lists/:listId`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated`. Formato de erro reutilizado de RF01/RF02/RF03:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de contrato central (encadeamento de resolução):** `boardId` é resolvido primeiro (`404 board_not_found` se falhar — RN-06); só então `listId` é resolvido *dentro desse quadro* (`404 list_not_found` se falhar — RN-07); só então `cardId` é resolvido *dentro dessa lista* (`404 card_not_found` se falhar — RN-08). Nenhum desses três passos é pulado nem reordenado, em nenhuma rota.

### `POST /boards/:boardId/lists/:listId/cards`
- Body: `{ title: string, description?: string }`
- 201: `{ id, title, description, listId, position, createdAt, updatedAt }`
- 400 `validation_error`: título ausente/vazio (critério 2) ou acima de 200 caracteres (critério 3); descrição acima de 2000 caracteres.
- 404 `board_not_found` / 404 `list_not_found`: conforme qual dos dois falhar (critério 6).
- `position` do card criado é sempre `total de cards já existentes na lista` (RN-09); o corpo da requisição não pode informar `position` nem `listId` na criação — `listId` vem exclusivamente da URL.

### `GET /boards/:boardId/lists/:listId/cards`
- Sem body.
- 200: `{ cards: [{ id, title, description, listId, position, createdAt, updatedAt }, ...] }`, ordenada por `position` ascendente; array vazio quando a lista não tem cards (critério 9), nunca um erro.
- 404 `board_not_found` / 404 `list_not_found`: conforme qual dos dois falhar (critério 10).

### `PATCH /boards/:boardId/lists/:listId/cards/:cardId`
- Body: `{ title?: string, description?: string | null, targetListId?: string }` — os três campos são opcionais e independentes.
  - `title`/`description` ausentes do corpo permanecem inalterados (RN-16); `title`, se enviado, segue RN-02 (não pode ser vazio); `description: null` limpa a descrição.
  - `targetListId`, se enviado e diferente do `listId` da URL, move o card para essa lista (RN-11/RN-12) — a lista de destino deve pertencer ao mesmo `boardId` da URL. Se enviado igual ao `listId` da URL, é tratado como se não tivesse sido enviado (RN-13, critério 21) — nenhuma reindexação ocorre.
  - `title`/`description` podem ser enviados **junto** com `targetListId` na mesma chamada — editar e mover não são operações mutuamente exclusivas.
- 200: card atualizado (e, se movido, já refletindo `listId`/`position` novos).
- 400 `validation_error`: `title` vazio ou acima do limite (critério 13); `description` acima do limite.
- 404 `board_not_found` / `list_not_found`: se o `boardId`/`listId` da URL (origem) forem inacessíveis.
- 404 `card_not_found`: `cardId` inexistente, ou existente mas pertencente a uma lista diferente da `listId` da URL (critério 14, RN-08).
- 404 `list_not_found`: se `targetListId` for informado e não existir, ou não pertencer ao `boardId` da URL (critério 22, RN-11) — mesmo código usado para a lista de origem, já que o significado ("lista não encontrada/acessível") é o mesmo.

### `DELETE /boards/:boardId/lists/:listId/cards/:cardId`
- Sem body.
- 204: card excluído; posições dos cards restantes da lista recalculadas para permanecerem contíguas (RN-14).
- 404 `board_not_found` / `list_not_found`: mesmo critério de `PATCH`.
- 404 `card_not_found`: `cardId` inexistente, de outra lista, ou já excluído anteriormente (critérios 17, 18 — segunda exclusão usa o mesmo caminho de "não encontrado", sem tratamento especial de idempotência, mesmo padrão de RF02/RF03).

## 5. Requisitos Não Funcionais

**Segurança**
- Toda resolução de `boardId` é escopada por dono na própria query (reuso do padrão de RF02).
- Toda resolução de `listId` é escopada por `board_id` na própria query (reuso do padrão de RF03).
- Toda resolução de `cardId` é escopada por `list_id` na própria query (`WHERE id = :cardId AND list_id = :listId`) — mesmo raciocínio de RF03 aplicado um nível abaixo: um card de outra lista nunca deve ser alcançável trocando só o `cardId` na URL, mesmo que `boardId`/`listId` informados sejam legitimamente do usuário.
- Ao mover, a lista de destino (`targetListId`) é resolvida com a **mesma** verificação escopada por `board_id` usada para a lista de origem — nunca aceita "de qualquer jeito" só porque veio no corpo em vez da URL.
- `list_id` e `position` de um card nunca são aceitos livremente a partir do corpo da requisição fora do contrato de `PATCH` acima descrito (`targetListId` é o único mecanismo de mudança de lista, e é sempre revalidado contra o quadro).
- Rate limiting dedicado não é necessário para RF04, mesmo raciocínio de RF02/RF03.

**Desempenho**
- Índice composto em `(list_id, position)` (seção 3.1).
- Recalcular posições (criar, editar com movimentação, excluir) é uma operação sobre no máximo as listas envolvidas na operação (uma lista para criar/editar-sem-mover/excluir; duas listas — origem e destino — para mover). Nunca sobre a tabela inteira. Toda essa reindexação ocorre dentro de uma única transação de banco, para que a listagem (`GET`) nunca observe um estado intermediário com posições duplicadas, faltando, ou um card temporariamente sem lista (RN-10 sob concorrência).

**Escalabilidade**
- Mesmo modelo stateless de RF01/RF02/RF03: nenhuma regra de RF04 depende de estado em memória entre requisições.

## 6. Restrições Explícitas para a Implementação

- Toda regra de negócio de RF04 (RN-01 a RN-16) reside em `cards.service`, nunca no controller ou nas rotas.
- Editar e mover são atendidos pelo **mesmo** endpoint e pelo **mesmo** método de service — não criar uma rota `POST .../cards/:cardId/move` separada; isso duplicaria a cadeia de resolução quadro→lista→card que já precisa existir para editar.
- Nenhuma query de leitura/edição/exclusão de um card específico busca por `id` sem também filtrar por `list_id` na mesma query; nenhuma query de lista dentro deste módulo busca sem filtrar por `board_id`; nenhuma query de quadro busca sem filtrar por `owner_id` — reaproveitando exatamente a lógica de RF02/RF03 em cada nível.
- `boardId` inacessível → sempre `404 board_not_found`. `listId` inacessível dentro de um `boardId` válido → sempre `404 list_not_found`. `cardId` inacessível dentro de um `listId` válido → sempre `404 card_not_found`. As três respostas nunca se confundem entre si.
- `targetListId`, quando informado, é validado com a mesma regra de resolução de lista usada para a lista de origem (pertencer ao mesmo `boardId`) antes de qualquer reindexação ser aplicada.
- Toda operação que recalcula `position` de mais de um card (criar, editar com movimentação, excluir) ocorre dentro de uma única transação de banco; uma movimentação entre listas recalcula as duas listas envolvidas na mesma transação.
- Nenhuma lacuna nem posição repetida é observável em `GET /boards/:boardId/lists/:listId/cards` em nenhum momento (RN-10).
- Nenhuma dependência nova instalada para RF04 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para a entidade `cards`, com `list_id` como FK real para `lists.id` (`onDelete: CASCADE`) — sem acesso a banco fora do ORM.
