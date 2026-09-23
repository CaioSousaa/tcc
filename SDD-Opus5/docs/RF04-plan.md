# RF04 — Plano técnico

**Base:** `docs/RF04-spec.md` (especificação funcional aprovada).
**Herda de:** `docs/RF01-plan.md` (C01–C24), `docs/RF02-plan.md` (C25–C43) e `docs/RF03-plan.md` (C44–C66).
Este plano acrescenta C67–C92 e **altera explicitamente** três decisões anteriores, listadas em 3.4. Ele também cumpre a obrigação C47 do RF03: toda escrita de card adquire o bloqueio do quadro.

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF04 |
| --- | --- | --- |
| Banco | PostgreSQL | posições contíguas por lista, unicidade adiável `(list_id, position)`, `text` para descrição, bloqueio do quadro |
| ORM | TypeORM | transação, migration |
| API | Express 5 + TypeScript | rotas de cards sob `/api/boards/:boardId` |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | face do card, adição inline, janela do card, confirmação |
| Testes | `vitest` | unitários; integração com PostgreSQL condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.** Restrições:

- **T6.** Arrastar e soltar continua proibido (C44). Movimentação só pela janela do card, com `<select>` nativo.
- **T7.** A descrição é texto puro. Bibliotecas de Markdown, de editor rico ou de sanitização de HTML **não** devem ser adicionadas: nada é interpretado, então nada precisa ser sanitizado.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador  /boards/[boardId]  BoardView
  ├── BoardLists → ListColumn
  │       ├── CardFace (n)               abre CardDialog
  │       └── AddCardForm | AddCardButton  (um único formulário aberto no quadro)
  ├── CardDialog                         GET do card, edição, lista/posição, "Excluir card"
  │       └── DeleteCardDialog           confirmação empilhada
  └── cardService → /api/boards/:boardId/...

API
  authenticate → validateBoardId → validate(body) → CardController → CardService
     → BoardCardRepository.withBoardLock(scope, boardId, tx => ...) → PostgreSQL
  leitura do card: CardService → BoardCardRepository.findCard(scope, boardId, cardId), sem bloqueio
```

### 2.2 Back-end: componentes

```
back-end/src/
  domain/cards.ts                    CARD_TITLE_MAX, CARD_DESCRIPTION_MAX, tipos, normalizeCardTitle, normalizeDescription
  repositories/boardLock.ts          runInBoardLock(dataSource, scope, boardId, work(manager)): extraído do RF03
  repositories/BoardCardRepository.ts  CardTransaction + withBoardLock + findCard + implementação TypeORM
  services/CardService.ts
  controllers/CardController.ts
  routes/card.routes.ts
  schemas/card.schemas.ts
  migrations/<timestamp>-CardsContentAndPositions.ts
```

Regras de fronteira obrigatórias:

- **F34.** O bloqueio do quadro tem **uma única implementação**. O trecho de `TypeOrmBoardListRepository.withBoardLock` (transação, `lock_timeout`, `SELECT ... FOR UPDATE` escopado por dono) é extraído para `repositories/boardLock.ts` e usado pelos repositórios de listas e de cards. Proibido duplicar o SQL do bloqueio (C47, C67).
- **F35.** `CardTransaction` expõe só primitivas filtradas pelo quadro bloqueado, sem regra de negócio:

| Primitiva | Efeito |
| --- | --- |
| `findCard(cardId)` | `{ id, listId, position }` ou `null` se o card não estiver em lista deste quadro |
| `findList(listId)` | lista deste quadro ou `null` |
| `countInList(listId)` | quantidade de cards da lista |
| `insert(card)` | cria o card |
| `updateContent(cardId, title, description)` | grava título e descrição |
| `moveWithinList(cardId, listId, from, to)` | reposiciona na mesma lista em instrução única |
| `openGap(listId, fromPosition)` | `position + 1` para `position >= fromPosition` |
| `relocate(cardId, toListId, toPosition)` | muda lista e posição do card |
| `closeGap(listId, afterPosition)` | `position - 1` para `position > afterPosition` |
| `remove(cardId)` | exclui o card |
| `listsWithCards(listIds)` | listas informadas, com `cardCount` e cards ordenados |

- **F36.** `CardService` contém todas as regras (RN03–RN15) e a ordem de avaliação de erros. Proibido conhecer Express, SQL ou TypeORM.
- **F37.** A identidade de um card é sempre resolvida **dentro do quadro**: `cards JOIN lists ON lists.id = cards.list_id WHERE lists.board_id = :boardId`. Não existe busca de card só por `id`, nem por `id` + lista informada pelo cliente.
- **F38.** A leitura do card para a janela (`findCard(scope, boardId, cardId)`) não usa bloqueio, mas continua escopada por dono (`JOIN boards ... owner_id`) e por quadro.
- **F39.** O `ListService` do RF03 não muda de comportamento. Só passa a usar `runInBoardLock`, e sua verificação `hasCards` passa a ter efeito real (CA34, CB22).

### 2.3 Algoritmos

Executados pelo `CardService` dentro de `withBoardLock`.

**Criar (RN07, CB10):**
1. `findList(listId)`; ausente → `LIST_NOT_FOUND`.
2. `P = countInList(listId) + 1`.
3. `insert({ id, listId, title, description: null, position: P })`.
4. Responder com `listsWithCards([listId])`.

**Salvar a janela (RN08–RN10, RN12, CB12, CB18):**
1. `card = findCard(cardId)`; ausente ou `cardId` malformado → `CARD_NOT_FOUND`.
2. `target = input.listId ?? card.listId`; se diferente de `card.listId`, `findList(target)`; ausente ou malformado → `LIST_NOT_FOUND`.
3. `updateContent(card.id, title, description)`.
4. Se `target === card.listId`:
   - `N = countInList(target)`;
   - `B = clampPosition(input.position ?? card.position, N)`;
   - `moveWithinList` quando `B ≠ card.position`.
5. Se `target ≠ card.listId`, na ordem obrigatória abaixo:
   - `M = countInList(target)`;
   - `B = clampPosition(input.position ?? M+1, M+1)`;
   - `openGap(target, B)`;
   - `relocate(card.id, target, B)`;
   - `closeGap(card.listId, card.position)`.
6. Responder com `listsWithCards` de origem e destino, sem repetição.

**Excluir (RN11):**
1. `card = findCard(cardId)`; ausente → `CARD_NOT_FOUND`.
2. `remove(card.id)`.
3. `closeGap(card.listId, card.position)`.
4. Responder com `listsWithCards([card.listId])`.

- **F40.** A ordem de 2.3 (5) é obrigatória. Com a unicidade verificada ao fim de cada instrução (D22), abrir o espaço no destino **antes** de realocar e fechar o espaço na origem **depois** garante que nenhuma instrução intermediária gera posição repetida. `moveWithinList` usa uma única instrução com `CASE`, igual ao `move` de listas (F26).
- **F41.** `clampPosition` do RF03 (`domain/lists.ts`) é reaproveitada; não se cria uma segunda implementação.

### 2.4 Front-end: componentes

```
front-end/src/
  components/cards/
    CardFace.tsx
    AddCardButton.tsx
    AddCardForm.tsx
    CardDialog.tsx
    CardLocationFields.tsx       seletores "Lista" e "Posição na lista"
    DeleteCardDialog.tsx
  components/lists/ListColumn.tsx  alterado: renderiza cards e adição
  components/Modal.tsx             alterado: prop size ("md" | "lg")
  services/cardService.ts
  schemas/card.ts
  lib/cardText.ts                  normalizeCardTitle, normalizeDescription, contagem de caracteres
  lib/cardLocation.ts              cardPositionOptions, suggestedPosition
  lib/boardState.ts                replaceLists(board, affected)
  app/(app)/boards/[boardId]/BoardView.tsx  alterado: estado de adição, janela do card
```

Regras de fronteira obrigatórias:

- **F42.** Um único formulário de adição por quadro. `BoardView` guarda `addingListId`; abrir em outra lista substitui o valor, e o formulário anterior é desmontado com o texto descartado (CA13).
- **F43.** `AddCardForm` é um `<form>` com um `<input>` de uma linha. Enter envia pelo `submit` nativo, Esc cancela, e `useSubmitLock` impede o duplo envio (CA14). Após sucesso, o campo é limpo e o foco permanece nele (CA07).
- **F44.** Ao abrir, `CardDialog` busca o card (`GET`) para obter a descrição. Enquanto carrega, mostra estado de carregamento **dentro** da janela. Título, lista e posição exibidos vêm do card retornado, não da face.
- **F45.** Os seletores de lista e posição usam funções puras de `lib/cardLocation.ts`:
  - `cardPositionOptions(count, sameList)` retorna `1..count` para a mesma lista e `1..count+1` para outra;
  - `suggestedPosition` retorna a posição atual ao voltar para a lista original e `count+1` ao trocar de lista (CA27).

  As contagens vêm do estado atual do quadro.
- **F46.** A janela sempre envia `title`, `description`, `listId` e `position`. Os opcionais do contrato existem só para CB12.
- **F47.** Após sucesso em criar, salvar ou excluir, o estado do quadro recebe as listas afetadas da resposta, substituídas por `id` (`replaceLists`), com `cardCount` e `cards` vindos do servidor (CB21, RN17). Nunca se aplica a movimentação localmente.
- **F48.** Tratamento de erros por operação, via função pura `cardFailureAction(operation, error)`:

| Código | Criar | Abrir | Salvar | Excluir |
| --- | --- | --- | --- | --- |
| `BOARD_NOT_FOUND` | tela `BoardNotFound` | tela `BoardNotFound` | tela `BoardNotFound` | tela `BoardNotFound` |
| `LIST_NOT_FOUND` | fecha o formulário, aviso "Lista não encontrada.", recarrega o quadro (CB19) | — | janela fica aberta com a mensagem; recarrega o quadro para atualizar o seletor (CB17) | — |
| `CARD_NOT_FOUND` | — | fecha a janela, aviso "Card não encontrado.", recarrega o quadro | fecha a janela, aviso "Card não encontrado.", recarrega o quadro (CB15) | tratado como sucesso: fecha as janelas e recarrega o quadro (RN15, CB16) |
| demais | mensagem no formulário (CE01) | mensagem na janela | mensagem na janela (CE02) | mensagem na confirmação (CE03) |

- **F49.** Se, após recarregar, a lista selecionada na janela não existir mais, o seletor volta para a lista atual do card (CB17).
- **F50.** `DeleteCardDialog` é um segundo `Modal` aberto sobre `CardDialog`. O `<dialog>` nativo empilha janelas modais. Cancelar fecha só a confirmação e preserva o estado do formulário (CA37), porque `CardDialog` permanece montado.
- **F51.** Título e descrição são renderizados como texto. A descrição usa `white-space: pre-wrap` para exibir quebras de linha. `dangerouslySetInnerHTML` continua proibido (CB06).

---

## 3. Modelo de dados e schema

### 3.1 Tabela `cards` após o RF04

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária (sem mudança) |
| `list_id` | `uuid` | `NOT NULL`, FK → `lists.id` `ON DELETE CASCADE` (sem mudança) |
| `title` | `varchar(200)` | `NOT NULL`, `CHECK (char_length(title) BETWEEN 1 AND 200)` |
| `description` | `text` | `NULL`; `CHECK (description IS NULL OR char_length(description) BETWEEN 1 AND 5000)` |
| `position` | `integer` | `NOT NULL`, `CHECK (position >= 1)` |
| `created_at` | `timestamptz` | sem mudança |
| `updated_at` | `timestamptz` | atualizado em qualquer edição ou movimentação do próprio card e nos deslocamentos |

Restrição nova: `UQ_cards_list_position UNIQUE (list_id, position) DEFERRABLE INITIALLY IMMEDIATE`.

### 3.2 Migration `CardsContentAndPositions`

Ordem obrigatória no `up`:
1. Renumerar posições existentes para `1..N` por lista (`ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY position, created_at, id)`).
2. Substituir `CHK_cards_position` por `CHECK (position >= 1)`.
3. Adicionar `CHK_cards_title_length`.
4. Adicionar a coluna `description` e `CHK_cards_description_length`.
5. Remover `IDX_cards_list` e criar `UQ_cards_list_position`. O índice da unicidade começa por `list_id` e passa a servir às contagens e buscas por lista.

O `down` reverte na ordem inversa, inclusive a volta das posições para base 0 e a recriação de `IDX_cards_list`.

### 3.3 Restrições de modelagem

- **D21.** "Sem descrição" é `NULL`, nunca string vazia; o `CHECK` impede string vazia. A normalização acontece na aplicação antes de gravar.
- **D22.** Unicidade `(list_id, position)` adiável e verificada ao fim de cada instrução, com a ordem de F40. A contiguidade é garantida pelo bloqueio e pelos algoritmos, como em D19.
- **D23.** O card não guarda `board_id`. O quadro do card é derivado de `lists.board_id`, o que torna RN01 estrutural: como uma lista nunca muda de quadro (RF03, RN01) e `relocate` só aceita lista do mesmo quadro (F35), o card não tem como mudar de quadro.
- **D24.** A contagem de caracteres usa pontos de código Unicode (`Array.from` na aplicação, `char_length` no banco), a mesma regra do RF02 e do RF03 (RN03).
- **D25.** A descrição é normalizada **antes** da contagem: `\r\n` e `\r` viram `\n` e as extremidades são aparadas. Assim, o limite é o mesmo seja qual for o sistema operacional de quem digitou.
- **D26.** O título é normalizado antes da contagem: cada ocorrência de `\r\n`, `\r`, `\n`, ` ` ou ` ` vira **um** espaço, e depois as extremidades são aparadas (RN03, CA11).

### 3.4 Decisões anteriores alteradas

| Decisão anterior | Nova regra | Motivo |
| --- | --- | --- |
| RF01, plano 4.1 — corpo JSON de até 10 KB | Limite de **64 KB** | Uma descrição de 5.000 caracteres pode ocupar até 20 KB em UTF-8, e mais ainda com escapes JSON. 10 KB recusaria descrições válidas (CB07). |
| RF02, N24/C64 — `GET` do quadro em até duas consultas | Até **três** consultas: quadro, listas e cards | O quadro passa a trazer os cards de cada lista (CA01). |
| RF02 D8, N25 — `IDX_cards_list` e `position >= 0` | Substituídos por `UQ_cards_list_position` e `position >= 1` | Posições `1..N` visíveis (RN06) e unicidade no banco. |

---

## 4. Interfaces: API e contratos

### 4.1 Convenções

- Todas as rotas exigem `authenticate` e `validateBoardId`.
- Ordem de avaliação (C71):
  1. sessão;
  2. formato de `boardId`;
  3. validação de corpo;
  4. acesso ao quadro;
  5. formato e existência do card no quadro;
  6. formato e existência da lista de destino no quadro.
- Campos desconhecidos são descartados (CB11).
- Datas em ISO 8601 UTC.

### 4.2 Representações

**`CardSummary`** (face, dentro das listas):

| Campo | Tipo |
| --- | --- |
| `id` | string (UUID) |
| `title` | string |
| `position` | inteiro ≥ 1 |

**`CardDetail`** (janela):

| Campo | Tipo |
| --- | --- |
| `id` | string |
| `title` | string |
| `description` | string ou `null` |
| `listId` | string |
| `position` | inteiro ≥ 1 |
| `createdAt`, `updatedAt` | string ISO |

**`ListWithCards`:** `ListItem` do RF03 (`id`, `name`, `position`, `cardCount`) mais `cards: CardSummary[]`, ordenados por `position`. `cardCount` é sempre igual a `cards.length` (RN17).

- **A37.** A descrição **não** é incluída em `CardSummary` nem no `GET` do quadro. Ela só trafega em `CardDetail`, mantendo o carregamento do quadro proporcional aos títulos, e não a até 5.000 caracteres por card.

### 4.3 `GET /api/boards/:boardId` (alterado)

`board.lists` passa a ser `ListWithCards[]`. Sem mudança de rota nem de status. No máximo três consultas (3.4).

### 4.4 `POST /api/boards/:boardId/lists/:listId/cards`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `title` | string | obrigatório; normalização D26; 1 a 200 caracteres |

Qualquer `position`, `description` ou outro campo enviado é descartado (CB10).

| Status | Situação | Corpo |
| --- | --- | --- |
| `201` | criado | `{ "card": CardSummary, "lists": ListWithCards[] }` (a lista onde o card foi criado) |
| `400` | validação | `VALIDATION_ERROR` com `fields.title` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | lista inexistente, de outro quadro ou malformada | `LIST_NOT_FOUND` |

### 4.5 `GET /api/boards/:boardId/cards/:cardId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | card do quadro | `{ "card": CardDetail }` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | card inexistente, de outro quadro ou malformado | `CARD_NOT_FOUND` |

### 4.6 `PATCH /api/boards/:boardId/cards/:cardId`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `title` | string | obrigatório; D26; 1 a 200 |
| `description` | string ou `null` | opcional; ausente ou `null` equivale a vazio; D25; até 5.000 |
| `listId` | string | opcional; ausente mantém a lista (CB12) |
| `position` | inteiro | opcional; inteiro seguro ≥ 1; ausente mantém a posição na mesma lista ou vai para o final da outra lista (CB12); acima do máximo é limitado (RN10) |

- **A38.** `description` ausente equivale a vazio, e não a "manter", porque a janela sempre envia a descrição (F46) e o `PATCH` representa o estado completo do formulário. Assim, apagar a descrição (CA21) e omiti-la têm o mesmo efeito.

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | salvo, inclusive sem mudança (CA25) | `{ "card": CardDetail, "lists": ListWithCards[] }` (origem e, se diferente, destino) |
| `400` | validação | `VALIDATION_ERROR` com `fields.title`, `fields.description` e/ou `fields.position` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | card inexistente, de outro quadro ou malformado | `CARD_NOT_FOUND` |
| `404` | lista de destino inexistente, de outro quadro ou malformada | `LIST_NOT_FOUND` |

### 4.7 `DELETE /api/boards/:boardId/cards/:cardId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | excluído | `{ "lists": ListWithCards[] }` (a lista de origem) |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | card inexistente, de outro quadro ou malformado | `CARD_NOT_FOUND` |

- **A39.** Mesmo princípio de A26 e A33: a API responde `404` quando nada foi excluído, e o front-end trata `CARD_NOT_FOUND` na exclusão como sucesso (RN15).

### 4.8 Erros

- **A40.** Novo código `CARD_NOT_FOUND` → `404`, "Card não encontrado.". Lista fechada de códigos: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `BOARD_NOT_FOUND`, `LIST_NOT_FOUND`, `LIST_HAS_CARDS`, `CARD_NOT_FOUND`, `INTERNAL_ERROR`.
- **A41.** Mensagens de campo:

| Campo | Situação | Mensagem |
| --- | --- | --- |
| `title` | vazio após normalização, ausente ou não texto | "Campo obrigatório." |
| `title` | acima de 200 | "O título do card deve ter no máximo 200 caracteres." |
| `description` | não texto (e não `null`) | "Valor inválido." |
| `description` | acima de 5.000 após normalização | "A descrição deve ter no máximo 5000 caracteres." |
| `position` | não inteiro seguro ≥ 1 | "Selecione uma posição válida." |
| `listId` | presente e não texto | "Valor inválido." |

  Um `listId` de texto com formato inválido não é erro de validação: responde `LIST_NOT_FOUND`, pela ordem de C71.

### 4.9 Front-end: `cardService`

| Função | Chamada | Retorno |
| --- | --- | --- |
| `create(boardId, listId, title)` | `POST` | `{ card, lists }` |
| `get(boardId, cardId)` | `GET` | `CardDetail` |
| `update(boardId, cardId, { title, description, listId, position })` | `PATCH` | `{ card, lists }` |
| `remove(boardId, cardId)` | `DELETE` | `lists` |

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `GET /api/boards/:boardId` | < 150 ms | 100 listas, 2.000 cards |
| `POST` / `PATCH` / `DELETE` de card | < 100 ms | listas com até 500 cards |
| `GET` do card | < 50 ms | descrição de 5.000 caracteres |

- **N67.** Número **constante** de instruções por operação de card, independente da quantidade de cards. O caso mais caro, a movimentação entre listas, usa:
  - bloqueio (1);
  - `findCard` (1);
  - `findList` (1);
  - `countInList` (1);
  - `updateContent` (1);
  - `openGap` (1);
  - `relocate` (1);
  - `closeGap` (1);
  - `listsWithCards`: listas (1) e cards (1).

  Proibido atualizar posições com uma instrução por card.
- **N68.** `GET` do quadro: uma consulta de cards de todas as listas do quadro (`JOIN lists ... WHERE board_id`), ordenada por `list_id, position` usando `UQ_cards_list_position`, agrupada em memória. Proibido uma consulta por lista.
- **N69.** A face do card recebe só `id`, `title` e `position` (A37). O tamanho da resposta do quadro cresce com os títulos, limitados a 200 caracteres.
- **N70.** O front-end não refaz requisições após sucesso (F47). Só recarrega o quadro nos casos de F48.

### 5.2 Segurança

- **N71.** Autorização por bloqueio escopado por dono nas escritas (F34) e por `JOIN boards ... owner_id` na leitura do card (F38).
- **N72.** Resolução do card e da lista de destino sempre dentro do quadro (F37, F35). Um `cardId` ou `listId` de outro quadro nunca é lido nem alterado (CA40, CA41).
- **N73.** Quadro inacessível responde `BOARD_NOT_FOUND` antes de qualquer consulta a cards (C71). `CARD_NOT_FOUND` e `LIST_NOT_FOUND` só existem após o acesso ser confirmado e não revelam dados de outros quadros.
- **N74.** Título e descrição renderizados como texto (F51). A descrição nunca é interpretada como HTML ou Markdown (T7).
- **N75.** Limite de corpo de 64 KB (3.4). Descrições maiores são recusadas pela validação antes de chegar ao banco.
- **N76.** Parâmetros vinculados em todo SQL (N9). `position` validado como inteiro seguro (N51).

### 5.3 Integridade e concorrência

- **N77.** RN06 é garantida pela mesma defesa em três camadas de N53:
  - bloqueio do quadro;
  - algoritmos de 2.3, com a ordem de F40;
  - unicidade adiável por lista.
- **N78.** RN12 é garantida por transação única. Salvar a janela aplica conteúdo e posição na mesma transação; uma falha em qualquer instrução desfaz tudo (CE04).
- **N79.** Criar e mover card adquirem o mesmo bloqueio que a exclusão de lista do RF03 (C47, F34). Com isso, "a lista está vazia" e "exclui a lista" nunca se intercalam com "insere card na lista" (CB22).
- **N80.** A leitura do card sem bloqueio pode refletir um estado anterior a uma escrita concorrente. É aceitável: a janela é apenas o ponto de partida da edição, e o salvamento revalida card e lista sob bloqueio (CB15, CB17, CB18).

### 5.4 Interface e acessibilidade

- **N81.** A face do card é um `<button>` com o título como rótulo, operável por teclado. O título quebra linha dentro da largura fixa da coluna (`overflow-wrap: anywhere`), sem truncar (CA03).
- **N82.** O campo de adição tem rótulo acessível "Título do card", recebe foco ao abrir (C62) e mantém o foco após cada adição (CA07).
- **N83.** A janela do card:
  - usa `Modal` com `size="lg"`;
  - tem rótulo superior "CARD · {lista}" em caixa alta visual;
  - tem campos rotulados "Título", "Descrição", "Lista" e "Posição na lista";
  - usa o texto "Adicione uma descrição mais detalhada…" como `placeholder` da descrição;
  - tem os botões "Salvar card" e "Excluir card" na coluna lateral, como no protótipo.
- **N84.** A confirmação de exclusão tem título "Excluir o card "{título}"?", corpo "Esta ação não pode ser desfeita.", botão destrutivo "Excluir card" e foco inicial em "Cancelar".
- **N85.** Estados de carregamento e erro da janela do card acontecem dentro da janela, sem fechar nem piscar o quadro ao fundo.

### 5.5 Testabilidade

- **N86.** Funções puras testadas:
  - `normalizeCardTitle` e `normalizeDescription` (D25, D26);
  - `cardPositionOptions` e `suggestedPosition` (CA27);
  - `replaceLists`;
  - `cardFailureAction` (tabela de F48).
- **N87.** `CardService` testado com repositório em memória que compartilha o estado de listas e cards com o do RF03, reproduz o bloqueio por quadro e o rollback, e **verifica a unicidade `(list_id, position)` a cada primitiva**, como o banco faria. Isso prova a ordem de F40.
- **N88.** Teste de sequência aleatória com semente fixa sobre várias listas (criar, mover na mesma lista, mover entre listas, excluir). Após cada operação, cada lista deve ter posições exatamente `1..N` e os cards esperados.
- **N89.** Testes de integração com PostgreSQL, pulados sem `TEST_DATABASE_URL`, cobrindo:
  - movimentação entre listas sem violar `UQ_cards_list_position`;
  - criações concorrentes na mesma lista;
  - exclusão de lista concorrente com criação de card (CB22);
  - rollback;
  - renumeração da migration.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C67 | Bloqueio do quadro com implementação única em `boardLock.ts`, usada por listas e cards |
| C68 | Nenhuma dependência nova; sem arrastar e soltar; descrição em texto puro sem biblioteca de Markdown |
| C69 | Toda escrita de card dentro do bloqueio do quadro; leitura do card escopada por dono e quadro |
| C70 | Card sempre resolvido por `cards JOIN lists WHERE lists.board_id`; lista de destino validada no mesmo quadro |
| C71 | Ordem de avaliação: sessão → `boardId` → corpo → acesso ao quadro → card → lista de destino |
| C72 | Posições de card em base 1, contíguas por lista; `UNIQUE (list_id, position) DEFERRABLE INITIALLY IMMEDIATE` |
| C73 | Criação sempre em `N+1`; posição enviada na criação é descartada |
| C74 | Movimentação entre listas na ordem `openGap(destino)` → `relocate` → `closeGap(origem)`; na mesma lista, instrução única |
| C75 | Número constante de instruções por operação de card (N67) |
| C76 | Título: quebras de linha → um espaço, aparo das extremidades, 1–200 pontos de código, `CHECK` no banco |
| C77 | Descrição: `CRLF`/`CR` → `LF`, aparo, vazia → `NULL`, até 5.000 pontos de código, `CHECK` no banco |
| C78 | `PATCH` aplica título, descrição, lista e posição em transação única; `description` ausente equivale a vazio |
| C79 | Posição fora do intervalo limitada por `clampPosition` do RF03; inválida recusada |
| C80 | Novo código `CARD_NOT_FOUND` (404) |
| C81 | Respostas de escrita trazem as listas afetadas com `cardCount` e `cards`; o front-end as substitui por `id` |
| C82 | Descrição fora do `GET` do quadro; só em `CardDetail` |
| C83 | `GET` do quadro com cards em no máximo três consultas |
| C84 | Limite de corpo JSON elevado para 64 KB |
| C85 | Um único formulário de adição aberto por quadro; Enter envia, Esc cancela, campo limpo e focado após sucesso |
| C86 | Janela do card carrega o card por `GET` ao abrir; carregamento e erros dentro da janela |
| C87 | Seletores de lista e posição por funções puras; trocar de lista sugere o final, voltar restaura a posição atual |
| C88 | Tratamento de falhas pela tabela de F48, com `CARD_NOT_FOUND` na exclusão tratado como sucesso |
| C89 | Confirmação de exclusão empilhada sobre a janela do card, preservando o formulário ao cancelar |
| C90 | Título e descrição como texto; descrição com `pre-wrap` |
| C91 | Migration reversível: renumeração, `CHECK`s, coluna `description`, troca de `IDX_cards_list` por unicidade adiável |
| C92 | Testes: funções puras, serviço com verificação de unicidade por primitiva, sequência aleatória com várias listas e integração condicionada |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA02, CA04 | `GET` do quadro com `ListWithCards` (C83), `cardCount = cards.length` (RN17) |
| CA03 | `CardFace` com quebra de linha e largura fixa (N81) |
| CA05, CA07, CA12, CA13 | `AddCardForm` único por quadro (C85, F42, F43) |
| CA06, CA15, CA16 | criação em `N+1` (C73); contagem da listagem do RF02 |
| CA08–CA11, CB01–CB06 | normalização e validação do título (C76) |
| CA14, CA38 | `useSubmitLock` + bloqueio do quadro |
| CA17, CA18 | `GET` do card (C86), `placeholder` (N83), seletores (C87) |
| CA19–CA21, CA23, CB07, CB08 | validação e normalização da descrição (C77), `PATCH` (C78) |
| CA22 | validação do corpo antes de qualquer escrita (C71) |
| CA24 | fechar desmonta a janela sem requisição |
| CA25 | `PATCH` sem mudança: conteúdo regravado, nenhum deslocamento |
| CA26–CA32 | algoritmos de 2.3, ordem de F40, `clampPosition` (C74, C79) |
| CA33 | movimentação não altera título nem descrição; `findCard` por `id` |
| CA34, CB22 | `hasCards` do RF03 sob o mesmo bloqueio (C69, N79) |
| CA35–CA37 | `DeleteCardDialog` empilhado (C89, N84) |
| CA39 | bloqueio escopado por dono → `BOARD_NOT_FOUND` |
| CA40 | resolução do card dentro do quadro → `CARD_NOT_FOUND` (C70) |
| CA41 | lista de destino dentro do quadro → `LIST_NOT_FOUND` (C70) |
| CA42 | `authenticate` + interceptador do RF01 |
| CB09–CB12 | contrato de 4.4 e 4.6 |
| CB13, CB14 | bloqueio + unicidade adiável (N77) |
| CB15–CB21 | tabela de F48 e substituição das listas afetadas (C81, C88) |
| CE01–CE05 | janelas e formulário mantidos em erro, transação única (N78) |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| `GET` extra ao abrir o card | Acrescenta uma requisição por abertura, mas evita trafegar até 5.000 caracteres por card a cada carregamento do quadro (A37). A janela exibe carregamento interno (N85). |
| Abrir um card excluído em outra aba | A spec não descreve esse caso. O plano adota o mesmo tratamento de CB15: aviso "Card não encontrado." e recarga do quadro. |
| `description` ausente no `PATCH` apaga a descrição | Contrato de estado completo (A38). Um cliente que omita o campo por engano apagaria a descrição; como só a própria interface usa a API, o risco é controlado pelo F46. |
| Elevar o limite de corpo para 64 KB | Aumento pequeno e necessário para cumprir CB07. Continua bem abaixo de limites que permitiriam abuso de memória. |
| Card sem `board_id` | Exige `JOIN` com `lists` em toda resolução, em troca de tornar impossível mudar o card de quadro sem mudar a lista. O índice de `lists.board_id`, que é a primeira coluna de `UQ_lists_board_position`, mantém o `JOIN` barato. |
| Ordem obrigatória na movimentação entre listas | Um erro de ordem viola a unicidade e vira `500`. N87 verifica a unicidade a cada primitiva nos testes unitários, e N89 prova a ordem contra o banco real. |
| Reorganização do bloqueio do RF03 | A extração para `boardLock.ts` toca código do RF03 já pronto. O comportamento não muda, e os testes do RF03 continuam válidos. |
