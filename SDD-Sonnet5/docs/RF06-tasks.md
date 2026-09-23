# RF06 — Tarefas de Implementação

Referência: `docs/RF06-spec.md`, `docs/RF06-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — módulo `checklists`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| K1 | Entidades `Checklist` e `ChecklistItem` (TypeORM), sem coluna de posição, registradas no `DataSource` | Plano §3 | done |
| K2 | `checklists.errors.ts` (`ChecklistNotFoundError`, `ItemNotFoundError`, ambos 404) | Plano §4 | done |
| K3 | `checklists.schemas.ts` (zod: criação de checklist `name`; criação de item `text`; atualização de item `completed`) + testes unitários | RN-02, RN-04, critérios 2/3/8/9 | done |
| K4 | `ChecklistRepository` (interface + adapter TypeORM): criar/listar/excluir checklist (com itens aninhados), criar/atualizar/excluir item, `deleteAllByCards` (exclusão em massa, batelada), `getProgressByCards` (consulta agregada, batelada) | Plano §2.1, §2.2, §3, §5 | done |
| K5 | `checklists.service` (create/list/delete checklist; create/update/delete item), resolvendo a cadeia quadro→lista→card→checklist→item | Plano §2.1, RN-01 a RN-16 | done |
| K6 | Testes unitários de `checklists.service` cobrindo os 24 critérios e as 16 RNs | Spec §3/§4 | done |
| K7 | `checklists.controller` + testes unitários (chamada direta de função) | Plano §4 | done |
| K8 | `checklists.routes` aninhadas em `/boards/:boardId/lists/:listId/cards/:cardId/checklists`, atrás de `authenticate`, montadas em `app.ts` | Plano §2.1, §4 | done |
| K9 | `CardsService` passa a depender de `ChecklistRepository` (`getProgressForCards`); `cards.controller` inclui `progress` na serialização de card | Plano §2.2, §4, RN-13 | done |
| K10 | `CardsService.remove` e `ListsService.remove` excluem explicitamente os checklists dos cards envolvidos antes de excluir os cards (mesma disciplina de RF05) | Plano §3, §6 | done |
| K11 | `main.ts` — reordenar wiring para `checklistRepository` existir antes de `cardsService`/`listsService` | Plano §2.2 | done |
| K12 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte) | qualidade | done |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/checklists/api.ts` — funções finas sobre `apiClient` (criar/listar/excluir checklist; adicionar/marcar-desmarcar/excluir item) | Plano §2.1 | done |
| F2 | Página `/quadros/[id]` passa a exibir, por card, um badge de progresso e uma seção expansível com seus checklists (criar/excluir checklist; adicionar/marcar/desmarcar/excluir item) | critérios 1–24 | done |
| F3 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — os 24 critérios e as 16 RNs têm implementação e teste rastreáveis; a cadeia quadro→lista→card→checklist→item é testada de forma que as quatro respostas de "não encontrado" (`board`/`list`/`card`/`checklist`/`item`) nunca se confundem |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — nenhuma regressão em `auth`/`boards`/`lists`/`cards` | done — 242/242 testes passando (20 suítes: 83 de `auth`+`boards`, 46 de `lists` (incluindo a suíte de integração `lists`↔`cards` de RF05), 68 de `cards`, 55 de `checklists`) |

## Notas de implementação

- **Correção de ordenação replicada de RF05.** Assim como `ListsService.remove` (RF05) precisou de uma checagem explícita de existência antes de cascatear, `CardsService.remove` também não tinha essa checagem antes desta fase (delegava a existência do card inteiramente para `CardRepository.delete`). Adicionar a exclusão de checklists exigiu inserir `CardRepository.findByIdAndList` como passo explícito antes de `ChecklistRepository.deleteAllByCards(...)` — do contrário, um `cardId` de outra lista teria seus checklists apagados antes do erro `card_not_found` ser lançado. Mesma classe de bug que RF05 já havia identificado e corrigido para `ListsService`.
- **`CardsService` ganhou um método novo (`getProgressForCards`), não uma mudança de assinatura nos métodos existentes.** Isso manteve os 68 testes já existentes de `cards` (RF04/RF05) intactos em sua maioria — só foi necessário adaptar as poucas asserções que verificavam o corpo JSON exato retornado pelo controller (agora com o campo `progress` adicional) e adicionar `getProgressForCards` aos fakes/mocks de `CardsService` usados em `lists.service.test.ts`, `lists-cards-cascade.test.ts` e `cards.controller.test.ts`.
- **Cálculo do percentual (`Math.round`) e a regra de omissão (`total === 0` → `null`) vivem em `cards.controller.ts`, não em `checklists.service`/`CardsService`.** `ChecklistRepository.getProgressByCards` devolve só contagens brutas (`completed`/`total`), omitindo do mapa qualquer card sem itens; é o controller que decide transformar "ausente do mapa" em `progress: null` e formatar a porcentagem. Decisão de manter o cálculo de apresentação fora da camada de regra de negócio.
- Nenhuma dependência nova instalada; nenhuma coluna de posição criada, como o plano previu.
