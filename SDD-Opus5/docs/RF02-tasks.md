# RF02 — Tarefas de implementação

**Base:** `docs/RF02-spec.md` e `docs/RF02-plan.md` (herda `docs/RF01-plan.md`).

Cada tarefa entrega uma parte funcional e verificável isoladamente, na ordem de dependência: domínio e dados, API, front-end, testes e conferência.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes unitários são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Paleta, schemas de quadro e código de erro
- `domain/boardColors.ts`: chaves `navy`, `blue`, `green`, `amber`, `purple`, nessa ordem, e cor padrão `navy` — D12, D17.
- `schemas/board.schemas.ts`: criação (`name`, `color`, `withDefaultLists` padrão `true`), edição (`name`, `color` obrigatórios), descarte de campos extras, validação de UUID do parâmetro — RN04, RN06, CB01–CB10, C31, C32, C36.
- Código `BOARD_NOT_FOUND` → `404` com "Quadro não encontrado." e mensagens de campo de A28 — A27.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T02 — Entidades e migration de `boards`, `lists` e `cards`
- Entidades `Board`, `BoardList`, `Card` com o núcleo mínimo — D8.
- Migration reversível com FKs (`RESTRICT` para `users`, `CASCADE` para `lists` e `cards`), `CHECK` de nome, cor e posição, e índices — 3.1–3.3, D9–D11, D16, C34, C43.
- Registro no `DataSource`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T03 — Repositório de quadros
- Interface `BoardRepository` com escopo de acesso obrigatório em todo método — F9, C27.
- Listagem em uma consulta com contagens agregadas e ordem `created_at DESC, id DESC` — N23, C35.
- Detalhe em no máximo duas consultas — N24.
- Criação do quadro com listas em transação — F12, C33.
- `UPDATE` e `DELETE` escopados em instrução única, retornando linhas afetadas — A24, A25.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T04 — Serviço de quadros
- Ponto único de autorização (`scopeFor`) — F10, C29.
- Listas padrão "A fazer", "Em progresso", "Concluído" nas posições 0, 1, 2 — RN07, D14.
- `BOARD_NOT_FOUND` uniforme para inexistente e de outra conta — F11, C28.
- Serviço sem Express e sem TypeORM — C13.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T05 — Controller, rotas e integração na aplicação
- `BoardController` lendo o dono de `req.user` — C30.
- `board.routes.ts` com `authenticate` em todas as rotas, validação de `:boardId` antes do banco — C26, N30.
- `GET /api/boards`, `POST /api/boards`, `GET/PUT/DELETE /api/boards/:boardId` — seção 4.
- Integração em `app.ts` e `routes/index.ts`.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T06 — Testes unitários do back-end
- Schemas de quadro, paleta, `BoardService` com repositório em memória que reproduz escopo, cascata e atomicidade, middleware de parâmetro, mapeamento de `BOARD_NOT_FOUND`.
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T07 — Base do front-end para quadros
- `lib/boardColors.ts` (chave, rótulo, cor exibida), `lib/plural.ts`, mensagens novas — D17, T2, spec 5.4.
- `schemas/board.ts` espelhando as regras da API.
- `services/boardService.ts` e código `BOARD_NOT_FOUND` em `lib/api.ts` — F14.
- `lib/boardsState.ts`: funções puras de atualização da listagem e do resultado da exclusão (`404` como sucesso) — F15, C37, C38.
- `components/Modal.tsx` sobre `<dialog>` — T1, F17, N38, C40.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T08 — Listagem "Meus quadros" com criação, edição e exclusão
- `BoardsView` com estados de carregamento, erro com nova tentativa, vazio e lista — N42, CE01, CA05.
- `BoardCard`, `NewBoardCard`, `ColorPicker`, `BoardFormDialog` (criar/editar), `DeleteBoardDialog` — F16, F18, N39–N41, C39.
- Navegação para o quadro criado; atualização local após editar e excluir; `404` na edição remove o cartão com aviso — spec 2.1–2.5, CB11.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T09 — Página do quadro
- Rota `/boards/[boardId]` com `params` assíncrono — A30.
- `BoardHeader` com link "Quadros", nome e edição; listas na ordem; área vazia sem listas — spec 2.3, CA18–CA20, CA25.
- `BoardNotFound` para `404` ao abrir ou ao editar — CA21, CA22, CB14.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T10 — Testes unitários do front-end
- Schemas de quadro, pluralização e textos de contagem e confirmação, funções de estado da listagem, resultado da exclusão, paridade da paleta com o back-end e com a migration — C42.
- **Pronto quando:** testes compilam com `tsc` e `npm run build` passa. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T11 — Conferência final
- `tsc` e `npm run build` nos dois projetos.
- Revisão de C25–C43 e da rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Paleta, schemas e código de erro | concluída | `tsc` |
| T02 — Entidades e migration | concluída | `tsc`, `npm run build` |
| T03 — Repositório de quadros | concluída | `tsc`, `npm run build` |
| T04 — Serviço de quadros | concluída | `tsc`, `npm run build` |
| T05 — Controller, rotas e integração | concluída | `tsc`, `npm run build` |
| T06 — Testes unitários do back-end | concluída (não executados) | `tsc` |
| T07 — Base do front-end | concluída | `tsc`, `npm run build` |
| T08 — Listagem com criação, edição e exclusão | concluída | `tsc`, `npm run build` |
| T09 — Página do quadro | concluída | `tsc`, `npm run build` |
| T10 — Testes unitários do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T11 — Conferência final | concluída | revisão de C25–C43 e da rastreabilidade do plano |

### Arquivos produzidos

**Back-end**

| Arquivo | Papel |
| --- | --- |
| `src/domain/boardColors.ts`, `src/domain/boards.ts` | paleta, listas padrão, tipos `BoardSummary` e `BoardDetail` |
| `src/schemas/board.schemas.ts` | validação de criação, edição e UUID |
| `src/middlewares/validateBoardId.ts` | `:boardId` malformado vira `BOARD_NOT_FOUND` antes do banco |
| `src/entities/Board.ts`, `BoardList.ts`, `Card.ts` | entidades |
| `src/migrations/1760000001000-CreateBoardsListsCards.ts` | tabelas, FKs com cascata, `CHECK`s e índices |
| `src/repositories/BoardRepository.ts` | interface com `BoardScope` obrigatório + implementação TypeORM |
| `src/services/BoardService.ts` | regras e ponto único de autorização (`scopeFor`) |
| `src/controllers/BoardController.ts`, `src/routes/board.routes.ts` | API `/api/boards` |
| alterados: `errors/AppError.ts`, `errors/messages.ts`, `middlewares/errorHandler.ts`, `config/data-source.ts`, `routes/index.ts`, `app.ts`, `main.ts` | integração |

**Front-end**

| Arquivo | Papel |
| --- | --- |
| `src/app/(app)/boards/page.tsx`, `BoardsView.tsx` | listagem "Meus quadros" |
| `src/app/(app)/boards/[boardId]/page.tsx`, `BoardView.tsx` | página do quadro |
| `src/components/Modal.tsx`, `src/components/LoadState.tsx` | janela sobre `<dialog>`, estados de carregamento e erro |
| `src/components/boards/*` | `BoardCard`, `NewBoardCard`, `BoardFormDialog`, `DeleteBoardDialog`, `ColorPicker`, `BoardHeader`, `BoardNotFound`, ícones |
| `src/services/boardService.ts`, `src/schemas/board.ts` | chamadas à API e validação no cliente |
| `src/lib/boardColors.ts`, `src/lib/plural.ts`, `src/lib/boardsState.ts` | paleta, textos com plural, atualização da listagem e resultado da exclusão |
| alterados: `lib/api.ts`, `lib/messages.ts` | código `BOARD_NOT_FOUND` e mensagens da spec 5.4 |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `board.schemas.test.ts` | CA09, CA10, CA12–CA14, CA24, CA27, CB01–CB10, RN01, RN04, RN06, RN08, A23, N30 |
| `boardColors.test.ts` | RN06, CA07, CB08, C42 (paleta igual ao `CHECK` da migration) |
| `BoardService.test.ts` | CA01–CA06, CA09–CA11, CA15, CA18, CA20–CA22, CA24, CA26, CA29, CA31, CA32, CA35, CB11, CB12, CB14, CE04, RN01–RN03, RN05, RN07–RN11, RN14, F12, A22, A26 |
| `validateBoardId.test.ts` | CA22, RN03, N30, A27 |
| `errorHandler.test.ts` (atualizado) | A27: `BOARD_NOT_FOUND` → `404` |
| `helpers/InMemoryBoardRepository.ts` | reproduz escopo por dono, transação da criação e cascata quadro → listas → cards |

**Front-end** (`front-end/src/**/__tests__/`, `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `schemas/__tests__/board.test.ts` | CA09, CA10, CA12–CA14, CA27, CB02–CB05, CB07, CB08, spec 5.4 |
| `lib/__tests__/plural.test.ts` | CA01, CA04, CA05, CA30, spec 5.4 |
| `lib/__tests__/boardsState.test.ts` | CA03, CA21, CA22, CA24, CA31, CA34, CB11, CE03, RN14, C37, C38 |
| `lib/__tests__/boardColors.test.ts` | CA07, N39, C42 (paleta igual à do back-end e à da migration) |
| `lib/__tests__/api.test.ts` (atualizado) | reconhecimento de `BOARD_NOT_FOUND` |

### Conferência contra o plano

| Restrição | Onde é atendida |
| --- | --- |
| C25 | nenhuma dependência instalada; `Modal` usa `<dialog>` |
| C26 | `router.use(authenticate(...))` em `board.routes.ts` |
| C27 | todos os métodos de `BoardRepository` recebem `BoardScope`; a consulta de listas faz `JOIN boards` com `owner_id` |
| C28 | `BoardService` e `validateBoardId` produzem o mesmo `AppError("BOARD_NOT_FOUND")` |
| C29 | `BoardService.scopeFor` |
| C30 | `BoardController` usa só `req.user.id`; `ownerId` ausente das representações |
| C31, C32 | `board.schemas.ts` + `CHECK`s da migration |
| C33 | `dataSource.transaction` em `createWithLists` |
| C34 | `DELETE` único + `ON DELETE CASCADE` em `lists` e `cards` |
| C35 | `SUMMARY_SELECT` com subconsultas de contagem, `ORDER BY created_at DESC, id DESC` |
| C36 | rota `PUT` com `parseUpdateBoardInput` |
| C37 | `deleteOutcome` trata `BOARD_NOT_FOUND` como excluído |
| C38 | `replaceBoard`/`removeBoard` com a resposta da API |
| C39 | `BoardFormDialog` com modos `create`/`edit` |
| C40 | `Modal`: Cancelar, botão de fechar, Esc (`onCancel`) e clique no fundo, bloqueados com `busy` |
| C41 | `useSubmitLock` nos dois diálogos |
| C42 | testes de paridade nos dois projetos |
| C43 | migration `1760000001000` com `up` e `down` |

### Decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| Contagem de caracteres do nome | Feita por ponto de código Unicode (`Array.from`), no back-end e no front-end | Coincide com `char_length()` do PostgreSQL; sem isso, 60 emojis seriam recusados pela aplicação e aceitos pelo banco (CB02, CB05). |
| Acesso a dados | Leituras com SQL parametrizado via `dataSource.query`; escritas via `QueryBuilder` e `manager.insert` | A listagem precisa de agregação em uma consulta (N23); o `QueryBuilder` informa as linhas afetadas usadas em A24 e A25. Todos os valores são parâmetros vinculados (N9). |
| Criação | Após a transação, o quadro é relido com `findDetail` | A resposta traz datas e contagens gerados pelo banco. |
| Criação na listagem | A janela fecha e o usuário vai para o quadro; a listagem é recarregada ao voltar | A spec manda levar o usuário ao quadro criado (CA09); CA11 é atendido pela recarga ao abrir a listagem (N27). |
| Edição pelo cabeçalho | Só nome e cor são mesclados no estado da página; as listas exibidas são mantidas | O `PUT` devolve `BoardSummary`, sem listas (A23), e a edição não altera conteúdo (CA26). |
| Quadro sem listas | Texto "Este quadro ainda não tem listas." | A spec pede área vazia sem erro; o texto evita uma tela em branco ambígua. |
| Título da aba | Página do quadro define `document.title` com o nome do quadro | N31; o nome só é conhecido depois do carregamento no cliente. |
| Foco ao fechar janela | `Modal` devolve o foco também quando é desmontado | Os diálogos são desmontados ao fechar, e N38 exige retorno do foco. |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test` nos dois projetos) e verificação ponta a ponta: não realizadas por restrição do `context.md`.
- A migration `1760000001000` roda automaticamente na próxima inicialização da API (`migrationsRun: true`).
- A validação da fase 4 do RF01 (`docs/RF01-validation.md`) foi interrompida e continua pendente.
