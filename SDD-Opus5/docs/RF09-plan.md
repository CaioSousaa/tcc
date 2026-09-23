# RF09 — Plano técnico

**Base:** `docs/RF09-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 ao RF08 (C01–C212).
Este plano acrescenta C213–C242 e altera explicitamente as representações de card (3.4) e a matriz de permissões do RF07 (2.2, F119).

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF09 |
| --- | --- | --- |
| Banco | PostgreSQL | tabela `card_comments`, cascata a partir de `cards`, agregação da quantidade por card |
| ORM | TypeORM | migration e transações pelo bloqueio de card existente |
| API | Express 5 + TypeScript | rotas `/api/boards/:boardId/cards/:cardId/comments` |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | seção "Comentários" na janela do card e indicador na face |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T14.** A formatação do momento (2.2 da spec) é uma função pura com a tabela fixa de meses em português. Nenhuma biblioteca de datas (date-fns, dayjs, moment), e nenhum uso de `Intl.DateTimeFormat` para o texto curto, porque a abreviação de mês varia entre ambientes ("set." × "set").
- **T15.** O texto é exibido como texto React com `white-space: pre-wrap`. Nenhuma biblioteca de markdown, de sanitização de HTML ou de detecção de links (RN03, CB03).

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador  BoardView
  ├── ListColumn → CardFace (+ indicador de comentários a partir de commentCount)
  └── CardDialog (GET do card já traz comments)
        └── CommentsSection ─ CommentItem / CommentEditForm / CommentComposer / DeleteCommentDialog
              lib/comments.ts, lib/commentTime.ts (funções puras)
              commentService → /api/boards/:boardId/cards/:cardId/comments[/:commentId]

API
  comment.routes → CommentController → CommentService
     → runInCardLock (participação + papel + card bloqueado)
     → CommentTransaction (primitivas no card bloqueado)
```

### 2.2 Regras de fronteira obrigatórias

- **F118.** Publicar, editar e excluir rodam em `runInCardLock` (RF06 F63, RF07 F79), com participação e papel lidos no bloqueio. O bloqueio do card serializa o limite de 500 (RN08, CB13) e as edições concorrentes (CB10).
- **F119.** A matriz de permissões do RF07 (`domain/permissions.ts` e `lib/permissions.ts`) ganha a ação **`comments.moderate`**: Administrador `true`, Membro `false`. Ela significa "excluir comentário de outra pessoa".
  - `comments.write` (existente, os dois papéis) cobre ler o formulário, publicar e editar ou excluir os próprios comentários.
  - As duas tabelas de testes da matriz (RF07 N156) devem ser atualizadas juntas.
- **F120.** A regra de autoria é verificada no serviço, depois de carregar o comentário, porque depende do recurso:
  - **editar:** `assertCan(role, "comments.write")` **e** `comment.authorId === userId`; caso contrário, `FORBIDDEN`. Nenhum papel edita comentário alheio (RN05, CA17);
  - **excluir:** `assertCan(role, "comments.write")` **e** (`comment.authorId === userId` **ou** `can(role, "comments.moderate")`); caso contrário, `FORBIDDEN` (CA22).
- **F121.** Ordem de avaliação:
  1. sessão;
  2. `boardId`;
  3. corpo;
  4. participação (`BOARD_NOT_FOUND`);
  5. card (`CARD_NOT_FOUND`);
  6. `assertCan(role, "comments.write")`;
  7. comentário do card (`COMMENT_NOT_FOUND`);
  8. autoria ou moderação (`FORBIDDEN`);
  9. estado (`COMMENT_LIMIT_REACHED`).

  Não participante nunca recebe `FORBIDDEN` (RF07 C178). Um participante pode receber `FORBIDDEN` sobre um comentário que ele já consegue ler, o que não revela nada novo.
- **F122.** Autor e momento vêm **somente** da sessão e do banco (`author_id` = `req.user.id`, `created_at` padrão do banco). O schema descarta qualquer outro campo (RN02, CB05).
- **F123.** A remoção de comentários é sempre por cascata a partir de `cards` (excluir card, lista em cascata ou quadro). Remover participante **não** toca `card_comments` (RN09, RF07 F83 não se aplica aqui).
- **F124.** Toda resposta de escrita traz o **histórico completo** do card (CB09, CA30), como a checklist (RF06 C128).

### 2.3 Back-end: componentes

```
back-end/src/
  domain/comments.ts                   COMMENT_BODY_MAX = 2000, COMMENTS_MAX = 500,
                                       normalizeCommentBody, CommentView
  domain/permissions.ts                alterado: ação "comments.moderate" (F119)
  migrations/1760000008000-CreateCardComments.ts
  entities/CardComment.ts
  repositories/comments.ts             loadComments(db, cardId)
  repositories/CommentRepository.ts    CommentTransaction (primitivas) + withCardLock + leitura escopada
  repositories/listsWithCards.ts       alterado: commentCount na instrução de cards
  repositories/BoardCardRepository.ts  alterado: CardDetail.comments
  services/CommentService.ts           listar, publicar, editar, excluir
  schemas/comment.schemas.ts
  controllers/CommentController.ts
  routes/comment.routes.ts             montado em card.routes: /:cardId/comments
  errors/*, middlewares/errorHandler   novos códigos (A67)
```

Primitivas de `CommentTransaction`, restritas ao card bloqueado e sem regras:

| Primitiva | Efeito |
| --- | --- |
| `count()` | comentários do card |
| `findComment(commentId)` | `{ id, authorId, body }` do comentário **deste card** ou `null` |
| `insert({ id, authorId, body })` | `created_at` definido pelo banco |
| `updateBody(commentId, body)` | grava o texto e `edited_at = now()` |
| `delete(commentId)` | remove o comentário deste card |
| `listComments()` | histórico completo na ordem de D43, com o nome do autor |

- **F125.** `CommentService` contém RN03, RN05, RN06 e RN08; primitivas não contêm regras (padrão de RF06 F65, RF08 F103).

### 2.4 Algoritmos

**Publicar (RN02, RN03, RN08, CB13):** dentro de `runInCardLock`:
1. `assertCan(role, "comments.write")`.
2. `count() >= 500` → `COMMENT_LIMIT_REACHED`.
3. `insert({ id, authorId: userId, body })`.
4. Responder com o comentário criado e `listComments()`.

**Editar (RN06, CA14, CA15, CB10, CB12):**
1. `assertCan(role, "comments.write")`.
2. `commentId` malformado ou `findComment` ausente → `COMMENT_NOT_FOUND`.
3. `authorId !== userId` → `FORBIDDEN`.
4. Se `body` normalizado **igual** ao atual: nenhuma escrita (não marca editado). Senão: `updateBody`.
5. Responder com o comentário e `listComments()`.

**Excluir (RN07, CB11):**
1. `assertCan(role, "comments.write")`.
2. `commentId` malformado ou `findComment` ausente → `COMMENT_NOT_FOUND`.
3. `authorId !== userId` e `!can(role, "comments.moderate")` → `FORBIDDEN`.
4. `delete`.
5. Responder com `listComments()`.

**Listar:** leitura sem bloqueio, escopada por participação e card, como `findCard` do RF04. Responde com `listComments()`.

### 2.5 Front-end: componentes

```
front-end/src/
  lib/commentTime.ts                   formatCommentMoment(iso, now), fullCommentMoment(iso)
  lib/comments.ts                      normalizeCommentBody, canEditComment, canDeleteComment,
                                       commentCountLabel, withCardCommentCount, commentFailureAction
  schemas/comment.ts                   validação do texto (RN03)
  services/commentService.ts           list, create, update, remove
  components/comments/
    CommentsSection.tsx                histórico + composição; estado local do histórico
    CommentItem.tsx                    avatar, nome, momento, "(editado)", texto, ações
    CommentEditForm.tsx                edição em linha
    CommentComposer.tsx                avatar da conta, textarea, "Comentar"
    DeleteCommentDialog.tsx
  components/icons: ícone de comentário
  alterados: CardDialog, CardFace, ListColumn (repasse), BoardView, services/boardService, services/cardService
```

Regras de fronteira obrigatórias:

- **F126.** `CommentsSection` recebe `initialComments` de `CardDetail.comments`, `currentUserId` (sessão do `AuthContext`) e `myRole` (`BoardDetail.myRole`). Cada resposta substitui o histórico local inteiro (F124). Não há atualização otimista.
- **F127.** A visibilidade das ações é decidida por funções puras:
  - `canEditComment(comment, currentUserId)`: autor igual à conta atual;
  - `canDeleteComment(comment, currentUserId, myRole)`: autor igual à conta atual **ou** `can(myRole, "comments.moderate")`.

  Elas só ocultam controles; o servidor decide (RF07 F88).
- **F128.** `withCardCommentCount(board, cardId, count)` atualiza a face com `comments.length` da resposta, após publicar e excluir (2.7, RN10). A edição não altera a quantidade.
- **F129.** `formatCommentMoment(iso, now)` implementa a tabela de 2.2:
  - compara dias do calendário **locais** (ano, mês e dia de `Date` no fuso do dispositivo), e não diferenças de 24 horas;
  - "ontem" é o dia de calendário anterior ao de `now`, inclusive na virada de mês e de ano.

  `fullCommentMoment(iso)` produz "DD/MM/AAAA às HH:MM". O momento é renderizado em `<time dateTime={iso} title={completo}>`, com o texto completo acessível (N189). `now` é lido uma vez por renderização da seção (2.2, último parágrafo).
- **F130.** O texto é renderizado **somente** como filho de texto React, com `whitespace-pre-wrap` e `[overflow-wrap:anywhere]`. É proibido `dangerouslySetInnerHTML` ou qualquer transformação em links (RN03, CB03, CB04, N186).
- **F131.** `CommentComposer`:
  - usa `useSubmitLock` (RF02), com o botão desabilitado durante o envio (CA13);
  - Ctrl+Enter ou Cmd+Enter envia, e Enter insere quebra de linha (CA07);
  - o texto só é limpo depois do sucesso (CE01);
  - o foco permanece no campo;
  - o comentário publicado é levado à área visível com `scrollIntoView({ block: "nearest" })`.
- **F132.** `CommentEditForm`:
  - apenas uma edição por vez, com o id em edição guardado em `CommentsSection`;
  - Esc cancela só a edição, com `preventDefault` e `stopPropagation`, sem fechar a janela do card (CA16, como RF06 C136);
  - Ctrl+Enter ou Cmd+Enter salva.
- **F133.** `commentFailureAction(operation, error)` define o tratamento de falhas:

| Código | Operação | Ação |
| --- | --- | --- |
| `BOARD_NOT_FOUND` | qualquer | página "Quadro não encontrado." (CB15) |
| `CARD_NOT_FOUND` | qualquer | fecha a janela do card e recarrega o quadro (CA31) |
| `FORBIDDEN` | editar, excluir | mensagem na seção ou confirmação, recarrega o quadro para atualizar `myRole` e recarrega o histórico (CB14) |
| `COMMENT_NOT_FOUND` | excluir | sucesso: fecha a confirmação e recarrega o histórico (CB11) |
| `COMMENT_NOT_FOUND` | editar | fecha a edição, mensagem na seção e recarrega o histórico (CA29, CB12) |
| `VALIDATION_ERROR`, `COMMENT_LIMIT_REACHED` | publicar, editar | mensagem junto ao campo, texto mantido (CA08, CA09, CA32) |
| outros | publicar, editar | mensagem junto ao campo, texto mantido (CE01, CE02) |
| outros | excluir | mensagem na confirmação (CE03) |

- **F134.** A seção fica **fora** do `<form>` do card, como a checklist (RF06), para não haver formulários aninhados nem envio pelo "Salvar card" (CA12). O rascunho do composer é estado local descartado ao desmontar a janela (CA11).

---

## 3. Modelo de dados e schema

### 3.1 Tabela `card_comments`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `card_id` | `uuid` | `NOT NULL`, FK → `cards.id` `ON DELETE CASCADE` |
| `author_id` | `uuid` | `NOT NULL`, FK → `users.id` `ON DELETE RESTRICT` |
| `body` | `varchar(2000)` | `NOT NULL`, `CHECK (char_length(body) BETWEEN 1 AND 2000)`, já normalizado |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT clock_timestamp()` |
| `edited_at` | `timestamptz` | `NULL`: não editado |

Índice `IDX_card_comments_card_order` em `(card_id, created_at, id)`: ordem, contagem e cascata.

### 3.2 Migration `CreateCardComments`

- **D42.** Um único arquivo `1760000008000-CreateCardComments`, registrado no `DataSource` depois de `1760000007000`. Cria a tabela, as restrições e o índice, e é reversível (`DROP TABLE`). Nenhuma migração de dados.

### 3.3 Restrições de modelagem

- **D43.** Ordem do histórico: `created_at, id`. `clock_timestamp()` evita empates entre comentários da mesma transação, e `id` desempata o resto de forma estável (RN04).
- **D44.** "Editado" é `edited_at IS NOT NULL`. A marca só é gravada quando o texto muda (RN06) e nunca volta a `NULL`. `created_at` nunca é atualizado.
- **D45.** `author_id` não referencia `board_members`: o comentário sobrevive à saída do autor (RN09, CA26). O nome é lido de `users` na leitura. Nomes de conta não mudam (RF01).
- **D46.** A quantidade **não é armazenada**: é `count(*)` por `card_id` na leitura, como as contagens da checklist (RF06 F68). Assim, nunca diverge (RN10).
- **D47.** `body` guarda o texto normalizado com `\n` como única quebra de linha (2.4). A contagem de 2.000 é por pontos de código no serviço e por `char_length` no banco, que coincidem para texto normalizado (RF04 D24).

### 3.4 Alterações em representações existentes

| Anterior | Nova regra |
| --- | --- |
| RF08 `CardSummary` | Ganha `commentCount: number`, agregado na **mesma** instrução de cards de `loadListsWithCards` |
| RF08 `CardDetail` | Ganha `comments: CommentView[]` (ordem de D43) |
| RF07 matriz RN05 | Ganha `comments.moderate` (F119) |

A quantidade de instruções do quadro aberto (RF08 C193, até cinco) não muda.

---

## 4. Interfaces: API e contratos

### 4.1 Representação `CommentView`

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | `string` (uuid) | |
| `author` | `{ userId: string, name: string }` | nome da conta, mesmo que ela não participe mais (D45) |
| `body` | `string` | normalizado |
| `createdAt` | `string` (ISO 8601, UTC) | momento da publicação; formatado no cliente (F129) |
| `edited` | `boolean` | `edited_at IS NOT NULL` |

- **A64.** A representação não traz `canEdit` nem `canDelete`: as permissões dependem da sessão e do papel, que o cliente já tem (F127), e o servidor decide em cada escrita (F120). O e-mail do autor não é exposto.

### 4.2 Rotas

Base: `/api/boards/:boardId/cards/:cardId/comments`, depois de `authenticate` e `validateBoardId`.

| Rota | Permissão | Corpo | Sucesso |
| --- | --- | --- | --- |
| `GET /` | participante | — | `200` `{ comments: CommentView[] }` |
| `POST /` | `comments.write` | `{ body }` | `201` `{ comment: CommentView, comments: CommentView[] }` |
| `PATCH /:commentId` | `comments.write` + autoria | `{ body }` | `200` `{ comment: CommentView, comments: CommentView[] }` |
| `DELETE /:commentId` | `comments.write` + (autoria ou `comments.moderate`) | — | `200` `{ comments: CommentView[] }` |

- **A65.** `DELETE` de comentário inexistente responde `404 COMMENT_NOT_FOUND`, e o front-end trata como sucesso (CB11), como RF07 A54 e RF08 A60.
- **A66.** O `GET` existe para recarregar só o histórico após falhas (F133), sem recarregar o card inteiro.

### 4.3 Alterações de contratos existentes

- `GET /api/boards/:boardId` e respostas com `ListWithCards`: cada `CardSummary.commentCount`.
- `GET` e `PATCH` do card: `CardDetail.comments`.

### 4.4 Validação

| Campo | Regra | Mensagem |
| --- | --- | --- |
| `body` | ausente, não texto, ou vazio após 2.4 | "Campo obrigatório." |
| `body` | mais de 2.000 pontos de código após 2.4 | "O comentário deve ter no máximo 2000 caracteres." |

`cardId` e `commentId` malformados não são erro de validação: respondem `CARD_NOT_FOUND` e `COMMENT_NOT_FOUND` nas etapas de F121 (CB06, CB07).

### 4.5 Erros

- **A67.** Novos códigos:

| Código | Status | Mensagem |
| --- | --- | --- |
| `COMMENT_NOT_FOUND` | 404 | "Comentário não encontrado." |
| `COMMENT_LIMIT_REACHED` | 409 | "O card pode ter no máximo 500 comentários." |

### 4.6 Front-end: `commentService`

| Função | Rota |
| --- | --- |
| `list(boardId, cardId)` | `GET` |
| `create(boardId, cardId, body)` | `POST` |
| `update(boardId, cardId, commentId, body)` | `PATCH` |
| `remove(boardId, cardId, commentId)` | `DELETE` |

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `GET` do card | < 150 ms | 500 comentários de 2.000 caracteres, 100 itens de checklist |
| Publicar, editar e excluir | < 100 ms | 500 comentários |
| `GET /api/boards/:boardId` | < 260 ms | 2.000 cards, 100.000 comentários, demais condições do RF08 |
| Renderizar o histórico | < 100 ms | 500 comentários |

- **N184.** `listComments()` e `loadComments` usam **uma** instrução: comentários do card com `JOIN users` e ordem de D43, sem consulta por comentário.
- **N185.** `commentCount` é agregado na instrução de cards de `loadListsWithCards` por subconsulta indexada em `card_id`, sem consulta por card (RF06 N112, RF08 N161).

### 5.2 Segurança

- **N186.** Texto de comentários e nomes de autor renderizados apenas como texto (F130). Nenhuma interpretação de HTML, markdown ou links (CB03).
- **N187.** Autor e momento nunca vêm do cliente (F122). Não há rota para alterar autor, momento ou marca de edição.
- **N188.** Toda leitura e escrita filtra pelo card resolvido dentro do quadro autorizado. Um comentário de outro card, mesmo do mesmo quadro, é `COMMENT_NOT_FOUND` (CA28). Corpo limitado pelo `express.json` existente (64 KB): 2.000 caracteres ocupam no máximo cerca de 8 KB em UTF-8.

### 5.3 Integridade e concorrência

- **N189.** Limite de 500 contado sob o bloqueio do card (F118). Duas publicações simultâneas no 499º nunca produzem 501 (CB13).
- **N190.** Edições concorrentes do mesmo comentário: a última prevalece sob o bloqueio do card (CB10).
- **N191.** Exclusão do card durante uma publicação: o bloqueio de linha do card faz uma das operações esperar; a outra termina com `CARD_NOT_FOUND` ou com o comentário removido por cascata. Nunca sobra comentário órfão (FK).
- **N192.** Rebaixamento concorrente com exclusão de comentário alheio: o papel é lido no bloqueio (RF07 F81); a ordem de processamento decide (CB14).

### 5.4 Interface e acessibilidade

- **N193.** O histórico é uma lista (`<ol>`), rotulada "Comentários". Cada item tem nome do autor em texto, o avatar decorativo e `<time>` com `dateTime` e `title` completos. O texto completo do momento também fica disponível para tecnologias assistivas.
- **N194.** A área de texto do composer tem rótulo acessível "Escreva um comentário". "Editar" e "Excluir" têm rótulos "Editar comentário de {autor}" e "Excluir comentário de {autor}".
- **N195.** O indicador da face é um `<span>` dentro do botão do card (RF06 N128), com o ícone decorativo e o nome acessível de 2.7.
- **N196.** O layout segue `prototipo/modais/detalhe-card.png`: avatar à esquerda, nome em negrito com o momento em cinza ao lado, texto abaixo, e o composer com avatar, área de texto e "Comentar" embaixo. O indicador da face segue `prototipo/paginas/quadro.png`.

### 5.5 Testabilidade

- **N197.** Funções puras testadas:
  - **back-end:** `normalizeCommentBody` e o schema de comentário;
  - **front-end:** `formatCommentMoment` com datas construídas por componentes locais, independentes do fuso da máquina (hoje, ontem, viradas de mês e de ano, mesmo ano e outro ano), `fullCommentMoment`, `canEditComment`, `canDeleteComment`, `commentCountLabel`, `withCardCommentCount`, `commentFailureAction` e o schema.
- **N198.** Serviço testado com repositório em memória no store compartilhado: bloqueio por card, cascata a partir de card, lista e quadro, e preservação ao remover participante. Casos obrigatórios:
  - autoria em editar;
  - moderação em excluir;
  - Membro excluindo comentário alheio;
  - salvar sem mudança não marca editado;
  - limite concorrente;
  - ordem `BOARD_NOT_FOUND` → `CARD_NOT_FOUND` → `COMMENT_NOT_FOUND` → `FORBIDDEN`;
  - comentário de outro card.
- **N199.** As tabelas de teste da matriz de permissões dos dois projetos ganham `comments.moderate` (F119).
- **N200.** Integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - `CHECK` de tamanho;
  - cascata por card;
  - comentário mantido após remover o autor do quadro;
  - ordem estável;
  - `commentCount` na instrução de cards;
  - limite concorrente;
  - reversão da migration.

  Os testes de integração existentes recebem a nova migration e um `undoLastMigration` a mais nos testes de reversão.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C213 | Nenhuma dependência nova; formatação de momento por função pura com meses fixos |
| C214 | Tabela `card_comments` de 3.1, com `CHECK`, FKs, índice e cascata por card; migration reversível |
| C215 | Publicar, editar e excluir em `runInCardLock`, com papel lido no bloqueio |
| C216 | Ação `comments.moderate` (só Administrador) nos dois projetos, com testes da matriz atualizados |
| C217 | Editar só pelo autor; excluir pelo autor ou com `comments.moderate` |
| C218 | Ordem de avaliação de F121 |
| C219 | Autor da sessão e momento do banco; nenhum campo do cliente além de `body` |
| C220 | Texto normalizado (CR LF/CR → LF, extremidades removidas) com 1 a 2.000 pontos de código |
| C221 | Salvar sem mudança não escreve e não marca editado; `edited_at` nunca volta a `NULL` |
| C222 | Limite de 500 sob bloqueio (`409 COMMENT_LIMIT_REACHED`) |
| C223 | Comentário de outro card, inexistente ou com id malformado → `404 COMMENT_NOT_FOUND` |
| C224 | Ordem `created_at, id`; `created_at` com `clock_timestamp()` e nunca alterado |
| C225 | Comentários removidos só por cascata de `cards`; remover participante não os afeta |
| C226 | Quantidade nunca armazenada; `commentCount` agregado na instrução de cards |
| C227 | `CardSummary.commentCount` e `CardDetail.comments`; quadro aberto sem instruções extras |
| C228 | Toda escrita responde com o histórico completo; `GET` do histórico para recargas |
| C229 | `CommentView` sem e-mail do autor e sem flags de permissão |
| C230 | Novos códigos de A67 com as mensagens da spec |
| C231 | Visibilidade de ações por `canEditComment` e `canDeleteComment` |
| C232 | Face atualizada por `withCardCommentCount` após publicar e excluir |
| C233 | Momento por `formatCommentMoment` em dias de calendário locais; completo em `<time title>` |
| C234 | Texto só como texto React com `pre-wrap` e quebra de palavras; sem `dangerouslySetInnerHTML` nem links |
| C235 | Composer com bloqueio de envio repetido, Ctrl/Cmd+Enter, texto limpo só no sucesso e rolagem até o novo comentário |
| C236 | Edição única por vez; Esc cancela só a edição |
| C237 | Falhas tratadas pela tabela de F133 |
| C238 | Seção fora do formulário do card; rascunho descartado ao fechar |
| C239 | Sem atualização otimista |
| C240 | Acessibilidade conforme N193–N195 |
| C241 | Limite concorrente, edições concorrentes e exclusão do card serializados pelo bloqueio do card |
| C242 | Testes: funções puras nos dois projetos, serviço em memória com autoria e concorrência, matriz atualizada, integração condicionada |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA05 | `CardDetail.comments` na ordem de D43 (C224) + `pre-wrap` (C234) + momento (C233) |
| CA02, CA03, CA23 | `commentCount` (C226, C227) + indicador da face (N195) |
| CA04 | `formatCommentMoment` (C233) |
| CA06, CA07, CA13 | algoritmo de publicar, composer (C235), `withCardCommentCount` (C232) |
| CA08, CA09, CA18 | schema (4.4), normalização (C220) |
| CA10 | `comments.write` para os dois papéis (F119) |
| CA11, CA12 | seção fora do formulário, estado local (C238) |
| CA14–CA16 | algoritmo de editar (C221), edição em linha (C236) |
| CA17, CA22 | autoria e moderação (C217) + ocultação (C231) |
| CA19–CA21 | algoritmo de excluir, `DeleteCommentDialog`, moderação (C216) |
| CA24, CA25 | cascata só por `cards` (C225) |
| CA26 | `author_id` sem vínculo com participação (D45) + `canDeleteComment` |
| CA27 | participação no bloqueio do card (C215, C218) |
| CA28 | `findComment` restrito ao card (C223) |
| CA29, CA31 | tabela de falhas (C237) |
| CA30 | histórico completo nas respostas (C228) |
| CA32 | limite sob bloqueio (C222) |
| CA33 | `authenticate` + interceptador do RF01 |
| CB01–CB08 | schema, normalização, ids malformados de F121, F122 |
| CB09–CB16 | bloqueio do card, histórico completo, `COMMENT_NOT_FOUND` como sucesso na exclusão, papel lido no bloqueio |
| CE01–CE04 | texto mantido até o sucesso, sem otimismo, envelope de erro |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Histórico dentro de `CardDetail` | Carrega até 500 comentários a cada abertura do card, ou cerca de 1 MB no pior caso. Aceito pela spec (sem paginação, 6). Dispensa uma segunda requisição e mantém um único estado de carregamento (2.1). |
| Nova ação `comments.moderate` | Altera a matriz do RF07, mas evita comparar papéis no serviço (RF07 F78). O custo é atualizar as duas tabelas de teste (N199). |
| `FORBIDDEN` após `COMMENT_NOT_FOUND` | A autoria só é conhecida depois de ler o comentário. Como apenas participantes chegam a essa etapa, e eles já leem o histórico, nada é revelado. |
| Formatação no cliente | "Hoje" depende do fuso do dispositivo, como pede 2.2. O servidor envia sempre UTC. Testes usam datas locais para não depender do fuso da máquina. |
| Envio repetido | Evitado pelo bloqueio de envio no cliente (C235). Sem chave de idempotência no servidor: duas requisições deliberadas publicam dois comentários, o que é aceito pela spec. |
| Autor que saiu do quadro | O comentário mantém `author_id` e o nome; `ON DELETE RESTRICT` em `users` é seguro porque contas não são excluídas (RF01). |
| Tela desatualizada | Sem tempo real (CB09). Respostas com o histórico completo e `GET` nas recargas limitam a defasagem à próxima ação. |
