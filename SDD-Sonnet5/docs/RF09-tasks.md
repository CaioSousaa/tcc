# RF09 — Tarefas de Implementação

Referência: `docs/RF09-spec.md`, `docs/RF09-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Back-end — módulo `cards-comments`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| B1 | Entidade `Comment` (sem `updatedAt`, sem `onDelete` em `authorId`), registrada no `DataSource` | Plano §2.1, §3.1 | done |
| B2 | `CommentRepository` (interface + adapter TypeORM): `create`, `findAllByCardWithAuthor` (join com `users`, ordenado por `created_at ASC`), `deleteAllByCards` (batelada) | Plano §2.1, §2.3, §3.1 | done |
| B3 | `cards-comments.schemas.ts` (zod: `{text}`, máx. 2000 caracteres) + testes | RN-02, critérios 2, 3 | done |
| B4 | `cards-comments.service`: `create`/`list`, resolvendo a cadeia quadro→lista→card, sem checagem de papel (RN-03) | Spec §3/§4 | done |
| B5 | Testes unitários de `cards-comments.service` cobrindo critérios 1-12 e RNs relacionadas | Spec §3/§4 | done |
| B6 | `cards-comments.controller` + `cards-comments.routes` (só `POST`/`GET`, montadas em `app.ts` como `/boards/:boardId/lists/:listId/cards/:cardId/comments`) + testes de controller | Plano §2.1, §4 | done |
| B7 | `CardsService.remove` e `ListsService.remove` cascateiam `CommentRepository.deleteAllByCards` explicitamente (mesmo ponto em que já cascateiam `checklists`); `ListsService` ganha `CommentRepository` no construtor | Plano §2.3, §6, RN-09, RN-10 | done |
| B8 | Testes cobrindo a cascata (critérios 13, 14) em `cards.service.test.ts` e `lists.service.test.ts`/`lists-cards-cascade.test.ts` | Spec §3 | done |

## Back-end — integração final

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| I1 | `main.ts`: instanciar `CommentRepository`, religar `cardsService`/`listsService`, criar `cardsCommentsService`; montar rota nova em `app.ts` | Plano §2 | done |
| I2 | Verificação: `npm run build` e `npm test` sem erros (toda a suíte) | qualidade | done — 35 suítes / 407 testes |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/comments/api.ts` (listar/criar comentário) | Plano §4 | done |
| F2 | Página `/quadros/[id]`: seção de comentários dentro do card expandido (histórico cronológico + formulário de novo comentário) | Spec §2, critérios 1-12 | done |
| F3 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — ver `docs/RF09-validation.md`; 1 divergência plano×código encontrada e documentada (critério 14 não ganhou testabilidade unitária, ao contrário do que o plano prometia) |
| V2 | Suíte de testes unitários completa executada (`npm test` no back-end) — nenhuma regressão em `auth`/`boards`/`lists`/`cards`/`checklists`/`labels` | done — 35 suítes / 407 testes passando |

## Notas de implementação

- **`CommentRepository.create` retorna `CommentWithAuthor`, não a entidade `Comment` crua.** `req.user` (populado pelo middleware `authenticate`) só carrega `{id, email}` — sem `name` —, então o controller não tinha como montar `author.name` na resposta de `POST .../comments` sem uma consulta adicional. Resolvido fazendo o próprio adapter TypeORM buscar o comentário recém-criado com a relação `author` populada (`relations: { author: true }`) e devolver o formato já achatado `CommentWithAuthor`, igual ao que `findAllByCardWithAuthor` já devolve — um único formato de retorno em todo o repositório, sem exigir uma segunda chamada do controller.
- **`ListsService` e `CardsService` ganharam `CommentRepository` como dependência nova nos construtores**, exatamente como o plano previu (§2.3, §6) — os três arquivos de teste que os constroem diretamente (`cards.service.test.ts`, `lists.service.test.ts`, `lists-cards-cascade.test.ts`) precisaram de um `FakeCommentRepository` novo, com um teste explícito confirmando a chamada de `deleteAllByCards` na exclusão de card (critério 13) e outro confirmando o mesmo na exclusão de lista (extensão de RN-09 pela cascata lista→card já estabelecida em RF05, não é ela própria um critério numerado de RF09). **Correção registrada na validação (`RF09-validation.md`, divergência 1):** o critério 14 (exclusão de *quadro*) continua não coberto por teste unitário — `BoardsService.remove` nunca ganhou `CommentRepository` nem cascateia nenhum recurso filho explicitamente, em nenhuma fase deste projeto desde RF02; a nota anterior aqui, que dizia "critérios 13 e 14" cobertos, estava incorreta.
- `relations` do TypeORM precisou da forma de objeto (`{ author: true }`), não array (`["author"]"]`) — a versão instalada do TypeORM rejeita a forma antiga em tempo de compilação.
- Nenhuma dependência nova instalada; nenhuma rota de edição/exclusão de comentário criada, como o plano previu.
