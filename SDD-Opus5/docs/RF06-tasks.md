# RF06 — Tarefas de implementação

**Base:** `docs/RF06-spec.md` e `docs/RF06-plan.md` (herda RF01–RF05).

Cada tarefa entrega uma parte funcional e verificável, na ordem de dependência: dados e contratos de card, API da checklist, front-end, testes e conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Tabela e domínio da checklist
- Migration `CreateChecklistItems` e entidade `ChecklistItem` — 3.1, 3.2, C118.
- `domain/checklist.ts`: limites, tipo `ChecklistItem`, normalização reaproveitada de `domain/cards.ts` — D28, C126.
- Códigos `CHECKLIST_ITEM_NOT_FOUND` (404) e `CHECKLIST_LIMIT_REACHED` (409) — A51.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T02 — Progresso nos contratos de card
- `CardSummary` com `checklistTotal`/`checklistDone`, agregados na consulta única de `loadListsWithCards` — C129, C130, N112.
- `CardDetail.checklist` no `GET` do card e na resposta do `PATCH` de card — N113.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Repositório, serviço e rotas da checklist
- `repositories/cardLock.ts` (`runInCardLock`) — F63, F64, C119.
- `ChecklistRepository` com as primitivas de F65 — C120, C140.
- `ChecklistService` com os algoritmos de 2.3 e a ordem de C121 — C122–C125, C128.
- `schemas/checklist.schemas.ts`, `ChecklistController`, `checklist.routes.ts` e composição — 4.3–4.5, A52.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T04 — Testes do back-end
- Schemas da checklist.
- `ChecklistService` com repositório em memória (bloqueio por card, filtro por card, unicidade, rollback, limite concorrente, atualização parcial) — N133.
- Contagens da face em `listsWithCards` e preservação ao mover card ou excluir lista — N134.
- Ajuste dos repositórios e testes em memória afetados.
- Integração com PostgreSQL condicionada a `TEST_DATABASE_URL`.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T05 — Base do front-end
- Tipos (`CardSummary`, `CardDetail`, `ChecklistItem`), `checklistService`, `schemas/checklist.ts`.
- `lib/checklist.ts`: `checklistProgress`, `sectionLabel`, `faceLabel`, `faceAccessibleName`, `summarize`, `withCardChecklist`, `checklistFailureAction` — F70, C131, C132, C138.
- Mensagens e códigos novos.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T06 — Progresso na face do card
- `ChecklistProgress` (modos `face` e `section`) e uso em `CardFace` — spec 2.6, N128, N129.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T07 — Seção "Checklist" na janela do card
- `ChecklistSection`, `ChecklistItemRow`, `AddChecklistItemForm` — spec 2.1–2.5, F71–F73, C133–C136.
- Integração em `CardDialog` e `BoardView` (atualização da face e tabela de falhas) — F74, C137.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T08 — Testes do front-end
- `lib/checklist.ts` (arredondamento, textos, `withCardChecklist`, falhas), schema da checklist, códigos — N132.
- Ajuste de fixtures afetadas.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T09 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C117–C142 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Tabela e domínio da checklist | concluída | `tsc`, `npm run build` |
| T02 — Progresso nos contratos de card | concluída | `tsc`, `npm run build` |
| T03 — Repositório, serviço e rotas | concluída | `tsc`, `npm run build` |
| T04 — Testes do back-end | concluída (não executados) | `tsc` |
| T05 — Base do front-end | concluída | `tsc` |
| T06 — Progresso na face do card | concluída | `tsc`, `npm run build` |
| T07 — Seção "Checklist" na janela do card | concluída | `tsc`, `npm run build` |
| T08 — Testes do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T09 — Conferência final | concluída | revisão de C117–C142 e da rastreabilidade do plano |

### Arquivos produzidos ou alterados

**Back-end**

| Arquivo | Papel |
| --- | --- |
| `src/migrations/1760000005000-CreateChecklistItems.ts`, `src/entities/ChecklistItem.ts` | tabela `checklist_items` com cascata, `CHECK`s e `UNIQUE (card_id, position)` |
| `src/domain/checklist.ts` | limites, tipo `ChecklistItem`, normalização reaproveitada do título do card |
| `src/repositories/cardLock.ts` | `runInCardLock`: quadro escopado por dono + `FOR UPDATE OF` do card |
| `src/repositories/ChecklistRepository.ts` | `ChecklistTransaction` e implementação TypeORM (atualização parcial por `COALESCE`) |
| `src/repositories/checklistItems.ts` | leitura dos itens de um card |
| `src/services/ChecklistService.ts` | adicionar, alterar, excluir; ordem de erros e limite |
| `src/schemas/checklist.schemas.ts`, `src/controllers/ChecklistController.ts`, `src/routes/checklist.routes.ts` | API `.../cards/:cardId/checklist-items[/:itemId]` |
| alterados: `domain/cards.ts` (`CardSummary.checklistTotal/Done`, `CardDetail.checklist`), `repositories/listsWithCards.ts` (agregação na consulta de cards), `repositories/BoardCardRepository.ts` (itens no `CardDetail`), `routes/card.routes.ts`, `routes/board.routes.ts`, `routes/index.ts`, `app.ts`, `main.ts`, `config/data-source.ts`, `errors/*`, `middlewares/errorHandler.ts` | integração |

**Front-end**

| Arquivo | Papel |
| --- | --- |
| `src/components/checklist/ChecklistSection.tsx` | estado dos itens, modo único de edição, itens pendentes, tabela de falhas |
| `src/components/checklist/ChecklistItemRow.tsx` | checkbox rotulado pelo texto, edição inline, excluir |
| `src/components/checklist/AddChecklistItemForm.tsx` | campo "Texto do item" |
| `src/components/checklist/ChecklistProgress.tsx` | barra com `role="progressbar"` nos modos `face` e `section` |
| `src/lib/checklist.ts` | `checklistProgress`, textos, `summarize`, `withCardChecklist`, `checklistFailureAction` |
| `src/schemas/checklist.ts`, `src/services/checklistService.ts` | validação no cliente e chamadas à API |
| alterados: `components/cards/CardFace.tsx`, `components/cards/CardDialog.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx`, `services/boardService.ts`, `services/cardService.ts`, `lib/api.ts`, `lib/messages.ts` | integração |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `checklist.schemas.test.ts` | CA08, CA11–CA13, CA17, CA22, CA24, CB01–CB08, RN04, RN08 |
| `ChecklistService.test.ts` | CA01–CA04, CA08–CA10, CA16–CA19, CA21–CA23, CA27, CA28, CA30–CA37, CB10, CB13, CB15, RN05–RN08, RN12, RN14–RN17, C121, F69, N111, N122, N123 |
| `Checklist.integration.test.ts` | N112, N122, CB15, CA31, CA32, RN15, C118; **pulado sem `TEST_DATABASE_URL`** |
| `helpers/InMemoryChecklistRepository.ts` | fila por card, filtro por card, unicidade `(card_id, position)` e rollback |
| atualizados: `CardService.test.ts`, `errorHandler.test.ts`, `helpers/InMemoryBoardRepository.ts` (itens, contagens, cascata), `helpers/InMemoryBoardCardRepository.ts`, `helpers/InMemoryBoardListRepository.ts`, `helpers/InMemoryBoardLock.ts` (rollback dos itens), três integrações anteriores (migration da checklist) | ajustes |

**Front-end** (`front-end/src/**/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `lib/__tests__/checklist.test.ts` | CA01–CA06, CA08, CA10, CA11, CA12, CA17, CA19, CA24, CA27, CA28, CA34, CA36, CA38, CB12, CB17, CB18, CE01, CE02, RN09, RN10, RN14, C131, C133, F74, spec 5.4 |
| `schemas/__tests__/checklist.test.ts` | CA08, CA11–CA13, CA24, CB02–CB05 |
| atualizados: `lib/__tests__/api.test.ts`, `lib/__tests__/boardState.test.ts`, `lib/__tests__/listDeletion.test.ts` | novos códigos e contagens na face |

### Conferência contra o plano

| Restrição | Onde é atendida |
| --- | --- |
| C117 | nenhuma dependência instalada; checkbox nativo, barra com `role="progressbar"` |
| C118 | migration `1760000005000` |
| C119 | `runInCardLock` |
| C120 | `ChecklistTransaction` filtrada por `card_id` |
| C121 | rota valida corpo → `withCardLock` (quadro → card) → `requireItem` → limite |
| C122 | `nextPosition` + `done: false`; schema de criação só lê `text` |
| C123 | posições `MAX + 1`, sem renumeração |
| C124 | `count() >= 100` dentro do bloqueio → `CHECKLIST_LIMIT_REACHED` |
| C125 | `UPDATE ... COALESCE`; front envia só `done` ou só `text` |
| C126 | `normalizeChecklistText` → `normalizeCardTitle` |
| C127 | `CHECKLIST_ITEM_NOT_FOUND` 404; `reload-silently` na exclusão |
| C128 | `listItems()` em todas as respostas |
| C129 | contagens agregadas por `LEFT JOIN` em `loadListsWithCards` |
| C130 | `CardSummary` e `CardDetail` nos dois projetos |
| C131 | `Math.floor`, `null` com total 0 |
| C132 | `lib/checklist.ts` |
| C133 | `ChecklistSection.apply` → `onChecklistChange` → `withCardChecklist` |
| C134 | `mode` único |
| C135 | sem atualização otimista; `pendingIds` |
| C136 | `preventDefault` + `stopPropagation` no Esc dos campos |
| C137 | `ChecklistSection` fora do formulário do card; "Salvar card" não envia itens |
| C138 | `checklistFailureAction` + `handleFailure` |
| C139 | nenhuma exclusão explícita de itens fora do serviço de checklist |
| C140 | teste de primitivas constantes |
| C141 | `label htmlFor` no checkbox; `aria-label` da barra na face |
| C142 | testes listados acima |

### Decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| Formulários aninhados | O formulário do card passou a envolver só título e descrição; o botão "Salvar card" usa o atributo `form`; a seção "Checklist" fica fora desse formulário | Os campos de adicionar e editar item são formulários próprios, e HTML não permite formulário dentro de formulário. Também garante que Enter na checklist nunca dispare "Salvar card" (C137). |
| Elementos da barra | `ChecklistProgress` usa só `<span>` | A variante da face fica dentro do `<button>` do card, que só aceita conteúdo de frase. |
| `runInCardLock` com id malformado | Recebe `null` e só verifica o quadro | Evita erro de sintaxe de UUID no PostgreSQL mantendo a ordem quadro → card (C121). |
| Atualização parcial | `COALESCE($n, coluna)` em uma única instrução | Grava só os campos presentes sem montar SQL dinâmico (CB15, N120). |
| Integrações anteriores | Passaram a aplicar a migration da checklist e a desfazer uma migration a mais nos testes de renumeração | `loadListsWithCards` agora consulta `checklist_items`. |
| Cascata em memória | `InMemoryBoardRepository.deleteCard` remove os itens | Reproduz `ON DELETE CASCADE` para cards excluídos diretamente, com a lista ou com o quadro. |
| Recarga após item inexistente | A seção busca o card com `GET` e substitui os itens, atualizando também a face | CA36 e CB22 sem uma rota nova de leitura da checklist. |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test`) e das integrações (`TEST_DATABASE_URL=postgres://... npm test` em `back-end/`): não realizada por restrição do `context.md`.
- A migration `1760000005000` roda na próxima inicialização da API.
