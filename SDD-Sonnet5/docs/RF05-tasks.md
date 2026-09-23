# RF05 — Tarefas de Implementação

Referência: `docs/RF05-spec.md`, `docs/RF05-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| B1 | `CardRepository.deleteAllByList(listId)` (interface + adapter TypeORM, exclusão em massa por `list_id`) | Plano §2.1, RN-01/RN-02 | done |
| B2 | `ListsService` passa a depender de `CardRepository`; `remove` exclui cards da lista antes de excluir a lista | Plano §2.1, RN-01 a RN-05 | done |
| B3 | `main.ts` — reordenar wiring para `cardRepository` existir antes de `listsService` | Plano §2.1 | done |
| B4 | Testes unitários de `ListsService.remove` cobrindo cascata (critérios 1, 3, 6, RN-01, RN-02) sem quebrar os testes já existentes de RF03 | Spec §3/§4 | done |
| B5 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte, não só `lists`) | qualidade | done |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `handleDeleteList` busca contagem de cards via `listCards` antes de excluir; confirma com o usuário se > 0; cancelar não chama `deleteList` | critérios 2, 3, 4, 9, RN-03, RN-04, RN-05 | done |
| F2 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — ver nota sobre ordenação abaixo |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — `auth` + `boards` + `lists` + `cards` intactos, nenhuma regressão | done — 184/184 testes passando (16 suítes; +5 testes novos em `lists.service.test.ts` para a cascata, nenhum teste pré-existente quebrado) |

## Notas de implementação

- **Correção de ordenação em relação ao plano.** O plano descrevia a ordem como "(1) posse do quadro, (2) posse da lista, (3) excluir cards, (4) excluir lista", mas o código de `ListsService.remove` herdado de RF03 não tinha um passo (2) explícito — ele delegava a existência da lista inteiramente para `ListRepository.delete` (que já faz a query escopada e retorna `false` se não encontrar). Se a exclusão de cards tivesse sido inserida *antes* dessa delegação, sem uma checagem de existência prévia, o código estaria apagando cards de uma lista sem antes ter confirmado que essa lista pertence ao quadro informado — uma violação literal de RN-06/RN-07 (isolamento) e um furo de segurança real (um `listId` de outro quadro, mesmo inacessível, teria seus cards apagados antes do erro `list_not_found` ser lançado). A implementação final adiciona uma chamada explícita a `ListRepository.findByIdAndBoard` **antes** de chamar `CardRepository.deleteAllByList`, fechando essa lacuna. Testado especificamente em "does not delete cards when the list does not belong to the given board" — sem essa checagem, esse teste teria falhado.
- **Front-end também limpa `cards` do estado local após excluir a lista**, não só `lists` — sem isso, os cards da lista excluída ficariam "presos" no estado React mesmo após a lista sumir da tela (embora nunca mais renderizados, já que o agrupamento é por `listId` de uma lista que não existe mais na UI — um vazamento de estado, não um bug visível, mas corrigido mesmo assim).
- Nenhuma rota nova, nenhuma dependência nova, nenhuma mudança de schema — exatamente como o plano previu.
