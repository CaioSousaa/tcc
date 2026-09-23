# RF04 — Tarefas de implementação

**Base:** `docs/RF04-spec.md` e `docs/RF04-plan.md` (herda RF01, RF02 e RF03).

Cada tarefa entrega uma parte funcional e verificável, na ordem de dependência: dados e domínio, bloqueio compartilhado, API, front-end, testes e conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Domínio de cards, schemas, código de erro e limite de corpo
- `domain/cards.ts`: limites, tipos `CardSummary`, `CardDetail`, `ListWithCards`, `normalizeCardTitle`, `normalizeDescription` — D24–D26.
- `schemas/card.schemas.ts`: criação (`title`) e salvamento (`title`, `description`, `listId`, `position`) — A38, A41, CB09–CB12.
- `CARD_NOT_FOUND` (404) — A40.
- Limite de corpo JSON de 64 KB — 3.4, C84.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Migration e entidade de cards
- Migration `CardsContentAndPositions`: renumeração, `CHECK`s de posição, título e descrição, coluna `description`, troca de `IDX_cards_list` por `UQ_cards_list_position` adiável; `down` reversível — 3.2, C72, C91.
- Entidade `Card` atualizada; registro no `DataSource`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Bloqueio do quadro compartilhado
- Extrair `runInBoardLock` para `repositories/boardLock.ts` e usá-lo em `TypeOrmBoardListRepository` sem mudar comportamento — F34, F39, C67.
- **Pronto quando:** `tsc` compila e os testes do RF03 permanecem válidos.
- **Estado:** concluída

### T04 — Repositório de cards
- Interface `CardTransaction` com as primitivas de F35, `withBoardLock` e `findCard` de leitura escopada — F37, F38, C69, C70.
- Implementação TypeORM: `moveWithinList` em instrução única, `openGap`/`relocate`/`closeGap`, `listsWithCards` em duas consultas — F40, C74, N67.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T05 — Serviço de cards
- Algoritmos de 2.3: criar em `N+1`, salvar (conteúdo, mesma lista, outra lista), excluir — RN07–RN12.
- Ordem de erros `BOARD_NOT_FOUND` → `CARD_NOT_FOUND` → `LIST_NOT_FOUND` — C71.
- **Pronto quando:** `tsc` compila e o serviço não importa Express nem TypeORM.
- **Estado:** concluída

### T06 — API e quadro com cards
- `CardController`, `card.routes.ts`: `POST .../lists/:listId/cards`, `GET`/`PATCH`/`DELETE .../cards/:cardId` — 4.4–4.7.
- `GET /api/boards/:boardId` com `ListWithCards` em até três consultas — C83, N68.
- Composição em `app.ts` e `main.ts`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T07 — Testes do back-end
- Normalização e schemas de card.
- `CardService` com repositório em memória que verifica a unicidade `(list_id, position)` a cada primitiva — N87.
- Sequência aleatória com semente fixa sobre várias listas — N88.
- Interação com o RF03: lista esvaziada pode ser excluída (CA34) — F39.
- Integração com PostgreSQL pulada sem `TEST_DATABASE_URL` — N89.
- Ajuste dos testes existentes afetados.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T08 — Base do front-end para cards
- Tipos de card, `lib/cardText.ts`, `lib/cardLocation.ts`, `lib/boardState.ts` (`replaceLists`), `lib/cardsState.ts` (`cardFailureAction`) — F45, F47, F48.
- `schemas/card.ts`, `services/cardService.ts`, mensagens e código `CARD_NOT_FOUND`.
- `Modal` com `size` — N83.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T09 — Cards nas listas e adição inline
- `CardFace`, `AddCardButton`, `AddCardForm` em `ListColumn` — spec 2.1, 2.2, N81, N82.
- Um formulário de adição por quadro em `BoardView` — F42, F43, C85.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T10 — Janela do card, movimentação e exclusão
- `CardDialog` com `GET` ao abrir, carregamento e erro internos — F44, C86, N85.
- `CardLocationFields` com sugestão de posição — F45, C87.
- `DeleteCardDialog` empilhado — F50, C89, N84.
- Integração em `BoardView` com a tabela de F48 e a substituição das listas afetadas — C81, C88.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T11 — Testes do front-end
- `cardText`, `cardLocation`, `replaceLists`, `cardFailureAction`, schema de card, textos e códigos.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T12 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C67–C92 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Domínio, schemas, código de erro e limite de corpo | concluída | `tsc` |
| T02 — Migration e entidade | concluída | `tsc`, `npm run build` |
| T03 — Bloqueio compartilhado | concluída | `tsc`, `npm run build` |
| T04 — Repositório de cards | concluída | `tsc`, `npm run build` |
| T05 — Serviço de cards | concluída | `tsc`, `npm run build` |
| T06 — API e quadro com cards | concluída | `tsc`, `npm run build` |
| T07 — Testes do back-end | concluída (não executados) | `tsc` |
| T08 — Base do front-end | concluída | `tsc`, `npm run build` |
| T09 — Cards nas listas e adição inline | concluída | `tsc`, `npm run build` |
| T10 — Janela do card, movimentação e exclusão | concluída | `tsc`, `npm run build` |
| T11 — Testes do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T12 — Conferência final | concluída | revisão de C67–C92 e da rastreabilidade do plano |

### Arquivos produzidos ou alterados

**Back-end**

| Arquivo | Papel |
| --- | --- |
| `src/domain/cards.ts` | limites, tipos, `characterCount`, `normalizeCardTitle`, `normalizeDescription` |
| `src/schemas/card.schemas.ts` | validação de criação e salvamento |
| `src/migrations/1760000003000-CardsContentAndPositions.ts` | renumeração, `CHECK`s, `description`, `UQ_cards_list_position` adiável; `down` reversível |
| `src/repositories/boardLock.ts` | `runInBoardLock`: implementação única do bloqueio do quadro |
| `src/repositories/listsWithCards.ts` | `loadListsWithCards`: listas com cards em duas instruções, usado por quadros, listas e cards |
| `src/repositories/BoardCardRepository.ts` | `CardTransaction`, `withBoardLock`, `findCard` de leitura, implementação TypeORM |
| `src/services/CardService.ts` | algoritmos de criação, salvamento e exclusão |
| `src/controllers/CardController.ts`, `src/routes/card.routes.ts` | `POST .../lists/:listId/cards`, `GET`/`PATCH`/`DELETE .../cards/:cardId` |
| alterados: `domain/boards.ts`, `entities/Card.ts`, `repositories/BoardRepository.ts`, `repositories/BoardListRepository.ts`, `services/ListService.ts`, `routes/list.routes.ts`, `routes/board.routes.ts`, `routes/index.ts`, `errors/*`, `middlewares/errorHandler.ts`, `config/data-source.ts`, `app.ts`, `main.ts` | integração, bloqueio compartilhado, quadro com cards, limite de 64 KB |

**Front-end**

| Arquivo | Papel |
| --- | --- |
| `src/components/cards/*` | `CardFace`, `AddCardButton`, `AddCardForm`, `CardDialog`, `CardLocationFields`, `DeleteCardDialog` |
| `src/lib/cardText.ts`, `src/lib/cardLocation.ts`, `src/lib/boardState.ts`, `src/lib/cardsState.ts` | normalização, opções e sugestão de posição, substituição de listas afetadas, tabela de falhas |
| `src/schemas/card.ts`, `src/services/cardService.ts` | validação no cliente e chamadas à API |
| alterados: `app/(app)/boards/[boardId]/BoardView.tsx`, `components/lists/ListColumn.tsx`, `components/lists/BoardLists.tsx`, `components/Modal.tsx` (`size`, `eyebrow`), `services/boardService.ts`, `lib/api.ts`, `lib/messages.ts` | integração, tipos e mensagens |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `card.schemas.test.ts` | CA06, CA08–CA11, CA19–CA23, CB01–CB12, RN03, RN04, D21, D25, D26, A38, A41 |
| `CardService.test.ts` | CA01, CA02, CA06, CA07, CA15–CA17, CA19–CA21, CA25–CA34, CA36, CA38–CA41, CB12, CB13, CB18–CB20, CE04, RN05–RN13, RN15, RN17, C71, F40, N67, N87, N88 (400 operações aleatórias sobre três listas) |
| `BoardCardRepository.integration.test.ts` | F40, D21, D22, CA01, CA30, CA31, CB13, CB22, CE04, C83, C91; **pulado sem `TEST_DATABASE_URL`** e destrói o banco apontado |
| `helpers/InMemoryBoardLock.ts` | fila por quadro compartilhada entre listas e cards, com rollback de listas e cards |
| `helpers/InMemoryBoardCardRepository.ts` | primitivas filtradas pelo quadro e verificação de `UNIQUE (list_id, position)` após cada primitiva |
| atualizados: `helpers/InMemoryBoardRepository.ts` (cards completos e listas com cards), `helpers/InMemoryBoardListRepository.ts` (bloqueio compartilhado), `errorHandler.test.ts` (`CARD_NOT_FOUND`) | ajustes |

**Front-end** (`front-end/src/**/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `lib/__tests__/cardText.test.ts` | CA10, CA11, CA20, CA21, CB04, CB08, RN03, RN04 |
| `lib/__tests__/cardLocation.test.ts` | CA17, CA27, CA29 |
| `lib/__tests__/boardState.test.ts` | CB21, RN17, F47 |
| `lib/__tests__/cardsState.test.ts` | CA38–CA41, CB15–CB17, CB19, CB20, CE01–CE03, RN15, F48, spec 5.4 |
| `schemas/__tests__/card.test.ts` | CA06, CA08–CA11, CA19–CA23, CB02, CB03, CB07, CB09 |
| atualizados: `lib/__tests__/api.test.ts` (`CARD_NOT_FOUND`), `lib/__tests__/listOrder.test.ts` (tipo com `cards`) | ajustes |

### Conferência contra o plano

| Restrição | Onde é atendida |
| --- | --- |
| C67 | `repositories/boardLock.ts`, usado por `TypeOrmBoardListRepository` e `TypeOrmBoardCardRepository` |
| C68 | nenhuma dependência instalada; `<select>` nativo; descrição em `<textarea>` sem biblioteca |
| C69 | escritas em `withBoardLock`; `findCard` de leitura escopado por dono e quadro |
| C70 | todas as primitivas usam `JOIN lists ... board_id`; `relocate` e `insert` exigem lista do quadro bloqueado |
| C71 | rota valida corpo → `withBoardLock` → `requireCard` → `requireList`; `get` checa quadro antes de consultar o card |
| C72 | migration `1760000003000` |
| C73 | `CardService.create` usa `countInList + 1`; schema descarta `position` |
| C74 | `openGap` → `relocate` → `closeGap`; `moveWithinList` com `CASE` |
| C75 | teste de primitivas constantes em `CardService.test.ts` |
| C76, C77 | `domain/cards.ts` + `CHECK`s |
| C78 | `PATCH` em transação única; `description` ausente vira `null` |
| C79 | `clampPosition` do RF03 |
| C80 | `CARD_NOT_FOUND` 404 |
| C81 | `listsWithCards` nas respostas; `replaceLists` no front-end |
| C82 | `CardSummary` sem descrição; descrição só em `CardDetail` |
| C83 | `findDetail`: resumo + listas + cards (três instruções) |
| C84 | `express.json({ limit: "64kb" })` |
| C85 | `addingListId` em `BoardView`; `AddCardForm` com Enter, Esc e foco mantido |
| C86 | `CardDialog` com `GET` ao abrir e estados internos |
| C87 | `cardPositionOptions` e `suggestedPosition` |
| C88 | `cardFailureAction` + `BoardView.handleCardFailure` |
| C89 | `DeleteCardDialog` como segundo `Modal`, com `CardDialog` montado |
| C90 | textos como nós de texto; `textarea` com `whitespace-pre-wrap` |
| C91 | `up` e `down` da migration |
| C92 | testes listados acima |

### Decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| Respostas das operações de lista (RF03) | Passam a trazer `cards` em cada lista (`ListWithCards`) | O front-end do RF03 substitui todas as listas pela resposta (F28); sem os cards, uma operação de lista apagaria os cards da tela. Uma única função, `loadListsWithCards`, serve quadros, listas e cards. |
| `findCard` de leitura com id malformado | O repositório recebe `null` e só verifica o quadro | Evita erro de sintaxe de UUID do PostgreSQL (500) sem pular a verificação do quadro exigida por C71. |
| Resposta do `PATCH` | `CardDetail` relido dentro da transação (`readCard`) | Datas e posição refletem exatamente o que foi salvo. |
| Campo de adição durante o envio | `readOnly` em vez de `disabled` | Um campo desabilitado perde o foco, e CA07 exige o campo focado após cada card. |
| Regex de quebra de linha | Montada a partir de escapes (`"\\u" + "2028"`) | Um separador de linha literal no código-fonte encerrava a expressão regular e quebrava a compilação. |
| Título da janela | O cabeçalho do `Modal` mostra o título salvo, e o campo "Título" permite editá-lo | A confirmação de exclusão também usa o título salvo (spec 2.5). |
| Teste de integração do RF03 | Mantido com as três primeiras migrations | Continua isolado da migration de cards; a de cards tem arquivo próprio com as quatro. |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test` nos dois projetos) e da integração (`TEST_DATABASE_URL=postgres://... npm test` em `back-end/`): não realizada por restrição do `context.md`.
- A migration `1760000003000` roda na próxima inicialização da API.
- O RF05 deve substituir `LIST_HAS_CARDS` e respeitar o bloqueio compartilhado (C47, C67).
