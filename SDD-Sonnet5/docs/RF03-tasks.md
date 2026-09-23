# RF03 — Tarefas de Implementação

Referência: `docs/RF03-spec.md`, `docs/RF03-plan.md`. Cada tarefa entrega uma parte funcional/testável de forma incremental.

Legenda de status: `pending` | `in_progress` | `done`

## Pré-requisito: reconstruir `auth` (RF01) e `boards` (RF02)

O repositório estava no estado de esqueleto inicial (ver `RF03-plan.md` §0) — nenhum código de RF01/RF02 existia. Estas tarefas reconstroem exatamente o que já havia sido especificado/planejado/validado nessas duas fases anteriores, como pré-condição para RF03.

| # | Tarefa | Status |
|---|---|---|
| P1 | Scaffolding do back-end: `config/env.ts`, `config/data-source.ts`, `src/shared/errors.ts`, `tsconfig.json` (tipos node/jest), `jest.config.js`, instalação de deps (bcrypt, zod, express-rate-limit, cookie-parser, jest, ts-jest) | done |
| P2 | Módulo `auth` completo (entidades, senha, tokens, schemas, erros, service, middleware, controller, rotas) + testes unitários | done |
| P3 | Módulo `boards` completo (entidade, erros, schemas, repositório, service, controller, rotas) + testes unitários | done |
| P4 | `app.ts`/`main.ts` — montagem de `auth` e `boards`; verificação `npm run build` e `npm test` | done |
| P5 | Front-end: `apiClient`, `AuthProvider`, `RequireAuth`, páginas `/cadastro`, `/login`, `/` (lista de quadros), `/quadros/[id]` (detalhe) | done |
| P6 | Verificação: `npm run build` e `npm run lint` do front-end | done |

## RF03 — módulo `lists`

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| L1 | Entidade `List` (TypeORM): `name`, `board_id` (FK `onDelete: CASCADE`), `position` inteiro | Plano §3.1 | done |
| L2 | `lists.errors.ts` (`ListNotFoundError`, 404) | Plano §4 | done |
| L3 | `lists.schemas.ts` (zod: criação só `name`; atualização `name?`/`position?`) + testes unitários | RN-02, critérios 2/3/11 | done |
| L4 | Interface `ListRepository` + adapter TypeORM: listar ordenada por `board_id`, buscar por `id+board_id`, criar/mover/excluir com recálculo transacional de `position` | Plano §2.1, §3.1, §5 | done |
| L5 | `lists.service` (create/list/rename-reorder/remove), dependente de `BoardRepository` (RF02) para checar posse do quadro antes de qualquer operação | Plano §2.1, RN-01 a RN-11 | done |
| L6 | Testes unitários de `lists.service` cobrindo os 21 critérios e as 11 RNs | Spec §3/§4 | done |
| L7 | `lists.controller` + testes unitários (chamada direta de função) | Plano §4 | done |
| L8 | `lists.routes` aninhadas em `/boards/:boardId/lists`, atrás de `authenticate`, montadas em `app.ts` | Plano §2.1, §4 | done |
| L9 | Verificação: `npm run build` e `npm test` sem erros | qualidade | done |

## Front-end

| # | Tarefa | Cobre | Status |
|---|---|---|---|
| F1 | `lib/lists/api.ts` — funções finas sobre `apiClient` (criar/listar/renomear-mover/excluir) | Plano §2.2 | done |
| F2 | Página `/quadros/[id]` passa a exibir as listas do quadro, com criação, renomeação, reordenação (botões ←/→) e exclusão | critérios 1–21 | done |
| F3 | Verificação: `npm run build` e `npm run lint` do front-end | qualidade | done |

## Validação final

| # | Tarefa | Status |
|---|---|---|
| V1 | Revisão cruzada: código vs. spec vs. plano (RNs e critérios de aceite) | done — os 21 critérios e as 11 RNs têm implementação e teste rastreáveis; RN-06/RN-05 verificadas separadamente (quadro inacessível → `board_not_found`; lista inacessível dentro de quadro válido → `list_not_found`, nunca confundidos) |
| V2 | Suíte de testes unitários executada (`npm test` no back-end) — `auth` + `boards` + `lists` | done — 125/125 testes passando (13 suítes: 5 de `auth`, 4 de `boards`, 4 de `lists`) |

## Notas de implementação

- **Reconstrução completa exigida.** O ambiente reiniciou entre as fases PLAN e IMPLEMENT (ver nota em `RF03-plan.md` §0): nada de RF01/RF02 existia em código. Esta fase reconstruiu os três módulos (`auth`, `boards`, `lists`) do zero, seguindo exatamente as decisões já registradas em `RF01-plan.md`/`RF02-plan.md`/`RF03-plan.md` — nenhuma arquitetura nova foi inventada.
- **Rotas aninhadas com `mergeParams`.** `lists.routes.ts` usa `Router({ mergeParams: true })`, montado em `app.ts` como `app.use("/boards/:boardId/lists", ...)`, **antes** do mount mais genérico `app.use("/boards", ...)`. Isso é necessário para que o router de listas enxergue `req.params.boardId` vindo do path do mount pai — sem `mergeParams`, um sub-router do Express não herda os parâmetros do caminho de montagem.
- **Posição validada em duas camadas.** Limite inferior (`position >= 0`, tipo/inteiro) é validado estruturalmente pelo schema `zod` no controller, antes de qualquer acesso a banco. Limite superior (`position <= total de listas do quadro - 1`) só pode ser conhecido em tempo de execução (depende de quantas listas o quadro tem *agora*), então é validado em `lists.service`, reaproveitando a classe `ValidationError` compartilhada em vez de criar um novo tipo de erro só para isso — mesma família de resposta (`400 validation_error`) que o schema já produz.
- **Reindexação transacional confirmada por teste.** `TypeOrmListRepository` recalcula `position` de todas as listas afetadas de um quadro dentro de `manager.transaction(...)` em criar, mover e excluir. O equivalente em memória (`FakeListRepository`) replica exatamente essa lógica de reindexação nos testes de `lists.service`, incluindo uma asserção explícita de que as posições permanecem contíguas (`[0, 1, 2, ...]`) depois de mover uma lista (RN-07).
