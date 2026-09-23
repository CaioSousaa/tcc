# RF08 — Tarefas de Implementação

Referência: `docs/RF08-spec.md`, `docs/RF08-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — módulo `labels`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| L1 | Entidade `Label` (TypeORM), registrada no `DataSource` | Plano §2.1, §3.1 | done |
| L2 | `labels.errors.ts` (`LabelNotFoundError` 404) | Plano §2.1 | done |
| L3 | `labels.schemas.ts` (zod: criação `{name, color}`; atualização `{name?, color?}`, enum de 8 cores) + testes | RN-02, RN-03, critérios 2-4 | done |
| L4 | `LabelRepository` (interface + adapter TypeORM): `create`, `findAllByBoard`, `findByIdAndBoard`, `update`, `delete` | Plano §2.1, §3.1 | done |
| L5 | `labels.service`: `create`/`list`/`update`/`delete`, resolvendo quadro via `findByIdAndMember` (sem checagem de papel, RN-05) | Spec §3/§4 | done |
| L6 | Testes unitários de `labels.service` cobrindo critérios 1-16 e RNs relacionadas | Spec §3/§4 | done |
| L7 | `labels.controller` + `labels.routes` (montadas em `app.ts` como `/boards/:boardId/labels`) + testes de controller | Plano §2.1, §4 | done |

## Back-end — associação card↔etiqueta

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| C1 | Entidade `CardLabel` (sem `boardId` denormalizado), registrada no `DataSource` | Plano §2.2, §3.2 | done |
| C2 | `CardLabelRepository` (interface + adapter): `create` (idempotente), `delete`, `findAllByCardIds` (batelada), `filterCardIdsByLabels` | Plano §2.2, §2.3, §3.2 | done |
| C3 | `cards-labels.errors.ts` (`CardLabelNotFoundError` 404) reusando `LabelNotFoundError` de `labels.errors.ts` | Plano §2.2 | done |
| C4 | `cards-labels.service`: `associate`/`dissociate`, RN-06 a RN-09, sem checagem de papel (RN-05) | Spec §3/§4 | done |
| C5 | Testes unitários de `cards-labels.service` cobrindo critérios 17-23 | Spec §3 | done |
| C6 | `cards-labels.controller` + rotas montadas em `app.ts` como `/boards/:boardId/lists/:listId/cards/:cardId/labels` + testes | Plano §2.2, §4 | done |
| C7 | `CardsService.getLabelsForCards` (leitura agregada em batelada); `CardsService.list` ganha filtro opcional `labelIds`; `cards.controller` inclui `labels` na serialização e repassa `?labelIds=` da query | Plano §2.3, §4 | done |

## Back-end — integração final

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| I1 | `main.ts`: instanciar `LabelRepository`/`CardLabelRepository`, criar `labelsService`/`cardsLabelsService`, religar `cardsService`; montar novas rotas em `app.ts` | Plano §2 | done |
| I2 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte) | qualidade | done — 31 suítes / 378 testes |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/labels/api.ts` (listar/criar/editar/excluir etiqueta) | Plano §4 | done |
| F2 | `lib/cards/api.ts`: `Card.labels`; `listCards` aceita `labelIds`; funções de associar/desassociar etiqueta | Plano §4 | done |
| F3 | Página `/quadros/[id]`: seção "Etiquetas" (criar/renomear/recolorir/excluir), seletor de etiquetas por card, filtro por etiqueta na visualização do quadro | Spec §2, critérios 1-31 | done |
| F4 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — os 31 critérios e as 17 RNs têm implementação e teste rastreáveis |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — nenhuma regressão em `auth`/`boards`/`lists`/`cards`/`checklists` | done — 378/378 testes passando (31 suítes) |

## Notas de implementação

- **Cascata confirmada só por FK, sem código explícito no service — desvio deliberado do padrão RF05/RF06/RF07, mas coerente com o plano.** Diferente de `checklistRepository.deleteAllByCards` (RF06) e `cardAssignmentRepository.deleteAllByBoardAndUser` (RF07), `CardsService.remove` **não** chama nada em `CardLabelRepository` ao excluir um card. Isso é intencional: a disciplina deste projeto de "tornar cascatas explícitas em código de aplicação" sempre foi reservada para cascatas que uma única FK não consegue expressar (RF07 precisou cruzar `card_assignments` por `board_id`+`user_id`, sem passar por `cards`). RF08 não tem esse caso — `card_labels.card_id → cards.id` já é suficiente, exatamente como o plano (§3.2) já havia justificado. Confirmado por leitura do próprio `CardsService.remove` (RF07), que também nunca chamou `cardAssignmentRepository.deleteAllByCard` nesse ponto — mesmo precedente, não uma exceção nova.
- **`CardsService` e dois arquivos de teste que a constroem diretamente (`cards.service.test.ts`, `lists-cards-cascade.test.ts`) precisaram de `FakeCardLabelRepository` novo.** Como `tsconfig.json` exclui `*.test.ts` do `tsc`, um `new CardsService(...)` com um argumento a menos não é pego em tempo de compilação — só quebraria em runtime se algum teste chamasse `getLabelsForCards`/`list(..., labelIds)`. Nenhum chamava, então a omissão não derrubava nenhum teste, mas deixava o construtor com uma dependência `undefined`. Fechado nesta fase com um fake funcional (não um stub) e testes novos para `getLabelsForCards` e para o filtro de `list()` (critérios 25-28).
- Nenhuma dependência nova instalada; nenhuma coluna `board_id` criada em `card_labels`, como o plano previu.
