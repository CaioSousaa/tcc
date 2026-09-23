# RF09 — Tarefas de implementação

**Base:** `docs/RF09-spec.md` e `docs/RF09-plan.md` (herda RF01–RF08).

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Domínio, permissão, erros e schema
- `domain/comments.ts`: limites, `normalizeCommentBody`, `CommentView` — C220.
- Ação `comments.moderate` em `domain/permissions.ts` — F119, C216.
- Códigos `COMMENT_NOT_FOUND` e `COMMENT_LIMIT_REACHED` com as mensagens da spec — A67, C230.
- `schemas/comment.schemas.ts` — 4.4, C219.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Tabela e migration
- Migration `1760000008000-CreateCardComments`, entidade `CardComment`, registro no `DataSource` — 3.1, 3.2, C214.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Leituras: quantidade na face e histórico no card
- `repositories/comments.ts` (`loadComments` em uma instrução) — N184.
- `commentCount` na instrução de cards de `loadListsWithCards` — N185, C226.
- `CardDetail.comments` — 3.4, C227.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T04 — Publicar, editar, excluir e listar
- `CommentRepository` (primitivas sob `runInCardLock` e leitura escopada), `CommentService` — 2.3, 2.4, C215, C217, C218, C221, C222, C223.
- `CommentController`, rotas `.../cards/:cardId/comments`, registro em `app.ts` e `main.ts` — 4.2.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T05 — Testes do back-end
- Domínio, schema e matriz de permissões com `comments.moderate` — N197, N199.
- Repositório em memória de comentários no store compartilhado, com cascatas — N198.
- Serviço: CAs de publicar, editar, excluir, autoria, moderação, limite concorrente, ordem de erros, comentário de outro card, ciclo de vida.
- Integração PostgreSQL condicionada e ajuste dos testes de integração existentes — N200.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Front-end

### T06 — Base do front-end
- `lib/commentTime.ts`, `lib/comments.ts`, `schemas/comment.ts`, `services/commentService.ts` — F127–F129, F133.
- Tipos (`CardSummary.commentCount`, `CardDetail.comments`), `comments.moderate` em `lib/permissions.ts`, mensagens e códigos.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T07 — Seção "Comentários"
- `CommentsSection`, `CommentItem`, `CommentEditForm`, `CommentComposer`, `DeleteCommentDialog` — 2.1–2.6, F126, F130–F132, F134, N193, N194.
- Integração em `CardDialog` e `BoardView` (atualização da face e tratamento de falhas) — F128, F133.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T08 — Indicador na face do card
- Ícone e quantidade em `CardFace` — 2.7, N195.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T09 — Testes do front-end
- `lib/commentTime.ts`, `lib/comments.ts`, schema, matriz de permissões, códigos da API e fixtures — N197, N199.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, conforme `context.md`)

---

## Verificação

### T10 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C213–C242 e da rastreabilidade do plano.
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

Nenhum teste, endpoint ou fluxo de API foi executado (`context.md`, regra 3). Nenhuma dependência nova foi necessária (C213).

### Arquivos por tarefa

| Tarefa | Arquivos |
| --- | --- |
| T01 | `domain/comments.ts`, `domain/permissions.ts`, `schemas/comment.schemas.ts`, `errors/AppError.ts`, `errors/messages.ts`, `middlewares/errorHandler.ts` |
| T02 | `migrations/1760000008000-CreateCardComments.ts`, `entities/CardComment.ts`, `config/data-source.ts` |
| T03 | `repositories/comments.ts`, `repositories/listsWithCards.ts`, `repositories/BoardCardRepository.ts`, `domain/cards.ts` |
| T04 | `repositories/CommentRepository.ts`, `services/CommentService.ts`, `controllers/CommentController.ts`, `routes/comment.routes.ts`, `routes/card.routes.ts`, `routes/board.routes.ts`, `routes/index.ts`, `app.ts`, `main.ts` |
| T05 | `__tests__/comments.test.ts`, `comment.schemas.test.ts`, `CommentService.test.ts`, `Comments.integration.test.ts`, `permissions.test.ts`; helper `InMemoryCommentRepository`; extensões de `InMemoryBoardRepository`, `InMemoryBoardLock`, `InMemoryBoardCardRepository` e `sprintBoard`; ajuste em `CardService.test.ts` e nos seis testes de integração anteriores |
| T06 | `lib/commentTime.ts`, `lib/comments.ts`, `schemas/comment.ts`, `services/commentService.ts`, `services/boardService.ts`, `services/cardService.ts`, `lib/permissions.ts`, `lib/api.ts`, `lib/messages.ts` |
| T07 | `components/comments/CommentsSection.tsx`, `CommentItem.tsx`, `CommentEditForm.tsx`, `CommentComposer.tsx`, `DeleteCommentDialog.tsx`; `components/cards/CardDialog.tsx`, `app/(app)/boards/[boardId]/BoardView.tsx` |
| T08 | `components/comments/icons.tsx`, `components/cards/CardFace.tsx` |
| T09 | `lib/__tests__/commentTime.test.ts`, `lib/__tests__/comments.test.ts`, `schemas/__tests__/comment.test.ts`, `lib/__tests__/permissions.test.ts`, `lib/__tests__/api.test.ts`; fixtures de `boardState`, `checklist`, `labels`, `listDeletion` e `members` |

### Decisões e desvios registrados

- **`comments.moderate` (T01, F119).** Adicionada às matrizes dos dois projetos e às duas tabelas de teste. `comments.write` continua valendo para os dois papéis.
- **Leitura do histórico (T04).** `findComments` resolve participação e card sem bloqueio e devolve o mesmo resultado tipado de `runInCardLock`. Assim, `list` e as escritas usam a mesma tradução para `BOARD_NOT_FOUND` e `CARD_NOT_FOUND`.
- **Edição sem mudança (T04, RN06).** A comparação é entre o texto normalizado recebido e o texto salvo. Quando são iguais, nenhuma instrução de escrita é executada.
- **Face do card (T08).** O rodapé da face passa a ter o indicador de comentários à esquerda e os avatares de responsáveis (RF07) à direita, como no protótipo.
- **Falha genérica ao publicar (T07, CE01).** A mensagem aparece junto ao campo, e o texto é mantido. O campo só é limpo quando a publicação é concluída.
- **Rolagem até o comentário publicado (T07, F131).** É feita depois da renderização, com `scrollIntoView({ block: "nearest" })` sobre o item recém-publicado.
- **FORBIDDEN (T07, CB14).** A seção exibe a mensagem, recarrega o histórico e pede à página do quadro que recarregue o papel. A janela do card permanece aberta.
- **Integração (T05).** Os seis testes de integração anteriores receberam a migration `CreateCardComments` e um `undoLastMigration` a mais nos testes de reversão.
- **Pendências de verificação.** Os testes unitários e de integração foram escritos, mas não executados nesta seção. A execução e a validação dos critérios de aceite ficam para a FASE 4.
