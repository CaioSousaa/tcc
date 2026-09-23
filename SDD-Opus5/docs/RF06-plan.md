# RF06 — Plano técnico

**Base:** `docs/RF06-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 (C01–C24), RF02 (C25–C43), RF03 (C44–C66), RF04 (C67–C92) e RF05 (C93–C116).
Este plano acrescenta C117–C142 e altera explicitamente as representações de card do RF04 (3.3).

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF06 |
| --- | --- | --- |
| Banco | PostgreSQL | tabela `checklist_items`, cascata a partir de `cards`, bloqueio de linha do card, agregação de progresso |
| ORM | TypeORM | migration, transação |
| API | Express 5 + TypeScript | rotas `/api/boards/:boardId/cards/:cardId/checklist-items` |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | seção "Checklist" na janela do card e progresso na face |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T9.** Caixas de marcação nativas (`<input type="checkbox">`) e barra de progresso com o elemento nativo `<progress>` ou com `role="progressbar"`. Bibliotecas de componentes, de ícones e de estado continuam proibidas (C25, C44).

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador  BoardView
  ├── ListColumn → CardFace + ChecklistProgress          (contagens vindas do quadro)
  └── CardDialog  (GET do card já traz a checklist)
        └── ChecklistSection
              ├── ChecklistProgress (modo seção)
              ├── ChecklistItemRow (n)   marcar · editar · excluir
              └── AddChecklistItemForm
        checklistService → POST / PATCH / DELETE /api/boards/:boardId/cards/:cardId/checklist-items[/:itemId]

API
  authenticate → validateBoardId → validate(body) → ChecklistController → ChecklistService
     → ChecklistRepository.withCardLock(scope, boardId, cardId, tx => ...) → PostgreSQL
```

### 2.2 Back-end: componentes

```
back-end/src/
  domain/checklist.ts                 CHECKLIST_ITEM_TEXT_MAX, CHECKLIST_MAX_ITEMS, ChecklistItem, normalizeChecklistText
  migrations/<timestamp>-CreateChecklistItems.ts
  entities/ChecklistItem.ts
  repositories/cardLock.ts            runInCardLock: quadro escopado por dono + bloqueio de linha do card
  repositories/ChecklistRepository.ts ChecklistTransaction + withCardLock + implementação TypeORM
  services/ChecklistService.ts
  controllers/ChecklistController.ts
  routes/checklist.routes.ts          montado sob /api/boards/:boardId/cards/:cardId/checklist-items
  schemas/checklist.schemas.ts
```

Regras de fronteira obrigatórias:

- **F63.** Toda escrita de item roda dentro de `runInCardLock(dataSource, scope, boardId, cardId, work)`. Essa função abre uma transação com `SET LOCAL lock_timeout = '5s'` (N46) e, nesta ordem:
  1. verifica o quadro escopado por dono, sem bloqueio (`SELECT id FROM boards WHERE id = :boardId AND owner_id = :ownerId`); ausente → `{ status: "board-not-found" }`;
  2. bloqueia o card daquele quadro (`SELECT c.id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = :cardId AND l.board_id = :boardId FOR UPDATE OF c`); ausente → `{ status: "card-not-found" }`;
  3. chama `work` com uma `ChecklistTransaction` restrita àquele card e confirma; qualquer exceção desfaz tudo.
- **F64.** O bloqueio é **do card**, e não do quadro. Itens de checklist não participam das posições de listas e cards, então não precisam da serialização por quadro de C47/C67. O bloqueio do card é suficiente e compatível com as operações existentes:
  - duas escritas no mesmo card são serializadas (limite de 100 itens, ordem de adição);
  - excluir o card (RF04), excluir a lista em cascata (RF05) ou excluir o quadro (RF02) removem a linha do card e esperam o bloqueio, e vice-versa;
  - mover o card (RF04, RF05) atualiza a linha do card e também espera o bloqueio.
- **F65.** `ChecklistTransaction` expõe só primitivas sem regra de negócio, todas filtradas pelo card bloqueado:

| Primitiva | Efeito |
| --- | --- |
| `count()` | quantidade de itens do card |
| `nextPosition()` | `COALESCE(MAX(position), 0) + 1` |
| `insert(item)` | cria o item |
| `findItem(itemId)` | item deste card ou `null` |
| `update(itemId, changes)` | aplica `text` e/ou `done` presentes |
| `remove(itemId)` | exclui o item |
| `listItems()` | itens do card ordenados por `position` |

- **F66.** `ChecklistService` contém as regras RN04–RN16 e a ordem de avaliação de erros (C121). Proibido conhecer Express, SQL ou TypeORM.
- **F67.** A exclusão de itens junto com o card é responsabilidade do banco, por `ON DELETE CASCADE` em `checklist_items.card_id` (RF02 D9). Nenhum serviço de card, lista ou quadro exclui itens explicitamente.
- **F68.** O progresso **não é armazenado**. Total e concluídos são sempre agregados a partir dos itens (RN10), na mesma consulta que carrega os cards do quadro (N112). Não existem colunas de contagem em `cards`.

### 2.3 Algoritmos

Dentro de `withCardLock`:

**Adicionar (RN06, RN07, RN16, CB07, CB10):**
1. `count() >= 100` → `CHECKLIST_LIMIT_REACHED`.
2. `insert({ id, text, done: false, position: nextPosition() })`.
3. Responder com o item e `listItems()`.

**Alterar (RN08, CB15, CB16):**
1. `itemId` malformado ou `findItem` ausente → `CHECKLIST_ITEM_NOT_FOUND`.
2. `update(itemId, { text?, done? })`, gravando só os campos presentes. Assim, uma edição de texto e uma marcação concorrentes não se sobrescrevem (CB15).
3. Responder com o item e `listItems()`.

**Excluir (RN14):**
1. `itemId` malformado ou `findItem` ausente → `CHECKLIST_ITEM_NOT_FOUND`.
2. `remove(itemId)`.
3. Responder com `listItems()`.

- **F69.** As posições são crescentes e únicas por card, mas **podem ter lacunas** após exclusões. A spec só exige ordem de adição (RN06), sem posições visíveis nem reordenação. Não há renumeração.

### 2.4 Front-end: componentes

```
front-end/src/
  components/checklist/
    ChecklistSection.tsx         estado dos itens, modo de edição único, erros da seção
    ChecklistItemRow.tsx         checkbox, texto clicável, lápis, excluir, edição inline
    AddChecklistItemForm.tsx     campo "Texto do item"
    ChecklistProgress.tsx        barra + textos, modos "section" e "face"
  lib/checklist.ts               progresso, textos, resumo, atualização da face no quadro, tabela de falhas
  schemas/checklist.ts           validação no cliente
  services/checklistService.ts
  components/cards/CardDialog.tsx   alterado: inclui ChecklistSection
  components/cards/CardFace.tsx     alterado: inclui ChecklistProgress
  app/(app)/boards/[boardId]/BoardView.tsx  alterado: aplica o progresso na face
```

Regras de fronteira obrigatórias:

- **F70.** Todos os números e textos de progresso vêm de funções puras de `lib/checklist.ts`:

| Função | Retorna |
| --- | --- |
| `checklistProgress(done, total)` | `null` se `total = 0`; senão `{ done, total, percent: Math.floor(done * 100 / total), complete: done === total }` |
| `sectionLabel(progress)` | "{d}/{t} concluídos · {p}%" |
| `faceLabel(progress)` | "{d}/{t}" |
| `faceAccessibleName(progress)` | "Checklist: {d} de {t} itens concluídos ({p}%)" |
| `summarize(items)` | `{ done, total }` |
| `withCardChecklist(board, cardId, summary)` | quadro com as contagens daquele card substituídas, sem alterar mais nada |
| `checklistFailureAction(operation, error)` | tabela de F74 |

  Componentes não calculam percentuais.
- **F71.** `ChecklistSection` recebe os itens iniciais do `CardDetail` carregado pela janela (F44 do RF04). Após cada resposta de sucesso, substitui a lista de itens pela `checklist` da resposta (CB22) e chama `onChecklistChange(cardId, summary)`. O `BoardView` aplica `withCardChecklist` ao quadro, e a face é atualizada sem recarregar (spec 2.6).
- **F72.** Estado de interação da seção:
  - `mode`: `null`, `{ kind: "add" }` ou `{ kind: "edit", itemId }`. Um único valor garante uma edição por vez e a exclusão mútua com o campo de adicionar (CA26).
  - `pendingItemIds`: conjunto de itens com marcação ou exclusão em andamento. Enquanto o id está no conjunto, os controles do item ficam desabilitados, o que garante CA21 sem atualização otimista.
- **F73.** Marcação sem atualização otimista: a caixa só muda quando a resposta chega. CE02 ("volta ao estado anterior") fica garantido por construção. O pedido envia `done = !item.done`, o estado desejado (RN08).
- **F74.** Tratamento de falhas:

| Código | Adicionar | Marcar / editar | Excluir |
| --- | --- | --- | --- |
| `BOARD_NOT_FOUND` | tela `BoardNotFound` | tela `BoardNotFound` | tela `BoardNotFound` |
| `CARD_NOT_FOUND` | fecha a janela, aviso, recarrega o quadro (CA38) | idem | idem |
| `CHECKLIST_ITEM_NOT_FOUND` | — | mensagem na seção + recarga da checklist pelo `GET` do card (CA36) | sem mensagem + recarga da checklist (RN14) |
| `CHECKLIST_LIMIT_REACHED`, `VALIDATION_ERROR` | mensagem no campo | mensagem no campo (edição) | — |
| demais | mensagem no campo (CE01) | mensagem na seção (CE02) | mensagem na seção (CE02) |

- **F75.** Esc nos campos de adicionar e de editar é tratado no `keydown` do campo com `preventDefault()` e `stopPropagation()`. Assim a tecla fecha só o campo e não dispara o `cancel` do `<dialog>` da janela do card (CA14, CA25).
- **F76.** "Salvar card" não envia a checklist e não a lê (CA30). Fechar a janela não faz nenhuma requisição de checklist (CA29).

---

## 3. Modelo de dados e schema

### 3.1 Tabela `checklist_items`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `card_id` | `uuid` | `NOT NULL`, FK → `cards.id` `ON DELETE CASCADE` |
| `text` | `varchar(200)` | `NOT NULL`, `CHECK (char_length(text) BETWEEN 1 AND 200)` |
| `done` | `boolean` | `NOT NULL DEFAULT false` |
| `position` | `integer` | `NOT NULL`, `CHECK (position >= 1)` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Restrição: `UQ_checklist_items_card_position UNIQUE (card_id, position)`. O índice começa por `card_id` e serve à FK, à ordenação e à agregação do progresso.

### 3.2 Migration `CreateChecklistItems`

- `up`: cria a tabela, a FK com cascata, os `CHECK`s e a unicidade.
- `down`: remove a tabela.

### 3.3 Restrições de modelagem

- **D27.** O limite de 100 itens (RN16) é garantido pelo serviço sob o bloqueio do card (F64), e não por `CHECK`, porque depende de outras linhas.
- **D28.** A normalização do texto é a mesma do título do card (RF04 D26): cada quebra de linha (`\r\n`, `\r`, `\n`, U+2028, U+2029) vira um espaço, as extremidades são aparadas e a contagem é por pontos de código. A função é **reaproveitada** de `domain/cards.ts`, sem cópia.
- **D29.** Não há `board_id` nem `list_id` em `checklist_items`: o item é resolvido pelo card, que é resolvido pela lista, que é resolvida pelo quadro (RF04 D23). Mover o card, portanto, não toca nos itens (RN02).

### 3.4 Representações de card alteradas

| Representação (RF04) | Mudança | Motivo |
| --- | --- | --- |
| `CardSummary` (face) | ganha `checklistTotal` e `checklistDone`, inteiros ≥ 0 | spec 2.6 |
| `CardDetail` (janela) | ganha `checklist: ChecklistItem[]` | spec 2.1: a seção é carregada junto com o card |
| `loadListsWithCards` | a consulta de cards agrega as contagens dos itens | N112 |

Essas mudanças valem para todas as respostas que já trazem cards ou listas com cards (quadro, listas, cards e exclusão de lista), porque todas usam `loadListsWithCards` (RF04).

---

## 4. Interfaces: API e contratos

### 4.1 Convenções

- Rotas sob `/api/boards/:boardId/cards/:cardId/checklist-items`, com `authenticate`, `validateBoardId` e `Router({ mergeParams: true })`.
- Ordem de avaliação (C121):
  1. sessão;
  2. formato de `boardId`;
  3. validação de corpo;
  4. acesso ao quadro;
  5. formato e existência do card no quadro;
  6. formato e existência do item no card;
  7. limite de itens.
- Campos desconhecidos são descartados (CB07, CB08).

### 4.2 Representação `ChecklistItem`

| Campo | Tipo |
| --- | --- |
| `id` | string (UUID) |
| `text` | string |
| `done` | boolean |
| `position` | inteiro ≥ 1 (só para ordenação) |

`checklist` é sempre o array completo de itens do card, ordenado por `position`.

### 4.3 `POST /api/boards/:boardId/cards/:cardId/checklist-items`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `text` | string | obrigatório; normalização D28; 1 a 200 caracteres |

| Status | Situação | Corpo |
| --- | --- | --- |
| `201` | criado | `{ "item": ChecklistItem, "checklist": ChecklistItem[] }` |
| `400` | validação | `VALIDATION_ERROR` com `fields.text` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | card inexistente, de outro quadro ou malformado | `CARD_NOT_FOUND` |
| `409` | 100 itens | `CHECKLIST_LIMIT_REACHED` |

### 4.4 `PATCH /api/boards/:boardId/cards/:cardId/checklist-items/:itemId`

| Campo | Tipo | Regras |
| --- | --- | --- |
| `text` | string | opcional; se presente, mesmas regras da criação |
| `done` | boolean | opcional; se presente e não booleano → `VALIDATION_ERROR`, `fields.done` = "Valor inválido." (CB06) |

Pelo menos um dos dois deve estar presente; senão `VALIDATION_ERROR` com `fields.text` = "Campo obrigatório.".

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | alterado, inclusive sem mudança (RN08) | `{ "item": ChecklistItem, "checklist": ChecklistItem[] }` |
| `400` | validação | `VALIDATION_ERROR` |
| `404` | quadro / card | `BOARD_NOT_FOUND` / `CARD_NOT_FOUND` |
| `404` | item inexistente, de outro card ou malformado | `CHECKLIST_ITEM_NOT_FOUND` |

- **A49.** `PATCH` com campos opcionais, e não duas rotas de "marcar" e "desmarcar", porque o estado é enviado explicitamente (`done: true/false`). Como só os campos presentes são gravados, marcação e edição de texto concorrentes não se sobrescrevem (CB15).

### 4.5 `DELETE /api/boards/:boardId/cards/:cardId/checklist-items/:itemId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | excluído | `{ "checklist": ChecklistItem[] }` |
| `404` | quadro / card | `BOARD_NOT_FOUND` / `CARD_NOT_FOUND` |
| `404` | item inexistente, de outro card ou malformado | `CHECKLIST_ITEM_NOT_FOUND` |

- **A50.** Mesmo princípio de A26, A33 e A39: a API responde `404` quando nada foi excluído, e o front-end trata o caso como sucesso e recarrega a checklist (RN14).

### 4.6 Alterações em contratos existentes

- `GET /api/boards/:boardId`, respostas de listas e de cards: cada `CardSummary` inclui `checklistTotal` e `checklistDone`.
- `GET /api/boards/:boardId/cards/:cardId` e resposta do `PATCH` de card: `CardDetail.checklist`.

### 4.7 Erros

- **A51.** Novos códigos:

| Código | Status | Mensagem |
| --- | --- | --- |
| `CHECKLIST_ITEM_NOT_FOUND` | 404 | "Item não encontrado." |
| `CHECKLIST_LIMIT_REACHED` | 409 | "A checklist pode ter no máximo 100 itens." |

- **A52.** Mensagens de campo:

| Campo | Situação | Mensagem |
| --- | --- | --- |
| `text` | vazio após normalização, não texto, ou `PATCH` sem `text` nem `done` | "Campo obrigatório." |
| `text` | acima de 200 | "O item deve ter no máximo 200 caracteres." |
| `done` | presente e não booleano | "Valor inválido." |

### 4.8 Front-end: `checklistService`

| Função | Chamada | Retorno |
| --- | --- | --- |
| `add(boardId, cardId, text)` | `POST` | `{ item, checklist }` |
| `update(boardId, cardId, itemId, { text?, done? })` | `PATCH` | `{ item, checklist }` |
| `remove(boardId, cardId, itemId)` | `DELETE` | `checklist` |

A marcação envia só `done`; a edição envia só `text`.

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `POST` / `PATCH` / `DELETE` de item | < 80 ms | card com 100 itens |
| `GET /api/boards/:boardId` | < 200 ms | 2.000 cards e 20.000 itens |
| `GET` do card | < 60 ms | 100 itens |

- **N111.** Número constante de instruções por operação de item:
  - verificação do quadro (1);
  - bloqueio do card (1);
  - `count` ou `findItem` (1);
  - `nextPosition`, só na criação (1);
  - escrita (1);
  - `listItems` (1).
- **N112.** O progresso da face é agregado na **mesma** consulta de cards de `loadListsWithCards`, com `LEFT JOIN` a uma agregação de `checklist_items` por `card_id` (`count(*)` e `count(*) FILTER (WHERE done)`). Continua sendo uma instrução para todos os cards do quadro (RF04 N68); é proibido uma consulta por card.
- **N113.** O `GET` do card traz os itens em uma instrução adicional ordenada por `position`, apoiada em `UQ_checklist_items_card_position`.
- **N114.** O limite de 100 itens mantém as respostas com a checklist completa pequenas (no máximo 100 × 200 caracteres).
- **N115.** O front-end não faz requisição extra após sucesso (F71). Só recarrega nos casos de F74.

### 5.2 Segurança

- **N116.** Acesso pelo quadro escopado por dono e pelo card resolvido dentro do quadro (F63). Um card de outro quadro responde `CARD_NOT_FOUND`, e um quadro de outra conta responde `BOARD_NOT_FOUND`, antes de qualquer leitura de itens (CA34).
- **N117.** Todas as primitivas filtram por `card_id` do card bloqueado. Um `itemId` de outro card nunca é lido nem alterado, mesmo sendo válido (CA35).
- **N118.** `itemId` validado como UUID antes de chegar ao banco (N30).
- **N119.** Texto renderizado como texto; `dangerouslySetInnerHTML` continua proibido (CB05).
- **N120.** Parâmetros vinculados em todo SQL (N9).

### 5.3 Integridade e concorrência

- **N121.** Bloqueio de linha do card (F64): serializa criação (limite e ordem), alteração e exclusão de itens do mesmo card. Operações em cards diferentes não se bloqueiam.
- **N122.** O limite de 100 itens é verificado depois do bloqueio (D27), então duas criações concorrentes no 99º item nunca produzem 101 itens.
- **N123.** `UNIQUE (card_id, position)` é a última barreira contra ordem ambígua. `nextPosition` sob bloqueio nunca repete posição.
- **N124.** A cascata `cards → checklist_items` garante RN15 com RF04 (exclusão de card), RF05 (cascata de lista) e RF02 (exclusão de quadro), sem mudança nesses serviços.
- **N125.** `update` com campos parciais garante CB15. Para o mesmo campo, prevalece a última escrita processada (CB14, CB16).

### 5.4 Interface e acessibilidade

- **N126.** Cada item é uma linha com `<input type="checkbox">` cujo rótulo (`<label>`) é o texto do item. Clicar no texto marca (CA20). O item concluído usa `line-through` **e** o estado da caixa, não só estilo.
- **N127.** Botões de editar e excluir com rótulos acessíveis "Editar item {texto}" e "Excluir item {texto}".
- **N128.** `ChecklistProgress` usa `role="progressbar"` com `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow={percent}` e, na face, `aria-label` = `faceAccessibleName`. Na seção, o texto visível "{d}/{t} concluídos · {p}%" é associado à barra.
- **N129.** A checklist completa usa a cor de sucesso (verde) na barra, sem depender só da cor: o texto "{t}/{t}" permanece visível.
- **N130.** O campo de adicionar recebe foco ao abrir e após cada item adicionado (CA08), usando `readOnly` durante o envio, como o formulário de adicionar card (RF04).
- **N131.** O layout segue `prototipo/modais/detalhe-card.png` (cabeçalho com contagem à direita, barra verde, itens com caixa e texto riscado, "+ Adicionar item" tracejado) e `prototipo/paginas/quadro.png` (barra fina com "d/t" na face).

### 5.5 Testabilidade

- **N132.** Funções puras de `lib/checklist.ts` testadas: arredondamento para baixo (2/3 → 66, 1/3 → 33, 99/100 → 99), total 0, textos, `withCardChecklist` e tabela de F74.
- **N133.** `ChecklistService` testado com repositório em memória que reproduz o bloqueio por card (fila), o filtro por card, a unicidade `(card_id, position)`, o rollback e a cascata quando o card é removido. Casos obrigatórios:
  - todos os ramos de 2.3;
  - ordem de avaliação;
  - limite com criações concorrentes;
  - atualização parcial.
- **N134.** Testes de `loadListsWithCards` em memória para as contagens da face, e integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - agregação na consulta de cards;
  - limite concorrente;
  - cascata ao excluir card e lista;
  - preservação dos itens ao mover card e ao excluir lista com `move`;
  - migration.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C117 | Nenhuma dependência nova; checkbox e barra nativos ou com `role="progressbar"` |
| C118 | Tabela `checklist_items` com FK `ON DELETE CASCADE` para `cards`, `CHECK`s de texto e posição, `UNIQUE (card_id, position)`; migration reversível |
| C119 | Escritas de item dentro de `runInCardLock`: quadro escopado por dono, depois `FOR UPDATE` do card no quadro |
| C120 | Primitivas de `ChecklistTransaction` sem regra de negócio e filtradas pelo card |
| C121 | Ordem de avaliação: sessão → `boardId` → corpo → quadro → card → item → limite |
| C122 | Item novo sempre no final (`MAX(position) + 1`) e não concluído; campos extras descartados |
| C123 | Posições de item crescentes e únicas por card, sem renumeração após exclusão |
| C124 | Limite de 100 itens verificado sob o bloqueio do card → `409 CHECKLIST_LIMIT_REACHED` |
| C125 | `PATCH` com `text` e/ou `done`, gravando só os campos presentes; `done` é o estado desejado |
| C126 | Normalização do texto reaproveitada de `domain/cards.ts` |
| C127 | `CHECKLIST_ITEM_NOT_FOUND` (404) para item inexistente, de outro card ou malformado; o front-end trata como sucesso na exclusão |
| C128 | Toda resposta de escrita traz a checklist completa do card |
| C129 | Progresso nunca armazenado; contagens da face agregadas na consulta única de cards |
| C130 | `CardSummary` com `checklistTotal`/`checklistDone`; `CardDetail` com `checklist` |
| C131 | Percentual `Math.floor(done * 100 / total)`; nenhum progresso com total 0 |
| C132 | Textos e números de progresso só por funções puras de `lib/checklist.ts` |
| C133 | Seção substitui itens pela resposta e atualiza a face via `withCardChecklist`, sem recarregar |
| C134 | Um único modo de edição (`add` ou `edit` de um item) por vez |
| C135 | Marcação sem atualização otimista; item com operação pendente fica desabilitado |
| C136 | Esc nos campos inline com `preventDefault` e `stopPropagation`, sem fechar a janela do card |
| C137 | Checklist independente do "Salvar card" e do fechamento da janela |
| C138 | Tratamento de falhas pela tabela de F74 |
| C139 | Nenhum serviço de card, lista ou quadro exclui itens explicitamente; cascata do banco |
| C140 | Número constante de instruções por operação de item |
| C141 | Acessibilidade: rótulo do checkbox é o texto; barra com `role="progressbar"` e nome acessível na face |
| C142 | Testes: funções puras, serviço em memória com bloqueio por card e limite concorrente, contagens da face, integração condicionada |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA02, CA06 | `CardDetail.checklist` (C130) + `checklistProgress`/`sectionLabel` (C131, C132) |
| CA03–CA05 | `CardSummary.checklistTotal/Done` agregados (C129) + `ChecklistProgress` modo face |
| CA07 | persistência + agregação a cada carga |
| CA08–CA10, CA16 | `POST` com posição no final (C122), resposta com checklist (C128), `withCardChecklist` (C133) |
| CA11–CA13 | normalização e validação (C126, A52) |
| CA14, CA25 | Esc tratado no campo (C136) |
| CA15 | `useSubmitLock` + bloqueio do card |
| CA17–CA21 | `PATCH { done }` sem otimismo, item pendente desabilitado (C125, C135) |
| CA22–CA24, CA26 | `PATCH { text }` parcial, modo único de edição (C125, C134) |
| CA27, CA28 | `DELETE` + checklist da resposta; `checklistProgress` retorna `null` com total 0 |
| CA29, CA30 | independência do "Salvar card" (C137) |
| CA31, CA32 | itens ligados ao card por `card_id`, que mover não altera (D29) |
| CA33, CA38 | cascata (C139) + `CARD_NOT_FOUND` + F74 |
| CA34 | `runInCardLock` escopado por dono → `BOARD_NOT_FOUND` |
| CA35 | filtro por card → `CHECKLIST_ITEM_NOT_FOUND` (C127) |
| CA36 | F74: mensagem e recarga, ou sucesso na exclusão |
| CA37 | estado desejado explícito (C125) |
| CA39 | `authenticate` + interceptador do RF01 |
| CB01–CB05 | validação de texto |
| CB06–CB09 | schema do `PATCH` e descarte de campos |
| CB10, CB11 | limite sob bloqueio (C124) |
| CB13–CB22 | bloqueio por card, atualização parcial, checklist completa na resposta, F74 |
| CE01–CE03 | campo e seção mantidos com mensagem; marcação sem otimismo |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Bloqueio do card, e não do quadro | Mais leve e suficiente (F64), porque itens não alteram posições de listas e cards. A garantia contra exclusão ou movimentação concorrente vem do próprio bloqueio de linha que essas operações adquirem ao alterar ou remover o card. |
| Sem atualização otimista na marcação | A caixa demora uma ida e volta para mudar. Aceitável com o alvo de < 80 ms, e elimina o estado inconsistente de CE02. |
| Contagens agregadas na carga do quadro | Aumenta o custo da consulta de cards. Mitigado pelo índice que começa por `card_id` e pelo limite de 100 itens por card (N112). |
| Posições com lacunas | Não há reordenação nem posição visível. Renumerar seria custo sem benefício, e a unicidade continua garantida. |
| Limite de 100 itens | Regra da spec (RN16). Garante respostas pequenas e deixa o limite concorrente testável. |
| Exclusão de item sem confirmação | Decisão da spec (RN13). O controle de excluir fica afastado da caixa de marcação para reduzir cliques acidentais. |
| `CardDetail` mais pesado | A janela passa a trazer até 100 itens. Ainda é uma única requisição ao abrir, sem requisições por item. |
