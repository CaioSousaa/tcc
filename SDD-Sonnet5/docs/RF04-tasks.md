# RF04 — Tarefas de Implementação

Referência: `docs/RF04-spec.md`, `docs/RF04-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — módulo `cards`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| C1 | Entidade `Card` (TypeORM): `title`, `description`, `list_id` (FK `onDelete: CASCADE`), `position` inteiro, índice composto `(list_id, position)` | Plano §3.1 | done |
| C2 | `cards.errors.ts` (`CardNotFoundError`, 404) | Plano §4 | done |
| C3 | `cards.schemas.ts` (zod: criação `title`+`description?`; atualização `title?`/`description?`/`targetListId?`) + testes unitários | RN-02, RN-03, RN-16, critérios 2/3/13 | done |
| C4 | Interface `CardRepository` + adapter TypeORM: criar (posição ao final), listar ordenado, buscar por `id+listId`, editar sem mover, mover entre listas (reindexa origem e destino na mesma transação), excluir (reindexa restantes) | Plano §2.1, §3.1, §5 | done |
| C5 | `cards.service` (create/list/update-ou-move/remove), dependente de `BoardRepository` (RF02) e da resolução de lista dentro de quadro (RF03) para checar a cadeia quadro→lista→card antes de qualquer operação | Plano §2.1, RN-01 a RN-16 | done |
| C6 | Testes unitários de `cards.service` cobrindo os 24 critérios e as 16 RNs, com atenção especial à distinção `board_not_found`/`list_not_found`/`card_not_found` e ao caminho de movimentação (RN-11 a RN-13) | Spec §3/§4 | done |
| C7 | `cards.controller` + testes unitários (chamada direta de função) | Plano §4 | done |
| C8 | `cards.routes` aninhadas em `/boards/:boardId/lists/:listId/cards`, atrás de `authenticate`, montadas em `app.ts` | Plano §2.1, §4 | done |
| C9 | Verificação: `npm run build` e `npm test` sem erros | qualidade | done |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/cards/api.ts` — funções finas sobre `apiClient` (criar/listar/atualizar-ou-mover/excluir) | Plano §2.2 | done |
| F2 | Página `/quadros/[id]` passa a exibir os cards de cada lista, com criação, edição (título via `prompt`) e exclusão; mover usa um `<select>` com as listas do quadro | critérios 1–24 | done |
| F3 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — os 24 critérios e as 16 RNs têm implementação e teste rastreáveis; a cadeia de resolução quadro→lista→card (RN-06/RN-07/RN-08) é testada de forma que as três respostas de "não encontrado" nunca se confundem, inclusive no caminho de movimentação (lista de destino resolvida com a mesma verificação da lista de origem) |
| V2 | Suíte de testes unitários executada (`npm test` no back-end) — `auth` + `boards` + `lists` + `cards` | done — 179/179 testes passando (16 suítes: 5 de `auth`, 4 de `boards`, 4 de `lists`, 3 de `cards`) |

## Notas de implementação

- **Editar e mover são de fato o mesmo método de service**, como o plano exigia (`CardsService.update`): o parâmetro `targetListId` é opcional e, quando ausente ou igual à lista atual, o método delega para `CardRepository.update` (edição simples, sem reindexação); quando presente e diferente, delega para `CardRepository.move` (reindexação transacional de origem e destino). Nenhuma rota ou método de service separado foi criado para "mover".
- **Movimentação para a própria lista atual (RN-13) tratada por igualdade de string, não por uma chamada extra ao repositório.** `input.targetListId !== listId` decide entre os dois caminhos acima — mover para a lista atual cai automaticamente no caminho de "edição simples" (sem reindexar nada), que é exatamente o comportamento pedido pelo critério 21 (aceito, sem erro, sem efeito de posição).
- **Reindexação de movimentação verificada com um teste dedicado.** Além de testar o resultado do card movido, `cards.service.test.ts` tem um teste específico ("reindexes the source list after a card leaves it, preserving relative order") que verifica que os cards remanescentes na lista de origem ficam com posições contíguas (`[0, 1]`) depois que um deles sai — mesmo cuidado que já havia sido aplicado a `lists` em RF03.
- **`FakeCardRepository` usado nos testes replica fielmente a lógica de reindexação do `TypeOrmCardRepository`** (incluindo o `move` de duas listas), pelo mesmo motivo já registrado nas notas de RF03: a atomicidade real da transação de banco não pôde ser verificada sem PostgreSQL vivo nesta sessão — isso será revisitado na fase de validação.
