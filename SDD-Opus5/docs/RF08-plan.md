# RF08 — Plano técnico

**Base:** `docs/RF08-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 ao RF07 (C01–C178).
Este plano acrescenta C179–C212 e altera explicitamente as representações de quadro e de card (3.5).

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF08 |
| --- | --- | --- |
| Banco | PostgreSQL | tabelas `labels` e `card_labels`; unicidade de nome sem diferenciar maiúsculas; FK composta; cascatas; agregação de uso e de etiquetas por card |
| ORM | TypeORM | migration e transações pelos bloqueios existentes |
| API | Express 5 + TypeScript | rotas de etiquetas do quadro e de etiquetas do card |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | janela "Etiquetas do quadro" (dois modos), seção "Etiquetas" do card, etiquetas na face e barra de filtro |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T12.** A paleta é uma lista fechada no código dos dois projetos, como as cores de quadro (RF02 D17). Nenhuma biblioteca de seletor de cor.
- **T13.** O filtro é uma função pura no cliente sobre os dados do quadro já carregados. Nenhuma biblioteca de estado, de consulta ou de busca, e nenhuma chamada à API para filtrar.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador  BoardView  (estado: board, seleção do filtro)
  ├── BoardHeader ─ botão "Etiquetas" (só labels.manage) → LabelsDialog mode="manage"
  ├── LabelFilterBar ─ seleção local + total "{X} de {N} cards"
  ├── BoardLists(listas PROJETADAS pelo filtro) → ListColumn → CardFace + LabelChip
  └── CardDialog ─ CardLabelsSection ─ "Gerenciar etiquetas" → LabelsDialog mode="card"
  lib/labels.ts (filtro, projeção, contagens, textos, tabela de falhas)

API
  /api/boards/:boardId/labels[/:labelId]                  → LabelService     → runInBoardLock (papel)
  /api/boards/:boardId/cards/:cardId/labels/:labelId      → CardLabelService → runInCardLock (papel)
  GET /api/boards/:boardId                                → BoardDetail.labels + CardSummary.labelIds
```

### 2.2 Regras de fronteira obrigatórias

- **F96.** Toda escrita em `labels` (criar, editar, excluir) roda em `runInBoardLock` do quadro, com o papel lido no bloqueio. `assertCan(role, "labels.manage")` vem antes de qualquer leitura de etiqueta (RF07 F80, C148). O bloqueio serializa o limite de 50 (RN06, CB10) e a unicidade de nome (RN04, CB09).
- **F97.** Aplicar e remover etiqueta rodam em `runInCardLock`, com `assertCan(role, "labels.apply")`. Assim, a aplicação é serializada por card como a checklist e os responsáveis (RF06 F63, RF07 F79). Excluir uma etiqueta **não** bloqueia os cards: a cascata é feita pelo banco (F99).
- **F98.** Ordem de avaliação em toda rota deste requisito: sessão → `boardId` → corpo → participação (`BOARD_NOT_FOUND`) → permissão (`FORBIDDEN`) → card (`CARD_NOT_FOUND`, só nas rotas de card) → etiqueta (`LABEL_NOT_FOUND`) → regras de estado (`LABEL_NAME_TAKEN`, `LABEL_LIMIT_REACHED`).
- **F99.** A remoção de aplicações é sempre do banco:
  - excluir etiqueta remove as aplicações por `ON DELETE CASCADE` de `card_labels.label_id`;
  - excluir card, lista em cascata ou quadro remove as aplicações pela cascata de `cards` e `labels`.

  Nenhum serviço apaga aplicações explicitamente, exceto a remoção pedida pelo usuário (RN10, RN12).
- **F100.** Uma etiqueta só é aplicada a card do mesmo quadro, garantido em duas camadas:
  - **serviço:** procura a etiqueta **no quadro do card bloqueado**;
  - **banco:** FK composta `card_labels (label_id, board_id) → labels (id, board_id)`, com `card_labels.board_id` gravado a partir do card bloqueado, nunca do cliente (RN01, CA36, D38).
- **F101.** A ordem das etiquetas é `labels.created_at, labels.id` em **todas** as leituras: lista do quadro, `labelIds` da face e do card. Nenhum lugar ordena por nome ou por cor (RN11).
- **F102.** O filtro **nunca** chega à API e **nunca** altera o estado do quadro guardado no cliente. Ele produz uma projeção de exibição a partir de `board.lists` e da seleção (RN08, RN09).

### 2.3 Back-end: componentes

```
back-end/src/
  domain/labels.ts                     LABEL_COLORS, LabelColor, LABEL_NAME_MAX = 30, LABELS_MAX = 50,
                                       normalizeLabelName, labelNameKey, LabelView
  migrations/1760000007000-CreateLabels.ts
  entities/Label.ts, CardLabel.ts
  repositories/labels.ts               loadLabels(db, boardId) com uso; loadCardLabelIds(db, cardId)
  repositories/LabelRepository.ts      LabelTransaction (primitivas) + leitura escopada
  repositories/CardLabelRepository.ts  CardLabelTransaction (primitivas no card bloqueado)
  repositories/listsWithCards.ts       alterado: labelIds agregados na instrução de cards
  repositories/BoardRepository.ts      alterado: BoardDetail.labels
  repositories/BoardCardRepository.ts  alterado: CardDetail.labelIds
  services/LabelService.ts             listar, criar, editar, excluir
  services/CardLabelService.ts         aplicar, remover
  schemas/label.schemas.ts
  controllers/LabelController.ts, CardLabelController.ts
  routes/label.routes.ts               /api/boards/:boardId/labels
  routes/card.routes.ts                alterado: /:cardId/labels/:labelId
  errors/*, middlewares/errorHandler   novos códigos (A59)
```

Primitivas de `LabelTransaction`, restritas ao quadro bloqueado e sem regras:

| Primitiva | Efeito |
| --- | --- |
| `count()` | quantidade de etiquetas do quadro |
| `findLabel(labelId)` | etiqueta deste quadro ou `null` |
| `isNameTaken(name, exceptLabelId?)` | existe outra etiqueta do quadro com o mesmo `labelNameKey` |
| `insert({ id, name, color })` | lança `UniqueConstraintError` na violação da unicidade (F104) |
| `update(labelId, { name, color })` | idem |
| `delete(labelId)` | aplicações vão por cascata |
| `listLabels()` | todas as etiquetas do quadro, na ordem de F101, com uso |

Primitivas de `CardLabelTransaction`, restritas ao card bloqueado:

| Primitiva | Efeito |
| --- | --- |
| `findLabel(labelId)` | etiqueta **do quadro do card** ou `null` |
| `apply(labelId)` | `INSERT … ON CONFLICT DO NOTHING`, com `board_id` vindo do card; devolve `false` quando a FK recusa (etiqueta excluída entre a leitura e a escrita) |
| `remove(labelId)` | `DELETE` idempotente |
| `listCardLabelIds()` | etiquetas do card na ordem de F101 |
| `listLabels()` | etiquetas do quadro com uso, como `LabelTransaction.listLabels` |

- **F103.** `LabelService` contém RN03, RN04 e RN06. `CardLabelService` contém RN07. Primitivas não contêm regras (padrão de RF03 F22 e RF07 F84).
- **F104.** A unicidade de nome é verificada no serviço, sob o bloqueio do quadro, por `isNameTaken`. O índice único `(board_id, lower(name))` é a última barreira, e a sua violação é traduzida para `LABEL_NAME_TAKEN`.
- **F105.** `labelNameKey(name)` é a normalização de RN03 seguida de conversão para minúsculas. Deve produzir a mesma chave que `lower(name)` do banco para os caracteres aceitos. Se divergir, prevalece o índice (F104).

### 2.4 Algoritmos

**Criar (RN03, RN04, RN06, CB09, CB10):** dentro de `runInBoardLock`:
1. `assertCan(role, "labels.manage")`.
2. `count() >= 50` → `LABEL_LIMIT_REACHED`.
3. `isNameTaken(name)` → `LABEL_NAME_TAKEN`.
4. `insert`; `UniqueConstraintError` → `LABEL_NAME_TAKEN`.
5. Responder com a etiqueta criada e `listLabels()`.

**Editar (CA13–CA15, CB08, CB17):**
1. `assertCan(role, "labels.manage")`.
2. `findLabel` ausente ou `labelId` malformado → `LABEL_NOT_FOUND`.
3. `isNameTaken(name, labelId)` → `LABEL_NAME_TAKEN`. A própria etiqueta nunca conflita, então trocar só maiúsculas e minúsculas é aceito (CA15).
4. `update` (mesmo sem mudança; `created_at` não muda).
5. Responder com a etiqueta e `listLabels()`.

**Excluir (RN10, CB12, CE04):**
1. `assertCan(role, "labels.manage")`.
2. `findLabel` ausente → `LABEL_NOT_FOUND`.
3. `delete`: as aplicações vão pela cascata, na mesma instrução.
4. Responder com `listLabels()`.

**Aplicar (RN07, CB11, CA36, CA37):** dentro de `runInCardLock`:
1. `assertCan(role, "labels.apply")`.
2. `labelId` malformado ou `findLabel` ausente → `LABEL_NOT_FOUND`.
3. `apply`; `false` → `LABEL_NOT_FOUND`.
4. Responder com `listCardLabelIds()` e `listLabels()`.

**Remover:**
1. `assertCan(role, "labels.apply")`.
2. `labelId` malformado ou `findLabel` ausente → `LABEL_NOT_FOUND`.
3. `remove`, idempotente para etiqueta existente não aplicada.
4. Responder como em aplicar.

- **F106.** Remover uma etiqueta que **não existe mais** responde `LABEL_NOT_FOUND`. O front-end recarrega as etiquetas e trata o resultado como concluído, porque a etiqueta já não está no card (CB12).

### 2.5 Front-end: componentes

```
front-end/src/
  lib/labelColors.ts                 paleta: chave, rótulo em português e cor (mesma ordem de domain/labels.ts)
  lib/labels.ts                      funções puras de F107–F112
  services/labelService.ts           list, create, update, remove, apply, unapply
  schemas/label.ts                   nome e cor (RN02, RN03)
  components/labels/
    LabelChip.tsx                    nome sobre a cor; usado na face, no card e na barra
    LabelColorPicker.tsx             grupo de rádio com as 6 cores
    NewLabelForm.tsx                 "Nova etiqueta": Nome, paleta, Criar
    LabelManageRow.tsx               cor, nome, uso, Editar, Excluir; e o formulário de edição em linha
    LabelCheckRow.tsx                caixa, cor, nome, uso
    DeleteLabelDialog.tsx
    LabelsDialog.tsx                 mode "manage" | "card"
    LabelFilterBar.tsx
  components/cards/CardLabelsSection.tsx
  alterados: BoardView, BoardHeader, BoardLists, ListColumn, CardFace, CardDialog, services/boardService, services/cardService
```

Regras de fronteira obrigatórias:

- **F107.** A seleção do filtro é estado de `BoardView` (`useState`), inicializada vazia a cada montagem. Não usa URL, `localStorage`, cookie nem contexto global (RN09, CA30).
- **F108.** A projeção é feita por `filterLists(lists, selection)` em `lib/labels.ts`:
  - devolve **todas** as listas, na ordem;
  - em cada lista, só os cards que atendem RN08, na ordem original;
  - `cardCount` igual aos cards exibidos.

  É a **única** entrada de `BoardLists`. `visibleTotalLabel(visible, total, filtered)` produz "{N} cards no quadro" ou "{X} de {N} cards" (2.8).
- **F109.** Nada além de `BoardLists` recebe listas projetadas:
  - `CardDialog`, `ListFormDialog`, `DeleteListDialog` e `DeleteListWithCardsDialog` recebem `board.lists` completo;
  - handlers que recebem uma lista da coluna resolvem a lista por `id` em `board.lists`.

  Isso preserva as posições do RF04 (CA34) e o `expectedCardCount` do RF05, que nunca podem vir de contagem filtrada.
- **F110.** Cada resposta de escrita atualiza o quadro no cliente por funções puras:
  - `withLabels(board, labels)`: nomes, cores e usos;
  - `withCardLabels(board, cardId, labelIds)`: face do card;
  - `withoutLabel(board, labelId)`: remove o id de todos os `labelIds` após exclusão.

  A seleção passa por `pruneSelection(selection, labels)` sempre que `board.labels` muda (CB16, CA33).
- **F111.** A face e a seção do card resolvem `labelIds` contra `board.labels` com `resolveLabels(labelIds, labels)`, que preserva a ordem de F101 e ignora ids sem etiqueta.
- **F112.** `labelFailureAction(operation, error)` define o tratamento de falhas:

| Código | Operação | Ação |
| --- | --- | --- |
| `BOARD_NOT_FOUND` | qualquer | página "Quadro não encontrado." |
| `FORBIDDEN` | criar, editar, excluir | fecha a janela, aviso no quadro e recarrega o quadro (CB14, RF07 F90) |
| `CARD_NOT_FOUND` | aplicar, remover | fecha as janelas do card e recarrega o quadro (CB13) |
| `LABEL_NOT_FOUND` | excluir, remover | sucesso: recarrega as etiquetas (CB12) |
| `LABEL_NOT_FOUND` | editar, aplicar | mensagem na janela e recarrega as etiquetas (CA37) |
| `VALIDATION_ERROR`, `LABEL_NAME_TAKEN`, `LABEL_LIMIT_REACHED` | criar, editar | mensagem junto ao campo "Nome" |
| outros | criar, editar | mensagem junto ao formulário, com valores mantidos (CE01) |
| outros | aplicar, remover | mensagem na janela, com a caixa no estado salvo (CE02) |
| outros | excluir | mensagem na confirmação (CE03) |

- **F113.** `LabelsDialog` abre sobre a página (modo gerenciamento) ou sobre a janela do card (modo card), com o `Modal` existente. Ao abrir, recarrega as etiquetas com `GET /labels`, para que usos e lista reflitam o salvo (CB15). Cada resposta substitui a lista da janela e é repassada à `BoardView`.
- **F114.** Aplicar e remover seguem o padrão da checklist e dos responsáveis (RF06 C135, RF07 F93):
  - sem atualização otimista: a caixa reflete o estado salvo;
  - controle pendente por etiqueta;
  - independência do "Salvar card" (CA23).
- **F115.** O aviso "Card criado. Ele não aparece por causa do filtro de etiquetas." aparece quando uma criação de card é concluída com filtro ativo. Ele é guardado em `BoardView` pelo id da lista e limpo na próxima ação do usuário: abrir card, iniciar adição, mudar filtro ou abrir qualquer janela (CA31).
- **F116.** A janela do card aberta não depende da projeção: ela continua aberta quando o card deixa de atender o filtro, e a face some ao fechá-la (CA32).
- **F117.** Controles por papel com `can(myRole, action)` (RF07 F88):

| Controle | Ação exigida |
| --- | --- |
| botão "Etiquetas" no cabeçalho | `labels.manage` |
| formulário "Nova etiqueta" no modo card | `labels.manage` |
| "Gerenciar etiquetas" e caixas do modo card | `labels.apply` |
| barra de filtro | nenhuma: qualquer participante |

---

## 3. Modelo de dados e schema

### 3.1 Tabela `labels`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `board_id` | `uuid` | `NOT NULL`, FK → `boards.id` `ON DELETE CASCADE` |
| `name` | `varchar(30)` | `NOT NULL`, `CHECK (char_length(name) BETWEEN 1 AND 30)`, já normalizado |
| `color` | `varchar(16)` | `NOT NULL`, `CHECK (color IN ('red', 'blue', 'green', 'amber', 'purple', 'gray'))` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT clock_timestamp()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Restrições e índices:
- `UQ_labels_id_board UNIQUE (id, board_id)`: alvo da FK composta;
- índice único `UQ_labels_board_name_ci` em `(board_id, lower(name))`: RN04;
- índice `IDX_labels_board_order` em `(board_id, created_at, id)`: F101.

### 3.2 Tabela `card_labels`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `card_id` | `uuid` | `NOT NULL`, FK → `cards.id` `ON DELETE CASCADE` |
| `label_id` | `uuid` | `NOT NULL` |
| `board_id` | `uuid` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

Chaves e índices:
- chave primária `(card_id, label_id)`: RN07;
- FK composta `(label_id, board_id)` → `labels (id, board_id)` `ON DELETE CASCADE`;
- índice `IDX_card_labels_label` em `(label_id)`: uso e cascata.

### 3.3 Migration `CreateLabels`

- **D36.** Um único arquivo `1760000007000-CreateLabels`, registrado no `DataSource` depois de `1760000006000`. Cria as duas tabelas, as restrições e os índices de 3.1 e 3.2, e é reversível: o `down` remove `card_labels` e depois `labels`. Nenhuma migração de dados: quadros existentes começam sem etiquetas.

### 3.4 Restrições de modelagem

- **D37.** A cor é uma **chave** estável (`red`, `blue`, `green`, `amber`, `purple`, `gray`), nunca um código hexadecimal nem o rótulo em português. A tradução para cor e rótulo é do front-end (`lib/labelColors.ts`). As chaves devem ser idênticas em `domain/labels.ts`, no `CHECK` e em `lib/labelColors.ts`.
- **D38.** `card_labels.board_id` é redundante com o quadro do card, como `card_assignees.board_id` (RF07 D32), mas é imutável, porque um card nunca muda de quadro. É gravado a partir de `cards JOIN lists` do card bloqueado. A redundância habilita a FK composta de F100.
- **D39.** `created_at` de `labels` usa `clock_timestamp()` para evitar empates entre etiquetas criadas na mesma transação de testes. O desempate final por `id` garante ordem determinística (F101).
- **D40.** O uso da etiqueta **não é armazenado**: é sempre `count(card_labels)` na leitura, como as contagens de checklist (RF06 F68). Assim, nunca diverge das aplicações (RN13).
- **D41.** O nome é armazenado com a grafia digitada (normalizada) e comparado por `lower(name)`. Acentos não são removidos na comparação (RN04).

### 3.5 Alterações em representações existentes

| Anterior | Nova regra |
| --- | --- |
| RF07 `BoardDetail` | Ganha `labels: LabelView[]` (ordem de F101, com uso) |
| RF07 `CardSummary` | Ganha `labelIds: string[]` (ordem de F101), agregado na **mesma** instrução de cards de `loadListsWithCards` |
| RF07 `CardDetail` | Ganha `labelIds: string[]` |
| RF07 N136 — quadro aberto em até quatro instruções | Até **cinco**: resumo com papel, participantes, etiquetas com uso, listas e cards |

---

## 4. Interfaces: API e contratos

### 4.1 Representações

| Representação | Campos |
| --- | --- |
| `LabelView` | `id`, `name`, `color` (`LabelColor`), `usage` (inteiro ≥ 0) |
| `LabelsState` | `{ labels: LabelView[] }` |
| `LabelMutation` | `{ label: LabelView, labels: LabelView[] }` |
| `CardLabelsState` | `{ labelIds: string[], labels: LabelView[] }` |

Toda resposta de escrita traz a lista completa de etiquetas do quadro, com usos atualizados (F110, F113).

### 4.2 Etiquetas do quadro

| Rota | Permissão | Corpo | Sucesso |
| --- | --- | --- | --- |
| `GET /api/boards/:boardId/labels` | participante | — | `200` `LabelsState` |
| `POST /api/boards/:boardId/labels` | `labels.manage` | `{ name, color }` | `201` `LabelMutation` |
| `PATCH /api/boards/:boardId/labels/:labelId` | `labels.manage` | `{ name, color }` | `200` `LabelMutation` |
| `DELETE /api/boards/:boardId/labels/:labelId` | `labels.manage` | — | `200` `LabelsState` |

- **A59.** `PATCH` exige `name` **e** `color`, porque o formulário de edição sempre envia os dois (2.5). Campos extras são descartados pelo schema (CB07).
- **A60.** `DELETE` de etiqueta inexistente responde `404 LABEL_NOT_FOUND`. O front-end trata como sucesso (F112), como em RF03 A26 e RF07 A54.

### 4.3 Etiquetas do card

| Rota | Permissão | Sucesso |
| --- | --- | --- |
| `PUT /api/boards/:boardId/cards/:cardId/labels/:labelId` | `labels.apply` | `200` `CardLabelsState` (idempotente) |
| `DELETE /api/boards/:boardId/cards/:cardId/labels/:labelId` | `labels.apply` | `200` `CardLabelsState` (idempotente para etiqueta existente) |

- **A61.** `PUT`/`DELETE` no recurso da aplicação tornam a operação naturalmente idempotente (RN07, CB11), como em RF07 A55. Nenhum corpo é lido.

### 4.4 Alterações de contratos existentes

- `GET /api/boards/:boardId` e `POST /api/boards`: `BoardDetail.labels`; cada `CardSummary.labelIds`.
- Respostas de lista, card e exclusão de lista que devolvem `ListWithCards`: cada `CardSummary.labelIds`, pela mesma função de carga.
- `GET` e `PATCH` do card: `CardDetail.labelIds`.
- Nenhuma rota recebe filtro por etiqueta (F102).

### 4.5 Validação

| Campo | Regra | Mensagem |
| --- | --- | --- |
| `name` | ausente, não texto ou vazio após RN03 | "Campo obrigatório." |
| `name` | mais de 30 caracteres (pontos de código) após RN03 | "O nome da etiqueta deve ter no máximo 30 caracteres." |
| `color` | ausente ou fora de `LABEL_COLORS` | "Selecione uma cor válida." |

Os erros de campo vêm juntos em `VALIDATION_ERROR` (RF01 A8). `labelId` e `cardId` malformados não são erro de validação: respondem `LABEL_NOT_FOUND` e `CARD_NOT_FOUND` na etapa correspondente de F98 (CB05, CB06).

### 4.6 Erros

- **A62.** Novos códigos:

| Código | Status | Mensagem |
| --- | --- | --- |
| `LABEL_NOT_FOUND` | 404 | "Etiqueta não encontrada." |
| `LABEL_NAME_TAKEN` | 409 | "Já existe uma etiqueta com esse nome neste quadro." |
| `LABEL_LIMIT_REACHED` | 409 | "O quadro pode ter no máximo 50 etiquetas." |

- **A63.** O front-end exibe `LABEL_NAME_TAKEN` e `LABEL_LIMIT_REACHED` junto ao campo "Nome" do formulário que os provocou.

### 4.7 Front-end: serviço

| Função | Rota |
| --- | --- |
| `labelService.list(boardId)` | `GET /labels` |
| `labelService.create(boardId, name, color)` | `POST /labels` |
| `labelService.update(boardId, labelId, name, color)` | `PATCH /labels/:labelId` |
| `labelService.remove(boardId, labelId)` | `DELETE /labels/:labelId` |
| `labelService.apply(boardId, cardId, labelId)` | `PUT /cards/:cardId/labels/:labelId` |
| `labelService.unapply(boardId, cardId, labelId)` | `DELETE /cards/:cardId/labels/:labelId` |

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `GET /api/boards/:boardId` | < 240 ms | 2.000 cards, 50 etiquetas, 10.000 aplicações, 50 participantes, 20.000 itens |
| `GET /labels` e escritas de etiqueta | < 80 ms | 50 etiquetas, 10.000 aplicações |
| Aplicar e remover | < 60 ms | — |
| Aplicar o filtro no cliente | < 50 ms por mudança de seleção | 2.000 cards |

- **N160.** `listLabels()` usa **uma** instrução: etiquetas do quadro com `LEFT JOIN` agregado de `card_labels` por `label_id` e ordem de F101. Nenhuma consulta por etiqueta.
- **N161.** `labelIds` de cada card é agregado na mesma instrução de cards de `loadListsWithCards`, ordenado por `labels.created_at, labels.id` e convertido para `text[]`, como `assigneeIds` (RF07). Nenhuma consulta por card.
- **N162.** Escritas de etiqueta e de aplicação usam um número constante de instruções, independente da quantidade de cards e aplicações. Excluir etiqueta em uso é uma única instrução `DELETE`, com a cascata.
- **N163.** O filtro é O(cards × etiquetas do card), usa um `Set` de ids selecionados e é memorizado por `(board.lists, selection)` com `useMemo`.

### 5.2 Segurança

- **N164.** Participação e papel lidos no bloqueio (RF07 F79, F81). Não participante recebe `BOARD_NOT_FOUND` antes de qualquer verificação de papel ou de etiqueta (CA35, RF07 C178).
- **N165.** Toda leitura e escrita de etiqueta filtra por `board_id` do quadro autorizado. Uma etiqueta de outro quadro é indistinguível de inexistente (`LABEL_NOT_FOUND`, CA36).
- **N166.** `card_labels.board_id` nunca vem do cliente (D38), e a FK composta impede aplicação entre quadros mesmo com erro de serviço (F100).
- **N167.** Nomes de etiqueta são renderizados como texto em todos os lugares: chip, linha, confirmação e barra (CB04). A cor aplicada vem **só** do mapa fechado de `lib/labelColors.ts`; nenhum valor da API é usado diretamente em `style`.
- **N168.** Corpo limitado pelo `express.json` existente (64 KB); o schema descarta campos extras (CB07).

### 5.3 Integridade e concorrência

- **N169.** Limite de 50 e unicidade de nome serializados pelo bloqueio do quadro (F96). O índice único é a última barreira (F104).
- **N170.** Aplicações simultâneas da mesma etiqueta no mesmo card: `ON CONFLICT DO NOTHING` sob o bloqueio do card (CB11).
- **N171.** Excluir etiqueta durante uma aplicação: a FK composta faz a aplicação falhar ou a cascata remover a linha inserida. Nunca sobra aplicação de etiqueta inexistente. A falha é traduzida para `LABEL_NOT_FOUND` (CB12).
- **N172.** Exclusão de etiqueta em uso é atômica (CE04): a etiqueta e as aplicações somem na mesma transação ou nada muda.
- **N173.** Edições concorrentes da mesma etiqueta: a última prevalece, sob o bloqueio do quadro, desde que não viole RN04 (CB17).

### 5.4 Interface e acessibilidade

- **N174.** O chip de etiqueta sempre exibe o **nome** como texto; a cor nunca é a única forma de identificação.
- **N175.** O texto do chip deve ter contraste mínimo de 4,5:1 sobre a cor. Cada entrada de `lib/labelColors.ts` define fundo e texto.
- **N176.** A paleta é um `radiogroup` com rótulo "Cor", e cada opção tem o nome da cor como rótulo acessível. A opção selecionada tem indicação visual além da cor.
- **N177.** As opções da barra de filtro são botões com `aria-pressed`. "Todas" tem `aria-pressed="true"` quando nada está selecionado. A barra é um grupo rotulado "Filtrar por etiqueta", e o total é anunciado com `aria-live="polite"`.
- **N178.** No modo card, cada etiqueta é um `<input type="checkbox">` rotulado pelo nome. Editar e excluir têm rótulos "Editar etiqueta {nome}" e "Excluir etiqueta {nome}".
- **N179.** O layout segue `prototipo/modais/etiquetas.png`: linhas em cartão com caixa ou ações, cor, nome e uso à direita; bloco "Nova etiqueta" com campo, "Criar" e amostras de cor; "Concluído" à direita. A barra e os chips seguem `prototipo/paginas/quadro.png`.
- **N180.** Esc na edição em linha cancela só a edição, sem fechar a janela (CA16), como na checklist (RF06 C136).

### 5.5 Testabilidade

- **N181.** Funções puras testadas nos dois projetos:
  - **back-end:** `normalizeLabelName` e `labelNameKey`;
  - **front-end:** `filterLists`, `visibleTotalLabel`, `pruneSelection`, `toggleSelection`, `resolveLabels`, `withLabels`, `withCardLabels`, `withoutLabel`, `deleteLabelBody` e `labelFailureAction`.
- **N182.** Serviços testados com repositórios em memória no store compartilhado, que reproduzem:
  - bloqueio por quadro;
  - unicidade sem diferenciar maiúsculas;
  - limite;
  - cascata de aplicações ao excluir etiqueta, card, lista e quadro;
  - FK de mesmo quadro.

  Casos obrigatórios: limite concorrente, nome duplicado concorrente, `FORBIDDEN` para Membro em criar, editar e excluir, Membro aplicando, ordem `BOARD_NOT_FOUND` → `FORBIDDEN` → `CARD_NOT_FOUND` → `LABEL_NOT_FOUND`, e etiqueta de outro quadro.
- **N183.** Integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - índice único com `lower`;
  - FK composta entre quadros;
  - cascata ao excluir etiqueta e card;
  - ordem de `labelIds`;
  - uso agregado em uma instrução;
  - reversão da migration.

  Os testes de integração existentes recebem a nova migration e um `undoLastMigration` a mais nos testes de reversão.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C179 | Nenhuma dependência nova; paleta fechada e filtro em função pura |
| C180 | Tabelas `labels` e `card_labels` com `CHECK`s, unicidade `(board_id, lower(name))`, FK composta e cascatas de 3.1–3.2; migration reversível |
| C181 | Cor como chave estável (`red`, `blue`, `green`, `amber`, `purple`, `gray`), idêntica nos dois projetos e no `CHECK` |
| C182 | Criar, editar e excluir etiqueta em `runInBoardLock`, com `assertCan("labels.manage")` antes de qualquer leitura |
| C183 | Aplicar e remover em `runInCardLock`, com `assertCan("labels.apply")` |
| C184 | Ordem de avaliação de F98 |
| C185 | Nome normalizado por RN03, de 1 a 30 pontos de código; unicidade sem diferenciar maiúsculas e com acentos preservados |
| C186 | Limite de 50 etiquetas contado sob bloqueio (`409 LABEL_LIMIT_REACHED`) |
| C187 | Violação da unicidade traduzida para `409 LABEL_NAME_TAKEN` |
| C188 | Etiqueta de outro quadro, inexistente ou com id malformado → `404 LABEL_NOT_FOUND` |
| C189 | `card_labels.board_id` gravado a partir do card, nunca do cliente |
| C190 | Aplicações removidas só por cascata, exceto a remoção pedida pelo usuário |
| C191 | Uso nunca armazenado; sempre agregado na leitura |
| C192 | Ordem das etiquetas `created_at, id` em todas as leituras |
| C193 | `BoardDetail.labels`, `CardSummary.labelIds` e `CardDetail.labelIds`; quadro aberto em até cinco instruções |
| C194 | `labelIds` agregados na instrução de cards; `listLabels` em uma instrução |
| C195 | Toda escrita de etiqueta responde com a lista completa de etiquetas com uso |
| C196 | `PUT`/`DELETE` idempotentes para aplicação; sem corpo |
| C197 | Novos códigos de A62 com as mensagens da spec |
| C198 | Filtro local em `BoardView`, sem URL, sem armazenamento e sem API |
| C199 | Filtro com regra "ao menos uma" (RN08); todas as listas exibidas; ordem preservada |
| C200 | Só `BoardLists` recebe listas projetadas; diálogos de card e de lista recebem `board.lists` completo |
| C201 | Contagem da lista = cards exibidos com filtro; total "{N} cards no quadro" / "{X} de {N} cards" |
| C202 | Seleção reduzida às etiquetas existentes a cada mudança de `board.labels`; vazia volta a "Todas" |
| C203 | Aviso de card criado e oculto pelo filtro, limpo na próxima ação |
| C204 | Janela do card aberta independente da projeção |
| C205 | Salvamento imediato de etiquetas, sem otimismo e independente de "Salvar card" |
| C206 | `LabelsDialog` com modos "manage" e "card"; recarrega etiquetas ao abrir |
| C207 | Controles por papel conforme F117 |
| C208 | Falhas tratadas pela tabela de F112 |
| C209 | Chips sempre com nome em texto; cores só do mapa fechado; contraste de 4,5:1 |
| C210 | Acessibilidade da paleta, do filtro, das caixas e das ações conforme N176–N178 |
| C211 | Exclusão de etiqueta em uso atômica; edições concorrentes com última prevalecendo |
| C212 | Testes: funções puras nos dois projetos, serviços em memória com concorrência, integração condicionada |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA02 | `CardSummary.labelIds` e `CardDetail.labelIds` (C193), `resolveLabels` (F111), ordem (C192) |
| CA03 | `LabelFilterBar` + `visibleTotalLabel` (C201) |
| CA04 | `can(myRole, "labels.manage")` (F117) |
| CA05 | `listLabels` com uso agregado (C191, N160) |
| CA06–CA10 | algoritmo de criar (2.4), schema (4.5), unicidade (C185, C187), escopo por quadro |
| CA11 | modo card sem aplicação automática; `LabelMutation` só altera a lista |
| CA12, CA19 | `assertCan("labels.manage")` (C182) + ocultação (F117) |
| CA13–CA16 | algoritmo de editar, `withLabels` (F110), edição em linha com Esc (N180) |
| CA17, CA18 | `DeleteLabelDialog` + cascata (C190) + `withoutLabel` |
| CA20–CA23 | `PUT`/`DELETE` de aplicação (C196), `withCardLabels`, salvamento imediato (C205) |
| CA24 | cascatas de `cards` e preservação por `card_id` (C190) |
| CA25–CA29 | `filterLists` (C199, C201) |
| CA30 | seleção local (C198) |
| CA31 | aviso de F115 (C203) |
| CA32 | janela independente da projeção (C204) |
| CA33 | `pruneSelection` (C202) |
| CA34 | listas completas nos diálogos (C200) |
| CA35 | ordem de F98 + participação (N164) |
| CA36 | `findLabel` no quadro do card + FK composta (C188, C189) |
| CA37 | `LABEL_NOT_FOUND` → recarga (F112) |
| CA38 | limite sob bloqueio (C186) |
| CA39 | `authenticate` + interceptador do RF01 |
| CB01–CB08 | schema, normalização e ids malformados de F98 |
| CB09–CB17 | bloqueios, índice único, `ON CONFLICT`, FK composta, tabela de falhas e recarga ao abrir a janela |
| CE01–CE05 | formulários mantidos, sem otimismo, transação única, envelope de erro |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Filtro no cliente | O quadro aberto já traz todos os cards (RF04), então filtrar no servidor adicionaria requisições sem ganho. O limite prático está na carga do quadro, e não no filtro (N163). |
| Contagem da lista filtrada | A spec pede a contagem de exibidos. O risco de usar essa contagem em regras do RF04/RF05 é eliminado por F109 e C200, que proíbem listas projetadas fora de `BoardLists`. |
| `lower()` vs `toLowerCase()` | Podem divergir em casos raros de Unicode. O serviço dá a mensagem, e o índice garante a regra (F104, F105). |
| Ordem por `created_at` | Empates são improváveis com `clock_timestamp()` e resolvidos por `id` (D39). Não há reordenação manual (fora de escopo). |
| Excluir etiqueta sem bloquear cards | Evita bloquear até 2.000 cards. A FK composta com cascata resolve a corrida com aplicações (N171). |
| Uso calculado na leitura | Custo de uma agregação indexada por `label_id`, em troca de nunca divergir (D40). |
| Tela desatualizada entre participantes | Aceito pela spec (CB15). A recarga ao abrir a janela e as respostas completas reduzem o efeito. |
