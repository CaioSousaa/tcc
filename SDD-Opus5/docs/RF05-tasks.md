# RF05 — Tarefas de implementação

**Base:** `docs/RF05-spec.md` e `docs/RF05-plan.md` (herda RF01–RF04).

Cada tarefa entrega uma parte funcional e verificável, na ordem de dependência: dados e contrato do quadro, algoritmo de exclusão, front-end, testes e conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Bloqueio de exclusão no quadro
- Migration `BoardListDeletionLock` (`lock_list_deletion boolean NOT NULL DEFAULT false`, reversível) e entidade `Board` — C94.
- `BoardSummary`/`BoardDetail` com `lockListDeletion`; leitura no repositório — C109.
- `PUT /api/boards/:boardId` com `lockListDeletion` opcional (ausente mantém, não booleano recusa); `POST` descarta — C108, CB08, CB09.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T02 — Contrato da exclusão de lista
- `domain/listDeletion.ts`: `ListDeletionStrategy`, `ListDeletionRequest`.
- `parseDeleteListQuery` e `validateQuery` sem sobrescrever `req.query` — C102, C103, A43, CB02, CB03, CB06.
- Códigos `LIST_DELETION_LOCKED`, `LIST_DELETION_STRATEGY_REQUIRED`, `LIST_CARD_COUNT_CHANGED`, `TARGET_LIST_NOT_FOUND`; remoção de `LIST_HAS_CARDS` — A46, A47, C107.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T03 — Primitivas e algoritmo de exclusão
- `ListTransaction`: `countCards`, `isListDeletionLocked`, `appendCards` (instrução única, filtrada pelo quadro); remoção de `hasCards` — F52, C97, C98.
- `ListService.delete` com a ordem de 2.3 — C95, C96, C104–C106.
- Controller e rota com `validateQuery` — 4.1.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T04 — Testes do back-end
- Schema da query e do `PUT` com bloqueio.
- `ListService`: todos os ramos de 2.3, ordem de avaliação, preservação de ids e ordem em `move`, cascata, rollback — N108.
- Sequência aleatória com criação, movimentação e exclusão de listas com `move` e `cascade` — N109.
- Ajuste dos testes do RF03/RF04 que citavam `LIST_HAS_CARDS` e dos repositórios em memória.
- Integração com PostgreSQL condicionada a `TEST_DATABASE_URL` — N110.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T05 — Base do front-end
- Tipos com `lockListDeletion`; `boardService.update` com o bloqueio; `listService.remove` com `URLSearchParams` — C115.
- `lib/listDeletion.ts`: `targetOptions`, `suggestedTarget`, `initialDecision`, `canConfirm`, `listDeletionFailureAction`, textos — C111, C113.
- Mensagens e códigos novos em `lib/api.ts` e `lib/messages.ts`; remoção de `LIST_HAS_CARDS` e `canConfirmListDeletion`.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T06 — Opção de bloqueio no "Editar quadro"
- `BoardFormDialog` modo editar com o checkbox; envio pela listagem e pela página do quadro — F62, C114, CA01–CA04.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T07 — Janela de decisão
- `DeletionOption` e `DeleteListWithCardsDialog` — N102–N106.
- `BoardView`: escolha da janela por `cardCount`, confirmação com regra, tabela de falhas e atualização da janela aberta após recarga — C110, C112, C113, F60.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T08 — Testes do front-end
- `lib/listDeletion.ts` com o quadro de exemplo da spec — N107.
- Montagem da query em `listService`, textos e códigos.
- Ajuste dos testes do RF03 que citavam `canConfirmListDeletion`.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T09 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C93–C116 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Bloqueio de exclusão no quadro | concluída | `tsc`, `npm run build` |
| T02 — Contrato da exclusão de lista | concluída | `tsc` |
| T03 — Primitivas e algoritmo de exclusão | concluída | `tsc`, `npm run build` |
| T04 — Testes do back-end | concluída (não executados) | `tsc` |
| T05 — Base do front-end | concluída | `tsc` |
| T06 — Opção de bloqueio no "Editar quadro" | concluída | `tsc`, `npm run build` |
| T07 — Janela de decisão | concluída | `tsc`, `npm run build` |
| T08 — Testes do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T09 — Conferência final | concluída | revisão de C93–C116 e da rastreabilidade do plano |

### Arquivos produzidos ou alterados

**Back-end**

| Arquivo | Papel |
| --- | --- |
| `src/migrations/1760000004000-BoardListDeletionLock.ts` | coluna `boards.lock_list_deletion` com `DEFAULT false`; `down` remove |
| `src/domain/listDeletion.ts` | `ListDeletionStrategy`, `ListDeletionRequest`, `NO_DELETION_RULE` |
| `src/schemas/list.schemas.ts` | `parseDeleteListQuery` (formato de `strategy`, `targetListId`, `expectedCardCount`) |
| `src/middlewares/validate.ts` | `validateQuery`, com resultado em `res.locals.query` |
| `src/repositories/BoardListRepository.ts` | `countCards`, `isListDeletionLocked`, `appendCards`; remoção de `hasCards` |
| `src/services/ListService.ts` | algoritmo de exclusão na ordem de C95 |
| alterados: `entities/Board.ts`, `domain/boards.ts`, `repositories/BoardRepository.ts`, `schemas/board.schemas.ts`, `services/BoardService.ts`, `controllers/ListController.ts`, `routes/list.routes.ts`, `errors/*`, `middlewares/errorHandler.ts`, `config/data-source.ts` | bloqueio no quadro, novos códigos, remoção de `LIST_HAS_CARDS` |

**Front-end**

| Arquivo | Papel |
| --- | --- |
| `src/components/lists/DeleteListWithCardsDialog.tsx` | janela de decisão |
| `src/components/lists/DeletionOption.tsx` | opção com rádio nativo, título, complemento e conteúdo |
| `src/lib/listDeletion.ts` | `targetOptions`, `suggestedTarget`, `initialDecision`, `canConfirm`, `toDecision`, `reconcileDecision`, `listDeletionFailureAction`, textos |
| alterados: `components/boards/BoardFormDialog.tsx` (opção de bloqueio no modo editar), `app/(app)/boards/BoardsView.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx`, `services/boardService.ts`, `services/listService.ts` (`deletionQuery`), `schemas/board.ts`, `lib/listsState.ts` (`deletionDialogFor`), `lib/api.ts`, `lib/messages.ts` | integração e remoção de `LIST_HAS_CARDS` e `canConfirmListDeletion` |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `ListDeletion.test.ts` | CA01–CA03, CA05, CA06, CA10, CA12–CA14, CA16–CA18, CA20–CA24, CA26, CA27, CA29–CA31, CB01, CB04–CB07, CB09, CB10, CE02, RN01–RN03, RN06–RN09, RN12, C95, N90, N109 (300 operações aleatórias com criação de listas e cards e exclusão com `move` e `cascade`) |
| `list.schemas.test.ts` (ampliado) | CB02, CB03, CB04, CB06, A43, C103, C104 |
| `board.schemas.test.ts` (ampliado) | CA02, CA03, CB08, CB09 |
| `ListDeletion.integration.test.ts` | F54, F57, RN03, RN11, CA23, C94; **pulado sem `TEST_DATABASE_URL`** |
| atualizados: `ListService.test.ts`, `CardService.test.ts`, `BoardService.test.ts`, `errorHandler.test.ts`, `BoardListRepository.integration.test.ts`, `BoardCardRepository.integration.test.ts`, `helpers/InMemoryBoardRepository.ts`, `helpers/InMemoryBoardListRepository.ts` | novos códigos, bloqueio no quadro, primitivas e cascata em memória, todas as migrations nas integrações |

**Front-end** (`front-end/src/**/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `lib/__tests__/listDeletion.test.ts` | CA07–CA10, CA19, CA22, CA23, CA25–CA27, CA29, CA31, CE01, RN08, F60, F61, C112, C115, spec 5.5 |
| atualizados: `lib/__tests__/listsState.test.ts` (`deletionDialogFor`), `lib/__tests__/api.test.ts` (novos códigos), `schemas/__tests__/board.test.ts` (bloqueio), `lib/__tests__/boardState.test.ts`, `lib/__tests__/boardsState.test.ts` | ajustes |

### Conferência contra o plano

| Restrição | Onde é atendida |
| --- | --- |
| C93 | nenhuma dependência instalada; rádios, checkbox e select nativos |
| C94 | migration `1760000004000` |
| C95 | `ListService.delete`: `requireList` → `countCards` → vazia → `isListDeletionLocked` → regra → conferência → destino → `appendCards` → `remove` → `shiftLeft` |
| C96 | toda a decisão dentro de `inBoard` (`withBoardLock` → `runInBoardLock`) |
| C97 | `ListTransaction` sem `hasCards`; com `countCards`, `isListDeletionLocked`, `appendCards` |
| C98 | `appendCards`: um `UPDATE ... FROM lists source, lists target` filtrado por `board_id` |
| C99 | `remove` da lista; cards por `ON DELETE CASCADE` |
| C100 | `appendCards` só altera `list_id`, `position`, `updated_at`; teste de preservação de `id` e descrição |
| C101 | teste de primitivas iguais para 4 e 303 cards |
| C102 | rota `DELETE` com `validateQuery(parseDeleteListQuery)` |
| C103 | schema sem consulta ao estado; UUID e existência no serviço |
| C104 | passo "vazia" antes do bloqueio; `DELETE` sem query continua válido |
| C105 | `LIST_CARD_COUNT_CHANGED` 409 |
| C106 | `VALIDATION_ERROR` para destino igual ou ausente; `TARGET_LIST_NOT_FOUND` 409 para inexistente, malformado ou de outro quadro |
| C107 | `LIST_HAS_CARDS` inexistente no código-fonte dos dois projetos |
| C108 | `parseUpdateBoardInput` com `lockListDeletion` opcional; `parseCreateBoardInput` descarta |
| C109 | `BoardSummary.lockListDeletion` no back-end e no front-end |
| C110 | `deletionDialogFor` em `BoardView` |
| C111 | funções puras de `lib/listDeletion.ts` |
| C112 | `toDecision(draft, list.cardCount)` com a lista lida do quadro atual; `reconcileDecision` após recarga |
| C113 | `listDeletionFailureAction` + `BoardView.deleteListWithCards` |
| C114 | checkbox só no modo `edit`; `BoardsView` e `BoardView` sempre enviam o valor |
| C115 | `deletionQuery` com `URLSearchParams` |
| C116 | testes listados acima |

### Decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| Lista esvaziada por recarga com a janela de decisão aberta | A página troca a janela de decisão pela confirmação simples do RF03, em vez de apenas fechar | Guardar só o `id` da lista em exclusão faz a janela refletir o quadro atual: some se a lista sumiu (CA27) e vira confirmação simples se ficou vazia. O usuário continua precisando confirmar explicitamente. |
| `delete` do `ListService` sem regra | Parâmetro com valor padrão `NO_DELETION_RULE` | Mantém a chamada do RF03 para lista vazia e deixa explícito que "sem regra" é um valor, não uma omissão. |
| Validação da query | `validateQuery` grava em `res.locals.query` | Em Express 5, `req.query` é somente leitura. |
| `appendCards` em memória | Verifica a unicidade `(list_id, position)` após a transferência | Reproduz nos testes unitários a garantia do banco que prova F57. |
| Remoção de lista em memória | Remove também os cards da lista | Reproduz o `ON DELETE CASCADE` usado pela regra `cascade`. |
| Testes de integração anteriores | Passam a aplicar as cinco migrations, e o teste de renumeração desfaz as migrations posteriores antes | A consulta do bloqueio exige a coluna nova; sem isso, esses testes quebrariam ao encontrar lista com cards. |
| Opção "Bloquear" em vigor | Além do destaque visual, exibe o texto "(em vigor)" | N104: o estado não pode ser indicado só por cor. |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test`) e das integrações (`TEST_DATABASE_URL=postgres://... npm test` em `back-end/`): não realizada por restrição do `context.md`.
- A migration `1760000004000` roda na próxima inicialização da API.
- Documentos anteriores (`RF03-plan.md`, `RF04-plan.md`) ainda citam `LIST_HAS_CARDS` como histórico; a substituição está registrada em `RF05-plan.md` 3.3.
