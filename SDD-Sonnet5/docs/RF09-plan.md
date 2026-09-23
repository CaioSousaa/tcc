# RF09 — Plano Técnico: Comentários em Cards, com Histórico Cronológico

Referência: `docs/RF09-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03), `cards` (RF04), a cascata de RF05, `checklists` (RF06), o modelo de membership de RF07 e `labels` (RF08) já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF09 é resolvido com o mesmo stack de RF01–RF08 (Express, TypeORM, PostgreSQL, `zod`, `apiClient` no front-end).

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 `Comment` como extensão do módulo `cards`, não um módulo novo

RF06–RF08 já estabeleceram dois precedentes distintos para "algo escopado a um card ou a um quadro":

- **Recurso de primeira classe, com CRUD e existência reutilizável** (`Checklist`/RF06, `Label`/RF08) → ganha seu próprio módulo.
- **Associação pura entre duas entidades que já existem de forma independente** (`CardAssignment`/RF07, `CardLabel`/RF08) → vira uma extensão do módulo `cards`, sem identidade própria.

`Comment` não se encaixa perfeitamente em nenhum dos dois: tem conteúdo próprio (texto, autor, data), como `Checklist`, mas não tem CRUD completo — RN-08 explicitamente exclui edição e exclusão — nem existe fora do card em que foi escrito, como as associações de RF07/RF08. É, na prática, o caso mais simples possível de "conteúdo filho de um card, só create e list, sem nenhum nível de aninhamento abaixo dele" — mais raso que `Checklist` (que tem um nível de itens abaixo). Esse plano resolve a ambiguidade estrutural assim: como `Comment` nunca é referenciado, listado ou reutilizado fora do card que o contém — diferente de `Label`, que tem sua própria listagem por quadro —, ele vive como extensão do módulo `cards` (arquivos `cards-comments.*`), seguindo o precedente de nomenclatura já usado por `cards-assignments`/`cards-labels`, mesmo sendo um recurso com conteúdo próprio e não uma associação.

- **Entidade** `Comment` (`entities/comment.entity.ts`): `cardId`, `authorId`, `text`, `createdAt`. **Sem `updatedAt`** — RN-08 exclui edição, então uma coluna de atualização nunca teria um `UPDATE` para registrar; mesma disciplina já usada em RF06 para não criar uma coluna de posição morta em `checklists`.
- **Rotas (`cards-comments.routes`)**, aninhadas na cadeia completa já estabelecida em RF04/RF06/RF07/RF08:
  - `POST /boards/:boardId/lists/:listId/cards/:cardId/comments`
  - `GET /boards/:boardId/lists/:listId/cards/:cardId/comments`

  **Sem `PATCH` nem `DELETE`** — RN-08 é uma exclusão de escopo explícita da própria especificação, não um esquecimento; nenhuma rota de edição ou remoção de comentário individual é criada nesta fase.
- **Controller/Service**: `cards-comments.controller` e `cards-comments.service`. O service depende de `CardRepository`/`ListRepository`/`BoardRepository` (resolver a cadeia de posse, reuso direto) e de `CommentRepository`.
- **Erros (`cards-comments.errors.ts`)**: nenhum erro novo é necessário além dos já existentes (`BoardNotFoundError`, `ListNotFoundError`, `CardNotFoundError`, `ValidationError`) — RF09 não introduz nenhuma condição de "não encontrado" própria, porque não há operação que resolva um comentário individual por id (sem `PATCH`/`DELETE`, nunca é preciso localizar *um* comentário específico fora da listagem completa).

### 2.2 Histórico de comentários é um recurso próprio, não embutido na resposta do card

Diferente de `progress` (RF06), `assignees` (RF07) e `labels` (RF08) — todos resumos leves, de tamanho previsível, úteis mesmo ao simplesmente listar vários cards —, o histórico de comentários de um card não tem limite de tamanho (RN-04) e só é relevante quando esse card específico é aberto para leitura detalhada. Embuti-lo na resposta de `GET .../cards` (que devolve *todos* os cards de uma lista de uma vez) obrigaria a carregar o histórico inteiro de cada card só para montar uma lista — o mesmo problema que já levou RF06 a manter os itens de checklist fora da resposta de listagem de cards, expondo-os só via a rota própria (`GET .../checklists`). RF09 segue exatamente esse precedente: comentários são lidos exclusivamente via `GET .../comments`, nunca embutidos em `GET/POST/PATCH .../cards`. Nenhum resumo (por exemplo, "quantidade de comentários") é adicionado à resposta do card — a especificação não pede um resumo, só o histórico completo ao abrir o card, e adicionar um contador seria responder a uma pergunta que RF09 não fez.

### 2.3 Cascata de exclusão é explícita em código de aplicação, não só `onDelete: CASCADE`

RF08 (`card_labels`) deliberadamente dispensou cascata explícita em código porque nenhuma de suas cascatas cruzava uma tabela sem passar por uma FK direta — mas isso teve um custo, registrado na validação de RF08: os critérios equivalentes a "excluir card/quadro remove os dados associados" ficaram **não verificáveis por teste unitário nesta sessão**, já que não havia nenhuma chamada de serviço para um repositório fake interceptar. RF09 faz a escolha oposta, deliberadamente: `CommentRepository` ganha `deleteAllByCards(cardIds)`, chamado explicitamente por `CardsService.remove` (ao excluir um card) e por `ListsService.remove` (ao excluir uma lista, cascateando os comentários dos cards dela) — mesmo padrão exato já usado por `ChecklistRepository.deleteAllByCards` em RF06, inclusive nos dois mesmos pontos de chamada. A justificativa aqui não é "esta cascata é impossível de expressar com uma FK só" (ela é possível, `comments.card_id → cards.id` basta) — é que os critérios 13 e 14 desta fase, ao contrário dos equivalentes de RF08, devem ser verificáveis por teste unitário com repositórios fake neste ambiente sem PostgreSQL disponível. A constraint `onDelete: CASCADE` (seção 3) permanece como rede de segurança redundante, não como o único mecanismo.

**Restrição de dependência decorrente:** `ListsService` ganha `CommentRepository` como dependência nova em seu construtor, no mesmo lugar em que já recebe `ChecklistRepository` desde RF06 — não uma dependência de `CardsService`, para não acoplar um service a outro (mesma disciplina de fronteira de repositório já estabelecida).

## 3. Modelos de Dados e Schemas

### 3.1 `comments`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| card_id | uuid | FK → `cards.id`, not null, `onDelete: CASCADE` (rede de segurança redundante; a cascata real é explícita, §2.3) |
| author_id | uuid | FK → `users.id`, not null — nunca aceito do corpo da requisição (RN-05, §4) |
| text | varchar(2000) | not null (RN-02) — mesmo tamanho máximo já usado para a descrição de um card (RF04) |
| created_at | timestamp | not null, default now |

**Sem coluna `updated_at`** (§2.1). **Sem `onDelete` declarado em `author_id`** — este projeto não tem, em nenhuma fase até aqui, uma operação de excluir um usuário (RF01 só cria conta), então essa FK nunca é exercitada por uma exclusão; declarar um comportamento de cascata para um caminho que não existe seria especificar algo sem uso, o que este projeto já evita desde a decisão de posição em RF06. RN-06 (autoria preservada após saída do quadro) já é garantida de graça por esse desenho: `author_id` referencia `users.id` diretamente, nunca `board_members`, então remover alguém de um quadro (RF07) nunca toca nem apaga `comments.author_id` — não é preciso nenhum código adicional para RN-06, ela é consequência estrutural do modelo, não uma regra que precisa de implementação própria.

Índice em `card_id` — toda leitura do histórico de um card, e a cascata em lote (`deleteAllByCards`), filtram por ele.

### 3.2 `boards`, `lists`, `cards`, `users` — sem alteração de schema
Nenhuma coluna nova. A FK de `comments` para `cards` e para `users` é suficiente.

## 4. Interfaces: APIs e Contratos

Prefixo: `/boards/:boardId/lists/:listId/cards/:cardId/comments`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated`. Formato de erro reutilizado de RF01–RF08:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de ordem de resolução:** quadro/membership do ator (`404 board_not_found` se não for membro) → lista → card (`404 list_not_found`/`404 card_not_found` conforme o caso, reuso direto de RF04/RF06/RF07/RF08) → validação do corpo. Nenhuma checagem de papel — RN-03 já descarta isso, mesma disciplina de RF08.

### `POST .../comments` (comentar)
- Body: `{ text: string }`
- 201: `{ id, text, cardId, author: { id, name, email }, createdAt }` — o autor vem sempre de `req.user`, nunca do corpo (RN-05); `author` é embutido diretamente na resposta para o front-end não precisar de uma segunda chamada para exibir quem comentou.
- 400 `validation_error`: `text` ausente/vazio, ou acima de 2000 caracteres.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: cadeia de ancestrais (critérios 5, 6).

### `GET .../comments` (histórico)
- Sem body.
- 200: `{ comments: [{ id, text, cardId, author: { id, name, email }, createdAt }, ...] }`, ordenados por `created_at ASC` (RN-07, mais antigo primeiro) — lista vazia quando o card não tem comentários (critério 8), nunca um erro.
- 404 `board_not_found` / `list_not_found` / `card_not_found`: mesma cadeia de ancestrais (critério 10).

**Sem `PATCH`/`DELETE` nesta fase** (RN-08, §2.1).

## 5. Requisitos Não Funcionais

**Segurança**
- `authorId` é sempre resolvido a partir do usuário autenticado (`req.user.id`) no `controller`, nunca aceito do corpo da requisição — impossível criar um comentário em nome de outra pessoa (RN-05), mesma disciplina de `card_assignments`/`card_labels` para `boardId` vindo do contexto, não do corpo.
- Toda leitura de comentários é escopada por `card_id` na própria query — nenhuma consulta de `comments` roda sem esse filtro.
- Rate limiting dedicado não é necessário, mesmo raciocínio de RF02–RF08.

**Desempenho**
- `GET .../comments` é uma única consulta com `JOIN` em `users` para trazer nome/e-mail do autor de cada comentário — nunca uma consulta por comentário para resolver o autor.
- Sem paginação nesta fase — RN-04 não impõe limite, mesmo padrão já adotado para listas/cards/checklists/membros/etiquetas; um card com um histórico muito longo carrega o histórico inteiro de uma vez.
- Índice em `comments.card_id` (seção 3) cobre tanto a leitura do histórico quanto a cascata em lote.

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF08: nenhum estado novo em memória entre requisições.

## 6. Restrições Explícitas para a Implementação

- Toda regra de negócio de RF09 (RN-01 a RN-11) reside em `cards-comments.service`, nunca em controller ou rotas.
- `cards-comments.service` depende de `CardRepository`/`ListRepository`/`BoardRepository` (cadeia de posse, reuso direto) e de `CommentRepository` — nenhuma checagem de papel é introduzida (RN-03).
- `CommentRepository.deleteAllByCards(cardIds)` é chamada explicitamente por `CardsService.remove` e por `ListsService.remove`, no mesmo ponto em que cada um já cascateia `checklists` (RF06) — nunca deixada só para a constraint de banco (§2.3, contraste deliberado com a escolha de RF08 para `card_labels`).
- `ListsService` ganha `CommentRepository` como dependência nova no construtor — não recebe isso indiretamente via `CardsService`.
- Nenhuma rota de edição ou exclusão de um comentário individual é criada (RN-08) — `cards-comments.routes` expõe só `POST` e `GET`.
- Nenhum resumo ou contagem de comentários é adicionado à resposta de `GET/POST/PATCH .../cards` — o histórico só é acessível via a rota própria (§2.2).
- A entidade `Comment` não tem coluna `updated_at` nem `onDelete` declarado em `author_id` (§3.1) — não introduzir nenhuma delas "por consistência" com outras entidades.
- Nenhuma dependência nova instalada para RF09 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para `comments`, com a FK `onDelete: CASCADE` para `card_id` descrita na seção 3 — sem acesso a banco fora do ORM.
