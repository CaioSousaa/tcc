# RF08 — Tarefas de implementação

**Base:** `docs/RF08-spec.md` e `docs/RF08-plan.md` (herda RF01–RF07).

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Domínio, códigos de erro e schema
- `domain/labels.ts`: paleta, limites, `normalizeLabelName`, `labelNameKey`, `LabelView` — C181, C185.
- Códigos `LABEL_NOT_FOUND`, `LABEL_NAME_TAKEN` e `LABEL_LIMIT_REACHED` com as mensagens da spec — A62, C197.
- `schemas/label.schemas.ts` — 4.5.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Tabelas e migration
- Migration `1760000007000-CreateLabels`, entidades `Label` e `CardLabel`, registro no `DataSource` — 3.1–3.3, C180.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Leituras: etiquetas no quadro e no card
- `repositories/labels.ts` (`loadLabels` com uso, `loadCardLabelIds`) — N160, D40.
- `labelIds` na instrução de cards de `loadListsWithCards` — N161.
- `BoardDetail.labels` e `CardDetail.labelIds` — 3.5, C193.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T04 — Gerenciar etiquetas
- `LabelRepository` (primitivas sob `runInBoardLock`), `LabelService` (listar, criar, editar, excluir) — 2.3, 2.4, C182, C186, C187.
- `LabelController` e rotas `/api/boards/:boardId/labels` — 4.2.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T05 — Aplicar e remover
- `CardLabelRepository` (primitivas sob `runInCardLock`), `CardLabelService` — 2.4, C183, C189, C196.
- `CardLabelController` e rotas `.../cards/:cardId/labels/:labelId` — 4.3.
- Registro em `app.ts` e `main.ts`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T06 — Testes do back-end
- Domínio e schema de etiqueta — N181.
- Repositórios em memória de etiquetas e aplicações no store compartilhado — N182.
- Serviços: CAs de criar, editar, excluir, aplicar, limite concorrente, nome duplicado concorrente, permissões e ordem de erros.
- Integração PostgreSQL condicionada, e ajuste das migrations e reversões nos testes de integração existentes — N183.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Front-end

### T07 — Base do front-end
- `lib/labelColors.ts`, `lib/labels.ts` (filtro, projeção, contagens, atualizações de estado, textos, tabela de falhas) — F107–F112.
- `services/labelService.ts`, `schemas/label.ts`, tipos (`BoardDetail.labels`, `labelIds`), mensagens e códigos.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T08 — Janela "Etiquetas do quadro"
- `LabelChip`, `LabelColorPicker`, `NewLabelForm`, `LabelManageRow`, `LabelCheckRow`, `DeleteLabelDialog` e `LabelsDialog` (modos "manage" e "card") — 2.2–2.5, F113, F114, N176, N178–N180.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T09 — Quadro: filtro, face e card
- Botão "Etiquetas" no cabeçalho, `LabelFilterBar` e projeção só em `BoardLists` — F108, F109, F117, N177.
- Etiquetas na face, `CardLabelsSection` na janela do card e aviso de card oculto — 2.6, F115, F116.
- Tratamento de falhas de F112 em `BoardView`.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T10 — Testes do front-end
- `lib/labels.ts`, `lib/labelColors.ts`, schema de etiqueta, códigos da API e ajuste de fixtures — N181.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Verificação

### T11 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C179–C212 e da rastreabilidade do plano.
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

Nenhum teste, endpoint ou fluxo de API foi executado (`context.md`, regra 3). Nenhuma dependência nova foi necessária (C179).

### Arquivos por tarefa

| Tarefa | Arquivos |
| --- | --- |
| T01 | `domain/labels.ts`, `schemas/label.schemas.ts`, `errors/AppError.ts`, `errors/messages.ts`, `middlewares/errorHandler.ts` |
| T02 | `migrations/1760000007000-CreateLabels.ts`, `entities/Label.ts`, `entities/CardLabel.ts`, `config/data-source.ts` |
| T03 | `repositories/labels.ts`, `repositories/listsWithCards.ts`, `repositories/BoardRepository.ts`, `repositories/BoardCardRepository.ts`, `domain/boards.ts`, `domain/cards.ts` |
| T04 | `repositories/LabelRepository.ts`, `services/LabelService.ts`, `controllers/LabelController.ts`, `routes/label.routes.ts`, `routes/board.routes.ts`, `routes/index.ts` |
| T05 | `repositories/CardLabelRepository.ts`, `services/CardLabelService.ts`, `controllers/CardLabelController.ts`, `routes/card.routes.ts`, `app.ts`, `main.ts` |
| T06 | `__tests__/labels.test.ts`, `label.schemas.test.ts`, `LabelService.test.ts`, `CardLabelService.test.ts`, `Labels.integration.test.ts`; helpers `InMemoryLabelRepository`, `InMemoryCardLabelRepository`, extensões de `InMemoryBoardRepository`, `InMemoryBoardLock`, `InMemoryBoardCardRepository` e `sprintBoard`; ajustes em `BoardService.test.ts`, `CardService.test.ts` e nos cinco testes de integração anteriores |
| T07 | `lib/labelColors.ts`, `lib/labels.ts`, `services/labelService.ts`, `schemas/label.ts`, `services/boardService.ts`, `services/cardService.ts`, `lib/api.ts`, `lib/messages.ts` |
| T08 | `components/labels/LabelChip.tsx`, `LabelColorPicker.tsx`, `NewLabelForm.tsx`, `LabelManageRow.tsx`, `LabelCheckRow.tsx`, `DeleteLabelDialog.tsx`, `LabelsDialog.tsx`, `icons.tsx` |
| T09 | `components/labels/LabelFilterBar.tsx`, `components/cards/CardLabelsSection.tsx`, `components/cards/CardFace.tsx`, `components/cards/CardDialog.tsx`, `components/lists/ListColumn.tsx`, `components/boards/BoardHeader.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx` |
| T10 | `lib/__tests__/labels.test.ts`, `lib/__tests__/labelColors.test.ts`, `schemas/__tests__/label.test.ts`, `lib/__tests__/api.test.ts`; fixtures de `boardState`, `checklist`, `listDeletion` e `members` |

### Decisões e desvios registrados

- **Comparação de nomes (T04, F104/F105).** `isNameTaken` compara com `lower(name) = lower($2)` no próprio banco, em vez de calcular `labelNameKey` no serviço. Assim, a verificação e o índice único usam a mesma função. `labelNameKey` continua no domínio e é testada.
- **Remoção de etiqueta inexistente (T05, F106).** `DELETE` de aplicação com etiqueta inexistente responde `LABEL_NOT_FOUND`, como no plano. Na janela do modo card, o front-end retira o id do card antes de recarregar as etiquetas, o que conclui a remoção pedida (CB12).
- **Total de cards (T09).** O total "{N} cards no quadro" e "{X} de {N} cards" é calculado a partir de `board.lists`, e não de `board.cardCount`, para refletir exatamente as listas carregadas na tela (RN13).
- **Edição de lista com filtro ativo (T09, F109).** O handler de "Editar lista" resolve a lista por id em `board.lists` antes de abrir o diálogo. A exclusão já resolvia por id desde o RF05.
- **Janela do modo card (T09).** É renderizada por `CardDialog` como diálogo irmão, no mesmo padrão da confirmação de exclusão de card. `FORBIDDEN` fecha só a janela de etiquetas e segue para `BoardView`, que exibe o aviso e recarrega o quadro. A janela do card continua aberta.
- **Cores dos chips (T07, N175).** Cada cor tem amostra, fundo e texto. O teste `labelColors.test.ts` calcula o contraste WCAG texto/fundo e exige pelo menos 4,5:1.
- **Integração (T06).** Os cinco testes de integração anteriores receberam a migration `CreateLabels` e um `undoLastMigration` a mais nos testes de reversão.
- **Pendências de verificação.** Os testes unitários e de integração foram escritos, mas não executados nesta seção. A execução e a validação dos critérios de aceite ficam para a FASE 4.
