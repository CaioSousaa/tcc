# RF10 — Tarefas de implementação

**Base:** `docs/RF10-spec.md` e `docs/RF10-plan.md` (herda RF01–RF09).

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Domínio e validação
- `domain/dueDate.ts`: faixa, `isValidDueDate`, `isCalendarDate` — F142, C248.
- `dueDate` obrigatório em `parseUpdateCardInput` e mensagem "Informe uma data válida." — F136, C247.
- `parseTodayQuery` para `today` opcional — A69, C252.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Coluna e migration
- Migration `1760000009000-CardDueDate` (coluna, `CHECK`, índice parcial), entidade `Card`, registro no `DataSource` — 3.1, 3.2, C244.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Salvar e ler o prazo do card
- `updateContent` grava `due_date`; leitura em texto em `loadListsWithCards` e no detalhe — F135, D49, C245, C246, C254.
- `CardService.update` com `dueDate.write` quando o prazo muda — F137, C249.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T04 — Atrasados na listagem
- `overdue_count` na instrução de resumo com `today` parametrizado; `listSummaries(scope, today)`, `BoardService.list(userId, today)`, controller e rota com `validateQuery` — F139, N201, N203, C251, C252.
- Aceite de convite com `today` — A70, C253.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T05 — Testes do back-end
- Domínio, schema do card e query `today` — N215.
- Serviços em memória: salvar, remover, preservar ao mover, `overdueCount` com `today`, permissão — N216.
- Integração PostgreSQL condicionada (faixa, ida e volta sem deslocamento de dia, contagem, reversão) e ajuste dos testes de integração existentes — N217.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Front-end

### T06 — Base do front-end
- `lib/dueDate.ts` (hoje local, dias, situação, textos, nome acessível, validação, ordenação, projeção) — F143–F147.
- `boardCountsLabel` com atrasados; tipos, serviços (`list(today)`, `accept(id, today)`), `validateCardForm` com `dueDate` e `badInput` — F146, F149, C263, C268.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T07 — Janela e face do card
- `DueDateBadge` e `DueDateField` na janela, prazo enviado em "Salvar card", erro de campo — F148, F150, F151, N211, N212.
- Indicador na face — 2.4, C260.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T08 — Ordenar por prazo e "Meus quadros"
- Botão na barra, estado local e projeção em `BoardView` — F141, F147, N213, C264–C267.
- Sufixo de atrasados em `BoardCard`, `today` na listagem e no aceite, preservação ao editar — F146, C253, C268.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T09 — Testes do front-end
- `lib/dueDate.ts`, `boardCountsLabel`, `validateCardForm` com prazo e fixtures — N215.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Verificação

### T10 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C243–C272 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resultado da implementação

### Verificação executada

| Projeto | Comando | Resultado |
| --- | --- | --- |
| back-end | `npx tsc --noEmit` (código e testes) | sem erros |
| back-end | `npm run build` | sem erros |
| front-end | `npx tsc --noEmit` (código e testes) | sem erros |
| front-end | `npm run build` | sem erros |

Nenhum teste, endpoint ou fluxo de API foi executado (`context.md`, regra 3). Nenhuma dependência nova foi necessária (C243).

### Arquivos por tarefa

| Tarefa | Arquivos |
| --- | --- |
| T01 | `domain/dueDate.ts`, `schemas/card.schemas.ts`, `schemas/board.schemas.ts` (`parseTodayQuery`), `errors/messages.ts` |
| T02 | `migrations/1760000009000-CardDueDate.ts`, `entities/Card.ts`, `config/data-source.ts` |
| T03 | `repositories/BoardCardRepository.ts` (`findCard`, `updateContent`, detalhe), `repositories/listsWithCards.ts`, `services/CardService.ts`, `domain/cards.ts` |
| T04 | `repositories/BoardRepository.ts` (`overdue_count`, `loadBoardSummary`, `listSummaries`), `services/BoardService.ts`, `controllers/BoardController.ts`, `routes/board.routes.ts`, `repositories/InvitationRepository.ts`, `services/InvitationService.ts`, `controllers/InvitationController.ts`, `routes/invitation.routes.ts`, `domain/boards.ts` |
| T05 | `__tests__/dueDate.test.ts`, `DueDateService.test.ts`, `DueDate.integration.test.ts`, `card.schemas.test.ts`; helpers `InMemoryBoardRepository`, `InMemoryBoardCardRepository`, `InMemoryInvitationRepository` e `sprintBoard`; `dueDate: null` nas chamadas de `cards.update` dos testes anteriores; ajuste de chaves em `BoardService.test.ts` e `CardService.test.ts`; nova migration nos sete testes de integração anteriores |
| T06 | `lib/dueDate.ts`, `lib/plural.ts`, `lib/boardsState.ts`, `lib/messages.ts`, `schemas/card.ts`, `services/boardService.ts`, `services/cardService.ts`, `services/invitationService.ts` |
| T07 | `components/cards/DueDateBadge.tsx`, `components/cards/DueDateField.tsx`, `components/cards/CardDialog.tsx`, `components/cards/CardFace.tsx` |
| T08 | `components/labels/LabelFilterBar.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx`, `app/(app)/boards/BoardsView.tsx`, `components/boards/BoardCard.tsx`, `components/invitations/InvitationsSection.tsx` |
| T09 | `lib/__tests__/dueDate.test.ts`, `lib/__tests__/plural.test.ts`, `lib/__tests__/boardsState.test.ts`, `schemas/__tests__/card.test.ts`; fixtures de `boardState`, `checklist`, `comments`, `labels`, `listDeletion` e `members` |

### Decisões e desvios registrados

- **Parâmetro `today` na instrução de resumo (T04, N203).** `$2` é sempre `today` (ou `NULL`), e a contagem usa `COALESCE($2::date, CURRENT_DATE)`. Em `loadBoardSummary`, o id do quadro passou a ser `$3`. Criar, editar e detalhar quadro chamam sem `today`, portanto usam a data do banco (F140).
- **Preservação da contagem ao editar quadro (T06, F140/F146).** Foi implementada em `replaceBoard`, que só é usado depois de editar um quadro em "Meus quadros", e é coberta por teste.
- **Permissão `dueDate.write` (T03, F137).** `CardService.inBoard` passou a entregar o papel ao trabalho, para verificar `dueDate.write` somente quando o prazo muda.
- **`badInput` do campo de data (T07, F149).** O estado é lido em `onChange`, `onInput` e `onBlur`. Uma data incompleta mantém o valor `""` e pode não disparar `change`; o `blur`, que ocorre antes do clique em "Salvar card", garante a leitura atualizada.
- **Indicador na janela (T07, F150).** Mostra a prévia da data em edição e fica oculto enquanto há erro de validação no campo, para não exibir situação de uma data recusada.
- **Posição do campo "Prazo" (T07, F148).** Depois de "Responsáveis", como no protótipo, e abaixo de "Etiquetas", como pede a spec.
- **Botão "Ordenar por prazo" (T08, N213).** Fica na barra do RF08, à direita e antes do total, com `aria-pressed` e marca de verificação quando ativo.
- **Testes anteriores (T05).** Todas as chamadas de `cards.update` nos testes existentes passaram a enviar `dueDate: null`, porque o campo agora é obrigatório no contrato (F136). O teste de reversão dos sete testes de integração ganhou um `undoLastMigration` a mais.
- **Pendências de verificação.** Os testes unitários e de integração foram escritos, mas não executados nesta seção. O teste de integração de datas deve ser executado também com `TZ` a oeste de UTC (N217). A execução e a validação dos critérios de aceite ficam para a FASE 4.
