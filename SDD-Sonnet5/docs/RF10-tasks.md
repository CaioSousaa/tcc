# RF10 — Tarefas de Implementação

Referência: `docs/RF10-spec.md`, `docs/RF10-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — extensão do módulo `cards`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| B1 | `Card` ganha coluna `dueDate` (`date`, nullable, sem índice) | Plano §2.1, §3.1 | done |
| B2 | `cards.schemas.ts`: `dueDate` validado como `AAAA-MM-DD` em `createCardSchema` (opcional) e `updateCardSchema` (opcional, aceita `null`) + testes | RN-01, RN-03, RN-04, critérios 2, 3, 9 | done |
| B3 | `CardRepository` (interface + adapter TypeORM): `CreateCardData`/`UpdateCardFields` ganham `dueDate`; `create`/`update`/`move` passam o campo adiante | Plano §2.1, §3.1 | done |
| B4 | `CardsService.list` ganha parâmetro `sortByDueDate`: ordenação estável em memória, sem prazo por último (RN-10, RN-11, RN-12) | Plano §2.3, §6 | done |
| B5 | Testes unitários de `CardsService` cobrindo critérios 1, 2, 7, 8, 9, 17-20 (definir/alterar/remover prazo e ordenação) | Spec §3 | done |
| B6 | `cards.controller.ts`: calcula `dueDateStatus` ("overdue"/"due_soon"/null) na serialização; repassa `?sortByDueDate=` da query | Plano §2.2, §4 | done |
| B7 | Testes de `cards.controller` cobrindo critérios 10-15 (status calculado, inclusive recálculo com o relógio avançando) e o parâmetro de ordenação | Spec §3 | done |

## Back-end — verificação final

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| I1 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte) | qualidade | done — 35 suítes / 435 testes |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/cards/api.ts`: `Card.dueDate`/`dueDateStatus`; `CreateCardInput`/`UpdateCardInput` ganham `dueDate`; `listCards` aceita `sortByDueDate` | Plano §4 | done |
| F2 | Página `/quadros/[id]`: campo de prazo ao editar card, destaque visual para atrasado/vencimento próximo, alternância de ordenação por prazo na lista | Spec §2, critérios 1-21 | done |
| F3 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — 21/21 critérios e 13/13 RNs passaram; nenhuma divergência spec-código nem plano-código; ver `docs/RF10-validation.md` |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — nenhuma regressão em `auth`/`boards`/`lists`/`cards`/`checklists`/`labels`/`comments` | done — 35 suítes / 435 testes, todos passando |

## Notas de implementação

- **`dueDateStatus` testado com `jest.useFakeTimers().setSystemTime(...)`, não com datas fixas.** Como "hoje" é sempre a data real do servidor no momento da chamada (RN-08), qualquer teste que precisasse de "atrasado"/"vencimento próximo" contra uma data literal fixa quebraria sozinho conforme o tempo passasse. Os testes de `critérios 10-14` calculam `dueDate` relativo ao dia em que o teste roda (`dateOffsetFromTodayUTC`); o teste do critério 15 (recálculo automático) avança o relógio do sistema de um dia para o outro com o mesmo `dueDate` fixo e confirma que o status muda de `"due_soon"` para `"overdue"` sozinho, sem que o card seja alterado — a prova mais direta possível de RN-08 em um ambiente sem banco real.
- **`CardRepository.move` precisou de um `if (data.dueDate !== undefined)` a mais**, junto dos já existentes para `title`/`description` — diferente de `update`, que só repassa `data` inteiro para `this.repo.update(...)`, `move` monta o card atualizado campo a campo manualmente (para poder recalcular posições na mesma transação), então cada campo novo do card precisa ser adicionado explicitamente ali também.
- A comparação de datas (`dueDate < today`, RN-05/RN-06) usa comparação lexicográfica de strings `AAAA-MM-DD`, não `Date` — como o formato tem largura fixa e é zero-padded, ordem lexicográfica e ordem cronológica coincidem exatamente, evitando qualquer parsing de fuso horário no meio da comparação.
- Nenhuma dependência nova instalada; nenhum módulo, entidade, repositório, service ou controller novo criado — exatamente como o plano previu (§2.1).
