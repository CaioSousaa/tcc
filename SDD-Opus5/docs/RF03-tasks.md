# RF03 — Tarefas de implementação

**Base:** `docs/RF03-spec.md` e `docs/RF03-plan.md` (herda RF01 e RF02).

Cada tarefa entrega uma parte funcional e verificável, na ordem de dependência: dados, domínio e API; correção do `Modal`; front-end; testes; conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Domínio de listas, schemas e códigos de erro
- `domain/lists.ts`: `LIST_NAME_MAX = 50`, tipo `ListItem` com `cardCount`, `clampPosition`.
- `schemas/list.schemas.ts`: criação (`name`, `position` opcional) e edição (`name` obrigatório, `position` opcional); inteiro seguro ≥ 1; campos extras descartados — RN03, RN09, CB01–CB11, A35.
- Códigos `LIST_NOT_FOUND` (404) e `LIST_HAS_CARDS` (409) com as mensagens da spec — A34.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Migration e entidade de listas
- Migration `ListPositionsAndNameLimit`: renumeração `1..N`, `CHECK (position >= 1)`, `varchar(50)` com `CHECK`, `UNIQUE (board_id, position) DEFERRABLE INITIALLY IMMEDIATE`, `down` reversível — 3.2, D18, D19, C50, C65.
- Entidade `BoardList` com `length: 50`; registro no `DataSource`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Ajustes do RF02
- Extrair `boardScopeFor` para `services/boardAccess.ts` e usá-lo no `BoardService` — F20, C45.
- Listas padrão nas posições `1, 2, 3` — 3.4, C49.
- `GET /api/boards/:boardId`: `lists` com `cardCount`, ainda em duas consultas — C64.
- **Pronto quando:** `tsc` compila e os testes do RF02 refletem as posições em base 1.
- **Estado:** concluída

### T04 — Repositório com bloqueio do quadro
- Interface `ListTransaction` com as primitivas de F22 e `withBoardLock(scope, boardId, callback)` — F21, C46.
- Implementação TypeORM: transação, `SET LOCAL lock_timeout = '5s'`, `SELECT ... FOR UPDATE` escopado por dono, primitivas filtradas por `board_id`, deslocamentos e `move` em instrução única cada — F26, C48, C51, C63, N49.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T05 — Serviço de listas
- Algoritmos de criação, edição e exclusão de 2.3 — RN05–RN11.
- Ordem de avaliação e tradução de erros: `BOARD_NOT_FOUND` → `listId` malformado → `LIST_NOT_FOUND` → `LIST_HAS_CARDS` — F24, C55.
- Respostas com a lista completa lida na mesma transação — F25, C56.
- **Pronto quando:** `tsc` compila e o serviço não importa Express nem TypeORM.
- **Estado:** concluída

### T06 — Controller, rotas e integração
- `ListController` e `list.routes.ts` (`mergeParams`) com `authenticate`, `validateBoardId` e validação de corpo — C26, C57.
- Montagem sob `/api/boards/:boardId/lists`; composição em `app.ts` e `main.ts`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T07 — Testes do back-end
- `clampPosition` e schemas de lista.
- `ListService` com repositório em memória: CAs de criação, edição, exclusão e proteção, e teste de sequência aleatória com semente fixa verificando `1..N` — N64, N65.
- Ajuste dos testes do RF02 (posições em base 1).
- Integração do repositório TypeORM com PostgreSQL, pulada sem `TEST_DATABASE_URL` — N66.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T08 — Correção do `Modal`
- Foco inicial em `[data-autofocus]` após `showModal()`, ou no primeiro campo — F33, D1 do RF02.
- Tratamento do evento `close`: reabre se `busy`, propaga `onClose` caso contrário — F33, D2 do RF02.
- Ajustar as janelas do RF02 para usar `data-autofocus`.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T09 — Base do front-end para listas
- `lib/listOrder.ts`: `positionOptions`, `previewOrder` — F27, C60.
- `schemas/list.ts`, `services/listService.ts`, mensagens e códigos `LIST_NOT_FOUND`/`LIST_HAS_CARDS` em `lib/api.ts`.
- Tipo `BoardListItem` com `cardCount`.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T10 — Interface de listas no quadro
- `BoardLists`, `ListColumn`, `AddListButton`, estado vazio — spec 2.1, CA01–CA03, N58, N59.
- `ListFormDialog` com `PositionSelect` e `ListOrderPreview` — spec 2.2, 2.3, C61, N60, N61.
- `DeleteListDialog` e aviso de lista com cards — spec 2.4, C59, N62.
- Integração em `BoardView`: substituição do estado pela resposta, `LIST_NOT_FOUND`, `BOARD_NOT_FOUND` — F28, F31, C56, C58.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T11 — Testes do front-end
- `positionOptions`, `previewOrder` (CA05, CA06, CA18, CA23), schema de lista, textos de exclusão e decisões de fluxo (`LIST_NOT_FOUND`, `LIST_HAS_CARDS`).
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T12 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C44–C66 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Domínio, schemas e códigos de erro | concluída | `tsc` |
| T02 — Migration e entidade | concluída | `tsc`, `npm run build` |
| T03 — Ajustes do RF02 | concluída | `tsc`, `npm run build` |
| T04 — Repositório com bloqueio do quadro | concluída | `tsc`, `npm run build` |
| T05 — Serviço de listas | concluída | `tsc`, `npm run build` |
| T06 — Controller, rotas e integração | concluída | `tsc`, `npm run build` |
| T07 — Testes do back-end | concluída (não executados) | `tsc` |
| T08 — Correção do `Modal` | concluída | `tsc`, `npm run build` |
| T09 — Base do front-end | concluída | `tsc`, `npm run build` |
| T10 — Interface de listas | concluída | `tsc`, `npm run build` |
| T11 — Testes do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T12 — Conferência final | concluída | revisão de C44–C66 e da rastreabilidade do plano |

### Arquivos produzidos ou alterados

**Back-end**

| Arquivo | Papel |
| --- | --- |
| `src/domain/lists.ts` | `LIST_NAME_MAX`, `ListItem`, `clampPosition` |
| `src/schemas/list.schemas.ts` | validação de nome e posição |
| `src/migrations/1760000002000-ListPositionsAndNameLimit.ts` | renumeração `1..N`, `CHECK`s, `varchar(50)`, unicidade adiável; `down` reversível |
| `src/repositories/BoardListRepository.ts` | `ListTransaction`, `withBoardLock` e implementação TypeORM |
| `src/services/boardAccess.ts` | `boardScopeFor`, ponto único de autorização |
| `src/services/ListService.ts` | algoritmos de criação, edição e exclusão |
| `src/controllers/ListController.ts`, `src/routes/list.routes.ts` | `POST`, `PATCH`, `DELETE /api/boards/:boardId/lists[/:listId]` |
| alterados: `domain/boards.ts`, `entities/BoardList.ts`, `repositories/BoardRepository.ts`, `services/BoardService.ts`, `routes/board.routes.ts`, `routes/index.ts`, `errors/*`, `middlewares/errorHandler.ts`, `config/data-source.ts`, `app.ts`, `main.ts` | integração e ajustes do RF02 |

**Front-end**

| Arquivo | Papel |
| --- | --- |
| `src/components/lists/*` | `BoardLists`, `ListColumn`, `AddListButton`, `ListFormDialog`, `PositionSelect`, `ListOrderPreview`, `DeleteListDialog` |
| `src/lib/listOrder.ts` | `positionOptions`, `previewOrder` |
| `src/lib/listsState.ts` | decisão de fluxo em falhas, regra de abrir confirmação, título da exclusão |
| `src/schemas/list.ts`, `src/services/listService.ts` | validação no cliente e chamadas à API |
| alterados: `app/(app)/boards/[boardId]/BoardView.tsx`, `components/Modal.tsx`, `components/boards/BoardFormDialog.tsx`, `components/boards/DeleteBoardDialog.tsx`, `services/boardService.ts`, `lib/api.ts`, `lib/messages.ts` | integração, correção do `Modal` e novos códigos e mensagens |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `list.schemas.test.ts` | CA11–CA13, CB01–CB10, RN03, RN09, RN13, A35 |
| `ListService.test.ts` | CA01, CA02, CA07–CA10, CA14, CA17, CA19–CA22, CA24, CA27, CA29, CA30, CA32–CA36, CB07, CB08, CB12–CB14, CB17, CE03, RN04–RN11, RN15, RN16, N44, N65 (300 operações aleatórias com semente fixa) |
| `BoardListRepository.integration.test.ts` | CB12, CA02, CA33, CA35, CE03, D19, C65; **pulado sem `TEST_DATABASE_URL`** e destrói o banco apontado |
| `helpers/InMemoryBoardListRepository.ts` | reproduz bloqueio por quadro (fila), filtro por quadro e rollback |
| atualizados: `BoardService.test.ts` (posições `1, 2, 3` e `cardCount`), `errorHandler.test.ts` (`LIST_NOT_FOUND` 404, `LIST_HAS_CARDS` 409), `helpers/InMemoryBoardRepository.ts` | ajustes do RF02 |

**Front-end** (`front-end/src/**/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `lib/__tests__/listOrder.test.ts` | CA05, CA06, CA09, CA10, CA18, CA20–CA23, CA30, RN06, RN07, C60 |
| `lib/__tests__/listsState.test.ts` | CA28, CA32, CA33, CA35, CA36, CB14, CB15, CB17, CE01, CE02, RN11, RN15, C58, C59, spec 5.4 |
| `schemas/__tests__/list.test.ts` | CA11–CA13, CA25, CB02–CB04, CB06, CB09 |
| `lib/__tests__/api.test.ts` (atualizado) | reconhecimento de `LIST_NOT_FOUND` e `LIST_HAS_CARDS` |

### Conferência contra o plano

| Restrição | Onde é atendida |
| --- | --- |
| C44 | nenhuma dependência instalada; `PositionSelect` usa `<select>` |
| C45 | `services/boardAccess.ts` usado por `BoardService` e `ListService` |
| C46 | `TypeOrmBoardListRepository.withBoardLock`: transação + `SELECT ... FOR UPDATE` com `owner_id` |
| C47 | obrigação registrada para RF04/RF05; nenhuma escrita de card existe ainda |
| C48 | regras em `ListService`; primitivas filtradas por `board_id` |
| C49 | posições base 1; `BoardService` cria listas padrão em `1, 2, 3` |
| C50 | `UQ_lists_board_position ... DEFERRABLE INITIALLY IMMEDIATE` |
| C51 | `shiftRight`, `shiftLeft` e `move` em instrução única; teste de número constante de primitivas |
| C52 | `clampPosition` no serviço; schema recusa não inteiro, ≤ 0 e acima de `MAX_SAFE_INTEGER` |
| C53 | `list.schemas.ts` + `CHK_lists_name_length`; migration não trunca |
| C54 | `hasCards` dentro de `withBoardLock` → `LIST_HAS_CARDS` 409 |
| C55 | `authenticate` → `validateBoardId` → corpo → `withBoardLock` → `isUuid(listId)` → `findList` → `hasCards` |
| C56 | `listAll()` na mesma transação; `BoardView.applyLists` substitui o estado |
| C57 | `ListController`: 201 `{list, lists}`, 200 `{list, lists}`, 200 `{lists}` |
| C58 | `listFailureAction` + `BoardView.handleListFailure` |
| C59 | `canConfirmListDeletion` em `requestListDeletion` |
| C60 | `previewOrder` e `positionOptions` puros; `ListFormDialog` usa cópia |
| C61 | `ListFormDialog` único, montado ao abrir |
| C62 | `Modal`: foco em `[data-autofocus]` após `showModal()`; `onClose` nativo reabre se ocupado |
| C63 | `SET LOCAL lock_timeout = '5s'` |
| C64 | `findDetail` com `card_count` em duas consultas |
| C65 | migration `1760000002000` com `up` e `down` |
| C66 | testes de funções puras, sequência aleatória e integração condicionada |

### Decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| Resultado de `withBoardLock` | Retorna `{ found: false }` sem chamar o callback, em vez de lançar erro | Mantém o repositório sem erro de domínio; o serviço converte em `BOARD_NOT_FOUND` (F21, C48). |
| SQL das primitivas | Instruções parametrizadas via `manager.query`, sem `QueryBuilder` | O `move` precisa de `CASE` com parâmetros tipados e instrução única (F26); nenhuma primitiva depende de linhas afetadas, porque a lista já foi lida sob bloqueio. |
| Nome na pré-visualização de edição com campo vazio | Exibe o nome atual da lista | A spec só define o texto "Nova lista" para adição; na edição, o nome salvo é a referência mais útil enquanto o erro não é mostrado. |
| Aviso de lista com cards | Exibido no topo do quadro, sem abrir janela | C59; a spec pede a mensagem, não uma janela. |
| Recarregar após `LIST_NOT_FOUND` | Recarga do quadro sem tela de carregamento | Evita perder o contexto visual; a tela passa a mostrar a ordem salva (CB18). |
| Correção do `Modal` | `data-autofocus` substitui `autoFocus` nas janelas do RF02 e do RF03 | Resolve D1 e D2 de `docs/RF02-validation.md` para todas as janelas. |
| Teste de integração | Usa `dropDatabase()` antes de migrar | Garante estado conhecido; por isso exige banco descartável, documentado no arquivo. |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test` nos dois projetos) e dos testes de integração (`TEST_DATABASE_URL=postgres://... npm test` em `back-end/`): não realizadas por restrição do `context.md`.
- A migration `1760000002000` renumera posições existentes na próxima inicialização da API.
- C47 obriga o RF04 e o RF05 a adquirir o bloqueio do quadro ao escrever cards.
